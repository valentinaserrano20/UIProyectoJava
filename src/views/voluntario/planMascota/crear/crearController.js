/**
 * Controlador: Insertar Nueva Mascota (planMascota/crear/crearController.js)
 * Formulario simple para crear el animalito. Notar que:
 * El requerimiento original del usuario no incluyó validadorOmnipotente aquí?
 * Se manda el Payload directo sin front-validators mas duros.
 */
import * as api from "../../../../helpers/api";
import * as alerta from "../../../../helpers/alertas";
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";
import * as validacion from "../../../../helpers/validacionInputs";

export default async () => {
    // Selectores Main 
    const botonBack = document.getElementById("botonBack");
    const botonGuardar = document.querySelector('.form__boton');
    const form = document.querySelector('.form');
    const id = location.hash.split("=")[1]; // PlanFamiliar FK Root ID

    if (window.procesoPeticion === undefined) { window.procesoPeticion = true; }
    window.procesoPeticion = true;

    // Regresar Atrás y Abortar Inserción
    botonBack.onclick = async () => {
        if (window.procesoPeticion) return;
        const confirmacion = await alerta.alertaQuest("¿Seguro que quieres volver? perderás tu progreso");
        if (confirmacion.isConfirmed) location.href = `#/voluntario/plan_familiar/mascotas?familia_id=${id}`;
    };

    // Inputs de texto Básicos HTML DOM IDs
    const nombre = document.getElementById('nombre');
    const raza = document.getElementById('raza');
    const edad = document.getElementById('edad'); // Numero integer
    const especies = document.getElementById('especies');
    const generos = document.getElementById('generos');
    
    // Inyección Auto Options Helper <option value=1>Perro</option>
    await adjuntarOpc.adjuntar(especies, "species");
    await adjuntarOpc.adjuntarNoValida(generos, "animalGenders");

    // Libera Submit Start Check
    window.procesoPeticion = false;
    botonGuardar.disabled = false;

    validacion.validadorAutomatico.init(form);

    // Submit Core Listener POST Create
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.procesoPeticion = true // Lock doble clicker
        botonGuardar.disabled = true;

        const booleanValidacion = validacion.validadorAutomatico.validarTodo(form);
        if (!booleanValidacion)
        {
            // Falla UI. Cortocitcuit exit.
            window.procesoPeticion = false
            botonGuardar.disabled = false;
            return
        }
        
        // Mapper JSON DTO -> Pets Laravel Model Backend Schema
        const datosRegistro = {
            name: adjuntarOpc.capitalizar(nombre.value.trim()),
            breed: adjuntarOpc.capitalizar(raza.value.trim()),
            birth_date: edad.value,
            species_id: especies.value,
            animal_gender_id: generos.value,
            family_plan_id: id // Relaciona el Animal Conectando a la Familia Creadora Actual
        };
        
        try {
            // Push Insercion SQL
            const data = await api.post(`pets`, datosRegistro); // Resource Api /Pets
            
            if (data.success) {
                await alerta.alertaOK(data.message)
                
                // IGUAL QUE INTEGRANTES: Al ser exitoso PREGUNTA PROACTIVAMENTE si anexas las "VACUNAS"!
                const pregunta = await alerta.alertaQuest("Deseas agregar las vacunas de esta mascota?")
                // Flujo Condicionado de Ahorro de clics al Voluntario Evaluador
                // SI: Te lleva al Módulo Editar de esa mascota recién creada que es el único que tiene el Popup Acordeon Inferior Añadir Vacunas.
                // NO: Muro normal Volver
                pregunta.isConfirmed ? window.location.href = `#/voluntario/plan_familiar/mascotas/editar?familia_id=${id}&mascota_id=${data.data.id}` : location.href = `#/voluntario/plan_familiar/mascotas?familia_id=${id}`;
            }
            // Error Reglas Negocio Backend 
            else alerta.alertaWarning(data.message, data.errors)
        } catch (error) {
            alerta.alertaError(error.errors); // Network Failure
        }

        // Release All Finally state
        botonGuardar.disabled = false;
        window.procesoPeticion = false;
    });
}