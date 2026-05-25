/**
 * Controlador: Revisión de Plan Familiar (RevisionPlanController.js)
 * Facilita las acciones críticas para un Supervisor al evaluar un Plan Familiar.
 * Gestiona botones asíncronos para Aprobar, Rechazar (Definitivo/Cambios) y Ver PDF.
 */
import * as alerta from "../../../../helpers/alertas";
import * as api from "../../../../helpers/api";
import paginacion from "../../../../helpers/paginacion";
import { dropdownFiltro } from "../../../../componentes/filter/dropdown"
import { searchBar } from "../../../../componentes/filter/searchBar"
import { ver } from "../../../../helpers/modales/integrante";
import { color } from "chart.js/helpers";

const ListadoPlanController = async () => {

    const statusPlans = await api.get(`statusPlans/`);

    const botonBack = document.getElementById("botonBack");

    const contenedor = document.querySelector(".container__paginas");

    const selectStatusCont = document.createElement("div");
    selectStatusCont.classList.add("selector--estado__cont");


    // encontrar contenedor donde van los filtros
    const contenedorFiltro = document.querySelector(".container__filtro");


    botonBack.onclick = () => {
        if (window.procesoPeticion) return;
        location.href = `#/supervisor/`;
    };


    // agregar campos de filtro

    const searchbar = await searchBar(searchBarFiltro)
    const dropdown = await dropdownFiltro()

    contenedorFiltro.append(searchbar)
    contenedorFiltro.append(dropdown)


    let filtroEstado = 0;
    let filtroBusqueda = "";
    let todosLosPlanes = [];


    const cargarPlanes = async (endpoint = "familyPlans") => {
        const paginado = await api.getPaginacion(endpoint);
        todosLosPlanes = paginado.data;
        renderPlanes(); // aplica los filtros actuales (vacíos al inicio)
    };

    const renderPlanes = () => {
        contenedor.innerHTML = "";

        const planesFiltrados = todosLosPlanes.filter(plan => {
            const pasaEstado = filtroEstado === 0 || plan.status_id == filtroEstado;
            const pasaBusqueda = filtroBusqueda === "" ||
                plan.last_names.toLowerCase().includes(filtroBusqueda.toLowerCase());

            return pasaEstado && pasaBusqueda; // deben cumplirse los dos
        });

        planesFiltrados.forEach(async (plan) => {
            contenedor.append(await carta(plan));
        });
    };


    let estadoActivo = 0;


    const mensajeVacio = "No tienes ningun plan familiar realizado.";


    const carta = async (info) => {

        const div = document.createElement("div");
        div.classList.add("tarjeta");
        console.log(info);


        //INTRODUCCION DE LA TARJETA _____________________________________________________________________________________

        const tarjetaIntroduccion = document.createElement("div");
        tarjetaIntroduccion.classList.add("tarjeta--introduccion_supervisor");

        const introduccionCont = document.createElement("div");
        introduccionCont.classList.add("tarjeta-contenido");

        const imagenIcono = document.createElement("img");
        imagenIcono.src = "../../../../public/icon/familyicon.svg";
        imagenIcono.alt = "iconofamilia";
        imagenIcono.classList.add("imagen--icono");

        const apellidoFamilia = document.createElement("div");
        apellidoFamilia.classList.add("tarjeta__titulo");
        apellidoFamilia.textContent = "Familia " + info.last_names;

        const departamento = document.createElement("div");
        departamento.classList.add("form_autorizacion");
        const ubicacionIcono = document.createElement("i");
        ubicacionIcono.classList.add("icono--pequeno", "ri-map-pin-2-line");
        departamento.append(ubicacionIcono, " " + info.department);

        const fechaRecibido = document.createElement("div");
        fechaRecibido.classList.add("form_autorizacion");
        const calendarioIcono = document.createElement("i");
        calendarioIcono.classList.add("icono--pequeno", "ri-calendar-line");
        fechaRecibido.append(calendarioIcono, " Recibido: " + info.date_create);

        const introduccionDiv = document.createElement("div");
        introduccionDiv.classList.add("introduccionDiv");

        const nombreVoluntario = document.createElement("div");
        nombreVoluntario.classList.add("form_autorizacion");
        const voluntarioIcono = document.createElement("i");
        voluntarioIcono.classList.add("icono--pequeno", "ri-user-line");
        nombreVoluntario.append(voluntarioIcono, "Voluntario: ", info.responsable);


        introduccionCont.append(apellidoFamilia, departamento, fechaRecibido, nombreVoluntario);

        introduccionDiv.append(imagenIcono, introduccionCont);

        tarjetaIntroduccion.append(introduccionDiv);

        const estadoTipoCont = document.createElement("div");
        estadoTipoCont.classList.add("verPlan__tipo--estado");

        const estadoClase =
            info.status_id == 3 ? "verPlan__estado--azul"
                : info.status_id == 4 || info.status_id == 7
                    ? "verPlan__estado--verde"
                    : info.status_id == 5 || info.status_id == 6
                        ? "verPlan__estado--rojo"
                        : ""; // Vacio por default (Asume estado 1 o 2 'En Progreso')

        const verEstado = document.createElement("p");
        verEstado.classList.add("verPlan__estado", estadoClase);

        verEstado.textContent = info.status;

        tarjetaIntroduccion.append(verEstado);

        const tipoClase = info.family_type_id == 1 ? "verPlan__tipo--rojo"
            : info.family_type_id == 2 ? "verPlan__tipo--verde"
                : "verPlan__tipo--gris";

        const tipoFamilia = document.createElement("p");
        tipoFamilia.classList.add("verPlan__tipo", tipoClase);
        tipoFamilia.textContent = `Familia ${info.family_type}`;

        estadoTipoCont.append(verEstado, tipoFamilia);

        tarjetaIntroduccion.append(estadoTipoCont);

        div.append(tarjetaIntroduccion);

        //BOTONES DE ACCION _____________________________________________________________________________________
        const resvisarPlan = document.createElement("button");
        resvisarPlan.classList.add("boton", "boton--height");
        resvisarPlan.textContent = "Revisar Plan";

        div.append(resvisarPlan);


        if (info.status_id === 1 || info.status_id === 2 || info.status_id === 3) {
            resvisarPlan.classList.add("oculto");

            const mensajeEstado = document.createElement("div");

            mensajeEstado.classList.add("verPlan__mensaje--estado");

            if (info.status_id === 1 || info.status_id === 2) {
                mensajeEstado.textContent = "El plan está en proceso de revisión inicial.";
            } else if (info.status_id === 3) {
                mensajeEstado.textContent = "El plan está siendo creado en este momento por el voluntario.";
            }

            div.append(mensajeEstado);
        }

        resvisarPlan.addEventListener("click", () => {
            location.href = `#/supervisor/plan_familiar/revision?familia_id=${info.id}`;
        });

        //Filtrado por estado
        switch (true) {

            case estadoActivo === 0:
                div.style.display = "";
                break;

            default:
                div.style.display = info.status_id === estadoActivo ? "" : "none";
                break;
        }

        return div; // Retorna la carta completa para ser inyectada en el DOM por el helper de paginación
    }

    const recargarContainer = async () => {
        contenedor.innerHTML = "";
        await paginacion("familyPlans", mensajeVacio, carta);
    };


    dropdown.addEventListener("change", e => {
        filtroEstado = Number(e.target.value);
        renderPlanes();
    })
    function searchBarFiltro(event) {
        filtroBusqueda = event.target.value.trim();
        renderPlanes();
    }


    await cargarPlanes();

};

export default ListadoPlanController;