// src/config/modules.js

/**
 * Define los módulos o secciones principales de la aplicación para el frontend.
 * 'key': Identificador único interno (idealmente coincide con 'permissionKey' en la BD). Usado en el código.
 * 'name': Nombre legible para mostrar en la interfaz de usuario.
 */
export const APP_MODULES = [
    { key: 'dashboard', name: 'Dashboard' },
    { key: 'roles', name: 'Roles' },
    { key: 'usuarios', name: 'Usuarios' },
    { key: 'proveedores', name: 'Proveedores' },
    { key: 'insumo', name: 'Insumo' },
    { key: 'producto-insumo', name: 'Producto Insumo' },
    { key: 'orden-produccion', name: 'Orden de producción' },
    { key: 'Gestion de compra', name: 'Gestión de compras' },
    { key: 'reservas', name: 'Reservas' },
    { key: 'clientes', name: 'Clientes' },
    { key: 'servicios', name: 'Servicios' },
    { key: 'mano-de-obra', name: 'Mano de obra' },
];

/**
 * Define los tipos de privilegios estándar que se pueden asignar a los módulos.
 * 'key': Identificador único interno (idealmente coincide con 'privilegeKey' en la BD). Usado en el código.
 * 'name': Nombre legible para mostrar en la interfaz de usuario (cabeceras de tabla, etc.).
 */
export const STANDARD_PRIVILEGES = [
    { key: 'view', name: 'Ver' },          // Acceso de solo lectura
    { key: 'create', name: 'Crear' },      // Permiso para añadir nuevos registros
    { key: 'edit', name: 'Editar' },       // Permiso para modificar registros existentes
    { key: 'delete', name: 'Eliminar' },   // Permiso para borrar registros
    { key: 'status', name: 'Activar/Desactivar' } // Permiso para cambiar el estado (si aplica)
];
