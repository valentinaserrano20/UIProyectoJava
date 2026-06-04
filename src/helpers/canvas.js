/**
 * Índice de Gráficos (canvas.js)
 * Archivo distribuidor (Barrel file). Recolecta todos los scripts individuales de gráficos 
 * (barras, donas, temporales) en un mismo nodo y los vuelve a exportar, facilitando
 * la importación limpia en una sola línea de código dentro de los controladores.
 */
import barra from "./canvas/barra.js";
import dona from "./canvas/dona.js"
import lineaTemporal from "./canvas/lineaTemporal.js";
import barraHorizontal from "./canvas/barraHorizontal.js";
import donaDinamica from "./canvas/donaDinamica.js";

// Importa Chart.js para gráficos y sus componentes registrables
import { Chart, registerables } from 'chart.js';
// Registra todos los componentes necesarios para habilitar Chart.js
Chart.register(...registerables);
// Expone la instancia de Chart globalmente en el objeto window
window.Chart = Chart;

export {barra,dona,lineaTemporal,barraHorizontal,donaDinamica};