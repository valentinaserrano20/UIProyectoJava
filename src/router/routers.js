/**
 * Módulo de Configuración de Rutas (routers.js)
 * Define el diccionario principal de rutas accesibles en la aplicación.
 * Asocia cada segmento de URL con su respectiva vista HTML, su controlador 
 * JavaScript y sus permisos de acceso (Roles/Privilegios).
 */

// ==========================================
// IMPORTACIÓN DE CONTROLADORES
// ==========================================

// Importa controladores del módulo de Autenticación (Login, Registro, Recuperar Contraseña)
import * as auth from "../views/auth/index.js"

// Importa controladores de los paneles principales (Dashboards) según el rol
import VoluntarioHomeController from "../views/voluntario/home/homeController.js";
import AdministradorHomeController from "../views/administrador/home/homeController.js"
import SupervisorHomeController from "../views/supervisor/home/homeController.js"

// Importa los sub-módulos pertenecientes al flujo del "Plan Familiar" (Rol Voluntario)
import * as planFamiliar from "../views/voluntario/planFamiliar/index.js";
import * as GeoreController from "../views/voluntario/georeferenciacion/index.js";
import * as verPlan from "../views/voluntario/verPlanFamiliar/index.js";
import * as planDatos from "../views/voluntario/planDatos/index.js";
import * as Planintegrante from "../views/voluntario/planIntegrante/index.js";
import * as planMascota from "../views/voluntario/planMascota/index.js";
import * as planRiesgo from "../views/voluntario/planRiesgo/index.js";
import * as planRecurso from "../views/voluntario/planRecurso/index.js";
import * as PlanEntorno from "../views/voluntario/planEntorno/index.js";
import * as PlanGrafico from "../views/voluntario/planGrafico/index.js";
import * as planAccion from "../views/voluntario/planAccion/index.js"

// Importa módulos administrativos y de supervisión de Usuarios y Planes
import * as SupervisorUsuarios from "../views/supervisor/usuarios/index.js"
import * as supervisorPlanFamiliar from "../views/supervisor/PlanFamiliar/index.js"
import * as datosMaestros from "../views/administrador/datosMaestros/index.js"
import * as AdministradorUsuarios from "../views/administrador/usuarios/index.js"
import * as usuario from "../views/usuario/index.js"

// Configuraciones predefinidas de permisos para cada ruta
const publicRoute = { private: false, permissions: [] };

// =========================================================
// CRÍTICO FIX #3 — Claves de permisos desincronizadas
// =========================================================
// PROBLEMA: Las claves cortas ('voluntario', 'supervisor', 'admin') nunca coincidían
// con los valores que LoginServlet guarda en localStorage bajo el campo 'permissions'.
//
// El backend (LoginServlet.java) escribe exactamente:
//   Rol 1 → "home-frontend.voluntario"
//   Rol 2 → "home-frontend.supervisor,home-frontend.administrador"
//
// La función isAuthorize() en auth.js compara con split(',') y busca coincidencia exacta.
// Con las claves anteriores ('voluntario' vs 'home-frontend.voluntario') → nunca coincidían
// → tienePermisos() devolvía false para todos los usuarios autenticados
// → ningún usuario podía acceder a ninguna ruta privada tras el login.
//
// SOLUCIÓN: Alinear las claves con los strings exactos que produce el backend.
const voluntarioRoute = { private: true, permissions: ['home-frontend.voluntario'] };
const supervisorRoute = { private: true, permissions: ['home-frontend.supervisor'] };
// Rol 2 tiene acceso tanto a /supervisor como a /administrador según LoginServlet
const adminRoute      = { private: true, permissions: ['home-frontend.administrador'] };

// =========================================================
// RUTAS COMPARTIDAS DEL PLAN FAMILIAR
// =========================================================
// Estas rutas son idénticas para voluntario y supervisor.
// Solo difieren en los permisos de acceso.
// Se definen aquí una sola vez para evitar duplicación.

