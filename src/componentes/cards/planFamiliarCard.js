
export const cardPlanFamiliar = (planFamiliar) => {

    const div = document.createElement("div");
    div.classList.add("verPlan", "tarjeta");

  // -------------------------------------------------------------
  // LÓGICA DE SEMÁFORO UI BASADO EN EL ESTADO EN BASE DE DATOS
  // -------------------------------------------------------------
  // Qué hace: Asigna clases CSS de color según el estado del plan.
  // Por qué existe: Mapea los códigos del backend a colores consistentes (Azul = Enviado/En revisión, Verde = Aprobado, Rojo = Rechazos).
  // Qué problema resuelve: Corrige la inconsistencia donde planes rechazados (ID 4) se pintaban de verde en el frontend.
  const estadoClase =
    planFamiliar.status_id == 1 || planFamiliar.status_id == 3
      ? "verPlan__estado--azul"
      : planFamiliar.status_id == 7
      ? "verPlan__estado--verde"
      : planFamiliar.status_id == 4 || planFamiliar.status_id == 5 || planFamiliar.status_id == 6
      ? "verPlan__estado--rojo"
      : ""; // Sin clase (gris neutro) para Pendiente (2)

  const tipoClase = planFamiliar.family_type_id == 1 ? "verPlan__tipo--rojo" : planFamiliar.family_type_id == 2 ? "verPlan__tipo--verde" : "verPlan__tipo--gris";
  // Override Label Texto para Rechazos (El backend tal vez manda textos largos, front los recorta)
    
    // console.log("EStados:", planFamiliar.status);
    
  // Maquetación DOM de la Carta
    div.innerHTML = `

        <div class="verPlan__icono">
            <i class="ri-parent-fill"></i>
        </div>

        <div class="verPlan__apellidos"> Familia ${planFamiliar.last_names} </div>

        <div class="verPlan__tipo--estado">

        <div class="verPlan__estado ${estadoClase}">
            ${planFamiliar.status}
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
          // RESTRICCIÓN DE VISIBILIDAD DEL BOTÓN "REVISAR PLAN"
          // -------------------------------------------------------------
          // Qué hace: Condiciona la renderización del botón "Revisar Plan".
          // Por qué existe: Solo permite que el voluntario modifique planes en progreso (Pendiente: 2) o devueltos para corrección (Rechazado con observaciones: 5).
          // Qué problema resuelve: Oculta el botón cuando el plan ya ha sido enviado, está en revisión, o está rechazado definitivamente.
          planFamiliar.status_id == 2 || planFamiliar.status_id == 5
            ? `<button class="verPlan__boton boton" 
                            data-id="${planFamiliar.id}" 
                            data-status="${planFamiliar.status_id}"
                            data-family-type-id="${planFamiliar.family_type_id}">
                        Revisar Plan
                    </button>`
            : ""
        }
    `;

    return div;
};
