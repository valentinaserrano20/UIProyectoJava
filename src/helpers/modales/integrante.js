/**
 * Helper de Modales Complejos: Integrante (integrante.js)
 * Archivo encargado de gestionar los modales SweetAlert dedicados al sub-módulo Médico
 * de un Integrante familiar. Permite visualizar, crear, editar y eliminar "Afecciones Médicas" 
 * y sus regímenes de dosificación.
 */
import * as api from "../api";
import * as alerta from "../alertas";
import * as validacion from "../validacionInputs"
import { initTomSelectPortatil } from "../tomSelectPortatil";
import * as adjuntarOpc from "../adjuntarOpciones";

// Función para ver los detalles globales del integrante de una sola vez
export const ver = async (id) => {

  // Descarga info personal del integrante
  const datos = await api.get(`members/${id}`);
  
  // Descarga el listado de afecciones que sufre el integrante
  const condiciones = await api.get(`conditionMembers/member/${id}`);

  let condicionNombre = "";
  let condicionMedicina = "";
  let contadorCondicionNombre = 0;
  let contadorCondicionMedicina = 0;

  // Itera sobre el array de afecciones uniendo todo en un string gigante separado por comas
  condiciones.forEach((condicion) => {
    // Nombre de la afección
    contadorCondicionNombre > 0
      ? (condicionNombre += ", " + condicion.name)
      : (condicionNombre += condicion.name);
    contadorCondicionNombre++;
    
    // Tratamiento o medicina especificados (si se ha documentado alguno)
    if (condicion.dose != null) {
      contadorCondicionMedicina > 0
        ? (condicionMedicina += ", " + condicion.dose)
        : (condicionMedicina += condicion.dose);
      contadorCondicionMedicina++;
    }
    
    // Si quedan vacios
    contadorCondicionNombre == 0 ? (condicionNombre = "ninguno") : "";
    contadorCondicionMedicina == 0 ? (condicionNombre = "ninguno") : "";
  });

  // Chequeo global por si no existe ni una sola condición
  if (condiciones.length == 0) {
    condicionNombre = "ninguno";
    condicionMedicina = "ninguno";
  }

  // Interfaz de solo lectura con diseño grid
  const htmlModal = `
            <div class="modalVer modal">
                <div class="modalVer__dato">
                    <i class="ri-user-line"></i>
                    <div class="modalVer__titulo">Nombre</div>
                    <div class="modalVer__texto">${datos.names}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-user-line"></i>
                    <div class="modalVer__titulo">Apellidos</div>
                    <div class="modalVer__texto">${datos.last_names}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-info-card-line"></i>
                    <div class="modalVer__titulo">Tip documento </div>
                    <div class="modalVer__texto">${datos.document_type.acronym}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-id-card-line"></i>
                    <div class="modalVer__titulo">Num documento</div>
                    <div class="modalVer__texto">${datos.document_number}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-calendar-line modalVer__icono"></i>
                    <div class="modalVer__titulo">Fecha nacimiento</div>
                    <div class="modalVer__texto">${datos.birth_date}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-phone-line"></i>
                    <div class="modalVer__titulo">Telefono</div>
                    <div class="modalVer__texto">${datos.phone}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-men-line"></i>
                    <div class="modalVer__titulo">Genero</div>
                    <div class="modalVer__texto">${datos.gender.name}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-flag-line"></i>
                    <div class="modalVer__titulo">Parentesco</div>
                    <div class="modalVer__texto">${datos.kinship.name}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-heart-pulse-line"></i>
                    <div class="modalVer__titulo">Grupo Sanguineo</div>
                    <div class="modalVer__texto">${datos.blood_group.name}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-health-book-line"></i>
                    <div class="modalVer__titulo">EPS</div>
                    <div class="modalVer__texto">${datos.eps}</div>
                </div>
                <div class="modalVer__dato">
                    <i class="ri-flag-line"></i>
                    <div class="modalVer__titulo">Nacionalidad</div>
                    <div class="modalVer__texto">${datos.nationality.name}</div>
                </div>
                <div class="modalVer__dato modalVer__dato--largo">
                    <i class="ri-stethoscope-line"></i>
                    <div class="modalVer__titulo">Afecciones</div>
                    <div class="modalVer__texto">${condicionNombre}</div>
                </div>
                <div class="modalVer__dato modalVer__dato--largo">
                    <i class="ri-capsule-fill"></i>
                    <div class="modalVer__titulo">Medicinas o Dosis</div>
                    <div class="modalVer__texto">${condicionMedicina}</div>
                </div>
            </div>`;
            
  // Abre ventana base sin botones extras
  alerta.Ver(htmlModal, false, false, null, null);
};


