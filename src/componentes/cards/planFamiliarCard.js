
export const cardPlanFamiliar = (planFamiliar) => {

    const div = document.createElement("div");
    div.classList.add("verPlan", "tarjeta");

  // -------------------------------------------------------------
  // LÓGICA DE SEMÁFORO UI BASADO EN EL ESTADO EN BASE DE DATOS
  // -------------------------------------------------------------
  // Qué hace: Asigna clases CSS de color según el estado del plan.
  // Por qué existe: Mapea los códigos del backend a colores consistentes (Azul = Enviado/En revisión, Verde = Aprobado, Rojo = Rechazos).
  // Qué problema resuelve: Corrige la inconsistencia donde planes rechazados (ID 4) se pintaban de verde en el frontend.
  // Un plan se considera borrador/pendiente si su estado en la BD es 2 (Pendiente) o 3 (En revisión).
  // Los demás estados (1: Enviado, 7: Aprobado, 4/5/6: Rechazados) corresponden a planes ya procesados o enviados,
  // por lo que deben conservar su color y etiqueta correspondientes incluso si el tipo de familia no se ha guardado (ej. datos semilla).
  const esBorrador = planFamiliar.status_id == 2 || planFamiliar.status_id == 3;

  const estadoClase = esBorrador
    ? "" // Gris/Neutro para planes en borrador o incompletos (Pendiente)
    : planFamiliar.status_id == 1
    ? "verPlan__estado--azul"
    : planFamiliar.status_id == 7
    ? "verPlan__estado--verde"
    : planFamiliar.status_id == 4 || planFamiliar.status_id == 5 || planFamiliar.status_id == 6
    ? "verPlan__estado--rojo"
    : "";

  // -------------------------------------------------------------
  // TRADUCCIÓN O SIMPLIFICACIÓN DE TEXTOS DE ESTADO PARA EL VOLUNTARIO
  // -------------------------------------------------------------
  // Qué hace: Ajusta el texto del estado mostrado en la tarjeta para el voluntario.
  // Por qué existe: El estado 3 en base de datos es 'En revisión' pero lógicamente el plan sigue pendiente de envío.
  // Qué problema resuelve: Evita que el voluntario piense que su plan ya está con el supervisor antes de darle clic a enviar.
  const estadoTexto = esBorrador
    ? "Pendiente"
    : planFamiliar.status;

  const tipoClase = planFamiliar.family_type_id == 1 ? "verPlan__tipo--rojo" : planFamiliar.family_type_id == 2 ? "verPlan__tipo--verde" : "verPlan__tipo--gris";
  // Override Label Texto para Rechazos (El backend tal vez manda textos largos, front los recorta)

    
  // Maquetación DOM de la Carta
    div.innerHTML = `

        <div class="verPlan__icono">
            <i class="ri-parent-fill"></i>
        </div>

        <div class="verPlan__apellidos"> Familia ${planFamiliar.last_names} </div>

        <div class="verPlan__tipo--estado">

        <div class="verPlan__estado ${estadoClase}">
            ${estadoTexto}
        </div>

        <div class="verPlan__tipo ${tipoClase}">
            Familia ${planFamiliar.family_type}
        </div>

        </div>

        <div class="verPlan__detalles--ubicacion">
            <i class="ri-map-pin-line"></i>
            ${planFamiliar.department} - ${planFamiliar.city}
        </div>
        <div class="verPlan__detalles--fecha">
            <i class="ri-calendar-event-fill"></i>
            Ultima Edicion: ${planFamiliar.date_create}
        </div>
        ${
          // -------------------------------------------------------------
          // RESTRICCIÓN DE VISIBILIDAD DEL BOTÓN / MENSAJE DEL PLAN
          // -------------------------------------------------------------
          // Qué hace: Renderiza el botón "Continuar con el plan" solo para planes editables (2, 3, 5).
          // Por qué existe: Habilita la edición para planes en borrador o devueltos, y oculta completamente los botones para planes cerrados (1, 4, 6, 7).
          // Qué problema resuelve: Impide que el voluntario intente continuar, abrir o enviar planes que ya están aprobados, rechazados o enviados.
          planFamiliar.status_id == 2 || planFamiliar.status_id == 3 || planFamiliar.status_id == 5
            ? `<button class="verPlan__boton boton" 
                            data-id="${planFamiliar.id}" 
                            data-status="${planFamiliar.status_id}"
                            data-family-type-id="${planFamiliar.family_type_id}">
                        Continuar con el plan
                    </button>`
            : ""
        }
    `;

    return div;
};
