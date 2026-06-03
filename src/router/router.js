/**
 * Módulo de Enrutamiento principal (router.js)
 * Controlador estilo SPA (Single Page Application) basado en el "hash" de la URL.
 * Se encarga de procesar la URL, validar el acceso del usuario, y cargar dinámicamente
 * el HTML de las vistas ("views") junto con la ejecución de sus controladores JS.
 */

// Importa el árbol de rutas configuradas para toda la aplicación
import { routes } from "./routers";

// Importa utilidades gráficas para el display de alertas en pantalla
import * as alerta from "../helpers/alertas";

// Importa utilidades de autenticación y autorización
import { isAuth, isAuthorize } from "../helpers/auth";

// Importa helper para consumir API
import * as api from "../helpers/api";

/**
 * Función principal del router SPA.
 * Procesa la URL actual y carga la vista correspondiente.
 * 
 * @param {HTMLElement} app - Contenedor principal donde se renderiza la vista.
 */
export const router = async (app) => {

    /**
     * Obtiene el hash de la URL.
     * Ejemplo:
     * #/voluntario/plan_familiar?familia_id=1
     * 
     * Resultado:
     * voluntario/plan_familiar?familia_id=1
     */
    const hash = location.hash.slice(1);

    /**
     * Divide la URL por "/"
     */
    let arregloHash = hash.split("/");

    /**
     * Extrae el último segmento para separar query params.
     */
    let residuo = arregloHash.pop();

    /**
     * Reconstruye el arreglo separando correctamente los query params.
     */
    arregloHash = [...arregloHash, ...residuo.split("?")];

    /**
     * Busca la ruta dentro del árbol de rutas.
     */
    const [ruta, parametros] = recorrerRutas(routes, arregloHash);

    /**
     * Si no encuentra la ruta:
     * - redirige al home
     * - muestra error 404
     */
    if (!ruta) {

        volverHome(hash);

        alerta.alertaMensaje(
            `Error 404: Página no encontrada. Serás redirigido a tu página de inicio.`
        );

        return;
    }

    /**
     * Extrae propiedades de seguridad desde la ruta.
     */
    const esPrivada = ruta.config?.private ?? false;
    const permissions = ruta.config?.permissions ?? [];

    // Redirección de usuarios autenticados que intentan acceder a páginas de autenticación pública
    // Sirve para: Prevenir que un usuario con sesión activa acceda a formularios de login, registro o recuperación de contraseña
    // Qué hace: Evalúa si la ruta no es privada (!esPrivada) y el usuario ya está autenticado (isAuth() es true). Si el segmento de la URL es una página pública de inicio, invoca a volverHome() para redirigir al panel correspondiente.
    // Por qué es importante: Protege la experiencia de navegación del usuario, impidiendo que rompa el flujo de trabajo activo de su sesión al navegar hacia atrás o escribir la URL manualmente
    if (!esPrivada && isAuth()) {
        const segmentoPrincipal = arregloHash[0] === "" ? (arregloHash[1] ?? "") : (arregloHash[0] ?? "");
        const paginasDeAutenticacion = ["", "login", "register", "forgotPassword", "verifyCode", "changePassword"];

        if (paginasDeAutenticacion.includes(segmentoPrincipal)) {
            await volverHome();
            return;
        }
    }

    /**
     * Verifica autenticación para rutas privadas.
     */
    if (esPrivada && !isAuth()) {

        alerta.alertaError(
            "Sesión inválida o expirada. Por favor inicie sesión."
        );

        window.location.hash = "#/login";

        return;
    }

    /**
     * Verifica permisos específicos.
     */
    if (!tienePermisos(permissions)) {

        limpiarLayout(app);

        app.innerHTML = `
            <h2>
                No tienes permisos para acceder a esta sección
            </h2>
        `;

        return;
    }

    // ========================================================
    // VALIDACIONES DE SEGURIDAD Y CONTROL DE RUTAS
    // ========================================================

    corregirQueryParams(hash);

    validarRol(hash);

    ocultarEditarUrl(hash);

    ocultarUrlFamilia(hash);

    // ========================================================

    /**
     * Carga el HTML de la vista si existe.
     */
    if (ruta.path) {

        await cargarVista(ruta.path, app);
    }

    /**
     * Controla visualización del botón back.
     */
    removerBotonHeader(arregloHash);

    /**
     * Ejecuta el controlador de la vista.
     */
    await ruta.controlador(parametros);
};

/**
 * Limpia completamente el layout principal.
 * 
 * @param {HTMLElement} app
 */
