// funcion usada para validar la seguridad de las rutas

export function isAuth() {

    if(localStorage.getItem('id')) return true;

    return false;

}

// MODIFICADO: Permitir rol 2 (Supervisor_Administrador) como administrador en el frontend de forma segura
export function isAdmin() {

    const rolesPermitidos = [2];
    
    if(rolesPermitidos.includes(parseInt(localStorage.getItem('role_id')))) return true;

    return false;
}

// MODIFICADO: Validación defensiva contra valores nulos de permisos (previene crashes si no hay sesión activa)
export function isAuthorize(permissionEntry) {

    const permissionsStr = localStorage.getItem('permissions');
    if (!permissionsStr) return false;
    
    const permissions = permissionsStr.split(',');
    return permissions.some(permission => permission == permissionEntry);
    
}