/**
 * Helper de Modales Complejos: Factores de Riesgo (factorRiesgo.js)
 * Contiene un mini-ecosistema de modales entrelazados. Permite no solo Ver el factor en sí,
 * sino levantar pop-ups hijos para Crear, Editar y Eliminar tareas de reducción y 
 * debilidades (Vulnerabilidades) colgadas de dicho Riesgo.
 */
import * as api from "../api";
import * as alerta from "../alertas";

// Ventana General Informativa del Factor de Riesgo particular
export const ver = async (id) => {

    // 1. Invoca llamadas GET para centralizar info relacionada
    const datos = await api.get(`factoresRiesgo/${id}`);
    const acciones = await api.get(`accionesReduccion/factorRiesgo/${id}`);
    const vulnerabilidades = await api.get(`factoresVulnerabilidad/factorRiesgo/${id}`);
    
    // Contenedores textuales iterables
    let todasAcciones = "";
    let todasVulnerabilidades = "";
    let contadorAcciones = 0;
    let contadorVulnerabilidades = 0;

    // Procesamiento y agrupación de Strings p/acciones
    acciones.forEach((accion) => {
    contadorAcciones > 0 ? 
    (todasAcciones += `, ${accion.action} - Encargado: ${accion.member.names} ${accion.member.last_names} - Fecha finalización: ${accion.end_date}`) :
    (todasAcciones += `${accion.action} - Encargado: ${accion.member.names} ${accion.member.last_names} - Fecha finalización: ${accion.end_date}`);
    contadorAcciones++;});
    
    if (acciones.length == 0) todasAcciones = "ninguna";
    
    // Procesamiento y agrupación de Strings p/vulnerabilidades
    vulnerabilidades.forEach((vulnerabilidad) => {
    contadorVulnerabilidades > 0 ?
    (todasVulnerabilidades += `, ${vulnerabilidad.vulnerability.name} - Grado: ${vulnerabilidad.vulnerability_grade.name}`) :
      todasVulnerabilidades += `${vulnerabilidad.vulnerability.name} - Grado: ${vulnerabilidad.vulnerability_grade.name}`;
    });
    
    if (vulnerabilidades.length == 0) todasVulnerabilidades = "ninguna";

    // 2. Definición del cuerpo visual usando template literals dinámicos
    const htmlModal = `
    <div class="modalVer modal">

      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-shield-check-line"></i>
        <div class="modalVer__titulo">Tipo de Amenaza</div>
        <div class="modalVer__texto">${datos.threat_type.name}</div>
      </div>

      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-user-line"></i>
        <div class="modalVer__titulo">Descripcion</div>
        <div class="modalVer__texto">${datos.description}</div>
      </div>

      <div class="modalVer__dato">
        <i class="ri-calendar-line"></i>
        <div class="modalVer__titulo">Ubicacion del riesgo</div>
        <div class="modalVer__texto">${datos.ubication}</div>
      </div>

      <div class="modalVer__dato">
        <i class="ri-map-pin-line"></i>
        <div class="modalVer__titulo">Distancia</div>
        <div class="modalVer__texto">${datos.distance} m</div>
      </div>

      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-list-check"></i>
        <div class="modalVer__titulo">Acciones de reducción de riesgo</div>
        <div class="modalVer__texto">${todasAcciones}</div>
      </div>

      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-list-check"></i>
        <div class="modalVer__titulo">Vulnerabilidades</div>
        <div class="modalVer__texto">${todasVulnerabilidades}</div>
      </div>
    </div>
  `;

    // 3. Renderiza en pantalla sin botones CRUD
    alerta.Ver(htmlModal, false, false, null, null, null);
};


// Lanza formulario para crear una nueva "Acción de Reducción" asociada al Factor Riesgo
export const crearAccion = async (riskFactorId, familyPlanId, recargarContainer) => {

    // Extrae los familiares registrados en el plan para listarlos en el Input Encargado
    const members = await api.get(`members/familyPlan/select/${familyPlanId}`);
    let options = "";
    members.forEach(member => {
        options += `<option value="${member.id}">${member.full_name}</option>`;
    });

    // Marco del SweetAlert
    const htmlModal = `
    <div class="explicacion modal">
      <p class="explicacion__titulo">Agregar Acción de Reducción</p>
    </div>

    <div class="form">

      <div class="form__inputBox modal-50">
        <i class="ri-shield-check-line"></i>
        <input type="text" 
               class="form__input form__action" 
               placeholder="Acción a realizar"
               autocomplete="off">
      </div>

      <div class="form__inputBox">
        <i class="ri-user-line"></i>
        <select class="form__input form__member">
          <option value="">Seleccione un miembro</option>
          ${options}
        </select>
      </div>

      <div class="form__inputBox">
        <i class="ri-calendar-line"></i>
        <input type="date" class="form__input form__date">
      </div>

    </div>
  `;

    // Hook: se activa con el Ok confirmatorio
    const funcionModal = async () => {

        // Cosecha los value
        const datos = {
            action: document.querySelector(".form__action").value,
            member_id: document.querySelector(".form__member").value,
            risk_factor_id: riskFactorId, // Amarre foreign key vital
            end_date: document.querySelector(".form__date").value
        };

        try {
            // Emite por POST
            const data = await api.post("accionesReduccion", datos);

            // Validaciones API (success flag)
            if (data.success) {
                await alerta.alertaOK(data.message);
                await recargarContainer();
            } else {
                alerta.alertaWarning(data.message, data.errors);
            }

        } catch (error) {
            alerta.alertaError(error.errors);
        }

    };

    // Abre el creador
    alerta.Crear(htmlModal, funcionModal);
};

