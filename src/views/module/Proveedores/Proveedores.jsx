// src/components/Proveedores/Proveedores.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css";
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, FormFeedback
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import proveedorService from '../../services/proveedorSevice';
import CustomPagination from '../../General/CustomPagination';
// import FondoForm from "../../../assets/login.jpg"; // <--- ELIMINADO

// --- Confirmation Modal (asumimos que está bien) ---
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
    idProvider: "",
    documentType: "", // Será string
    document: "",     // Será string
    company: "",      // Será string
    cellPhone: "",    // Será string
    email: "",        // Será string
    address: "",      // Será string
    status: "true",   // Será string "true" o "false" para el select/radio
};

const INITIAL_FORM_ERRORS = { // Todos strings vacíos
    documentType: '', document: '', company: '',
    cellPhone: '', email: '', address: '', general: ''
};

const TIPOS_DOCUMENTOS = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" },
    { value: "PEP", label: "Permiso Especial de Permanencia" },
    { value: "NIT", label: "NIT (Número de Identificación Tributaria)" },
];

const ITEMS_PER_PAGE = 7; // Ajustado para consistencia

// --- Validation Helper (Frontend) ---
const validateProviderField = (fieldName, value, formState) => { // formState no es necesario aquí, pero se mantiene por consistencia
    switch (fieldName) {
        case 'company':
            if (!value.trim()) return "El nombre de la empresa es obligatorio.";
            if (value.trim().length < 3 || value.trim().length > 50) return "Debe tener entre 3 y 50 caracteres.";
            // Podrías añadir regex si es necesario, ej: /^[a-zA-Z0-9\sÁÉÍÓÚáéíóúñÑ.,'-]*$/
            return '';
        case 'documentType':
            return !value ? "Seleccione un tipo de documento." : '';
        case 'document':
            if (!value.trim()) return "El documento es obligatorio.";
            // Para NIT (asumiendo que es solo números, a veces con dígito de verificación)
            if (formState.documentType === "NIT") {
                if (!/^\d{9,11}(?:-\d{1})?$/.test(value.trim())) return "NIT inválido (9-11 dígitos, opcionalmente con guion y dígito verificador).";
            } else { // Para otros tipos de documento
                if (!/^[a-zA-Z0-9-]{3,20}$/.test(value.trim())) return "Documento inválido (3-20 alfanuméricos y guiones).";
            }
            return '';
        case 'cellPhone':
            if (!value.trim()) return "El teléfono/celular es obligatorio.";
            if (!/^\d{7,15}$/.test(value.trim())) return "Debe tener entre 7 y 15 dígitos.";
            return '';
        case 'email':
            if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Formato de correo inválido.";
            // El email es opcional, así que no hay error si está vacío
            return '';
        case 'address':
            // La dirección es opcional, no requiere validación de "obligatorio" aquí
            if (value.trim().length > 100) return "La dirección no debe exceder los 100 caracteres.";
            return '';
        default:
            return '';
    }
};


