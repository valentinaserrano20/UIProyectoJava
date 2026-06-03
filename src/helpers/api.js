import * as alerta from "./alertas";
import * as spinner from "./spinner";

// URL base de la API
const url = "http://localhost:8080/DCPlanes/api";

// URL de almacenamiento de archivos estáticos
export const urlStorage = "http://localhost:8080/DCPlanes";

// ==========================================
// HELPERS INTERNOS
// ==========================================

const headers = () => ({
  "Content-Type": "application/json",
});

const manejarSesionExpirada = (endpoint) => {
  const paginasDeAutenticacion = ["login", "register", "forgotPassword", "verifyCode", "changePassword"];
  if (endpoint && paginasDeAutenticacion.some(p => endpoint.includes(p))) {
    return;
  }
  alerta.alertaError("Sesión expirada");
  window.location.href = "#/login";
  localStorage.clear();
};

// ==========================================
// FUNCIONES DE PETICIÓN (CORREGIDAS)
// Se inyecta `credentials: "include"` en cada fetch para habilitar cookies de sesión en CORS.
// Además se evita retornar `null` en escrituras (POST/PUT/DELETE) para evitar crashes en los controladores.
// ==========================================

export const get = async (endpoint) => {
  try {
    spinner.abrirSpinner();
    const response = await fetch(`${url}/${endpoint}`, {
      method: "GET",
      headers: headers(),
      credentials: "include", // CORREGIDO
    });

    if (response.status === 401) { manejarSesionExpirada(endpoint); return null; }

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
      credentials: "include", // CORREGIDO
    });

    if (response.status === 401) { manejarSesionExpirada(endpoint); return null; }

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
      credentials: "include", // CORREGIDO
    });

    if (response.status === 401) { manejarSesionExpirada(endpoint); return null; }

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
      credentials: "include", // CORREGIDO
    });

    if (response.status === 401) {
      manejarSesionExpirada(endpoint);
      try {
        const errJson = await response.json();
        return { success: false, message: errJson.message || "Credenciales incorrectas o sesión inválida" };
      } catch (e) {
        return { success: false, message: "Credenciales incorrectas o sesión inválida" };
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error en POST:", error);
    return { success: false, message: "Error de red al conectar con el servidor" }; // CORREGIDO para evitar null.success crash
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
      credentials: "include", // CORREGIDO
    });

    if (response.status === 401) {
      manejarSesionExpirada(endpoint);
      try {
        const errJson = await response.json();
        return { success: false, message: errJson.message || "Credenciales incorrectas o sesión inválida" };
      } catch (e) {
        return { success: false, message: "Credenciales incorrectas o sesión inválida" };
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error en POST imagen:", error);
    return { success: false, message: "Error de red al subir la imagen" }; // CORREGIDO
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
      credentials: "include", // CORREGIDO
    });

    if (response.status === 401) {
      manejarSesionExpirada(endpoint);
      try {
        const errJson = await response.json();
        return { success: false, message: errJson.message || "Sesión expirada o no autorizado" };
      } catch (e) {
        return { success: false, message: "Sesión expirada o no autorizado" };
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error en PUT:", error);
    return { success: false, message: "Error de red al actualizar los datos" }; // CORREGIDO
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
      credentials: "include", // CORREGIDO
    });

    if (response.status === 401) {
      manejarSesionExpirada(endpoint);
      try {
        const errJson = await response.json();
        return { success: false, message: errJson.message || "Sesión expirada o no autorizado" };
      } catch (e) {
        return { success: false, message: "Sesión expirada o no autorizado" };
      }
    }
    if (response.status === 400) {
      const error = await response.json();
      alerta.alertaError(error.message);
      return { success: false, message: error.message }; // CORREGIDO
    }

    return await response.json();
  } catch (error) {
    console.error("Error en PATCH:", error);
    return { success: false, message: "Error de red al aplicar parche de datos" }; // CORREGIDO
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
      credentials: "include", // CORREGIDO
    });

    if (response.status === 401) {
      manejarSesionExpirada(endpoint);
      try {
        const errJson = await response.json();
        return { success: false, message: errJson.message || "Sesión expirada o no autorizado" };
      } catch (e) {
        return { success: false, message: "Sesión expirada o no autorizado" };
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error en DELETE:", error);
    return { success: false, message: "Error de red al eliminar el registro" }; // CORREGIDO
  } finally {
    spinner.cerrarSpinner();
  }
};

export const getPdf = (endpoint) => {
  window.open(`${url}/${endpoint}`, "_blank");
};
