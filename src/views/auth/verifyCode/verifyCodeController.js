import * as alerta from "../../../helpers/alertas";
import * as api from "../../../helpers/api";

export default async () => {
  const form = document.querySelector(".form");
  const inputs = document.querySelectorAll("input[data-tipo='codigo']");
  const boton = document.querySelector(".boton");
  
  // Extraemos el email del sessionStorage para inyectarlo en el texto instructivo
  const emailGuardado = sessionStorage.getItem("recovery_email") || "su correo";
  const textoAyuda = document.querySelector(".form__texto");
  if (textoAyuda) {
    textoAyuda.innerHTML = `Ingrese el código de 6 dígitos enviado a <strong>${emailGuardado}</strong> y su nueva contraseña.`;
  }

  let procesoPeticion = false;

  // UX nativo: Salto automático entre tus 6 inputs independientes
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < inputs.length - 1) inputs[index + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value.length === 0 && index > 0) inputs[index - 1].focus();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (procesoPeticion) return;

    // Unificamos mecánicamente tus 6 inputs naranjas en una sola cadena de texto
    let tokenCompleto = "";
    inputs.forEach(input => tokenCompleto += input.value.trim());

    if (tokenCompleto.length < 6) {
      await alerta.alertaWarning("Incompleto", "Por favor, ingrese los 6 dígitos del código.");
      return;
    }

    boton.disabled = true;
    procesoPeticion = true;

    // Invocamos tu post del helper
    const json = await api.post("verifyCode", { token: tokenCompleto });

    if (json && json.success) {
      // Almacenamos el token verificado temporalmente para que el paso final lo herede
      sessionStorage.setItem("recovery_token", tokenCompleto);
      await alerta.alertaOK(json.message || "Código verificado correctamente."); // alertaOK es la función de éxito en alertas.js (alertaSuccess no existe)
      
      window.location.href = "#/changePassword"; // CORREGIDO: clave del router es "changePassword" (sin guión)
    } else {
      await alerta.alertaError((json && json.message) || "Código incorrecto o vencido."); // alertaError solo acepta 1 parámetro (el mensaje), sin título
      boton.disabled = false;
      procesoPeticion = false;
    }
  });

  // Evento click para reenviar el código de verificación
  // Sirve para: Solicitar un nuevo código de recuperación al backend sin obligar al voluntario a reescribir su correo electrónico
  // Qué hace: Verifica si hay un correo guardado en la sesión. Si existe, llama al endpoint "forgotPassword" con dicho correo. Si no existe, lo redirige a la vista de recuperar contraseña
  // Por qué es importante: Mejora significativamente la experiencia de usuario (UX) al evitar pasos repetitivos y soluciona el bug de la doble validación al no enviar el formulario
  const botonReenviar = document.getElementById("volver");
  if (botonReenviar) {
    botonReenviar.addEventListener("click", async () => {
      const email = sessionStorage.getItem("recovery_email");
      
      // Si por alguna razón no tenemos el correo en sesión, lo enviamos al formulario inicial de recuperación
      if (!email) {
        window.location.href = "#/forgotPassword";
        return;
      }

      try {
        // Bloqueamos el botón temporalmente para evitar clics dobles seguidos
        botonReenviar.disabled = true;
        
        // Llamada POST al servicio de recuperación para generar y despachar un nuevo token por correo
        const json = await api.post("forgotPassword", { email: email });
        
        if (json && json.success) {
          await alerta.alertaOK(json.message || "Código reenviado con éxito.");
        } else {
          await alerta.alertaError((json && json.message) || "No se pudo reenviar el código.");
        }
      } catch (error) {
        console.error("Error al reenviar código:", error);
        await alerta.alertaError("Ocurrió un error al intentar reenviar el código.");
      } finally {
        // Habilitamos de nuevo el botón tras culminar la llamada de red
        botonReenviar.disabled = false;
      }
    });
  }
};