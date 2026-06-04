/**
 * Controlador: Gestión Global de Usuarios (gestionController.js)
 * Permite al perfil Administrador listar, buscar y visualizar a todos los
 * usuarios del sistema (exceptuando pendientes). Se apoya en el helper de
 * paginación y despliega el modal interactivo de usuario.
 */
import * as alerta from "../../../../helpers/alertas";
import * as api from "../../../../helpers/api";
import paginacion from "../../../../helpers/paginacion";
import * as modalUsuario from "../../../../helpers/modales/usuario";

export default async () => {

    const botonBack = document.getElementById("botonBack");
    const contenedor = document.querySelector(".container__paginas");

    if (window.procesoPeticion === undefined) {
        window.procesoPeticion = false;
    }
    window.procesoPeticion = false;

    botonBack.onclick = () => {
        if (window.procesoPeticion) return;
        location.href = `#/administrador/`;
    };

    const mensajeVacio = "No hay ninguna peticion de activacion";

    const carta = async (info) => {

        const div = document.createElement("div");
        div.classList.add("verUsuario");

        const rolClase =
            info.state_user_id != 2
                ? info.rol == "Supervisor"
                    ? "verUsuario__rol--supervisor"
                    : "verUsuario__rol--voluntario"
                : "verUsuario__rol--desactivado";

        div.innerHTML = `
            <div class="verUsuario__documento">
                <i class="ri-id-card-line"></i>${info.document_number}
            </div>

            <div class="verUsuario__rol ${rolClase}">
                <span>${info.rol} - ${info.state_user}</span>
            </div>

            <div class="verUsuario__nombre">
                <i class="ri-jewelry-line"></i>${info.full_name}
            </div>

            <div class="verUsuario__correo">
                <i class="ri-mail-line"></i>${info.email}
            </div>

            <div class="verUsuario__seccional">
                <i class="ri-team-line"></i>${info.sectional}
            </div>

            <div class="verUsuario__organizacion">
                <i class="ri-parent-line"></i>${info.organization}
            </div>

            <div class="verUsuario__botones">
                <button class="boton boton--azul verUsuario__botonPeticion"
                        data-id="${info.id}">
                    Ver informacion
                </button>
            </div>
        `;

        return div;
    };

    const recargarContainer = async () => {
        contenedor.innerHTML = "";
        await paginacion(`usuarios/administrador`, mensajeVacio, carta);
    };

    contenedor.addEventListener("click", async (e) => {

        const boton = e.target.closest("button");
        if (!boton) return;

        if (!boton.classList.contains("verUsuario__botonPeticion")) return;

        const userId = boton.dataset.id;

        // 👇 Le pasamos la función limpia al modal
        modalUsuario.ver(userId, recargarContainer, false, true);
    });

    // 👇 Primera carga
    await recargarContainer();
};