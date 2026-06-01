/**
 * Helper de Validación de Inputs (validacionInputs.js)
 * Script global que provee utilidades para restringir teclas pulsadas en los inputs, 
 * validar formatos (correo, contraseñas), y automatizar las validaciones de formularios completos 
 * basándose en atributos de datos (`data-tipo`) en el HTML.
 */

// =====================================================
// CONFIGURACIÓN BASE
// =====================================================

import { log10 } from "chart.js/helpers";

// Arreglo de teclas funcionales del sistema que siempre deben permitirse
// para no bloquear el borrado o navegación dentro del input
export const TECLAS_ESPECIALES = [
  "Backspace",
  "Tab",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "Delete",
  "Home",
  "End"
];

// =====================================================
// MANEJO DE ERRORES EN EL DOM
// =====================================================

// Dibuja visualmente un mensaje de error rojo debajo del input, dentro del div.input
// El CSS inputs.css usa .input:has(> span.error) para estilizar, por eso el span DEBE
// ser hijo directo del div.input (1 solo nivel de parentElement desde el input)
const mostrarError = (input, mensaje) => {
  limpiarError(input); // Borra cualquier error anterior para no apilarlos

  // Crea una nueva etiqueta <span> con la clase CSS ".error" y el texto descriptivo
  const span = document.createElement("span");
  span.className = "error";
  span.textContent = mensaje;

  // Si el input está dentro de un form__inputBox, insertamos la burbuja relativa a este
  const targetElement = input.parentElement.classList.contains("form__inputBox")
    ? input.parentElement
    : input;

  targetElement.insertAdjacentElement("afterend", span);
};

// Busca si hay un span ".error" hermano del target y lo destruye
export const limpiarError = (input) => {
  const targetElement = input.parentElement.classList.contains("form__inputBox")
    ? input.parentElement
    : input;

  // Buscamos el span.error que sea hermano directo
  const sibling = targetElement.nextElementSibling;
  if (sibling && sibling.classList.contains("error")) {
    sibling.remove();
  }
};


// Función auxiliar envoltura: Invoca el dibujo del error y retorna automáticamente 'false' 
// para cortar el flujo de validación avisando que falló
const error = (input, mensaje) => {
  mostrarError(input, mensaje);
  return false;
};

// =====================================================
// VALIDACIONES POR TECLA (Eventos KeyDown/KeyPress)
// =====================================================

// Intercepta cada pulsación de tecla. Si la tecla *NO* pasa la Expresión Regular
// y *Tampoco* es una tecla especial de control, bloquea la acción evitando que se escriba en pantalla.
const permitirTecla = (event, regex) => {
  if (
    event.key &&
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !regex.test(event.key)
  ) {
    event.preventDefault(); // Anula silenciosamente el tecleo
  }
};

// Filtro: Solo deja pasar números del 0 al 9
export const keyboard_numero = (event) =>
  permitirTecla(event, /^\d$/);

// Filtro: Solo deja pasar letras del alfabeto (incluyendo tildes y eñes), sin espacios
export const keyboard_texto = (event) =>
  permitirTecla(event, /^[A-Za-zÁÉÍÓÚáéíóúÑñ]$/);

// Filtro: Deja pasar letras y también el carácter espacio en blanco
export const keyboard_textoEspacio = (event) =>
  permitirTecla(event, /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]$/);


// =====================================================
// LÍMITE DE CARACTERES MÁXIMO
// =====================================================
// Previene seguir escribiendo si la longitud del input ya alcanzó el límite marcado
export const keyboard_limite = (event, limite) => {
  const input = event.target;

  // Si no pulsa una tecla de borrado u orden, y ya superó o igualó el borde, bloquea.
  if (
    !TECLAS_ESPECIALES.includes(event.key) &&
    input.value.length >= limite
  ) {
    event.preventDefault();
  }
};
// =====================================================
// VALIDAR CORREO (Regex E-Mail Válido)
// =====================================================

export const validar_correo = (input) => {
  const value = input.value.trim(); // Limpia espacios accidentales al inicio/final
  // Expresión regular universal para validar estructura de correo (ej: nombre@dominio.com)
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

  limpiarError(input); // Reset pre-chequeo

  if (!value) // Si lo dejó completamente en blanco
    return error(input, "El correo es obligatorio.");

  if (!regex.test(value)) // Si escribió algo, pero no cumple estructura de e-mail
    return error(input, "El formato del correo no es válido.");

  return true; // Pasa la prueba satisfactoriamente
};

// =====================================================
// VALIDAR CONTRASEÑA (Políticas Flexibles)
// =====================================================

