import * as alerta from "../../../helpers/alertas";

export default async () => {
  const form = document.querySelector(".form");
  const inputs = document.querySelectorAll("input[data-tipo='codigo']");
  const boton = document.querySelector(".boton");
  
  // Recuperamos el email que guardó el controlador anterior para mostrarlo en el texto
  const emailGuardado = sessionStorage.getItem("recovery_email") || "su correo";
  const textoAyuda = document.querySelector(".form__texto");
  if (textoAyuda) {
    textoAyuda.innerHTML = `Ingrese el código de 6 dígitos enviado a <strong>${emailGuardado}</strong>.`;
  }

  let procesoPeticion = false;

  // UX: Saltar automáticamente entre los 6 inputs
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

    // Unificamos los valores de tus 6 inputs "name=code"
    let tokenCompleto = "";
    inputs.forEach(input => tokenCompleto += input.value.trim());

    if (tokenCompleto.length < 6) {
      await alerta.alertaWarning("Incompleto", "Ingrese los 6 dígitos.");
      return;
    }

    boton.disabled = true;
    procesoPeticion = true;

    try {
      const response = await fetch("/api/verifyCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenCompleto })
      });

      const json = await response.json();

      if (response.ok && json.success) {
        // Guardamos el token validado para que el paso 3 pueda usarlo
        sessionStorage.setItem("recovery_token", tokenCompleto);
        await alerta.alertaSuccess("Éxito", "Código verificado correctamente.");
        
        window.location.href = "#/change-password"; // Router avanza
      } else {
        await alerta.alertaError("Error", json.message || "Código incorrecto.");
        boton.disabled = false;
        procesoPeticion = false;
      }
    } catch (err) {
      await alerta.alertaError("Error", "Fallo de conexión.");
      boton.disabled = false;
      procesoPeticion = false;
    }
  });

  document.getElementById("volver")?.addEventListener("click", () => {
    window.location.href = "#/forgot-password";
  });
};