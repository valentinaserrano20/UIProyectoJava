import historial from "../../../../../componentes/historial/historial";
import * as api from "../../../../../helpers/api";

const historialOrganizacion = async () => {
    
    const id = location.hash.split("=")[1];

    const datoMaestro = await api.get(`organizations/${id}`);

    const datosHistorial = await api.get(`organizations/${id}/history`);

    const SubDatos = await api.get(`sectionals`);

    const seccional = SubDatos.find(s => s.id === datoMaestro.sectional_id);


    historial(datosHistorial, datoMaestro, "Seccional", "name", seccional.name);
};

export default historialOrganizacion;