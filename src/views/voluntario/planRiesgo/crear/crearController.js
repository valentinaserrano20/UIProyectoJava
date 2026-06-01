/**
 * Controlador: Insertar Nuevo Factor Riesgo Inicial (planRiesgo/crear/crearController.js)
 * Formulario inicial simplificado para registrar un tipo de amenaza ("Sismo", "Inundación").
 * Envía el Payload directo porque el cliente confía en el validador estricto del HTML Required Properties o DB side.
 */
import * as api from "../../../../helpers/api";
import * as alerta from "../../../../helpers/alertas";
import * as adjuntarOpc from "../../../../helpers/adjuntarOpciones";

export default async () => {
    // Selectores DOM Main Nav and Tools
    const botonBack = document.getElementById("botonBack");
    const botonSiguiente = document.getElementById('botonSiguiente'); // Action Button Submit Insert
    const form = document.querySelector('.form');
    const id = location.hash.split("=")[1]; // Plan Familiar Parent Header Pointer UUID

    if (window.procesoPeticion === undefined) { window.procesoPeticion = true; }
    window.procesoPeticion = true;

    // Retorno Cancelación Safe 
    botonBack.onclick = async () => {
        if (window.procesoPeticion) return;
        const confirmacion = await alerta.alertaQuest("¿Seguro que quieres volver? perderás tu progreso");
        if (confirmacion.isConfirmed) location.href = `#/voluntario/plan_familiar/factores_de_riesgo?familia_id=${id}`;
    };

    // Selectores Dom Formularios
    const descripcion = document.getElementById('descripcion');
    const distancia = document.getElementById('distancia');
    const ubicacion = document.getElementById('ubicacion');
    const amenaza = document.getElementById('tiposAmenaza'); // Select Diccionario
    
    // Inyecta opciones de la DB "Sismo, Incendio..." en el Select 'amenaza'
    await adjuntarOpc.adjuntar(amenaza, "threatTypes");

    window.procesoPeticion = false;
    botonSiguiente.disabled = false;

    // Master Submit Hook Form Send
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.procesoPeticion = true // Lock doble hit prevent
        botonSiguiente.disabled = true;

        // Mapper a DB Contract DTO Expected properties names 
        const datosRegistro = {
            threat_type_id: amenaza.value, // Select Foreign Key Relational Data Dict App State Value numeric id 
            description: adjuntarOpc.capitalizarPrimeraLetra(descripcion.value),
            ubication: adjuntarOpc.capitalizar(ubicacion.value.trim()),
            distance: distancia.value,
            family_plan_id: id // Linkea Relacion Raiz (Plan Familiar) 
        };
        
        try {
            // Push HTTP Create Resource Entry Factor Riesgo "RiskFactors" tables back
            const data = await api.post(`riskFactors`, datosRegistro); // Call Helpers Axios Wrapper Fetch 
            
            if (data.success) {
                await alerta.alertaOK(data.message) 
                
                // NOTA INGENÍERIA: Aquí NO pregunta si quiere ir a editar para añadir Vulnerabilidades! 
                // A diferencia de Integrantes (Enfermedades) o Mascotas (Vacunas), aquí el usuario 
                // debe presionar manualmente 'Editar' desde el Index Grid Principal si desea continuar anexando.
                window.location.href = `#/voluntario/plan_familiar/factores_de_riesgo?familia_id=${id}`; // Return Dash Layout Default Front 
            }
            else alerta.alertaWarning(data.message, data.errors) // Business Layer Error Catch From Server Backend Logic Validators Example 422 Required Fields Validation failed. Exception Format
        } catch (error) {
            alerta.alertaError(error.errors);
        }

        // Release Form Locked Try-Catch Flow Completed Execution Return 
        botonSiguiente.disabled = false;
        window.procesoPeticion = false;
    });
}