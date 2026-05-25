/**
 * Helper de Auto-Relleno de Formularios (cargarDatos.js)
 * Script auxiliar diseñado para consumir un endpoint (ej: verUnRegistro)
 * e inyectar sus valores ordenadamente en un Arreglo de Inputs HTML dado. 
 */
import * as api from "./api";

// Recibe URL, Referencias al DOM (listaInputs) y el mapeo literal de los JSON keys del backend (nombreValores)
// MODIFICADO: Añadida verificación defensiva de nulidad en el objeto 'valores' (evita crashes de JS en respuestas nulas de API)
export const cargarDatos = async (endpoint, listaInputs, nombreValores) => {
  const valores = await api.get(endpoint);  
  
  // AGREGADO: Si el backend no retorna datos o hay un error, se aborta el rellenado temprano
  if (!valores) {
    console.warn(`No se cargaron datos desde el endpoint: ${endpoint}`);
    return;
  }

  // Recorre el arreglo de nodos por índice sincronizando JSON llave -> HTML Input
  for (let cont = 0; cont < listaInputs.length; cont++) {
    let valor = valores[nombreValores[cont]];

    // Normaliza ISO datetime a yyyy-MM-dd para <input type="date">
    if (listaInputs[cont].type === "date" && valor) {
      valor = valor.split("T")[0]; // "2023-02-22T00:00:00.000000Z" → "2023-02-22"
    }
    
    listaInputs[cont].value = valor ?? "";
  }
};
