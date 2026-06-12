/**
 * Controlador Catálogo: Recursos (recursosController.js)
 * Administra el catálogo de recursos disponibles para gestión de riesgos.
 * Permite visualizar el listado completo y abrir modales de edición/creación.
 */
import * as recurso from "../../../../helpers/modales/recurso";
import * as api from "../../../../helpers/api.js";
import { verEstado_doubleInput } from "../../../../componentes/ver_Estado/varianteEstados.js";

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

    const botonCrear = document.querySelector('#crearRecurso');

    // Función para recargar la lista
    const recargar = async () => {

        const datosDocumentos = await api.get("resources/");
        
        const contenedor = document.querySelector(".listaDatos");
        contenedor.innerHTML = "";

        datosDocumentos.forEach(dato => {
            
            const urlHistorial = `#/administrador/datos_maestros/recursos/historial?id=${dato.id}`;

            const boton = document.createElement("button");
            boton.classList.add("listaDatos__valor");
            if (!dato.is_active) boton.classList.add("listaDatos__Inactivo");
            boton.dataset.id = dato.id;

            const span = document.createElement("span");
            span.classList.add("listaDatos__nombre");

            const icono = document.createElement("i");
            icono.classList.add("ri-eye-line");

            const texto = document.createTextNode(
                ` ${dato.name}(${dato.service}) - ${dato.is_active ? "Activo" : "Inactivo"}`
            );

            span.append(icono, texto);
            boton.append(span);

            const datoText = {

                //Nombres en DB
                nameDB:"name",

                subnameDB: "service",

                datoNombre: "Tipo de Amenaza",

                subDatoNombre: "Servicio", 

                urlDato: "resources",
            }

            
            boton.addEventListener("click", () => {
                verEstado_doubleInput(dato, recargar, urlHistorial, datoText);
            });

            contenedor.append(boton);
        });
    };


    // Cargar lista inicial
    await recargar();

    // BOTÓN CREAR  
    botonCrear.addEventListener("click", () => {
        recurso.crear(recargar);
    });

};
