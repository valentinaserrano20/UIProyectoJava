

import Swal from "sweetalert2";
import * as api from "./api.js";

// ==========================================
// ALERTAS BÁSICAS DE INFORMACIÓN
// ==========================================
// Las siguientes construcciones de alertaError, alertaOK y alertaWarning
// están siendo reemplazadas por la vista nativa: src/componentes/modales/modalGeneral.html

// Muestra un modal de Error clásico (Icono X rojo) con un solo botón de "Ok"
export const alertaError = (mensaje) => {
  return Swal.fire({
    icon: "error",
    title: "Error",
    text: mensaje,
    confirmButtonText: "Ok",
    customClass: {
      confirmButton: "botonCancelar", // Inyecta CSS personalizado naranja/rojo
    },
  });
};

// Muestra un modal de Éxito (Icono Check verde). Permite ser arrastrado por la pantalla.
export const alertaOK = (mensaje) => {
  return Swal.fire({
    title: mensaje,
    icon: "success",
    draggable: true, // Habilita el drag and drop del modal
    confirmButtonText: "Ok",
    customClass: {
      confirmButton: "botonOK", // CSS personalizado en verde/azul
      title: "modalTitulo",
    },
  });
};

// Muestra un modal de Advertencia o Precaución (Icono de Triángulo amarillo)
export const alertaWarning = (titulo, mensaje) => {
  return Swal.fire({
    icon: "warning",
    title: titulo,
    text: mensaje,
    confirmButtonText: "Ok",
    customClass: {
      confirmButton: "botonOK",
    },
  });
};

// ==========================================
// ALERTAS DE CONFIRMACIÓN O PREGUNTA
// ==========================================

// Modal interactivo de "¿Sí o No?". Devuelve una Promesa (Promise) que resuelve en un estado booleano
export const alertaQuest = (mensaje) => {
  return Swal.fire({
    title: mensaje,
    icon: "question",
    showCancelButton: true, // Activa el botón secundario "No"
    cancelButtonText: "No",
    confirmButtonText: "Si",
    customClass: {
      confirmButton: "botonOK",
      cancelButton: "botonCancelar",
    },
  });
};

