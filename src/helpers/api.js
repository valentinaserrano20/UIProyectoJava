import * as alerta from "./alertas";
import * as spinner from "./spinner";

// ← Solo cambia esta línea respecto al anterior
const url = "http://localhost:8080/DCPlanes/api";

// ==========================================
// HELPERS INTERNOS
// ==========================================

const headers = () => ({
  "Content-Type": "application/json",
});

const manejarSesionExpirada = () => {
  alerta.alertaError("Sesión expirada");
  window.location.href = "#/login";
  localStorage.clear();
};

// ==========================================
// FUNCIONES DE PETICIÓN
// ==========================================

export const get = async (endpoint) => {
  try {
    spinner.abrirSpinner();
    const response = await fetch(`${url}/${endpoint}`, {
      method: "GET",
      headers: headers(),
    });

    if (response.status === 401) { manejarSesionExpirada(); return null; }

    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error en GET:", error);
    return null;
  } finally {
    spinner.cerrarSpinner();
  }
};

export const getExiste = async (endpoint) => {
  try {
    spinner.abrirSpinner();
    const response = await fetch(`${url}/${endpoint}`, {
      method: "GET",
      headers: headers(),
    });

    if (response.status === 401) { manejarSesionExpirada(); return null; }

    const json = await response.json();
    return json.data && json.data.length > 0;
  } catch (error) {
    console.error("Error en GET:", error);
    return null;
  } finally {
    spinner.cerrarSpinner();
  }
};

export const getPaginacion = async (endpoint) => {
  try {
    spinner.abrirSpinner();
    const response = await fetch(`${url}/${endpoint}`, {
      method: "GET",
      headers: headers(),
    });

    if (response.status === 401) { manejarSesionExpirada(); return null; }

    const json = await response.json();
    return { data: json.data, paginate: json.paginate };
  } catch (error) {
    console.error("Error en GET:", error);
    return null;
  } finally {
    spinner.cerrarSpinner();
  }
};

export const post = async (endpoint, datos) => {
  try {
    spinner.abrirSpinner();
    const response = await fetch(`${url}/${endpoint}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(datos),
    });

    if (response.status === 401) { manejarSesionExpirada(); return null; }

    return await response.json();
  } catch (error) {
    console.error("Error en POST:", error);
    return null;
  } finally {
    spinner.cerrarSpinner();
  }
};

export const postImagen = async (endpoint, datos) => {
  try {
    spinner.abrirSpinner();
    // Sin Content-Type — el navegador lo asigna automáticamente con FormData
    const response = await fetch(`${url}/${endpoint}`, {
      method: "POST",
      body: datos,
    });

    if (response.status === 401) { manejarSesionExpirada(); return null; }

    return await response.json();
  } catch (error) {
    console.error("Error en POST imagen:", error);
    return null;
  } finally {
    spinner.cerrarSpinner();
  }
};

export const put = async (endpoint, datos) => {
  try {
    spinner.abrirSpinner();
    const response = await fetch(`${url}/${endpoint}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(datos),
    });

    if (response.status === 401) { manejarSesionExpirada(); return null; }

    return await response.json();
  } catch (error) {
    console.error("Error en PUT:", error);
    return null;
  } finally {
    spinner.cerrarSpinner();
  }
};

export const patch = async (endpoint, datos) => {
  try {
    spinner.abrirSpinner();
    const response = await fetch(`${url}/${endpoint}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(datos),
    });

    if (response.status === 401) { manejarSesionExpirada(); return null; }
    if (response.status === 400) {
      const error = await response.json();
      alerta.alertaError(error.message);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error en PATCH:", error);
    return null;
  } finally {
    spinner.cerrarSpinner();
  }
};

export const delet = async (endpoint) => {
  try {
    spinner.abrirSpinner();
    const response = await fetch(`${url}/${endpoint}`, {
      method: "DELETE",
      headers: headers(),
    });

    if (response.status === 401) { manejarSesionExpirada(); return null; }

    return await response.json();
  } catch (error) {
    console.error("Error en DELETE:", error);
    return null;
  } finally {
    spinner.cerrarSpinner();
  }
};