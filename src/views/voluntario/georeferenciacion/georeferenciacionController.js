/**
 * Controlador: Fase Inicial Geo Referencia (georeferenciacionController.js)
 * Controlador Idéntico a PlanEntorno/editar, pero utilizado durante el primer flujo
 * secuencial lineal paso-a-paso en la ruta "#/voluntario-planFamiliar/georeferenciacion/..."
 * en vez de en el modo edicion general por menús.
 */
import * as alerta from "../../../helpers/alertas";
import * as api from "../../../helpers/api";

export default async () => {
  // Selectores Identidad
  const botonBack = document.getElementById("botonBack"); // Flecha Atrás Layout
  const id = location.hash.split("=")[1]; // PK/FK 
  
  const form = document.querySelector(".form");
  const boton = document.querySelector(".form__boton"); // Acción Insert Imagen
  
  // Elementos HTML para vista y file input
  const input = document.getElementById("imagenInput"); // Native File Browser
  const preview = document.getElementById("preview"); // Container Target Render Blob HTML Image
  const imagenTitulo = document.querySelector(".imagen__titulo"); // Status Texto Imagen (Info Caption)

  const id_HousingInfoType = 1; //1 = georeferencia
  
  // Especificaciones técnicas restrictoras de Archivo (Magic Numbers limiters)
  const TAMANO_MAX_MB = 2; // Tamaño máximo en MB limit Server Config Nginx 
  const TAMANO_MAX_BYTES = TAMANO_MAX_MB * 1024 * 1024;
  const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

  // Barrera concurrencia inicial
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  const esSupervisor = location.hash.includes("/supervisor/");

  // Lógica Botón Atrás (Flujo lineal Wizard - vuelve a la Identificación)
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return;
    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${id}`;
      return;
    }
    location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
  };

  // Comprueba si durante este proceso el voluntario cerró y volvió, para no borrar imagen existente
  const existeData = await api.get(`imagenes/georeferenciacion/planFamiliar/${id}`);
  const existe = existeData !== null && existeData !== undefined && existeData !== "";
  if (existe) {
    preview.src = `${api.urlStorage}/${existeData.path}`;
    preview.style.display = "block";
    imagenTitulo.textContent = "Vista previa de la imagen actual";
  } else {
    imagenTitulo.textContent = "No se ha agregado una imagen aún";
  }

  // Release UX lock
  window.procesoPeticion = false;
  boton.disabled = false;

  // Manejador del Input nativo Windows/Android 'Se eligió archivo local' -> change listener
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    // Rejectors por MimeType Error (Pre-Envío)
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      input.value = ""; // Vacia y aborta
      preview.style.display = "none";
      return alerta.alertaWarning(
        "Formato no permitido. Solo JPG, PNG o WEBP.",
      );
    }

    // Rejector Peso Excedido Límite (Pre-Envío ahorra banda Ancha)
    if (file.size > TAMANO_MAX_BYTES) {
      input.value = "";
      preview.style.display = "none";
      return alerta.alertaWarning(
        `La imagen no puede superar los ${TAMANO_MAX_MB}MB`,
      );
    }
    
    // Virtualización in-ram HTML render de Imagen para UX Visual Response
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    imagenTitulo.textContent = "Vista previa de la imagen seleccionada";
  });

  // Listener Submit Confirmación Final Backend
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.procesoPeticion = true;
    boton.disabled = true;
    
    // Archivo de nuevo por safety
    const file = input.files[0];
    
    if (!file) {
      boton.disabled = false;
      window.procesoPeticion = false;
      return alerta.alertaWarning("Selecciona un archivo primero");
    }
    // Recheck By-pass 
    if (file.size > TAMANO_MAX_BYTES) {
      boton.disabled = false;
      window.procesoPeticion = false;
      return alerta.alertaWarning(
        `La imagen no puede superar los ${TAMANO_MAX_MB}MB`,
      );
    }
    
    // Armando el Constructor especial de Formato Web multipart para subir bytes a PHP API Larvavel
    const formData = new FormData();
    formData.append("path", file); 
    formData.append("family_plan_id", id); // ID Referencial
    formData.append("housing_info_type_id", id_HousingInfoType);

    try {
      // Subida de imagen al controlador centralizado en español
      const data = await api.postImagen(`imagenes/georeferenciacion`, formData);
      if (data.success) {
        // Exito
        await alerta.alertaOK(data.message);
        
        // Redirigir al menú o revisión según el rol
        if (esSupervisor) {
          location.href = `#/supervisor/plan_familiar/revision?familia_id=${id}`;
        } else {
          location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
        }
      } else {
        alerta.alertaWarning(data.message, data.errors);
      }
    } catch (error) {
      alerta.alertaError(error.errors); // Connection DB Failure Server Down
    }

    // Restaurar bloqueo Petición General en failure fallback
    boton.disabled = false;
    window.procesoPeticion = false;
  });
};
