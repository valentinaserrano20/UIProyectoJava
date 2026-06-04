/**
 * Renderizador de Gráfico de Barras Horizontales (barraHorizontal.js)
 * Función que instancia un gráfico Chart.js tipo 'bar' horizontal con índice 0,
 * aceptando arrays dinámicos de labels y datos para mostrar múltiples categorías.
 */
export default (contenedor, titulo, labels, datos, colores) => {
  new Chart(contenedor, {
    type: "bar", // Define el formato visual como barras
    data: {
      labels: labels, // Array de textos o categorías en el eje Y
      datasets: [{
        data: datos, // Array de valores numéricos en el eje X
        backgroundColor: colores || ["#FF6600", "#0770CC", "#28a745", "#dc3545", "#ffc107", "#17a2b8"] // Colores corporativos o personalizados
      }]
    },
    options: {
      indexAxis: 'y', // 👈 Configura el gráfico como horizontal (barras en eje Y)
      responsive: true, // Se adapta al tamaño de la pantalla
      maintainAspectRatio: false, // 👈 Permite que el canvas use todo el largo/ancho de su contenedor padre
      plugins: {
        legend: {
          display: false // Oculta la leyenda superior flotante predeterminada
        },
        title: {
          display: true, // Habilita dibujar un título personalizado incrustado en el Canvas
          text: "     ● " + titulo,
          align: "start", // 👈 Alineado a la izquierda
          padding: {
            top: 15,
            bottom: 20
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true, // Empieza el eje X desde cero
          title: {
            display: true,
            text: "Cantidad" // Subtítulo horizontal
          }
        }
      }
    }
  });
}
