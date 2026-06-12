/**
 * Controlador Catálogo: Tipos de Documentos (tiposDocumentoController.js)
 * Renderiza la lista paramétrica de Tipos de Documento de Identidad (CC, TI, CE, etc.).
 * Muestra las siglas (acronym) e incluye la funcionalidad de crear o editar mediante modales.
 */

import * as api from "../../../../helpers/api.js";
import * as tipoDocumento from "../../../../helpers/modales/tipoDocumento.js";
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

    const botonCrear = document.querySelector('#crearTipoDocumento');

    // Función para recargar la lista
    const recargar = async () => {

        const datosDocumentos = await api.get("documentTypes/");
        
        const contenedor = document.querySelector(".listaDatos");
        contenedor.innerHTML = "";

        datosDocumentos.forEach(dato => {
            
            const urlHistorial = `#/administrador/datos_maestros/tipos_documento/historial?id=${dato.id}`;

            const boton = document.createElement("button");
            boton.classList.add("listaDatos__valor");
            if (!dato.is_active) boton.classList.add("listaDatos__Inactivo");
            boton.dataset.id = dato.id;

            const span = document.createElement("span");
            span.classList.add("listaDatos__nombre");

            const icono = document.createElement("i");
            icono.classList.add("ri-eye-line");

            const texto = document.createTextNode(
                ` ${dato.name}(${dato.acronym}) - ${dato.is_active ? "Activo" : "Inactivo"}`
            );

            span.append(icono, texto);
            boton.append(span);

            const datoText = {

                //Nombres en DB
                nameDB:"name",

                subnameDB: "acronym",

                datoNombre: "Tipo de Documento",

                subDatoNombre: "Acrónimo", 

                urlDato: "documentTypes",
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
        tipoDocumento.crear(recargar);
    });

};