const rutasPlanFamiliarBase = {
  // FAMILIA MENU: Se presentan en forma de listado las opciones de edicion del plan familiar
  familia: {
    path: `voluntario/verPlanFamiliar/menu/index.html`,
    controlador: verPlan.MenuController,
  },

  // 1. DATOS
  datos: {
    path: `voluntario/planDatos/editar/index.html`,
    controlador: planDatos.EditarController,
  },

  // 2. INTEGRANTES
  integrantes: {
    "": {
      path: `voluntario/planIntegrante/index.html`,
      controlador: Planintegrante.verPlanIntegrantes,
    },
    crear: {
      path: `voluntario/planIntegrante/crear/index.html`,
      controlador: Planintegrante.crearController,
    },
    editar: {
      path: `voluntario/planIntegrante/editar/index.html`,
      controlador: Planintegrante.editarController,
    }
  },

  // 3. Mascotas y animales
  mascotas: {
    "": {
      path: `voluntario/planMascota/index.html`,
      controlador: planMascota.verPlanMascota,
    },
    crear: {
      path: `voluntario/planMascota/crear/index.html`,
      controlador: planMascota.crearController,
    },
    editar: {
      path: `voluntario/planMascota/editar/index.html`,
      controlador: planMascota.editarController,
    }
  },

  // 4. Factores de Riesgo
  factores_de_riesgo: {
    "": {
      path: `voluntario/planRiesgo/index.html`,
      controlador: planRiesgo.verPlanRiesgo,
    },
    crear: {
      path: `voluntario/planRiesgo/crear/index.html`,
      controlador: planRiesgo.crearController,
    },
    editar: {
      path: `voluntario/planRiesgo/editar/index.html`,
      controlador: planRiesgo.editarController,
    }
  },

  // 5. Recursos Disponibles
  recursos: {
    "": {
      path: `voluntario/planRecurso/index.html`,
      controlador: planRecurso.verController,
    },
    crear: {
      path: `voluntario/planRecurso/crear/index.html`,
      controlador: planRecurso.crearController,
    },
    editar: {
      path: `voluntario/planRecurso/editar/index.html`,
      controlador: planRecurso.editarController,
    }
  },

  grafico_del_entorno: {
    path: `voluntario/planEntorno/editar/index.html`,
    controlador: PlanEntorno.EditarController,
  },

  georeferenciacion: {
    path: `voluntario/georeferenciacion/index.html`,
    controlador: GeoreController.GeoreController,
  },

  grafico_vivienda: {
    "": {
      path: `voluntario/planGrafico/index.html`,
      controlador: PlanGrafico.verController,
    },
    crear: {
      path: `voluntario/planGrafico/crear/index.html`,
      controlador: PlanGrafico.crearController,
    },
    editar: {
      path: `voluntario/planGrafico/editar/index.html`,
      controlador: PlanGrafico.editarController,
    }
  },

  plan_de_accion: {
    antes: {
      path: `voluntario/planAccion/index.html`,
      controlador: planAccion.antes,
    },
    durante: {
      path: `voluntario/planAccion/index.html`,
      controlador: planAccion.durante,
    },
    despues: {
      path: `voluntario/planAccion/index.html`,
      controlador: planAccion.despues,
    }
  }
};

// Helper para aplicar configuración de permisos a las rutas compartidas
const aplicarConfiguracion = (rutas, config) => {
  const resultado = {};
  
  for (const key in rutas) {
    if (typeof rutas[key] === 'object' && !rutas[key].path && !rutas[key].controlador) {
      // Es un objeto anidado (ej: integrantes con "", crear, editar)
      resultado[key] = aplicarConfiguracion(rutas[key], config);
    } else {
      // Es una ruta terminal
      resultado[key] = {
        ...rutas[key],
        config: { ...config }
      };
    }
  }
  
  return resultado;
};

// Rutas compartidas con configuración para cada rol
const rutasPlanFamiliarVoluntario = aplicarConfiguracion(rutasPlanFamiliarBase, voluntarioRoute);
const rutasPlanFamiliarSupervisor = aplicarConfiguracion(rutasPlanFamiliarBase, supervisorRoute);
// =========================================================


