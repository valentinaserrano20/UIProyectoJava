/**
 * Controlador: Plan de Acción - DESPUÉS (despues.js)
 * Gestiona la tercera y última fase (Mitigación Post-Riesgo).
 * Esta vista funciona igual que "Antes" y "Durante", operando bajo el valor 
 * número 3, permitiendo visualizar y agregar las acciones finales del plan.
 */
import * as api from "../../../../helpers/api";
import * as alerta from "../../../../helpers/alertas";
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";
import * as cargarDatos from "../../../../helpers/cargarDatos";
import * as validacion from "../../../../helpers/validacionInputs";
import * as modalPlanAccion from "../../../../helpers/modales/planAccion";

export default async () => {
  // Referencias a los elementos visibles de la pantalla
  const botonBack = document.getElementById("botonBack"); // Botón superior para 'Volver'
  const boton = document.getElementById("botonGuardar"); // Botón 'Guardar' ubicado en la parte de arriba
  const form = document.querySelector(".form"); // Contenedor que agrupa el formulario general

  // Extraer el identificador del plan desde la dirección escrita en el navegador
  const id = location.hash.split("=")[1];

  // Elementos donde el usuario interactúa
  const miembro = document.getElementById("miembro");
  const factorRiesgo = document.getElementById("factorRiesgo"); // Opciones de tipos de riego
  const containerTipoAccion = document.querySelector(".container__gap"); // Recuadro que esconde / muestra la lista de abajo
  const botonSiguiente = document.getElementById("siguiente"); // Botón de 'Siguiente' que estará apagado pues es el final
  const botonAtras = document.getElementById("atras"); // Pestaña para devolver al usuario a la pantalla anterior (Durante)

  // Candado activado al inicio para prevenir que el usuario haga múltiples operaciones accidentalmente
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  const esSupervisor = location.hash.includes("/supervisor/");

  // Acción al oprimir volver
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return;
    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${id}`;
      return;
    }
    location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
  };

  // Trae las listas reales con información de la base de datos para los familiares y los riesgos
  await adjuntarOpc.adjuntarMiembros(miembro, `members/familyPlan/select/${id}`,);
  await adjuntarOpc.adjuntarFactorRiesgo(factorRiesgo, `factoresRiesgo/planFamiliar/seleccion/${id}`);

  // Eventos que quitan las alertas visuales en rojo del error de validación cuando se corrige un valor
  miembro.addEventListener("change", () => {
    validacion.limpiarError(miembro);
  });
  factorRiesgo.addEventListener("change", () => {
    validacion.limpiarError(factorRiesgo);
  });

  // Desbloqueo inicial para el usuario
  window.procesoPeticion = false;
  boton.disabled = false;

  // Verificación Crítica: Pregunta al sistema si ya hay un avance del formulario creado con anterioridad para esta familia
  const existePlanAccion = await api.get(
    `actionPlans/familyPlan/boolean/${id}`,
  );

  // Si existe ese avance, autocompleta las opciones para restaurar la sesión donde la dejó
  if (existePlanAccion.boolean) {
    await cargarDatos.cargarDatos(
      `actionPlans/familyPlan/${id}`,
      [miembro, factorRiesgo], // Elementos de la pantalla
      ["member_id", "risk_factor_id"], // Propiedades asignadas a estos campos originadas desde el servidor
    );
  }

  // Acción al enviar los datos a guardar
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.procesoPeticion = true; // Bloquear pantalla
    boton.disabled = true; // Apagar botón

    // Herramienta que revisa que las listas sí tienen valores correctos y no en blanco
    let validarMiembro = validacion.validarSelect(miembro);
    let validarFactorRiesgo = validacion.validarSelect(factorRiesgo);

    // Si cumple la revisión
    if (validarMiembro && validarFactorRiesgo) {
      // Ordenamiento de los datos de envío
      const datosRegistro = {
        member_id: miembro.value,
        risk_factor_id: factorRiesgo.value,
        family_plan_id: id,
      };

      try {
        let data;
        // Estrategia del sistema:
        if (existePlanAccion.boolean) {
          // Actualización de registro en caso de existir con anterioridad
          const idPlanAccion = await api.get(`actionPlans/familyPlan/${id}`);
          data = await api.put(`actionPlans/${idPlanAccion.id}`, datosRegistro);
        } else data = await api.post(`actionPlans`, datosRegistro); // O Creación limpia en caso de no existir

        // Mensaje de éxito del servidor
        if (data.success) {
          await alerta.alertaOK(data.message);
          // Reinicio pesado automático del navegador para refrescar y desplegar el cuadro inferior 
          if (!existePlanAccion.boolean) location.reload();
        } else alerta.alertaWarning(data.message, data.errors);
      } catch (error) {
        alerta.alertaError(error.errors);
      }
    }
    boton.disabled = false;
    window.procesoPeticion = false;
  });

  // -------------- MÓDULO INFERIOR: ACCIONES CORTAS SEGMENTADAS (Fase: DESPUÉS) --------------
  if (existePlanAccion.boolean) {
    // Apaga el botón de 'Siguiente' ya que esta es la última etapa
    botonSiguiente.disabled = true;
    botonAtras.disabled = false; // Libre de volver a la fase interior

    // Título visible mostrando que estamos en el la etapa correcta
    const planAccionTitulo = document.getElementById('planAccion__titulo');
    planAccionTitulo.textContent = 'Despues';

    // Quita la instrucción visual que esconde la zona inferior
    containerTipoAccion.classList.remove("invisible");

    // Solicita la información correspondiente para rastrear al plan original
    const idPlanAccion = await api.get(`actionPlans/familyPlan/${id}`);

    // Es el recuadro blanco genérico donde caen las nuevas tareas sumadas
    const contenedorAfecciones = document.querySelector(
      ".gestionarAfecciones__lista",
    );

    // Regla de Negocio del Sistema: La Fase 3 (Después) está representada por el número 3
    const tipoEstado = 3;

    // Tarea automática de buscar los datos repetitivos (cartas de acción) e insertarlos uno a uno
    const cargarAfecciones = async () => {
      // Pide al origen todo el bloque integro de tareas
      const afecciones = await api.get(
        `actionPlanActions/actionPlan/${idPlanAccion.id}`,
      );
      contenedorAfecciones.innerHTML = ""; // Vacía el recuadro antes de pintar nada

      // Ciclo repetitivo para ordenar y graficar lo del servidor
      afecciones.forEach((item) => {
        // Un filtro crucial para evitar dibujar tarjetas del 'Antes' o 'Durante'. Solo importa lo de esta vista
        if (tipoEstado == item.action_type_id) {
          const boton = document.createElement("button"); // Pinta cada cuadro como oprimible
          boton.className = "gestionarAfecciones__afeccion";
          boton.dataset.id = item.id;
          boton.innerHTML = `
            <span class="gestionarAfecciones__tipoNombre">
                <i class="ri-eye-fill"></i> ${item.member_name} - ${item.description}
            </span>`;
          contenedorAfecciones.appendChild(boton); // Añadir finalmente la tarea creada a la familia global de arriba
        }
      });
    };

    // Ejecutar al principio de cargar página
    cargarAfecciones();

    window.procesoPeticion = false;
    boton.disabled = false;

    // Llamado para la ventana interactiva superior buscando crear algo nuevo (ícono (+))
    const botonAñadir = document.querySelector(".gestionarAfecciones__boton");

    if (esSupervisor) {
      botonAñadir.classList.add("oculto");
    }

    botonAñadir.addEventListener("click", async () => {
      // Construye la ventana aportando identificadores y aclarando a cuál fase se dirige (El 3)
      modalPlanAccion.crear(id, tipoEstado, cargarAfecciones, idPlanAccion.id);
    });

    // Detecta cualquier pulsación a un objetivo perteneciente de la "Lista" visualizada de esta fase
    contenedorAfecciones.addEventListener("click", async (e) => {
      const target = e.target.closest(".gestionarAfecciones__afeccion")

      if (!target) return; // Si no hizo click en un objetivo, no hacer nada

      const idAfeccion = target.dataset.id;
      modalPlanAccion.verEditarEliminar(idAfeccion, id, cargarAfecciones, esSupervisor);
    });

    // Envío del usuario cuando retrocede
    
    botonAtras.addEventListener("click", async () => {
      if (window.procesoPeticion) return;
      if (esSupervisor) {
          location.href = `#/supervisor/plan_familiar/plan_de_accion/durante?familia_id=${id}`;
          return;
      }
      location.href = `#/voluntario/plan_familiar/plan_de_accion/durante?familia_id=${id}`;
    });
  }

  //Temporal hasta que se refactorice-----------------------------------------------------------
  const familyPlan = await api.get(`familyPlans/${id}`);

  if (familyPlan.status_plan_id === 6 || familyPlan.status_plan_id === 7) {
    containerTipoAccion.querySelectorAll(".gestionarAfecciones__afeccion").forEach(btn => {
      btn.disabled = true;
    });
    containerTipoAccion.querySelectorAll(".gestionarAfecciones__boton").forEach(btn => {
      btn.classList.add("oculto");
    });
    form.querySelectorAll(".boton").forEach(btn => {
      btn.classList.add("oculto");
    });
    form.querySelectorAll(".selector").forEach(select => {
      select.disabled = true;
    });
  }
};
