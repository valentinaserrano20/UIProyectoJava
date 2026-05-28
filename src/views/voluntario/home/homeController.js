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
    // Realizamos la petición al nuevo endpoint de perfil en Java
    // Importante: Asegúrate de que tu helper de red o el fetch nativo incluya credentials: "include"
    const response = await fetch("/api/users/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    // Si el servidor responde 401 (No autorizado), limpiamos y redirigimos
    if (response.status === 401) {
      localStorage.clear(); // Limpieza preventiva por si acaso
      window.location.href = "#/login";
      return;
    }

    const json = await response.json();

    // Si el backend reporta un error explícito en su estructura contractual
    if (!json.success || !json.data) {
      window.location.href = "#/login";
      return;
    }

    // Extraemos los datos seguros mapeados desde el Backend
    const { full_name, gender_id } = json.data;

    // =====================================================
    // CONSTRUIR SALUDO DINÁMICO
    // =====================================================
    let saludo = "Hola";
    if (gender_id === 1) {
      saludo += "o"; // Voluntario
    } else if (gender_id === 2) {
      saludo += "a"; // Voluntaria
    } else {
      saludo += " e"; // Inclusivo o no especificado
    }

    if (titulo) {
      titulo.textContent = `${saludo}, ${full_name}`;
    }

  } catch (error) {
    console.error("Error de comunicación con la API de Java:", error);
    // Ante cualquier caída de red o error del servidor, protegemos la ruta enviando al login
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