// Agrega una nueva enfermedad o condición
export const afeccionCrear = async (id, recargarContainer) => {
  // Solicita la tabla tipoAfecciones (ej: "Alergia", "Enfermedad Crónica") para el dropdwon select
  const tiposAfeccionesPeticion = await api.get(`conditionTypes`);
  let tiposAfecciones = "";
  for (let i = 0; i < tiposAfeccionesPeticion.length; i++) {
    tiposAfecciones += `<option value="${tiposAfeccionesPeticion[i].id}">${tiposAfeccionesPeticion[i].name}</option>`;
  }
  
  // HTML que usa el componente TomSelect a través de clase "selector-portatil"
  const htmlModal = `
    <div class="explicacion modal">
      <p class="explicacion__titulo">Agregar Afección</p>
    </div>
    <div class="container__gap modal-50">
    <div class="input">
      <div class="form__inputBox form__inputBox--selector">
        <i class="ri-id-card-line" id="selector__icono"></i>
        <select class="selector-portatil" id="afecciones">
          <option value ="" hidden>Seleccione una afeccion...</option>
          ${tiposAfecciones}
        </select>
      </div>
    </div>
      <div class="input">
        <div class="form__inputBox">
          <i class="ri-syringe-line"></i>
          <input type="text" placeholder="Nombre de la afección" id="nombreAfeccion" autocomplete="off" data-tipo="textoCorto">
        </div>
      </div>
      <div class="input">
        <div class="form__inputBox">
          <i class="ri-calendar-line"></i>
          <textarea placeholder="Descripción de dosis" id="descripcion" autocomplete="off" data-tipo="textoLargoOpcional"></textarea>
        </div>
      </div>
    </div>`;

  // CALLBACK principal (click en Guardar en SweetAlert)
  const funcionModal = async () => {
    const contenedor = document.querySelector(".container__gap");
    const afeccion = document.getElementById("afecciones");
    const nombreAfeccion = document.getElementById("nombreAfeccion")
    const descripcion = document.getElementById("descripcion");

    const booleanValidacion = validacion.validadorAutomatico.validarTodo(contenedor);
    // Solo si aprueba validaciones prosigue la petición
    if (!booleanValidacion) return false
     
      // Objeto JSON asociativo para este miembro
      const datos = {
        member_id: id,
        condition_type_id: afeccion.value,
        name: nombreAfeccion.value,
        dose: descripcion.value,
      };

      try {
        const data = await api.post("conditionMembers", datos);    
        if (data.success) {
          await alerta.alertaOK(data.message); // Notifica confirmación
          await recargarContainer(); // Carga de nuevo toda la información de pantalla
          return true
        }
        else {
          alerta.alertaWarning(data.message, data.errors);
          return false
        }
      } catch (error) {
        alerta.alertaError(error.errors);
        return false
      }
  };
  
  // LOGICA SECUNDARIA: Funciones de evento inyectadas cuando Swal TERMINA DE ABRIRSE (Para TomSelect y detectores KeyDown en caliente)
  const funcionAlAbrir = async () => {
    const contenedor = document.querySelector(".container__gap");
    validacion.validadorAutomatico.init(contenedor);
  }
  
  // Ejecuta Sweet alert pasando modal visual y funciones reactivas para el on-click y on-open
  alerta.Crear(htmlModal, funcionModal, funcionAlAbrir);
  // Inicializador del widget avanzado Tom Select adaptativo (en helper tomSelectPortatil.js)
  initTomSelectPortatil();
}


