import * as api from "../../helpers/api";

export const componenteHeader = () => {
    const indicador = document.querySelector(".header__indicador");
    const botonAtras = document.getElementById("botonBack");
    const botonHome = document.getElementById("botonHome");
    const botonNoti = document.getElementById("botonNotificaciones")
    const botonPerfil = document.getElementById("botonPerfil");
    const rolId = localStorage.getItem("role_id");
    const hash = location.hash.slice(2);

    // Función para actualizar el indicador de notificaciones
    const actualizarIndicadorNotificaciones = async () => {
        try {
            const response = await api.get("notificaciones/count");
            if (response.success) {
                const count = response.count;
                indicador.classList.remove('invisible');
                
                if (count === 0) {
                    indicador.classList.add('invisible');
                } else if (count >= 10) {
                    indicador.textContent = '9+';
                } else {
                    indicador.textContent = count;
                }
            }
        } catch (error) {
            console.error("Error al obtener conteo de notificaciones:", error);
            indicador.classList.add('invisible');
        }
    };

    // Cargar conteo de notificaciones al iniciar
    actualizarIndicadorNotificaciones();

    // botón HOME
    botonHome.addEventListener("click", () => {
        if (rolId == 1) location.href = `#/administrador`
        else if(rolId == 2) location.href = `#/supervisor`
        else if(rolId == 3)location.href = `#/voluntario`
    });

    // botón PERFIL - Ocultar para supervisor (ya tiene acceso en sidebar)
    if (rolId == 2 && botonPerfil) {
        botonPerfil.style.display = 'none';
    } else if (botonPerfil) {
        botonPerfil.addEventListener("click", () => {
            if (hash == 'usuarios/perfil') return
            location.hash = "#/usuarios/perfil";
        });
    }

    botonNoti.addEventListener("click", () => {
        if (hash == 'usuarios/notificaciones') return
        location.hash = "#/usuarios/notificaciones";
    });

};