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

  // Escucha el evento submit del formulario cuando el usuario intenta registrarse
  form.addEventListener("submit", async (e) => {
    // Evita el refresco automático de la página por defecto del formulario HTTP
    e.preventDefault();

    // Bloquea segundas ejecuciones si ya hay una petición en tránsito por la red
    if (window.procesoPeticion) return;

    // Ejecuta las validaciones automáticas de expresiones regulares de los inputs del formulario
    const booleanValidacion = validacion.validadorAutomatico.validarTodo(form);

    // Valida que el campo de confirmación de contraseña coincida exactamente con la contraseña escrita
    const validacionContrasena = validacion.validar_igualdad(confContrasena, contrasena);

    // Si las validaciones del cliente fallan o las contraseñas no coinciden, detiene la ejecución
    if (!booleanValidacion || !validacionContrasena) {
      // Aborta el envío de datos al servidor de inmediato
      return;
    }

    // Activa la bandera global para indicar que se ha iniciado un proceso de comunicación
    window.procesoPeticion = true;
    // Deshabilita el botón de registro para evitar que el usuario vuelva a clickear
    boton.disabled = true;

    // Lanza una confirmación visual preguntándole al usuario si desea crear la cuenta
    const confirmacion = await alerta.alertaQuest("¿Seguro que quieres crear la cuenta?");
    // Si el usuario decide cancelar en la alerta emergente
    if (!confirmacion.isConfirmed) {
      // Restablece la bandera de petición a falso permitiendo futuros intentos
      window.procesoPeticion = false; 
      // Vuelve a habilitar el botón de envío en la pantalla
      boton.disabled = false;
      // Aborta el flujo del método
      return; 
    }

    // Declara una función auxiliar para capitalizar nombres y apellidos al persistirlos
    const capitalizar = (texto) => {
      // Si el texto es nulo o vacío retorna un string vacío
      if (!texto) return "";
      // Convierte todo a minúsculas, separa por espacios, pone la primera letra en mayúscula y los une
      return texto
        .toLowerCase()
        .split(" ")
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ");
    };

    // Estructura el objeto de datos que se serializará y enviará al backend
    const datosRegistro = {
      // Capitaliza y limpia espacios en blanco del nombre ingresado
      names: capitalizar(nombres.value.trim()),
      // Capitaliza y limpia espacios en blanco del apellido ingresado
      last_names: capitalizar(apellidos.value.trim()),
      // Captura la fecha de nacimiento ingresada en formato YYYY-MM-DD
      birth_date: nacimiento.value,
      // Obtiene el identificador seleccionado para el tipo de documento
      document_type_id: tipoDocumento.value,
      // Obtiene el número del documento escrito por el usuario
      document_number: numDocumento.value,
      // Obtiene el teléfono celular ingresado
      phone: telefono.value,
      // Obtiene el identificador seleccionado del género
      gender_id: genero.value,
      // Obtiene la organización o seccional seleccionada
      organization_id: organizacion.value,
      // Captura y limpia de espacios en blanco el correo de acceso
      email: corrElectronico.value.trim(),
      // Obtiene la contraseña en texto plano para su encriptación posterior
      password: contrasena.value,
    };

    // Inicia el bloque de captura de excepciones para la llamada de red
    try {
      // Dispara la petición asíncrona POST al endpoint "register" con el objeto JS estructurado.
      // Esta línea exacta de código es el disparador que transfiere el flujo del frontend al helper api.js
      const data = await api.post("register", datosRegistro);

      // Comprueba si el backend resolvió exitosamente la creación del registro
      if (data.success) {
        // Muestra una ventana de notificación exitosa con el mensaje del servidor
        await alerta.alertaOK(data.message);
        // Redirecciona al usuario hacia el formulario de login principal
        window.location.href = "#/login";
      // Si el backend reporta problemas de validación de negocio
      } else alerta.alertaWarning(data.message, data.errors); 
    } catch (error) {
      // Muestra un modal de alerta crítico si falla la conexión física con el servidor
      alerta.alertaError(error); 
    }

    // Vuelve a habilitar el botón de envío en caso de errores en la respuesta
    boton.disabled = false;
    // Libera la bandera de control de flujo de peticiones de red
    window.procesoPeticion = false;
  });

  // Delegador de clic secundario de ventana SPA (Botón o hipervínculo para volver si ya tengo cuenta real)
  window.addEventListener("click", async (e) => {
    if (e.target.matches("#tengoCuenta") && !window.procesoPeticion)
      window.location.href = "#/login";
  });
};

