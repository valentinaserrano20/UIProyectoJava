/**
 * Controlador de Notificaciones
 * Maneja la visualización y gestión de notificaciones
 */
import * as api from "../../../helpers/api";
import * as alerta from "../../../helpers/alertas";

export default async () => {
    const contenedorNotificaciones = document.getElementById("contenedorNotificaciones");
    const filtroTodos = document.getElementById("filtroTodos");
    const filtroNoLeidas = document.getElementById("filtroNoLeidas");
    const filtroLeidas = document.getElementById("filtroLeidas");

    let filtroActual = "todos"; // todos, no_leidas, leidas
    let notificaciones = [];

    // Función para obtener tiempo relativo
    const obtenerTiempoRelativo = (fecha) => {
        const fechaNotif = new Date(fecha);
        const ahora = new Date();
        const diffMs = ahora - fechaNotif;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHora = Math.floor(diffMs / 3600000);
        const diffDia = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return "Ahora mismo";
        if (diffMin < 60) return `Hace ${diffMin} min`;
        if (diffHora < 24) return `Hace ${diffHora} h`;
        if (diffDia < 7) return `Hace ${diffDia} d`;
        return fechaNotif.toLocaleDateString('es-ES');
    };

    // Función para obtener clase de badge según tipo
    const obtenerClaseBadge = (tipo) => {
        switch (tipo) {
            case 'plan_estado':
                return 'badge--completado';
            case 'nuevo_usuario':
                return 'badge--pendiente';
            case 'nuevo_plan':
                return 'badge--rechazado';
            default:
                return 'badge--completado';
        }
    };

    // Función para obtener icono según tipo
    const obtenerIcono = (tipo) => {
        switch (tipo) {
            case 'plan_estado':
                return 'ri-file-user-line';
            case 'nuevo_usuario':
                return 'ri-user-add-line';
            case 'nuevo_plan':
                return 'ri-file-list-3-line';
            default:
                return 'ri-notification-3-line';
        }
    };

    // Función para renderizar notificaciones
    const renderizarNotificaciones = (listaNotificaciones) => {
        contenedorNotificaciones.innerHTML = "";

        if (!listaNotificaciones || listaNotificaciones.length === 0) {
            contenedorNotificaciones.innerHTML = `
                <div class="noCantidad">
                    <p>No tienes notificaciones</p>
                </div>
            `;
            return;
        }

        listaNotificaciones.forEach(notif => {
            const tiempoRelativo = obtenerTiempoRelativo(notif.fecha_creacion);
            const claseBadge = obtenerClaseBadge(notif.tipo);
            const icono = obtenerIcono(notif.tipo);
            const claseLeida = notif.leida ? 'tarjeta--notificacion-leida' : 'tarjeta--notificacion-no-leida';

            const tarjeta = document.createElement("div");
            tarjeta.className = `tarjeta tarjeta--notificacion ${claseLeida}`;
            tarjeta.dataset.id = notif.id;
            tarjeta.dataset.enlace = notif.enlace;

            tarjeta.innerHTML = `
                <div class="tarjeta__header">
                    <div class="tarjeta__icono-contenedor tarjeta__icono-contenedor--azul">
                        <i class="${icono}"></i>
                    </div>
                    <div class="tarjeta__info">
                        <p class="tarjeta__titulo-notificacion">${notif.titulo}</p>
                    </div>
                    <div class="tarjeta__estado">
                        <span class="tarjeta__tiempo">${tiempoRelativo}</span>
                        ${!notif.leida ? `<span class="badge ${claseBadge}">Nueva</span>` : ''}
                    </div>
                </div>
                <div class="tarjeta__cuerpo">
                    <div class="tarjeta__mensaje">
                        <i class="ri-message-2-line"></i>
                        <div class="tarjeta__mensaje-texto">
                            <p class="tarjeta__mensaje-contenido">${notif.mensaje}</p>
                        </div>
                    </div>
                </div>
            `;

            // Click en tarjeta para navegar y marcar como leída
            tarjeta.addEventListener("click", async () => {
                if (notif.enlace) {
                    // Marcar como leída
                    if (!notif.leida) {
                        await api.put("notificaciones", { id: notif.id });
                    }
                    // Navegar al enlace
                    window.location.hash = notif.enlace;
                }
            });

            contenedorNotificaciones.appendChild(tarjeta);
        });
    };

    // Función para cargar notificaciones
    // Qué hace: Consume el endpoint GET de notificaciones a través del helper api
    // Por qué existe: Obtiene el listado completo de alertas y avisos asociados al voluntario o supervisor activo
    // Qué problema resuelve: Corrige la lectura errónea de response.success y response.data debido a que api.get ya desempaqueta el JSON raíz devolviendo directamente el Array de datos
    const cargarNotificaciones = async () => {
        try {
            const response = await api.get("notificaciones");
            if (response && Array.isArray(response)) {
                notificaciones = response;
                aplicarFiltro();
            }
        } catch (error) {
            console.error("Error al cargar notificaciones:", error);
            alerta.alertaError("Error al cargar notificaciones");
        }
    };

    // Función para aplicar filtro
    const aplicarFiltro = () => {
        let filtradas = notificaciones;

        if (filtroActual === "no_leidas") {
            filtradas = notificaciones.filter(n => !n.leida);
        } else if (filtroActual === "leidas") {
            filtradas = notificaciones.filter(n => n.leida);
        }

        renderizarNotificaciones(filtradas);
    };

    // Event listeners para filtros
    filtroTodos.addEventListener("click", () => {
        filtroActual = "todos";
        actualizarBotonesFiltro();
        aplicarFiltro();
    });

    filtroNoLeidas.addEventListener("click", () => {
        filtroActual = "no_leidas";
        actualizarBotonesFiltro();
        aplicarFiltro();
    });

    filtroLeidas.addEventListener("click", () => {
        filtroActual = "leidas";
        actualizarBotonesFiltro();
        aplicarFiltro();
    });

    // Función para actualizar estado de botones de filtro
    const actualizarBotonesFiltro = () => {
        filtroTodos.classList.remove("boton--filtro-activo");
        filtroNoLeidas.classList.remove("boton--filtro-activo");
        filtroLeidas.classList.remove("boton--filtro-activo");

        if (filtroActual === "todos") {
            filtroTodos.classList.add("boton--filtro-activo");
        } else if (filtroActual === "no_leidas") {
            filtroNoLeidas.classList.add("boton--filtro-activo");
        } else if (filtroActual === "leidas") {
            filtroLeidas.classList.add("boton--filtro-activo");
        }
    };

    // Cargar notificaciones al iniciar
    await cargarNotificaciones();
};