const limpiarLayout = (app) => {

    app.innerHTML = "";
};

/**
 * Corrige URLs mal construidas.
 * 
 * Ejemplo:
 * 
 * Incorrecto:
 * #/plan_familiar/datos/familia_id=1
 * 
 * Correcto:
 * #/plan_familiar/datos?familia_id=1
 * 
 * @param {string} hash
 * @returns {boolean}
 */
const corregirQueryParams = (hash) => {

    const segmentos = hash.split("/");

    const indice = segmentos.findIndex(segmento => {

        return segmento.includes("=") &&
               !segmento.includes("?");
    });

    if (indice !== -1) {

        const ruta = segmentos
            .slice(0, indice)
            .join("/");

        const params = segmentos
            .slice(indice)
            .join("&");

        const corregido = `${ruta}?${params}`;

        window.location.hash = `#${corregido}`;

        return true;
    }

    return false;
};

/**
 * Evita editar planes familiares ya finalizados.
 * 
 * @param {string} hash
 */
const ocultarEditarUrl = async (hash) => {

    const esSupervisor = hash.includes("supervisor/");
    const esVoluntario = hash.includes("voluntario/");

    const segmentos = hash.split("/");

    const tieneEditar = segmentos.some(segmento => {

        return segmento.split("?")[0] === "editar";
    });

    const estaEnPlan = hash.includes("plan_familiar/");

    if (!estaEnPlan || !tieneEditar) return;

    const queryString = hash.split("?")[1] || "";

    const params = new URLSearchParams(queryString);

    const familia_id = params.get("familia_id");

    if (!familia_id) return;

    const plan = await api.get(`familyPlans/${familia_id}`);

    if (
        plan.status_plan_id === 6 ||
        plan.status_plan_id === 7
    ) {

        if (esSupervisor) {

            window.location.hash =
                "#/supervisor/plan_familiar";

            alerta.alertaMensaje(
                `Este plan familiar ya fue aprobado o rechazado definitivamente y no se puede editar, te redirigiremos al listado de planes familiares`
            );

            return;
        }

        if (esVoluntario) {

            window.location.hash =
                "#/voluntario/plan_familiar";

            alerta.alertaMensaje(
                `Este plan familiar ya fue aprobado o rechazado definitivamente y no se puede editar, te redirigiremos al listado de planes familiares`
            );

            return;
        }
    }
};

/**
 * Evita acceso manual por URL según estado del plan.
 * 
 * @param {string} hash
 */
const ocultarUrlFamilia = async (hash) => {

    const esSupervisor = hash.includes("supervisor/");
    const esVoluntario = hash.includes("voluntario/");

    if (
        !hash.includes("familia_id") &&
        !hash.includes("plan_familiar/")
    ) {
        return;
    }

    const queryString = hash.includes("?")
        ? hash.split("?")[1]
        : "";

    const params = new URLSearchParams(queryString);

    const familiaId = params.get("familia_id");

    if (!familiaId) return;

    const plan = await api.get(`familyPlans/${familiaId}`);

    if (esVoluntario) {

        if (
            plan.status_plan_id === 4 ||
            plan.status_plan_id === 6 ||
            plan.status_plan_id === 7
        ) {

            window.location.hash =
                "#/voluntario/plan_familiar";

            alerta.alertaMensaje(
                `Este plan familiar ya fue enviado por voluntario y no se puede acceder directamente`
            );

            return;
        }
    }

    if (esSupervisor) {

        if (
            plan.status_plan_id === 1 ||
            plan.status_plan_id === 2 ||
            plan.status_plan_id === 3
        ) {

            window.location.hash =
                "#/supervisor/plan_familiar";

            alerta.alertaMensaje(
                `Este plan familiar aún no ha sido enviado por el voluntario, no se puede acceder directamente hasta que el voluntario lo envíe para revisión`
            );

            return;
        }
    }
};

/**
 * Redirecciona al home correspondiente según el rol.
 * 
 * @param {string} hash
 */
const volverHome = async () => {

    const roleId = parseInt(
        localStorage.getItem("role_id")
    );

    const homes = {
        1: "#/voluntario",
        2: "#/supervisor"
    };

    if (homes[roleId]) {

        window.location.hash = homes[roleId];
    }
};

/**
 * Verifica que el usuario acceda a su módulo permitido.
 * 
 * @param {string} hash
 * @returns {boolean}
 */
