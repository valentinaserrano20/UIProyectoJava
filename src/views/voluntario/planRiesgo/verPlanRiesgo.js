/**
 * Controlador: Listar y Gestionar Factores de Riesgo (verPlanRiesgo.js)
 * Fetcher asíncrono para renderizar las tarjetas de cada amenaza registrada 
 * en el entorno de la familia. Permite eliminar y abrir modal de detalles avanzados.
 */
import * as api from "../../../helpers/api";
import * as alerta from "../../../helpers/alertas";
import * as modalFactorRiesgo from "../../../helpers/modales/factorRiesgo";
import paginacion from "../../../helpers/paginacion";

export default async () => {

    // Nodos Interfaz Nav Superior
    const crear = document.getElementById("crear"); // Redirige a Nuevo
    const botonBack = document.getElementById("botonBack"); // Regresa a Menu Principal
    const id = location.hash.split("=")[1]; // PK Plan Familiar DB ID
    
    // Contenedor Inyección Grilla Dom
    const contenedor = document.querySelector(".container__paginas");

    const esSupervisor = location.hash.includes("/supervisor/");

    // Concurrency Lock Avoid Double clicks
    if (window.procesoPeticion === undefined) window.procesoPeticion = true;
    window.procesoPeticion = true;

    // Acción Volver atrás
    botonBack.onclick = () => {
        if (window.procesoPeticion) return;
        if (esSupervisor) {
            location.href = `#/supervisor/plan_familiar/familia?id=${id}`;
        }
        location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
    };

    // Acción redirigir Crear factor de riesgo
    crear.addEventListener("click", () => {
        location.href = `#/voluntario/plan_familiar/factores_de_riesgo/crear?id=${id}`;
    });

    const mensajeVacio = "No tienes ningun factor de riesgo registrado en la familia...";

    /**
     * Componente UI Card Factory Riesgo 
     * Inyecta HTML plano construyendo el layout de información.
     */
    const carta = async (info) => {

        const div = document.createElement("div");
        div.classList.add("verRiesgos"); // Reutilización diseño Tarjetas CSS

        // Pintado Tarjeta Informativa Base del Riesgo (Tipo, Ubicación, Distancia)
        div.innerHTML = `
            <div class="verRiesgos__tipoRiesgo">
                <i class="ri-error-warning-line"></i>${info.threat_type_name}
            </div>
            <div class="verRiesgos__ubicacion">
                <i class="ri-map-2-line"></i>${info.ubication}
            </div>
            <div class="verRiesgos__distancia">
                <i class="ri-map-pin-line"></i>${info.distance} m
            </div>
            <div class="verRiesgos__descripcion">
                <p>Descripción:</p>${info.description}
            </div>
            <button class="boton boton--azul verRiesgos__boton--editar" data-id="${info.id}">Editar</button>
            <button class="boton boton--azul verRiesgos__boton--eliminar" data-id="${info.id}">Eliminar</button>
            <button class="boton verRiesgos__boton--verMas" data-id="${info.id}">Ver más</button>
        `;

        return div;
    };

    /**
     * HELPER Paginate Fetch: Limpia el Grid e invoca la API pasandole 'carta' para parsear. 
     */
    const recargarContainer = async () => {
        contenedor.innerHTML = "";
        await paginacion(`factoresRiesgo/planFamiliar/${id}`, mensajeVacio, carta);
    };

    // DELEGADOR MAESTRO Contenedor Grid Virtual (Event Bubbling Listener)
    contenedor.addEventListener("click", async (e) => {

        const boton = e.target.closest("button"); // Caza solo elements 'button'
        if (!boton) return;

        const riskId = boton.dataset.id; // DB PK Extraído HTML Attr

        // Branch 1: Modificar/Anexar Elemento Riesgo
        if (boton.classList.contains("verRiesgos__boton--editar")) {
            // URL Mapeada con IDs csv (Plan y Riesgo Target)
            if(esSupervisor){
                location.href = `#/supervisor/plan_familiar/factores_de_riesgo/editar?familia_id=${id}&riesgo_id=${riskId}`;
            }
            location.href = `#/voluntario/plan_familiar/factores_de_riesgo/editar?familia_id=${id}&riesgo_id=${riskId}`;
        }

        // Branch 2: Borrar Riesgo Base (Backend ejecutará cascada con vulnerabilidades y acciones asociadas) 
        if (boton.classList.contains("verRiesgos__boton--eliminar")) {
            
            // Sweet alert Warning UI Doble Confirmación
            const confirmacion = await alerta.alertaQuest(
                "¿Seguro que deseas eliminar este factor de riesgo?"
            );

            if (!confirmacion.isConfirmed) return;

            // Rest DELETE DB Execution Target Entity
            const eliminado = await api.delet(`factoresRiesgo/${riskId}`);

            if (eliminado.success) {
                await alerta.alertaOK(eliminado.message);
                await recargarContainer(); // Auto Sync DOM Front 
            } else {
                alerta.alertaError(eliminado.message);
            }
        }

        // Branch 3: Lanza SubRutina Ver detalles completos sweetalert Helper global (ReadOnly de Relaciones Acción y Vulnerab)
        if (boton.classList.contains("verRiesgos__boton--verMas")) {
            modalFactorRiesgo.ver(riskId);
        }
    });

    // AutoBoot First Fetch Render Grid Container list
    await recargarContainer();
};