// Sub-Controlador: Lee en modal una acción de riesgo, pero con habilitación CRUD (Edita y Borra hijo)
export const verEditarEliminarAccion = async (id, familyPlanId, recargarContainer, esSupervisor) => {

    const datos = await api.get(`accionesReduccion/${id}`);
    
    // Estructura de vista default (lectura)
    const htmlModal = `
    <div class="modalVer modal">

      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-shield-check-line"></i>
        <div class="modalVer__titulo">Acción</div>
        <div class="modalVer__texto">${datos.action}</div>
      </div>

      <div class="modalVer__dato  modalVer__dato--largo">
        <i class="ri-user-line"></i>
        <div class="modalVer__titulo">Miembro</div>
        <div class="modalVer__texto">${datos.member.names} ${datos.member.last_names}</div>
      </div>

      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-calendar-line"></i>
        <div class="modalVer__titulo">Fecha Finalización</div>
        <div class="modalVer__texto">${datos.end_date}</div>
      </div>

    </div>
  `;

    // ✏ ALGORITMO DE EDICIÓN
    const funcionModalEditar = async () => {

        // Recarga catálogo delegados
        const members = await api.get(`members/familyPlan/select/${familyPlanId}`);
        
        let options = "";
        members.forEach(member => {
            options += `
        <option value="${member.id}" 
          ${member.id == datos.member_id ? "selected" : ""}>
          ${member.full_name}
        </option>`;
        });

        // Pantalla de Form Editar rellena
        const htmlEditar = `
      <div class="explicacion modal">
        <p class="explicacion__titulo">Editar Acción</p>
      </div>

      <div class="form">

        <div class="form__inputBox modal-50">
          <i class="ri-shield-check-line"></i>
          <input type="text" 
                 class="form__input form__action" 
                 value="${datos.action}">
        </div>

        <div class="form__inputBox">
          <i class="ri-user-line"></i>
          <select class="form__input form__member">
            ${options}
          </select>
        </div>

        <div class="form__inputBox">
          <i class="ri-calendar-line"></i>
          <input type="date" 
                 class="form__input form__date" 
                 value="${datos.end_date}">
        </div>

      </div>
    `;

        const funcionModal = async () => {

            const dataUpdate = {
                action: document.querySelector(".form__action").value,
                member_id: document.querySelector(".form__member").value,
                end_date: document.querySelector(".form__date").value
            };

            try {
                // Notese el uso de "PATCH" para edición parcial
                const response = await api.patch(`accionesReduccion/${id}`, dataUpdate);

                if (response.success) {
                    await alerta.alertaOK(response.message);
                    await recargarContainer();
                } else {
                    alerta.alertaWarning(response.message, response.errors);
                }

            } catch (error) {
                alerta.alertaError(error.errors);
            }

        };

        alerta.Crear(htmlEditar, funcionModal);
    };

    // 🗑 ALGORITMO BORRADOR
    const funcionModalEliminar = async () => {

        // Prevención accidentes
        const confirmacion = await alerta.alertaQuest(
            "¿Seguro que deseas eliminar esta acción?"
        );

        if (!confirmacion.isConfirmed) return; // Rompe si "Cancelar"

        // Eliminación física
        const eliminado = await api.delet(`accionesReduccion/${id}`);

        if (eliminado.success) {
            await alerta.alertaOK(eliminado.message);
            await recargarContainer();
        }
    };

    // Renderiza modal incial de vista habilitando edición y tachado
    alerta.Ver(htmlModal, true, true, funcionModalEditar, funcionModalEliminar, esSupervisor);
};


