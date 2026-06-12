/**
 * Controlador Catálogo: Preguntas de Vulnerabilidad (preguntasVulnerabilidadController.js)
 * Maneja el listado y la creación de preguntas empleadas para calcular 
 * los índices de vulnerabilidad de un Plan Familiar.
 */

import * as vulnerabilidad from "../../../../helpers/modales/preguntaVulnerabilidad.js";
import * as api from "../../../../helpers/api.js";
import { verEstado_select } from "../../../../componentes/ver_Estado/varianteEstados.js";

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

    const botonCrear = document.querySelector('#crearPreguntaVulnerabilidad');

    // Función para recargar la lista
    const recargar = async () => {

        const datos = await api.get("vulnerableQuestions/");
        

        const contenedor = document.querySelector(".listaDatos");
        contenedor.innerHTML = ""; // limpiar antes de repintar

        datos.forEach(dato => {
                    
            const urlHistorial = `#/administrador/datos_maestros/preguntas_vulnerabilidad/historial?id=${dato.id}`;
                            
            const boton = document.createElement("button");
            boton.classList.add("listaDatos__valor");
            if (!dato.is_active) boton.classList.add("listaDatos__Inactivo");
            boton.dataset.id = dato.id;
                
            const span = document.createElement("span");
            span.classList.add("listaDatos__nombre");
                
            const icono = document.createElement("i");
            icono.classList.add("ri-eye-line");
                
            const texto = document.createTextNode(
                ` ${dato.description} - ${dato.is_active ? "Activo" : "Inactivo"}`
            );
                
            span.append(icono, texto);
            boton.append(span);

            const datoText = {

                //Nombres en DB
                nameDB:"description",
                subnameDB:"name",

                datoNombre: "Pregunta",
                subDatoNombre: "Precaución",

                urlDato: "vulnerableQuestions",
                urlSubDato: null,

                campoDato: null,
                campoSubDato: "question_caution"

            }
                
            boton.addEventListener("click", () => {
                verEstado_select(dato, dato.question_caution, recargar, urlHistorial, datoText);
            });
                
            contenedor.append(boton);
        });
    };

    // Cargar lista inicial
    await recargar();

    // BOTÓN CREAR
    botonCrear.addEventListener("click", () => {
        vulnerabilidad.crear(recargar);
    });

};
