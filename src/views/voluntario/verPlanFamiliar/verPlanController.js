/**
 * Controlador Principal: Dashboard de Planes Familiares del Voluntario (verPlanController.js)
 * Renderiza la pantalla principal del Voluntario ("Mis Planes") usando paginación.
 * Muestra el estado de cada plan (En Progreso, Aprobado, Rechazado) con colores distintivos.
 * Contiene lógica condicional de enrutamiento basada en el Rol del usuario (Voluntario vs Supervisor).
 */
import { cardPlanFamiliar } from "../../../componentes/cards/planFamiliarCard";
import { dropdownFiltro } from "../../../componentes/filter/dropdown";
import { searchBar } from "../../../componentes/filter/searchBar";
import * as api from "../../../helpers/api";
import paginacion from "../../../helpers/paginacion";

export default async () => {
  // Referencias DOM
  const botonBack = document.getElementById("botonBack");
  const contenedor = document.querySelector(".container__paginas"); // Grid Wrapper Main

  // encontrar contenedor donde van los filtros
  const contenedorFiltro = document.querySelector(".container__filtro");

  const searchBarFiltro = (event) => {
    filtroBusqueda = event.target.value.trim();
    renderPlanes();
  };

  const searchbar = await searchBar(searchBarFiltro);
  const dropdown = await dropdownFiltro(true);

  contenedorFiltro.append(searchbar);
  contenedorFiltro.append(dropdown);

  if (window.procesoPeticion === undefined) window.procesoPeticion = false;
  window.procesoPeticion = false;

  //

  // Extracción de Token de Autorización LocalStorage (1 Admin, 2 Supervisor, 3 Voluntario)
  const rolId = localStorage.getItem("role_id");

  const esSupervisor = location.hash.includes("supervisor");
  const base = esSupervisor ? "supervisor" : "voluntario";

  // Lógica dinámica Botón Atrás (Si entra un supervisor a mironear, que lo devuelva a su casa)
  botonBack.onclick = () => {
    if (window.procesoPeticion) return;
    // location.href = rolId == 3 ? `#/voluntario` : `#/supervisor`;
    location.href = `#/${base}`;
  };

  const mensajeVacio = "No tienes ningun plan familiar realizado.";

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

    const planesFiltrados = todosLosPlanes.filter((plan) => {
      let pasaEstado = true;
      if (filtroEstado !== 0) {
        // -------------------------------------------------------------
        // LOGICA DE FILTRADO PARA EL LISTADO DE PLANES DEL VOLUNTARIO
        // -------------------------------------------------------------
        // Qué hace: Evalúa las condiciones para cada opción de filtro seleccionada.
        // Por qué existe: Mapea las opciones del dropdown a las condiciones de datos reales en el JSON.
        // Qué problema resuelve: Permite filtrar correctamente por borrador/pendiente (estados 2 y 3), de forma unificada, y contempla de manera conjunta los rechazos definitorios (estados 4 y 6).
        if (filtroEstado === 3) {
          // 'Por definir' -> tipo_familia_id == 3 (no ha hecho el test)
          pasaEstado = plan.family_type_id === 3;
        } else if (filtroEstado === 2) {
          // 'Pendiente' -> (estado_id == 2 o 3) y tipo_familia_id !== 3 (test hecho, no enviado)
          pasaEstado = (plan.status_id === 2 || plan.status_id === 3) && plan.family_type_id !== 3;
        } else if (filtroEstado === 4) {
          // 'Rechazado' -> estado_id == 4 (Rechazado) o 6 (Rechazado Definitivamente)
          pasaEstado = plan.status_id === 4 || plan.status_id === 6;
        } else {
          // Otros estados (Enviado: 1, Rechazado con observaciones: 5, Aprobado: 7)
          pasaEstado = plan.status_id == filtroEstado;
        }
      }

      const pasaBusqueda =
        filtroBusqueda === "" ||
        plan.last_names.toLowerCase().includes(filtroBusqueda.toLowerCase());

      return pasaEstado && pasaBusqueda; // deben cumplirse los dos
    });

    planesFiltrados.forEach((plan) => {
      contenedor.append(cardPlanFamiliar(plan));
    });
  };

  // Delegación Eventos de Click Muro Principal "Mis Planes"
  contenedor.addEventListener("click", async (e) => {
    const boton = e.target.closest("button");
    if (!boton) return;
    if (!boton.classList.contains("verPlan__boton")) return; // Solo acciona el botón inferior
    if (window.procesoPeticion) return;

    // Recupera Data-Attr embutidos en el HTML al renderizar
    const planId = boton.dataset.id;
    const status = boton.dataset.status;
    const familyTypeId = Number(boton.dataset.familyTypeId);

    // Router Inteligente de Permisos Segun el actor logueado:
    if (rolId == 1) {
      // Branch VOLUNTARIO (Autor)

      // Si el tipo de familia es 3 (Por Definir), significa que no ha realizado el test de vulnerabilidad.
      // Si ya está definida como Vulnerable (1) o No Vulnerable (2), va directo al menú de módulos.
      if (familyTypeId === 3) {
        location.href = `#/voluntario/plan_familiar/testVunerabilidad?id=${planId}`;
      } else {
        // Si ya pasó el test, llévalo al Menu Index Hub Modules
        location.href = `#/voluntario/plan_familiar/familia?id=${planId}`;
      }
    } else if (rolId == 2) {
      // Branch SUPERVISOR (Revisor)
      // Llévalo al módulo especializado de auditoría y revisión
      location.href = `#/supervisor/plan_familiar/revision?id=${planId}`;
    }
  });

  dropdown.addEventListener("change", (e) => {
    filtroEstado = Number(e.target.value);
    renderPlanes();
  });
  cargarPlanes();
};
