/**
 * Controlador: Plan de Acción - ANTES (antes.js)
 * Gestiona la primera fase (Prevención/Preparación) frente a un Riesgo detectado.
 * Permite asignar miembros de la familia a los factores de riesgo e ir agregando
 * acciones preventivas específicas usando ventanas emergentes.
 */
import * as api from "../../../../helpers/api";
import * as alerta from "../../../../helpers/alertas";
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";
import * as cargarDatos from "../../../../helpers/cargarDatos";
import * as validacion from "../../../../helpers/validacionInputs";
import * as modalPlanAccion from "../../../../helpers/modales/planAccion";


export default async () => {
  // Referencias a los elementos de la pantalla
  const botonBack = document.getElementById("botonBack"); // Botón para regresar al menú principal del Plan
  const boton = document.getElementById("botonGuardar"); // Botón principal para enviar el formulario
  const form = document.querySelector(".form"); // Formulario principal en la pantalla

  // Extrae el identificador del plan familiar desde la dirección web (Ejemplo: #/ruta/id=14 -> 14)
  const id = location.hash.split("=")[1];

  // Elementos del formulario que el usuario puede llenar o seleccionar
  const miembro = document.getElementById("miembro"); // Lista desplegable de los familiares
  const factorRiesgo = document.getElementById("factorRiesgo"); // Lista desplegable de los riesgos
  const containerTipoAccion = document.querySelector(".container__gap"); // Contenedor que aloja la lista de acciones (permanece oculto al inicio)
  const botonSiguiente = document.getElementById("siguiente"); // Botón para avanzar a la fase 'Durante'
  const botonAtras = document.getElementById("atras"); // Botón para retroceder (Deshabilitado en esta primera fase)

  // Bandera o mecanismo lógico para prevenir que el usuario haga múltiples clics y envíe peticiones duplicadas
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true; // Se bloquea temporalmente mientras se cargan los datos de las listas
  }
  window.procesoPeticion = true;

  const esSupervisor = location.hash.includes("/supervisor/");

  // Acción del Botón 'Atrás' de la parte superior
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return; // Evita que funcione si todavía está cargando algo

    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${id}`;
      return;
    }

    location.href = `#/voluntario/plan_familiar/familia?id=${id}`; // Regresa al menú general del plan familiar
  };

  // Solicitar al servidor los listados de miembros y riesgos de esta familia para rellenar las opciones correspondientes
  await adjuntarOpc.adjuntarMiembros(miembro, `members/familyPlan/select/${id}`,);
  await adjuntarOpc.adjuntarFactorRiesgo(factorRiesgo, `factoresRiesgo/planFamiliar/seleccion/${id}`);

  // Eventos para detectar cuando el usuario selecciona una opción válida y así limpiar las advertencias rojas (errores en pantalla)
  miembro.addEventListener("change", () => {
    validacion.limpiarError(miembro);
  });
  factorRiesgo.addEventListener("change", () => {
    validacion.limpiarError(factorRiesgo);
  });

  // Liberar el bloqueo para que el usuario pueda empezar a interactuar
  window.procesoPeticion = false;
  boton.disabled = false;

  // Consulta al servidor para comprobar si esta familia ya tiene este formulario básico guardado
  const existePlanAccion = await api.get(
    `actionPlans/familyPlan/boolean/${id}`,
  );

  // Si ya existía información guardada, se rellena automáticamente en los campos de los familiares y riesgos
  if (existePlanAccion.boolean) {
    await cargarDatos.cargarDatos(
      `actionPlans/familyPlan/${id}`, // Dirección del servidor con los datos guardados
      [miembro, factorRiesgo], // Elementos de la pantalla que se van a rellenar
      ["member_id", "risk_factor_id"], // Nombres de los datos según la base de datos
    );
  }

  // Comportamiento general del botón Guardar (Envío del formulario)
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita que la página intente recargarse sola

    // Vuelve a bloquear mientras se envía la información al servidor
    window.procesoPeticion = true;
    boton.disabled = true;

    // Verificar que el usuario no haya dejado las listas desplegables en blanco
    let validarMiembro = validacion.validarSelect(miembro);
    let validarFactorRiesgo = validacion.validarSelect(factorRiesgo);

    // Si toda la selección es correcta
    if (validarMiembro && validarFactorRiesgo) {

      // Empaquetar los datos básicos para ser guardados
      const datosRegistro = {
        member_id: miembro.value,
        risk_factor_id: factorRiesgo.value,
        family_plan_id: id,
      };

      try {
        let data;
        // Lógica para decidir si crearlo de cero o actualizarlo:
        if (existePlanAccion.boolean) {
          // Si ya existía: Obtenemos su identificador real y lo actualizamos (Método de actualizar datos)
          const idPlanAccion = await api.get(`actionPlans/familyPlan/${id}`);
          data = await api.put(`actionPlans/${idPlanAccion.id}`, datosRegistro);
        } else {
          // Si es nuevo: Se crea de ceros en la base de datos
          data = await api.post(`actionPlans`, datosRegistro);
        }

        // Manejo de la respuesta que indique éxito
        if (data.success) {
          await alerta.alertaOK(data.message);
          // Si era nuevo, recargar la pantalla internamente para habilitar la sección de abajo (la lista de acciones)
          if (!existePlanAccion.boolean) location.reload();
        } else alerta.alertaWarning(data.message, data.errors);
      } catch (error) {
        alerta.alertaError(error.errors); // Muestra un mensaje de error crítico
      }
    }

    // Termina el envío y se vuelve a permitir el uso del botón
    boton.disabled = false;
    window.procesoPeticion = false;
  });

  // -------------- SEGUNDA SECCIÓN: LISTADO DE ACCIONES ESPECÍFICAS (Fase: ANTES) --------------
  // Solo se desbloquea y muestra esta zona inferior si el usuario ya guardó la parte de arriba
  if (existePlanAccion.boolean) {
    // Configuración de los botones inferiores (Siguiente y Atrás)
    botonSiguiente.disabled = false; // Como estamos en 'Antes', permitimos avanzar a 'Durante'
    botonAtras.disabled = true; // Estamos en la Fase 1, no hay fase anterior, por lo tanto se bloquea

    // Título visible en pantalla para indicar en qué fase estamos
    const planAccionTitulo = document.getElementById('planAccion__titulo');
    planAccionTitulo.textContent = 'Antes';

    // Hace visible el recuadro inferior donde saldrán las tarjetas de acción
    containerTipoAccion.classList.remove("invisible");

    // Solicitar nuevamente el identificador interno del plan guardado
    const idPlanAccion = await api.get(`actionPlans/familyPlan/${id}`);

    // El contenedor vacío donde se dibujarán e insertarán las tarjetitas
    const contenedorAfecciones = document.querySelector(
      ".gestionarAfecciones__lista",
    );

    // Un simple número que identifica internamente al Backend que la fase es "ANTES" (Número 1)
    const tipoEstado = 1;

    // Función que solicita al servidor las acciones y se encarga de dibujar cada tarjeta en la pantalla
    const cargarAfecciones = async () => {
      // Pide al servidor todas las acciones vinculadas a este plan familiar
      const afecciones = await api.get(
        `actionPlanActions/actionPlan/${idPlanAccion.id}`,
      );

      contenedorAfecciones.innerHTML = ""; // Limpia las tarjetas actuales para no duplicarlas

      // Itera o recorre una a una las acciones obtenidas desde el servidor
      afecciones.forEach((item) => {
        // Se asegura que solo dibuje las que correspondan al estado "ANTES" (El número 1)
        if (tipoEstado == item.action_type_id) {
          const boton = document.createElement("button"); // Crea un recuadro clickeable
          boton.className = "gestionarAfecciones__afeccion"; // Asigna los estilos de color y forma
          boton.dataset.id = item.id; // Guarda internamente el código identificador de esa acción

          // Construye la estructura visual de la tarjeta mostrando a quién le toca y qué hará
          boton.innerHTML = `
            <span class="gestionarAfecciones__tipoNombre">
                <i class="ri-eye-fill"></i> ${item.member_name} - ${item.description}
            </span>`;
          contenedorAfecciones.appendChild(boton); // Añade visualmente esta tarjeta terminada al contenedor general
        }
      });
    };

    // Llama la función por primera vez para inicializar y mostrar las tarjetas si ya existen
    cargarAfecciones();

    window.procesoPeticion = false;
    boton.disabled = false;

    // Acción al tocar el botón con el ícono (+) para Añadir una nueva acción
    const botonAñadir = document.querySelector(".gestionarAfecciones__boton");

    if (esSupervisor) {
      botonAñadir.classList.add("oculto");
    }

    botonAñadir.addEventListener("click", async () => {
      // Usa una herramienta central para abrir una ventana y crear la acción (especifica que es fase 1 'Antes')
      modalPlanAccion.crear(id, tipoEstado, cargarAfecciones, idPlanAccion.id);
    });

    // Acción para capturar cuando el usuario hace clic sobre cualquiera de las tarjetas creadas
    contenedorAfecciones.addEventListener("click", async (e) => {
      // Averigua el código interno de la tarjeta que el usuario ha tocado
      const target = e.target.closest(".gestionarAfecciones__afeccion")
      if (!target) return; // Si no hizo click en un objetivo, no hacer nada

      const idAfeccion = target.dataset.id;
      // Abre una ventana emergente para que pueda modificar o borrar esta tarjeta específica
      modalPlanAccion.verEditarEliminar(idAfeccion, id, cargarAfecciones, esSupervisor);
    });

    // Acción del botón inferior Siguiente (Pasa a la Fase Durante)

    botonSiguiente.addEventListener("click", async () => {
      if (window.procesoPeticion) return; // Protección temporal mientras carga
      if (esSupervisor) {
          location.href = `#/supervisor/plan_familiar/plan_de_accion/durante?familia_id=${id}`;
          return;
      }
      location.href = `#/voluntario/plan_familiar/plan_de_accion/durante?familia_id=${id}`; // Lo lleva a la siguiente pantalla
    });
  }

  //Temporal hasta que se refactorice-----------------------------------------------------------
  const familyPlan = await api.get(`familyPlans/${id}`);

  if (familyPlan.status_plan_id === 6 || familyPlan.status_plan_id === 7) {
    containerTipoAccion.querySelectorAll(".gestionarAfecciones__afeccion").forEach(btn => {
      btn.disabled=true;
    });
    containerTipoAccion.querySelectorAll(".gestionarAfecciones__boton").forEach(btn => {
      btn.classList.add("oculto");
    });
    form.querySelectorAll(".boton").forEach(btn => {
      btn.classList.add("oculto");
    });
    form.querySelectorAll(".selector").forEach(select => {
      select.disabled=true;
    });
  }
};
