/**
 * =========================================================
 * Controlador: Home del Voluntario (Refactorizado)
 * =========================================================
 * Responsabilidad:
 * - Consultar el perfil del usuario autenticado en el backend.
 * - Validar la sesión en tiempo real (Protección de rutas).
 * - Mostrar la bienvenida personalizada (Nombre y género).
 * - Gestionar la navegación principal.
 * =========================================================
 */

// Importación del helper de comunicación con la API de Java
// Sirve para: Centralizar y estandarizar las llamadas HTTP GET/POST hacia el servidor backend
// Qué hace: Expone funciones de red preconfiguradas con cabeceras CORS y credenciales HTTP
// Por qué es importante: Evita tener que definir manualmente la URL base de Java y configurar headers/credentials en cada archivo, previniendo errores de ruteo erróneos en el servidor de desarrollo de Vite
import * as api from "../../../helpers/api.js";

export default async () => {

  // =====================================================
  // REFERENCIAS DOM
  // =====================================================
  const titulo = document.querySelector(".explicacion__titulo");
  const botonNuevoPlan = document.querySelector("#nuevoPlan");
  const botonVerPlanes = document.querySelector("#verPlan");

  // Ocultamos el contenido del saludo temporalmente mientras valida la sesión
  if (titulo) titulo.textContent = "Cargando panel...";

  // =====================================================
  // VALIDACIÓN DE SESIÓN Y CARGA DE DATOS (BACKEND)
  // =====================================================
  try {
    // Petición al endpoint del perfil del voluntario en Java mediante el helper api.js
    // Sirve para: Solicitar la información detallada del voluntario autenticado y validar su estado de sesión en tiempo real
    // Qué hace: Realiza una solicitud GET HTTP a la URL completa del backend 'http://localhost:8080/DCPlanes/api/users/profile'
    // Por qué es importante: Envía la cookie 'JSESSIONID' requerida mediante credentials: 'include' para que Java reconozca la sesión del navegador
    const data = await api.get("users/profile");

    // Verificación preventiva de los datos de la sesión
    // Sirve para: Determinar si la llamada falló o si el token de sesión no es válido (ej. retorno de status 401 por el backend)
    // Qué hace: Evalúa si 'data' es nulo o inválido, limpia el almacenamiento local y aborta la ejecución
    // Por qué es importante: Al limpiar localStorage con clear(), evitamos que el router SPA entre en un bucle de redirección infinito al intentar forzar el regreso al Home por creer que la sesión sigue activa
    if (!data) {
      localStorage.clear();
      window.location.href = "#/login";
      return;
    }

    // Función para capitalizar nombres propios (ej: "valentina serrano" -> "Valentina Serrano")
    const capitalizar = (texto) => {
      if (!texto) return "";
      return texto
        .toLowerCase()
        .split(" ")
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ");
    };

    // Extracción de la identidad del voluntario desde el payload devuelto por Java
    const names = data.names || "";
    const lastNames = data.last_names || "";
    const full_name = capitalizar(`${names} ${lastNames}`.trim());
    const gender = data.gender ? data.gender.toLowerCase() : "";

    // =====================================================
    // CONSTRUIR SALUDO DINÁMICO
    // =====================================================
    let saludo = "Hola";
    if (gender === "masculino") {
      saludo += "o"; // Voluntario
    } else if (gender === "femenino") {
      saludo += "a"; // Voluntaria
    } else {
      saludo += " e"; // Inclusivo o no especificado
    }

    if (titulo) {
      titulo.textContent = `${saludo}, ${full_name}`;
    }

  } catch (error) {
    console.error("Error de comunicación con la API de Java:", error);
    // Limpieza de almacenamiento local ante fallos de conexión o caídas del servidor
    // Sirve para: Borrar las credenciales persistidas en el cliente para que el enrutador no fuerce el redireccionamiento al panel privado
    // Qué hace: Invoca a localStorage.clear() antes de mandar al login
    // Por qué es importante: Rompe de forma preventiva los bucles infinitos de redirección del enrutador SPA
    localStorage.clear();
    window.location.href = "#/login";
    return;
  }

  // =====================================================
  // EVENTOS DE NAVEGACIÓN
  // =====================================================
  if (botonNuevoPlan) {
    botonNuevoPlan.addEventListener("click", () => {
      window.location.href = "#/voluntario/plan_familiar/crear";
    });
  }

  if (botonVerPlanes) {
    botonVerPlanes.addEventListener("click", () => {
      window.location.href = "#/voluntario/plan_familiar";
    });
  }
};