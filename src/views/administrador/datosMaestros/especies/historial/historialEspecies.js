import historial from "../../../../../componentes/historial/historial";
import * as api from "../../../../../helpers/api";

const historialEspecies = async () => {
    
    const id = location.hash.split("=")[1];

    const datoMaestro = await api.get(`species/${id}`);

    const datosHistorial = await api.get(`species/${id}/history/`);


    historial(datosHistorial, datoMaestro, null, "name", null);
};

export default historialEspecies;