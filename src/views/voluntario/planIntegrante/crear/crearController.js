/**
 * Controlador: Insertar Nuevo Miembro (planIntegrante/crear/crearController.js)
 * Maneja el formulario pesado de recolecta de información personal (Nombres, Docs, 
 * RH Sangre, Parentesco). 
 * Utiliza el "Validador Automático" (helper inteligente) en lugar de validación manual campo por campo.
 */
import * as api from "../../../../helpers/api";
import * as alerta from "../../../../helpers/alertas";
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";
import * as validacion from "../../../../helpers/validacionInputs";

export default async () => {
    // Selectores Form Layout
    const botonBack = document.getElementById("botonBack");
    const botonGuardar = document.getElementById('botonGuardar'); // POST Inserter
    const form = document.querySelector('.form');
    const id = location.hash.split("=")[1]; // Plan_Family PK FK id

    // Control Local Clics
    if (window.procesoPeticion === undefined) {window.procesoPeticion = true;} 
    window.procesoPeticion = true;

    // Romper y Volver al Muro de Tarjetas Integrantes (Are You Sure Msg Promp)
    botonBack.onclick = async() => {
    if(window.procesoPeticion) return;
    const confirmacion = await alerta.alertaQuest("¿Seguro que quieres volver? perderás tu progreso");
    if (confirmacion.isConfirmed) location.href = `#/voluntario/plan_familiar/integrantes?familia_id=${id}`;};
    
    // Nodos Físicos Campos Texto Formulario
    const nombres = document.getElementById('nombres');
    const apellidos = document.getElementById('apellidos');
    const numDocumento = document.getElementById('numeroDocumento');
    const eps = document.getElementById('eps');
    const celularPersonal = document.getElementById('celularPersonal');
    const nacimiento = document.getElementById('nacimiento'); // Datepicker nativo HW

    // Nodos Fisicos Listas Selectoras Dropdown <options>
    const tipoDocumento = document.getElementById('tiposDocumento');
    const genero = document.getElementById('generos');
    const parentesco = document.getElementById('parentescos'); // Head, Child, Parent..
    const grupoSanguineo = document.getElementById('grupoSanguineos');
    const nacionalidad = document.getElementById('nacionalidades');
    
    // Extractor API Auto-Mapper (Llena los Option HTML llamando Endpoints del Backend Diccionarios)
    await adjuntarOpc.adjuntar(tipoDocumento,"documentTypes");
    await adjuntarOpc.adjuntarNoValida(genero,"genders");
    await adjuntarOpc.adjuntarNoValida(parentesco,"kinships");
    await adjuntarOpc.adjuntarNoValida(grupoSanguineo,"bloodGroups");
    await adjuntarOpc.adjuntarNoValida(nacionalidad,"nationalities");

    // Unlock Early UI Loading State
    window.procesoPeticion = false;
    botonGuardar.disabled = false;

    // MAGIA: Inicializador Validador Omnipotente Frontend (Parsea Atributos HTML del file PUG/HTML buscando Data-types Min, Max regexes automaticos)
    validacion.validadorAutomatico.init(form);
    
    // Envío Datos Form
    form.addEventListener('submit', async (e) => {

        e.preventDefault();
        window.procesoPeticion = true // Lock Submit Multiple
        botonGuardar.disabled = true;
        
        // Ejecución Analizador de Nodos Helper validador. Chequea si todos los Select Y texts cumplen reglas sin programar 1x1.
        const booleanValidacion = validacion.validadorAutomatico.validarTodo(form);
        if (!booleanValidacion)
        {
            // Falla UI. Cortocitcuit exit.
            window.procesoPeticion = false
            botonGuardar.disabled = false;
            return
        }
        
        // Constructor JSON Mapper a DTO de Tabla "Members" Database Laravel Eloquent
        const datosRegistro = {
            names: adjuntarOpc.capitalizar(nombres.value.trim()),
            last_names: adjuntarOpc.capitalizar(apellidos.value.trim()),
            birth_date: nacimiento.value,
            blood_group_id: grupoSanguineo.value,
            document_type_id: tipoDocumento.value,
            document_number: numDocumento.value,
            nationality_id: nacionalidad.value,
            gender_id: genero.value,
            kinship_id: parentesco.value,
            eps: adjuntarOpc.capitalizar(eps.value.trim()),
            phone: celularPersonal.value,
        };

        try {
            // INSERT POST A TABLA MEMBERS API
            const data = await api.post(`members/${id}`,datosRegistro);
            if (data.success)
                {
                    await alerta.alertaOK(data.message)
                    
                    // LÓGICA DE NEGOCIO INTERESANTE: Al crear persona.. PREGUNTA al Voluntario Inmediatamente si quiere anexarle 
                    // CONDICIONES MÉDICAS! (Diabético, Hipertenso, Sordo). 
                    const pregunta = await alerta.alertaQuest("Deseas agregar las enfermedades/discapacidad/alergias/ de este integrante?")
                    // Flujo Condicionado UX: 
                    // SI: Salta en automático al Modulo "Editar Integrante" donde abajo esta el modal "Añadir afecciones"
                    // NO: Vuelve normalito al Muro General Listado
                    pregunta.isConfirmed ? window.location.href = `#/voluntario/plan_familiar/integrantes/editar?familia_id=${id}&integrante_id=${data.data.id}` : location.href = `#/voluntario/plan_familiar/integrantes?familia_id=${id}`;
                }
            else alerta.alertaWarning(data.message,data.errors)
        } catch (error) {
            alerta.alertaError(error.errors); // Network
        }
    
        // Liberar Finally Error
        botonGuardar.disabled = false;
        window.procesoPeticion = false;
    });
}