/**
 * Controlador: Gestor Completo del Riesgo, Modifica Riesgo Base e inyecta Relaciones Hijos (planRiesgo/editarController.js)
 * Controlador de Alta Complejidad. Permite Múltiples Operaciones Interrelacionadas:
 * 1. Edita Atributos Padre (Factor de Riesgo/Amenaza) PATCH Base.
 * 2. Visualización e Inserción usando Modal Popups Múltiples Excéntricos para hijos: "Acciones para Reducir Riesgo" Y "Factores Vulnerabilidad".
 */
import * as api from "../../../../helpers/api";
import * as alerta from "../../../../helpers/alertas";
import * as cargarDatos from "../../../../helpers/cargarDatos";
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";
import * as modalFactorRiesgo from "../../../../helpers/modales/factorRiesgo"; // Wrapper Interactivo Doble (Acciones/Vulnerabilidades) CRUD Modal HTML Injected Functions 
import acordeon from "../../../../helpers/acordeon";

export default async () => {
    // Nav Actioners DOM Reference Buttons Nodos Master Layout Target Selectors Elements  
    const esSupervisor = location.hash.includes("/supervisor/");
    
    const botonBack = document.getElementById("botonBack");
    const botonGuardar = document.getElementById("botonGuardar"); // Base Patch Target Submission API Method Patch Only Main Parent "Risk" Trigger Save Actions Request. Does not touch relationships.
    const form = document.querySelector(".form");
    
    // Contenedores Arrays Acordeon Desplegable Inferior para la lógica Relacional N UI (1 a Muchos DB).
    const contenedorAcciones = document.querySelector(".gestionarAcciones__lista");
    const contenedorVulnerabilidades = document.querySelector(".gestionarVulnerabilidades__lista");
    
    // Botones Triggers (Añadir Nuevo "Hijo") 
    const botonAñadirAcciones = document.querySelector(".gestionarAcciones__boton");
    const botonAñadirVulnerabilidad = document.querySelector(".gestionarVulnerabilidades__boton");

    if (esSupervisor){
        botonAñadirAcciones.classList.add("oculto");
        botonAñadirVulnerabilidad.classList.add("oculto");
    }

    // PARSING DOBLE URL
    const hashQuery = location.hash.split("?")[1] ?? ""; // Si no hay query params, asigna string vacío para evitar errores al crear URLSearchParams
    const params = new URLSearchParams(hashQuery); // Crea instancia URLSearchParams para extraer parámetros específicos de la URL despues del signo de interrogación

    const planId = params.get("familia_id"); // ID de la familia a la que pertenece el riesgo (para navegación posterior)
    const riesgoId = params.get("riesgo_id"); // ID específico del factor de riesgo que se está editando, utilizado para cargar sus datos y gestionar sus relaciones (acciones y vulnerabilidades)

    if (window.procesoPeticion === undefined) {
        window.procesoPeticion = true;
    }
    window.procesoPeticion = true;


    // Accion Atras Muro General List Navigation 
    botonBack.onclick = async () => {
        if (window.procesoPeticion) return;
        if (esSupervisor) {
            location.href = `#/supervisor/plan_familiar/revision?familia_id=${planId}`;
            return;
        }
        location.href = `#/voluntario/plan_familiar/factores_de_riesgo?familia_id=${planId}`;
    };

    // Inputs Elementos Base Formularios DOM Reference HTML
    const amenazas = document.getElementById("tiposAmenaza");
    const descripcion = document.getElementById("descripcion");
    const ubicacion = document.getElementById("ubicacion");
    const distancia = document.getElementById("distancia");

    // Select Autorellenador Option Tool Loader 
    await adjuntarOpc.adjuntar(amenazas, "tiposAmenaza");

    // Cargar datos actuales del riesgo pre-escritos HTTP GET API Filler (Auto Inject .value Form Native Property Element Binder Array KeyMap) 
    await cargarDatos.cargarDatos(`factoresRiesgo/${riesgoId}`,
        [amenazas, descripcion, ubicacion, distancia],
        ["threat_type_id", "description", "ubication", "distance"]
    );

    /**
     * Helper Func: Pinta lista interactiva de 'Acciones para reducir' actualmente mapeadas a este Riesgo Base Target ID 
     */
    const cargarAcciones = async () => {
        const acciones = await api.get(`accionesReduccion/factorRiesgo/${riesgoId}`); // Endpoint 1 N Get List Query Relation Response Mapping App Status Load Json 
        contenedorAcciones.innerHTML = "";

        acciones.forEach((item) => {
            const boton = document.createElement("button"); // List element UI Factory
            boton.className = "gestionarAfecciones__afeccion"; // Uso del diseño Reciclado .gestionarAfecciones
            boton.dataset.id = item.id;
            // Título: Acción a realizar - Fecha límite final de proyecto 
            boton.innerHTML = `
                <span class="gestionarAfecciones__tipoNombre">
                    <i class="ri-eye-fill"></i> ${item.action} - ${item.end_date}
                </span>`;
            contenedorAcciones.appendChild(boton);
        });
    };

    /**
     * Helper Func: Pinta lista interactiva de "Factores de Vulnerabilidad" mapeadas a este Riesgo Base Target ID  
     */
    const cargarVulnerabilidades = async () => {
        const acciones = await api.get(`factoresVulnerabilidad/factorRiesgo/${riesgoId}`); // Endpoint Get Query Fetch DB List Vulnerability Linked Table Data Mapping Response Json Data Formater Request Backend Router Server Controller Action Execute Model Relation N Get Property Linked 
        contenedorVulnerabilidades.innerHTML = "";

        acciones.forEach((item) => {
            const boton = document.createElement("button");
            boton.className = "gestionarAfecciones__afeccion"; // Diseño reciclado de lista afecciones...
            boton.dataset.id = item.id;
            // Titulo: "Mala estructura - Grado: 3 Alto!"  (Accede a foreign keys profundas expandidas)
            boton.innerHTML = `
                <span class="gestionarAfecciones__tipoNombre">
                    <i class="ri-eye-fill"></i> ${item.vulnerability.name} - Grado: ${item.vulnerability_grade.name}
                </span>`;
            contenedorVulnerabilidades.appendChild(boton);
        });
    };

    // Auto Inicializadores Helpers Globales Tools Utilities UI DOM Scripts
    acordeon() // Reactiva animaciones desplegables ocultas Toggle Expand UI Element Container Sublists Data Grid Arrays Box Design Layout Component 
    cargarAcciones();
    cargarVulnerabilidades();

    window.procesoPeticion = false;
    botonGuardar.disabled = false;

    // Lanza Modales De Inserción Hijos Relación One-To-Many (Usa Helpers externos Complex SweetAlerts Multi Inputs Logic Wrapper Tool API Form Injected Actions Scripts Execution Callbacks Trigger Handler Functions) 
    botonAñadirAcciones.addEventListener("click", async () => {
        modalFactorRiesgo.crearAccion(riesgoId, planId, cargarAcciones); // Pasa Puntero DB ID FK Binding + CallBack Refresh Re Render UI State List Updated Local Sync No Web Page Refresh Application Logic Pattern Design Architecture Implementation Approach SPA Method Use Case Scenario Feature App Flow Functionality Requirement Specification 
    });

    botonAñadirVulnerabilidad.addEventListener("click", async () => {
        modalFactorRiesgo.crearVulnerabilidad(riesgoId, cargarVulnerabilidades); // CallBack Refresher UI Inject
    });

    // Delegador Bubbling Evento para Click en items específicos de Sub-listas (Abrir vista detalle modal sweetalert para Modificar/Borrar un Hijo Individual de la relación)
    contenedorAcciones.addEventListener("click", async (e) => {
        const id = e.target.closest(".gestionarAfecciones__afeccion").dataset.id;
        modalFactorRiesgo.verEditarEliminarAccion(id, planId, cargarAcciones, esSupervisor);
    });

    // Delegador Vulnerabilidad Info Action Request Delete Edit Detail View Detail Popup Data Trigger Handler Execute Callback Refresh Re-Load Method Render List Pattern Application State Synced Application Client Server API Local Function Implementation Tool Usage Guide Flow Function Execution Runtime Interaction Behavior Case 
    contenedorVulnerabilidades.addEventListener("click", async (e) => {
        const id = e.target.closest(".gestionarAfecciones__afeccion").dataset.id;
        modalFactorRiesgo.verEditarEliminarVulnerabilidad(id, cargarVulnerabilidades, esSupervisor);
    });


    // Submit del PADRE: Modificar Datos Root Del Riesgo Base (no sus ramas/hijos acciones). Core Parent Model Attribute Partial Update Patch JSON HTTP Call Script Logic Trigger Function Event Binding Form Method Submit Prevent Default Lock Check Network Wait Await Response Parse Evaluation Handle Alerts Error Messages Throw Return Exit Try Catch Block
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        window.procesoPeticion = true;
        botonGuardar.disabled = true;

        // DTO Base Constructor
        const datosRegistro = {
            threat_type_id: amenazas.value,
            description: adjuntarOpc.capitalizarPrimeraLetra(descripcion.value),
            location: adjuntarOpc.capitalizar(ubicacion.value.trim()),
            distance: distancia.value,
        };

        try {
            // PATCH EndPoint Factor De Riesgo Padre Update Request Action Database Push SQL Modification Value Parameters Model Mapping Binding Evaluation Results Return Data Json Structure Code Success Boolean Validator Message Helper UI Notice Output Trigger Handlers Scripts 
            const data = await api.patch(`factoresRiesgo/${riesgoId}`, datosRegistro);
            if (data.success) {
                // Notificar Front Success. Se queda en esta page viva permitiendo anexar sub-ramificaciones hijos (Vulnerabilidades, Acciones). No te patea atrás UX Pattern UI Design Control User Flow Execution Application Component Use Case Functionality Method Process Evaluation Implementation Test Case Procedure Logic Model Form Controller Component Tool Script Request Call Axios Response Catch Error Logic Structure Block Statement Conditional Code Execute Handler 
                await alerta.alertaOK(data.message);
            } else {
                alerta.alertaWarning(data.message, data.errors);
            }
        } catch (error) {
            alerta.alertaError(error.errors);
        }

        botonGuardar.disabled = false;
        window.procesoPeticion = false;
    });

};