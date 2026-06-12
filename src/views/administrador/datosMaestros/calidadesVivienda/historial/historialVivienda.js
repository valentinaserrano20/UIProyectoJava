import historial from "../../../../../componentes/historial/historial";
import * as api from "../../../../../helpers/api";

const historialVivienda = async () => {
    
    const id = location.hash.split("=")[1];

    const datoMaestro = await api.get(`housingQualities/${id}`);

    const datosHistorial = await api.get(`housingQualities/${id}/history/`);


    historial(datosHistorial, datoMaestro, null, "name", null);
};

export default historialVivienda;