/**
 * Controlador: Gestión de Usuarios (gestionController.js)
 * Responsable de listar todos los usuarios registrados en el sistema.
 * Usa carga directa (sin paginación) y muestra las tarjetas en un grid de 3 columnas.
 * Invoca el modalUsuario para visualizar los detalles de cada miembro.
 */
import * as alerta from "../../../../helpers/alertas";
import * as api from "../../../../helpers/api";
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
    // Qué problema resuelve: Identifica al usuario que realiza la consulta de usuarios en la barra lateral.
    const nombre = localStorage.getItem("full_name");
    const labelNombre = document.getElementById("nombreUsuarioSidebar");
    if (labelNombre && nombre) {
        labelNombre.textContent = nombre;
    }
    
    // Contenedor dinámico principal donde se incrustarán las Cards de usuarios en grid
    const contenedor = document.querySelector(".container__paginas");

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

    // Mensaje que se muestra cuando no hay usuarios registrados
    const mensajeVacio = "No hay usuarios registrados en el sistema";

    // Función Helper para limpiar contenido y recargar la lista completa
    // Se invoca después de cualquier acción en el modal (editar, cambiar rol, etc.)
    const recargarContainer = async () => {
        contenedor.innerHTML = ""; // Limpieza del contenedor previo

        try {
            // Petición al endpoint /api/usuarios/todos que retorna el array JSON completo sin paginación
            const datos = await api.get("usuarios/todos");

            // Si no hay datos, muestra el mensaje de vacío
            if (!datos || datos.length === 0) {
                contenedor.innerHTML = `<div class="noCantidad">${mensajeVacio}</div>`;
                window.procesoPeticion = false;
                return;
            }

            // Itera sobre cada registro y crea su tarjeta visual
            for (const info of datos) {
                // Delega la construcción de la tarjeta al componente tarjeta_gestionSupervisor.js
                const cartaInfo = await tarjetaEstados(info);
                // Inserta la tarjeta en el grid
                contenedor.appendChild(cartaInfo);
            }
        } catch (error) {
            console.error("Error al cargar voluntarios:", error);
            contenedor.innerHTML = `<div class="noCantidad">Error al cargar los usuarios</div>`;
        }

        window.procesoPeticion = false;
    };

    // Escucha pasiva delegada al contenedor padre (Técnica Event Delegation optimizada RAM)
    contenedor.addEventListener("click", async (e) => {

        // Verifica si el clic recayó exacto sobre, o dentro (Span/icon), de una tarjeta
        const tarjetaClickeada = e.target.closest(".tarjeta");
        if (!tarjetaClickeada) return; // Rompe si tocó pared vacía

        // Recuperar Meta-ID guardado en tiempo de inyección (data-id)
        const userId = tarjetaClickeada.dataset.id;

        console.log("USER ID", userId);

        // Lanza función "Ver" contenida en "modales/usuario.js" pasando 
        // la ID identificadora, el refresco padre y el modo de usuario supervisor.
        // Habilitamos la bandera esAdmin (cuarto parámetro en true) para dar permisos de gestión completos.
        modalUsuario.ver(userId, recargarContainer, false, true);
    });

    // Arranque de rutina nativo al desplegar esta vista la primera vez
    await recargarContainer();
};