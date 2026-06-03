/**
 * Controlador: Estadísticas Consolidadas (EstadisticaController.js)
 * Renderiza todos los gráficos del panel de control unificado:
 * 1. Gráfico de dona de Estados de Planes Familiares (Supervisor)
 * 2. Gráfico de dona de Estados de Cuentas de Usuario (Administrador)
 * 3. Gráfico de barras de Usuarios por Rol (Administrador)
 * 4. Gráfico de línea temporal de Tendencias de Datos Maestros (Administrador)
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
    // Qué hace: Realiza solicitudes HTTP GET en paralelo a los endpoints de supervisor y administrador.
    // Por qué existe: Optimiza la carga trayendo todos los datos del backend simultáneamente sin bloqueos.
    // Qué problema resuelve: Disminuye la latencia de carga en la pantalla analítica del supervisor.
    const [dashBoardSup, dashBoardAdmin] = await Promise.all([
        api.get('audits/dashBoardSupervisor'),
        api.get('audits/dashBoardAdmin')
    ]);

    // -------------------------------------------------------------
    // RENDERIZADO DEL GRÁFICO DE PLANES FAMILIARES (SUPERVISOR)
    // -------------------------------------------------------------
    // Qué hace: Captura el lienzo canvas de planes familiares e inicializa su gráfico de dona.
    // Por qué existe: Permite al supervisor ver la proporción de planes aprobados, rechazados y pendientes.
    // Qué problema resuelve: Reemplaza las métricas numéricas planas por una representación circular interactiva.
    const estadosPlanFamiliar = document.getElementById('estadosPlanFamiliar');
    if (dashBoardSup && estadosPlanFamiliar) {
        canva.dona(estadosPlanFamiliar, "Estados de plan familiar", "Aprobados", "Rechazados", "Pendientes", 
            dashBoardSup.approved_plans, dashBoardSup.rejected_plans, dashBoardSup.pending_plans);
    }

    // -------------------------------------------------------------
    // RENDERIZADO DE GRÁFICOS DEL SISTEMA Y USUARIOS (ADMINISTRADOR)
    // -------------------------------------------------------------
    // Qué hace: Valida la existencia del objeto del administrador para proceder al renderizado de sus 3 gráficos.
    // Por qué existe: Previene caídas del script si por algún motivo la auditoría del administrador falla en red.
    // Qué problema resuelve: Garantiza el aislamiento de fallos para mantener operativa la visualización de planes.
    if (dashBoardAdmin) {
        const canvaEstadoUsuario = document.getElementById('canvaEstadoUsuario');
        const canvaRoles = document.getElementById('canvaRoles');
        const canvaCatalogoEstados = document.getElementById('canvaCatalogoEstados');
        
        const { monthly_changes, rols, summary } = dashBoardAdmin;

        // Qué hace: Crea el gráfico de dona de estado de cuentas (Activos, Inactivos, Pendientes).
        // Por qué existe: Permite analizar la proporción de cuentas activas versus solicitudes pendientes.
        // Qué problema resuelve: Simplifica la lectura analítica sobre el estado de cuentas en el sistema.
        if (canvaEstadoUsuario && summary) {
            canva.dona(canvaEstadoUsuario, "Estados de Usuario", "Activos", "Inactivos", "Pendientes", 
                summary.active, summary.inactive, summary.request);
        }

        // Qué hace: Crea el gráfico de barras sobre la cantidad de voluntarios y supervisores.
        // Por qué existe: Muestra de forma rápida la relación cuantitativa entre los dos roles principales.
        // Qué problema resuelve: Representa visualmente la dotación del equipo del proyecto.
        if (canvaRoles && rols) {
            canva.barra(canvaRoles, "Usuarios por Rol", "Voluntarios", "Supervisor", 
                rols.volunteer, rols.supervisor);
        }

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