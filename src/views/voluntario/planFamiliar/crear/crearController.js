/**
 * Controlador: Iniciar Creación de Plan Familiar (crearController.js)
 * Primer paso real del Voluntario. Define la información básica (Apellidos de la Familia)
 * y asigna la ubicación inicial de su residencia.
 * * AUDITADO Y REFACUTORIZADO: Remoción de campos huérfanos de Laravel (family_type, sectional_id)
 * para acoplarse fielmente al esquema nativo de MySQL en Java.
 */
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";
import * as alerta from "../../../../helpers/alertas";
import * as api from "../../../../helpers/api";
import * as validacion from "../../../../helpers/validacionInputs";

export default async () => {
  // Elementos principales de la pantalla
  const botonBack = document.getElementById("botonBack");
  const form = document.querySelector(".form"); // Contenedor que agrupa todo el formulario

  // Cuadros e interactuables que el usuario llenará
  const apellidos = document.getElementById("apellidos");
  const zona = document.getElementById("zonas");
  const apartamento = document.getElementById("departamentos");
  const ciudad = document.getElementById("ciudades");
  
  // Botones para navegar hacia adelante en este proceso
  const botonSiguiente = document.getElementById("boton_siguiente");

  // Bloqueo de seguridad inicial para evitar que el usuario toque cosas antes de tiempo
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  // Acción del Botón Volver con alerta de prevención ("¿Seguro que deseas salir?")
  if (botonBack) {
    botonBack.onclick = async () => {
      if (window.procesoPeticion) return;
      const confirmacion = await alerta.alertaQuest("¿Seguro que quieres volver?, perderás tu progreso");
      if (confirmacion.isConfirmed) location.href = "#/voluntario"; // Romper el proceso y regresar al inicio
    };
  }

  try {
    // Traer las opciones paramétricas desde la base de datos a través de los endpoints de catálogos
    await adjuntarOpc.adjuntarNoValida(zona, "public/zones");
    await adjuntarOpc.adjuntarNoValida(apartamento, "public/departments");
    
    // Auto-seleccionar "Santander" (ID 1) y deshabilitarlo ya que es el único departamento disponible
    apartamento.value = "1";
    apartamento.disabled = true;

    // Cambiar la etiqueta visual para indicar explícitamente el nombre del campo
    const opcionSantander = apartamento.querySelector('option[value="1"]');
    if (opcionSantander) {
      opcionSantander.textContent = "Departamento: Santander";
    }

    // Cargar de inmediato los municipios correspondientes a Santander (departamento 1)
    await adjuntarOpc.adjuntarReseteoNoValida(ciudad, "public/cities/department/1");
    
    // Habilitar el selector de ciudades una vez que el departamento base cargue (simulación de flujo SPA)
    ciudad.disabled = false;
  } catch (error) {
    console.error("Error al inicializar catálogos geográficos: ", error);
  } finally {
    // Termina la carga inicial y libera los botones
    window.procesoPeticion = false;
    botonSiguiente.disabled = false;
  }
  
  // Evento que se dispara al oprimir "Guardar" y enviar el formulario principal
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (window.procesoPeticion) return;
    window.procesoPeticion = true;
    botonSiguiente.disabled = true;
      
    // Función para capitalizar los apellidos al persistirlos
    const capitalizar = (texto) => {
      if (!texto) return "";
      return texto
        .toLowerCase()
        .split(" ")
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ");
    };

    // Armar el paquete de datos limpio y estrictamente compatible con RegistroPlanDTO en Java
    const datosRegistro = {
      last_names: capitalizar(apellidos.value.trim()),
      zone_id: parseInt(zona.value),
      city_id: parseInt(ciudad.value), // Representa el ID de la organización de Defensa Civil elegida
      user_id: parseInt(localStorage.getItem("id")) // Se envía por control de firma de petición, el Servidor lo validará contra la sesión
    };

    // Validación en cliente rápida antes de abrir modales legales
    if (!datosRegistro.last_names || !datosRegistro.zone_id || !datosRegistro.city_id) {
      alerta.alertaWarning("Campos Incompletos", "Por favor diligencie todos los campos del formulario.");
      botonSiguiente.disabled = false;
      window.procesoPeticion = false;
      return;
    }

    // Alerta de Doble Chequeo obligatoria por requerimientos legales de privacidad de datos
    const autorizacion = await alerta.AutorizacionDatos();
    if (autorizacion.isConfirmed) {
      try {
        // Inserción en el servidor a través de nuestro Servlet unificado
        const data = await api.post("familyPlans", datosRegistro); 
        
        if (data.success) {
          await alerta.alertaOK(data.message);
          // Salta al siguiente paso de la SPA inyectando el ID generado por JDBC en la URL
          window.location.href = `#/voluntario/plan_familiar/testVunerabilidad?id=${data.data.id}`;
        } else {
          alerta.alertaWarning("No se pudo registrar", data.message);
        }
      } catch (error) {
        alerta.alertaError("Hubo un fallo crítico en el servidor de base de datos.");
      }
    }
    
    botonSiguiente.disabled = false;
    window.procesoPeticion = false;
  });

  // Efecto cascada: Cuando elige su departamento base (Santander), pinta sus organizaciones locales asociadas
  apartamento.addEventListener("change", async () => {
    if (!apartamento.value) return;
    try {
      // Ruta pública asociada al Servlet de catálogos
      await adjuntarOpc.adjuntarReseteoNoValida(ciudad, `public/cities/department/${apartamento.value}`);
    } catch (error) {
      console.error("Error en la carga en cascada de municipios: ", error);
    }
  });
};
