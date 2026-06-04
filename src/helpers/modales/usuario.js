/**
 * Helper de Modales de Administrador: Ficha de Usuario (usuario.js)
 * Levanta un modal denso, de sólo lectura (Sín Crear o Editar explícito), 
 * con toda la información consolidada de registro de una persona.
 * 
 * Basado en las variables "esPeticion" y "esAdmin" redirige a dos flujos 
 * del componente Alert (alertas.js) distintos:
 * 1. Flujo Aprobar/Rechazar nuevo registro.
 * 2. Flujo Mantenibilidad: Cambiar Rol o Suspender temporalmente la cuenta.
 */
import * as api from "../api";
import * as alerta from "../alertas";

// Ventana maestra para auditoría. Exhibe la información de ficha civil completa del Account
export const ver = async (id, recargarContainer,esPeticion,esAdmin) => {

  try {
    // Solicitud general de registro (Incluirá sub-objetos y profiles nested)
    const datos = await api.get(`usuarios/${id}`);

    // Coalescencia Nula (??) para prevenir quiebres de programa sí un elemento JSON viene omitido o vació
    const perfil = datos.profile ?? {};
    const documentType = perfil.document_type ?? {};
    const gender = perfil.gender ?? {};
    const organization = perfil.organization ?? {};
    const sectional = organization.sectional ?? {};
    // Extraemos de forma segura el ID del estado y rol por si el backend lo manda plano, anidado o en otra propiedad
    const estado = datos.state_user_id ?? datos.status?.id ?? (datos.status === 'Activo' ? 1 : 2);
    const rol = datos.rol_id ?? datos.rol?.id ?? (datos.rol === 'Supervisor' ? 3 : 2);
    
    // Maqueta base Grid con remisiones masivas a ri-icons y datos cruzados
    // Coalescencia nula para prevenir "undefined" en campos no enviados por el backend
    const htmlModal = `
      <div class="modalVer modal">

          <div class="modalVer__dato modalVer__dato--largo">
              <i class="ri-user-line"></i>
              <div class="modalVer__titulo">Usuario</div>
              <div class="modalVer__texto">${datos.names ?? ""} ${datos.last_names ?? ""}</div>
          </div>

          <div class="modalVer__dato modalVer__dato--largo">
              <i class="ri-mail-line"></i>
              <div class="modalVer__titulo">Correo</div>
              <div class="modalVer__texto">${datos.email ?? ""}</div>
          </div>

          <div class="modalVer__dato">
              <i class="ri-info-card-line"></i>
              <div class="modalVer__titulo">Tip.Documento</div>
              <div class="modalVer__texto">${datos.document_type ?? ""}</div>
          </div>

          <div class="modalVer__dato">
              <i class="ri-id-card-line"></i>
              <div class="modalVer__titulo">Num.Documento</div>
              <div class="modalVer__texto">${datos.document_number ?? ""}</div>
          </div>

          <div class="modalVer__dato">
              <i class="ri-calendar-line"></i>
              <div class="modalVer__titulo">Fecha Nacimiento</div>
              <div class="modalVer__texto">${datos.birth_date ?? ""}</div>
          </div>
        
          <div class="modalVer__dato">
              <i class="ri-men-line"></i>
              <div class="modalVer__titulo">Género</div>
              <div class="modalVer__texto">${datos.gender ?? ""}</div>
          </div>

          <div class="modalVer__dato modalVer__dato--largo">
              <i class="ri-phone-line"></i>
              <div class="modalVer__titulo">Teléfono</div>
              <div class="modalVer__texto">${datos.phone ?? ""}</div>
          </div>

          <div class="modalVer__dato">
              <i class="ri-map-pin-line"></i>
              <div class="modalVer__titulo">Seccional</div>
              <div class="modalVer__texto">${datos.sectional ?? ""}</div>
          </div>

          <div class="modalVer__dato">
              <i class="ri-building-line"></i>
              <div class="modalVer__titulo">Organización</div>
              <div class="modalVer__texto">${datos.organization ?? ""}</div>
          </div>
          ${!esPeticion ? 
            // Si NO es una solicitud de ingreso virgen (Ya está adentro), renderiza su estatus general visible y Rol
            `<div class="modalVer__dato">
            <i class="ri-admin-line"></i>
              <div class="modalVer__titulo">Rol</div>
              <div class="modalVer__texto">${datos.rol?.name ?? 'Voluntario'}</div>
            </div>
            <div class="modalVer__dato">
            <i class="ri-lock-line"></i>
              <div class="modalVer__titulo">Estado</div>
              <div class="modalVer__texto">${datos.status ?? ""}</div>
            </div>
            
            <!-- Botón de edición de datos personales para Supervisor/Administrador -->
            <div class="modalVer__dato modalVer__dato--largo" style="display: flex; justify-content: center; margin-top: 10px;">
                <button id="btnEditarDatosPersonales" class="boton boton--azul" style="width: 100%;"><i class="ri-edit-line"></i> Editar Datos Personales</button>
            </div>
            `
          :"" // Queda vacío si es petición pura sin evaluar
        }
      </div>
    `;

    // Redireccionadora lógica basada en la procedencia de quien abre el Modal
    if (esPeticion) alerta.VerAprobarEliminarUsuarios(htmlModal, recargarContainer, id);
    else alerta.VerCambiarEstadoRolUsuarios(htmlModal, recargarContainer, id, estado, rol, esAdmin);

  } catch (error) {
    console.error(error);
    alerta.alertaError("Error al obtener el usuario");
  }
};