export const validar_password = (input) => {
  const value = input.value.trim();

  limpiarError(input);

  if (!value)
    return error(input, "La contraseña es obligatoria.");

  // Arreglo de reglas individuales a exigir en los passwords
  const reglas = [
    { test: /[A-Z]/, msg: "una mayúscula" },
    { test: /[a-z]/, msg: "una minúscula" },
    { test: /[0-9]/, msg: "un número" },
    { test: /[^A-Za-z0-9]/, msg: "un carácter especial" },
    { test: /.{8,}/, msg: "mínimo 8 caracteres" }
  ];

  // Ejecuta pruebas: Si la regla no aprueba, recolecta el mensaje del error correspondiente array `errores`
  const errores = reglas
    .filter(r => !r.test.test(value))
    .map(r => r.msg);

  // Si detectó una o más fallas, junta por texto los mensajes y lanza el warning
  if (errores.length)
    return error(
      input,
      `Debe contener: ${errores.join(", ")}.`
    );

  return true;
};

// Valida únicamente que el target no esté completamente en blanco
export const validar_vacio = (input) => {
  const value = input.value.trim();

  limpiarError(input);

  if (!value)
    return error(input, "No puede estar vacio.");

  return true;
};

// Comprueba que el valor string alcance un mínimo de longitud
export const validar_minimo = (input, minimo) => {

  const value = input.value.trim();

  limpiarError(input);

  if (!value)
    return error(input, "No puede estar vacío.");

  if (value.length < minimo)
    return error(
      input,
      `Debe tener al menos ${minimo} caracteres.`
    );

  return true;
};

// Comprueba que el valor no supere el máximo estipulado
export const validar_maximo = (input, maximo) => {
  const value = input.value.trim();

  limpiarError(input);

  if (!value)
    return error(input, "No puede estar vacío.");

  if (value.length > maximo)
    return error(
      input,
      `No puede tener más de ${maximo} caracteres.`
    );

  return true;
};

// Valida listas de selección. Asume que la primera opción vacía tenga "value=''" en HTML.
export const validar_select = (select) => {
  const value = select.value;
  
  limpiarError(select);

  // Si no seleccionó o seleccionó la viñeta predeterminada inválida
  if (!value || value === "")
    return error(select, "Debe seleccionar una opción.");

  return true;
};
export const validarSelect = validar_select;

// Combina función de mínimos y máximos simultáneamente
export const validar_minimoMaximo = (input, minimo, maximo) => {
  const value = input.value.trim();

  if (!value)
    return error(input, "No puede estar vacío.");

  if (value.length < minimo)
    return error(
      input,
      `Debe tener al menos ${minimo} caracteres.`
    );

  if (value.length > maximo)
    return error(
      input,
      `No puede tener más de ${maximo} caracteres.`
    );

  return true;
}; 

// =====================================================
// VALIDAR IGUALDAD DE CAMPOS (Ej: Confirmar Contraseña)
// =====================================================

export const validar_igualdad = (input, inputComparar) => {
  const value = input.value.trim();
  const valueComparar = inputComparar.value.trim();

  limpiarError(input);

  if (!value)
    return error(input, "No puede estar vacío.");

  if (value !== valueComparar)
    return error(input, "Los campos no coinciden."); // Retorna error si no matchean string con string verbatim

  return true;
};

// =====================================================
// VALIDAR MAYOR DE EDAD (Datepickers / Fecha de Nacimiento)
// =====================================================

export const validar_mayoriaEdad = (input) => {
  const value = input.value; // ej: "1994-05-20"
  
  limpiarError(input);

  if (!value)
    return error(input, "La fecha es obligatoria.");

  // Transforma los strings en objetos nativos de JS para operar
  const fechaNacimiento = new Date(value);
  const hoy = new Date();

  // Calcula una resta base sobre los años (2024 - 1994 = 30)
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  // Calcula diferencia entre el mes actual y el mes nacido (-11 a 11)
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();

  // Si no ha llegado a su mes cumpleaños o está en él pero falta para el día exacto 
  // resta un año al cálculo bruto asumiendo que sigue siendo de la edad anterior.
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())){
    edad--;
  }

  // Verifica el veredicto modificado
  if (edad < 18)
    return error(
      input,
      `Debe ser mayor de 18 años.`
  );

  return true;
};

// Validador Puentecual: Se salta la validación permitiendo 'true' si el usuario lo dejó optativamente en blanco
export const  validar_siExiste = (input, minimo) => {
  const value = input.value.trim();

  limpiarError(input);

  // Si está vacío, no valida nada y devuelve true
  if (!value) return true;

  // Si tiene contenido, ejecuta la validación que le pases (actualmente tiene harcodeado 'validarMinimo' que podría fallar si min es undefined)
  return validar_minimo(input,minimo);
};

// =====================================================
// DICCIONARIO DE PATRONES DE VALIDACIÓN HTML (`data-tipo`)
// =====================================================

