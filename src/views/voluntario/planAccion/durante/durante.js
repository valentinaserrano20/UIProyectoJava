/**
 * Controlador: Plan de Acción - DURANTE (durante.js)
 * Gestiona la fase media del modelo de acción ante un riesgo.
 * Posiciona al usuario en la pestaña 'Durante', permitiendo ir adelante 
 * ('Después') o regresar atrás ('Antes') libremente.
 */
import * as api from "../../../../helpers/api";
import * as alerta from "../../../../helpers/alertas";
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";
import * as cargarDatos from "../../../../helpers/cargarDatos";
import * as validacion from "../../../../helpers/validacionInputs";
import * as modalPlanAccion from "../../../../helpers/modales/planAccion";

export default async () => {
  // Referencias a los elementos que siempre están en la pantalla
  const botonBack = document.getElementById("botonBack"); // Botón para regresar al menú principal
  const boton = document.getElementById("botonGuardar"); // Botón principal para enviar los datos base
  const form = document.querySelector(".form"); // Contenedor de formulario principal

  // Extrae el identificador del plan familiar desde la dirección en la barra de búsqueda
  const id = location.hash.split("=")[1];

  // Listas desplegables disponibles en pantalla
  const miembro = document.getElementById("miembro");
  const factorRiesgo = document.getElementById("factorRiesgo");
  const containerTipoAccion = document.querySelector(".container__gap"); // Recuadro que encapsula la lista inferior

  // Botones inferiores para navegar entre las distintas fases (Antes, Durante y Después)
  const botonSiguiente = document.getElementById("siguiente");
  const botonAtras = document.getElementById("atras");

  // Red de Protección inicial para evitar toques dobles de pantalla accidentales por parte del usuario
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  const esSupervisor = location.hash.includes("/supervisor/");

  // Comportamiento de botón que saca al usuario y lo lleva al menú
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return; // Si la app está cargando, bloquea la salida temporalmente

    if (esSupervisor) {
      location.href = `#/supervisor/plan_familiar/revision?familia_id=${id}`;
      return;
    }

    location.href = `#/voluntario/plan_familiar/familia?id=${id}`;
  };

  // Trae de la base de datos a los integrantes y los factores de riego ya guardados para llenar las opciones a seleccionar
  await adjuntarOpc.adjuntarMiembros(miembro, `members/familyPlan/select/${id}`,);
  await adjuntarOpc.adjuntarFactorRiesgo(factorRiesgo, `factoresRiesgo/planFamiliar/seleccion/${id}`);

  // Eventos para quitar los contornos rojos de error que avisan cuando el usuario selecciona alguna opción de la lista
  miembro.addEventListener("change", () => {
    validacion.limpiarError(miembro);
  });
  factorRiesgo.addEventListener("change", () => {
    validacion.limpiarError(factorRiesgo);
  });

  window.procesoPeticion = false;
  boton.disabled = false; // Vuelve a permitir oprimir botones

  // Comprueba si el usuario ya guardó un plan de acción para esta familia
  const existePlanAccion = await api.get(
    `actionPlans/familyPlan/boolean/${id}`,
  );

  // Si existe información previa, se pide rellenar automáticamente las listas desplegables
  if (existePlanAccion.boolean) {
    await cargarDatos.cargarDatos(
      `actionPlans/familyPlan/${id}`,
      [miembro, factorRiesgo], // Elementos en la interfaz visual
      ["member_id", "risk_factor_id"], // Campos coincidentes con la información que el servidor entrega
    );
  }

  // Interacción del formulario cuando se envía y oprime 'Guardar'
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Detiene el parpadeo y la recarga de página convencional
    window.procesoPeticion = true;
    boton.disabled = true;

    // Validación para asegurar que se escogieron valores de ambas listas
    let validarMiembro = validacion.validarSelect(miembro);
    let validarFactorRiesgo = validacion.validarSelect(factorRiesgo);
    if (validarMiembro && validarFactorRiesgo) {

      // Estructurar toda la información a enviar de forma ordenada 
      const datosRegistro = {
        member_id: miembro.value,
        risk_factor_id: factorRiesgo.value,
        family_plan_id: id,
      };

      // Ejecución de la comunicación con el servidor
      try {
        let data;
        if (existePlanAccion.boolean) {
          // Si el plan ya existe (Porque se creó en la pestaña 'Antes'), entonces se envía la acción de actualizar
          const idPlanAccion = await api.get(`actionPlans/familyPlan/${id}`);
          data = await api.put(`actionPlans/${idPlanAccion.id}`, datosRegistro);
        } else {
          // Creación desde Cero (Por si el usuario se saltó la pestaña 'Antes')
          data = await api.post(`actionPlans`, datosRegistro);
        }
        // Feedback visual tipo ventana de notificación tras concluir con éxito
        if (data.success) {
          await alerta.alertaOK(data.message);
          // Auto-reinicia la vista si es un formulario recién creado para forzar a que aparezca la segunda sección
          if (!existePlanAccion.boolean) location.reload();
        } else alerta.alertaWarning(data.message, data.errors);
      } catch (error) {
        alerta.alertaError(error.errors);
      }
    }

    // Recuperar el control para el usuario
    boton.disabled = false;
    window.procesoPeticion = false;
  });

  // -------------- SEGUNDA SECCIÓN: LISTADO DE ACCIONES CORTAS (Fase: DURANTE) --------------
  if (existePlanAccion.boolean) {
    // Como esta fase es la de en Medio, permite usar el botón anterior y el botón siguiente libremente
    botonSiguiente.disabled = false;
    botonAtras.disabled = false;

    // Asigna dinámicamente el título principal
    const planAccionTitulo = document.getElementById('planAccion__titulo');
    planAccionTitulo.textContent = 'Durante';

    // Retira la etiqueta que mantiene invisible la sección inferior, permitiéndole ser visualizada en la pantalla
    containerTipoAccion.classList.remove("invisible");

    // Recuperar código con el identificador del plan de acción principal
    const idPlanAccion = await api.get(`actionPlans/familyPlan/${id}`);

    // Contenedor general en pantalla que actúa como caja para las tarjetas
    const contenedorAfecciones = document.querySelector(
      ".gestionarAfecciones__lista",
    );

    // Valor referencial que el sistema asume como "Fase Durante" (El número 2)
    const tipoEstado = 2;

    // Función creadora que consulta las acciones del servidor y dibuja repetitivamente las tarjetas correctas
    const cargarAfecciones = async () => {
      // Solicitar todas las acciones del servidor
      const afecciones = await api.get(
        `actionPlanActions/actionPlan/${idPlanAccion.id}`,
      );
      contenedorAfecciones.innerHTML = ""; // Vacía el recuadro general de tarjetas

      afecciones.forEach((item) => {
        // Un filtro natural para ignorar cualquier acción que no sea un "2" (DURANTE)
        if (tipoEstado == item.action_type_id) {
          const boton = document.createElement("button");
          boton.className = "gestionarAfecciones__afeccion";
          boton.dataset.id = item.id;
          boton.innerHTML = `
            <span class="gestionarAfecciones__tipoNombre">
                <i class="ri-eye-fill"></i> ${item.member_name} - ${item.description}
            </span>`;
          contenedorAfecciones.appendChild(boton); // Agregar a la lista dibujada en pantalla
        }
      });
    };
    // Inicializa llamando el dibujado desde la primera vez
    cargarAfecciones();

    window.procesoPeticion = false;
    boton.disabled = false;

    // Evento sobre el botón con símbolo de "+" para agregar más acciones a esta fase
    const botonAñadir = document.querySelector(".gestionarAfecciones__boton");
    
    if (esSupervisor) {
      botonAñadir.classList.add("oculto");
    }

    botonAñadir.addEventListener("click", async () => {
      // Usa el elemento global para abrir una ventana emergente de creación, dictando la fase 2 ('Durante')
      modalPlanAccion.crear(id, tipoEstado, cargarAfecciones, idPlanAccion.id);
    });

    // Detecta los toques a lo largo de cualquier parte donde están listadas las tarjetas de acción
    contenedorAfecciones.addEventListener("click", async (e) => {
      // Extrae la referencia única del clic sobre la tarjeta dibujada
      const target = e.target.closest(".gestionarAfecciones__afeccion")
      if (!target) return; // Si no hizo click en un objetivo, no hacer nada

      const idAfeccion = target.dataset.id;
      // Ventana que pregunta si edita o elimina dicha opción
      modalPlanAccion.verEditarEliminar(idAfeccion, id, cargarAfecciones, esSupervisor);
    });


    // Eventos a las pestañas de navegación (Llevar a pantalla anterior y pantalla siguiente)

    botonAtras.addEventListener("click", async () => {
      if (window.procesoPeticion) return;
      if (esSupervisor) {
        location.href = `#/supervisor/plan_familiar/plan_de_accion/antes?familia_id=${id}`;
        return;
      }
      location.href = `#/voluntario/plan_familiar/plan_de_accion/antes?familia_id=${id}`;
    });
    botonSiguiente.addEventListener("click", async () => {
      if (window.procesoPeticion) return;
      if (esSupervisor) {
        location.href = `#/supervisor/plan_familiar/plan_de_accion/despues?familia_id=${id}`;
        return;
      }
      location.href = `#/voluntario/plan_familiar/plan_de_accion/despues?familia_id=${id}`;
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
