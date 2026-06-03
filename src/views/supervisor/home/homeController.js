/**
 * Controlador: Panel de Control Unificado (homeController.js)
 * Este controlador unifica las vistas y lógica de Supervisor y Administrador (Rol ID 2).
 * Gestiona el saludo dinámico, la barra lateral, las tarjetas de métricas del sistema
 * y las tablas dinámicas de auditoría de usuarios, auditoría de catálogos y últimos planes.
 */
import * as api from "../../../helpers/api";
import ventanaHistorial from "../../../helpers/ventanaHistorial";

export default async () => {
    // -------------------------------------------------------------
    // BLOQUE DE SALUDO DINÁMICO
    // -------------------------------------------------------------
    // Qué hace: Captura el elemento del título de explicación del saludo.
    // Por qué existe: Permite modificar el contenido HTML para incluir el nombre del usuario.
    // Qué problema resuelve: Identifica al usuario que tiene la sesión activa en el encabezado.
    const explicaciontitulo = document.querySelector(".explicacion__titulo");
    
    // Qué hace: Obtiene el nombre completo del usuario del almacenamiento local de sesión.
    // Por qué existe: Evita tener que realizar una petición adicional al backend para saber el nombre.
    // Qué problema resuelve: Permite personalizar la interfaz de manera rápida con datos locales.
    const nombre = localStorage.getItem("full_name");
    
    // Qué hace: Obtiene el ID del género del usuario del almacenamiento local.
    // Por qué existe: Permite aplicar una lógica gramatical para saludar en masculino o femenino.
    // Qué problema resuelve: Mejora la experiencia de usuario adaptando el saludo (Bienvenido/a).
    const genero = localStorage.getItem("gender_id");

    // Qué hace: Evalúa si el ID de género corresponde a femenino (ID = 2) y agrega el sufijo correcto.
    // Por qué existe: Asegura que el saludo concuerde con el género de la persona.
    // Qué problema resuelve: Resuelve la falta de concordancia de género en el saludo de bienvenida.
    if (genero == 2) {
        explicaciontitulo.innerHTML += "a " + nombre;
    } else {
        explicaciontitulo.innerHTML += " " + nombre;
    }

    // -------------------------------------------------------------
    // BLOQUE DE PERFIL EN SIDEBAR
    // -------------------------------------------------------------
    // Qué hace: Captura el elemento de texto del perfil en el menú lateral.
    // Por qué existe: Asigna el nombre del usuario logueado en el panel aside fijo de navegación.
    // Qué problema resuelve: Sustituye el marcador "Nombre" por la identidad real de la persona.
    const labelNombre = document.getElementById("nombreUsuarioSidebar");
    if (labelNombre && nombre) {
        labelNombre.textContent = nombre;
    }

    // -------------------------------------------------------------
    // BLOQUE DE REFERENCIAS A NODOS DE MÉTRICAS
    // -------------------------------------------------------------
    // Qué hace: Obtiene las referencias del DOM para las tarjetas de estadísticas de Planes Familiares.
    // Por qué existe: Facilita la inyección dinámica de los totales de planes recibidos, aprobados, rechazados y en revisión.
    // Qué problema resuelve: Actualiza los números del estado de planes familiares en tiempo real.
    const planesRecibidos = document.getElementById('planesRecibidos');
    const planesAprobados = document.getElementById('planesAprobados');
    const planesRechazados = document.getElementById('planesRechazados');
    const planesEnRevision = document.getElementById('planesEnRevision');

    // Qué hace: Obtiene referencias del DOM para las tarjetas de estadísticas del Administrador.
    // Por qué existe: Permite actualizar las cifras globales de usuarios activos, inactivos, voluntarios y total general.
    // Qué problema resuelve: Muestra el estado del volumen total de usuarios en el sistema.
    const activos = document.getElementById("activos");
    const inactivos = document.getElementById("inactivos");
    const voluntarios = document.getElementById("voluntarios");
    const totalUsuarios = document.getElementById("totalUsuarios");

    // Qué hace: Obtiene las referencias del DOM para los contenedores de listas de historial de auditoría.
    // Por qué existe: Permite que el helper ventanaHistorial inyecte las tarjetas de logs de cambios en las áreas designadas.
    // Qué problema resuelve: Muestra los logs de auditoría sobre usuarios y datos maestros directamente en el panel.
    const usuariosHistorial = document.getElementById('usuariosHistorial');
    const catalogoHistorial = document.getElementById('catalogoHistorial');

    // -------------------------------------------------------------
    // PETICIONES CONCURRENTES A LOS DASHBOARDS
    // -------------------------------------------------------------
    // Qué hace: Llama en paralelo a los endpoints de supervisor y administrador mediante Promise.all.
    // Por qué existe: Evita peticiones secuenciales lentas (bloqueantes) y acelera la carga inicial del panel consolidado.
    // Qué problema resuelve: Disminuye la latencia de carga en la interfaz reuniendo todos los datos del backend en un solo paso.
    const [dashBoardSup, dashBoardAdmin] = await Promise.all([
        api.get('audits/dashBoardSupervisor'),
        api.get('audits/dashBoardAdmin')
    ]);

    // -------------------------------------------------------------
    // POBLADO DE TARJETAS DE PLANES (SUPERVISOR)
    // -------------------------------------------------------------
    // Qué hace: Asigna los valores numéricos correspondientes a las tarjetas de métricas de planes.
    // Por qué existe: Asegura que el supervisor visualice de inmediato la cantidad de planes pendientes de revisión o procesados.
    // Qué problema resuelve: Evita la visualización de datos vacíos o estáticos en el resumen de planes familiares.
    if (dashBoardSup) {
        planesRecibidos.textContent = dashBoardSup.pending_plans ?? 0;
        planesAprobados.textContent = dashBoardSup.approved_plans ?? 0;
        planesRechazados.textContent = dashBoardSup.rejected_plans ?? 0;
        planesEnRevision.textContent = dashBoardSup.in_review_plans ?? dashBoardSup.in_progress_plans ?? 0;
    }

    // -------------------------------------------------------------
    // POBLADO DE TARJETAS DE USUARIOS Y AUDITORÍA (ADMIN)
    // -------------------------------------------------------------
    // Qué hace: Valida la existencia del objeto de respuesta del administrador y procesa sus datos.
    // Por qué existe: Previene errores en la ejecución JS si la petición de auditoría del administrador falla o retorna vacía.
    // Qué problema resuelve: Resguarda la estabilidad de la aplicación inyectando fallback seguros para la renderización.
    if (dashBoardAdmin) {
        const { history_general, history_members, summary, rols } = dashBoardAdmin;

        // Qué hace: Llama a ventanaHistorial para poblar la lista de cambios sobre los miembros/usuarios.
        // Por qué existe: Permite al administrador supervisar de cerca las acciones de creación y cambio de estado de usuarios.
        // Qué problema resuelve: Automatiza el maquetado del listado dinámico de auditoría de usuarios.
        if (usuariosHistorial && history_members) {
            ventanaHistorial(history_members, usuariosHistorial);
        }

        // Qué hace: Llama a ventanaHistorial para poblar la lista de cambios sobre los datos maestros (Catálogos).
        // Por qué existe: Expone las auditorías generales de adición y modificación en datos maestros o tablas paramétricas.
        // Qué problema resuelve: Automatiza el maquetado de auditoría de catálogos generales.
        if (catalogoHistorial && history_general) {
            ventanaHistorial(history_general, catalogoHistorial);
        }

        // Qué hace: Asigna y calcula los valores numéricos para las tarjetas resumen de administración.
        // Por qué existe: Garantiza la correspondencia exacta de los números de las tarjetas con la base de datos de usuarios.
        // Qué problema resuelve: Reemplaza las cifras placeholder con totales reales recuperados en la consulta asíncrona.
        if (summary && rols) {
            totalUsuarios.textContent = Number(summary.active) + Number(summary.inactive);
            activos.textContent = summary.active;
            inactivos.textContent = summary.inactive;
            voluntarios.textContent = rols.volunteer;
        }
    }

    // -------------------------------------------------------------
    // CARGAR Y RENDERIZAR LOS ÚLTIMOS PLANES DINÁMICAMENTE
    // -------------------------------------------------------------
    // Qué hace: Intenta consultar los planes familiares y renderizar los 3 más recientes.
    // Por qué existe: Permite al supervisor tener acceso inmediato y de un clic a los planes que acaban de llegar para su revisión.
    // Qué problema resuelve: Elimina las filas estáticas del código HTML inicial y las reemplaza por planes reales del sistema.
    try {
        const paginado = await api.getPaginacion("familyPlans");
        if (paginado && paginado.data) {
            // Qué hace: Selecciona únicamente los 3 primeros planes del listado general.
            // Por qué existe: Mantiene la vista del dashboard limpia y enfocada en lo más urgente (más reciente).
            // Qué problema resuelve: Evita sobrecargar el scroll del panel principal con listas extensas de planes.
            const ultimosPlanes = paginado.data.slice(0, 3);
            
            // Qué hace: Llama a la función local para pintar los elementos dinámicos en móvil y escritorio.
            // Por qué existe: Separa la lógica de presentación de la lógica de petición asíncrona del home.
            // Qué problema resuelve: Modulariza el proceso de renderizado del componente de planes familiares.
            renderUltimosPlanes(ultimosPlanes);
        }
    } catch (err) {
        console.error("Error al cargar los últimos planes:", err);
    }
};

