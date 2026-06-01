/**
 * Controlador: Perfil de Usuario (perfilController.js - Refactorizado Seguro)
 * Capa: SPA Frontend
 * Responsabilidad: Gestionar los datos del usuario basándose estrictamente en la HttpSession de Java.
 */
import * as alerta from "../../../helpers/alertas";
import * as api from "../../../helpers/api";

export default async () => {
    // Referencias al DOM (Campos de Muestra)
    const nombres = document.getElementById("nombres");
    const apellidos = document.getElementById("apellidos");
    const tipoDocumento = document.getElementById("tipoDocumento");
    const numeroDocumento = document.getElementById("numeroDocumento");
    const fechaNacimiento = document.getElementById("fechaNacimiento");
    const genero = document.getElementById("genero");
    const seccional = document.getElementById("seccional");
    const organizacion = document.getElementById("organizacion");

    const telefono = document.getElementById("telefono");
    const correo = document.getElementById("correo");
    const contrasena = document.getElementById("contrasena");

    const botonCerrarSesion = document.getElementById("botonCerrarSesion");
    const botonBack = document.getElementById("botonBack");
    if (botonBack) {
        botonBack.onclick = () => { history.back(); };
    }

    // Nodos de control Teléfono
    const botonEditarTelefono = document.getElementById('botonEditarTelefono');
    const accionesTelefono = document.getElementById('accionesTelefono');
    const passwordTelefono = document.getElementById('passwordTelefono');
    const botonCancelarTelefono = document.getElementById('botonCancelarTelefono');
    const botonGuardarTelefono = document.getElementById('botonGuardarTelefono');

    // Nodos de control Correo
    const botonEditarCorreo = document.getElementById('botonEditarCorreo');
    const accionesCorreo = document.getElementById('accionesCorreo');
    const passwordCorreo = document.getElementById('passwordCorreo');
    const botonCancelarCorreo = document.getElementById('botonCancelarCorreo');
    const botonGuardarCorreo = document.getElementById('botonGuardarCorreo');

    // Nodos de control Contraseña
    const botonEditarPassword = document.getElementById('botonEditarPassword');
    const accionesPassword = document.getElementById('accionesPassword');
    const passwordOriginal = document.getElementById('passwordOriginal');
    const passwordNueva = document.getElementById('passwordNueva');
    const passwordNuevaRepeticion = document.getElementById('passwordNuevaRepeticion');
    const botonCancelarPassword = document.getElementById('botonCancelarPassword');
    const botonGuardarPassword = document.getElementById('botonGuardarPassword');

    // =========================================================================
    // 📡 CARGA ASÍNCRONA DE DATOS DESDE LA SESIÓN SEGURA DE JAVA
    // =========================================================================
    // Consumimos directamente la sesión del backend. Ya no leemos localStorage.getItem("id")
    const datosPerfil = await api.get("users/profile");

    if (!datosPerfil) {
        // Si el token/cookie de sesión venció, api.js disparará la redirección automática
        return;
    }

    // Función para capitalizar nombres propios y catálogos (ej: "bucaramanga" -> "Bucaramanga")
    const capitalizar = (texto) => {
        if (!texto) return "";
        return texto
            .toLowerCase()
            .split(" ")
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
            .join(" ");
    };

    // Inyectar datos físicos en las cajas de texto del HTML
    nombres.value = capitalizar(datosPerfil.names || "");
    apellidos.value = capitalizar(datosPerfil.last_names || "");
    tipoDocumento.value = capitalizar(datosPerfil.document_type || "");
    numeroDocumento.value = datosPerfil.document_number || "";
    fechaNacimiento.value = datosPerfil.birth_date || "";
    genero.value = capitalizar(datosPerfil.gender || "");
    seccional.value = capitalizar(datosPerfil.sectional || "");
    organizacion.value = capitalizar(datosPerfil.organization || "");
    telefono.value = datosPerfil.phone || "";
    correo.value = datosPerfil.email || "";

    // Renderizar Header dinámico de la tarjeta Banner
    const iniciales = document.getElementById('iniciales');
    const nombreCompleto = document.getElementById('nombreCompleto');
    const rangoDefensa = document.getElementById('rangoDefensa');

    if (iniciales) iniciales.textContent = (nombres.value[0] || "") + (apellidos.value[0] || "");
    if (nombreCompleto) nombreCompleto.textContent = `${nombres.value} ${apellidos.value}`;
    if (rangoDefensa) rangoDefensa.textContent = `${seccional.value} • ${organizacion.value}`;

    // =========================================================================
    // 🔐 LOGOUT SEGURO
    // =========================================================================
    botonCerrarSesion.addEventListener("click", async () => {
        const pregunta = await alerta.alertaQuest("¿Seguro que quieres cerrar sesión?");
        if (pregunta.isConfirmed) {
            await api.post("logout");
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "#/login";
        }
    });

    // =========================================================================
    // 📱 INTERACCIÓN: MODIFICAR TELÉFONO
    // =========================================================================
    let telefonoGuardadoMemoria = telefono.value;
    botonEditarTelefono.addEventListener("click", () => {
        telefonoGuardadoMemoria = telefono.value;
        telefono.disabled = false;
        accionesTelefono.classList.remove('invisible');
        passwordTelefono.parentElement.classList.remove('invisible');
    });

    botonCancelarTelefono.addEventListener("click", () => {
        accionesTelefono.classList.add('invisible');
        passwordTelefono.parentElement.classList.add('invisible');
        passwordTelefono.value = "";
        telefono.value = telefonoGuardadoMemoria;
        telefono.disabled = true;
    });

    botonGuardarTelefono.addEventListener("click", async () => {
        if (!telefono.value.trim() || !passwordTelefono.value.trim()) {
            await alerta.alertaWarning("Datos faltantes", "Debe ingresar el nuevo teléfono y su contraseña de confirmación.");
            return;
        }

        const res = await api.put("users/profile/phone", {
            phone: telefono.value.trim(),
            password: passwordTelefono.value.trim()
        });

        if (res && res.success) {
            await alerta.alertaOK(res.message || 'Teléfono guardado exitosamente');
            accionesTelefono.classList.add('invisible');
            passwordTelefono.parentElement.classList.add('invisible');
            passwordTelefono.value = "";
            telefono.disabled = true;
        } else {
            await alerta.alertaError("Error", (res && res.message) || "No se pudo actualizar el teléfono.");
        }
    });

    // =========================================================================
    // 📧 INTERACCIÓN: MODIFICAR CORREO
    // =========================================================================
    let correoGuardadoMemoria = correo.value;
    botonEditarCorreo.addEventListener("click", () => {
        correoGuardadoMemoria = correo.value;
        correo.disabled = false;
        accionesCorreo.classList.remove('invisible');
        passwordCorreo.parentElement.classList.remove('invisible');
    });

    botonCancelarCorreo.addEventListener("click", () => {
        accionesCorreo.classList.add('invisible');
        passwordCorreo.parentElement.classList.add('invisible');
        passwordCorreo.value = "";
        correo.value = correoGuardadoMemoria;
        correo.disabled = true;
    });

    botonGuardarCorreo.addEventListener("click", async () => {
        if (!correo.value.trim() || !passwordCorreo.value.trim()) {
            await alerta.alertaWarning("Datos faltantes", "Debe ingresar el nuevo correo y su contraseña de confirmación.");
            return;
        }

        const res = await api.put("users/profile/email", {
            email: correo.value.trim(),
            password: passwordCorreo.value.trim()
        });

        if (res && res.success) {
            await alerta.alertaOK(res.message || 'Correo guardado exitosamente');
            accionesCorreo.classList.add('invisible');
            passwordCorreo.parentElement.classList.add('invisible');
            passwordCorreo.value = "";
            correo.disabled = true;
        } else {
            await alerta.alertaError("Error", (res && res.message) || "No se pudo actualizar el correo.");
        }
    });

    // =========================================================================
    // 🔑 INTERACCIÓN: MODIFICAR CONTRASEÑA
    // =========================================================================
    botonEditarPassword.addEventListener("click", () => {
        contrasena.parentElement.classList.add('invisible');
        passwordOriginal.parentElement.classList.remove('invisible');
        passwordNueva.parentElement.classList.remove('invisible');
        passwordNuevaRepeticion.parentElement.classList.remove('invisible');
        accionesPassword.classList.remove('invisible');
    });

    botonCancelarPassword.addEventListener("click", () => {
        contrasena.parentElement.classList.remove('invisible');
        passwordOriginal.parentElement.classList.add('invisible');
        passwordNueva.parentElement.classList.add('invisible');
        passwordNuevaRepeticion.parentElement.classList.add('invisible');
        accionesPassword.classList.add('invisible');
        passwordOriginal.value = "";
        passwordNueva.value = "";
        passwordNuevaRepeticion.value = "";
    });

    botonGuardarPassword.addEventListener("click", async () => {
        if (!passwordOriginal.value.trim() || !passwordNueva.value.trim() || !passwordNuevaRepeticion.value.trim()) {
            await alerta.alertaWarning("Campos vacíos", "Por favor complete todos los campos de contraseña.");
            return;
        }

        if (passwordNueva.value !== passwordNuevaRepeticion.value) {
            await alerta.alertaWarning("Inconsistencia", "La nueva contraseña y su repetición no coinciden.");
            return;
        }

        const res = await api.put("users/profile/password", {
            password_actual: passwordOriginal.value.trim(),
            password_nueva: passwordNueva.value.trim()
        });

        if (res && res.success) {
            await alerta.alertaOK(res.message || 'Contraseña guardada exitosamente');
            contrasena.parentElement.classList.remove('invisible');
            passwordOriginal.parentElement.classList.add('invisible');
            passwordNueva.parentElement.classList.add('invisible');
            passwordNuevaRepeticion.parentElement.classList.add('invisible');
            accionesPassword.classList.add('invisible');
            passwordOriginal.value = "";
            passwordNueva.value = "";
            passwordNuevaRepeticion.value = "";
        } else {
            await alerta.alertaError("Error", (res && res.message) || "Contraseña actual incorrecta.");
        }
    });
};