// --- Main Component ---
const Proveedores = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Para el submit del formulario
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({});
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);

    const confirmActionCallbackRef = useRef(null);

    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        try {
            const proveedoresResponse = await proveedorService.getAllProveedores();
            // Asumir que el servicio devuelve el array directamente o dentro de response.data
            const proveedores = Array.isArray(proveedoresResponse) ? proveedoresResponse : (proveedoresResponse?.data || []);
            setData(proveedores);
            if (!initialDataLoaded) setInitialDataLoaded(true);
        } catch (error) {
            console.error("Error al cargar proveedores:", error);
            toast.error(`Error al cargar proveedores: ${error.response?.data?.message || error.message}`);
            setData([]); // Limpiar datos en caso de error
        } finally {
             if (showLoadingSpinner) setIsLoading(false);
        }
    }, [initialDataLoaded]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // fetchData es estable

    const resetFormAndErrors = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
        setFormErrors(INITIAL_FORM_ERRORS);
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        const newFormState = { ...form, [name]: value };
        setForm(newFormState);

        const errorMsg = validateProviderField(name, value, newFormState); // Pasar newFormState para documentType
        setFormErrors(prev => ({ ...prev, [name]: errorMsg, general: '' }));
    }, [form]); // Dependencia de form

    const validateFullForm = useCallback(() => {
        let errors = { ...INITIAL_FORM_ERRORS, general: '' }; // Reset general error
        let isValid = true;
        let firstErrorMessage = '';

        for (const key in INITIAL_FORM_STATE) {
            if (key === 'idProvider' || key === 'status') continue; // No validar ID ni status aquí directamente

            const error = validateProviderField(key, form[key], form);
            if (error) {
                errors[key] = error;
                isValid = false;
                if (!firstErrorMessage) firstErrorMessage = error;
            }
        }
        
        // Validación de unicidad de documento (simulada en frontend)
        if (isValid && initialDataLoaded) {
            const documentLower = form.document.trim().toLowerCase();
            const documentType = form.documentType; // Para ser más preciso, podrías incluir tipo de doc si es relevante para la unicidad

            const duplicate = data.find(p => {
                const isDifferentProvider = isEditing ? String(p.idProvider) !== String(form.idProvider) : true;
                return isDifferentProvider &&
                       p.document && String(p.document).toLowerCase() === documentLower &&
                       p.documentType === documentType; // Considerar tipo de documento para la unicidad
            });

            if (duplicate) {
                isValid = false;
                errors.document = `Este documento (${documentType}) ya está registrado para otro proveedor.`;
                if (!firstErrorMessage) firstErrorMessage = errors.document;
            }
        }


        if (!isValid && !errors.general) {
            errors.general = firstErrorMessage || "Por favor, corrija los errores e intente de nuevo.";
        }
        setFormErrors(errors);
        return isValid;
    }, [form, data, isEditing, initialDataLoaded]);


    const toggleMainModal = useCallback(() => {
        setModalOpen(prev => {
            if (prev) { resetFormAndErrors(); setIsEditing(false); }
            return !prev;
        });
    }, [resetFormAndErrors]);

    const openAddModal = useCallback(() => {
        setIsEditing(false);
        resetFormAndErrors();
        setForm(prev => ({ ...INITIAL_FORM_STATE, status: "true" })); // Status por defecto
        setModalOpen(true);
    }, [resetFormAndErrors]);

    const openEditModal = useCallback((proveedor) => {
        setIsEditing(true);
        resetFormAndErrors();
        setForm({
            idProvider: String(proveedor.idProvider || ""),
            documentType: proveedor.documentType || "",
            document: String(proveedor.document || ""),
            company: proveedor.company || "",
            cellPhone: String(proveedor.cellPhone || ""),
            email: proveedor.email || "",
            address: proveedor.address || "",
            status: proveedor.status !== undefined ? (proveedor.status ? "true" : "false") : "true",
        });
        setModalOpen(true);
    }, [resetFormAndErrors]);

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

    // --- Filtering and Pagination Logic ---
    const filteredData = useMemo(() => {
        const sortedData = Array.isArray(data)
            ? [...data].sort((a, b) => (b.idProvider || 0) - (a.idProvider || 0))
            : [];
        if (!tableSearchText) return sortedData;
        const searchLower = tableSearchText.toLowerCase();
        return sortedData.filter(item =>
            (item.company?.toLowerCase() || '').includes(searchLower) ||
            (String(item.document || '').toLowerCase()).includes(searchLower) ||
            (item.email?.toLowerCase() || '').includes(searchLower)
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages)), [currentPage, totalPages]);
    const currentItems = useMemo(() => {
        if (totalItems === 0) return [];
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage, totalItems]);

    useEffect(() => { // Para ajustar la página si los filtros cambian el total de páginas
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
        else if (currentPage === 0 && totalPages > 0) setCurrentPage(1); // Evitar página 0
    }, [totalPages, currentPage]);

    const handlePageChange = useCallback((page) => { setCurrentPage(page); }, []);

    // --- CRUD Actions ---
    const handleFormSubmit = async () => {
        if (!validateFullForm()) {
            toast.error(formErrors.general || "Por favor, revise los campos marcados.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading(isEditing ? 'Actualizando proveedor...' : 'Agregando proveedor...');

        const { idProvider, ...formData } = form;
        const payload = {
            documentType: formData.documentType,
            document: formData.document.trim(),
            company: formData.company.trim(),
            cellPhone: formData.cellPhone.trim() || null, // Enviar null si está vacío
            email: formData.email.trim() || null,         // Enviar null si está vacío
            address: formData.address.trim() || null,     // Enviar null si está vacío
            status: formData.status === "true",         // Convertir a booleano
        };

        try {
            if (isEditing) {
                await proveedorService.updateProveedor(idProvider, payload);
                toast.success('Proveedor actualizado!', { id: toastId });
            } else {
                await proveedorService.createProveedor(payload);
                toast.success('Proveedor agregado!', { id: toastId });
            }
            toggleMainModal();
            await fetchData(false); // No mostrar spinner de carga de tabla completa
            setCurrentPage(isEditing ? validCurrentPage : 1); // Mantener página al editar, ir a la primera al crear
        } catch (error) {
            console.error("Error submitting provider form:", error.response?.data || error.message);
            const errorData = error.response?.data;
            let serverErrorMsg = "Error desconocido.";
            const newFormErrors = { ...INITIAL_FORM_ERRORS, general: ''};

            if (errorData?.errors && Array.isArray(errorData.errors)) {
                serverErrorMsg = errorData.errors[0]?.msg || "Error de validación del servidor.";
                errorData.errors.forEach(err => {
                    if (err.path && !newFormErrors[err.path]) newFormErrors[err.path] = err.msg;
                });
            } else if (errorData?.message) {
                serverErrorMsg = errorData.message;
                if (serverErrorMsg.toLowerCase().includes('documento') && (serverErrorMsg.toLowerCase().includes('ya existe') || serverErrorMsg.toLowerCase().includes('duplicate'))) {
                    newFormErrors.document = "Este documento ya está registrado.";
                }
            } else if (error.message) {
                serverErrorMsg = error.message;
            }
            newFormErrors.general = serverErrorMsg;
            setFormErrors(newFormErrors);
            toast.error(`Error: ${newFormErrors.general || serverErrorMsg}`, { id: toastId, duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeChangeStatus = useCallback(async (details) => {
        const { idProvider, currentStatus, companyName } = details;
        const newStatus = !currentStatus;
        const actionText = newStatus ? "activado" : "desactivado";
        const toastId = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} "${companyName || ''}"...`);
        try {
            await proveedorService.changeStateProveedor(idProvider, newStatus);
            toast.success(`Proveedor "${companyName || ''}" ${actionText}.`, { id: toastId });
            await fetchData(false);
        } catch (error) {
            toast.error(`Error al cambiar estado: ${error.response?.data?.message || error.message}`, { id: toastId });
            throw error; // Relanzar para que handleConfirmAction lo maneje
        }
    }, [fetchData]);

    const requestChangeStatusConfirmation = useCallback((item) => { // Recibe el item completo
        prepareActionConfirmation(() => executeChangeStatus({idProvider: item.idProvider, currentStatus: item.status, companyName: item.company}), {
            title: `Confirmar ${item.status ? "Desactivación" : "Activación"}`,
            message: <p>¿Desea {item.status ? "desactivar" : "activar"} al proveedor <strong>{item.company}</strong>?</p>,
            confirmText: item.status ? "Sí, desactivar" : "Sí, activar",
            confirmColor: item.status ? "warning" : "success",
        });
    }, [prepareActionConfirmation, executeChangeStatus]);

    const executeDelete = useCallback(async (proveedor) => {
        const { idProvider, company } = proveedor;
        const toastId = toast.loading(`Eliminando "${company || ''}"...`);
        try {
            await proveedorService.deleteProveedor(idProvider);
            toast.success(`Proveedor "${company || ''}" eliminado.`, { id: toastId });
            
            const itemsOnCurrentPageAfterDelete = currentItems.length -1;
            const newTotalItems = totalItems - 1;
            if (itemsOnCurrentPageAfterDelete === 0 && currentPage > 1 && newTotalItems > 0) {
                setCurrentPage(prev => prev -1);
            }
            await fetchData(false); // Refrescar
        } catch (error) {
            toast.error(`Error al eliminar: ${error.response?.data?.message || error.message}`, { id: toastId });
            throw error;
        }
    }, [fetchData, currentPage, currentItems, totalItems]); // Agregado totalItems

    const requestDeleteConfirmation = useCallback(async (proveedor) => {
        if (!proveedor || !proveedor.idProvider) return;
        const checkToastId = toast.loading('Verificando compras asociadas...');
        try {
             const isAssociated = await proveedorService.isProviderAssociatedWithPurchases(proveedor.idProvider);
             toast.dismiss(checkToastId);
             if (isAssociated) {
                 toast.error(`"${proveedor.company}" no se puede eliminar, tiene compras registradas.`, { duration: 6000 });
                 return;
             }
             prepareActionConfirmation(() => executeDelete(proveedor), {
                 title: "Confirmar Eliminación Definitiva",
                 message: (
                     <>
                         <p>¿Eliminar permanentemente al proveedor <strong>{proveedor.company}</strong>?</p>
                         <p><strong className="text-danger">¡Esta acción es irreversible!</strong></p>
                     </>
                 ),
                 confirmText: "Eliminar Definitivamente", confirmColor: "danger",
             });
        } catch (error) {
            toast.dismiss(checkToastId);
            toast.error(`Error verificando asociaciones: ${error.response?.data?.message || error.message}`);
        }
    }, [prepareActionConfirmation, executeDelete]);


    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500, error: { duration: 5000 } }} />
            <h2 className="mb-4">Gestión de Proveedores</h2>

            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input type="text" bsSize="sm" placeholder="Buscar proveedor..." value={tableSearchText} onChange={(e) => setTableSearchText(e.target.value)} disabled={isLoading && !initialDataLoaded} aria-label="Buscar proveedores"/>
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal} disabled={isLoading && !initialDataLoaded}>
                        <Plus size={18} className="me-1" /> Agregar Proveedor
                    </Button>
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover striped size="sm" className="mb-0 custom-table" aria-live="polite">
                    <thead className="table-dark"> {/* Encabezado oscuro para mejor contraste */}
                        <tr>
                            <th>ID</th><th>Empresa/Proveedor</th><th>Tipo Doc.</th><th>Documento</th>
                            <th>Teléfono</th><th>Email</th>
                            <th className="text-center">Estado</th><th className="text-center" style={{minWidth: '100px'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading && !initialDataLoaded ? (
                            <tr><td colSpan="8" className="text-center p-5"><Spinner color="primary" /> Cargando datos...</td></tr>
                         ) : isLoading && initialDataLoaded ? (
                            <tr><td colSpan="8" className="text-center p-3 text-muted"><Spinner size="sm" /> Actualizando...</td></tr>
                         ) : !isLoading && data.length === 0 && !tableSearchText && initialDataLoaded ? (
                            <tr><td colSpan="8" className="text-center fst-italic p-4">No hay proveedores registrados.</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idProvider} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{item.idProvider}</th>
                                    <td>{item.company || '-'}</td>
                                    <td>{item.documentType || '-'}</td><td>{item.document || '-'}</td>
                                    <td>{item.cellPhone || '-'}</td><td>{item.email || '-'}</td>
                                    <td className="text-center">
                                        <Button size="sm" className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`} onClick={() => requestChangeStatusConfirmation(item)} disabled={isConfirmActionLoading || isSubmitting} title={item.status ? "Activo (Click para desactivar)" : "Inactivo (Click para activar)"}>
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            <Button size="sm" color="info" outline onClick={() => openEditModal(item)} title="Editar" className="action-button" disabled={isConfirmActionLoading || isSubmitting}><Edit size={16} /></Button>
                                            <Button size="sm" color="danger" outline onClick={() => requestDeleteConfirmation(item)} title="Eliminar" className="action-button" disabled={isConfirmActionLoading || isSubmitting}><Trash2 size={16} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         ) : initialDataLoaded && (
                             <tr><td colSpan="8" className="text-center fst-italic p-4">{`No se encontraron proveedores que coincidan con "${tableSearchText}".`}</td></tr>
                         )}
                    </tbody>
                </Table>
            </div>

            { totalPages > 1 && initialDataLoaded && !isLoading && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="lg" backdrop="static" keyboard={!isSubmitting && !isConfirmActionLoading}>
                <ModalHeader toggle={!isSubmitting && !isConfirmActionLoading ? toggleMainModal : undefined}>
                    {isEditing ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
                </ModalHeader>
                {/* AQUÍ SE QUITÓ EL STYLE DE BACKGROUNDIMAGE */}
                <ModalBody>
                    {formErrors.general && ( <div className="alert alert-danger py-2 small" role="alert"><AlertTriangle size={16} className="me-1"/> {formErrors.general}</div> )}
                    <Form id="providerForm" noValidate onSubmit={(e) => {e.preventDefault(); handleFormSubmit();}}>
                        <Row className="g-3">
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="company_modal">Nombre Empresa/Proveedor <span className="text-danger">*</span></Label>
                                    <Input id="company_modal" name="company" value={form.company} onChange={handleInputChange} invalid={!!formErrors.company} />
                                    <FormFeedback>{formErrors.company}</FormFeedback>
                                </FormGroup>
                            </Col>
                             <Col md={6}>
                                <FormGroup>
                                    <Label for="document_type_modal">Tipo Documento <span className="text-danger">*</span></Label>
                                    <Input id="document_type_modal" name="documentType" type="select" value={form.documentType} onChange={handleInputChange} invalid={!!formErrors.documentType}>
                                        <option value="" disabled>Seleccione...</option>
                                        {TIPOS_DOCUMENTOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </Input>
                                    <FormFeedback>{formErrors.documentType}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="document_modal">Documento <span className="text-danger">*</span></Label>
                                    <Input id="document_modal" name="document" value={form.document} onChange={handleInputChange} invalid={!!formErrors.document} />
                                    <FormFeedback>{formErrors.document}</FormFeedback>
                                </FormGroup>
                            </Col>
                             <Col md={6}>
                                <FormGroup>
                                    <Label for="cellphone_modal">Teléfono/Celular <span className="text-danger">*</span></Label>
                                    <Input id="cellphone_modal" name="cellPhone" type="tel" value={form.cellPhone} onChange={handleInputChange} invalid={!!formErrors.cellPhone} />
                                    <FormFeedback>{formErrors.cellPhone}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="email_modal">Correo Electrónico (Opcional)</Label>
                                    <Input id="email_modal" name="email" type="email" value={form.email} onChange={handleInputChange} invalid={!!formErrors.email} />
                                    <FormFeedback>{formErrors.email}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="address_modal">Dirección (Opcional)</Label>
                                    <Input id="address_modal" name="address" value={form.address} onChange={handleInputChange} invalid={!!formErrors.address} />
                                    <FormFeedback>{formErrors.address}</FormFeedback>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={toggleMainModal} disabled={isSubmitting || isConfirmActionLoading}>Cancelar</Button>
                    <Button form="providerForm" type="submit" color="primary" disabled={isSubmitting || isConfirmActionLoading}>
                        {isSubmitting ? <><Spinner size="sm" className="me-1"/> Procesando...</> : (isEditing ? 'Guardar Cambios' : 'Agregar Proveedor')}
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

export default Proveedores;