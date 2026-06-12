import historial from "../../../../../componentes/historial/historial";
import * as api from "../../../../../helpers/api";

const historialDepartamento = async () => {
    
    const id = location.hash.split("=")[1];

    const datoMaestro = await api.get(`departments/${id}`);

    const datosHistorial = await api.get(`departments/${id}/history/`);


    historial(datosHistorial, datoMaestro, null, "name", null);
};

export default historialDepartamento;