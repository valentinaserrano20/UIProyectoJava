/**
 * Helper de Control de Acceso a Planes Familiares (accesoPlan.js)
 * Verifica contra el backend si el usuario actual tiene el permiso legal para ver o editar 
 * un Plan Familiar específico. Redirige la navegación en caso de denegación.
 */
import * as api from "./api";
import * as alerta from "./alertas";

// MODIFICADO: Corrección de redirección y validación de acceso al plan
export default async (id) => {
    // Consulta al backend si el voluntario tiene acceso a este ID específico
    const acceso = await api.get(`familyPlans/check-access/${id}`);

    // Si la respuesta es inválida o no hay acceso
    if (!acceso || !acceso.access_check) {
        alerta.alertaMensaje("No tienes acceso a este plan familiar."); // Lanza toast de error

        // AGREGADO: Validar si la URL actual pertenece al supervisor para redirigir correctamente
        const esSupervisor = window.location.hash.includes("supervisor");
        if (esSupervisor) {
            location.replace(`#/supervisor/plan_familiar`);
        } else {
            location.replace(`#/voluntario/plan_familiar`);
        }
        return false;
    }
    return true;
}