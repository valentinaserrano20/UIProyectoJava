/**
 * Controlador: Fase de Identificación del Plan (identificacionController.js)
 * Tercera etapa de la creación inicial del plan familiar (después de agregar la foto).
 * Recolecta apartados descriptivos del domicilio de la familia, sector, 
 * telefonía y detalles estructurales de la casa.
 * Si el usuario pulsa "Subir Foto" se salva en la memoria del navegador 
 * lo que tiene escrito por ahora para no perder su progreso una vez vuelva de dicha pantalla.
 */
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";
import * as alerta from "../../../../helpers/alertas";
import * as api from "../../../../helpers/api";
import { cargarDatos } from "../../../../helpers/cargarDatos";
import * as localStorage from "../../../../helpers/localStorage";
import * as validacion from "../../../../helpers/validacionInputs";

// Exportación del controlador de vista de la identificación familiar
export default async () => {
  // Encuentra en la dirección URL actual el número identificador de esta familia específica
  const id = location.hash.split("=")[1];
  // Obtiene el elemento del botón de volver de la interfaz
  const botonBack = document.getElementById("botonBack");

  // Obtiene el elemento del formulario html
  const form = document.querySelector(".form");
  // Obtiene el elemento del botón de siguiente paso
  const botonSiguiente = document.getElementById("botonSiguiente");

  // Obtiene el input del identificador o código de la familia
  const familia = document.getElementById("familiaId");
  // Obtiene el input de tipo de familia clasificada (ej. Vulnerable)
  const tipoFamilia = document.getElementById("tipoFamilia");
  // Obtiene el input de apellidos de la familia
  const apellidos = document.getElementById("apellidos");
  // Obtiene el input de dirección física del domicilio
  const dirrecion = document.getElementById("dirrecion");
  // Obtiene el select para elegir los sectores geográficos
  const sector = document.getElementById("sectores");
  // Obtiene el input para especificar de forma textual el nombre del sector/barrio
  const sectorNombre = document.getElementById("sectorNombre");
  // Obtiene el input del teléfono fijo de la vivienda
  const telefono = document.getElementById("telefonoFijo");
  // Obtiene el select para elegir la calidad o régimen de la vivienda (ej. Propia)
  const calidad = document.getElementById("calidadesVivienda");

  // Inicializa la variable de control de peticiones concurrentes si no existe
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  // Bloquea temporalmente el flujo de interfaz al inicializar la pantalla
  window.procesoPeticion = true;

  // Lógica interactiva al hacer clic en el botón de retroceso (Volver)
  botonBack.onclick = async () => {
    // Si hay una petición de red activa en el fondo, ignora la solicitud
    if (window.procesoPeticion) return;
    // Muestra una ventana de advertencia de cancelación interactiva
    const confirmacion = await alerta.alertaQuest(
      "¿Seguro que quieres volver? perderás tu progreso",
    );
    // Si el usuario confirma, lo redirige al panel inicial de planes familiares
    if (confirmacion.isConfirmed) location.href = "#/voluntario";
  };

  // Petición GET inicial para precargar los datos básicos del plan familiar registrados en el paso 1
  cargarDatos(`familyPlans/${id}`, [familia, apellidos, tipoFamilia], ["id", "last_names", "family_type"]);
  
  // Realiza la petición GET en segundo plano para rellenar el select de sectores usando la ruta del PublicServlet
  await adjuntarOpc.adjuntarNoValida(sector, "public/sectors");
  // Realiza la petición GET en segundo plano para rellenar el select de calidades de vivienda usando la ruta del PublicServlet
  await adjuntarOpc.adjuntarNoValida(calidad, "public/housingQualities");
  
  // Concatena texto decorativo al campo del ID de familia para mejorar la presentación visual
  familia.value = `Familia segura N.${familia.value}`;

  // Concatena texto aclaratorio al tipo de familia obtenido
  tipoFamilia.value = `Tipo de familia: ${tipoFamilia.value}`;
  
  // Recupera automáticamente los datos temporales del formulario guardados en localStorage si el usuario salió a subir foto
  localStorage.importacionLocalStorage("identificacion");

  // Habilita el botón de siguiente al concluir la carga inicial de todos los catálogos
  botonSiguiente.disabled = false;
  // Libera el bloqueo de peticiones de la interfaz
  window.procesoPeticion = false;

  // Inicializa el validador automático de expresiones regulares de los inputs del formulario
  validacion.validadorAutomatico.init(form);

  // Escucha el submit del formulario para procesar el envío de datos al backend
  form.addEventListener("submit", async (e) => {
    // Previene el comportamiento nativo de recarga de página del submit
    e.preventDefault();
    
    // Valida todos los inputs del formulario contra las expresiones regulares del validador
    const booleanValidacion = validacion.validadorAutomatico.validarTodo(form);
    
    // Si alguna de las validaciones locales de inputs falla
    if (!booleanValidacion)
    {
      // Libera el control de la interfaz para permitir corregir errores
      window.procesoPeticion = false;
      // Vuelve a habilitar el botón
      botonSiguiente.disabled = false;
      // Interrumpe el guardado
      return;
    }

    // Deshabilita el botón siguiente para prevenir envíos duplicados por clics rápidos
    botonSiguiente.disabled = true;
    // Bloquea el flujo marcando que hay una petición HTTP activa
    window.procesoPeticion = true;
      
    // Estructura el objeto de datos que viajará al servidor en el cuerpo del PATCH
    const datosRegistro = {
      // Formatea a Title Case y remueve espacios en los apellidos familiares
      last_names: adjuntarOpc.capitalizar(apellidos.value.trim()),
      // Formatea a Title Case y remueve espacios en la dirección
      address: adjuntarOpc.capitalizar(dirrecion.value.trim()),
      // ID del sector relacional seleccionado
      sector_id: sector.value,
      // Formatea a Title Case y remueve espacios en el nombre descriptivo del sector/barrio
      sector_name: adjuntarOpc.capitalizar(sectorNombre.value.trim()),
      // Remueve espacios en el teléfono fijo
      landline_phone: telefono.value.trim(),
      // ID de calidad de vivienda relacional seleccionada
      housing_quality_id: calidad.value,
    };

    try {
      // Envía la petición PATCH con el lote de datos al endpoint de identificación
      const data = await api.patch(
        `familyPlans/${id}/identify`,
        datosRegistro,
      );
      // Si la actualización es exitosa en el backend
      if (data.success) {
        // Muestra la alerta de éxito verde
        await alerta.alertaOK(data.message);
        // Redirige al voluntario al panel principal (familia) del plan
        location.href= `#/voluntario/plan_familiar/familia?id=${id}`;
      } else {
        // Si hay errores de validación de negocio devueltos por el backend, muestra alerta amarilla
        await alerta.alertaWarning(data.message, data.errors);
      }
    } catch (error) {
      // Captura excepciones de red y muestra alerta roja
      alerta.alertaError(error.errors);
    }
    
    // Libera la interfaz en caso de que la validación del servidor haya fallado para permitir reintentos
    botonSiguiente.disabled = false;
    // Desbloquea la interfaz
    window.procesoPeticion = false;
  });
};