// Mini-notificación (Toast) en la esquina superior derecha que desaparece sola tras 2 segundos
export const alertaMensaje = (mensaje) => {
  return Swal.fire({
    toast: true, // Convierte el modal grande en etiqueta flotante tipo Snackbar
    position: "top-end", // Posicionado arriba a la derecha
    icon: "error",
    title: mensaje,
    showConfirmButton: false, // Oculta botones
    timer: 2000,  // Autodestrucción en milisegundos
    timerProgressBar: true, // Muestra barrita de tiempo decreciendo
    didOpen: (toast) => {
      // Pausa el contador al pasarle el mouse, lo reanuda al quitarlo
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
};

// Modal variante de pregunta que ofrece posponer la acción ("Más tarde" vs "Sí")
export const alertaPreguntarMasTarde = (mensaje) => {
  return Swal.fire({
    title: "¿Estas seguro?",
    text: mensaje,
    icon: "question",
    showCancelButton: true,
    cancelButtonText: "Mas tarde",
    confirmButtonText: "Si",
    customClass: {
      confirmButton: "botonOK",
      cancelButton: "botonCancelar",
    },
  });
};

// ==========================================
// PANTALLAS DE CARGA (LOADING)
// ==========================================

// Lanza un Spinner animado infinito que bloquea la pantalla hasta ordenarle cierre
export const alertaLoading = () => {
  Swal.fire({
    title: 'Cargando...',
    text: 'Por favor espera',
    allowOutsideClick: false, // Evita que se cierre al clickear fuera (backdrop)
    didOpen: () => {
      Swal.showLoading(); // Inyecta la animación CSS de carga al modal
   }
  });
};

// Cierra forzosamente la última alerta activa en pantalla (se usa para matar el Loading anterior)
export const alertaLoadingCerrar = () => {
  Swal.close();
}

// ==========================================
// MODALES COMPLEJOS (FORMULARIOS Y HTML INYECTADO)
// ==========================================

// Abre un SweetAlert gigante donde inyecta todo un formulario o mini-vista HTML.
// Se usa mucho para ventanas modales de Creación de registros pequeños.
export const Crear = async (htmlModal, funcionModal, funcionAlAbrir) => {
  Swal.fire({
    html: htmlModal, // DOM Inyectado como String template
    confirmButtonText: 'Guardar',
    confirmButtonColor: '#ff6600',
    showCloseButton: true, // Muestra botón (X) en la esquina
    focusConfirm: false,
    customClass: {
      confirmButton: 'botonOK'
    },

    // Callback justo después de renderizar el HTML del modal en pantalla
    didOpen: () => {
      if (funcionAlAbrir) {
        funcionAlAbrir(); // Se usa para inicializar selects o eventos en el HTML recién inyectado
      }
    },

    // Callback que se ejecuta justo antes de validar si se cierra cuando dan click a "Guardar"
    preConfirm: async () => {
      return await funcionModal(); // Evalúa código de guardado validando si deja pasar o no
    }
  });
};

// Modal visor: Muestra información de un registro y provee botones de control (Editar / Eliminar) 
export const Ver = (htmlModal, mostrarEditar, mostrarEliminar, funcionEditar, funcionEliminar, esSupervisor) => {
    Swal.fire({
        html: htmlModal,
        showCloseButton: true,
        focusConfirm: false,

        // BOTÓN EDITAR
        // Su visualización depende del booleano `mostrarEditar` enviado (Privilegios)
        showConfirmButton: mostrarEditar,
        confirmButtonText: 'Editar',

        // BOTÓN ELIMINAR
        showCancelButton: mostrarEliminar && !esSupervisor,
        cancelButtonText: 'Eliminar',

        customClass: {
            confirmButton: 'botonEditar',
            cancelButton: 'botonEliminar'
        },
        // Si pincha editar...
        preConfirm: () => {
            if (mostrarEditar && funcionEditar) {
                funcionEditar()
            }
            return false; // False evita que se cierre el modal automáticamente
        }
    }).then((result) => {
        // Si pincha eliminar (cancel en SweetAlert)...
        if (result.dismiss === Swal.DismissReason.cancel) {
            if (mostrarEliminar && funcionEliminar) {
                funcionEliminar()
            }
        }
    });
};

// Súper Modal visor: Permite además Mutar Estado (Activar/Desactivar) y Ver el Historial del objeto
export const VerEstado = (
    htmlModal,
    mostrarEditar,
    is_active,
    funcionEditar,
    funcionActivar,
    funcionDesactivar,
    nombre,
    id
) => {

    // Condicionales ternarios que deciden qué texto y botón mostrar según si está activo actualmente
    const textoEstado = is_active == 1 ? "Desactivar" : "Activar";
    const claseBotonEstado = is_active == 1 ? "botonEliminar" : "botonActivar";

    Swal.fire({
        html: htmlModal,
        showCloseButton: true,
        focusConfirm: false,

        // EDITAR
        showConfirmButton: mostrarEditar,
        confirmButtonText: 'Editar',

        // ACTIVAR / DESACTIVAR
        showCancelButton: true,
        cancelButtonText: textoEstado,

        // HISTORIAL
        showDenyButton: true, // Tercer botón de SweetAlert ("Deny" usado como historial acá)
        denyButtonText: 'Historial',

        customClass: {
            confirmButton: 'botonEditar',
            cancelButton: claseBotonEstado,
            denyButton: 'botonHistorial'
        },

        // Click en Editar
        preConfirm: () => {
            if (mostrarEditar && funcionEditar) {
                funcionEditar();
            }
            return false; // Deja modal abierto
        }

    }).then((result) => {

        // Click en Ver Historial
        if (result.isDenied) {
          // Historial(nombre, id); // Llama a la función global debajo
          window.location.href = `#/administrador-datosMaestros/historial-seccional/id=${id}`;
        }

        // Click en el botón de cambiar Estado (Activar/Desactivar)
        if (result.dismiss === Swal.DismissReason.cancel) {

            if (is_active == 1) {
                // Si estaba prendido delega tarea al callback de apagado
                if (funcionDesactivar) funcionDesactivar();
            } else {
                // Viceversa
                if (funcionActivar) funcionActivar();
            }

        }

    });
};

export const verDepartCiudad = (
    htmlModal,
    funcionEditar,
    nombre,
    id
) => {

    Swal.fire({
        html: htmlModal,
        showCloseButton: true,
        focusConfirm: false,

        confirmButtonText: 'Editar',

        customClass: {
            confirmButton: 'botonEditar',
        },

        // Click en Editar
        preConfirm: () => {
            funcionEditar();
        }
    });
};

// ==========================================
// MODALES FUNCIONALES ESPECÍFICOS DE LA LÍNEA DE NEGOCIO
// ==========================================

// Pide mediante la API el historial de auditoria de un registro ({tabla}/history/{id}) y lo formatea en una lista
export const Historial = async (nombre, id) => {
    // Si el nombre de la tabla es 'users', lo convertimos a 'usuarios' para mantener rutas en español
    const actualNombre = nombre === "users" ? "usuarios" : nombre;
    const rutaHistorial = actualNombre === "usuarios" ? "historial" : "history";
    const data = await api.get(`${actualNombre}/${id}/${rutaHistorial}`);

    // Construye la bitácora con Array.map() iterando cada acción guardada en la BD
    let contenido = `
      <div class="contenedorHistorial">
        ${data.map(item => `
          <div class="itemHistorial">
            <p><strong>Acción:</strong> ${item.action_execute}</p>
            <p><strong>Usuario:</strong> ${item.user_name}</p>
            <p><strong>Rol:</strong> ${item.rol}</p>
            <p><strong>Fecha:</strong> ${item.date_time}</p>
            ${item.status_old != item.status_new ? '<p><strong>Cambio de estado a:</strong> '+item.status_new+'</p>' : ""}
            <hr>
          </div>
        `).join('')}
      </div>
    `;

    // Renderiza
    Swal.fire({
      title: 'Historial',
      html: contenido,
      width: '700px', // Fuerza un ancho mayor para la bitácora
      showCloseButton: true,
      showConfirmButton: false, // Solo cierra con X
      customClass: {
        popup: 'modalHistorial'
      }
    });
};

// Modal enfocado 100% en la gestión de Peticiones de Usuario: "Se inscribe alguien, ¿Se le aprueba el acceso o se le borra?"
// Al aprobar, permite seleccionar el rol con el que se registrará (Voluntario o Supervisor)
export const VerAprobarEliminarUsuarios = (
  htmlModal,
  recargarContainer,
  id
) => {

  Swal.fire({
    html: htmlModal,
    showCloseButton: true,
    focusConfirm: false,

    // BOTÓN APROBAR
    showConfirmButton: true,
    confirmButtonText: "Aprobar",

    // BOTÓN ELIMINAR
    showCancelButton: true,
    cancelButtonText: "Borrar",

    customClass: {
      confirmButton: "botonOK",
      cancelButton: "botonEliminar"
    },

    // 👉 PRECONFIRM (APROBAR)
    preConfirm: async () => {
      // Micro-Modal intermedio con selector de rol para definir cómo ingresa el usuario
      const confirmacion = await Swal.fire({
        title: "Aprobar usuario",
        html: `
          <p style="margin-bottom: 12px; font-family: var(--fuente-contenido);">Seleccione el rol con el que se aprobará al usuario:</p>
          <div class="input" style="max-width: 300px; margin: 0 auto;">
            <div class="form__inputBox form__inputBox--selector">
              <i class="ri-shield-user-line"></i>
              <select class="selector" id="selectRolAprobacion">
                <option value="1" selected>Voluntario</option>
                <option value="2">Supervisor</option>
              </select>
            </div>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, aprobar",
        cancelButtonText: "Cancelar",
        customClass: {
            confirmButton: 'botonOK',
            cancelButton: 'botonEliminar',
        },
        // Captura el valor del select antes de cerrarse
        preConfirm: () => {
          const rolSeleccionado = document.getElementById("selectRolAprobacion").value;
          return { rol_id: Number(rolSeleccionado) };
        }
      });

      // Si se arrepintió, bloquea ejecución
      if (!confirmacion.isConfirmed) return false;

      // Invoca el endpoint de aprobación con el rol seleccionado
      try {
        const response = await api.patch(`usuarios/aprobar/${id}`, {
          rol_id: confirmacion.value.rol_id
        });

        if (response.success) {
          await alertaOK(response.message);
          if (recargarContainer) await recargarContainer(); // Actualiza listado de la tabla detrás
        } else {
          alertaWarning(response.message, response.errors);
        }

      } catch (error) {
        console.error(error);
        alertaError("Error al aprobar");
      }

      return true;
    }

  }).then(async (result) => {

    // 👉 SI PRESIONA ELIMINAR
    if (result.dismiss === Swal.DismissReason.cancel) {

      // Dispara validación destructiva
      const confirmacion = await Swal.fire({
        title: "¿Seguro que deseas borrar?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, borrar",
        cancelButtonText: "Cancelar",
        customClass: {
            confirmButton: 'botonEliminar',
            cancelButton: 'botonOK',
        }
      });

      if (!confirmacion.isConfirmed) return;

      // Borrado definitivo vía API usando la ruta correcta del backend Java
      try {
        const response = await api.delet(`usuarios/${id}`);

        if (response.success) {
          await alertaOK(response.message);
          if (recargarContainer) await recargarContainer();
        } else {
          alertaWarning(response.message, response.errors);
        }

      } catch (error) {
        console.error(error);
        alertaError("Error al borrar");
      }
    }
  });
};

// Modal visor multifunción enfocado en los roles y administración de bloqueos (Suspensiones) 
// de usuarios existentes que ya ingresaron a la plataforma.
// Helper interno para mostrar el modal de edición de datos personales del usuario
const mostrarFormularioEdicionUsuario = async (id, recargarContainer) => {
  try {
    // 1. Obtener la información técnica del usuario actual
    const datos = await api.get(`usuarios/${id}`);
    if (!datos) {
      alertaError("No se pudieron cargar los datos del usuario.");
      return;
    }

    // 2. Consultar catálogos para rellenar los combos selectores
    const tiposDoc = await api.get("public/tipos-documento") || [];
    const generos = await api.get("public/generos") || [];
    const organizaciones = await api.get("public/organizaciones") || [];

    // 3. Limpieza de datos: coalescencia nula para evitar "undefined" en los campos
    const nombre = datos.names ?? "";
    const apellido = datos.last_names ?? "";
    const docNum = datos.document_number ?? "";
    const fechaNac = datos.birth_date ?? "";
    const celular = datos.phone ?? "";
    const correo = datos.email ?? "";

    // 4. Generar opciones HTML dinámicas para Documentos
    let opcionesTiposDoc = `<option value="" hidden>Seleccione tipo de documento...</option>`;
    tiposDoc.forEach(t => {
      // Comparación flexible: el backend puede enviar el ID como número o string
      const sigla = t.sigla ?? "";
      const desc = t.descripcion ?? "";
      opcionesTiposDoc += `<option value="${t.id}" ${t.id == datos.document_type_id ? "selected" : ""}>${sigla} - ${desc}</option>`;
    });

    // 5. Generar opciones HTML dinámicas para Géneros
    let opcionesGeneros = `<option value="" hidden>Seleccione género...</option>`;
    generos.forEach(g => {
      const nombreG = g.nombre ?? "";
      opcionesGeneros += `<option value="${g.id}" ${g.id == datos.gender_id ? "selected" : ""}>${nombreG}</option>`;
    });

    // 6. Generar opciones HTML dinámicas para Organizaciones
    let opcionesOrg = `<option value="" hidden>Seleccione organización...</option>`;
    organizaciones.forEach(o => {
      const nombreO = o.nombre ?? "";
      const seccionalO = o.seccional ?? "";
      opcionesOrg += `<option value="${o.id}" ${o.id == datos.organization_id ? "selected" : ""}>${nombreO} (${seccionalO})</option>`;
    });

    // 7. Lanzar modal de edición con estructura HTML idéntica al resto del proyecto
    Swal.fire({
      title: "Editar Datos Personales",
      html: `
        <form class="form" style="max-height: 450px; overflow-y: auto; padding: 5px 10px;">
          <!-- Campo: Nombres -->
          <div class="input">
            <div class="form__inputBox">
              <i class="ri-user-line"></i>
              <input type="text" placeholder="Nombres" id="editNombre" value="${nombre}" autocomplete="off">
            </div>
          </div>
          <!-- Campo: Apellidos -->
          <div class="input">
            <div class="form__inputBox">
              <i class="ri-user-line"></i>
              <input type="text" placeholder="Apellidos" id="editApellido" value="${apellido}" autocomplete="off">
            </div>
          </div>
          <!-- Campo: Tipo de Documento (selector) -->
          <div class="input">
            <div class="form__inputBox form__inputBox--selector">
              <i class="ri-id-card-line"></i>
              <select class="selector" id="editTipoDoc">${opcionesTiposDoc}</select>
            </div>
          </div>
          <!-- Campo: Número de Documento -->
          <div class="input">
            <div class="form__inputBox">
              <i class="ri-info-card-line"></i>
              <input type="text" placeholder="Número de documento" id="editDocNum" value="${docNum}" autocomplete="off">
            </div>
          </div>
          <!-- Campo: Fecha de Nacimiento -->
          <div class="input">
            <div class="form__inputBox">
              <i class="ri-calendar-line"></i>
              <input type="date" placeholder="Fecha de nacimiento" id="editFechaNac" value="${fechaNac}">
            </div>
          </div>
          <!-- Campo: Género (selector) -->
          <div class="input">
            <div class="form__inputBox form__inputBox--selector">
              <i class="ri-men-line"></i>
              <select class="selector" id="editGenero">${opcionesGeneros}</select>
            </div>
          </div>
          <!-- Campo: Celular -->
          <div class="input">
            <div class="form__inputBox">
              <i class="ri-phone-line"></i>
              <input type="text" placeholder="Celular" id="editCelular" value="${celular}" autocomplete="off">
            </div>
          </div>
          <!-- Campo: Organización / Seccional (selector) -->
          <div class="input">
            <div class="form__inputBox form__inputBox--selector">
              <i class="ri-building-line"></i>
              <select class="selector" id="editOrganizacion">${opcionesOrg}</select>
            </div>
          </div>
          <!-- Campo: Correo Electrónico -->
          <div class="input">
            <div class="form__inputBox">
              <i class="ri-mail-line"></i>
              <input type="email" placeholder="Correo electrónico" id="editCorreo" value="${correo}" autocomplete="off">
            </div>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "botonOK",
        cancelButton: "botonCancelar"
      },
      preConfirm: async () => {
        // Captura de todos los valores del formulario
        const names = document.getElementById("editNombre").value.trim();
        const last_names = document.getElementById("editApellido").value.trim();
        const document_type_id = Number(document.getElementById("editTipoDoc").value);
        const document_number = document.getElementById("editDocNum").value.trim();
        const birth_date = document.getElementById("editFechaNac").value;
        const gender_id = Number(document.getElementById("editGenero").value);
        const phone = document.getElementById("editCelular").value.trim();
        const organization_id = Number(document.getElementById("editOrganizacion").value);
        const email = document.getElementById("editCorreo").value.trim();

        // Validación de campos obligatorios antes de enviar
        if (!names || !last_names || !document_number || !birth_date || !phone || !email) {
          Swal.showValidationMessage("Por favor complete todos los campos obligatorios.");
          return false;
        }

        try {
          // Petición PUT al backend con los datos editados
          const res = await api.put(`usuarios/${id}`, {
            names,
            last_names,
            document_type_id,
            document_number,
            birth_date,
            gender_id,
            phone,
            organization_id,
            email
          });

          if (res && res.success) {
            return true;
          } else {
            Swal.showValidationMessage(res.message || "Error al actualizar los datos.");
            return false;
          }
        } catch (err) {
          Swal.showValidationMessage("Error de red: " + err.message);
          return false;
        }
      }
    }).then(async (result) => {
      // Si el usuario confirmó exitosamente, recarga la vista
      if (result.isConfirmed) {
        await alertaOK("Datos actualizados con éxito.");
        if (recargarContainer) await recargarContainer();
      }
    });
  } catch (error) {
    console.error(error);
    alertaError("Error al cargar formulario de edición.");
  }
};

// de usuarios existentes que ya ingresaron a la plataforma.
export const VerCambiarEstadoRolUsuarios = (
  htmlModal,
  recargarContainer,
  id,
  estado,
  rol,
  esAdmin
) => {

  Swal.fire({
    html: htmlModal,
    showCloseButton: true,
    focusConfirm: false,

    // 👉 CAMBIAR ROL
    showConfirmButton: esAdmin && estado == 1,
    confirmButtonText: "Cambiar Rol",

    // 👉 ACTIVAR / DESACTIVAR
    showCancelButton: true,
    cancelButtonText: estado == 1 ? "Desactivar" : "Activar",

    // 👉 HISTORIAL (BOTÓN CENTRAL)
    showDenyButton: true,
    denyButtonText: "Historial",

    customClass: {
      confirmButton: "botonOK",
      cancelButton: estado == 1 ? "botonEliminar" : "botonOK", // Pinta en rojo si va a desactivar (suspender)
      denyButton: "botonHistorial"
    },

    // DidOpen: capturamos eventos inyectados como el botón de edición personal
    didOpen: () => {
      const btnEdit = document.getElementById("btnEditarDatosPersonales");
      if (btnEdit) {
        btnEdit.onclick = async () => {
          Swal.close(); // Cierra el modal de ficha detallada
          await mostrarFormularioEdicionUsuario(id, recargarContainer);
        };
      }
    },

    // 👉 CONFIRMAR (CAMBIAR ROL)
    preConfirm: async () => {

      // Interfaz con selector de rol para elegir el nuevo rol del usuario
      const confirmacion = await Swal.fire({
        title: "Cambiar rol de usuario",
        html: `
          <p style="margin-bottom: 12px; font-family: var(--fuente-contenido);">Seleccione el nuevo rol para el usuario:</p>
          <div class="input" style="max-width: 300px; margin: 0 auto;">
            <div class="form__inputBox form__inputBox--selector">
              <i class="ri-shield-user-line"></i>
              <select class="selector" id="selectRolCambio">
                <option value="1" ${rol == 1 ? "selected" : ""}>Voluntario</option>
                <option value="2" ${rol == 2 ? "selected" : ""}>Supervisor</option>
              </select>
            </div>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
        customClass: {
          confirmButton: 'botonOK',
          cancelButton: 'botonEliminar',
        },
        // Captura el valor del select antes de cerrarse
        preConfirm: () => {
          const rolSeleccionado = document.getElementById("selectRolCambio").value;
          return { rol_id: Number(rolSeleccionado) };
        }
      });

      if (!confirmacion.isConfirmed) return false;

      // Lógica de Petición HTTP Patch atada
      try {

        const datos = {
          role: confirmacion.value.rol_id == 1 ? "Voluntario" : "Supervisor",
        };

        const response = await api.patch(`usuarios/rol/${id}`, datos);

        if (response.success) {
          await alertaOK(response.message);
          if (recargarContainer) await recargarContainer();
        } else {
          alertaWarning(response.message, response.errors);
        }

      } catch (error) {
        console.error(error);
        alertaError("Error al cambiar rol");
      }

      return true;
    }

  }).then(async (result) => {

    // 👉 HISTORIAL
    if (result.isDenied) {
      Historial("usuarios", id);
      return;
    }

    // 👉 ACTIVAR (REINCORPORACIÓN) / DESACTIVAR (SUSPENSIÓN)
    if (result.dismiss === Swal.DismissReason.cancel) {

      const confirmacion = await Swal.fire({
        title: `¿Seguro que deseas ${estado == 1 ? "desactivar" : "activar"} al usuario?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: estado == 1 ? "Sí, desactivar" : "Sí, activar",
        cancelButtonText: "Cancelar",
        customClass: {
          confirmButton: estado == 1 ? "botonEliminar" : "botonOK",
          cancelButton: estado == 1 ? "botonOK" : "botonEliminar",
        }
      });

      if (!confirmacion.isConfirmed) return;

      try {
        // Ejecución invirtiendo el id referencial (Si era 1[Activo] lo vuelve 2[Inactivo])
        const response = await api.patch(`usuarios/${id}/cambiar-estado`, {
          user_ids: [Number(id)], 
          state_user_id: estado == 1 ? 2 : 1,
          async: false,
        });

        if (response.success) {
          await alertaOK(response.message);
          if (recargarContainer) await recargarContainer();
        } else {
          alertaWarning(response.message, response.errors);
        }

      } catch (error) {
        console.error(error);
        alertaError("Error al cambiar estado");
      }
    }

  });
};

// ==========================================
// MODALES LEGALES Y POLÍTICAS
// ==========================================

// Muestra las condiciones y términos obligatorias para el Plan Familiar (Ley 1581)
export const AutorizacionDatos = () => {
  return Swal.fire({
    title: "Autorización para el Tratamiento de Datos Personales",
    html: `
      <div style="text-align:left; font-size:13px; line-height:1.6;">

        <div style="
            max-height: 220px;
            overflow-y: auto;
            padding-right: 8px;
            border: 1px solid #eee;
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 15px;
        ">

          <p>
            En cumplimiento de lo dispuesto en la Ley 1581 de 2012 y el Decreto 1377 de 2013,
            autorizo de manera libre, previa, expresa, voluntaria e informada el tratamiento
            de mis datos personales suministrados a través del presente formulario.
          </p>

          <p>
            Los datos serán utilizados con la finalidad de elaborar, gestionar y administrar
            el Plan Familiar de Emergencia, así como para realizar procesos de validación,
            seguimiento, control y mejora de los programas institucionales relacionados
            con la gestión del riesgo y la atención de emergencias.
          </p>

          <p>
            Entiendo que el tratamiento podrá incluir la recolección, almacenamiento,
            uso, circulación, actualización y supresión de la información, conforme
            a las políticas de protección de datos adoptadas por la entidad.
          </p>

          <p>
            Declaro que he sido informado acerca de mis derechos como titular de datos
            personales, entre ellos:
          </p>

          <ul style="padding-left:18px;">
            <li>Conocer, actualizar y rectificar mis datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso que se ha dado a mis datos.</li>
            <li>Revocar la autorización y/o solicitar la supresión del dato cuando proceda.</li>
            <li>Acceder en forma gratuita a mis datos personales.</li>
          </ul>

          <p>
            Esta autorización permanecerá vigente mientras exista una relación
            administrativa o legal con la entidad o hasta que el titular
            solicite su revocatoria en los términos establecidos por la ley.
          </p>

        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="checkAutorizacion">
          <label for="checkAutorizacion" style="cursor:pointer;">
            Declaro que he leído y acepto la autorización
          </label>
        </div>

      </div>
    `,
    icon: false,
    width: 600,
    showCancelButton: true,
    confirmButtonText: "Aceptar y continuar",
    cancelButtonText: "Cancelar",
    customClass: {
      confirmButton: "botonOK",
      cancelButton: "botonCancelar",
      title: "modalTitulo"
    },

    didOpen: () => {
      // Bloquea por default el botón inferior hasta que haga Scroll + Check en Acepto
      const confirmBtn = Swal.getConfirmButton();
      confirmBtn.disabled = true;

      const checkbox = document.getElementById("checkAutorizacion");

      checkbox.addEventListener("change", () => {
        confirmBtn.disabled = !checkbox.checked; // Reactiva el botón
      });
    }
  })
};

// Modal Auxiliar para el módulo supervisor: Cuadro de texto para dictar rechazo 
// obligando al interventor a dejar comentarios justificando (Mínimo 10 caracteres)
export const rechazarCambios = (id) => {
  return Swal.fire({
    title: "rechazar con cambios",
    html: `
      <div style="text-align:left;">
        <label style="font-weight:600;">Comentarios</label>
        <textarea 
          id="comentariosDevolver" 
          placeholder="Escribe el motivo de la devolución (mínimo 10 caracteres)..."
          style="
            width:100%;
            height:150px;
            margin-top:8px;
            padding:10px;
            border-radius:10px;
            border:1px solid #ddd;
            resize:none;
            overflow-y:auto;
            font-size:14px;
          "
        ></textarea>
        <small id="contadorTexto" style="display:block;margin-top:6px;color:#888;">
          0 / mínimo 10 caracteres
        </small>
      </div>
    `,
    width: 600,
    showCancelButton: true,
    confirmButtonText: "Devolver",
    cancelButtonText: "Cancelar",
    customClass: {
      confirmButton: "botonEliminar",
      cancelButton: "botonOK",
      title: "modalTitulo"
    },

    didOpen: () => {
      const textarea = document.getElementById("comentariosDevolver");
      const confirmBtn = Swal.getConfirmButton();
      const contador = document.getElementById("contadorTexto");

      // Inicia botón bloqueado
      confirmBtn.disabled = true;

      // Evento constante detectando cuántas letras hay escritas ("Keylogger local")
      textarea.addEventListener("input", () => {
        const longitud = textarea.value.trim().length;
        contador.textContent = `${longitud} / mínimo 10 caracteres`;

        confirmBtn.disabled = longitud < 10; // Suelta el bloqueador tras tipear 10 letras reales
      });
    },

    // Envío del parche reasignando el "Registro del Plan" a status rechazado (5) 
    preConfirm: async () => {

      const comentarios = document.getElementById("comentariosDevolver").value.trim();

      // Doble filtro por si logran sobrepasar la UI forzándolo
      if (comentarios.length < 10) {
        Swal.showValidationMessage("El comentario debe tener mínimo 10 caracteres");
        return;
      }

      try {

        // Endpoint de Supervisor rechazando Plan del Voluntario
        const response = await api.patch(`familyPlans/${id}/change-status`, {
          status_plan_id: 5,
          comentary: comentarios
        });

        if (response.success) {
          await alertaOK(response.message);
        } else {
          alertaWarning(response.message, response.errors);
        }

      } catch (error) {
        console.error(error);
        alertaError("Error al devolver");
      }

      return; 
    }
  });

};