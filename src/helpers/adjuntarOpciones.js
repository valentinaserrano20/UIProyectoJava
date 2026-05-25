/**
 * Helper Generador de Dropdowns/Selects (adjuntarOpciones.js)
 * Colección de utilidades para poblar etiquetas <select> o listas 'TomSelect' usando endpoints de la API.
 */
import * as api from "./api";

// Carga un select HTML nativo trayendo del endpoint SOLAMENTE los registros activos (is_active == 1)
// MODIFICADO: Agregada validación de nulidad para evitar crashes si la API falla o expira (ej: sesión cerrada)
export const adjuntar = async (combox, endpoint) => {
  const datos = await api.get(endpoint);
  if (!datos) return;
  datos.forEach((dat) => {
    if (dat.activo == 1) {
      const option = document.createElement("option");
      option.value = dat.id; // ID oculto de sistema
      option.textContent = `${dat.nombre}`; // Label visual legible del usuario
      combox.appendChild(option);
    }
  });
};

// MODIFICADO: Agregada validación de nulidad
export const adjuntarNoValida = async (combox, endpoint) => {
  const datos = await api.get(endpoint);
  if (!datos) return;
  datos.forEach((dat) => {
    const option = document.createElement("option");
    option.value = dat.id;
    option.textContent = `${dat.nombre}`;
    combox.appendChild(option);
  });
};

// MODIFICADO: Agregada validación de nulidad
export const adjuntarInfo = async (combox, endpoint, infoDato) => {
  const datos = await api.get(endpoint);
  if (!datos) return;
  datos.forEach((dat) => {
    if (dat.activo == 1) {
      const option = document.createElement("option");
      option.value = dat.id;
      // infoDato mapeará dinamicamente otro campo sumado al .nombre
      option.textContent = `${dat[infoDato]} - ${dat.nombre}`;
      combox.appendChild(option);
    }
  });
};

// MODIFICADO: Agregada validación de nulidad y verificación preventiva de seleccionadoInfo
export const adjuntarDouble = async (combox, endpoint,input,infoDato) => {
  const datos = await api.get(endpoint);
  if (!datos) return;
  datos.forEach((dat) => {
    if (dat.activo  == 1) {
      const option = document.createElement("option");
      option.value = dat.id;
      option.textContent = `${dat.nombre}`;
      combox.appendChild(option);
    }
  });
  // Evento autocompletar input ajeno
  combox.addEventListener("change", () => {
    const seleccionado = combox.value;
    const seleccionadoInfo = datos.find((dat) => dat.id == seleccionado);
    if (seleccionadoInfo) {
      input.value = seleccionadoInfo[infoDato]; // Rellena el input satélite con un dato derivado
      input.dispatchEvent(new Event("blur"));
    } else {
      input.value = "";
    }
  });
};

// MODIFICADO: Agregada validación de nulidad
export const adjuntarMiembros = async (combox, endpoint) => {
  const datos = await api.get(endpoint);
  if (!datos) return;
  datos.forEach((dat) => {
    const option = document.createElement("option");
    option.value = dat.id;
    option.textContent = `${dat.full_name} - ${dat.document_number}(${dat.kinship})`;
    combox.appendChild(option);
  });
};

// MODIFICADO: Agregada validación de nulidad
export const adjuntarFactorRiesgo = async (combox, endpoint) => {
  const datos = await api.get(endpoint);
  if (!datos) return;
  datos.forEach((dat) => {
    const option = document.createElement("option");
    option.value = dat.id;
    option.textContent = `${dat.threat_type_name} - ${dat.description}`;
    combox.appendChild(option);
  });
};

// MODIFICADO: Agregada validación de nulidad
export const adjuntarReseteo = async (combox, endpoint) => {  
  const datos = await api.get(endpoint);
  if (!datos) return;

  const tom = combox.tomselect; // Extrae API de TomSelect atado al DOM node

  if (!tom) return;

  tom.disable(); // Lo desactiva para no clickear mientras renderiza las requests network

  tom.clear(); // Limpia la caja visual
  tom.clearOptions(); // Borra el historial viejo interno 

  // Inyecta una por una según formato de objeto requerido por TomSelect
  datos.forEach((dat) => {
    if (dat.activo == 1) {
      tom.addOption({
        value: dat.id,
        text: dat.nombre
      });
    }
  });

  tom.refreshOptions(false); // Renderiza opciones secretamente

  tom.enable(); // 🔥 Vuelve a habilitarlo visualmente
};

// MODIFICADO: Agregada validación de nulidad
export const adjuntarReseteoNoValida = async (combox, endpoint) => {
  const datos = await api.get(endpoint);
  if (!datos) return;

  // 🔥 Si tiene la API de TomSelect corriendo allí adentro
  if (combox.tomselect) {
    const tom = combox.tomselect;

    tom.disable();      // opcional mientras carga
    tom.clear();
    tom.clearOptions();

    datos.forEach((dat) => {
      tom.addOption({
        value: dat.id,
        text: dat.nombre
      });
    });

    tom.refreshOptions(false);
    tom.enable();

  } else {
    // 🔹 Si es un select HTML normal de caja fea 
    combox.options.length = 0; // Borra todos los hijos opción de rompetazo
    combox.disabled = false;

    datos.forEach((dat) => {
      const option = document.createElement("option");
      option.value = dat.id;
      option.textContent = dat.nombre;
      combox.appendChild(option);
    });
  }
};
