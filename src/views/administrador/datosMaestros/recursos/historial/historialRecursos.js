import historial from "../../../../../componentes/historial/historial";
import * as api from "../../../../../helpers/api";

const historialRecursos = async () => {
    
    const id = location.hash.split("=")[1];

    const datoMaestro = await api.get(`resources/${id}`);

    const datosHistorial = await api.get(`resources/${id}/history`);

    historial(datosHistorial, datoMaestro, "Servicio", "name", datoMaestro.service);
};

export default historialRecursos;