/**
 * Helper de Modal de Consulta: Recurso Disponible (recursoDisponible.js)
 * A diferencia del catálogo maestro de recursos, este archivo levanta un modal
 * de SÓLO lectura para detallar qué recurso en específico está disponible (Instanciado) cerca
 * evaluando su geoubicación y distancia al plan familiar.
 */
import * as api from "../api";
import * as alerta from "../alertas";

// Ventana exclusiva de información, sin rutinas de edición o deleción.
export const ver = async (id) => {
  // Dispara el GET al API en el controlador availableResources 
  const datos = await api.get(`recursosDisponibles/${id}`);

  // Diseño HTML en flex grid para listar descriptores geográficos y descriptores clave
  const htmlModal = `
        <div class="modalVer modal">
            <div class="modalVer__dato modalVer__dato--largo">
                <i class="ri-error-warning-line"></i>
                <div class="modalVer__titulo">Nombre del recurso</div>
                <div class="modalVer__texto">${datos.resource_name}</div>
            </div>
            <div class="modalVer__dato modalVer__dato--largo">
                <i class="ri-heart-line"></i>
                <div class="modalVer__titulo">Servicio</div>
                <div class="modalVer__texto">${datos.resource_service}</div>
            </div>
            <div class="modalVer__dato modalVer__dato--largo">
                <i class="ri-phone-line"></i>
                <div class="modalVer__titulo">Telefono de contacto</div>
                <div class="modalVer__texto">${datos.phone}</div>
            </div>
            <div class="modalVer__dato modalVer__dato--largo">
                <i class="ri-file-text-line"></i>
                <div class="modalVer__titulo">Descripcion</div>
                <div class="modalVer__texto">${datos.description}</div>
            </div>
            <div class="modalVer__dato modalVer__dato--largo">
                <i class="ri-map-2-line"></i>
                <div class="modalVer__titulo">Ubicacion</div>
                <div class="modalVer__texto">${datos.location}</div>
            </div>
            <div class="modalVer__dato modalVer__dato--largo">
                <i class="ri-map-pin-line"></i>
                <div class="modalVer__titulo">Distancia</div>
                <div class="modalVer__texto">${datos.distance}</div>
            </div>
        </div>`;
        
  // Enlaza con el helper genérico "Ver" enviando false, false, indicando carencia de UI CRUD (Solo Ver)
  alerta.Ver(htmlModal, false, false, null, null);
};