import * as alerta from "../../../helpers/alertas";
import * as api from "../../../helpers/api";

export default async () => {
  const form = document.querySelector(".form");
  const nuevaClave = document.getElementById("nuevaContraseña");
  const confirmarClave = document.getElementById("confirmarContraseña");
  const boton = document.querySelector(".boton");

  // Si alguien intenta entrar a esta URL escribiendo el hash directo sin pasar por el token
  const tokenValidado = sessionStorage.getItem("recovery_token");
  if (!tokenValidado) {
    window.location.href = "#/forgotPassword"; // CORREGIDO: clave del router es "forgotPassword" (sin guión)
    return;
  }

  let procesoPeticion = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (procesoPeticion) return;

    if (nuevaClave.value !== confirmarClave.value) {
      await alerta.alertaWarning("Inconsistencia", "Las contraseñas ingresadas no coinciden.");
      return;
    }

    boton.disabled = true;
    procesoPeticion = true;

    // Consumimos tu post enviando el token y la contraseña
    const json = await api.post("changePassword", {
      token: tokenValidado,
      password: nuevaClave.value
    });

    if (json && json.success) {
      await alerta.alertaOK(json.message); // alertaOK es la función de éxito en alertas.js (alertaSuccess no existe)
      
      // Limpieza de seguridad total de la pestaña
      sessionStorage.clear();
      
      window.location.href = "#/login"; // Fin del proceso seguro
    } else {
      await alerta.alertaError((json && json.message) || "No se pudo actualizar la contraseña."); // alertaError solo acepta 1 parámetro (el mensaje), sin título
      boton.disabled = false;
      procesoPeticion = false;
    }
  });
};