const validarRol = async (hash) => {

    const roleId = parseInt(
        localStorage.getItem("role_id")
    );

    const homes = {
        1: "#/voluntario",
        2: "#/supervisor"
    };

    const rolEnURL = [
        { segmento: "voluntario", roleId: 1 },
        { segmento: "supervisor", roleId: 2 },
        { segmento: "administrador", roleId: 2 }
    ];

    const rolEncontrado = rolEnURL.find(rol => {

        return hash.includes(rol.segmento);
    });

    if (
        rolEncontrado &&
        rolEncontrado.roleId !== roleId
    ) {

        window.location.hash = homes[roleId];

        alerta.alertaMensaje(
            `Esta página no está disponible para tu perfil. Te redirigimos a tu página de inicio.`
        );

        return false;
    }

    return true;
};

/**
 * Carga dinámicamente una vista HTML.
 * 
 * @param {string} path
 * @param {HTMLElement} elemento
 */
const cargarVista = async (path, elemento) => {

    console.log(path, elemento);

    const seccion = await fetch(`./src/views/${path}`);

    if (!seccion.ok) {

        throw new Error(
            "No pudimos leer el archivo"
        );
    }

    const html = await seccion.text();

    elemento.innerHTML = html;
};

/**
 * Verifica permisos del usuario.
 * 
 * @param {Array<string>} permisosRequeridos
 * @returns {boolean}
 */
const tienePermisos = (permisosRequeridos) => {

    if (
        !permisosRequeridos ||
        permisosRequeridos.length === 0
    ) {
        return true;
    }

    /**
     * Un solo permiso.
     */
    if (permisosRequeridos.length === 1) {

        return isAuthorize(
            permisosRequeridos[0]
        );
    }

    /**
     * Múltiples permisos.
     */
    return permisosRequeridos.every(permiso => {

        return isAuthorize(permiso);
    });
};

/**
 * Recorre el árbol de rutas recursivamente.
 * 
 * @param {Object} routes
 * @param {Array<string>} arregloHash
 * @param {boolean} esLlamadaRecursiva
 * @returns {Array}
 */
const recorrerRutas = (
    routes,
    arregloHash,
    esLlamadaRecursiva = false
) => {

    let parametros = {};

    /**
     * Procesar parámetros solo
     * en la primera llamada.
     */
    if (
        !esLlamadaRecursiva &&
        arregloHash.length > 0
    ) {

        const ultimoElemento =
            arregloHash[arregloHash.length - 1];

        if (
            ultimoElemento &&
            ultimoElemento.includes("=")
        ) {

            let parametrosSeparados =
                ultimoElemento.split("&");

            parametrosSeparados.forEach((parametro) => {

                let claveValor =
                    parametro.split("=");

                parametros[
                    claveValor[0]
                ] = claveValor[1];
            });

            arregloHash = [...arregloHash];

            arregloHash.pop();
        }
    }

    /**
     * Ruta raíz.
     */
    if (
        (arregloHash.length === 1 &&
            arregloHash[0] === "") ||

        (arregloHash.length === 2 &&
            arregloHash[0] === "" &&
            arregloHash[1] === "") ||

        arregloHash.length === 0
    ) {

        return [routes[""], parametros];
    }

    /**
     * Obtiene ruta actual.
     */
    const rutaActual =
        arregloHash[0] === ""
            ? arregloHash[1]
            : arregloHash[0];

    /**
     * Obtiene segmentos restantes.
     */
    const resto =
        arregloHash[0] === ""
            ? arregloHash.slice(2)
            : arregloHash.slice(1);

    /**
     * Buscar coincidencia.
     */
    for (const key in routes) {

        if (key === rutaActual) {

            /**
             * Contenedor con subrutas.
             */
            if (
                typeof routes[key] === "object" &&
                !routes[key].path &&
                !routes[key].controlador
            ) {

                const [
                    rutaRecursiva,
                    parametrosRecursivos
                ] = recorrerRutas(
                    routes[key],
                    resto,
                    true
                );

                return [
                    rutaRecursiva,
                    {
                        ...parametros,
                        ...parametrosRecursivos
                    }
                ];
            }

            /**
             * Ruta final encontrada.
             */
            return [routes[key], parametros];
        }
    }

    return [null, parametros];
};

/**
 * Controla la visualización
 * del botón volver.
 * 
 * @param {Array<string>} arregloHash
 */
const removerBotonHeader = (arregloHash) => {

    const botonBack =
        document.getElementById("botonBack");

    if (!botonBack) {

        return;
    }

    if (arregloHash.length <= 2) {

        botonBack.classList.add(
            "invisible"
        );

    } else {

        botonBack.classList.remove(
            "invisible"
        );
    }
};