// Objeto encargado de establecer un esquema para validar los inputs semi-automáticamente.
// Cada propiedad indica el valor del "data-tipo" que se pone al input en HTML (ej: <input data-tipo="textoCorto">).
// Contiene las reglas a atar, longitud de caracteres, y si exige llenado optativo.
const inputTipos={
  textoCorto: { keyboard:(input)=>keyboard_textoEspacio(input),min:3,max:50},

  textoLargo: { keyboard:keyboard_textoEspacio,min:8,max:255},

  textoNombres: { keyboard:keyboard_textoEspacio,min:3,max:70},

  // Optativo significa que admite estar vacío, lo maneja distinto.
  textoCortoOpcional: { keyboard:keyboard_textoEspacio,min:3,max:50,opcional: true},

  textoLargoOpcional: { keyboard:keyboard_textoEspacio,min:8,max:255,opcional: true},

  numerico: { keyboard: keyboard_numero,min:1,max: 50},

  numericoOpcional: { keyboard: keyboard_numero,min:1,max: 50,opcional: true},

  telefono:{keyboard: keyboard_numero ,min:7,max:10},

  telefonoOpcional:{keyboard: keyboard_numero ,min:7,max:15,opcional: true},
  
  documento:{keyboard: keyboard_numero ,min:7,max:15},

  direccion: {min: 3, max: 50},

  // Reglas con métodos exóticos custom via inyección de funciones anónimas
  correo:{validacion:(input)=>validar_correo(input)},

  password:{validacion:(input)=>validar_password(input),max:40},

  passwordSinValdacion: {validacion:(input)=>validar_maximo(input),max:40},

  mayorDeEdad:{validacion:(input)=>validar_mayoriaEdad(input)}
};


// =====================================================
// AUTOMATIC CAPITALIZATION FOR PROPER NOUNS/TEXT FIELDS
// =====================================================

const capitalizarTexto = (texto) => {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .split(" ")
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
};

const fieldsToCapitalize = (input) => {
  if (input.type !== "text") return false;
  if (input.readOnly || input.disabled) return false;

  const idLower = (input.id || "").toLowerCase();
  const nameLower = (input.name || "").toLowerCase();
  const tipoLower = (input.dataset.tipo || "").toLowerCase();

  const isExcluded = 
    idLower.includes("correo") || idLower.includes("email") ||
    idLower.includes("contrase") || idLower.includes("pass") ||
    idLower.includes("telefono") || idLower.includes("celular") ||
    idLower.includes("documento") || idLower.includes("num") ||
    idLower.includes("id") || idLower.includes("code") ||
    nameLower.includes("correo") || nameLower.includes("email") ||
    nameLower.includes("contrase") || nameLower.includes("pass") ||
    nameLower.includes("telefono") || nameLower.includes("celular") ||
    nameLower.includes("documento") || nameLower.includes("num") ||
    nameLower.includes("id") || nameLower.includes("code") ||
    tipoLower.includes("correo") || tipoLower.includes("password") ||
    tipoLower.includes("telefono") || tipoLower.includes("documento") ||
    tipoLower.includes("numerico");

  return !isExcluded;
};

// =====================================================
// EXPORTADOR DEL CONTROLADOR AUTOMÁTICO DE VALIDACIÓN 
// =====================================================