// Manejador anidado para inspeccionar una afección particular (de una posible lista en el plan)
export const verEditarEliminar = async (id, integranteId, recargarContainer, esSupervisor) => {
  // Pide el contenido existente de esa receta o afección puntual
  const datos = await api.get(`conditionMembers/${id}`);
  
  // Vista resumida
  const htmlModal = `
            <div class="modalVer modal">
                <div class="modalVer__dato">
                    <i class="ri-building-line modalVer__icono"></i>
                    <div class="modalVer__titulo">Tipo de Afeccion</div>
                    <div class="modalVer__texto">${datos.condition_type.name}</div>
                </div>

                <div class="modalVer__dato">
                    <i class="ri-syringe-line modalVer__icono"></i>
                    <div class="modalVer__titulo">Nombre Afeccion</div>
                    <div class="modalVer__texto">${datos.name}</div>
                </div>

                <div class="modalVer__dato modalVer__dato--largo">
                    <i class="ri-calendar-line modalVer__icono"></i>
                    <div class="modalVer__titulo">Descripcion</div>
                    <div class="modalVer__texto">${datos.dose != null ? datos.dose : "-"}</div>
                </div>
            </div>`;

  // ✏ Lógica si el usuario oprime "Modificar" en el mini-modal de afección
  const funcionModalEditar = async () => {
    // Es imperativo sacar tipos nuevamente para el listado de Select
    const tipos = await api.get("conditionTypes");
    const info = await api.get(`conditionMembers/${id}`);

    let opcionesTexto = "";

    // Pinta la actual como pre-seleccionada o 'selected'
    for (let i = 0; i < tipos.length; i++) {
      opcionesTexto += `
      <option value="${tipos[i].id}" ${tipos[i].id == info.condition_type_id ? "selected" : ""}>
      ${tipos[i].name}
      </option>`;
    }
    
    // HTML de edición rellenado
    const htmlModal = `
      <div class="explicacion modal">
        <p class="explicacion__titulo">Editar Afección</p>
      </div>

      <div class="container__gap modal-50">

    <div class="input">
      <div class="form__inputBox form__inputBox--selector">
        <i class="ri-id-card-line" id="selector__icono"></i>
        <select class="selector-portatil" id="afecciones">
          <option value ="" hidden>Seleccione una afeccion...</option>
          ${opcionesTexto}
        </select>
      </div>
    </div>

        <div class="input">
          <div class="form__inputBox">
            <i class="ri-syringe-line"></i>
            <input type="text"
              id="nombreAfeccion"
              placeholder="Nombre de la afección"
              autocomplete="off"
              value="${info.name}">
          </div>
        </div>

        <div class="input">
          <div class="form__inputBox">
            <i class="ri-calendar-line"></i>
            <textarea
              id="descripcion"
              placeholder="Descripción de dosis"
              autocomplete="off">${info.dose ?? ""}</textarea>
          </div>
        </div>

      </div>`;

    // Acción on-click Edit Confirm
    const funcionModal = async () => {

      const afeccion = document.getElementById("afecciones");
      const nombreAfeccion = document.getElementById("nombreAfeccion");
      const descripcion = document.getElementById("descripcion");

      // Corre validaciones preventivas JS
      let validarAfeccion = validacion.validar_select(afeccion);
      let validarNombre = validacion.validar_minimo(nombreAfeccion, 3);
      let validarDescripcion = validacion.validar_siExiste(descripcion, 10);

      // Si todo aprueba
      if (validarAfeccion && validarNombre && validarDescripcion) {

        const datos = {
          member_id: integranteId,
          condition_type_id: afeccion.value,
          name: nombreAfeccion.value,
          dose: descripcion.value
        };

        try {

          // Opciones con PUT verbo REST para reemplazar recursos totales.
          const data = await api.put(`conditionMembers/${id}`, datos);

          if (data.success) {

            await alerta.alertaOK(data.message); // Modificación completada
            await recargarContainer();
            return true;

          } else {

            alerta.alertaWarning(data.message, data.errors);
            return false;

          }

        } catch (error) {
          alerta.alertaError(error.errors);
          return false;

        }

      }

      return false;

    };

    // Reengancha detectores de escritura (restricciones de sintaxis dictadas) en el DOM recién abierto
    const funcionAlAbrir = () => {

      const afeccion = document.getElementById("afecciones");
      const nombreAfeccion = document.getElementById("nombreAfeccion");
      const descripcion = document.getElementById("descripcion");

      nombreAfeccion.addEventListener("keydown", (e) => {
        validacion.keyboard_limite(e, 30);
        validacion.keyboard_textoEspacio(e);
      });

      descripcion.addEventListener("keydown", (e) => {
        validacion.keyboard_limite(e, 200);
      });

      afeccion.addEventListener("change", (e) => {
        validacion.limpiarError(e.target);
      });

    };

    // Abre modal de edición
    alerta.Crear(htmlModal, funcionModal, funcionAlAbrir);
    // Aplica renderizado Tom Select
    initTomSelectPortatil();

  };
  
  // 🗑 Confirmación de purgado
  const funcionModalEliminar = async () => {
    // Sweetalert modo cuestionario
    const confirmacion = await alerta.alertaQuest(
      "¿Seguro que deseas eliminar esta afeccion del integrante?",
    );
    // Escape si pulsa botón negativo
    if (!confirmacion.isConfirmed) return;
    
    // Dispara borrado real a la nube
    const eliminado = await api.delet(`conditionMembers/${id}`);
    
    if (eliminado.success) {
      await alerta.alertaOK(eliminado.message);
      await recargarContainer(); // Carga entorno padre
    }
  };

  alerta.Ver(htmlModal, true, true, funcionModalEditar, funcionModalEliminar, esSupervisor);
}