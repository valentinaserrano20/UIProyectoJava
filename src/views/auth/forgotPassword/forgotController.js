
import * as alerta from "../../../helpers/alertas";

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

    try {
      const response = await fetch("/api/forgotPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      });

      const json = await response.json();

      if (response.ok && json.success) {
        // Guardamos el email temporalmente en el sessionStorage para la siguiente vista
        sessionStorage.setItem("recovery_email", email);
        await alerta.alertaSuccess("Código Enviado", json.message);
        
        // Dejamos que tu enrutador haga su trabajo limpiamente
        window.location.href = "#/verify-code"; 
      } else {
        await alerta.alertaError("Error", json.message || "El correo no está registrado.");
        boton.disabled = false;
        procesoPeticion = false;
      }
    } catch (err) {
      await alerta.alertaError("Error de Red", "No hay comunicación con Java.");
      boton.disabled = false;
      procesoPeticion = false;
    }
  });

  document.getElementById("volver")?.addEventListener("click", () => {
    window.location.href = "#/login";
  });
};