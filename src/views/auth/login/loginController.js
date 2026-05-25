/**
 * Controlador: Inicio de Sesión (loginController.js)
 * Maneja la lógica de autenticación del usuario. Recopila credenciales,
 * realiza la petición POST al backend, almacena el token/datos en localStorage
 * y redirecciona SPA localmente según el Rol asignado (Admin, Supervisor, etc.).
 */
import * as alerta from "../../../helpers/alertas";
import * as api from "../../../helpers/api";
import * as validacion from "../../../helpers/validacionInputs";

// Exportación central de toda la función de vista Login
export default async () => {
  // Referencias al DOM estático o inyectado que compone la página login visual
  const form = document.querySelector(".form"); // Enclosure nativo
  const correo = document.getElementById("correo"); // Caja input email
  const contrasena = document.getElementById("contrasena"); // Caja input pass
  const botonLogin = document.getElementById("botonLogin"); // Actioner

  console.log(botonLogin)
  // Validadores y pre-flags para evitar la concurrencia de clicks (Race condition bug fix)
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = false;
  }
  // Se baja incondicionalmente cada vez que la vista se dibuja de nuevio
  window.procesoPeticion = false;

  // Engancha listeners en las cajas de texto de este form particular previniendo malos envíos
  validacion.validadorAutomatico.init(form);

  // Listener para capturar el botón Login o la típica tecla Enter
  form.addEventListener("submit", async (e) => {
    // Evita comportamiento 'Form Action' cláisco relanzando web
    e.preventDefault();

    // Evaluar estado real del formulario mediante helper central visual y lógico
    const booleanValidacion = validacion.validadorAutomatico.validarTodo(form);
    if (!booleanValidacion) {
      // Escape temprano si el backend no apreciará el error front
      window.procesoPeticion = false;
      botonLogin.disabled = false;
      return; 
    }

    // JSON base del payload post rest para login (Contrato esperado: email, password)
    const datosUsuario = {
      email: correo.value,
      password: contrasena.value,
    };

    // Bloqueo total front end hasta aviso contrario api backend
    botonLogin.disabled = true;
    window.procesoPeticion = true;
    
    // Solicita Tokenización o aprobación a servicio
    const data = await api.post("login", datosUsuario);
    
    // Branch exitoso de promesa Fetch nativa
    if (data.success) {
      const atributos = data.data; // Extrae JSON profundo de la prop key "data" devuelta
      
      // Persiste atributos básicos de perfilamiento offline localmente para toda la persistencia app
      localStorage.setItem("full_name", atributos.full_name);
      localStorage.setItem("id", atributos.id);
      localStorage.setItem("permissions", atributos.permissions);
      localStorage.setItem("role_id", atributos.role_id);
      localStorage.setItem("sectional_id", atributos.sectional_id);
      localStorage.setItem("gender_id", atributos.gender);
      
      // Presenta mensaje de bienvenida / Éxito dictado por Api
      await alerta.alertaOK(data.message);
      
      // MODIFICADO: Redirección post-login según la alineación de roles (Rol 1 = Voluntario, Rol 2 = Supervisor_Admin)
      if (atributos.role_id == 1) {
        window.location.href = "#/voluntario";
      } else if (atributos.role_id == 2) {
        window.location.href = "#/supervisor";
      } else {
        window.location.href = "#/login";
      }
    
    } else {
      // Branch fallido (Ej: Credenciales incorrectas)
      await alerta.alertaError(data.message);
    }
    
    // Rehabilitación del sistema general
    botonLogin.disabled = false;
    window.procesoPeticion = false;
  });

  // MODIFICADO: Listeners enlazados directamente a los elementos del DOM local para prevenir fugas de memoria en window
  const crearCuentaBtn = document.getElementById("crearCuenta");
  const recuperarContrasenaBtn = document.getElementById("recuperarContrasena");

  if (crearCuentaBtn) {
    crearCuentaBtn.addEventListener("click", () => {
      if (!window.procesoPeticion) {
        window.location.href = "#/register";
      }
    });
  }

  if (recuperarContrasenaBtn) {
    recuperarContrasenaBtn.addEventListener("click", () => {
      if (!window.procesoPeticion) {
        window.location.href = "#/forgotPassword";
      }
    });
  }
};
