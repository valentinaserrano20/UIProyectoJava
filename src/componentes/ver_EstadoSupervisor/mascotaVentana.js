import * as api from "../../helpers/api";
import * as alerta from "../../helpers/alertas";

const MascotaVentana = async (mascota, info) => {

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
    
    const userIcono = document.createElement("i");
    userIcono.classList.add("icono--pequeno", "ri-user-line");
    const nombreTitulo = document.createElement("p");
    nombreTitulo.append(userIcono, " Nombre de la Mascota");
    nombreTitulo.classList.add("form__texto");

    const nombreMascota = document.createElement("p");
    nombreMascota.classList.add("form_autorizacion", "integrante--nombre");
    nombreMascota.textContent = mascota.name;

    const nombreCont = document.createElement("div");
    nombreCont.classList.add("form_autorizacion", "form-column_autorization");

    nombreCont.append(nombreTitulo, nombreMascota);

    const species = await api.get(`species/${mascota.species_id}`);

    const especieRazaCont = document.createElement("div");
    especieRazaCont.classList.add("form_autorizacion");

    const EspecieCont = document.createElement("div");
    EspecieCont.classList.add("form_autorizacion", "form-column_autorization");

    const especieTitulo = document.createElement("p");
    especieTitulo.classList.add("form__texto");
    const especieIcono = document.createElement("i");
    especieIcono.classList.add("icono--pequeno", "ri-paw-line");
    especieTitulo.append(especieIcono, " Especie");

    const especie = document.createElement("p");
    especie.classList.add("form_autorizacion");
    especie.textContent = species.name;

    EspecieCont.append(especieTitulo, especie);

    const razaCont = document.createElement("div");
    razaCont.classList.add("form_autorizacion", "form-column_autorization");

    const razaTitulo = document.createElement("p");
    razaTitulo.classList.add("form__texto");
    const razaIcono = document.createElement("i");
    razaIcono.classList.add("icono--pequeno", "ri-paw-line");
    razaTitulo.append(razaIcono, " Raza");

    const raza = document.createElement("p");
    raza.classList.add("form_autorizacion");
    raza.textContent = mascota.breed;
    razaCont.append(razaTitulo, raza);

    especieRazaCont.append(EspecieCont, razaCont);

    const petGender = await api.get(`animalGenders/pet/${mascota.id}`);

    const generoCont = document.createElement("div");
    generoCont.classList.add("form_autorizacion", "form-column_autorization");

    const generoTitulo = document.createElement("p");
    generoTitulo.classList.add("form__texto");
    const generoIcono = document.createElement("i");
    generoIcono.classList.add("icono--pequeno", "ri-genderless-line");
    generoTitulo.append(generoIcono, " Género");

    const genero = document.createElement("p");
    genero.classList.add("form_autorizacion");
    genero.textContent = petGender.name;

    generoCont.append(generoTitulo, genero);

    const petsVaccines = await api.get(`petVaccines/pet/${mascota.id}`);
    console.log("vacunas: ", petsVaccines);

    const vacunasCont = document.createElement("div");
    vacunasCont.classList.add("form_autorizacion", "form-column_autorization");

    const vacunasTitulo = document.createElement("p");
    vacunasTitulo.classList.add("form__texto");
    const vacunaIcono = document.createElement("i");
    vacunaIcono.classList.add("icono--pequeno", "ri-syringe-line");
    vacunasTitulo.append(vacunaIcono, " Vacunas");
    vacunasCont.append(vacunasTitulo);

    if (petsVaccines.length === 0) {
        const sinVacunas = document.createElement("p");
        sinVacunas.classList.add("form_autorizacion");
        sinVacunas.textContent = "Sin vacunas registradas";
        vacunasCont.append(sinVacunas);
    }

    petsVaccines.forEach(vacuna => {

        const vacuna_p = document.createElement("p");
        vacuna_p.classList.add("form_autorizacion");
        vacuna_p.textContent = `${vacuna.name} - Última aplicación: ${vacuna.date}`;
        vacunasCont.append(vacuna_p);
    });

    const contenidoVentana = document.createElement("div");
    contenidoVentana.classList.add("contenido-ventana")

    contenidoVentana.append(nombreCont, especieRazaCont, generoCont, vacunasCont)

    // Qué hace: Incorpora el botón para editar datos de la mascota si y solo si el plan se encuentra Enviado (1).
    // Por qué existe: Bloquea ediciones si el plan ya ha sido finalizado o enviado de vuelta al voluntario.
    // Qué problema resuelve: Evita la manipulación de registros de mascotas fuera del estado de revisión inicial.
    if (info.status_plan_id === 1) {
        ventana.append(btnCerrarCont, contenidoVentana, btnEditar);
    } else {
        ventana.append(btnCerrarCont, contenidoVentana);
    }

    overlay.append(ventana);

    document.body.appendChild(overlay);

    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };

    btnCerrar.onclick = () => overlay.remove();

    btnEditar.addEventListener("click", () => {
        location.href = `#/supervisor/plan_familiar/mascotas/editar?familia_id=${info.id}&mascota_id=${mascota.id}`;
        overlay.remove();
    });
}

export default MascotaVentana;