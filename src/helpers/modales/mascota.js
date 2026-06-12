/**
 * Helper de Modales Complejos: Mascota (mascota.js)
 * Archivo encargado de gestionar los modales SweetAlert dedicados al perfil sanitario 
 * de una mascota. Permite visualizar su información base, así como crear, editar y eliminar 
 * registros de su esquema de "Vacunas".
 */
  import * as api from "../api";
  import * as alerta from "../alertas";

  // Muestra el resumen de la mascota seleccionada
  export const ver = async (id) => {
    // Busca los datos básicos de la mascota
    const datos = await api.get(`pets/${id}`);
    
    // Busca las vacunas registradas que pertenezcan a esa mascota
    const condiciones = await api.get(`petVaccines/pet/${id}`);

    let condicionVacunas = "";
    let contadorCondicionVacunas = 0;

    // Itera sobre el arreglo de vacunas devuelto por la API
    condiciones.forEach((condicion) => {
      // Si ya hay más de una, agrega una coma de separación, si es la primera la coloca sin coma
      contadorCondicionVacunas > 0
        ? (condicionVacunas += "," + condicion.name)
        : (condicionVacunas += condicion.name);
        
      contadorCondicionVacunas++;
      
      // Control de seguridad redundante
      contadorCondicionVacunas == 0 ? (condicionVacunas = "ninguna") : "";
    });

    // Si el arreglo viene vacío, indica visualmente que no hay vacunas
    if (condiciones.length == 0) {
      condicionVacunas = "ninguna";
    }

    // Estructura el HTML inyectando las propiedades de la mascota y el string de vacunas procesado
    const htmlModal = `
          <div class="modalVer modal">
              <div class="modalVer__dato">
                  <i class="ri-coupon-line"></i>
                  <div class="modalVer__titulo">Nombre</div>
                  <div class="modalVer__texto">${datos.name}</div>
              </div>
              <div class="modalVer__dato">
                  <i class="ri-dna-line"></i>
                  <div class="modalVer__titulo">Raza</div>
                  <div class="modalVer__texto">${datos.breed}</div>
              </div>
              <div class="modalVer__dato">
                  <i class="ri-cake-2-line"></i>
                  <div class="modalVer__titulo">Edad</div>
                  <div class="modalVer__texto">${datos.age}</div>
              </div>
              <div class="modalVer__dato">
                  <i class="ri-bell-line"></i>
                  <div class="modalVer__titulo">Especie</div>
                  <div class="modalVer__texto">${datos.species.name}</div>
              </div>
              <div class="modalVer__dato modalVer__dato--largo">
                  <i class="ri-syringe-line"></i>
                  <div class="modalVer__titulo">Vacunas</div>
                  <div class="modalVer__texto">${condicionVacunas}</div>
              </div>
          </div>`;
          
    // Despliega la alerta modal en modo lectura      
    alerta.Ver(htmlModal, false, false, null, null);
  };

  // Abre un formulario modal para registrar una vacuna nueva a esta mascota
  export const crearVacunas = async (mascotaId,recargarContainer) => {
      // Estructura UI del formulario de vacunas vacio
      const htmlModal = `
          <div class="explicacion modal">
              <p class="explicacion__titulo">Agregar Vacunas</p>
          </div>
          <div class="form">
              <div class="form__inputBox modal-50">
                  <i class="ri-syringe-fill"></i>
                  <input type="text" class="form__input form__nombre" placeholder="Nombre de la vacuna" autocomplete="off">
              </div>
              <div class="form__inputBox">
                  <i class="ri-calendar-fill"></i>
                  <input type="date" class="form__input form__fecha">
              </div>
          </div>`;

    // Lógica que se dispara al enviar el formulario modal
    const funcionModal = async () => {
      // Recoge información tecleada o seleccionada en la fecha
      const nombreVacuna = document.querySelector(".form__nombre").value;
      const fechaVacuna = document.querySelector(".form__fecha").value;

      // Ensambla el payload para el servidor (incluye el ID foráneo mascotaId)
      const datos = {
        name: nombreVacuna,
        date: fechaVacuna,
        pet_id: mascotaId,
      };
      
      try {
        // Manda crear la vacuna en base a la API
        const data = await api.post("petVaccines", datos);
        if (data.success) {
          // Todo correcto
          await alerta.alertaOK(data.message);
          await recargarContainer();
        } else {
          // Errores comunes (campo vacío, vacuna duplicada)
          alerta.alertaWarning(data.message, data.errors);
        }
      } catch (error) {
        alerta.alertaError(error.errors);
      }
    };
    
    // Inicia SweetAlert con opciones creativas
    alerta.Crear(htmlModal, funcionModal);
  };

  // Muestra una vacuna individual permitiendo su eventual edición o eliminación
  export const verEditarEliminar = async (id, mascotaId, recargarContainer, esSupervisor) => {
      // Trae los detalles de la vacuna
      const datos = await api.get(`petVaccines/${id}`);
      
      // Modal de vista simple detallado
      const htmlModal = `
              <div class="modalVer modal">
                  <div class="modalVer__dato">
                      <i class="ri-syringe-line modalVer__icono"></i>
                      <div class="modalVer__titulo">Nombre</div>
                      <div class="modalVer__texto">${datos.name}</div>
                  </div>

                  <div class="modalVer__dato">
                      <i class="ri-calendar-line modalVer__icono"></i>
                      <div class="modalVer__titulo">Fecha de Vacuna</div>
                      <div class="modalVer__texto">${datos.date}</div>
                  </div>
              </div>`;
              
      // ✏ CALLBACK EDITAR: Si se clickea el lápiz de editar vacuna
      const funcionModalEditar = async () => {
      
      // Necesitamos la data viva para inyectar los 'value' por defecto
      const info = await api.get(`petVaccines/${id}`);
      const htmlModal = `
        <div class="explicacion modal">
          <p class="explicacion__titulo">Editar Vacuna</p>
        </div>
        <div class="form">
          <div class="form__inputBox modal-50">
            <i class="ri-syringe-fill"></i>
            <input type="text" class="form__input form__nombre" placeholder="Nombre de la vacuna" autocomplete="off" value="${info.name}">
          </div>
          <div class="form__inputBox">
            <i class="ri-calendar-fill"></i>
            <input type="date" class="form__input form__fecha" value="${info.date}">
          </div>
        </div>`;
        
      // Lógica ejecutada tras confirmar la ventana de edición
      const funcionModal = async () => {
        // Obtiene valores nuevos
        const nombreVacuna = document.querySelector(".form__nombre").value;
        const fechaVacuna = document.querySelector(".form__fecha").value;

        // Construye payload
        const datos = {
          name: nombreVacuna,
          date: fechaVacuna,
        };
        
        try {
          // Invoca ruta API con verbo PATCH para modificar
          const data = await api.patch(`petVaccines/${id}`, datos);
          if (data.success) {
            await alerta.alertaOK(data.message);
            await recargarContainer();
          } else alerta.alertaWarning(data.message, data.errors);
        } catch (error) {
          alerta.alertaError(error.errors);
        }
      };
      
      // Crea el form flotante de edición
      alerta.Crear(htmlModal, funcionModal);
      };
      
      // 🗑 CALLBACK ELIMINAR: Si se clickea el bote de basura
      const funcionModalEliminar = async () => {
        // Lanzamos alerta que pide confirmación estricta
        const confirmacion = await alerta.alertaQuest(
          "¿Seguro que deseas eliminar esta vacuna de la mascota?",
        );
        // Si canceló, aborta ejecución
        if (!confirmacion.isConfirmed) return;
        
        // Emite DELETE
        const eliminado = await api.delet(`petVaccines/${id}`);
        // Notifica
        if (eliminado.success) {
          await alerta.alertaOK(eliminado.message);
          await recargarContainer();
        }
      };

      // Construye el modal inicial de solo vista con los callbacks activados (true)
      alerta.Ver(htmlModal, true, true, funcionModalEditar, funcionModalEliminar, esSupervisor);

  }