import * as alerta from "../../../helpers/alertas";
import * as api from "../../../helpers/api"; // Tu helper estrella

export default async () => {
  const form = document.querySelector(".form");
  const corrElectronico = document.getElementById("correoElectronico");
  const boton = document.querySelector(".boton");
  
  let procesoPeticion = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (procesoPeticion || !corrElectronico.value.trim()) return;

    boton.disabled = true;
    procesoPeticion = true;
    const email = corrElectronico.value.trim();

    // Consumimos tu método post limpio
    const json = await api.post("forgotPassword", { email: email });

    // Tu helper ya maneja el catch y las respuestas de red devolviendo el objeto estructurado
    if (json && json.success) {
      // Guardamos el email temporalmente en sessionStorage para la siguiente vista visual
      sessionStorage.setItem("recovery_email", email);
      await alerta.alertaOK(json.message); // alertaOK es la función de éxito en alertas.js (alertaSuccess no existe)
      
      window.location.href = "#/verifyCode"; // CORREGIDO: clave del router es "verifyCode" (sin guión)
    } else {
      await alerta.alertaError((json && json.message) || "El correo no está registrado."); // alertaError solo acepta 1 parámetro (el mensaje), no título
      boton.disabled = false;
      procesoPeticion = false;
    }
  });

  document.getElementById("volver")?.addEventListener("click", () => {
    window.location.href = "#/login";
  });
};