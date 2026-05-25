
/**
 * =========================================================
 * Controlador: Home del Voluntario
 * =========================================================
 * Responsabilidad:
 * - Mostrar bienvenida personalizada
 * - Gestionar navegación principal del voluntario
 * - Validar sesión básica local
 * =========================================================
 */

export default () => {

  // =====================================================
  // REFERENCIAS DOM
  // =====================================================

  const titulo = document.querySelector(".explicacion__titulo");

  const botonNuevoPlan = document.querySelector("#nuevoPlan");

  const botonVerPlanes = document.querySelector("#verPlan");

  // =====================================================
  // DATOS SESIÓN
  // =====================================================

  const nombre = localStorage.getItem("full_name");

  const genero = localStorage.getItem("gender_id");

  // =====================================================
  // VALIDAR SESIÓN
  // =====================================================

  if (!nombre) {
    window.location.href = "#/login";
    return;
  }

  // =====================================================
  // CONSTRUIR SALUDO
  // =====================================================

  let saludo = "Hola";

  if (genero == 1) {
    saludo += "o";
  } else {
    saludo += "a";
  }

  titulo.textContent = `${ saludo }, ${ nombre } `;

  // =====================================================
  // EVENTO: CREAR PLAN
  // =====================================================

  botonNuevoPlan.addEventListener("click", () => {

    window.location.href =
      "#/voluntario/plan_familiar/crear";

  });

  // =====================================================
  // EVENTO: VER PLANES
  // =====================================================

  botonVerPlanes.addEventListener("click", () => {

    window.location.href =
      "#/voluntario/plan_familiar";

  });

};

