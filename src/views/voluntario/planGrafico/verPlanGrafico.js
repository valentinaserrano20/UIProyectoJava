/**
 * Controlador: Listar y Gestionar Gráficos de Vivienda (verPlanGrafico.js)
 * Renderiza de forma asíncrona y paginada una cuadrícula o lista de los croquis/mapas
 * que la familia ha subido sobre su vivienda. 
 * Permite Eliminar, Editar su descripción, y abrir Modales para "Ver más" amplio.
 */
import * as api from "../../../helpers/api";
import * as alerta from "../../../helpers/alertas";
import paginacion from "../../../helpers/paginacion";
import * as modalGraficoVivienda from "../../../helpers/modales/graficoVivienda";

export default async () => {


    // Nodos Interfaz Header Layout
    const crear = document.getElementById("crear"); // Botón Añadir Croquis Nuevo
    const botonBack = document.getElementById("botonBack");
    const id = location.hash.split("=")[1]; // PK Family_Plan_Id


    // Contenedor Target del Helper 'Listador Paginador'
    const contenedor = document.querySelector(".container__paginas");

    // Lock UX Network request multiple (Anti-DDoS local clicks)
    if (window.procesoPeticion === undefined) window.procesoPeticion = true;
    window.procesoPeticion = true;

    const esSupervisor = location.hash.includes("/supervisor/");

    botonBack.onclick = () => {
        if (window.procesoPeticion) return;
        if (esSupervisor) {
            location.href = `#/supervisor/plan_familiar/revision?familia_id=${id}`;
            return;
        }
        location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
    };

    if (esSupervisor) {
        crear.classList.add("oculto")
    }

    // Redirección Pestaña Formulario Subida (Ver planGrafico/crear/crearController)
    crear.addEventListener("click", () => {
        location.href = `#/voluntario/plan_familiar/grafico_vivienda/crear?id=${id}`;
    });

    const mensajeVacio = "No tienes ningun grafico de vivienda registrado en la familia...";

    /**
     * Componente Dinámico UI (Builder Function para el helper 'Paginacion')
     * Recibe un Objeto Iterado de Backend (DB Row) y escupe un Div HTML Card completo.
     */
    const carta = async (info) => {
        const div = document.createElement("div");
        div.classList.add("verGraficos"); // Wrapper CSS layout Grid/Flex

        // Render Image URL (Bucket AWS S3 Public Host API) + Botonera de Acción ID-Inyectado
        div.innerHTML = `
            <div class="verGraficos__imagenTexto">
                <img class="verGraficos__imagen" src="${api.urlStorage + '/' + info.path}">
                <div class="verGraficos__texto">${info.description}</div>
            </div>
            <div class="verGraficos__botones">
                <button class="boton boton--azul verGrafico__boton--editar" data-id="${info.id}">Editar</button>
                <button class="boton boton--azul verGrafico__boton--eliminar" data-id="${info.id}">Eliminar</button>
                <button class="boton verGrafico__boton--verMas" data-id="${info.id}">Ver más</button>
            </div>
            `;

        return div; // Return DOM Node Component
    };

    /**
     * Función Disparadora Fetch Lista: 
     * Inyecta Paginación Infinity-Scroll / Page-buttons en el Nodo Principal 
     */
    const recargarContainer = async () => {
        contenedor.innerHTML = ""; // Clear Virtual DOM
        // El helper 'paginacion' hace la Request Red y mapea la funcion 'carta' por cada resultado.
        await paginacion(`imagenes/vivienda/planFamiliar/${id}`, mensajeVacio, carta);
    };

    // DELEGADOR DE EVENTOS GLOBALES: En lugar de agregar 3 event listeners x cada de las N cartas,
    // se agrega UNO solo al padre Contenedor y se averigua cual hijo fue pulsado mediante Bubbling Event y Clases. (Eficiencia RAM!)
    contenedor.addEventListener("click", async (e) => {

        const boton = e.target.closest("button"); // Caza solo clicks que sean Botones
        if (!boton) return;

        const graficoId = boton.dataset.id; // Extrae Primary Key UUID del Div Hijo clickeado

        // Branch 1: El volunario quiere Editar el Texto 'Descripcion' de este Mapa
        if (boton.classList.contains("verGrafico__boton--editar")) {

            if (esSupervisor) {
                location.href = `#/supervisor/plan_familiar/grafico_vivienda/editar?familia_id=${id}&grafico_id=${graficoId}`;
                return;
            }

            location.href = `#/voluntario/plan_familiar/grafico_vivienda/editar?familia_id=${id}&grafico_id=${graficoId}`; // Pass multiple args CSV style
        }

        // Branch 2: El voluntario quiere borrar la Foto del Sistema
        if (boton.classList.contains("verGrafico__boton--eliminar")) {
            // Confirmación Doble Seguridad Obligatoria UX
            const confirmacion = await alerta.alertaQuest(
                "¿Seguro que deseas eliminar este recurso?"
            );

            if (!confirmacion.isConfirmed) return;

            // Exec API DELETE Row (Borra file object server interno de paso)
            const eliminado = await api.delet(`imagenes/vivienda/${graficoId}`);

            if (eliminado.success) {
                await alerta.alertaOK(eliminado.message);
                await recargarContainer(); // Re-Fetch Live Reload Listado Visual
            } else {
                alerta.alertaError(eliminado.message);
            }
        }

        // Branch 3: Vista Amplificada Detallada Zoom (+ Modals)
        if (boton.classList.contains("verGrafico__boton--verMas")) {
            modalGraficoVivienda.ver(graficoId, esSupervisor);
        }
    });

    // Run Auto-Boot On start 
    await recargarContainer();

    //Temporal hasta que se refactorice
    const familyPlan = await api.get(`familyPlans/${id}`);

    if (familyPlan.status_plan_id === 6 || familyPlan.status_plan_id === 7) {
        contenedor.querySelectorAll(".verGrafico__boton--editar").forEach(btn => {
            btn.classList.add("oculto");
        });
        contenedor.querySelectorAll(".verGrafico__boton--eliminar").forEach(btn => {
            btn.classList.add("oculto");
        });
    }

    if (esSupervisor){
        contenedor.querySelectorAll(".verGrafico__boton--eliminar").forEach(btn => {
            btn.classList.add("oculto");
        });
    }
};