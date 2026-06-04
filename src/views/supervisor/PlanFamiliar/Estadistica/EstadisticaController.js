/**
 * Controlador: Estadísticas Consolidadas (EstadisticaController.js)
 * Renderiza todos los gráficos del panel de control unificado:
 * 1. Tarjetas numéricas de Voluntarios y Supervisores
 * 2. Gráfico de barras horizontales de Planes por Organización
 * 3. Gráfico de dona dinámica de Planes por Estado
 * 4. Gráfico de dona de Estados de Cuentas de Usuario (Administrador)
 * 5. Gráfico de barras de Usuarios por Rol (Administrador)
 * 6. Gráfico de línea temporal de Tendencias de Datos Maestros (Administrador)
 */
import * as api from "../../../../helpers/api";
import * as canva from "../../../../helpers/canvas";

export default async () => {
    // -------------------------------------------------------------
    // BLOQUE DE PERFIL EN SIDEBAR
    // -------------------------------------------------------------
    // Qué hace: Obtiene el nombre completo del usuario de sesión de localStorage y lo asigna a la sidebar.
    // Por qué existe: Asegura la consistencia del menú lateral mostrando la identidad del usuario logueado.
    // Qué problema resuelve: Identifica al usuario que realiza la consulta de estadísticas en la barra lateral.
    const nombre = localStorage.getItem("full_name");
    const labelNombre = document.getElementById("nombreUsuarioSidebar");
    if (labelNombre && nombre) {
        labelNombre.textContent = nombre;
    }

    // -------------------------------------------------------------
    // PETICIONES CONCURRENTES A LOS DASHBOARDS
    // -------------------------------------------------------------
    // Qué hace: Realiza solicitudes HTTP GET en paralelo a los endpoints de super administrador y administrador.
    // Por qué existe: Optimiza la carga trayendo todos los datos del backend simultáneamente sin bloqueos.
    // Qué problema resuelve: Disminuye la latencia de carga en la pantalla analítica del supervisor.
    const [dashBoardSuperAdmin, dashBoardAdmin] = await Promise.all([
        api.get('audits/dashBoardSuperAdmin'),
        api.get('audits/dashBoardAdmin')
    ]);

    // -------------------------------------------------------------
    // RENDERIZADO DE GRÁFICOS DEL SUPER ADMINISTRADOR
    // -------------------------------------------------------------
    // Qué hace: Valida la existencia del objeto del super administrador para proceder al renderizado de sus gráficos.
    // Por qué existe: Previene caídas del script si por algún motivo la auditoría del super administrador falla en red.
    // Qué problema resuelve: Garantiza el aislamiento de fallos para mantener operativa la visualización de métricas.
    if (dashBoardSuperAdmin) {
        const { plans_by_organization, plans_by_status, users_by_status, roles } = dashBoardSuperAdmin;

        // Qué hace: Poblar las tarjetas numéricas de voluntarios y supervisores.
        // Por qué existe: Muestra de forma rápida el conteo total de usuarios por rol.
        // Qué problema resuelve: Proporciona una vista numérica inmediata de la distribución de roles.
        const totalVoluntarios = document.getElementById('totalVoluntarios');
        const totalSupervisores = document.getElementById('totalSupervisores');
        if (totalVoluntarios && roles) {
            totalVoluntarios.textContent = roles.volunteer;
        }
        if (totalSupervisores && roles) {
            totalSupervisores.textContent = roles.supervisor;
        }

        // Qué hace: Renderizar gráfico de barras horizontales de planes por organización.
        // Por qué existe: Permite visualizar la distribución de planes por cada organización.
        // Qué problema resuelve: Identifica qué organizaciones tienen mayor actividad en planes familiares.
        const canvaPlanesPorOrg = document.getElementById('canvaPlanesPorOrg');
        if (canvaPlanesPorOrg && plans_by_organization && plans_by_organization.length > 0) {
            const labels = plans_by_organization.map(item => item.organization);
            const datos = plans_by_organization.map(item => item.total);
            canva.barraHorizontal(canvaPlanesPorOrg, "Planes por Organización", labels, datos);
        }

        // Qué hace: Renderizar gráfico de dona dinámica de planes por estado.
        // Por qué existe: Permite visualizar la proporción de planes según su estado actual.
        // Qué problema resuelve: Facilita el análisis del estado de los planes en el sistema.
        const canvaPlanesPorEstado = document.getElementById('canvaPlanesPorEstado');
        if (canvaPlanesPorEstado && plans_by_status && plans_by_status.length > 0) {
            const labels = plans_by_status.map(item => item.status);
            const datos = plans_by_status.map(item => item.total);
            // Colores semánticos según el estado del plan
            const colores = plans_by_status.map(item => {
                const status = item.status.toLowerCase();
                if (status.includes('enviado') || status.includes('pendiente')) return '#FF6600';
                if (status.includes('revisión')) return '#17a2b8';
                if (status.includes('aprobado')) return '#28a745';
                if (status.includes('rechazado')) return '#dc3545';
                return '#0770CC';
            });
            canva.donaDinamica(canvaPlanesPorEstado, "Planes por Estado", labels, datos, colores);
        }

        // Qué hace: Renderizar gráfico de dona de estados de usuario.
        // Por qué existe: Permite analizar la proporción de cuentas activas versus solicitudes pendientes.
        // Qué problema resuelve: Simplifica la lectura analítica sobre el estado de cuentas en el sistema.
        const canvaEstadoUsuario = document.getElementById('canvaEstadoUsuario');
        if (canvaEstadoUsuario && users_by_status) {
            canva.dona(canvaEstadoUsuario, "Estados de Usuario", "Activos", "Inactivos", "Pendientes",
                users_by_status.active, users_by_status.inactive, users_by_status.pending);
        }

        // Qué hace: Renderizar gráfico de barras de usuarios por rol.
        // Por qué existe: Muestra de forma rápida la relación cuantitativa entre los dos roles principales.
        // Qué problema resuelve: Representa visualmente la dotación del equipo del proyecto.
        const canvaRoles = document.getElementById('canvaRoles');
        if (canvaRoles && roles) {
            canva.barra(canvaRoles, "Usuarios por Rol", "Voluntarios", "Supervisor",
                roles.volunteer, roles.supervisor);
        }
    }

    // -------------------------------------------------------------
    // RENDERIZADO DE GRÁFICOS DEL ADMINISTRADOR (TENDENCIAS)
    // -------------------------------------------------------------
    // Qué hace: Valida la existencia del objeto del administrador para proceder al renderizado del gráfico de tendencias.
    // Por qué existe: Previene caídas del script si por algún motivo la auditoría del administrador falla en red.
    // Qué problema resuelve: Garantiza el aislamiento de fallos para mantener operativa la visualización de tendencias.
    if (dashBoardAdmin) {
        const canvaCatalogoEstados = document.getElementById('canvaCatalogoEstados');
        const { monthly_changes } = dashBoardAdmin;

        // Qué hace: Crea el gráfico de líneas temporales de adición y cambios mensuales en catálogos.
        // Por qué existe: Muestra gráficamente las tendencias de modificación de datos maestros en el tiempo.
        // Qué problema resuelve: Facilita identificar periodos de alta actividad en cambios paramétricos del sistema.
        if (canvaCatalogoEstados && monthly_changes && monthly_changes.length >= 6) {
            canva.lineaTemporal(canvaCatalogoEstados, "Catálogo Activos e Inactivos",
                monthly_changes[0].month, monthly_changes[1].month, monthly_changes[2].month, monthly_changes[3].month, monthly_changes[4].month, monthly_changes[5].month,
                monthly_changes[0].total, monthly_changes[1].total, monthly_changes[2].total, monthly_changes[3].total, monthly_changes[4].total, monthly_changes[5].total);
        }
    }
};