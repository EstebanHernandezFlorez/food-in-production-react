// src/components/Empleado/Empleados.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css";
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, FormFeedback
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import empleadoService from '../../services/empleadoService';
import CustomPagination from '../../General/CustomPagination';

// --- Confirmation Modal (sin cambios) ---
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
                {isConfirming ? (<><Spinner size="sm" className="me-1"/> Procesando...</>) : (confirmText)}
            </Button>
        </ModalFooter>
    </Modal>
);

// --- Detail Modal (sin cambios) ---
const DetailModal = ({ isOpen, toggle, title, item }) => (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
         <ModalHeader toggle={toggle}>
            <div className="d-flex align-items-center">
                <Eye size={20} className="me-2 text-info" />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>
            {item ? (
                <div className="employee-details">
                     <Row className="g-2 mb-2">
                        <Col sm={4} className="fw-bold">ID Empleado:</Col><Col sm={8}>{item.idEmployee}</Col>
                        <Col sm={4} className="fw-bold">Nombre Completo:</Col><Col sm={8}>{item.fullName}</Col>
                        <Col sm={4} className="fw-bold">Tipo Documento:</Col><Col sm={8}>{item.typeDocument}</Col>
                        <Col sm={4} className="fw-bold">Documento:</Col><Col sm={8}>{item.document}</Col>
                        <Col sm={4} className="fw-bold">Celular:</Col><Col sm={8}>{item.cellPhone}</Col>
                        <Col sm={4} className="fw-bold">Email:</Col><Col sm={8}>{item.email}</Col>
                        <Col sm={4} className="fw-bold">Fecha Ingreso:</Col><Col sm={8}>{item.dateOfEntry ? new Date(item.dateOfEntry).toLocaleDateString() : '-'}</Col>
                        <Col sm={4} className="fw-bold">Dirección:</Col><Col sm={8}>{item.Address || '-'}</Col>
                        <Col sm={4} className="fw-bold">Tipo Contrato:</Col><Col sm={8}>{item.contractType || '-'}</Col>
                        <Col sm={4} className="fw-bold">Tel. Emergencia:</Col><Col sm={8}>{item.emergencyContact || '-'}</Col>
                        <Col sm={4} className="fw-bold">Nombre Familiar:</Col><Col sm={8}>{item.nameFamilyMember || '-'}</Col>
                        <Col sm={4} className="fw-bold">Parentesco:</Col><Col sm={8}>{item.Relationship || '-'}</Col>
                        <Col sm={4} className="fw-bold">Tipo Sangre:</Col><Col sm={8}>{item.BloodType || '-'}</Col>
                        <Col sm={4} className="fw-bold">No. Seg. Social:</Col><Col sm={8}>{item.socialSecurityNumber || '-'}</Col>
                        <Col sm={4} className="fw-bold">Estado:</Col><Col sm={8}>{item.status ? <span className="badge bg-success">Activo</span> : <span className="badge bg-secondary">Inactivo</span>}</Col>
                    </Row>
                </div>
            ) : <p className="text-center text-muted">No hay detalles disponibles.</p>}
        </ModalBody>
        <ModalFooter><Button color="secondary" outline onClick={toggle}>Cerrar</Button></ModalFooter>
    </Modal>
);

