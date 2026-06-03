/**
 * Controlador: Agregar Nuevo Gráfico de Vivienda (planGrafico/crear/crearController.js)
 * Maneja la subida Multipart Upload de una imagen de croquis de la casa junto  
 * con un campo Texto explicativo "descripción".  (1 a Muchos) Familia -> Gráficos.
 */
import * as alerta from "../../../../helpers/alertas";
import * as api from "../../../../helpers/api";

export default async () => {
  // Referencias UI Básicas
  const botonBack = document.getElementById("botonBack"); // Abortar Inserción
  const id = location.hash.split("=")[1]; // Family ID Plan
  const form = document.querySelector(".form"); // Formulario Action
  const botonCrear = document.getElementById("botonCrear"); // Submit Final Button

  // Selectores Específicos Componente Multipart/Foto
  const input = document.getElementById("imagenInput"); // File Manager System Windows Browser
  const preview = document.getElementById("preview"); // Contenedor Visibibilidad Img URL Local  
  const imagenTitulo = document.querySelector(".imagen__titulo"); // Status Texto 
  
  // Magic Numbers Rulesets Backend File Limits
  const TAMANO_MAX_MB = 2; // Tamaño máximo en Megabytes
  const TAMANO_MAX_BYTES = TAMANO_MAX_MB * 1024 * 1024;
  const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
  
  // Campo Anexo Obligado
  const descripcion = document.getElementById("descripcion"); // TextArea de la foto

  // Locking General Concurrencia UI
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  // Lógica Botón Atrás (A diferencia flujo lineal, este va a la "Lista Cuadriculada", NO al menu home)
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return;
    location.href = `#/voluntario/plan_familiar/grafico_vivienda?familia_id=${id}`;
  };

  // Liberar UI Post-carga
  window.procesoPeticion = false;
  botonCrear.disabled = false;

  // Escuchador dinámico Renderizador Blob Client-Side Fotografía
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    // Rejector Format Mime Filter
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      input.value = ""; // Vacia target input de HTML
      // preview.classList.add("oculto");
      return alerta.alertaWarning(
        "Formato no permitido. Solo JPG, PNG o WEBP.",
      );
    }

    // Rejector de Sobrepeso Payload Filtro
    if (file.size > TAMANO_MAX_BYTES) {
      input.value = ""; // Purga variable Binaria
      // preview.classList.add("oculto");
      return alerta.alertaWarning(
        `El grafico no puede superar los ${TAMANO_MAX_MB}MB`,
      );
    }
    
    // Virtualización Exitosa In-Screen Blob Render Temporally
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("oculto");
    imagenTitulo.textContent = "Vista previa del grafico seleccionado";
  });

  // Listener Master Formulario API Multipart Data Send
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Bloqueos Doble Click Form
    window.procesoPeticion = true;
    botonCrear.disabled = true;
    const file = input.files[0];
    
    // Validate extra Submit
    if (!file) {
      boton.disabled = false;
      window.procesoPeticion = false;
      return alerta.alertaWarning("Selecciona un archivo primero");
    }
    // Validate Extra Size Recheck
    if (file.size > TAMANO_MAX_BYTES) {
      boton.disabled = false;
      window.procesoPeticion = false;
      return alerta.alertaWarning(
        `La imagen no puede superar los ${TAMANO_MAX_MB}MB`,
      );
    }
    
    // Empaquetador Constructor Nativo HTTP MultiPart Form Encoded File Object
    const formData = new FormData();
    formData.append("path", file);  // Raw File
    formData.append("family_plan_id", id); // FK Foranea Relacion Uno a Muchos Plan Familia -> Grafico Mapas
    formData.append("description", descripcion.value); // String Meta payload

    try {
      // API PUSH (POST NEW) sin checkear si existe porque este modulo PERMITE MUCHOS GRAFICOS/PLANOS !
      const data = await api.postImagen(`imagenes/vivienda`, formData);
      if (data.success) {
        // Redirige Inmediato a Cuadricula Listado para ver su Insercion Exitosa Visualmente
        await alerta.alertaOK(data.message);
        location.href = `#/voluntario/plan_familiar/grafico_vivienda?familia_id=${id}`;
      } else {
        alerta.alertaWarning(data.message, data.errors);
      }
    } catch (error) {
      alerta.alertaError(error.errors); // Network Failure
    }

    // Relese catch fallbacks
    botonCrear.disabled = false;
    window.procesoPeticion = false;
  });
};
