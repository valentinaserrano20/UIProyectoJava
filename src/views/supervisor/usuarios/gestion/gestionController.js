/**
 * Controlador: Gestión de Usuarios Activos (gestionController.js)
 * Responsable de listar y paginar a todos los voluntarios bajo el cargo del supervisor.
 * Usa el helper de Paginación para crear cartas dinámicas e invoca el modalUsuario 
 * para visualizar los detalles de cada miembro.
 */
import * as alerta from "../../../../helpers/alertas";
import * as api from "../../../../helpers/api";
import paginacion from "../../../../helpers/paginacion";
import * as modalUsuario from "../../../../helpers/modales/usuario";
import { tarjetaEstados } from "../../../../componentes/tarjetas/tarjeta_gestionSupervisor";

export default async () => {

    // Extrae apuntadores a los botones de navegación generales
    const botonBack = document.getElementById("botonBack");

    // -------------------------------------------------------------
    // BLOQUE DE PERFIL EN SIDEBAR
    // -------------------------------------------------------------
    // Qué hace: Obtiene el nombre completo del usuario de sesión de localStorage y lo asigna a la sidebar.
    // Por qué existe: Asegura la consistencia del menú lateral mostrando la identidad del usuario logueado.
    // Qué problema resuelve: Identifica al usuario que realiza la consulta de voluntarios en la barra lateral.
    const nombre = localStorage.getItem("full_name");
    const labelNombre = document.getElementById("nombreUsuarioSidebar");
    if (labelNombre && nombre) {
        labelNombre.textContent = nombre;
    }
    
    // Contenedor dinámico principal donde se incrustarán las Cards de usuarios paginados
    const contenedor = document.querySelector(".container__paginas");
    const tarjeta = document.querySelector(".tarjeta");

    // Prevención de clics múltiples bloqueando interacción si la red está operando
    if (window.procesoPeticion === undefined) {
        window.procesoPeticion = false;
    }
    window.procesoPeticion = false;

    // Regla global retroceder al hub Dashboard del supervisor
    botonBack.onclick = () => {
        if (window.procesoPeticion) return;
        location.href = `#/supervisor/`;
    };

    // Fallback string para el helper de paginación
    const mensajeVacio = "No hay ninguna peticion de activacion";


    // Función Helper delegada a la clase UI para limpiar rastros y rehacer peticiones (Actualizar lista post-modal)
    const recargarContainer = async () => {
        contenedor.innerHTML = ""; // Barrido
        
        // Petición al endpoint "userForSupervisor" encargada de los filtros, emitiendo objeto Paginated JSON 
        await paginacion(`users`, mensajeVacio, tarjetaEstados);
    };

    // Escucha pasiva delegada al contenedor padre (Técnica Event Delegation optimizada RAM)
    contenedor.addEventListener("click", async (e) => {

        // Verifica si el clic recayó exacto sobre, o dentro (Span/icon), de un <button> HTML
        const tarjetaClickeada = e.target.closest(".tarjeta");
        if (!tarjetaClickeada) return; // Rompe si tocó pared vacía

        // Recuperar Meta-ID guardado en tiempo de inyección (data-id)
        const userId = tarjetaClickeada.dataset.id;

        console.log("USER ID", userId);
        

        // Lanza función "Ver" contenida en "modales/usuario.js" pasando 
        // la ID identificadora, el refresco padre y el modo de usuario supervisor.
        // El supervisor debe ver activar/desactivar.
        modalUsuario.ver(userId, recargarContainer, false, false);
    });

    // Arranque de rutina nativo al desplegar esta vista la primera vez
    await recargarContainer();
};