// --- Constants ---
const getInitialFormState = () => ({
    idEmployee: '', fullName: '', typeDocument: '', document: '', cellPhone: '',
    email: '', dateOfEntry: '', Address: '', contractType: '', BloodType: '',
    socialSecurityNumber: '', emergencyContact: '', nameFamilyMember: '', Relationship: '',
    status: "true",
});
const getInitialFormErrors = () => ({
    fullName: '', typeDocument: '', document: '', cellPhone: '', email: '', dateOfEntry: '',
    Address: '', contractType: '', BloodType: '', socialSecurityNumber: '',
    emergencyContact: '', nameFamilyMember: '', Relationship: '', general: ''
});
const TIPOS_DOCUMENTOS_EMPLEADO = [
    { value: "CC", label: "Cédula de Ciudadanía" }, { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" }, { value: "PEP", label: "Permiso Especial de Permanencia" },
    { value: "RC", label: "Registro Civil" }, { value: "TI", label: "Tarjeta de Identidad" },
];
const TIPOS_SANGRE = [
    { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
    { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
];
const ITEMS_PER_PAGE = 7;

// --- Validation Helper (Frontend) ---
const validateEmployeeField = (fieldName, value, formState) => {
    switch (fieldName) {
        case 'fullName':
            if (!value.trim()) return "Nombre completo es obligatorio.";
            if (value.trim().length < 3 || value.trim().length > 60) return "Debe tener entre 3 y 60 caracteres.";
            if (!/^[a-zA-Z\sÁÉÍÓÚáéíóúñÑ'-]+$/.test(value.trim())) return "Nombre contiene caracteres no válidos.";
            return '';
        case 'typeDocument':
            return !value ? "Seleccione un tipo de documento." : '';
        case 'document':
            if (!value.trim()) return "Documento es obligatorio.";
            if (!/^[a-zA-Z0-9-]{5,20}$/.test(value.trim())) return "Documento: 5-20 alfanuméricos/guiones.";
            return '';
        case 'cellPhone':
            if (!value.trim()) return "Celular es obligatorio.";
            if (!/^\d{7,15}$/.test(value.trim())) return "Celular: 7-15 dígitos.";
            return '';
        case 'email':
            if (!value.trim()) return "Correo es obligatorio.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Formato de correo inválido.";
            return '';
        case 'dateOfEntry':
            if (!value) return "Fecha de ingreso es obligatoria.";
            // Ya no se valida que no sea futura
            return '';
        case 'Address':
            if (!value.trim()) return "Dirección es obligatoria.";
            if (value.trim().length > 100) return "Dirección: Máx 100 caracteres.";
            return '';
        case 'contractType':
            if (!value.trim()) return "Tipo de contrato es obligatorio.";
            if (value.trim().length > 50) return "Tipo contrato: Máx 50 caracteres.";
            return '';
        case 'BloodType':
            return !value ? "Seleccione un tipo de sangre." : '';
        case 'socialSecurityNumber':
            if (!value.trim()) return "No. Seguridad Social es obligatorio.";
            if (!/^[a-zA-Z0-9-]{5,20}$/.test(value.trim())) return "No. Seg. Social: 5-20 alfanuméricos/guiones.";
            return '';
        case 'emergencyContact':
            if (!value.trim()) return "Tel. emergencia es obligatorio.";
            if (!/^\d{7,15}$/.test(value.trim())) return "Tel. emergencia: 7-15 dígitos.";
            return '';
        case 'nameFamilyMember':
            if (!value.trim()) return "Nombre de familiar es obligatorio.";
            if (value.trim().length > 60) return "Nombre familiar: Máx 60 caracteres.";
            return '';
        case 'Relationship':
            if (!value.trim()) return "Parentesco es obligatorio.";
            if (value.trim().length > 50) return "Parentesco: Máx 50 caracteres.";
            return '';
        default:
            return '';
    }
};

const Empleados = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(getInitialFormState());
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState(getInitialFormErrors());
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({});
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);

    const confirmActionCallbackRef = useRef(null);

    const fetchData = useCallback(async (showSpinner = true) => {
        if (showSpinner) setIsLoading(true);
        try {
            const empleadosResponse = await empleadoService.getAllEmpleados();
            const empleados = Array.isArray(empleadosResponse) ? empleadosResponse : (empleadosResponse?.data || []);
            setData(empleados);
            if (!initialDataLoaded) setInitialDataLoaded(true);
        } catch (error) {
            toast.error(`Error al cargar empleados: ${error.response?.data?.message || error.message}`);
            setData([]);
        } finally {
            if (showSpinner) setIsLoading(false);
        }
    }, [initialDataLoaded]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetFormAndErrors = useCallback(() => {
        setForm(getInitialFormState());
        setFormErrors(getInitialFormErrors());
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        const newFormState = { ...form, [name]: value };
        setForm(newFormState);
        const errorMsg = validateEmployeeField(name, value, newFormState);
        setFormErrors(prev => ({ ...prev, [name]: errorMsg, general: '' }));
    }, [form]);

    const validateFullForm = useCallback(() => {
        let errors = { ...getInitialFormErrors(), general: '' };
        let isValid = true;
        let firstErrorMessage = '';
        for (const key in getInitialFormState()) {
            if (key === 'idEmployee' || key === 'status') continue;
            const error = validateEmployeeField(key, form[key], form);
            if (error) {
                errors[key] = error;
                isValid = false;
                if (!firstErrorMessage) firstErrorMessage = error;
            }
        }
        if (isValid && initialDataLoaded) {
            const documentLower = form.document.trim().toLowerCase();
            const typeDocument = form.typeDocument;
            const duplicate = data.find(emp => {
                const isDifferentEmployee = isEditing ? String(emp.idEmployee) !== String(form.idEmployee) : true;
                return isDifferentEmployee && emp.document && String(emp.document).toLowerCase() === documentLower && emp.typeDocument === typeDocument;
            });
            if (duplicate) {
                isValid = false;
                errors.document = `Este documento (${typeDocument}) ya está registrado.`;
                if (!firstErrorMessage) firstErrorMessage = errors.document;
            }
        }
        if (!isValid && !errors.general) errors.general = firstErrorMessage || "Corrija los campos marcados.";
        setFormErrors(errors);
        return isValid;
    }, [form, data, isEditing, initialDataLoaded]);

    const toggleMainModal = useCallback(() => setModalOpen(prev => { if (prev) { resetFormAndErrors(); setIsEditing(false); } return !prev; }), [resetFormAndErrors]);
    const openAddModal = useCallback(() => { setIsEditing(false); resetFormAndErrors(); setForm(prev => ({ ...getInitialFormState(), status: "true" })); setModalOpen(true); }, [resetFormAndErrors]);
    const openEditModal = useCallback((employee) => {
        setIsEditing(true); resetFormAndErrors();
        const entryDate = employee.dateOfEntry ? new Date(employee.dateOfEntry).toISOString().split('T')[0] : '';
        setForm({
            idEmployee: String(employee.idEmployee ?? ''), fullName: employee.fullName || '', typeDocument: employee.typeDocument || '',
            document: String(employee.document ?? ''), cellPhone: String(employee.cellPhone ?? ''), email: employee.email || '',
            dateOfEntry: entryDate, Address: employee.Address || '', contractType: employee.contractType || '',
            BloodType: employee.BloodType || '', socialSecurityNumber: String(employee.socialSecurityNumber ?? ''),
            emergencyContact: String(employee.emergencyContact ?? ''), nameFamilyMember: employee.nameFamilyMember || '',
            Relationship: employee.Relationship || '',
            status: employee.status !== undefined ? (employee.status ? "true" : "false") : "true",
        });
        setModalOpen(true);
    }, [resetFormAndErrors]);
    const openDetailModal = useCallback((employee) => { setSelectedItemForDetail(employee); setDetailModalOpen(true); }, []);
    const toggleDetailModal = useCallback(() => setDetailModalOpen(prev => !prev), []);

    const prepareActionConfirmation = useCallback((actionCb, modalDetails) => { confirmActionCallbackRef.current = actionCb; setConfirmModalProps(modalDetails); setConfirmModalOpen(true); }, []);
    const handleConfirmAction = useCallback(async () => {
        if (confirmActionCallbackRef.current) {
            setIsConfirmActionLoading(true);
            try { await confirmActionCallbackRef.current(); }
            catch (error) { console.error("Error during confirmed action:", error); }
            finally { setIsConfirmActionLoading(false); setConfirmModalOpen(false); }
        }
    }, []);

    const filteredData = useMemo(() => {
         if (!Array.isArray(data)) return [];

    // Crear una copia para no mutar el estado original 'data'
    let processedData = [...data];

    // Ordenar por idEmployee ASCENDENTE
    processedData.sort((a, b) => (a.idEmployee || 0) - (b.idEmployee || 0)); // <--- CAMBIO AQUÍ

    // Luego, aplicar el filtro si hay texto de búsqueda
    if (!tableSearchText) {
        return processedData; // Devuelve los datos ordenados si no hay búsqueda
    }

    const searchLower = tableSearchText.toLowerCase();
    return processedData.filter(item =>
        (item.fullName?.toLowerCase() || '').includes(searchLower) ||
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
    useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); else if (currentPage === 0 && totalPages > 0) setCurrentPage(1);}, [totalPages, currentPage]);
    const handlePageChange = useCallback((page) => { setCurrentPage(page); }, []);

    const handleFormSubmit = async () => {
        if (!validateFullForm()) { toast.error(formErrors.general || "Revise los campos."); return; }
        setIsSubmitting(true);
        const toastId = toast.loading(isEditing ? 'Actualizando...' : 'Agregando...');
        const { idEmployee, ...formData } = form;
        const payload = { ...formData, status: formData.status === "true" };
        try {
            if (isEditing) await empleadoService.updateEmpleado(idEmployee, payload);
            else await empleadoService.createEmpleado(payload);
            toast.success(isEditing ? 'Actualizado!' : 'Agregado!', { id: toastId });
            toggleMainModal(); await fetchData(false); setCurrentPage(isEditing ? validCurrentPage : 1);
        } catch (error) {
            const errorData = error.response?.data; let serverErrorMsg = "Error.";
            const newFormErrors = { ...getInitialFormErrors(), general: ''};
            if (errorData?.errors) { serverErrorMsg = errorData.errors[0]?.msg || "Validación falló."; errorData.errors.forEach(err => { if (err.path && !newFormErrors[err.path]) newFormErrors[err.path] = err.msg;});}
            else if (errorData?.message) { serverErrorMsg = errorData.message; if (serverErrorMsg.toLowerCase().includes('documento') && serverErrorMsg.toLowerCase().includes('ya existe')) newFormErrors.document = "Documento ya registrado.";}
            else if (error.message) serverErrorMsg = error.message;
            newFormErrors.general = serverErrorMsg; setFormErrors(newFormErrors);
            toast.error(`Error: ${newFormErrors.general || serverErrorMsg}`, { id: toastId });
        } finally { setIsSubmitting(false); }
    };
    const executeChangeStatus = useCallback(async (details) => {
        const { idEmployee, currentStatus, employeeName } = details; const newStatus = !currentStatus;
        const toastId = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} "${employeeName || ''}"...`);
        try { await empleadoService.changeStateEmpleado(idEmployee, newStatus); toast.success(`"${employeeName || ''}" ${newStatus ? 'activado' : 'desactivado'}.`, { id: toastId }); await fetchData(false); }
        catch (error) { toast.error(`Error: ${error.response?.data?.message || error.message}`, { id: toastId }); throw error; }
    }, [fetchData]);
    const requestChangeStatusConfirmation = useCallback((item) => {
        prepareActionConfirmation(() => executeChangeStatus({idEmployee: item.idEmployee, currentStatus: item.status, employeeName: item.fullName}), {
            title: `Confirmar ${item.status ? "Desactivación" : "Activación"}`, message: <p>¿{item.status ? "Desactivar" : "Activar"} a <strong>{item.fullName}</strong>?</p>,
            confirmText: item.status ? "Sí, desactivar" : "Sí, activar", confirmColor: item.status ? "warning" : "success",
        });
    }, [prepareActionConfirmation, executeChangeStatus]);
    const executeDelete = useCallback(async (employee) => {
        const { idEmployee, fullName } = employee; const toastId = toast.loading(`Eliminando "${fullName || ''}"...`);
        try { await empleadoService.deleteEmpleado(idEmployee); toast.success(`"${fullName || ''}" eliminado.`, { id: toastId });
            const itemsLeft = currentItems.length -1; const newTotal = totalItems -1;
            if (itemsLeft === 0 && currentPage > 1 && newTotal > 0) setCurrentPage(prev => prev -1);
            await fetchData(false);
        } catch (error) { toast.error(`Error: ${error.response?.data?.message || error.message}`, { id: toastId }); throw error; }
    }, [fetchData, currentPage, currentItems, totalItems]);
    const requestDeleteConfirmation = useCallback(async (employee) => {
        if (!employee?.idEmployee) return;
        prepareActionConfirmation(() => executeDelete(employee), {
            title: "Confirmar Eliminación", message: <><p>¿Eliminar a <strong>{employee.fullName}</strong>?</p><p className="text-danger">¡Acción irreversible!</p></>,
            confirmText: "Eliminar", confirmColor: "danger",
        });
    }, [prepareActionConfirmation, executeDelete]);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500, error: { duration: 5000 } }} />
            <h2 className="mb-4">Gestión de Empleados</h2>
            <Row className="mb-3 align-items-center">
                <Col md={6} lg={4}><Input type="text" bsSize="sm" placeholder="Buscar empleado..." value={tableSearchText} onChange={(e) => setTableSearchText(e.target.value)} disabled={isLoading && !initialDataLoaded} /></Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0"><Button color="success" size="sm" onClick={openAddModal} disabled={isLoading && !initialDataLoaded}><Plus size={18} className="me-1" /> Agregar Empleado</Button></Col>
            </Row>
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                <Table hover striped size="sm" className="mb-0 custom-table">
                    <thead className="table-dark">
                        <tr><th>ID</th><th>Nombre Completo</th><th>Tipo Doc.</th><th>Documento</th><th>Celular</th><th>Email</th><th className="text-center">Estado</th><th className="text-center" style={{minWidth: '130px'}}>Acciones</th></tr>
                    </thead>
                    <tbody>
                        {isLoading && !initialDataLoaded ? (<tr><td colSpan="8" className="text-center p-5"><Spinner /> Cargando...</td></tr>)
                         : isLoading && initialDataLoaded ? (<tr><td colSpan="8" className="text-center p-3 text-muted"><Spinner size="sm"/> Actualizando...</td></tr>)
                         : !isLoading && data.length === 0 && !tableSearchText ? (<tr><td colSpan="8" className="text-center fst-italic p-4">No hay empleados registrados.</td></tr>)
                         : currentItems.length > 0 ? (currentItems.map(item => (
                            <tr key={item.idEmployee}>
                                <td>{item.idEmployee}</td><td>{item.fullName}</td><td>{item.typeDocument}</td><td>{item.document}</td>
                                <td>{item.cellPhone}</td><td>{item.email}</td>
                                <td className="text-center"><Button size="sm" className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`} onClick={() => requestChangeStatusConfirmation(item)} disabled={isSubmitting || isConfirmActionLoading}>{item.status ? "Activo" : "Inactivo"}</Button></td>
                                <td className="text-center"><div className="d-inline-flex gap-1">
                                    <Button size="sm" color="info" outline onClick={() => openDetailModal(item)} title="Ver Detalles" disabled={isSubmitting || isConfirmActionLoading}><Eye size={16}/></Button>
                                    <Button size="sm" color="warning" outline onClick={() => openEditModal(item)} title="Editar" disabled={isSubmitting || isConfirmActionLoading}><Edit size={16}/></Button>
                                    <Button size="sm" color="danger" outline onClick={() => requestDeleteConfirmation(item)} title="Eliminar" disabled={isSubmitting || isConfirmActionLoading}><Trash2 size={16}/></Button>
                                </div></td>
                            </tr>
                         ))) : (<tr><td colSpan="8" className="text-center fst-italic p-4">No se encontraron empleados.</td></tr>)}
                    </tbody>
                </Table>
            </div>
            {totalPages > 1 && initialDataLoaded && !isLoading && (<CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />)}

            <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="xl" backdrop="static" keyboard={!isSubmitting && !isConfirmActionLoading}>
                <ModalHeader toggle={!isSubmitting && !isConfirmActionLoading ? toggleMainModal : undefined}>{isEditing ? 'Editar Empleado' : 'Agregar Empleado'}</ModalHeader>
                <ModalBody>
                    {formErrors.general && (<div className="alert alert-danger py-2 small"><AlertTriangle size={16} className="me-1"/> {formErrors.general}</div>)}
                    <Form id="employeeForm" noValidate onSubmit={(e) => {e.preventDefault(); handleFormSubmit();}}>
                        
                        {/* SECCIÓN 1: INFORMACIÓN PERSONAL Y LABORAL */}
                        <h5 className="mb-3 mt-2 text-primary">Información Personal y Laboral</h5>
                        <Row className="g-3 mb-4">
                            <Col md={6} lg={4}><FormGroup><Label for="fullName">Nombre Completo <span className="text-danger">*</span></Label><Input bsSize="sm" id="fullName" name="fullName" value={form.fullName} onChange={handleInputChange} invalid={!!formErrors.fullName} /><FormFeedback>{formErrors.fullName}</FormFeedback></FormGroup></Col>
                            <Col md={6} lg={4}><FormGroup><Label for="typeDocument">Tipo Documento <span className="text-danger">*</span></Label><Input bsSize="sm" id="typeDocument" name="typeDocument" type="select" value={form.typeDocument} onChange={handleInputChange} invalid={!!formErrors.typeDocument}><option value="" disabled>Seleccione...</option>{TIPOS_DOCUMENTOS_EMPLEADO.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</Input><FormFeedback>{formErrors.typeDocument}</FormFeedback></FormGroup></Col>
                            <Col md={6} lg={4}><FormGroup><Label for="document">Documento <span className="text-danger">*</span></Label><Input bsSize="sm" id="document" name="document" value={form.document} onChange={handleInputChange} invalid={!!formErrors.document} /><FormFeedback>{formErrors.document}</FormFeedback></FormGroup></Col>
                            <Col md={6} lg={4}><FormGroup><Label for="cellPhone">Celular <span className="text-danger">*</span></Label><Input bsSize="sm" id="cellPhone" name="cellPhone" type="tel" value={form.cellPhone} onChange={handleInputChange} invalid={!!formErrors.cellPhone} /><FormFeedback>{formErrors.cellPhone}</FormFeedback></FormGroup></Col>
                            <Col md={6} lg={4}><FormGroup><Label for="email">Correo <span className="text-danger">*</span></Label><Input bsSize="sm" id="email" name="email" type="email" value={form.email} onChange={handleInputChange} invalid={!!formErrors.email} /><FormFeedback>{formErrors.email}</FormFeedback></FormGroup></Col>
                            <Col md={6} lg={4}><FormGroup><Label for="dateOfEntry">Fecha Ingreso <span className="text-danger">*</span></Label><Input bsSize="sm" id="dateOfEntry" name="dateOfEntry" type="date" value={form.dateOfEntry} onChange={handleInputChange} invalid={!!formErrors.dateOfEntry} /><FormFeedback>{formErrors.dateOfEntry}</FormFeedback></FormGroup></Col>
                            <Col md={12}><FormGroup><Label for="Address">Dirección <span className="text-danger">*</span></Label><Input bsSize="sm" id="Address" name="Address" value={form.Address} onChange={handleInputChange} invalid={!!formErrors.Address} /><FormFeedback>{formErrors.Address}</FormFeedback></FormGroup></Col>
                            <Col md={6} lg={4}><FormGroup><Label for="contractType">Tipo Contrato <span className="text-danger">*</span></Label><Input bsSize="sm" id="contractType" name="contractType" value={form.contractType} onChange={handleInputChange} invalid={!!formErrors.contractType} /><FormFeedback>{formErrors.contractType}</FormFeedback></FormGroup></Col>
                            <Col md={6} lg={4}>
                                <FormGroup>
                                    <Label for="BloodType">Tipo Sangre <span className="text-danger">*</span></Label>
                                    <Input bsSize="sm" id="BloodType" name="BloodType" type="select" value={form.BloodType} onChange={handleInputChange} invalid={!!formErrors.BloodType}>
                                        <option value="" disabled>Seleccione...</option>
                                        {TIPOS_SANGRE.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                                    </Input>
                                    <FormFeedback>{formErrors.BloodType}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6} lg={4}><FormGroup><Label for="socialSecurityNumber">No. Seg. Social <span className="text-danger">*</span></Label><Input bsSize="sm" id="socialSecurityNumber" name="socialSecurityNumber" value={form.socialSecurityNumber} onChange={handleInputChange} invalid={!!formErrors.socialSecurityNumber} /><FormFeedback>{formErrors.socialSecurityNumber}</FormFeedback></FormGroup></Col>
                        </Row>

                        {/* SECCIÓN 2: CONTACTO DE EMERGENCIA */}
                        <hr />
                        <h5 className="mb-3 mt-4 text-primary">Contacto de Emergencia</h5>
                        <Row className="g-3">
                            <Col md={4}><FormGroup><Label for="nameFamilyMember">Nombre Familiar <span className="text-danger">*</span></Label><Input bsSize="sm" id="nameFamilyMember" name="nameFamilyMember" value={form.nameFamilyMember} onChange={handleInputChange} invalid={!!formErrors.nameFamilyMember} /><FormFeedback>{formErrors.nameFamilyMember}</FormFeedback></FormGroup></Col>
                            <Col md={4}><FormGroup><Label for="Relationship">Parentesco <span className="text-danger">*</span></Label><Input bsSize="sm" id="Relationship" name="Relationship" value={form.Relationship} onChange={handleInputChange} invalid={!!formErrors.Relationship} /><FormFeedback>{formErrors.Relationship}</FormFeedback></FormGroup></Col>
                            <Col md={4}><FormGroup><Label for="emergencyContact">Tel. Emergencia <span className="text-danger">*</span></Label><Input bsSize="sm" id="emergencyContact" name="emergencyContact" type="tel" value={form.emergencyContact} onChange={handleInputChange} invalid={!!formErrors.emergencyContact} /><FormFeedback>{formErrors.emergencyContact}</FormFeedback></FormGroup></Col>
                        </Row>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={toggleMainModal} disabled={isSubmitting || isConfirmActionLoading}>Cancelar</Button>
                    <Button form="employeeForm" type="submit" color="primary" disabled={isSubmitting || isConfirmActionLoading}>{isSubmitting ? <><Spinner size="sm"/> Procesando...</> : (isEditing ? 'Guardar Cambios' : 'Agregar Empleado')}</Button>
                </ModalFooter>
            </Modal>
            <ConfirmationModal isOpen={confirmModalOpen} toggle={() => !isConfirmActionLoading && setConfirmModalOpen(false)} title={confirmModalProps.title || "Confirmar"} onConfirm={handleConfirmAction} confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor} isConfirming={isConfirmActionLoading}>{confirmModalProps.message}</ConfirmationModal>
            <DetailModal isOpen={detailModalOpen} toggle={toggleDetailModal} title="Detalles del Empleado" item={selectedItemForDetail} />
        </Container>
    );
};

export default Empleados;