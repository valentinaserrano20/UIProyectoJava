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

    // Qué hace: Ejecuta de forma secuencial y con await las validaciones de enrutamiento y seguridad.
    // Por qué existe: Asegura que si una validación asíncrona redirige por seguridad, la carga de la página actual se detenga de inmediato.
    // Qué problema resuelve: Resuelve la condición de carrera donde páginas restringidas intentaban cargarse y ejecutar sus controladores antes de la redirección.
    if (corregirQueryParams(hash)) return;

    if (!(await validarRol(hash))) return;

    if (await ocultarEditarUrl(hash)) return;

    if (await ocultarUrlFamilia(hash)) return;

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

    // Qué hace: Retorna false si no se cumple el formato de edición de plan familiar.
    // Por qué existe: Evita realizar peticiones a la API para rutas no relacionadas con planes o no editables.
    // Qué problema resuelve: Optimiza la navegación del router.
    if (!estaEnPlan || !tieneEditar) return false;

    const queryString = hash.split("?")[1] || "";

    const params = new URLSearchParams(queryString);

    const familia_id = params.get("familia_id");

    if (!familia_id) return false;

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

            return true;
        }

        if (esVoluntario) {

            window.location.hash =
                "#/voluntario/plan_familiar";

            alerta.alertaMensaje(
                `Este plan familiar ya fue aprobado o rechazado definitivamente y no se puede editar, te redirigiremos al listado de planes familiares`
            );

            return true;
        }
    }
    return false;
};

/**
 * Evita acceso manual por URL según estado del plan.
 * 
 * @param {string} hash
 */
const ocultarUrlFamilia = async (hash) => {

    const esSupervisor = hash.includes("supervisor/");
    const esVoluntario = hash.includes("voluntario/");

    // Qué hace: Retorna false si la ruta no tiene relación con el plan familiar o su identificador.
    // Por qué existe: Filtra las validaciones para que operen solo en los módulos del plan de emergencia familiar.
    // Qué problema resuelve: Evita peticiones innecesarias para otras secciones del sistema (como catálogo o usuarios).
    if (
        !hash.includes("familia_id") &&
        !hash.includes("plan_familiar/")
    ) {
        return false;
    }

    const queryString = hash.includes("?")
        ? hash.split("?")[1]
        : "";

    const params = new URLSearchParams(queryString);

    const familiaId = params.get("familia_id") || params.get("id");

    if (!familiaId) return false;

    const plan = await api.get(`familyPlans/${familiaId}`);

    if (esVoluntario) {

        // Qué hace: Redirige al voluntario al listado general de planes si intenta acceder a un plan ya cerrado o enviado.
        // Por qué existe: Si el plan está en estado 1 (Enviado), 4 (Rechazado), 6 (Rechazado definitivo) o 7 (Aprobado), el voluntario no tiene botones ni redirecciones habilitados.
        // Qué problema resuelve: Implementa de forma estricta el requerimiento de que el voluntario solo visualice la tarjeta sin navegación ni accesos adicionales.
        if (
            plan.status_plan_id === 1 ||
            plan.status_plan_id === 4 ||
            plan.status_plan_id === 6 ||
            plan.status_plan_id === 7
        ) {

            window.location.hash =
                `#/voluntario/plan_familiar`;

            alerta.alertaMensaje(
                `Este plan familiar ya está enviado, aprobado o rechazado y no se puede visualizar ni editar directamente.`
            );

            return true;
        }
    }

    if (esSupervisor) {

        // Qué hace: Impide el acceso al supervisor si el plan es un borrador del voluntario (estado 2 o 3) y no ha sido enviado.
        // Por qué existe: Asegura que el supervisor no pueda auditar planes incompletos que el voluntario aún no ha remitido formalmente.
        // Qué problema resuelve: Permite el acceso del supervisor a planes en estado 1 (Enviado) para su correspondiente calificación y revisión.
        if (
            plan.status_plan_id === 2 ||
            plan.status_plan_id === 3
        ) {

            window.location.hash =
                "#/supervisor/plan_familiar";

            alerta.alertaMensaje(
                `Este plan familiar aún no ha sido enviado por el voluntario, no se puede acceder directamente hasta que el voluntario lo envíe para revisión`
            );

            return true;
        }
    }

    return false;
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
    // Qué hace: Captura el elemento del botón de retroceso ('botonBack') del DOM.
    // Por qué existe: Permite modificar la visibilidad de la flecha de retroceso de la cabecera general.
    // Qué problema resuelve: Permite ocultar el botón en pantallas principales y mostrarlo en subpantallas de detalle.
    const botonBack = document.getElementById("botonBack");

    // Qué hace: Valida si el botón de retroceso no está cargado o presente en la página actual.
    // Por qué existe: Evita errores de excepción de referencia nula al intentar modificar clases en un elemento inexistente.
    // Qué problema resuelve: Previene fallos de ejecución de JavaScript en pantallas de inicio de sesión o layouts externos.
    if (!botonBack) {
        return;
    }

    // Qué hace: Filtra el arreglo de segmentos de la URL eliminando cadenas vacías provocadas por barras diagonales.
    // Por qué existe: Obtiene la cantidad real de segmentos de navegación excluyendo la diagonal final en URLs como '#/supervisor/'.
    // Qué problema resuelve: Evita que el botón de retroceso aparezca de forma indebida en el Dashboard principal.
    const segmentosReales = arregloHash.filter(segmento => segmento !== "");

    // Qué hace: Evalúa si los segmentos reales de navegación son menores o iguales a uno (vista principal).
    // Por qué existe: Determina si el usuario se encuentra en el Inicio o Dashboard del rol activo.
    // Qué problema resuelve: Resuelve la inconsistencia visual de mostrar la flecha de retroceso cuando no hay páginas anteriores.
    if (segmentosReales.length <= 1) {
        // Qué hace: Añade la clase CSS 'invisible' al botón para ocultarlo visualmente.
        // Por qué existe: Hace que el botón de retroceso desaparezca de la barra de navegación superior.
        // Qué problema resuelve: Oculta el botón en el dashboard inicial del supervisor o voluntario.
        botonBack.classList.add("invisible");
    } else {
        // Qué hace: Remueve la clase CSS 'invisible' del botón para mostrarlo visualmente.
        // Por qué existe: Hace que el botón sea visible y utilizable por el usuario.
        // Qué problema resuelve: Muestra la flecha de retroceso cuando el usuario ingresa a una subsección o vista de detalle.
        botonBack.classList.remove("invisible");
    }
};