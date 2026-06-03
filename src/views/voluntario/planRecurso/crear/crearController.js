/**
 * Controlador: Creador de Nuevo Recurso Disponible (planRecurso/crear/crearController.js)
 * Formulario manual para agregar Hospitales/Bomberos cercanos a la casa.
 * Usa Validadores Individuales (NO el validador automático universal) anclados a eventos del teclado (DOM).
 */
import * as api from "../../../../helpers/api";
import * as alerta from "../../../../helpers/alertas";
import * as validacion from "../../../../helpers/validacionInputs"; // Suite Validacion Explicita
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";

export default async () => {
  // Manejo de Interfaz Nodos Actioners
  const botonBack = document.getElementById("botonBack");
  const botonCrear = document.getElementById("botonCrear"); // Disparador POST Server
  const form = document.querySelector(".form");
  const id = location.hash.split("=")[1]; // PK Family Plan ID url 

  // Lock Inicial Peticion Unica Frontend
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  // Lógica Abortar Form
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return;
    const confirmacion = await alerta.alertaQuest(
      "¿Seguro que quieres volver? perderás tu progreso",
    );
    if (confirmacion.isConfirmed)
      location.href = `#/voluntario/plan_familiar/recursos?familia_id=${id}`;
  };

  // Nodos Inputs Fisicos HTML (Lectura Textos y Numeros)
  const telefono = document.getElementById("telefono");
  const descripcion = document.getElementById("descripcion");
  const distancia = document.getElementById("distancia"); // En Metros
  const ubicacion = document.getElementById("ubicacion"); // Direccion String
  
  // Selects Diccionarios Categóricos App
  const recurso = document.getElementById("recursos"); // Select Type "Bomberos, Cruz Roja.."
  const servicio = document.getElementById("servicio"); // Select Subtype

  // Magic Helper Doble Lista Enlazada Dinámica! (Actualiza selects hijos segun el padre)
  await adjuntarOpc.adjuntarDouble(recurso, "tiposRecurso",servicio,'service');

  /**
   * --- SECCIÓN LISTENER VALIDACIONES MANUALES EVENT DRIVEN "EN VIVO" ---
   * Escucha cada pulsación KeyDown y previene inyección o escritura de caracteres ilegales 
   * en los Input antes de hacer Submit.
   */
  telefono.addEventListener("keydown", (e) => {
    validacion.keyboard_limite(e, 10);
    validacion.keyboard_numero(e); // Aborta Teclado Letras string
  });
  descripcion.addEventListener("keydown", (e) => {
    validacion.keyboard_limite(e, 200);
  });
  ubicacion.addEventListener("keydown", (e) => {
    validacion.keyboard_limite(e, 100);
  });
  distancia.addEventListener("keydown", (e) => {
    validacion.keyboard_limite(e, 5); // Maximo 5 caracteres numéricos ej: 99999 mts
    validacion.keyboard_numero(e);
  });
  
  // Handlers Blur Focus Out (Limpia clases Error Roja UI si el user corrigió)
  telefono.addEventListener("blur", () => {
    validacion.limpiarError(telefono);
  });
  descripcion.addEventListener("blur", () => {
    validacion.limpiarError(descripcion);
  });
  ubicacion.addEventListener("blur", () => {
    validacion.limpiarError(ubicacion);
  });
  distancia.addEventListener("blur", () => {
    validacion.limpiarError(distancia);
  });
  recurso.addEventListener("change", () => {
    validacion.limpiarError(recurso);
  });
  servicio.addEventListener("blur", () => {
    validacion.limpiarError(servicio);
  });

  window.procesoPeticion = false;
  botonCrear.disabled = false;

  // Listener Master Envio HTTP Api Creador
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.procesoPeticion = true;
    botonCrear.disabled = true;

    // --- RECHEQUEO VALIDACIÓN STRICTA FINAL ANTES DE ENVIAR AL SERVIDOR ---
    // Verifica logitudes minimas Ej: Descripcion > 15 letras si no rechaza.
    let validarDescripcion = validacion.validar_minimo(descripcion, 15);
    let validarUbicacion = validacion.validar_minimo(ubicacion, 5);
    let validarDistancia = validacion.validar_minimo(distancia, 1);
    let validarTelefono = validacion.validar_minimo(telefono, 5);
    let validarRecurso = validacion.validar_select(recurso); // Verifica q no sea "Select default.."
    let validarServicio = validacion.validar_vacio(servicio);
    
    // Check Multi AND Logic Gate Result
    if (
      validarDescripcion &&
      validarUbicacion &&
      validarDistancia &&
      validarTelefono &&
      validarRecurso &&
      validarServicio
    ) {
      // Contrato DB Endpoint Mapper Data To Object
      const datosRegistro = {
        resource_id: recurso.value,
        description: adjuntarOpc.capitalizarPrimeraLetra(descripcion.value),
        location: adjuntarOpc.capitalizar(ubicacion.value.trim()),
        distance: distancia.value, // (Metros num)
        phone: telefono.value,
        family_plan_id: id, // Attach to Family Plan Tree Head
      };
      
      try {
        // Ejecutor Core PUSH DB Action (resource table inserts)
        const data = await api.post(`recursosDisponibles`, datosRegistro); // URL Backend Action
        
        if (data.success) {
          await alerta.alertaOK(data.message);
          window.location.href = `#/voluntario/plan_familiar/recursos?familia_id=${id}`; // Return Success Layout Padre
        } else alerta.alertaWarning(data.message, data.errors);
      } catch (error) {
        alerta.alertaError(error.errors);
      }
    }
    
    // Unlock and Catch Fallbacks 
    botonCrear.disabled = false;
    window.procesoPeticion = false;
  });
};