export const validadorAutomatico = {
  // .init(): Se utiliza para inicializar las restricciones en tiémpó de tecleé al cargar la página
  init: (formulario) => {
    // Escanea todo el formulario atrapando hijos "input" y "select"
    const inputs = formulario.querySelectorAll("input")
    const selects = formulario.querySelectorAll("select");
    const textArea = formulario.querySelectorAll("textArea");

    inputs.forEach(input => {
      // Auto-capitalizar al perder el foco
      if (fieldsToCapitalize(input)) {
        input.addEventListener("blur", () => {
          const val = input.value.trim();
          if (val) {
            input.value = capitalizarTexto(val);
          }
        });
      }

      // Extrae la etiqueta `<input data-tipo="nombre_tipo">`
      const tipo = input.dataset.tipo 
      // Chequea si existe una regla bautizada con ese nombre en nuestro Diccionario arriba `inputTipos`
      if (tipo in inputTipos){
        // Si detecta la regla, ata un evento para vetar que sigan teclando más alla de la regla `max` del dic.
        input.addEventListener("keydown", e => {
          if (inputTipos[tipo].max) keyboard_limite(e,inputTipos[tipo].max)
          if(inputTipos[tipo].keyboard) inputTipos[tipo].keyboard(e);
        })

        // Ata evento para borrar visualmente el error rojo automático cuando descliquean la caja (blur) asumiendo ya lo corrigieron
        input.addEventListener("blur", e => {
          limpiarError(input)
        })
      }
    })
    
    textArea.forEach(input => {
      // Extrae la etiqueta `<input data-tipo="nombre_tipo">`
      const tipo = input.dataset.tipo 
      // Chequea si existe una regla bautizada con ese nombre en nuestro Diccionario arriba `inputTipos`
      if (tipo in inputTipos){
        // Si detecta la regla, ata un evento para vetar que sigan teclando más alla de la regla `max` del dic.
        input.addEventListener("keydown", e => {
          if (inputTipos[tipo].max) keyboard_limite(e,inputTipos[tipo].max)
          if(inputTipos[tipo].keyboard) inputTipos[tipo].keyboard(e);
        })
        // Ata evento para borrar visualmente el error rojo automático cuando descliquean la caja (blur) asumiendo ya lo corrigieron
        input.addEventListener("blur", e => {
          limpiarError(input)
        })
      }
    })

    // Ata función de auto-limpieza térmica al menú select apenas cambie la opción.
    selects.forEach(select => {
          select.addEventListener("change", e => {
            limpiarError(select)
        })
    })
  },
  
  // .validarTodo(): Se usa por el controlador antes de hacer fetch para validar en masa todo el formulario tras presionar Submit.
  validarTodo: (formulario) => {

    const inputs = formulario.querySelectorAll("input");
    const selects = formulario.querySelectorAll("select");
    const textArea = formulario.querySelectorAll("textArea");

    // Pasada 1: Revisa todos los inputs de texto/numéricos 
    inputs.forEach(input => {
      if (fieldsToCapitalize(input)) {
        const val = input.value.trim();
        if (val) {
          input.value = capitalizarTexto(val);
        }
      }
      const tipo = input.dataset.tipo
      
      if (tipo in inputTipos){        
        // Si la regla dice que es optativo y el input lo es, realiza evaluación de puente "validar_siExiste"
        if (inputTipos[tipo].opcional){     
          validar_siExiste(input, Number(inputTipos[tipo].min))
          return // Salta la iteración en seco
        }
        
        let valido = true;
        // Si la regla posee ambos minino y máximo configurado en JSON, ejecuta la test combinada de tamaños
        if (inputTipos[tipo].min && inputTipos[tipo].max){
          valido = validar_minimoMaximo(input,inputTipos[tipo].min,inputTipos[tipo].max);
        }
        // Sino comprueba si solo pide mínimo y lanza esa prueba
        else if (inputTipos[tipo].min){
          valido = validar_minimo(input,Number(inputTipos[tipo].min));
        }
        // Sino prueba si solo pidió máximo a secas
        else if (inputTipos[tipo].max){
          valido = validar_maximo(input,Number(inputTipos[tipo].max));
        }
        // Independientemente de la longitud, si tiene atada una función de validación compleja (ej: `correo`), la evalúa
        if(valido && inputTipos[tipo].validacion) {
          inputTipos[tipo].validacion(input);
        }
      }
    })

    textArea.forEach(input => {
      const tipo = input.dataset.tipo

      if (tipo in inputTipos){        
        // Si la regla dice que es optativo y el input lo es, realiza evaluación de puente "validar_siExiste"
        if (inputTipos[tipo].opcional){     
          validar_siExiste(input, Number(inputTipos[tipo].min))
          return // Salta la iteración en seco
        }
        
        let valido = true;
        // Si la regla posee ambos minino y máximo configurado en JSON, ejecuta la test combinada de tamaños
        if (inputTipos[tipo].min && inputTipos[tipo].max){
          valido = validar_minimoMaximo(input,inputTipos[tipo].min,inputTipos[tipo].max);
        }
        // Sino comprueba si solo pide mínimo y lanza esa prueba
        else if (inputTipos[tipo].min){
          valido = validar_minimo(input,Number(inputTipos[tipo].min));
        }
        // Sino prueba si solo pidió máximo a secas
        else if (inputTipos[tipo].max){
          valido = validar_maximo(input,Number(inputTipos[tipo].max));
        }
        // Independientemente de la longitud, si tiene atada una función de validación compleja (ej: `correo`), la evalúa
        if(valido && inputTipos[tipo].validacion) {
          inputTipos[tipo].validacion(input);
        }
      }
    })

    // Pasada 2: Valida selects si quedó alguno atascado en predeterminado sin rellenar
    selects.forEach(select => {
      validar_select(select);
    })

    // IMPORTANTE:
    // Esta función funciona contando cuántos "tags visuales" .error inyectó sobre el DOM
    // El dom recoleta los span.error detectados. 
    const buscarError = document.querySelectorAll('.error');
    if (buscarError.length > 0) return false; // Si sobre el formulario dibujó un error (1 o más longitud), niega el submit
    else return true // De lo contrario autoriza guardado 
  }
}