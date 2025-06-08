// src/components/Proveedores/Proveedores.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css";
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, FormFeedback
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import proveedorService from '../../services/proveedorSevice';
import CustomPagination from '../../General/CustomPagination';

// --- Componentes y constantes (sin cambios) ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => ( <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}> <ModalHeader toggle={!isConfirming ? toggle : undefined}> <div className="d-flex align-items-center"> <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : (confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} /> <span className="fw-bold">{title}</span> </div> </ModalHeader> <ModalBody>{children}</ModalBody> <ModalFooter> <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button> <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}> {isConfirming ? <><Spinner size="sm" className="me-1"/> Procesando...</> : confirmText} </Button> </ModalFooter> </Modal> );
const INITIAL_FORM_STATE = { idProvider: "", documentType: "", document: "", company: "", cellPhone: "", email: "", address: "", status: "true", };
const INITIAL_FORM_ERRORS = { documentType: '', document: '', company: '', cellPhone: '', email: '', address: '', general: '' };
const TIPOS_DOCUMENTOS = [ { value: "CC", label: "Cédula de Ciudadanía" }, { value: "CE", label: "Cédula de Extranjería" }, { value: "PA", label: "Pasaporte" }, { value: "PEP", label: "Permiso Especial de Permanencia" }, { value: "NIT", label: "NIT (Número de Identificación Tributaria)" }, ];
const ITEMS_PER_PAGE = 7;
const validateProviderField = (fieldName, value, formState) => { switch (fieldName) { case 'company': if (!value.trim()) return "El nombre de la empresa es obligatorio."; if (value.trim().length < 3 || value.trim().length > 50) return "Debe tener entre 3 y 50 caracteres."; return ''; case 'documentType': return !value ? "Seleccione un tipo de documento." : ''; case 'document': if (!value.trim()) return "El documento es obligatorio."; if (formState.documentType === "NIT") { if (!/^\d{9,11}(?:-\d{1})?$/.test(value.trim())) return "NIT inválido (9-11 dígitos, opcionalmente con guion y dígito verificador)."; } else { if (!/^[a-zA-Z0-9-]{3,20}$/.test(value.trim())) return "Documento inválido (3-20 alfanuméricos y guiones)."; } return ''; case 'cellPhone': if (!value.trim()) return "El teléfono/celular es obligatorio."; if (!/^\d{7,15}$/.test(value.trim())) return "Debe tener entre 7 y 15 dígitos."; return ''; case 'email': if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Formato de correo inválido."; return ''; case 'address': if (value.trim().length > 100) return "La dirección no debe exceder los 100 caracteres."; return ''; default: return ''; } };

// --- Main Component ---
const Proveedores = () => {
    // --- State & Refs (sin cambios) ---
    const [data, setData] = useState([]);
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

    // --- Lógica de Callbacks y Hooks (sin cambios) ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => { if (showLoadingSpinner) setIsLoading(true); try { const proveedoresResponse = await proveedorService.getAllProveedores(); const proveedores = Array.isArray(proveedoresResponse) ? proveedoresResponse : (proveedoresResponse?.data || []); setData(proveedores); if (!initialDataLoaded) setInitialDataLoaded(true); } catch (error) { toast.error(`Error al cargar proveedores: ${error.response?.data?.message || error.message}`); setData([]); } finally { if (showLoadingSpinner) setIsLoading(false); } }, [initialDataLoaded]);
    useEffect(() => { fetchData(); }, [fetchData]);
    const resetFormAndErrors = useCallback(() => { setForm(INITIAL_FORM_STATE); setFormErrors(INITIAL_FORM_ERRORS); }, []);
    const handleInputChange = useCallback((e) => { const { name, value } = e.target; const newFormState = { ...form, [name]: value }; setForm(newFormState); const errorMsg = validateProviderField(name, value, newFormState); setFormErrors(prev => ({ ...prev, [name]: errorMsg, general: '' })); }, [form]);
    const validateFullForm = useCallback(() => { let errors = { ...INITIAL_FORM_ERRORS, general: '' }; let isValid = true; let firstErrorMessage = ''; for (const key in INITIAL_FORM_STATE) { if (key === 'idProvider' || key === 'status') continue; const error = validateProviderField(key, form[key], form); if (error) { errors[key] = error; isValid = false; if (!firstErrorMessage) firstErrorMessage = error; } } if (isValid && initialDataLoaded) { const documentLower = form.document.trim().toLowerCase(); const documentType = form.documentType; const duplicate = data.find(p => { const isDifferentProvider = isEditing ? String(p.idProvider) !== String(form.idProvider) : true; return isDifferentProvider && p.document && String(p.document).toLowerCase() === documentLower && p.documentType === documentType; }); if (duplicate) { isValid = false; errors.document = `Este documento (${documentType}) ya está registrado.`; if (!firstErrorMessage) firstErrorMessage = errors.document; } } if (!isValid && !errors.general) { errors.general = firstErrorMessage || "Por favor, corrija los errores."; } setFormErrors(errors); return isValid; }, [form, data, isEditing, initialDataLoaded]);
    const toggleMainModal = useCallback(() => { setModalOpen(prev => { if (prev) { resetFormAndErrors(); setIsEditing(false); } return !prev; }); }, [resetFormAndErrors]);
    const openAddModal = useCallback(() => { setIsEditing(false); resetFormAndErrors(); setForm(prev => ({ ...INITIAL_FORM_STATE, status: "true" })); setModalOpen(true); }, [resetFormAndErrors]);
    const openEditModal = useCallback((proveedor) => { setIsEditing(true); resetFormAndErrors(); setForm({ idProvider: String(proveedor.idProvider || ""), documentType: proveedor.documentType || "", document: String(proveedor.document || ""), company: proveedor.company || "", cellPhone: String(proveedor.cellPhone || ""), email: proveedor.email || "", address: proveedor.address || "", status: proveedor.status !== undefined ? (proveedor.status ? "true" : "false") : "true", }); setModalOpen(true); }, [resetFormAndErrors]);
    const prepareActionConfirmation = useCallback((actionCb, modalDetails) => { confirmActionCallbackRef.current = actionCb; setConfirmModalProps(modalDetails); setConfirmModalOpen(true); }, []);
    const handleConfirmAction = useCallback(async () => { if (confirmActionCallbackRef.current) { setIsConfirmActionLoading(true); try { await confirmActionCallbackRef.current(); } catch (error) { console.error("Error during confirmed action:", error); } finally { setIsConfirmActionLoading(false); setConfirmModalOpen(false); } } }, []);
    
    // --- Memos de filtrado y paginación ---
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        const searchLower = tableSearchText.toLowerCase();
        return data.filter(item =>
            (item.company?.toLowerCase() || '').includes(searchLower) ||
            (String(item.document || '').toLowerCase()).includes(searchLower) ||
            (item.email?.toLowerCase() || '').includes(searchLower)
        );
    }, [data, tableSearchText]);
    
    // <-- CAMBIO: Se introduce un memo para ordenar los datos filtrados
    const sortedAndFilteredData = useMemo(() => {
        return [...filteredData].sort((a, b) => (a.idProvider || 0) - (b.idProvider || 0));
    }, [filteredData]);

    const totalItems = useMemo(() => sortedAndFilteredData.length, [sortedAndFilteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages)), [currentPage, totalPages]);
    
    const currentItems = useMemo(() => {
        if (totalItems === 0) return [];
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        // <-- CAMBIO: Se usa sortedAndFilteredData para la paginación
        return sortedAndFilteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredData, validCurrentPage, totalItems]);
    
    const handlePageChange = useCallback((page) => { setCurrentPage(page); }, []);

    // --- Lógica CRUD (sin cambios) ---
    const handleFormSubmit = async () => { if (!validateFullForm()) { toast.error(formErrors.general || "Por favor, revise los campos marcados."); return; } setIsSubmitting(true); const toastId = toast.loading(isEditing ? 'Actualizando proveedor...' : 'Agregando proveedor...'); const { idProvider, ...formData } = form; const payload = { documentType: formData.documentType, document: formData.document.trim(), company: formData.company.trim(), cellPhone: formData.cellPhone.trim() || null, email: formData.email.trim() || null, address: formData.address.trim() || null, status: formData.status === "true", }; try { if (isEditing) { await proveedorService.updateProveedor(idProvider, payload); toast.success('Proveedor actualizado!', { id: toastId }); } else { await proveedorService.createProveedor(payload); toast.success('Proveedor agregado!', { id: toastId }); } toggleMainModal(); await fetchData(false); setCurrentPage(isEditing ? validCurrentPage : 1); } catch (error) { const errorData = error.response?.data; let serverErrorMsg = "Error desconocido."; const newFormErrors = { ...INITIAL_FORM_ERRORS, general: ''}; if (errorData?.errors && Array.isArray(errorData.errors)) { serverErrorMsg = errorData.errors[0]?.msg || "Error de validación."; errorData.errors.forEach(err => { if (err.path && !newFormErrors[err.path]) newFormErrors[err.path] = err.msg; }); } else if (errorData?.message) { serverErrorMsg = errorData.message; if (serverErrorMsg.toLowerCase().includes('documento') && (serverErrorMsg.toLowerCase().includes('ya existe') || serverErrorMsg.toLowerCase().includes('duplicate'))) { newFormErrors.document = "Este documento ya está registrado."; } } else if (error.message) { serverErrorMsg = error.message; } newFormErrors.general = serverErrorMsg; setFormErrors(newFormErrors); toast.error(`Error: ${newFormErrors.general || serverErrorMsg}`, { id: toastId, duration: 5000 }); } finally { setIsSubmitting(false); } };
    const executeChangeStatus = useCallback(async (details) => { const { idProvider, currentStatus, companyName } = details; const newStatus = !currentStatus; const actionText = newStatus ? "activado" : "desactivado"; const toastId = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} "${companyName || ''}"...`); try { await proveedorService.changeStateProveedor(idProvider, newStatus); toast.success(`Proveedor "${companyName || ''}" ${actionText}.`, { id: toastId }); await fetchData(false); } catch (error) { toast.error(`Error: ${error.response?.data?.message || error.message}`, { id: toastId }); throw error; } }, [fetchData]);
    const requestChangeStatusConfirmation = useCallback((item) => { prepareActionConfirmation(() => executeChangeStatus({idProvider: item.idProvider, currentStatus: item.status, companyName: item.company}), { title: `Confirmar ${item.status ? "Desactivación" : "Activación"}`, message: <p>¿Desea {item.status ? "desactivar" : "activar"} al proveedor <strong>{item.company}</strong>?</p>, confirmText: item.status ? "Sí, desactivar" : "Sí, activar", confirmColor: item.status ? "warning" : "success", }); }, [prepareActionConfirmation, executeChangeStatus]);
    const executeDelete = useCallback(async (proveedor) => { const { idProvider, company } = proveedor; const toastId = toast.loading(`Eliminando "${company || ''}"...`); try { await proveedorService.deleteProveedor(idProvider); toast.success(`Proveedor "${company || ''}" eliminado.`, { id: toastId }); const itemsOnCurrentPageAfterDelete = currentItems.length -1; const newTotalItems = totalItems - 1; if (itemsOnCurrentPageAfterDelete === 0 && currentPage > 1 && newTotalItems > 0) { setCurrentPage(prev => prev -1); } await fetchData(false); } catch (error) { toast.error(`Error al eliminar: ${error.response?.data?.message || error.message}`, { id: toastId }); throw error; } }, [fetchData, currentPage, currentItems, totalItems]);
    const requestDeleteConfirmation = useCallback(async (proveedor) => { if (!proveedor || !proveedor.idProvider) return; const checkToastId = toast.loading('Verificando compras...'); try { const isAssociated = await proveedorService.isProviderAssociatedWithPurchases(proveedor.idProvider); toast.dismiss(checkToastId); if (isAssociated) { toast.error(`"${proveedor.company}" no se puede eliminar, tiene compras registradas.`, { duration: 6000 }); return; } prepareActionConfirmation(() => executeDelete(proveedor), { title: "Confirmar Eliminación", message: ( <> <p>¿Eliminar permanentemente al proveedor <strong>{proveedor.company}</strong>?</p> <p><strong className="text-danger">¡Esta acción es irreversible!</strong></p> </> ), confirmText: "Eliminar Definitivamente", confirmColor: "danger", }); } catch (error) { toast.dismiss(checkToastId); toast.error(`Error verificando asociaciones: ${error.response?.data?.message || error.message}`); } }, [prepareActionConfirmation, executeDelete]);

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

            {/* <-- CAMBIOS: Aplicados aquí para estandarizar la tabla --> */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover striped size="sm" className="mb-0 custom-table align-middle">
                    <thead className="table-light"> {/* De dark a light */}
                        <tr>
                            <th scope="col" className="text-center" style={{ width: '5%' }}>ID</th>
                            <th scope="col" style={{ width: '25%' }}>Empresa/Proveedor</th>
                            <th scope="col" style={{ width: '10%' }}>Tipo Doc.</th>
                            <th scope="col" style={{ width: '15%' }}>Documento</th>
                            <th scope="col" style={{ width: '10%' }}>Teléfono</th>
                            <th scope="col" style={{ width: '15%' }}>Email</th>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>Estado</th>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading && !initialDataLoaded ? (
                            <tr><td colSpan="8" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : isLoading && initialDataLoaded ? (
                            <tr><td colSpan="8" className="text-center p-3 text-muted"><Spinner size="sm" /> Actualizando...</td></tr>
                         ) : !isLoading && data.length === 0 && !tableSearchText && initialDataLoaded ? (
                            <tr><td colSpan="8" className="text-center fst-italic p-4">No hay proveedores registrados.</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idProvider}>
                                    <th scope="row" className="text-center">{item.idProvider}</th>
                                    <td>{item.company || '-'}</td>
                                    <td>{item.documentType || '-'}</td>
                                    <td>{item.document || '-'}</td>
                                    <td>{item.cellPhone || '-'}</td>
                                    <td>{item.email || '-'}</td>
                                    <td className="text-center">
                                        <Button size="sm" className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`} onClick={() => requestChangeStatusConfirmation(item)} disabled={isConfirmActionLoading || isSubmitting} title={item.status ? "Activo (Click para desactivar)" : "Inactivo (Click para activar)"}>
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            {/* <-- CAMBIO: color="info" para el botón azul de editar --> */}
                                            <Button size="sm" color="info" outline onClick={() => openEditModal(item)} title="Editar" className="action-button" disabled={isConfirmActionLoading || isSubmitting}><Edit size={18} /></Button>
                                            <Button size="sm" color="danger" outline onClick={() => requestDeleteConfirmation(item)} title="Eliminar" className="action-button" disabled={isConfirmActionLoading || isSubmitting}><Trash2 size={18} /></Button>
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

            {/* --- Paginación y Modales (sin cambios estructurales) --- */}
            { totalPages > 1 && initialDataLoaded && !isLoading && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="lg" backdrop="static" keyboard={!isSubmitting && !isConfirmActionLoading}>
                <ModalHeader toggle={!isSubmitting && !isConfirmActionLoading ? toggleMainModal : undefined}>
                    {isEditing ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
                </ModalHeader>
                <ModalBody>
                    {/* ... Contenido del modal ... */}
                    {formErrors.general && ( <div className="alert alert-danger py-2 small" role="alert"><AlertTriangle size={16} className="me-1"/> {formErrors.general}</div> )}
                    <Form id="providerForm" noValidate onSubmit={(e) => {e.preventDefault(); handleFormSubmit();}}>
                        {/* ... campos ... */}
                        <Row className="g-3">
                            <Col md={6}><FormGroup><Label for="company_modal">Nombre Empresa/Proveedor <span className="text-danger">*</span></Label><Input id="company_modal" name="company" value={form.company} onChange={handleInputChange} invalid={!!formErrors.company} /></FormGroup></Col>
                             <Col md={6}><FormGroup><Label for="document_type_modal">Tipo Documento <span className="text-danger">*</span></Label><Input id="document_type_modal" name="documentType" type="select" value={form.documentType} onChange={handleInputChange} invalid={!!formErrors.documentType}><option value="" disabled>Seleccione...</option>{TIPOS_DOCUMENTOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</Input><FormFeedback>{formErrors.documentType}</FormFeedback></FormGroup></Col>
                            <Col md={6}><FormGroup><Label for="document_modal">Documento <span className="text-danger">*</span></Label><Input id="document_modal" name="document" value={form.document} onChange={handleInputChange} invalid={!!formErrors.document} /><FormFeedback>{formErrors.document}</FormFeedback></FormGroup></Col>
                             <Col md={6}><FormGroup><Label for="cellphone_modal">Teléfono/Celular <span className="text-danger">*</span></Label><Input id="cellphone_modal" name="cellPhone" type="tel" value={form.cellPhone} onChange={handleInputChange} invalid={!!formErrors.cellPhone} /><FormFeedback>{formErrors.cellPhone}</FormFeedback></FormGroup></Col>
                            <Col md={6}><FormGroup><Label for="email_modal">Correo Electrónico (Opcional)</Label><Input id="email_modal" name="email" type="email" value={form.email} onChange={handleInputChange} invalid={!!formErrors.email} /><FormFeedback>{formErrors.email}</FormFeedback></FormGroup></Col>
                            <Col md={6}><FormGroup><Label for="address_modal">Dirección (Opcional)</Label><Input id="address_modal" name="address" value={form.address} onChange={handleInputChange} invalid={!!formErrors.address} /><FormFeedback>{formErrors.address}</FormFeedback></FormGroup></Col>
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