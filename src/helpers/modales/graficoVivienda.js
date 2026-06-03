/**
 * Helper Modal Fotográfico: Gráfico de Vivienda (graficoVivienda.js)
 * Exclusivamente diseñado para desplegar la previsualización en grande
 * de un croquis de vivienda traído por API conectándolo al backend Storage.
 */
import * as api from "../api";
import * as alerta from "../alertas";

// Función asíncrona para mostrar la imagen ampliada dado un ID de gráfico
export const ver = async(id) => {
  // Dispara la petición a la API pidiendo los detalles del gráfico
  const datos = await api.get(`imagenes/vivienda/${id}`);
  
  // Construye un código HTML inyectando la ruta de la imagen (Combinando la URL base del Storage de la API con el path relativo)
  const htmlModal = `
    <div class="modalVer modal">
    <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-file-image-line"></i>
        <div class="modalVer__titulo">Grafico de vivienda</div>
        </div>
      <img class="modalVer__imagen" src="${api.urlStorage+"/"+datos.path}">
      <div class="modalVer__dato modalVer__dato--largo">
        <i class="ri-parent-line"></i>
        <div class="modalVer__titulo">Descripcion</div>
        <div class="modalVer__texto">${datos.description}</div>
      </div>

    </div>
  `;

  // Invoca a la alerta genérica en modo de sólo lectura (sin botones extra)
  alerta.Ver(htmlModal, false, false, null, null);
};