export const routes = {
  "": {
    path: `auth/login/index.html`,
    controlador: auth.loginController,
    config: publicRoute,
  },
  "login": {
    path: `auth/login/index.html`,
    controlador: auth.loginController,
    config: publicRoute
  },
  "register": {
    path: `auth/register/index.html`,
    controlador: auth.registerController,
    config: publicRoute,
  },
  "forgotPassword": {
    path: `auth/forgotPassword/index.html`,
    controlador: auth.forgotPasswordController,
    config: publicRoute
  },
  "verifyCode": {
    path: `auth/verifyCode/index.html`,
    controlador: auth.verifyCodeController,
    config: publicRoute
  },
  "changePassword": {
    path: `auth/changePassword/index.html`,
    controlador: auth.changePasswordController,
    config: publicRoute
  },
  "usuarios": {
    "perfil": {
      path: `usuario/perfil/index.html`,
      controlador: usuario.perfilController,
      config: publicRoute
    },
    "notificaciones": {
      path: `usuario/notificaciones/index.html`,
      controlador: usuario.notificacionesController,
      config: { private: true, permissions: [] },
    },
  },

  // ================= VOLUNTARIO =================

  voluntario: {

    '': {
      path: `voluntario/home/index.html`,
      controlador: VoluntarioHomeController,
      config: { ...voluntarioRoute, permissions: ["home-frontend.voluntario"] },
    },

    plan_familiar: {
      // Rutas exclusivas de voluntario
      crear: {
        path: `voluntario/planFamiliar/crear/index.html`,
        controlador: planFamiliar.CrearController,
        config: { ...voluntarioRoute, permissions: ["home-frontend.voluntario"] },
      },

      "": {
        path: `voluntario/verPlanFamiliar/index.html`,
        controlador: verPlan.VerPlanFamiliar,
        config: { ...voluntarioRoute, permissions: ["home-frontend.voluntario"] },
      },

      testVunerabilidad: {
        path: `voluntario/planFamiliar/testVulnerabilidad/index.html`,
        controlador: planFamiliar.TestController,
        config: { ...voluntarioRoute, permissions: ["home-frontend.voluntario"] },
      },

      identificacion: {
        "": {
          path: `voluntario/planFamiliar/identificacion/index.html`,
          controlador: planFamiliar.IdentiController,
          config: { ...voluntarioRoute, permissions: ["home-frontend.voluntario"] },
        },
      },

      // Rutas compartidas con supervisor
      ...rutasPlanFamiliarVoluntario
    }

  },


  // ================= SUPERVISOR =================

  supervisor: {
    "": {
      path: `supervisor/home/index.html`,
      controlador: SupervisorHomeController,
      config: { ...supervisorRoute, permissions: ["home-frontend.supervisor"] },
    },

    usuarios: {

      peticiones: {
        path: `supervisor/usuarios/peticiones/index.html`,
        controlador: SupervisorUsuarios.PeticionesController,
        config: { ...supervisorRoute, permissions: ["home-frontend.supervisor"] },
      },

      gestion: {
        path: `supervisor/usuarios/gestion/index.html`,
        controlador: SupervisorUsuarios.GestionController,
        config: { ...supervisorRoute, permissions: ["home-frontend.supervisor"] },
      },

    },

    plan_familiar: {
      // Rutas exclusivas de supervisor
      "": {
        path: `supervisor/PlanFamiliar/Listado/index.html`,
        controlador: supervisorPlanFamiliar.ListadoPlanController,
        config: { ...supervisorRoute, permissions: ["home-frontend.supervisor"] },
      },

      estadistica: {
        path: `supervisor/PlanFamiliar/Estadistica/index.html`,
        controlador: supervisorPlanFamiliar.EstadisticaController,
        config: { ...supervisorRoute, permissions: ["home-frontend.supervisor"] },
      },

      revision: {
        path: `supervisor/PlanFamiliar/RevisionPlan/index.html`,
        controlador: supervisorPlanFamiliar.RevisionPlanController,
        config: { ...supervisorRoute, permissions: ["home-frontend.supervisor"] },
      },

      // Rutas compartidas con voluntario
      ...rutasPlanFamiliarSupervisor
    }
  },


  // ================= ADMIN =================
  administrador: {

    "": {
      path: `administrador/home/index.html`,
      controlador: AdministradorHomeController,
      config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
    },

    datos_maestros: {

      "": {
        path: `administrador/datosMaestros/index.html`,
        controlador: datosMaestros.verController,
        config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
      },

      seccionales: {
        "": {
          path: `administrador/datosMaestros/seccionales/index.html`,
          controlador: datosMaestros.seccionalesController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/seccionales/historial/index.html`,
          controlador: datosMaestros.historialSeccional,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      organizaciones: {
        "": {
          path: `administrador/datosMaestros/organizaciones/index.html`,
          controlador: datosMaestros.organizacionesController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/organizaciones/historial/index.html`,
          controlador: datosMaestros.historialOrganizacion,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      tipos_documento: {
        "": {
          path: `administrador/datosMaestros/tiposDocumento/index.html`,
          controlador: datosMaestros.tiposDocumentoController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/tiposDocumento/historial/index.html`,
          controlador: datosMaestros.historialDocumentos,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      calidades_vivienda: {
        "": {
          path: `administrador/datosMaestros/calidadesVivienda/index.html`,
          controlador: datosMaestros.calidadesViviendaController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/calidadesVivienda/historial/index.html`,
          controlador: datosMaestros.historialVivienda,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      sectores: {
        "": {
          path: `administrador/datosMaestros/sectores/index.html`,
          controlador: datosMaestros.sectoresController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/sectores/historial/index.html`,
          controlador: datosMaestros.historialSectores,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      preguntas_vulnerabilidad: {
        "": {
          path: `administrador/datosMaestros/preguntasVulnerabilidad/index.html`,
          controlador: datosMaestros.preguntasVulnerabilidadController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/preguntasVulnerabilidad/historial/index.html`,
          controlador: datosMaestros.historialPreguntas,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      nacionalidades: {
        "": {
          path: `administrador/datosMaestros/nacionalidades/index.html`,
          controlador: datosMaestros.nacionalidadesController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/nacionalidades/historial/index.html`,
          controlador: datosMaestros.historialNacionalidades,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      tipos_amenaza: {
        "": {
          path: `administrador/datosMaestros/tiposAmenaza/index.html`,
          controlador: datosMaestros.tiposAmenazaController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/tiposAmenaza/historial/index.html`,
          controlador: datosMaestros.historialAmenaza,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      especies: {
        "": {
          path: `administrador/datosMaestros/especies/index.html`,
          controlador: datosMaestros.especiesController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/especies/historial/index.html`,
          controlador: datosMaestros.historialEspecies,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      recursos: {
        "": {
          path: `administrador/datosMaestros/recursos/index.html`,
          controlador: datosMaestros.recursosController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/recursos/historial/index.html`,
          controlador: datosMaestros.historialRecursos,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      vulnerabilidades: {
        "": {
          path: `administrador/datosMaestros/vulnerabilidades/index.html`,
          controlador: datosMaestros.vulnerabilidadesController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/vulnerabilidades/historial/index.html`,
          controlador: datosMaestros.historialVulnerabilidades,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }
      },

      departamentos: {
        "": {
          path: `administrador/datosMaestros/departamentos/index.html`,
          controlador: datosMaestros.departamentoController,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        },
        historial: {
          path: `administrador/datosMaestros/departamentos/historial/index.html`,
          controlador: datosMaestros.historialDepartamento,
          config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
        }

      },

    },

    usuarios: {

      peticiones: {
        path: `administrador/usuarios/peticiones/index.html`,
        controlador: AdministradorUsuarios.PeticionesController,
        config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
      },

      gestion: {
        path: `administrador/usuarios/gestion/index.html`,
        controlador: AdministradorUsuarios.GestionController,
        config: { ...adminRoute, permissions: ["home-frontend.administrador"] },
      }
    }
  }

};