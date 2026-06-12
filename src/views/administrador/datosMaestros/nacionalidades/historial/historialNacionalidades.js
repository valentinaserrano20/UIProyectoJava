import historial from "../../../../../componentes/historial/historial";
import * as api from "../../../../../helpers/api";

const historialNacionalidades = async () => {
    
    const id = location.hash.split("=")[1];

    const datoMaestro = await api.get(`nationalities/${id}`);

    const datosHistorial = await api.get(`nationalities/${id}/history`);


    historial(datosHistorial, datoMaestro, null, "name", null);
};

export default historialNacionalidades;