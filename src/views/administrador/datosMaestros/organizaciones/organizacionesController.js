/**
 * Controlador Catálogo: Organizaciones (organizacionesController.js)
 * Gestiona la interfaz del catálogo de organizaciones de la Cruz Roja,
 * visualizando a su vez la relación foránea (Seccional a la que pertenece).
 */
// import crearLista from "../../../../helpers/crearLista";
import * as organizacion from "../../../../helpers/modales/organizacion";
import * as api from "../../../../helpers/api";
import { verEstado_select } from "../../../../componentes/ver_Estado/varianteEstados";

export default async () => {

    const botonBack = document.getElementById("botonBack");

    if (window.procesoPeticion === undefined) {
        window.procesoPeticion = false;
    }
    window.procesoPeticion = false;

    botonBack.onclick = async () => {
        if (window.procesoPeticion) return;
        location.href = `#/administrador/datos_maestros/`;
    };

    const botonCrear = document.querySelector('#crearOrganizacion');

    // Función para recargar la lista
    const recargar = async () => {
        
        const datosOrganizacion = await api.get("organizations/");
        
        const datosSectional = await api.get("sectionals/");
        
        
        const contenedor = document.querySelector(".listaDatos");
        contenedor.innerHTML = ""; // limpiar antes de repintar
        
        datosOrganizacion.forEach(dato => {

            const sectional = datosSectional.find(sectionalOrg => {
                return sectionalOrg.id === dato.sectional_id
            }); 
            
            const urlHistorial = `#/administrador/datos_maestros/organizaciones/historial?id=${dato.id}`;
                    
            const boton = document.createElement("button");
            boton.classList.add("listaDatos__valor");
            if (!dato.is_active) boton.classList.add("listaDatos__Inactivo");
            boton.dataset.id = dato.id;
        
            const span = document.createElement("span");
            span.classList.add("listaDatos__nombre");
        
            const icono = document.createElement("i");
            icono.classList.add("ri-eye-line");
        
            const texto = document.createTextNode(
                ` ${dato.name} (${sectional.name}) - ${dato.is_active ? "Activo" : "Inactivo"}`
            );
        
            span.append(icono, texto);
            boton.append(span);

            const datoText = {

                //Nombres en DB
                nameDB:"name",
                subnameDB: "name",

                datoNombre: "Organización",
                subDatoNombre: "Seccional",

                urlDato: "organizations",
                urlSubDato: "sectionals",

                campoDato: "sectional_id"
            }
        
            boton.addEventListener("click", () => {
                verEstado_select(dato, sectional, recargar, urlHistorial, datoText);
            });
        
            contenedor.append(boton);
        });
    };

    // Cargar lista inicial
    await recargar();

    // BOTÓN CREAR
    botonCrear.addEventListener("click", () => {
        organizacion.crear(recargar);
    });

};