/**
 * Función Auxiliar: Renderiza dinámicamente los últimos planes recibidos.
 * Genera tanto la estructura adaptativa para dispositivos móviles como la fila de tabla de escritorio.
 * 
 * @param {Array} planes - Listado de planes obtenidos del backend
 */
const renderUltimosPlanes = (planes) => {
    // Qué hace: Captura los contenedores DOM específicos para móvil y escritorio.
    // Por qué existe: Asegura inyectar la maquetación en el lugar indicado según el ancho de pantalla del navegador.
    // Qué problema resuelve: Posibilita un diseño responsivo real y ordenado para ambos tipos de dispositivos.
    const listaMovil = document.getElementById("listaPlanesMovil");
    const cuerpoDesktop = document.getElementById("listaPlanesCuerpo");
    
    listaMovil.innerHTML = "";
    cuerpoDesktop.innerHTML = "";
    
    // Qué hace: Valida si la lista viene vacía e inyecta un texto informativo por defecto.
    // Por qué existe: Evita dejar pantallas en blanco que confundan al usuario.
    // Qué problema resuelve: Da retroalimentación clara de que no hay datos pendientes en el sistema.
    if (planes.length === 0) {
        listaMovil.innerHTML = "<p class='form__texto'>No hay planes familiares recibidos.</p>";
        cuerpoDesktop.innerHTML = "<tr><td colspan='5' class='tabla__celda' style='text-align: center;'>No hay planes familiares recibidos.</td></tr>";
        return;
    }
    
    // Qué hace: Recorre cada plan para construir sus nodos dinámicamente.
    // Por qué existe: Mapea los registros del backend a componentes HTML interactivos con clases CSS predefinidas.
    // Qué problema resuelve: Reemplaza filas estáticas de pruebas por datos de producción reales.
    planes.forEach(plan => {
        // -------------------------------------------------------------
        // RENDERIZADO MÓVIL (TARJETAS COMPACTAS)
        // -------------------------------------------------------------
        const tarjeta = document.createElement("article");
        tarjeta.classList.add("tarjeta", "tarjeta--fila", "tarjeta--plan", "cursor-pointer");
        
        // Qué hace: Vincula el evento de clic de la tarjeta móvil para abrir la revisión.
        // Por qué existe: Permite al supervisor entrar directo a calificar el plan familiar.
        // Qué problema resuelve: Agiliza el acceso en smartphones sin requerir navegación compleja.
        tarjeta.addEventListener("click", () => {
            window.location.hash = `#/supervisor/plan_familiar/revision?familia_id=${plan.id}`;
        });
        
        const icono = document.createElement("i");
        icono.classList.add("ri-team-line", "icono__tarjeta", "tarjeta__icono", "tarjeta__icono--azul");
        
        const contenido = document.createElement("div");
        contenido.classList.add("tarjeta__contenido", "tarjeta__contenido--linea");
        
        const titulo = document.createElement("p");
        titulo.classList.add("tarjeta__titulo", "tarjeta__titulo--pequeno");
        titulo.textContent = `Familia ${plan.last_names}`;
        
        const sub1 = document.createElement("p");
        sub1.classList.add("form__texto", "form__texto--secundario");
        sub1.textContent = `${plan.department || "Bucaramanga"} · ${plan.date_create}`;
        
        const sub2 = document.createElement("p");
        sub2.classList.add("form__texto", "form__texto--secundario");
        sub2.textContent = `Voluntario: ${plan.responsable}`;
        
        contenido.append(titulo, sub1, sub2);
        
        // Determinar badge de color del estado
        let badgeClass = "badge--pendiente";
        if (plan.status_id == 4 || plan.status_id == 7) {
            badgeClass = "badge--completado";
        } else if (plan.status_id == 5 || plan.status_id == 6) {
            badgeClass = "badge--rechazado";
        }
        
        const estadoBadge = document.createElement("span");
        estadoBadge.classList.add("badge", badgeClass);
        estadoBadge.textContent = plan.status;
        
        tarjeta.append(icono, contenido, estadoBadge);
        listaMovil.append(tarjeta);
        
        // -------------------------------------------------------------
        // RENDERIZADO DESKTOP (TABLA DE DATOS STRUCT)
        // -------------------------------------------------------------
        const fila = document.createElement("tr");
        fila.classList.add("tabla__fila", "cursor-pointer");
        
        // Qué hace: Vincula el evento de clic de la fila de la tabla para abrir la revisión.
        // Por qué existe: Facilita una navegación ágil y directa sobre los registros mostrados en pantalla.
        // Qué problema resuelve: Permite auditar planes familiares con un solo clic.
        fila.addEventListener("click", () => {
            window.location.hash = `#/supervisor/plan_familiar/revision?familia_id=${plan.id}`;
        });
        
        const celdaFamilia = document.createElement("td");
        celdaFamilia.classList.add("tabla__celda");
        
        const iconoTabla = document.createElement("i");
        iconoTabla.classList.add("ri-team-line", "tabla__icono");
        
        const nombreFamilia = document.createElement("span");
        nombreFamilia.textContent = `Familia ${plan.last_names}`;
        celdaFamilia.append(iconoTabla, nombreFamilia);
        
        const celdaOrganizacion = document.createElement("td");
        celdaOrganizacion.classList.add("tabla__celda");
        celdaOrganizacion.textContent = plan.department || "Bucaramanga";
        
        const celdaFecha = document.createElement("td");
        celdaFecha.classList.add("tabla__celda");
        celdaFecha.textContent = plan.date_create;
        
        const celdaVoluntario = document.createElement("td");
        celdaVoluntario.classList.add("tabla__celda");
        celdaVoluntario.textContent = plan.responsable;
        
        const celdaEstado = document.createElement("td");
        celdaEstado.classList.add("tabla__celda");
        
        const estadoBadgeDesktop = document.createElement("span");
        estadoBadgeDesktop.classList.add("badge", badgeClass);
        estadoBadgeDesktop.textContent = plan.status;
        celdaEstado.append(estadoBadgeDesktop);
        
        fila.append(celdaFamilia, celdaOrganizacion, celdaFecha, celdaVoluntario, celdaEstado);
        cuerpoDesktop.append(fila);
    });
};
