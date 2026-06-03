/**
 * Controlador: Listar y Gestionar Recursos Disponibles (verPlanRecurso.js)
 * Renderiza de forma asíncrona un listado paginado de los recursos comunitarios / servicios 
 * de emergencia más cercanos a la vivienda de la familia (Hospital, Bomberos, etc).
 */
import * as api from "../../../helpers/api";
import * as alerta from "../../../helpers/alertas";
import * as modalRecursoDisponible from "../../../helpers/modales/recursoDisponible";
import paginacion from "../../../helpers/paginacion";

export default async () => {

    // Nodos Botonera Top UI
    const crear = document.getElementById("crear"); // Redirige a Nuevo
    const botonBack = document.getElementById("botonBack"); // Regresa al Menu Familiar
    const id = location.hash.split("=")[1]; // Extractor de Primary Key Family Plan ID 
    
    // Contenedor Inyección Helper Paginador Visual
    const contenedor = document.querySelector(".container__paginas");

    // Concurrency Local Block prevent Spams
    if (window.procesoPeticion === undefined) window.procesoPeticion = true;
    window.procesoPeticion = true;

    // Retorno Dash FAmiliar
    botonBack.onclick = () => {
        if (window.procesoPeticion) return;
        location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
    };

    // Redirección Crear
    crear.addEventListener("click", () => {
        location.href = `#/voluntario/plan_familiar/recursos/crear?familia_id=${id}`;
    });

    const mensajeVacio = "No tienes ningun recurso registrado en la familia...";

    /**
     * Helper Component Builder: Molde html inyectable para el Grid View.
     * Recibe JSON DTO de DB y spit HTML Div Node.
     * Nota: Recicla las clases CSS "verRiesgos" originalmente pensadas para otro modulo por simplicidad UI.
     */
    const carta = async (info) => {
        const div = document.createElement("div");
        div.classList.add("verRiesgos"); // Re-uso de Estilos de Tarjeta genérica

        // Maquetación Tarjeta Informativa
        div.innerHTML = `
            <div class="verRiesgos__tipoRiesgo">
                <i class="ri-error-warning-line"></i>${info.resource_name}
            </div>
            <div class="verRiesgos__ubicacion">
                <i class="ri-map-2-line"></i>${info.location}
            </div>
            <div class="verRiesgos__distancia">
                <i class="ri-map-pin-line"></i>${info.distance} m
            </div>
            <div class="verRiesgos__descripcion">
                <p>Descripción:</p>${info.service} - ${info.description}
            </div>
            <button class="boton boton--azul verRiesgos__boton--editar" data-id="${info.id}">Editar</button>
            <button class="boton boton--azul verRiesgos__boton--eliminar" data-id="${info.id}">Eliminar</button>
            <button class="boton verRiesgos__boton--verMas" data-id="${info.id}">Ver más</button>
        `;

        return div;
    };

    /**
     * Disparador Global Helper 'Paginacion' -> Fetch endpoint GET list and auto render pages.
     */
    const recargarContainer = async () => {
        contenedor.innerHTML = ""; // Limpiar Virtual DOM Container
        await paginacion(`recursosDisponibles/planFamiliar/${id}`, mensajeVacio, carta);
    };

    // DELEGADOR GLOBAL Eventos Botones Tarjetas (Optimización Performance N-1)
    contenedor.addEventListener("click", async (e) => {

        const boton = e.target.closest("button"); // Caza solo clicks tipo Elemento HTML Boton
        if (!boton) return;

        const resourceId = boton.dataset.id; // DB PK Extraida de Atributo del Html

        // Branch Editar Recurso
        if (boton.classList.contains("verRiesgos__boton--editar")) {
            location.href = `#/voluntario/plan_familiar/recursos/editar?familia_id=${id}&recurso_id=${resourceId}`;
        }

        // Branch Eliminar Físicamente
        if (boton.classList.contains("verRiesgos__boton--eliminar")) {
            
            // Auto Confirmator UI Security
            const confirmacion = await alerta.alertaQuest(
                "¿Seguro que deseas eliminar este recurso?"
            );

            if (!confirmacion.isConfirmed) return;

            // Exec HTTP DELETE
            const eliminado = await api.delet(`recursosDisponibles/${resourceId}`);

            if (eliminado.success) {
                await alerta.alertaOK(eliminado.message);
                await recargarContainer(); // Auto Refresh Vista local (desaparece)
            } else {
                alerta.alertaError(eliminado.message);
            }
        }

        // Branch Ver Detalle Amplio en Popup Modal
        if (boton.classList.contains("verRiesgos__boton--verMas")) {
            modalRecursoDisponible.ver(resourceId);
        }
    });

    // AutoBoot First Fetch
    await recargarContainer();
};