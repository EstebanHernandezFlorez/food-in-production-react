import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; // Ajusta la ruta si es necesario
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, FormFeedback
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Imports ---
import userService from '../../services/usuarioService';
import roleService from '../../services/roleServices';

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination';

// --- Confirmation Modal Component (asumimos que está bien) ---
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
    email: "", idRole: "", password: "", confirmPassword: "", status: "true",
};
const INITIAL_FORM_ERRORS = {
    document_type: '', document: '', cellphone: '', full_name: '',
    email: '', idRole: '', password: '', confirmPassword: '', general: ''
};
const TIPOS_DOCUMENTOS = [
    { value: "CC", label: "Cédula de Ciudadanía" }, { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" }, { value: "PEP", label: "Permiso Especial de Permanencia" },
];
const ITEMS_PER_PAGE = 7;

// --- Validation Helper ---
const validateField = (fieldName, value, formState, isEditingMode) => {
    // (Misma lógica de validateField que te proporcioné antes)
    switch (fieldName) {
        case 'full_name':
            return !value.trim() ? "El nombre completo es obligatorio." : '';
        case 'document_type':
            return !value ? "Seleccione un tipo de documento." : '';
        case 'document':
            if (!value.trim()) return "El documento es obligatorio.";
            if (!/^[a-zA-Z0-9-]{3,30}$/.test(value.trim())) return "Documento inválido (3-30 alfanuméricos y guiones).";
            return '';
        case 'email':
            if (!value.trim()) return "El correo es obligatorio.";
            if (!/\S+@\S+\.\S+/.test(value.trim())) return "Formato de correo inválido.";
            return '';
        case 'cellphone':
            if (!value.trim()) return "El celular es obligatorio.";
            if (!/^\d{7,15}$/.test(value.trim())) return "Celular debe tener entre 7 y 15 dígitos.";
            return '';
        case 'idRole':
            return !value ? "Seleccione un rol." : '';
        case 'password':
            if (isEditingMode && !value) return '';
            if (!value) return "La contraseña es obligatoria.";
            if (value.length !== 10) return "Debe tener exactamente 10 caracteres.";
            if (!/(?=.*[A-Z])/.test(value)) return "Debe contener al menos una mayúscula.";
            if (!/(?=.*[a-z])/.test(value)) return "Debe contener al menos una minúscula.";
            if (!/(?=.*\d)/.test(value)) return "Debe contener al menos un número.";
            if (!/(?=.*[@$!%*?&])/.test(value)) return "Debe contener un símbolo (@$!%*?&).";
            return '';
        case 'confirmPassword':
            if (isEditingMode && !formState.password && !value) return '';
            if (formState.password && value !== formState.password) return "Las contraseñas no coinciden.";
            if (formState.password && !value) return "Confirme la contraseña.";
            if (!formState.password && value && !(isEditingMode && !formState.password)) return "Primero ingrese la contraseña base.";
            return '';
        default:
            return '';
    }
};

// --- Main Component ---
const Usuario = () => {
    // --- State Definitions ---
    const [data, setData] = useState([]);
    const [rolesList, setRolesList] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({});
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);

    const confirmActionCallbackRef = useRef(null);

    // --- Data Fetching and Processing Callbacks ---
    const mapUsersWithRoleNames = useCallback((users, roles) => {
        if (!Array.isArray(users) || !Array.isArray(roles)) return [];
        return users.map(user => {
            const role = roles.find(r => r.idRole === user.idRole);
            return { ...user, roleName: role ? role.roleName : (user.idRole ? `Rol ID: ${user.idRole}` : 'Sin rol') };
        });
    }, []);

    const fetchAndSetRoles = useCallback(async (isMountedRef) => {
        try {
            const rolesResponse = await roleService.getAllRoles();
            const fetchedRoles = Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse?.data || []);
            if (isMountedRef.current) {
                setRolesList(fetchedRoles.filter(role => role.status));
                return fetchedRoles; 
            }
        } catch (error) {
            if (isMountedRef.current) setRolesList([]);
            toast.error(`Error al cargar roles: ${error.response?.data?.message || error.message}`);
        }
        return [];
    }, []);

    const fetchAndSetUsers = useCallback(async (currentRoles, isMountedRef) => {
        try {
            const usersResponse = await userService.getAllUsers();
            const fetchedUsers = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.data || []);
            if (isMountedRef.current) {
                setData(mapUsersWithRoleNames(fetchedUsers, currentRoles));
            }
        } catch (error) {
            if (isMountedRef.current) setData([]);
            toast.error(`Error al cargar usuarios: ${error.response?.data?.message || error.message}`);
        }
    }, [mapUsersWithRoleNames]);

    // --- Effect for Initial Data Load ---
    useEffect(() => {
        const isMountedRef = { current: true };
        const loadInitialData = async () => {
            setIsLoading(true);
            const loadedRoles = await fetchAndSetRoles(isMountedRef);
            if (isMountedRef.current) {
                await fetchAndSetUsers(loadedRoles, isMountedRef);
                setInitialDataLoaded(true);
                setIsLoading(false);
            }
        };
        loadInitialData();
        return () => { isMountedRef.current = false; };
    }, [fetchAndSetRoles, fetchAndSetUsers]);

    // --- Callback to Refresh Data ---
    const refreshData = useCallback(async (showSpinner = true) => {
        const isMountedRef = { current: true };
        if (showSpinner) setIsLoading(true);
        const currentRoles = await fetchAndSetRoles(isMountedRef);
        if (isMountedRef.current) {
            await fetchAndSetUsers(currentRoles, isMountedRef);
        }
        if (showSpinner && isMountedRef.current) setIsLoading(false);
        return () => { isMountedRef.current = false; };
    }, [fetchAndSetRoles, fetchAndSetUsers]);

    // --- Form Helper Callbacks ---
    const resetFormAndErrors = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
        setFormErrors(INITIAL_FORM_ERRORS);
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        const newFormState = { ...form, [name]: value };
        setForm(newFormState);
        let errorMsg = '';
        if (name === 'password' || name === 'confirmPassword') {
            const passwordError = validateField('password', name === 'password' ? value : newFormState.password, newFormState, isEditing);
            const confirmPasswordError = validateField('confirmPassword', name === 'confirmPassword' ? value : newFormState.confirmPassword, newFormState, isEditing);
            setFormErrors(prev => ({ ...prev, password: passwordError, confirmPassword: confirmPasswordError, general: '' }));
        } else {
            errorMsg = validateField(name, value, newFormState, isEditing);
            setFormErrors(prev => ({ ...prev, [name]: errorMsg, general: '' }));
        }
    }, [form, isEditing]);

    const validateFullForm = useCallback(() => {
        let errors = { ...INITIAL_FORM_ERRORS };
        let isValid = true;
        let firstErrorMessage = '';
        for (const key in INITIAL_FORM_STATE) {
            if (key === 'idUsers') continue;
            if (isEditing && (key === 'password' || key === 'confirmPassword') && !form.password && !form.confirmPassword) continue;
            const error = validateField(key, form[key], form, isEditing);
            if (error) {
                errors[key] = error;
                isValid = false;
                if (!firstErrorMessage) firstErrorMessage = error;
            }
        }
        if (initialDataLoaded && isValid) {
            const emailLower = form.email.trim().toLowerCase();
            const documentLower = form.document.trim().toLowerCase();
            const duplicate = data.find(u => {
                const isDifferentUser = isEditing ? u.idUsers !== form.idUsers : true;
                return isDifferentUser && ((u.email && u.email.toLowerCase() === emailLower) || (u.document && String(u.document).toLowerCase() === documentLower));
            });
            if (duplicate) {
                isValid = false;
                const field = duplicate.email.toLowerCase() === emailLower ? 'email' : 'document';
                errors[field] = `Este ${field === 'email' ? 'correo' : 'documento'} ya está registrado.`;
                if (!firstErrorMessage) firstErrorMessage = errors[field];
            }
        }
        if (!isValid && !errors.general) errors.general = firstErrorMessage || "Por favor, corrija los errores.";
        setFormErrors(errors);
        return isValid;
    }, [form, data, isEditing, initialDataLoaded]);

    // --- Modal Toggling Callbacks ---
    const toggleMainModal = useCallback(() => {
        setModalOpen(prev => {
            if (prev) { resetFormAndErrors(); setIsEditing(false); }
            return !prev;
        });
    }, [resetFormAndErrors]);

    const openAddModal = useCallback(() => {
        setIsEditing(false);
        resetFormAndErrors();
        setForm(prev => ({ ...INITIAL_FORM_STATE, status: "true" }));
        setModalOpen(true);
    }, [resetFormAndErrors]);

    const openEditModal = useCallback((user) => {
        setIsEditing(true);
        resetFormAndErrors();
        setForm({
            idUsers: user.idUsers || "", document_type: user.document_type || "",
            document: String(user.document || ""), cellphone: String(user.cellphone || ""),
            full_name: user.full_name || "", email: user.email || "",
            idRole: user.idRole !== undefined ? String(user.idRole) : "",
            password: "", confirmPassword: "",
            status: user.status !== undefined ? (user.status ? "true" : "false") : "true",
        });
        setModalOpen(true);
    }, [resetFormAndErrors]);

    // --- Confirmation Modal Logic Callbacks ---
    const prepareActionConfirmation = useCallback((actionCb, modalDetails) => {
        confirmActionCallbackRef.current = actionCb;
        setConfirmModalProps(modalDetails);
        setConfirmModalOpen(true);
    }, []);

    const handleConfirmAction = useCallback(async () => {
        if (confirmActionCallbackRef.current) {
            setIsConfirmActionLoading(true);
            try {
                await confirmActionCallbackRef.current();
            } catch (error) { console.error("Error during confirmed action:", error); }
            finally {
                setIsConfirmActionLoading(false);
                setConfirmModalOpen(false);
            }
        }
    }, []);

    // --- Filtering and Pagination (ORDER IS CRUCIAL HERE) ---
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        const searchLower = tableSearchText.toLowerCase();
        return data.filter(item =>
            (item.full_name?.toLowerCase() || '').includes(searchLower) ||
            (item.email?.toLowerCase() || '').includes(searchLower) ||
            (String(item.document || '').toLowerCase()).includes(searchLower) ||
            (String(item.cellphone || '').toLowerCase()).includes(searchLower) ||
            (item.roleName?.toLowerCase() || '').includes(searchLower)
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);

    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);

    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages)), [currentPage, totalPages]);

    const currentItems = useMemo(() => { // This was the one causing the error if `executeDelete` was defined before it
        if (totalItems === 0) return [];
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage, totalItems]);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // --- CRUD Actions (Defined AFTER pagination memos if they use them) ---
    const handleFormSubmit = async () => {
        // (Misma lógica de handleFormSubmit que te proporcioné antes)
        // ... se ha movido aquí para asegurar que `validCurrentPage` está definido si es necesario ...
        if (!validateFullForm()) {
            toast.error(formErrors.general || "Por favor, revise los campos marcados.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading(isEditing ? 'Actualizando usuario...' : 'Agregando usuario...');
        const { idUsers, confirmPassword, ...formData } = form;
        const payload = {
            ...formData,
            idRole: parseInt(formData.idRole, 10),
            status: formData.status === "true",
        };
        if (!isEditing) payload.password = formData.password;
        else if (isEditing && formData.password) payload.password = formData.password;
        else delete payload.password;

        try {
            if (isEditing) await userService.updateUser(idUsers, payload);
            else await userService.createUser(payload);
            toast.success(isEditing ? 'Usuario actualizado!' : 'Usuario agregado!', { id: toastId });
            toggleMainModal();
            await refreshData(false);
            setCurrentPage(isEditing ? validCurrentPage : 1); // Usa validCurrentPage aquí
        } catch (error) {
            const errorData = error.response?.data;
            let serverErrorMsg = "Error desconocido.";
            const newFormErrors = { ...INITIAL_FORM_ERRORS, general: '' };
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                serverErrorMsg = errorData.errors[0]?.msg || "Error de validación del servidor.";
                errorData.errors.forEach(err => { if (err.path && !newFormErrors[err.path]) newFormErrors[err.path] = err.msg; });
            } else if (errorData?.message) {
                serverErrorMsg = errorData.message;
                if (serverErrorMsg.toLowerCase().includes('email') && (serverErrorMsg.toLowerCase().includes('duplicate') || serverErrorMsg.toLowerCase().includes('ya existe'))) newFormErrors.email = "Este correo ya está registrado.";
                else if (serverErrorMsg.toLowerCase().includes('document') && (serverErrorMsg.toLowerCase().includes('duplicate') || serverErrorMsg.toLowerCase().includes('ya existe'))) newFormErrors.document = "Este documento ya está registrado.";
            } else if (error.message) serverErrorMsg = error.message;
            newFormErrors.general = serverErrorMsg;
            setFormErrors(newFormErrors);
            toast.error(`Error: ${newFormErrors.general || serverErrorMsg}`, { id: toastId, duration: 5000 });
        } finally { setIsSubmitting(false); }
    };

    const executeChangeStatus = useCallback(async (user) => {
        const { idUsers, status: currentStatus, full_name } = user;
        const newStatus = !currentStatus;
        const actionText = newStatus ? "activado" : "desactivado";
        const toastId = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} "${full_name || ''}"...`);
        try {
            await userService.changeStateUser(idUsers, newStatus);
            toast.success(`Usuario "${full_name || ''}" ${actionText}.`, { id: toastId });
            await refreshData(false);
        } catch (error) {
            toast.error(`Error: ${error.response?.data?.message || error.message}`, { id: toastId });
            throw error;
        }
    }, [refreshData]);

    const requestChangeStatusConfirmation = useCallback((user) => {
        prepareActionConfirmation(() => executeChangeStatus(user), {
            title: `Confirmar ${user.status ? "Desactivación" : "Activación"}`,
            message: <p>¿Desea {user.status ? "desactivar" : "activar"} al usuario <strong>{user.full_name}</strong>?</p>,
            confirmText: user.status ? "Sí, desactivar" : "Sí, activar",
            confirmColor: user.status ? "warning" : "success",
        });
    }, [prepareActionConfirmation, executeChangeStatus]);

    const executeDelete = useCallback(async (user) => {
        const { idUsers, full_name } = user;
        const toastId = toast.loading(`Eliminando "${full_name || ''}"...`);
        try {
            await userService.deleteUser(idUsers);
            toast.success(`Usuario "${full_name || ''}" eliminado.`, { id: toastId });
            
            // Lógica de paginación ajustada:
            // Si currentItems (antes de refrescar) tenía 1 elemento y no estábamos en la página 1,
            // y el total de items (antes de refrescar) menos 1 es mayor que 0,
            // entonces probablemente queramos ir a la página anterior.
            const newTotalItemsAfterDelete = totalItems - 1; // totalItems es el memoizado antes del refresh
            const newTotalPagesAfterDelete = Math.ceil(newTotalItemsAfterDelete / ITEMS_PER_PAGE) || 1;

            if (currentItems.length === 1 && currentPage > 1 && newTotalItemsAfterDelete > 0) {
                setCurrentPage(prev => Math.max(1, prev - 1));
            } else if (currentPage > newTotalPagesAfterDelete) {
                setCurrentPage(newTotalPagesAfterDelete);
            }
            // El refreshData actualizará la tabla y recalculará los memos de paginación correctamente.
            await refreshData(false);
        } catch (error) {
            toast.error(`Error: ${error.response?.data?.message || error.message}`, { id: toastId });
            throw error;
        }
    }, [refreshData, currentPage, currentItems, totalItems]); // Dependencias de `executeDelete`

    const requestDeleteConfirmation = useCallback((user) => {
        prepareActionConfirmation(() => executeDelete(user), {
            title: "Confirmar Eliminación",
            message: <>
                        <p>¿Eliminar permanentemente a <strong>{user.full_name || 'este usuario'}</strong>?</p>
                        <p><strong className="text-danger">¡Esta acción es irreversible!</strong></p>
                     </>,
            confirmText: "Eliminar Definitivamente", confirmColor: "danger",
        });
    }, [prepareActionConfirmation, executeDelete]);

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500, error: { duration: 5000 } }} />
            <h2 className="mb-4">Gestión de Usuarios</h2>

            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input type="text" bsSize="sm" placeholder="Buscar usuario..." value={tableSearchText} onChange={(e) => setTableSearchText(e.target.value)} disabled={isLoading && !initialDataLoaded} aria-label="Buscar usuarios"/>
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal} disabled={isLoading && !initialDataLoaded}>
                        <Plus size={18} className="me-1" /> Agregar Usuario
                    </Button>
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover striped size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            <th>ID</th><th>Nombre Completo</th><th>Tipo Doc.</th><th>Documento</th>
                            <th>Correo</th><th>Celular</th><th>Rol</th>
                            <th className="text-center">Estado</th><th className="text-center" style={{minWidth: '100px'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading && !initialDataLoaded ? (
                            <tr><td colSpan="9" className="text-center p-5"><Spinner color="primary" /> Cargando datos iniciales...</td></tr>
                         ) : isLoading && initialDataLoaded ? (
                            <tr><td colSpan="9" className="text-center p-3 text-muted"><Spinner size="sm" /> Actualizando lista...</td></tr>
                         ) : !isLoading && data.length === 0 && !tableSearchText && initialDataLoaded ? (
                            <tr><td colSpan="9" className="text-center fst-italic p-4">No hay usuarios registrados. Puede agregar uno nuevo.</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idUsers} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{item.idUsers}</th>
                                    <td>{item.full_name || '-'}</td>
                                    <td>{item.document_type || '-'}</td><td>{item.document || '-'}</td>
                                    <td>{item.email || '-'}</td><td>{item.cellphone || '-'}</td>
                                    <td>{item.roleName || 'Desconocido'}</td>
                                    <td className="text-center">
                                        <Button size="sm" className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`} onClick={() => requestChangeStatusConfirmation(item)} disabled={isConfirmActionLoading || isSubmitting} title={item.status ? "Activo (Click para desactivar)" : "Inactivo (Click para activar)"}>
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            <Button size="sm" onClick={() => openEditModal(item)} title="Editar" className="action-button action-edit" disabled={isConfirmActionLoading || isSubmitting}><Edit size={18} /></Button>
                                            <Button size="sm" onClick={() => requestDeleteConfirmation(item)} title="Eliminar" className="action-button action-delete" disabled={isConfirmActionLoading || isSubmitting}><Trash2 size={18} /></Button>
                                        </div>
                                    </td>
                                </tr>  
                            ))
                         ) : initialDataLoaded && (
                             <tr><td colSpan="9" className="text-center fst-italic p-4">{`No se encontraron usuarios que coincidan con "${tableSearchText}".`}</td></tr>
                         )}
                    </tbody>
                </Table>
            </div>

            { totalPages > 1 && initialDataLoaded && !isLoading && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="lg" backdrop="static" keyboard={!isSubmitting && !isConfirmActionLoading}>
                <ModalHeader toggle={!isSubmitting && !isConfirmActionLoading ? toggleMainModal : undefined}>{isEditing ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</ModalHeader>
                <ModalBody>
                    {formErrors.general && ( <div className="alert alert-danger py-2 small" role="alert"><AlertTriangle size={16} className="me-1"/> {formErrors.general}</div> )}
                    <Form id="userForm" noValidate onSubmit={(e) => {e.preventDefault(); handleFormSubmit();}}>
                        <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} tabIndex={-1} />
                        <input type="password" name="current-password" autoComplete="current-password" style={{ display: 'none' }} tabIndex={-1} />
                        
                        <Row className="g-3">
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="full_name_modal">Nombre Completo <span className="text-danger">*</span></Label>
                                    <Input id="full_name_modal" name="full_name" value={form.full_name} onChange={handleInputChange} invalid={!!formErrors.full_name} autoComplete="name" />
                                    <FormFeedback>{formErrors.full_name}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="email_modal">Correo Electrónico <span className="text-danger">*</span></Label>
                                    <Input id="email_modal" name="email" type="email" value={form.email} onChange={handleInputChange} invalid={!!formErrors.email} autoComplete="email"/>
                                    <FormFeedback>{formErrors.email}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="document_type_modal">Tipo Documento <span className="text-danger">*</span></Label>
                                    <Input id="document_type_modal" name="document_type" type="select" value={form.document_type} onChange={handleInputChange} invalid={!!formErrors.document_type} autoComplete="off">
                                        <option value="" disabled>Seleccione...</option>
                                        {TIPOS_DOCUMENTOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </Input>
                                    <FormFeedback>{formErrors.document_type}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="document_modal">Documento <span className="text-danger">*</span></Label>
                                    <Input id="document_modal" name="document" value={form.document} onChange={handleInputChange} invalid={!!formErrors.document} autoComplete="off"/>
                                    <FormFeedback>{formErrors.document}</FormFeedback>
                                </FormGroup>
                            </Col>
                             <Col md={4}>
                                <FormGroup>
                                    <Label for="cellphone_modal">Celular <span className="text-danger">*</span></Label>
                                    <Input id="cellphone_modal" name="cellphone" type="tel" value={form.cellphone} onChange={handleInputChange} invalid={!!formErrors.cellphone} autoComplete="tel"/>
                                    <FormFeedback>{formErrors.cellphone}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={isEditing && !form.password && !form.confirmPassword ? 12 : 6}>
                                <FormGroup>
                                    <Label for="idRole_modal">Rol <span className="text-danger">*</span></Label>
                                    <Input id="idRole_modal" name="idRole" type="select" value={form.idRole} onChange={handleInputChange} invalid={!!formErrors.idRole} disabled={rolesList.length === 0} autoComplete="off">
                                        <option value="" disabled>{rolesList.length === 0 ? "Cargando roles..." : "Seleccione..."}</option>
                                        {rolesList.map(r => (<option key={r.idRole} value={r.idRole}>{r.roleName}</option>))}
                                    </Input>
                                    <FormFeedback>{formErrors.idRole}</FormFeedback>
                                </FormGroup>
                            </Col>

                            {!isEditing && (
                                <>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="password_modal_add">Contraseña <span className="text-danger">*</span></Label>
                                            <Input id="password_modal_add" name="password" type="password" value={form.password} onChange={handleInputChange} invalid={!!formErrors.password} autoComplete="new-password" />
                                            <FormFeedback>{formErrors.password}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="confirmPassword_modal_add">Confirmar Contraseña <span className="text-danger">*</span></Label>
                                            <Input id="confirmPassword_modal_add" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleInputChange} invalid={!!formErrors.confirmPassword} autoComplete="new-password" />
                                            <FormFeedback>{formErrors.confirmPassword}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                     <Col md={12}><small className="text-muted d-block mt-n2 mb-2">Contraseña: Exactamente 10 caracteres, incluyendo mayúscula, minúscula, número y un símbolo (@$!%*?&).</small></Col>
                                </>
                            )}
                             {isEditing && (
                                <>
                                    <Col md={12} className="mt-3"><hr/><h6 className="mb-3 text-muted">Cambiar Contraseña (opcional)</h6></Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="password_modal_edit">Nueva Contraseña</Label>
                                            <Input id="password_modal_edit" name="password" type="password" placeholder="Dejar en blanco para no cambiar" value={form.password} onChange={handleInputChange} invalid={!!formErrors.password && !!form.password} autoComplete="new-password" />
                                            {form.password && <FormFeedback>{formErrors.password}</FormFeedback>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="confirmPassword_modal_edit">Confirmar Nueva Contraseña</Label>
                                            <Input id="confirmPassword_modal_edit" name="confirmPassword" type="password" placeholder="Dejar en blanco para no cambiar" value={form.confirmPassword} onChange={handleInputChange} invalid={!!formErrors.confirmPassword && !!form.password} autoComplete="new-password" />
                                            {form.password && <FormFeedback>{formErrors.confirmPassword}</FormFeedback>}
                                        </FormGroup>
                                    </Col>
                                     { (form.password || form.confirmPassword) && <Col md={12}><small className="text-muted d-block mt-n2 mb-2">Contraseña: Exactamente 10 caracteres, incluyendo mayúscula, minúscula, número y un símbolo (@$!%*?&).</small></Col>}
                                </>
                            )}
                        </Row>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={toggleMainModal} disabled={isSubmitting || isConfirmActionLoading}>Cancelar</Button>
                    <Button form="userForm" type="submit" color="primary" disabled={isSubmitting || isConfirmActionLoading || (rolesList.length === 0 && !isEditing)}>
                        {isSubmitting ? <><Spinner size="sm" className="me-1"/> Procesando...</> : (isEditing ? 'Guardar Cambios' : 'Agregar Usuario')}
                    </Button>
                </ModalFooter>
            </Modal>

            <ConfirmationModal
                isOpen={confirmModalOpen}
                toggle={() => !isConfirmActionLoading && setConfirmModalOpen(false)}
                title={confirmModalProps.title || "Confirmar Acción"}
                onConfirm={handleConfirmAction}
                confirmText={confirmModalProps.confirmText || "Confirmar"}
                confirmColor={confirmModalProps.confirmColor || "primary"}
                isConfirming={isConfirmActionLoading}
            >
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default Usuario;