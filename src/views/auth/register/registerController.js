/**
 * Controlador: Registro de Usuario (registerController.js)
 * Orquesta la creación de una cuenta nueva. Se encarga de cargar dinámicamente
 * los catálogos públicos (Tipos de Documento, Géneros, Seccionales) y habilitar
 * la selección dependiente de Organizaciones basadas en la Seccional elegida.
 */
import * as alerta from "../../../helpers/alertas";
import * as api from "../../../helpers/api";
import * as adjuntarOpc from "../../../helpers/adjuntarOpciones";
import * as validacion from "../../../helpers/validacionInputs";
import * as fechas from "../../../helpers/fechas";

export default async () => {
  // Referencias al DOM estáticas generales de la ventana SPA
  const form = document.querySelector(".form"); // Form padre
  const boton = document.querySelector(".form__boton"); // Acción 'Submit' Crear cuenta

  // Banderas semafóricas para el interbloqueo del evento múltiple del Mouse 
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = false;
  }
  // Libera si vengo navegando de atrás o cancelé algo en medio
  window.procesoPeticion = false;

  // Colección de Inputs de Formularios Individuales que se transformarán post Rest
  const nombres = document.getElementById("nombres");
  const apellidos = document.getElementById("apellidos");
  const tipoDocumento = document.getElementById("tiposDocumento");
  const numDocumento = document.getElementById("numeroDocumento");
  const genero = document.getElementById("generos");
  const nacimiento = document.getElementById("nacimiento");
  const telefono = document.getElementById("telefono");
  const organizacion = document.getElementById("organizaciones");
  const corrElectronico = document.getElementById("correoElectronico");
  const contrasena = document.getElementById("contrasena");
  const confContrasena = document.getElementById("confirmarContrasena");



  // Inyección DOM: Solicita y llena los combos <select> vacíos usando el Helper general `adjuntarOpciones.js`
  // Nota: Al cargarse piden de Endpoints 'Public' que no necesitan ser un User Valido LocalStorage
  await adjuntarOpc.adjuntarInfo(tipoDocumento, "public/tipos-documento", "sigla");
  await adjuntarOpc.adjuntar(genero, "public/generos");
  await adjuntarOpc.adjuntar(organizacion, "public/organizaciones");
  fechas.initFechas();

  // Libre pase visual
  boton.disabled = false;

  // Arranque del listener in-line de input validation por clases regex
  validacion.validadorAutomatico.init(form);
  confContrasena.addEventListener("blur", (e) => {
    validacion.limpiarError(e.target);
  });

  // Escuchando inyección intencionada "Enter/Click submit"
  form.addEventListener("submit", async (e) => {
    // Congela evento default
    e.preventDefault();

    if (window.procesoPeticion) return;

    // 1. Validandos booleanos primero en cliente
    const booleanValidacion = validacion.validadorAutomatico.validarTodo(form);

    // Lógica especial que chequea los dos nodos de Password y que visualmente empate valor (Contraseñas idénticas)
    const validacionContrasena = validacion.validar_igualdad(confContrasena, contrasena);

    // Si algún proceso falló (Regex o Identidad), corta de inmediato sin pedir confirmación
    if (!booleanValidacion || !validacionContrasena) {
      return;
    }

    // Bloquea interacción durante proceso de confirmación y envío
    window.procesoPeticion = true;
    boton.disabled = true;

    // 2. Solicita confirmación verbal visual solo si los datos ya son válidos
    const confirmacion = await alerta.alertaQuest("¿Seguro que quieres crear la cuenta?");
    if (!confirmacion.isConfirmed) {
      window.procesoPeticion = false; // Desbloquea
      boton.disabled = false;
      return; // Si dice cancelar/afuera asume early return
    }

    // Función para capitalizar nombres y apellidos al persistirlos
    const capitalizar = (texto) => {
      if (!texto) return "";
      return texto
        .toLowerCase()
        .split(" ")
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ");
    };

    // Objeto JS armado meticulosamente referenciando los Models esperados Backend para Users
    const datosRegistro = {
      names: capitalizar(nombres.value.trim()),
      last_names: capitalizar(apellidos.value.trim()),
      birth_date: nacimiento.value,  // ISO yyyy-mm-dd
      document_type_id: tipoDocumento.value,
      document_number: numDocumento.value,
      phone: telefono.value,
      gender_id: genero.value,
      organization_id: organizacion.value,
      email: corrElectronico.value.trim(),
      password: contrasena.value,
    };

    // Llamada Network 
    try {
      // Enlaza la ruta 'api/v1/register/' (Por omisión app)
      const data = await api.post("register", datosRegistro);

      // Verifica prop return success estándar en todo Service response de backend
      if (data.success) {
        await alerta.alertaOK(data.message);
        window.location.href = "#/login"; // Vuelve a la puerta Login esperando Confirmación Manual interna posterior
      } else alerta.alertaWarning(data.message, data.errors); // Producir array validation
    } catch (error) {
      alerta.alertaError(error); // Trágico 500 error o no red
    }

    // Vuelta al ruedo si no redirigio
    boton.disabled = false;
    window.procesoPeticion = false;
  });

  // Delegador de clic secundario de ventana SPA (Botón o hipervínculo para volver si ya tengo cuenta real)
  window.addEventListener("click", async (e) => {
    if (e.target.matches("#tengoCuenta") && !window.procesoPeticion)
      window.location.href = "#/login";
  });
};

