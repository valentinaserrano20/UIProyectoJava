import * as alerta from "../../../helpers/alertas";

export default async () => {
  const form = document.querySelector(".form");
  const nuevaClave = document.getElementById("nuevaContraseña");
  const confirmarClave = document.getElementById("confirmarContraseña");
  const boton = document.querySelector(".boton");

  // Obtener el token que se verificó en el paso anterior
  const tokenValidado = sessionStorage.getItem("recovery_token");
  if (!tokenValidado) {
    window.location.href = "#/forgot-password";
    return;
  }

  let procesoPeticion = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (procesoPeticion) return;

    if (nuevaClave.value !== confirmarClave.value) {
      await alerta.alertaWarning("Error", "Las contraseñas no coinciden.");
      return;
    }

    boton.disabled = true;
    procesoPeticion = true;

    try {
      const response = await fetch("/api/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenValidado,
          password: nuevaClave.value
        })
      });

      const json = await response.json();

      if (response.ok && json.success) {
        await alerta.alertaSuccess("Excelente", json.message);
        
        // Limpieza absoluta de la memoria temporal
        sessionStorage.clear();
        
        window.location.href = "#/login"; // Fin del ciclo
      } else {
        await alerta.alertaError("Error", json.message || "No se pudo actualizar.");
        boton.disabled = false;
        procesoPeticion = false;
      }
    } catch (err) {
      await alerta.alertaError("Error", "Fallo de infraestructura.");
      boton.disabled = false;
      procesoPeticion = false;
    }
  });
};