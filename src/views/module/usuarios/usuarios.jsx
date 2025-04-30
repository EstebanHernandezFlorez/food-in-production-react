import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; // Asegúrate que la ruta es correcta
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, FormFeedback
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Imports ---
// IMPORTANTE: Asegúrate que estos servicios envían el TOKEN de autenticación
import userService from '../../services/usuarioService'; // Asegúrate que la ruta es correcta y envía token
import roleService from '../../services/roleServices'; // Asegúrate que la ruta es correcta y envía token

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination'; // Asegúrate que la ruta es correcta

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
             <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : (confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? <><Spinner size="sm" className="me-1"/> Procesando...</> : confirmText}
            </Button>
        </ModalFooter>
    </Modal>
);

// --- Constants ---
const INITIAL_FORM_STATE = {
    idUsers: "", document_type: "", document: "", cellphone: "", full_name: "",
    email: "", idRole: "", password: "", confirmPassword: "", status: true, // Inicializa status como boolean true
};
const INITIAL_FORM_ERRORS = {
    document_type: false, document: false, cellphone: false, full_name: false,
    email: false, idRole: false, password: '', confirmPassword: '', general: ''
};
const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null,
};
const TIPOS_DOCUMENTOS = [
    { value: "CC", label: "Cédula de Ciudadanía" }, { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" }, { value: "PEP", label: "Permiso Especial de Permanencia" },
];
const ITEMS_PER_PAGE = 7;

// --- Validation Helper ---
const validatePassword = (password) => {
    if (!password) return "La contraseña es obligatoria.";
    // **CORRECCIÓN: La regla es EXACTAMENTE 10 caracteres**
    if (password.length !== 10) return "Debe tener exactamente 10 caracteres.";
    if (!/(?=.*[A-Z])/.test(password)) return "Debe contener al menos una mayúscula.";
    if (!/(?=.*[a-z])/.test(password)) return "Debe contener al menos una minúscula.";
    if (!/(?=.*\d)/.test(password)) return "Debe contener al menos un número.";
    if (!/(?=.*[@$!%*?&])/.test(password)) return "Debe contener al menos un carácter especial (@$!%*?&).";
    return ''; // Sin errores
};

// --- Main Component ---
const Usuario = () => {
    // --- State ---
    const [data, setData] = useState([]);
    const [rolesList, setRolesList] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // --- Refs ---
    const confirmActionRef = useRef(null);

    // --- Fetch Roles and Initial Users ---
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            console.log("[INITIAL LOAD] Starting...");
            setIsLoading(true);
            let fetchedRolesData = [];
            let fetchedUsersData = [];
            try {
                console.log("[INITIAL LOAD] Fetching roles...");
                const rolesResponse = await roleService.getAllRoles(); // Asume envío de token si es necesario
                console.log("[INITIAL LOAD] Raw Roles Response Data:", rolesResponse);
                // Intenta extraer el array de roles de diferentes posibles estructuras de respuesta
                if (Array.isArray(rolesResponse)) { fetchedRolesData = rolesResponse; }
                else if (rolesResponse && Array.isArray(rolesResponse.data)) { fetchedRolesData = rolesResponse.data; }
                else if (rolesResponse && Array.isArray(rolesResponse.roles)) { fetchedRolesData = rolesResponse.roles; }
                else { console.warn("[INITIAL LOAD] Could not find roles array"); fetchedRolesData = []; }

                if (isMounted) { setRolesList(fetchedRolesData); console.log("[INITIAL LOAD] Roles state set:", fetchedRolesData); }
                else { return; } // Si se desmontó, salir

                console.log("[INITIAL LOAD] Fetching users...");
                const usersResponse = await userService.getAllUsers(); // Asume envío de token si es necesario
                console.log("[INITIAL LOAD] Raw Users Response Data:", usersResponse);
                // Intenta extraer el array de usuarios
                if (Array.isArray(usersResponse)) { fetchedUsersData = usersResponse; }
                else if (usersResponse && Array.isArray(usersResponse.data)) { fetchedUsersData = usersResponse.data; }
                else { console.warn("[INITIAL LOAD] Could not find users array"); fetchedUsersData = []; }

                if (isMounted) {
                    // Asegura usar los roles recién cargados o los que ya estaban si la carga falló pero antes sí funcionó
                    const currentRoles = fetchedRolesData.length > 0 ? fetchedRolesData : rolesList;
                    // Mapea usuarios para añadir roleName
                    const usersWithRoleNames = fetchedUsersData.map(user => {
                        const role = currentRoles.find(r => r.idRole === user.idRole);
                        return { ...user, roleName: role ? role.roleName : (user.idRole ? `Rol ID: ${user.idRole}` : 'Desconocido') };
                    });
                    setData(usersWithRoleNames);
                    setInitialLoadComplete(true); // Marca que la carga inicial (o intento) terminó
                    console.log("[INITIAL LOAD] Users state set:", usersWithRoleNames);
                }
            } catch (error) {
                console.error("[INITIAL LOAD ERROR]", error);
                const errorStatus = error.response?.status;
                let errorMsg = `Error al cargar datos: ${error.response?.data?.message || error.message || "Error desconocido."}`;
                // Mensajes específicos para errores comunes
                if (errorStatus === 401 || errorStatus === 403) { errorMsg = "Error de autenticación. Verifica tu sesión."; }
                toast.error(errorMsg);
                if (isMounted) { setRolesList([]); setData([]); setInitialLoadComplete(true); } // Limpia estados si falla
            } finally { if (isMounted) { setIsLoading(false); console.log("[INITIAL LOAD] Finished."); } }
        };
        loadInitialData();
        // Función de limpieza para evitar actualizaciones de estado si el componente se desmonta
        return () => { isMounted = false; console.log("[Usuario Component] Unmounted."); };
    }, []); // Dependencia vacía, sólo al montar

    // --- Function to Refresh Users ---
     const refreshUsers = useCallback(async (showSpinner = true) => {
        if (showSpinner) setIsLoading(true);
        console.log("[REFRESH USERS] Refreshing...");
        try {
            const usersResponse = await userService.getAllUsers(); // Asume envío de token
            let fetchedUsers = [];
            if (Array.isArray(usersResponse)) { fetchedUsers = usersResponse; }
            else if (usersResponse && Array.isArray(usersResponse.data)) { fetchedUsers = usersResponse.data; }
            else { console.warn("[REFRESH USERS] Could not find users array"); fetchedUsers = []; }
            // Usa rolesList del estado (que debería estar actualizado desde la carga inicial)
            const usersWithRoleNames = fetchedUsers.map(user => {
                const role = rolesList.find(r => r.idRole === user.idRole);
                return { ...user, roleName: role ? role.roleName : (user.idRole ? `Rol ID: ${user.idRole}` : 'Desconocido') };
            });
            setData(usersWithRoleNames);
            console.log("[REFRESH USERS] Users processed:", usersWithRoleNames);
        } catch (error) {
            console.error("[REFRESH USERS ERROR]", error);
            const errorStatus = error.response?.status;
            let errorMsg = `Error al actualizar usuarios: ${error.response?.data?.message || error.message || "Error desconocido."}`;
            if (errorStatus === 401 || errorStatus === 403) { errorMsg = "Error de autenticación al refrescar."; }
            toast.error(errorMsg);
        } finally { if (showSpinner) setIsLoading(false); console.log("[REFRESH USERS] Finished."); }
    }, [rolesList]); // Depende de rolesList para mapeo correcto de nombres

    // --- Form Helper Functions ---
    const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);
    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    // --- Validation ---
    const validateForm = useCallback((checkPasswords = true) => {
        const errors = { ...INITIAL_FORM_ERRORS }; // Resetea errores antes de validar
        let isValid = true;
        errors.general = ''; // Limpia error general

        // Validación de campos básicos
        if (!form.document_type?.trim()) { errors.document_type = true; isValid = false; }
        if (!form.document?.trim() || !/^[a-zA-Z0-9-]+$/.test(form.document.trim())) { errors.document = true; isValid = false; }
        if (!form.cellphone?.trim() || !/^\d{7,15}$/.test(form.cellphone.trim())) { errors.cellphone = true; isValid = false; }
        if (!form.full_name?.trim()) { errors.full_name = true; isValid = false; }
        if (!form.email?.trim() || !/\S+@\S+\.\S+/.test(form.email.trim())) { errors.email = true; isValid = false; }
        // Valida que idRole tenga un valor (no sea string vacío "")
        if (!form.idRole) { errors.idRole = true; isValid = false; }

        // Validación de contraseña (solo si aplica)
        if (checkPasswords) {
            const passwordError = validatePassword(form.password); // Llama a la función helper
            if (passwordError) {
                errors.password = passwordError; // Guarda el mensaje de error específico
                isValid = false;
            }
            // Valida confirmación
            if (form.password !== form.confirmPassword) {
                errors.confirmPassword = "Las contraseñas no coinciden."; isValid = false;
            } else if (!form.confirmPassword) { // Asegura que la confirmación no esté vacía
                errors.confirmPassword = "Confirme la contraseña."; isValid = false;
            }
        }

        // Comprobación de duplicados (solo si los datos iniciales ya se cargaron)
        if (initialLoadComplete) {
            const emailToCompare = String(form.email || '').trim().toLowerCase();
            const documentToCompare = String(form.document || '').trim().toLowerCase();
            const isDuplicate = data.some(u => {
                // Ignora al usuario actual si se está editando
                const isDifferentUser = isEditing ? (u.idUsers !== form.idUsers) : true;
                const isSameEmail = u.email && String(u.email).trim().toLowerCase() === emailToCompare;
                const isSameDocument = u.document && String(u.document).trim().toLowerCase() === documentToCompare;
                return isDifferentUser && (isSameEmail || isSameDocument);
            });
            if (isDuplicate) {
                // Determina qué campo está duplicado para mostrar el error correcto
                const duplicateField = data.some(u => (isEditing ? u.idUsers !== form.idUsers : true) && u.email && String(u.email).trim().toLowerCase() === emailToCompare) ? 'correo' : 'documento';
                if (duplicateField === 'correo') errors.email = true;
                if (duplicateField === 'documento') errors.document = true;
                errors.general = `Ya existe otro usuario con este ${duplicateField}.`;
                isValid = false;
            }
        }
        setFormErrors(errors); // Actualiza el estado de errores
        return isValid; // Devuelve si el formulario es válido
    }, [form, data, initialLoadComplete, isEditing]); // Dependencias necesarias

    // --- Event Handlers ---
     const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        // Mantiene valores como string en el form (idRole se convertirá antes de enviar)
        setForm(prev => ({ ...prev, [name]: value }));

        // --- Limpieza de Errores ---
        // Limpia error general de duplicado si se modifica email o documento
        if ((name === 'email' || name === 'document') && formErrors.general.includes('Ya existe')) {
              setFormErrors(prev => ({ ...prev, general: '' }));
        }
        // Limpia error específico simple (booleano) al cambiar el campo
        if (typeof formErrors[name] === 'boolean' && formErrors[name]) {
             setFormErrors(prev => ({ ...prev, [name]: false }));
        }
         // Limpia error de contraseña/confirmación si se modifica
        if (name === 'password' && formErrors.password) {
             setFormErrors(prev => ({ ...prev, password: '' }));
        }
        if (name === 'confirmPassword' && formErrors.confirmPassword) {
             setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
        }

        // --- Validación en tiempo real de Contraseñas (solo al agregar) ---
        if (!isEditing) {
             if (name === 'password') {
                 const passwordError = validatePassword(value); // Valida al escribir
                 setFormErrors(prev => ({ ...prev, password: passwordError })); // Actualiza error
                 // Revalida confirmación si la contraseña base cambia
                 if (form.confirmPassword && value !== form.confirmPassword) {
                     setFormErrors(prev => ({ ...prev, confirmPassword: "Las contraseñas no coinciden." }));
                 } else if (form.confirmPassword && value === form.confirmPassword && !passwordError) {
                     // Limpia error de confirmación SOLO si coinciden Y la base es válida
                      setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
                 }
             } else if (name === 'confirmPassword') {
                 // Valida confirmación al cambiarla
                 if (form.password !== value) {
                     setFormErrors(prev => ({ ...prev, confirmPassword: "Las contraseñas no coinciden." }));
                 } else {
                      // Limpia error de confirmación si coinciden Y la base es válida
                      const basePasswordError = validatePassword(form.password);
                      setFormErrors(prev => ({ ...prev, confirmPassword: basePasswordError ? prev.confirmPassword : '' }));
                 }
             }
        }
    }, [formErrors, form.password, form.confirmPassword, isEditing]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1); // Resetea a la primera página al buscar
    }, []);

    // --- Modal Toggles ---
    const toggleMainModal = useCallback(() => {
        const closing = modalOpen;
        setModalOpen(prev => !prev);
        // Limpia el formulario y errores solo al cerrar el modal
        if (closing) {
            resetForm();
            clearFormErrors();
            setIsEditing(false); // Asegura que siempre se abra en modo 'Agregar' por defecto
        }
    }, [modalOpen, resetForm, clearFormErrors]);

    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return; // No permitir cerrar si está procesando
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    // --- Effect to Reset Confirmation Modal ---
     useEffect(() => {
         // Resetea props y la acción a ejecutar cuando el modal de confirmación se cierra
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    // --- Filtering and Pagination Logic ---
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data; // Si no hay búsqueda, devuelve todos los datos
        const search = tableSearchText; // Ya está en minúsculas
        // Filtra por varios campos
        return data.filter(item =>
            (item?.full_name?.toLowerCase() ?? '').includes(search) ||
            (item?.email?.toLowerCase() ?? '').includes(search) ||
            (String(item?.document ?? '').toLowerCase()).includes(search) ||
            (String(item?.cellphone ?? '').toLowerCase()).includes(search) ||
            (item?.roleName?.toLowerCase() ?? '').includes(search) // Busca también por nombre del rol
        );
    }, [data, tableSearchText]); // Recalcula si cambian los datos o el texto de búsqueda

    const totalItems = useMemo(() => filteredData.length, [filteredData]); // Total de items filtrados
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]); // Total de páginas

    // Asegura que currentPage sea válido (entre 1 y totalPages)
    const validCurrentPage = useMemo(() => {
         const maxPage = totalPages > 0 ? totalPages : 1; // Mínimo 1 página
         return Math.max(1, Math.min(currentPage, maxPage));
     }, [currentPage, totalPages]);

     // Obtiene los items para la página actual
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]); // Recalcula si cambian los datos filtrados o la página

    // --- Page Change Handler ---
    const handlePageChange = useCallback((pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]); // Depende del total de páginas

    // --- Confirmation Preparation ---
    // Función genérica para preparar y abrir el modal de confirmación
    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails; // Guarda los detalles del item a afectar
        // Guarda la función a ejecutar en una ref para que no cambie entre renders
        confirmActionRef.current = () => {
             if (actionFn) { actionFn(detailsToPass); } // Ejecuta la acción con los detalles guardados
             else { console.error("Error: actionFn es nula."); toast.error("Error interno."); toggleConfirmModal(); }
        };
        setConfirmModalProps(props); // Establece título, mensaje, etc. del modal
        setConfirmModalOpen(true); // Abre el modal
    }, [toggleConfirmModal]); // toggleConfirmModal es estable

    // --- CRUD Operations ---

    // --- CREAR Usuario ---
    const handleSubmit = useCallback(async () => {
        // Revalidar antes de enviar, asegurando chequear contraseñas
        if (!validateForm(true)) {
            toast.error(formErrors.general || "Revise los campos marcados.");
            return;
         }
        const toastId = toast.loading('Agregando usuario...');
        setIsConfirmActionLoading(true); // Deshabilita botones

        // Destructura para preparar payload
        const { idUsers, confirmPassword, idRole, status, ...userData } = form;

        // *** Conversión de Tipos ***
        const userToSend = {
             ...userData,
             idRole: parseInt(idRole, 10), // Convierte idRole a NÚMERO
             status: !!status // Asegura que status sea BOOLEANO
        };

        // Verifica si la conversión de idRole falló (e.g., select vacío)
        if (isNaN(userToSend.idRole)) {
             toast.error("Seleccione un rol válido.", { id: toastId });
             setFormErrors(prev => ({...prev, idRole: true, general: "Rol inválido o no seleccionado."}));
             setIsConfirmActionLoading(false);
             return;
        }

        try {
            console.log("[ADD USER] Sending data:", userToSend);
            await userService.createUser(userToSend);
            toast.success("Usuario agregado!", { id: toastId });
            toggleMainModal();
            await refreshUsers(false);
            setCurrentPage(1); // Ir a la primera página después de agregar
        } catch (error) {
            console.error("[ADD USER ERROR]", error);
            const errorData = error.response?.data;
            let errorMsg = "Error desconocido al agregar.";
            if (errorData?.message) {
                errorMsg = errorData.message;
                // Mapea errores comunes a mensajes y errores de formulario
                 if (errorMsg.toLowerCase().includes('email') && (errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('ya existe'))) {
                    setFormErrors(prev => ({...prev, email: true, general: "Este correo ya está registrado."}));
                    errorMsg = "Este correo ya está registrado.";
                 } else if (errorMsg.toLowerCase().includes('document') && (errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('ya existe'))) {
                     setFormErrors(prev => ({...prev, document: true, general: "Este documento ya está registrado."}));
                     errorMsg = "Este documento ya está registrado.";
                 } else if (errorMsg.toLowerCase().includes('validation error')) {
                      // Error genérico de validación, puede ser por contraseña, etc.
                      setFormErrors(prev => ({...prev, general: `Error de validación del servidor. Verifique los datos.`}));
                      errorMsg = `Error de validación del servidor.`; // Mensaje más genérico para toast
                 } else {
                      setFormErrors(prev => ({...prev, general: `Error servidor: ${errorMsg}`}));
                 }
            } else if (error.message) { // Error de red u otro
                 errorMsg = error.message;
                 setFormErrors(prev => ({...prev, general: `Error: ${errorMsg}`}));
            }
            toast.error(`Error al agregar: ${errorMsg}`, { id: toastId });
        } finally {
            setIsConfirmActionLoading(false); // Rehabilita botones
        }
    }, [form, data, validateForm, toggleMainModal, refreshUsers, formErrors.general]); // Dependencias

    // --- EDITAR Usuario (Solicitud de Confirmación) ---
    const requestEditConfirmation = useCallback(() => {
        // Revalida SIN chequear passwords
        if (!validateForm(false)) {
             toast.error(formErrors.general || "Complete los campos requeridos.");
             return;
        }
        if (!form.idUsers) { toast.error("Error: ID de usuario no encontrado para editar."); return; }

        // Prepara los detalles a enviar (sin contraseñas)
        const { password, confirmPassword, idRole, status, ...detailsToSend } = form;

        // *** Conversión de Tipos ***
        const userToUpdatePayload = {
            ...detailsToSend,
            idRole: parseInt(idRole, 10), // Convierte idRole a NÚMERO
            status: !!status // Asegura que status sea BOOLEANO
        };

        // Verifica conversión de idRole
         if (isNaN(userToUpdatePayload.idRole)) {
             toast.error("Seleccione un rol válido.");
             setFormErrors(prev => ({...prev, idRole: true, general: "Rol inválido o no seleccionado."}));
             return;
         }

        // Abre modal de confirmación
        prepareConfirmation(executeEdit, {
            title: "Confirmar Actualización",
            message: <p>¿Guardar cambios para <strong>{userToUpdatePayload.full_name || 'seleccionado'}</strong>?</p>,
            confirmText: "Confirmar Cambios", confirmColor: "primary",
            itemDetails: userToUpdatePayload // Envía el payload ya procesado
        });
    }, [form, data, validateForm, prepareConfirmation, formErrors.general]); // Dependencias

    // --- EDITAR Usuario (Ejecución) ---
    const executeEdit = useCallback(async (userToUpdate) => { // Recibe el payload procesado
        if (!userToUpdate || !userToUpdate.idUsers) { toast.error("Error interno: Datos inválidos para actualizar."); toggleConfirmModal(); return; }
        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Actualizando...');

        const { idUsers, ...dataToSend } = userToUpdate; // Extrae ID, el resto es data

        try {
            console.log(`[EDIT USER] ID ${idUsers} Data:`, dataToSend);
            await userService.updateUser(idUsers, dataToSend);
            toast.success("Usuario actualizado!", { id: toastId });
            toggleConfirmModal();
            toggleMainModal();
            await refreshUsers(false);
        } catch (error) {
            console.error(`[EDIT USER EXEC ERROR] ID: ${idUsers}`, error);
            const errorData = error.response?.data;
            let errorMsg = "Error desconocido al actualizar.";
            // Mismo manejo de errores que en Crear
             if (errorData?.message) {
                errorMsg = errorData.message;
                 if (errorMsg.toLowerCase().includes('email') && (errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('ya existe'))) {
                    setFormErrors(prev => ({...prev, email: true, general: "Este correo ya está registrado por otro usuario."}));
                    errorMsg = "Correo duplicado.";
                 } else if (errorMsg.toLowerCase().includes('document') && (errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('ya existe'))) {
                     setFormErrors(prev => ({...prev, document: true, general: "Este documento ya está registrado por otro usuario."}));
                     errorMsg = "Documento duplicado.";
                 } else {
                      setFormErrors(prev => ({...prev, general: `Error servidor: ${errorMsg}`}));
                 }
            } else if (error.message) {
                 errorMsg = error.message;
                 setFormErrors(prev => ({...prev, general: `Error: ${errorMsg}`}));
            }
            toast.error(`Error al actualizar: ${errorMsg}`, { id: toastId });
            toggleConfirmModal(); // Cierra solo confirmación, deja modal principal abierto con error
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, toggleMainModal, refreshUsers]); // Dependencias

    // --- CAMBIAR ESTADO (Solicitud de Confirmación) ---
    const requestChangeStatusConfirmation = useCallback((user) => {
         if (!user || !user.idUsers) { console.error("Invalid user for status change", user); return; }
        const { idUsers, status: currentStatus, full_name: userName } = user;
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";
        prepareConfirmation(executeChangeStatus, {
            title: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            message: <p>¿<strong>{actionText}</strong> al usuario <strong>{userName || 'seleccionado'}</strong>? Estado será <strong>{futureStatusText}</strong>.</p>,
            confirmText: `Sí, ${actionText}`, confirmColor: confirmColor,
            itemDetails: { idUsers, currentStatus, userName } // Pasa detalles necesarios
        });
    }, [prepareConfirmation]);

    // --- CAMBIAR ESTADO (Ejecución) ---
    const executeChangeStatus = useCallback(async (details) => {
        if (!details || !details.idUsers) { toast.error("Error interno."); toggleConfirmModal(); return; }
        const { idUsers, currentStatus, userName } = details;
        const newStatus = !currentStatus; // El nuevo estado es booleano
        const actionText = newStatus ? "activado" : "desactivado";
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${currentStatus ? 'Desactivando' : 'Activando'} "${userName || ''}"...`);
        try {
            console.log(`[CHANGE STATUS] User ID ${idUsers}, New Status (boolean): ${newStatus}`);
            // Envía el ID y el nuevo estado booleano
            await userService.changeStateUser(idUsers, newStatus);
            toast.success(`Usuario "${userName || ''}" ${actionText}.`, { id: toastId });
            toggleConfirmModal();
            await refreshUsers(false); // Refresca la tabla para ver el cambio
        } catch (error) {
            console.error(`[STATUS CHANGE EXEC ERROR] ID: ${idUsers}`, error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido.";
            toast.error(`Error al ${currentStatus ? 'desactivar' : 'activar'}: ${errorMsg}`, { id: toastId });
            toggleConfirmModal();
        } finally { setIsConfirmActionLoading(false); }
    }, [toggleConfirmModal, refreshUsers]);

    // --- ELIMINAR Usuario (Solicitud de Confirmación) ---
    const requestDeleteConfirmation = useCallback((user) => {
        if (!user || !user.idUsers) { console.error("Invalid user for deletion", user); return; }
        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: <>
                        <p>¿Eliminar permanentemente a <strong>{user.full_name || 'este usuario'}</strong>?</p>
                        <p><strong className="text-danger">¡Acción irreversible!</strong></p>
                     </>,
            confirmText: "Eliminar Definitivamente", confirmColor: "danger",
            itemDetails: { idUsers: user.idUsers, full_name: user.full_name } // Pasa detalles
        });
    }, [prepareConfirmation]);

    // --- ELIMINAR Usuario (Ejecución) ---
    const executeDelete = useCallback(async (userToDelete) => {
        if (!userToDelete || !userToDelete.idUsers) { toast.error("Error interno: ID no encontrado."); toggleConfirmModal(); return; }
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`Eliminando "${userToDelete.full_name || ''}"...`);
        try {
            console.log(`[DELETE USER] ID ${userToDelete.idUsers}`);
            await userService.deleteUser(userToDelete.idUsers);
            toast.success(`Usuario "${userToDelete.full_name || ''}" eliminado.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            toggleConfirmModal();

            // Lógica de paginación: Si se elimina el último item de una página > 1, retrocede
            const itemsOnCurrentPageAfterDeleteSimulated = currentItems.filter(item => item.idUsers !== userToDelete.idUsers).length;
            const deletingLastItemOnPage = itemsOnCurrentPageAfterDeleteSimulated === 0 && currentPage > 1;

            await refreshUsers(false); // Refresca datos DESPUÉS de simular

            if (deletingLastItemOnPage) {
                setCurrentPage(prevPage => Math.max(1, prevPage - 1));
            }
            // Si no era el último, la paginación se ajusta al refrescar totalItems

        } catch (error) {
            console.error(`[DELETE USER EXEC ERROR] ID: ${userToDelete.idUsers}`, error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido.";
             const userName = userToDelete.full_name || `ID ${userToDelete.idUsers}`;
            toast.error(`Error al eliminar "${userName}": ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" /> });
            toggleConfirmModal();
        } finally { setIsConfirmActionLoading(false); }
    }, [toggleConfirmModal, refreshUsers, currentPage, currentItems]); // Dependencias correctas

    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm(); clearFormErrors(); setIsEditing(false); setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((user) => {
        console.log("Opening edit modal for user:", user);
        setForm({
            idUsers: user.idUsers || "", document_type: user.document_type || "",
            document: String(user.document ?? ""), cellphone: String(user.cellphone ?? ""),
            full_name: user.full_name || "", email: user.email || "",
            // Guarda idRole como string para el select
            idRole: user.idRole !== undefined && user.idRole !== null ? String(user.idRole) : "",
            status: user.status !== undefined ? user.status : true, // Guarda como boolean
            password: "", confirmPassword: "" // Limpia contraseñas
        });
        setIsEditing(true); clearFormErrors(); setModalOpen(true);
    }, [clearFormErrors]);

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
             <Toaster position="top-center" toastOptions={{ duration: 3500, style: { background: '#333', color: '#fff' }, error:{ duration: 5000 } }} />

            <h2 className="mb-4">Gestión de Usuarios</h2>
            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input type="text" bsSize="sm" placeholder="Buscar por nombre, correo, documento..." value={tableSearchText} onChange={handleTableSearch} disabled={isLoading && !initialLoadComplete} aria-label="Buscar usuarios"/>
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal} disabled={isLoading && !initialLoadComplete}>
                        <Plus size={18} className="me-1" /> Agregar Usuario
                    </Button>
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover striped size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            <th>ID</th><th>Tipo Doc.</th><th>Documento</th><th>Celular</th>
                            <th>Nombre Completo</th><th>Correo</th><th>Rol</th>
                            <th className="text-center">Estado</th><th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading && !initialLoadComplete ? (
                            <tr><td colSpan="9" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : !isLoading && data.length === 0 && !tableSearchText ? (
                            <tr><td colSpan="9" className="text-center fst-italic p-4">No hay usuarios registrados.</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idUsers} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{item.idUsers}</th>
                                    <td>{item.document_type || '-'}</td><td>{item.document || '-'}</td>
                                    <td>{item.cellphone || '-'}</td><td>{item.full_name || '-'}</td>
                                    <td>{item.email || '-'}</td>
                                    <td>{item.roleName || 'Desconocido'}</td>
                                    <td className="text-center">
                                        <Button size="sm" className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`} onClick={() => requestChangeStatusConfirmation(item)} disabled={!item.idUsers || isConfirmActionLoading} title={item.status ? "Activo (Click para desactivar)" : "Inactivo (Click para activar)"}>
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            <Button disabled={!item.idUsers || isConfirmActionLoading} size="sm" onClick={() => openEditModal(item)} title="Editar" className="action-button action-edit"><Edit size={18} /></Button>
                                            <Button disabled={!item.idUsers || isConfirmActionLoading} size="sm" onClick={() => requestDeleteConfirmation(item)} title="Eliminar" className="action-button action-delete"><Trash2 size={18} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         ) : (
                             <tr><td colSpan="9" className="text-center fst-italic p-4">{`No se encontraron coincidencias para "${tableSearchText}".`}</td></tr>
                         )}
                         {isLoading && initialLoadComplete && (
                              <tr><td colSpan="9" className="text-center p-2"><Spinner size="sm" color="secondary" /> Actualizando...</td></tr>
                         )}
                    </tbody>
                </Table>
            </div>

            { totalPages > 1 && ! (isLoading && !initialLoadComplete) && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            {/* --- Modal Agregar/Editar Usuario --- */}
            <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="lg" backdrop="static" keyboard={!isConfirmActionLoading}>
                <ModalHeader toggle={!isConfirmActionLoading ? toggleMainModal : undefined}>{isEditing ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</ModalHeader>
                <ModalBody>
                    {formErrors.general && ( <div className="alert alert-danger py-2" role="alert"><small><AlertTriangle size={16} className="me-1"/> {formErrors.general}</small></div> )}
                    <Form id="userForm" noValidate onSubmit={(e) => e.preventDefault()}>
                        <Row className="g-3">
                            {/* Form Fields */}
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="modalFullName" className="form-label fw-bold">Nombre Completo <span className="text-danger">*</span></Label>
                                    <Input id="modalFullName" name="full_name" value={form.full_name} onChange={handleChange} invalid={!!formErrors.full_name} required aria-describedby="fullNameFeedback"/>
                                     <FormFeedback id="fullNameFeedback">Requerido.</FormFeedback>
                                </FormGroup>
                            </Col>
                             <Col md={4}>
                                <FormGroup>
                                    <Label for="modalDocumentType" className="form-label fw-bold">Tipo Documento <span className="text-danger">*</span></Label>
                                    <Input id="modalDocumentType" type="select" name="document_type" value={form.document_type} onChange={handleChange} invalid={!!formErrors.document_type} required aria-describedby="docTypeFeedback">
                                        <option value="" disabled>Seleccione...</option>
                                        {TIPOS_DOCUMENTOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </Input>
                                     <FormFeedback id="docTypeFeedback">Requerido.</FormFeedback>
                                </FormGroup>
                            </Col>
                             <Col md={4}>
                                <FormGroup>
                                    <Label for="modalDocument" className="form-label fw-bold">Documento <span className="text-danger">*</span></Label>
                                    <Input id="modalDocument" name="document" value={form.document} onChange={handleChange} invalid={!!formErrors.document || formErrors.general.includes('documento')} required aria-describedby="docFeedback"/>
                                     <FormFeedback id="docFeedback">{formErrors.general.includes('documento') ? formErrors.general : 'Requerido (letras, números, guiones).'}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="modalEmail" className="form-label fw-bold">Correo <span className="text-danger">*</span></Label>
                                    <Input id="modalEmail" type="email" name="email" value={form.email} onChange={handleChange} invalid={!!formErrors.email || formErrors.general.includes('correo')} required aria-describedby="emailFeedback"/>
                                     <FormFeedback id="emailFeedback">{formErrors.general.includes('correo') ? formErrors.general : 'Correo inválido.'}</FormFeedback>
                                </FormGroup>
                            </Col>
                             <Col md={4}>
                                <FormGroup>
                                    <Label for="modalCellphone" className="form-label fw-bold">Celular <span className="text-danger">*</span></Label>
                                    <Input id="modalCellphone" type="tel" name="cellphone" value={form.cellphone} onChange={handleChange} invalid={!!formErrors.cellphone} required pattern="\d{7,15}" aria-describedby="cellFeedback"/>
                                     <FormFeedback id="cellFeedback">Celular inválido (7-15 dígitos).</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="modalRole" className="form-label fw-bold">Rol <span className="text-danger">*</span></Label>
                                    <Input id="modalRole" type="select" name="idRole" value={form.idRole} onChange={handleChange} invalid={!!formErrors.idRole || formErrors.general.includes('Rol inválido')} required disabled={rolesList.length === 0} aria-describedby="roleFeedback">
                                        <option value="" disabled>{rolesList.length === 0 ? "Cargando/No hay roles..." : "Seleccione..."}</option>
                                        {rolesList.map(r => (<option key={r.idRole} value={r.idRole}>{r.roleName}</option>))}
                                    </Input>
                                    <FormFeedback id="roleFeedback">{formErrors.general.includes('Rol inválido') ? formErrors.general : 'Requerido.' }</FormFeedback>
                                </FormGroup>
                            </Col>

                            {/* Password Fields (only for add) */}
                            {!isEditing && (
                                <>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalPassword" className="form-label fw-bold">Contraseña <span className="text-danger">*</span></Label>
                                            <Input
                                                id="modalPassword"
                                                type="password"
                                                name="password"
                                                value={form.password}
                                                onChange={handleChange}
                                                invalid={!!formErrors.password} // Inválido si hay mensaje de error
                                                required
                                                aria-describedby="passFeedback"
                                            />
                                            {/* Muestra el mensaje de error específico */}
                                            <FormFeedback id="passFeedback">{formErrors.password}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalConfirmPassword" className="form-label fw-bold">Confirmar Contraseña <span className="text-danger">*</span></Label>
                                            <Input
                                                id="modalConfirmPassword"
                                                type="password"
                                                name="confirmPassword"
                                                value={form.confirmPassword}
                                                onChange={handleChange}
                                                invalid={!!formErrors.confirmPassword} // Inválido si hay mensaje
                                                required
                                                aria-describedby="confirmPassFeedback"
                                            />
                                             {/* Muestra el mensaje de error específico */}
                                            <FormFeedback id="confirmPassFeedback">{formErrors.confirmPassword}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                     {/* Texto de ayuda actualizado */}
                                     <Col md={12}><small className="text-muted d-block mt-n2 mb-2">Exactamente 10 caracteres: Mayús, minús, núm, símbolo (@$!%*?&).</small></Col>
                                </>
                            )}
                        </Row>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={toggleMainModal} disabled={isConfirmActionLoading}>Cancelar</Button>
                    {/* Deshabilita botón si no hay roles y se está creando */}
                    <Button color="primary" onClick={isEditing ? requestEditConfirmation : handleSubmit} disabled={isConfirmActionLoading || (rolesList.length === 0 && !isEditing)}>
                        {isConfirmActionLoading ? (<><Spinner size="sm" className="me-1"/> Procesando...</>)
                         : isEditing ? (<><Edit size={18} className="me-1"/> Guardar Cambios</>)
                         : (<><Plus size={18} className="me-1"/> Agregar Usuario</>)}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Confirmation Modal */}
            <ConfirmationModal isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title} onConfirm={() => confirmActionRef.current && confirmActionRef.current()} confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor} isConfirming={isConfirmActionLoading}>
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default Usuario;