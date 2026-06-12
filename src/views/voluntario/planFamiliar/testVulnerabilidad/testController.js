/**
 * Controlador: Evaluador Test de Vulnerabilidad (testController.js)
 * El corazón del módulo. Genera dinámicamente cuadros de preguntas
 * informales o formales (con botones SI/NO) pidiéndoselas al servidor.
 * Aprovecha la memoria temporal del navegador para llevar el conteo
 * de puntos ganados y perdidos en el mismo teléfono, sin depender
 * de una conexión lenta.
 * Al concluír, califica la encuesta y decide si el Plan Familiar se aprueba o se expulsa.
 */
import * as alerta from "../../../../helpers/alertas";
import * as api from "../../../../helpers/api";

export default async () => {
  // Clave o Identificación de la familia en progreso
  const id = location.hash.split("=")[1];
  const botonBack = document.getElementById("botonBack");

  // Contenedores responsables de dibujar las preguntas en la pantalla
  const paginado = document.querySelector(".paginado"); // Sección visual para ver los numeritos inferiores (1 2 3 4)
  const preguntas = document.querySelector(".preguntas"); // Zona en blanco central para que caigan las preguntas
  const siguiente = document.querySelector(".botonera__siguiente"); // Botón Inferior: 'Siguiente' / 'Evaluar'
  const atras = document.querySelector(".botonera__atras"); // Botón inferior para retroceder

  // Prevención de comportamiento desbocado si las conexiones están lentas
  if (window.procesoPeticion === undefined) {
    window.procesoPeticion = true;
  }
  window.procesoPeticion = true;

  //Se crea un objeto que almacena los puntajes, repuestas y cuenta aquellas cuya opcion marque "SI" = true de forma temporal ----------------------------------------- Nuevo
  const testRespuestas = {
    respuesta: {},
    puntaje: {},
    contador: 0,
  };

  // Lógica del Botón Volver (Flecha blanca superior)
  botonBack.onclick = async () => {
    if (window.procesoPeticion) return;
    const confirmacion = await alerta.alertaQuest(
      "¿Seguro que quieres volver?, perderás tu progreso",
    );
    if (confirmacion.isConfirmed) location.href = "#/voluntario/plan_familiar";
  };

  // Referencia interna sobre en que parte de la encuesta nos encontramos
  let paginaActual = 1;

  // Acción Silenciosa 1: Avisa al servidor e indaga cuántas preguntas existen.
  // (Si hay 20 preguntas y por pantalla caen 3, nos reporta que habrán 7 páginas).
  const paginas = await api.getPaginacion("vulnerableQuestions/paginate");
  const cantidad = paginas.paginate.last_page; // Retorna esa exactitud

  // Bucle automático encargado de dibujar los cuadros con números indicadores en la sección de abajo
  for (let i = 1; i <= cantidad; i++) {
    const p = document.createElement("p");
    p.textContent = i;
    p.classList.add("paginado__numero"); // Las decora según nuestras reglas
    p.dataset.page = i; // Les adhiere la responsabilidad silenciosa de informar cuál número son

    // Si coincide con la actual, marca visualmente esta pequeña gragea
    if (i === paginaActual) {
      p.classList.add("paginado__numero--activo");
    }

    paginado.appendChild(p); // Colocar este nuevo número creado en pantalla
  }

  // Bloque try-catch para evitar que una falla de red al precargar rompa la carga inicial del formulario
  try {
    // Realiza una petición GET al backend para recuperar respuestas que ya se hayan guardado anteriormente
    const respuestasGuardadas = await api.get(`vulnerableTest?family_plan_id=${id}`);
    // Valida que la respuesta sea exitosa y que el servidor haya devuelto datos válidos en el nodo data
    if (respuestasGuardadas && respuestasGuardadas.success && respuestasGuardadas.data) {
      // Itera por cada una de las respuestas recuperadas desde la base de datos
      respuestasGuardadas.data.forEach(resp => {
        // Define la clave asociativa que identifica el input radio en el frontend (ej. opcion-1)
        const name = `opcion-${resp.vulnerable_question_id}`;
        // Convierte el valor booleano de la respuesta a texto ("true"/"false") para marcar los controles html
        const valStr = resp.answer ? "true" : "false";
        // Asigna el valor al mapa de respuestas cargadas en memoria para inicializar el estado del test
        testRespuestas.respuesta[name] = valStr;
        
        // Verifica si la respuesta recuperada corresponde a una vulnerabilidad afirmada (SÍ)
        if (resp.answer) {
          // Si es SÍ, crea el marcador temporal de puntaje que se utiliza para el conteo interno
          testRespuestas.puntaje[`puntaje-${name}`] = true;
        }
      });
      // Inicializa el contador del objeto con la cantidad de vulnerabilidades iniciales marcadas como SÍ
      testRespuestas.contador = Object.keys(testRespuestas.puntaje).length;
    }
  } catch (err) {
    // Si la petición falla, reporta el error en la consola del desarrollador sin detener la aplicación
    console.error("Error al precargar respuestas:", err);
  }

  // Activa todo el motor que empieza a solicitarle ya mismo el texto exacto de dichas preguntas de la DB
  await cargarPagina();

  /**
   * Rutina Central: Dibuja las preguntas de Vulnerabilidad pertinentes
   * de esta sola página obteniéndolas del servidor.
   */
  async function cargarPagina() {
    window.procesoPeticion = true; // Bloquea clicks desesperados durante este suceso
    preguntas.innerHTML = ""; // Limpia el pizarrón actual para traer textos limpios

    // Solicita verdaderamente el texto explicativo de cada pregunta de ESTA etapa específica
    const pagina = await api.get(
      `vulnerableQuestions/paginate?page=${paginaActual}`,
    );

    // Truco visual para que la enumeración total tenga lógica.
    // Ej: Página 2 -> Empieza en la pregunta #4. Página 3 -> Pregunta #7.
    let cont = paginaActual === 1 ? 1 : (paginaActual - 1) * 3 + 1;

    // Insertar en la pantalla pregunta por pregunta usando un modelo repetitivo
    pagina.forEach((opcion) => {
      const contenedor = document.createElement("div");

      // Comprobador Crítico: Si la advertencia es "De sumo riesgo" o de "Precaución", inyecta un color Alarma de peligro (Usualmente fondo Naranja)
      contenedor.className = opcion.question_caution
        ? "preguntas__contenedor preguntas__contendor--precaucion"
        : "preguntas__contenedor";

      // Plantilla Estructural Ciega: Esconde elementos funcionales debajo de letreros llamativos.
      // ESTRATEGIA: La opción elegida anteriormente es deducida gracias a la Memoria, así al volver las cosas marcadas seguirán tal cual se dejaron.
      contenedor.innerHTML = `
        <p class="test__numero">${cont}</p>
        <p class="test__texto">${opcion.description}</p>
        <div class="test__opciones">
          <input type="radio" class="invisible" name="opcion-${opcion.id}" id="si-${opcion.id}" value="true"
            ${testRespuestas.respuesta[`opcion-${opcion.id}`] === "true" ? "checked" : ""}>
          <label class="test__opcion test__opcion--si" for="si-${opcion.id}">SI</label>

          <input type="radio" class="invisible" name="opcion-${opcion.id}" id="no-${opcion.id}" value="false"
            ${testRespuestas.respuesta[`opcion-${opcion.id}`] === "false" ? "checked" : ""}>
          <label class="test__opcion test__opcion--no" for="no-${opcion.id}">NO</label>
        </div>
      `;

      preguntas.appendChild(contenedor); // Lanzarlo dentro del contenedor visual masivo
      cont++; // Sube y repite pero con un número textual más grande
    });

    // Control Matemático para los botones laterales enormes
    atras.disabled = paginaActual === 1; // Apaga el botón de regresar evidentemente si recién comenzaste
    atras.dataset.page = paginaActual - 1;

    // Cambia el texto del botón al transicionar. Cuando falte poco para acabar, este mutará a gritar "Evaluar!" en vez de "Siguiente"
    siguiente.textContent = paginaActual === cantidad ? "Evaluar" : "Siguiente";
    siguiente.dataset.page =
      paginaActual === cantidad ? "fin" : paginaActual + 1; // Etiqueta oculta finalizadora de sesión

    window.procesoPeticion = false; // Devuelve el control del sistema de regreso
  }

  /**
   * Rutina para avanzar de golpe o por toques al resto de las páginas
   */
  function cambiarPagina(nuevaPagina) {
    if (nuevaPagina === paginaActual) return; // Si la oprime 2 veces nada pasa

    // Apaga estéticamente el brillo del tab pasado
    document
      .querySelector(`[data-page="${paginaActual}"]`)
      ?.classList.remove("paginado__numero--activo");

    paginaActual = Number(nuevaPagina); // Lo pasa a número real

    // Otorga el brillo especial de "lugar activo" sobre el númerito recientemente oprimido o activado.
    document
      .querySelector(`[data-page="${paginaActual}"]`)
      ?.classList.add("paginado__numero--activo");

    // Envía orden final llamando al pintor de cajas (Rutina Central anterior)
    cargarPagina();
  }

  // Detecta el toque o clic del paciente encima de cualquier bolita numérica (1, 2, 3...)
  paginado.addEventListener("click", (e) => {
    const page = e.target.dataset.page;
    if (page && !window.procesoPeticion) cambiarPagina(page);
  });

  // Vigila todo el toque maestro del bloque Inferior que abriga a los botones Previos y Siguientes de tamaño gigante
  document.querySelector(".botonera").addEventListener("click", async (e) => {
    // Escenario 1: Tocó el botón grande justo en el final (La etiqueta final le dicta a la nave terminar y evaluar)
    if (e.target.dataset.page === "fin" && !window.procesoPeticion) {
      await evaluarTest(); // Detonador supremo calificador
      return;
    }

    // Escenario 2: Rutina repetitiva y ordinaria, manda a saltar a la página que toca.
    if (e.target.dataset.page) {
      cambiarPagina(e.target.dataset.page);
    }
  });

  // Guardador Inteligente Maestro. Localiza cualquier click dado sobre una Pregunta (SI / NO)
  preguntas.addEventListener("change", (e) => {
    if (e.target.type !== "radio") return; // Impedimento para prevenir engaños del click.

    // Recordatorio instantáneo en Memoria RAM del teléfono/Móvil. Ejem ("Opcion pregunta 2, dijo: CIERTO/SI")
    // localStorage.setItem(e.target.name, e.target.value);

    testRespuestas.respuesta[e.target.name] = e.target.value; //Se integra la logica del objeto

    // Matemáticas dinámicas para dar puntaje interno.
    // Solo Otorga 1 Punto a su favor, SI NO posee peligrosidad extrema y al mismo tiempo SÍ contestó favorablemente con un TRUE / SI.
    if (
      !e.target.closest(".preguntas__contendor--precaucion") &&
      e.target.value == "true"
    ) {
      // localStorage.setItem(`puntaje-${e.target.name}`, e.target.value); // Crea token interno llamado Puntaje para rastreo

      testRespuestas.puntaje[`puntaje-${e.target.name}`] = true;
    }

    // Por ende Restador Definitivo: Si antes pulsó que SÍ, pero ahora recapacitó por un trágico NO... Destruimos el puntaje y se lo restamos al global
    else if (e.target.value == "false") {
      // localStorage.removeItem(`puntaje-${e.target.name}`);

      delete testRespuestas.puntaje[`puntaje-${e.target.name}`];
    }

    testRespuestas.contador = Object.keys(testRespuestas.puntaje).length; // El contador toma datos numericos del puntaje con .length, el puntaje solo tomara los datos existentes "= true", ya que los datos "= false" son eliminados
  });

  /**
   * Evaluador Final: Culmina recogiendo uno por uno cada Token respondido de la RAM y revisando los "SI/NO",
   * luego los comunica 1 por 1 al Servidor y emite una condena de Si esta o no Aptada para ingresar a la plataforma.
   */
  async function evaluarTest() {
    // Muestra una ventana de confirmación interactiva preguntando al voluntario si está seguro de enviar el test
    const preguntaContinuar = await alerta.alertaQuest(
      "¿Seguro que deseas enviar el test de vulnerabilidad?",
    );
    // Si el voluntario cancela o pulsa "NO", detiene la ejecución inmediatamente
    if (!preguntaContinuar.isConfirmed) return;

    // Deshabilita el botón de siguiente para evitar envíos múltiples si el voluntario hace doble clic
    siguiente.disabled = true;
    // Bloquea el flujo del controlador marcando que hay una petición de red en proceso
    window.procesoPeticion = true;

    // Realiza una petición GET al backend para consultar la lista completa y actualizada de preguntas
    const verPreguntas = await api.get("vulnerableQuestions");

    // Inicializa la variable para contar cuántas preguntas totales están habilitadas
    let total = 0;
    // Inicializa la variable para contar cuántas de esas preguntas han sido contestadas por el voluntario
    let respondidas = 0;
    // Inicializa la variable para calcular el puntaje final de vulnerabilidades (SÍ a preguntas de riesgo)
    let puntos = 0;

    // Recorre una a una todas las preguntas obtenidas del servidor
    verPreguntas.forEach((p) => {
      // Si la pregunta no está marcada como activa en el backend, la omite del proceso
      if (!p.is_active) {
        return;
      }
      // Incrementa el conteo de preguntas obligatorias que deben responderse
      total++;

      // Obtiene el estado de la respuesta guardada en memoria para esta pregunta (ej. "true", "false" o undefined)
      const respuesta = testRespuestas.respuesta[`opcion-${p.id}`];

      // Si la respuesta no es indefinida, significa que el voluntario seleccionó alguna de las dos opciones
      if (respuesta !== undefined) respondidas++;

      // Si la pregunta no es de precaución (es de riesgo) y el usuario respondió "SÍ" (true)
      if (!p.question_caution && respuesta === "true") {
        // Incrementa la puntuación de vulnerabilidad de la familia
        puntos++;
      }
    });

    // Validación del negocio: Si faltaron preguntas por responder o el total de puntos de riesgo es 0 (no aplica)
    if (respondidas < total || puntos === 0) {
      // Muestra una alerta de aviso indicando que el test está incompleto o no es apto para aplicar
      await alerta.alertaWarning(
        `No ha respondido todas o el test no aplica (${respondidas}/${total})`,
      );
      // Libera el bloqueo de peticiones de la interfaz
      window.procesoPeticion = false;
      // Vuelve a habilitar el botón de envío
      siguiente.disabled = false;
      // Cancela el envío del test al servidor
      return;
    }

    // Inicia la animación visual del spinner indicando que el guardado está en proceso
    alerta.alertaLoading();

    // Inicializa el arreglo que contendrá las respuestas que se enviarán juntas en un lote JSON
    const respuestasLote = [];
    // Recorre de nuevo las preguntas para recopilar sólo las respuestas de las preguntas activas
    verPreguntas.forEach((p) => {
      if (p.is_active) {
        // Inserta en el arreglo el objeto estructurado con el id de pregunta y su valor booleano
        respuestasLote.push({
          vulnerable_question_id: p.id,
          answer: testRespuestas.respuesta[`opcion-${p.id}`] === "true"
        });
      }
    });

    // Estructura el payload principal con el id del plan familiar y la lista de respuestas
    const payload = {
      family_plan_id: Number(id),
      answers: respuestasLote
    };

    try {
      // Envía el lote completo en una única petición HTTP POST a la ruta del backend
      const response = await api.post("vulnerableTest", payload);
      // Cierra la animación visual de carga al recibir respuesta del servidor
      alerta.alertaLoadingCerrar();

      // Si el servidor confirma que el guardado en base de datos y la clasificación fueron exitosos
      if (response.success) {
        // Muestra la alerta de éxito verde con el mensaje devuelto por el backend
        await alerta.alertaOK(response.message);
        // Redirige al voluntario a la vista de identificación (siguiente paso del flujo)
        location.href = `#/voluntario/plan_familiar/identificacion?id=${id}`;
      } else {
        // Muestra una alerta de advertencia si ocurrieron errores de negocio en el backend
        await alerta.alertaWarning(response.message, response.errors || "");
        // Libera la interfaz para permitir corregir e intentar de nuevo
        window.procesoPeticion = false;
        siguiente.disabled = false;
      }
    } catch (error) {
      // Cierra el spinner de carga si ocurrió una excepción de red
      alerta.alertaLoadingCerrar();
      // Muestra una alerta de error grave con el detalle de la falla de conexión
      await alerta.alertaError(error.errors || "Error al conectar con el servidor.");
      // Libera la interfaz para permitir reintentos
      window.procesoPeticion = false;
      siguiente.disabled = false;
    }
  }
};
