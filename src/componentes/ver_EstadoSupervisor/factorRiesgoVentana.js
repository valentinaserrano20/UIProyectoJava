import * as api from "../../helpers/api";
import * as alerta from "../../helpers/alertas";

const factorRiesgoVentana = async (factor, miembrosFamilia, info) => {

    const threatTypes = await api.get(`tiposAmenaza/${factor.threat_type_id}`);
    const riskReduction = await api.get(`accionesReduccion/factorRiesgo/${factor.id}`);

    const overlay = document.createElement("div");
    overlay.classList.add("overlay_verEstado");

    const ventana = document.createElement("div");
    ventana.classList.add("ventana", "ventana__supervisor");

    const btnEditar = document.createElement("button");
    btnEditar.classList.add("btn-editar", "boton");
    btnEditar.textContent = "Editar";

    const btnCerrar = document.createElement("button");
    btnCerrar.classList.add("ri-close-line", "btn-cerrar-Estado");

    const btnCerrarCont = document.createElement("div");
    btnCerrarCont.classList.add("btn-cerrar-Cont");
    btnCerrarCont.append(btnCerrar);

    const tipoAmenazaCont = document.createElement("div");
    tipoAmenazaCont.classList.add("form_autorizacion", "form-column_autorization");

    const tipoAmenazaTitulo = document.createElement("p");
    tipoAmenazaTitulo.classList.add("form__texto");
    const amenazaIcono = document.createElement("i");
    amenazaIcono.classList.add("icono--pequeno", "ri-alert-line");
    tipoAmenazaTitulo.append(amenazaIcono, " Tipo de Amenaza");

    const tipoAmenaza = document.createElement("p");
    tipoAmenaza.classList.add("form_autorizacion");
    tipoAmenaza.textContent = threatTypes.name;

    tipoAmenazaCont.append(tipoAmenazaTitulo, tipoAmenaza);

    const descripcionCont = document.createElement("div");
    descripcionCont.classList.add("form_autorizacion", "form-column_autorization");

    const descripcionTitulo = document.createElement("p");
    descripcionTitulo.classList.add("form__texto");
    const descripcionIcono = document.createElement("i");
    descripcionIcono.classList.add("icono--pequeno", "ri-file-text-line");
    descripcionTitulo.append(descripcionIcono, " Descripción");

    const descripcion = document.createElement("p");
    descripcion.classList.add("form_autorizacion");
    descripcion.textContent = factor.description;

    descripcionCont.append(descripcionTitulo, descripcion);

    const ubicacionDistanciaCont = document.createElement("div");
    ubicacionDistanciaCont.classList.add("form_autorizacion");

    const ubicacionCont = document.createElement("div");
    ubicacionCont.classList.add("form_autorizacion", "form-column_autorization");

    const ubicacionTitulo = document.createElement("p");
    ubicacionTitulo.classList.add("form__texto");
    const ubicacionIcono = document.createElement("i");
    ubicacionIcono.classList.add("icono--pequeno", "ri-map-pin-2-line");
    ubicacionTitulo.append(ubicacionIcono, "Ubicación: ");

    const ubicacion = document.createElement("p");
    ubicacion.classList.add("form_autorizacion");
    ubicacion.textContent = factor.ubication;

    ubicacionCont.append(ubicacionTitulo, ubicacion);

    // const distanciaIcono = document.createElement("i");
    // distanciaIcono.classList.add("icono--pequeno", "ri-roadster-line");
    const distanciaCont = document.createElement("p");
    distanciaCont.classList.add("form_autorizacion", "form-column_autorization");


    const distanciaTitulo = document.createElement("p");
    distanciaTitulo.classList.add("form__texto");
    distanciaTitulo.textContent = "Distancia: ";
    const distancia = document.createElement("p");
    distancia.classList.add("form_autorizacion");
    distancia.textContent = `${factor.distance} metros`;

    distanciaCont.append(distanciaTitulo, distancia);

    ubicacionDistanciaCont.append(ubicacionCont, distanciaCont);

    const accionesReduccionCont = document.createElement("div");
    accionesReduccionCont.classList.add("form_autorizacion", "form-column_autorization");

    const accionesReduccionTitulo = document.createElement("p");
    accionesReduccionTitulo.classList.add("form__texto");
    const accionesReduccionIcono = document.createElement("i");
    accionesReduccionIcono.classList.add("icono--pequeno", "ri-shield-check-line");
    accionesReduccionTitulo.append(accionesReduccionIcono, " Acciones de reducción de riesgo");

    accionesReduccionCont.append(accionesReduccionTitulo);

    if (riskReduction.length === 0) {
        const sinAcciones = document.createElement("p");
        sinAcciones.classList.add("form_autorizacion");
        sinAcciones.textContent = "Sin acciones registradas";
        accionesReduccionCont.append(sinAcciones);
    } else {

        riskReduction.forEach(async accion => {

            const accionCont = document.createElement("div");
            accionCont.classList.add("form_autorizacion", "form-column_autorization");

            const accionRealizada = document.createElement("p");
            accionRealizada.classList.add("form_autorizacion");
            accionRealizada.textContent = `• Acción: ${accion.action}`;

            const encargado = document.createElement("p");
            encargado.classList.add("form_autorizacion");
            
            const nombreEncargado = miembrosFamilia.find(m => { 
                return m.member_id == accion.member_id
            });

            const miembro = await api.get(`members/${nombreEncargado.member_id}`);
            encargado.textContent = `Encargado: ${miembro.names} ${miembro.last_names}`;

            const fechas = document.createElement("p");
            fechas.classList.add("form_autorizacion");
            fechas.textContent = `Fecha inicio: ${accion.created_at.split("T")[0]} - Fecha final: ${accion.end_date}`;

            const espacio = document.createElement("p");
            espacio.classList.add("form_autorizacion");
            espacio.textContent = " ";

            accionCont.append(accionRealizada, encargado, fechas, espacio);
            accionesReduccionCont.append(accionCont);
        });
    }

    const contenidoVentana = document.createElement("div");
    contenidoVentana.classList.add("contenido-ventana")
    
    contenidoVentana.append(tipoAmenazaCont, descripcionCont, ubicacionDistanciaCont, accionesReduccionCont);

    // Qué hace: Agrega el botón de edición del factor de riesgo únicamente si el estado del plan es Enviado (1).
    // Por qué existe: Garantiza que el supervisor no altere datos si el plan no está bajo revisión activa.
    // Qué problema resuelve: Mantiene la consistencia del modo solo lectura para planes en estados terminales o de corrección.
    if (info.status_plan_id === 1) {
        ventana.append(btnCerrarCont, contenidoVentana, btnEditar);
    } else {
        ventana.append(btnCerrarCont, contenidoVentana);
    }

    overlay.appendChild(ventana);

    overlay.onclick = (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    };

    document.body.appendChild(overlay);

    btnCerrar.onclick = () => {
        document.body.removeChild(overlay);
    };

    btnEditar.addEventListener("click", ()=>{
        location.href = `#/supervisor/plan_familiar/factores_de_riesgo/editar?familia_id=${info.id}&riesgo_id=${factor.id}`;
        overlay.remove();
    });

}

export default factorRiesgoVentana;