// Agregador de debilidades de un Factor de Riesgo. Mismo mecanismo de creación que arriba
export const crearVulnerabilidad = async (riskFactorId, recargarContainer) => {

    // 🔹 Traer selects dependientes para llenar el dropdown
    const vulnerabilityGrades = await api.get("gradosVulnerabilidad");
    const vulnerabilities = await api.get("vulnerabilidades");

    let optionsGrades = "";
    vulnerabilityGrades.forEach(item => {
        optionsGrades += `<option value="${item.id}">${item.name}</option>`;
    });

    let optionsVulnerabilities = "";
    vulnerabilities.forEach(item => {
        optionsVulnerabilities += `<option value="${item.id}">${item.name}</option>`;
    });

    const htmlModal = `
    <div class="explicacion modal">
      <p class="explicacion__titulo">Agregar Vulnerabilidad</p>
    </div>

    <div class="form">
      <div class="form__inputBox modal-50">
        <i class="ri-alert-line"></i>
        <select class="form__input form__vulnerability">
          <option value="">Seleccione vulnerabilidad</option>
          ${optionsVulnerabilities}
        </select>
      </div>

      <div class="form__inputBox">
        <i class="ri-bar-chart-line"></i>
        <select class="form__input form__vulnerabilityGrade">
          <option value="">Seleccione grado</option>
          ${optionsGrades}
        </select>
      </div>

    </div>
  `;

    const funcionModal = async () => {

        const datos = {
            vulnerability_id: document.querySelector(".form__vulnerability").value,
            vulnerability_grade_id: document.querySelector(".form__vulnerabilityGrade").value,
            risk_factor_id: riskFactorId
        };

        try {
            const response = await api.post("factoresVulnerabilidad", datos);

            if (response.success) {
                await alerta.alertaOK(response.message);
                await recargarContainer(); // Carga de nuevo la visual
            } else {
                alerta.alertaWarning(response.message, response.errors);
            }

        } catch (error) {
            alerta.alertaError(error.errors);
        }
    };

    alerta.Crear(htmlModal, funcionModal);
};

// Modal de lectura simple pero equiparado con la capacidad de borrado de dicha vulnerabilidad detectada
export const verEditarEliminarVulnerabilidad = async (id, recargarContainer, esSupervisor) => {

    const datos = await api.get(`factoresVulnerabilidad/${id}`);

    const htmlModal = `
    <div class="modalVer modal">

      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-alert-line"></i>
        <div class="modalVer__titulo">Vulnerabilidad</div>
        <div class="modalVer__texto">${datos.vulnerability.name}</div>
      </div>

      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-bar-chart-line"></i>
        <div class="modalVer__titulo">Grado</div>
        <div class="modalVer__texto">${datos.vulnerability_grade.name}</div>
      </div>

    </div>
  `;

    // ✏ EDITAR (Nuevos Selects pre-seleccionados)
    const funcionModalEditar = async () => {

        const vulnerabilityGrades = await api.get("gradosVulnerabilidad");
        const vulnerabilities = await api.get("vulnerabilidades");

        let optionsGrades = "";
        vulnerabilityGrades.forEach(item => {
            optionsGrades += `
            <option value="${item.id}" 
              ${item.id == datos.vulnerability_grade_id ? "selected" : ""}>
              ${item.name}
            </option>`;
        });

        let optionsVulnerabilities = "";
        vulnerabilities.forEach(item => {
            optionsVulnerabilities += `
            <option value="${item.id}" 
              ${item.id == datos.vulnerability_id ? "selected" : ""}>
              ${item.name}
            </option>`;
        });

        const htmlEditar = `
        <div class="explicacion modal">
          <p class="explicacion__titulo">Editar Vulnerabilidad</p>
        </div>

        <div class="form">

          <div class="form__inputBox modal-50">
            <i class="ri-alert-line"></i>
            <select class="form__input form__vulnerability">
              ${optionsVulnerabilities}
            </select>
          </div>

          <div class="form__inputBox">
            <i class="ri-bar-chart-line"></i>
            <select class="form__input form__vulnerabilityGrade">
              ${optionsGrades}
            </select>
          </div>

        </div>
      `;

        const funcionModal = async () => {

            const dataUpdate = {
                vulnerability_id: document.querySelector(".form__vulnerability").value,
                vulnerability_grade_id: document.querySelector(".form__vulnerabilityGrade").value
            };

            try {
                // Pide actualización en el backend (PATCH)
                const response = await api.patch(`factoresVulnerabilidad/${id}`, dataUpdate);

                if (response.success) {
                    await alerta.alertaOK(response.message);
                    await recargarContainer();
                } else {
                    alerta.alertaWarning(response.message, response.errors);
                }

            } catch (error) {
                alerta.alertaError(error.errors);
            }
        };

        // Levanta cuadro editable
        alerta.Crear(htmlEditar, funcionModal);
    };

    // 🗑 ELIMINAR VULNERABILIDAD SUBORDINADA
    const funcionModalEliminar = async () => {

        const confirmacion = await alerta.alertaQuest(
            "¿Seguro que deseas eliminar esta vulnerabilidad?"
        );

        if (!confirmacion.isConfirmed) return;

        const eliminado = await api.delet(`factoresVulnerabilidad/${id}`);

        if (eliminado.success) {
            await alerta.alertaOK(eliminado.message);
            await recargarContainer();
        }
    };

    // Abre el modal inicial inyectando las lógicas CRUD completas
    alerta.Ver(htmlModal, true, true, funcionModalEditar, funcionModalEliminar, esSupervisor);
};