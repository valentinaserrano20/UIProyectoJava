/**
 * Helper Renderizador de Historial Físico (ventanaHistorial.js)
 * Alternativa al Historial SweetAlert. 
 * Consibe un string gigante inyectando los registros de auditoría y lo plasma 
 * directamente dentro del Nodo DOM (contenedor) pasado por argumento.
 */
export default async (data, contenedor) => {
    contenedor.innerHTML = ""; // Purga el contenedor original de HTML
    // Transita sobre el arreglo arrojado por el JSON del endpoint "Tabla/history"
    data.forEach(item => {
        const divItem = document.createElement("div");
        divItem.className = "ventanaHistorial__item";
        
        // Determinar clase del badge de acción
        let badgeClass = "badge-audit--default";
        const action = (item.action_execute || "").toUpperCase();
        if (action.includes("INSERT")) {
            badgeClass = "badge-audit--insert";
        } else if (action.includes("UPDATE")) {
            badgeClass = "badge-audit--update";
        } else if (action.includes("DELETE")) {
            badgeClass = "badge-audit--delete";
        }
        
        // Generar detalle de cambio
        let detalleCambio = "";
        if (item.status_new) {
            detalleCambio = `Cambio: ${item.status_new}`;
        } else if (item.status_old) {
            detalleCambio = `Valor: ${item.status_old}`;
        }
        
        divItem.innerHTML = `
            <div class="ventanaHistorial__fila-principal">
                <span class="badge-audit ${badgeClass}">${action}</span>
                <strong class="ventanaHistorial__modelo">${item.name_model}</strong>
                <span class="ventanaHistorial__separador">·</span>
                <span class="ventanaHistorial__usuario">${item.user_name}</span>
                <span class="ventanaHistorial__rol">${item.rol}</span>
            </div>
            <div class="ventanaHistorial__fila-secundaria">
                <span class="ventanaHistorial__fecha">${item.date_time}</span>
                ${detalleCambio ? `<span class="ventanaHistorial__separador">·</span><span class="ventanaHistorial__cambio">${detalleCambio}</span>` : ""}
            </div>
        `;
        contenedor.appendChild(divItem);
    });
};