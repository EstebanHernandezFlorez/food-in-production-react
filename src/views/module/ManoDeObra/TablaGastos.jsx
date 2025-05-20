// src/components/TablaGastos/TablaGastos.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/App.css'; // Asegúrate que la ruta es correcta
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label, FormFeedback,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import { 
    Edit, Trash2, Plus, AlertTriangle, CheckCircle, XCircle, Save, Users, 
    ListChecks, Settings, SlidersHorizontal // Asegúrate de importar todos los iconos necesarios
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Import ---
import ExpenseTypeService from "../../services/ExpenseType"; // Corregido

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination'; // Ajusta la ruta
import { ConfirmationModal } from '../../General/ConfirmationModal'; // Ajusta la ruta

// --- Constants ---
const INITIAL_FORM_STATE = {
    idExpenseType: null,
    name: '',
    description: '',
    // isBimonthly: false, // Eliminado si no es parte de tu modelo ExpenseType
    status: true
};
const INITIAL_FORM_ERRORS = { name: null, description: null };
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null, isOpen: false, isConfirming: false };
const ITEMS_PER_PAGE = 7;

const TablaGastos = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS); // Usar INITIAL_CONFIRM_PROPS
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false); // Se maneja dentro de confirmModalProps

    const [gastosDropdownOpen, setGastosDropdownOpen] = useState(false);

    const confirmActionRef = useRef(null);
    const navigate = useNavigate();

    const toggleGastosDropdown = () => setGastosDropdownOpen(prevState => !prevState);

    // --- Navegaciones ---

    
    const navigateToManageExpenseTypes = useCallback(() => {
        navigate('/home/conceptos-gasto'); 
    }, [navigate]);

    const navigateToMonthlyExpenses = useCallback(() => { 
        navigate('/home/mano-de-obra'); // O tu ruta principal para registrar gastos mensuales
    }, [navigate]);

    const navigateToEmployees = useCallback(() => {
        navigate('/home/rendimiento-empleado');
    }, [navigate]);

    const navigateToManageSpecificConcepts = useCallback(() => {
        navigate('/home/gestion-conceptos-especificos');
    }, [navigate]);

    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoadingTable(true);
        try {
            const concepts = await ExpenseTypeService.getAllExpenseTypes();
            setData(Array.isArray(concepts) ? concepts : []);
        } catch (error) {
            console.error("Error fetching expense type data:", error);
            toast.error("Error al cargar los tipos de gasto.");
            setData([]);
        } finally {
             if (showLoadingSpinner) setIsLoadingTable(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);
    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    const validateForm = useCallback(() => {
        const errors = { name: null, description: null };
        let isValid = true;
        if (!form.name || !form.name.trim()) {
            errors.name = 'El nombre es obligatorio.';
            isValid = false;
        }
        // La descripción puede ser opcional, ajusta si es necesario
        // if (!form.description || !form.description.trim()) {
        //     errors.description = 'La descripción es obligatoria.';
        //     isValid = false;
        // }
        setFormErrors(errors);
        return isValid;
    }, [form]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const inputValue = type === 'checkbox' ? checked : value;
        setForm(prevForm => ({ ...prevForm, [name]: inputValue }));
        if (formErrors[name]) {
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: null }));
        }
    }, [formErrors]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value);
        setCurrentPage(1);
    }, []);

    const toggleMainModal = useCallback(() => {
        const closing = modalOpen;
        setModalOpen(prev => !prev);
        if (closing) {
            resetForm();
            clearFormErrors();
            setIsEditing(false);
        }
    }, [modalOpen, resetForm, clearFormErrors]);

    const closeConfirmModal = useCallback(() => {
        if (confirmModalProps.isConfirming) return;
        setConfirmModalProps(INITIAL_CONFIRM_PROPS);
    }, [confirmModalProps.isConfirming]);


    const prepareConfirmation = useCallback((actionFn, props) => {
        // const detailsToPass = props.itemDetails; // No es necesario si actionFn ya tiene el item
        confirmActionRef.current = actionFn; // Guardar la función de acción directamente
        setConfirmModalProps({ ...props, isOpen: true, itemDetails: props.itemDetails }); // Asegurar que itemDetails se pasa
    }, []);


    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            toast.error("Por favor, complete los campos requeridos.", { icon: <XCircle className="text-danger" /> });
            return;
        }
        setIsSubmitting(true);
        const actionText = isEditing ? "Actualizando" : "Creando";
        const toastId = toast.loading(`${actionText} tipo de gasto...`);

        try {
            const payload = { ...form };
            // Eliminar isBimonthly si no existe en el backend para ExpenseType
            // delete payload.isBimonthly; 

            if (isEditing) {
                if (!payload.idExpenseType) throw new Error("ID del tipo de gasto no encontrado para actualizar.");
                await ExpenseTypeService.updateExpenseType(payload.idExpenseType, payload);
                toast.success("Tipo de gasto actualizado!", { id: toastId, icon: <CheckCircle className="text-success" /> });
            } else {
                delete payload.idExpenseType; // El backend asigna el ID al crear
                await ExpenseTypeService.createExpenseType(payload);
                toast.success("Tipo de gasto creado!", { id: toastId, icon: <CheckCircle className="text-success" /> });
            }
            toggleMainModal();
            await fetchData(false);
        } catch (error) {
            console.error(`Error ${actionText.toLowerCase()} tipo de gasto:`, error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al ${actionText.toLowerCase()}: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    }, [form, isEditing, validateForm, toggleMainModal, fetchData]);
    
    const executeConfirmedAction = async () => {
        if (confirmActionRef.current && confirmModalProps.itemDetails) {
            setConfirmModalProps(prev => ({ ...prev, isConfirming: true }));
            await confirmActionRef.current(confirmModalProps.itemDetails); // Pasar itemDetails a la acción
            // isConfirming se resetea en la acción o al cerrar
        } else {
            console.error("Error: Acción de confirmación o detalles del ítem no definidos.");
            toast.error("Error interno al procesar la acción.");
            closeConfirmModal();
        }
    };


    const requestChangeStatusConfirmation = useCallback((item) => {
        if (!item || item.idExpenseType == null) return;
        const { idExpenseType, status: currentStatus, name } = item;
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";
        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: (<p>¿Seguro que desea <strong>{actionText}</strong> el tipo de gasto <strong>{name || 'seleccionado'}</strong>?<br/>Nuevo estado: <strong>{futureStatusText}</strong>.</p>),
            confirmText: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: confirmColor,
            itemDetails: { idExpenseType, currentStatus, name } // Pasar itemDetails aquí
        });
    }, [prepareConfirmation]);

    const executeChangeStatus = useCallback(async (details) => {
        if (!details || details.idExpenseType == null) {
            toast.error("Error interno: Detalles no encontrados."); 
            setConfirmModalProps(prev => ({ ...prev, isConfirming: false, isOpen: false })); // Cerrar y resetear
            return;
        }
        const { idExpenseType, currentStatus, name } = details;
        const newStatus = !currentStatus;
        const actionText = currentStatus ? "desactivar" : "activar";
        // isConfirming ya está en true desde executeConfirmedAction
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo tipo de gasto...`);
        try {
            await ExpenseTypeService.changeStateExpenseType(idExpenseType, newStatus);
            toast.success(`Tipo de gasto "${name || ''}" ${newStatus ? 'activado' : 'desactivado'}.`, { id: toastId, icon: <CheckCircle /> });
            await fetchData(false); // Actualizar datos de la tabla
        } catch (error) {
            console.error(`Error al ${actionText} tipo de gasto:`, error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS); // Resetear completamente
        }
    }, [fetchData]);

    const requestDeleteConfirmation = useCallback((item) => {
        if (!item || item.idExpenseType == null) return;
        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: (<><p>¿Seguro que desea eliminar permanentemente el tipo de gasto <strong>{item.name || 'seleccionado'}</strong>?</p><p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p></>),
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: { ...item } // Pasar itemDetails aquí
        });
    }, [prepareConfirmation]);

    const executeDelete = useCallback(async (itemToDelete) => {
        if (!itemToDelete || itemToDelete.idExpenseType == null) {
            toast.error("Error interno: Datos para eliminar no encontrados."); 
            setConfirmModalProps(prev => ({ ...prev, isConfirming: false, isOpen: false }));
            return;
        }
        // isConfirming ya está en true
        const toastId = toast.loading('Eliminando tipo de gasto...');
        try {
            await ExpenseTypeService.deleteExpenseType(itemToDelete.idExpenseType);
            toast.success(`Tipo de gasto "${itemToDelete.name}" eliminado.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            await fetchData(false); // Actualizar datos
        } catch (error) {
            console.error("Error al eliminar tipo de gasto:", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
        }
    }, [fetchData]);

    const openAddModal = useCallback(() => {
        resetForm(); clearFormErrors(); setIsEditing(false); setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((item) => {
        setForm({
            idExpenseType: item.idExpenseType ?? null,
            name: item.name || '',
            description: item.description || '',
            // isBimonthly: item.isBimonthly || false, // Si no lo usas, elimínalo
            status: item.status !== undefined ? item.status : true,
        });
        setIsEditing(true); clearFormErrors(); setModalOpen(true);
    }, [clearFormErrors]);

    const filteredData = useMemo(() => {
         const sortedData = [...data].sort((a, b) => (b.idExpenseType || 0) - (a.idExpenseType || 0));
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedData;
        return sortedData.filter(item =>
            item && (
                (item.name || '').toLowerCase().includes(lowerSearchText) ||
                (item.description || '').toLowerCase().includes(lowerSearchText) ||
                 String(item.idExpenseType || '').toLowerCase().includes(lowerSearchText)
            )
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages || 1)));
    }, [totalPages]);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
             <h2 className="mb-4">Administrar Tipos de Gasto Generales</h2>
             <Row className="mb-3 align-items-center">
                 <Col md={5} lg={4}>
                    <Input
                        bsSize="sm" type="text" placeholder="Buscar por nombre, descripción o ID..."
                        value={tableSearchText} onChange={handleTableSearch}
                        aria-label="Buscar tipos de gasto"
                    />
                </Col>
                 <Col md={7} lg={8} className="text-md-end mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-2">
                     <Button color="info" outline size="sm" onClick={navigateToEmployees} title="Ir a Empleados">
                         <Users size={16} className="me-1" /> Empleados
                     </Button>
                    <Dropdown isOpen={gastosDropdownOpen} toggle={toggleGastosDropdown} size="sm">
                        <DropdownToggle caret color="secondary" outline>
                            <ListChecks size={16} className="me-1" /> Configurar Gastos
                        </DropdownToggle>
                        <DropdownMenu end>
                            <DropdownItem header>Administración de Conceptos</DropdownItem>
                            <DropdownItem onClick={navigateToManageExpenseTypes}>
                                <SlidersHorizontal size={16} className="me-2 text-muted" />Gestionar Gastos
                            </DropdownItem>
                            <DropdownItem onClick={navigateToManageSpecificConcepts}>
                                <Settings size={16} className="me-2 text-muted" />Gestionar Conceptos Específicos
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                     <Button color="success" size="sm" onClick={openAddModal} className="button-add">
                        <Plus size={18} className="me-1" /> Agregar Tipo de Gasto
                    </Button>

                    <Button color="success" outline size="sm" onClick={navigateToMonthlyExpenses} title="Ir a registro mensual">
                        <Users size={16} className="me-1" /> Crear Registro Mensual
                    </Button>
                </Col>
            </Row>
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                    <thead className="table-dark">
                        <tr>
                            <th scope="col" style={{ width: '10%' }}>ID</th>
                            <th scope="col">Nombre Tipo Gasto</th>
                            <th scope="col">Descripción</th>
                            {/* <th scope="col" style={{ width: '10%' }} className="text-center">Bimestral</th> */}
                            <th scope="col" style={{ width: '10%' }} className="text-center">Estado</th>
                            <th scope="col" style={{ width: '15%' }} className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingTable ? (
                            <tr><td colSpan="5" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idExpenseType} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{item.idExpenseType}</th>
                                    <td>{item.name || '-'}</td>
                                    <td>{item.description || '-'}</td>
                                    {/* <td className="text-center">{item.isBimonthly ? 'Sí' : 'No'}</td> */}
                                    <td className="text-center">
                                        <Button
                                            outline color={item.status ? "success" : "secondary"}
                                            size="sm" className="p-1"
                                            onClick={() => requestChangeStatusConfirmation(item)}
                                            disabled={item.idExpenseType == null || confirmModalProps.isConfirming}
                                            title={item.status ? "Activo (Clic para inactivar)" : "Inactivo (Clic para activar)"}
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1 action-cell-content">
                                            <Button color="warning" outline size="sm" onClick={() => openEditModal(item)} title="Editar Tipo de Gasto" className="p-1" disabled={item.idExpenseType == null || confirmModalProps.isConfirming}>
                                                <Edit size={14} />
                                            </Button>
                                            <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(item)} title="Eliminar Tipo de Gasto" className="p-1" disabled={item.idExpenseType == null || confirmModalProps.isConfirming}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center fst-italic p-4">
                                {tableSearchText ? 'No se encontraron tipos de gasto.' : 'No hay tipos de gasto registrados.'}
                                {!isLoadingTable && data.length === 0 && !tableSearchText && (
                                    <span className="d-block mt-2">Aún no hay tipos de gasto. <Button size="sm" color="link" onClick={openAddModal} className="p-0 align-baseline">Agregar el primero</Button></span>
                                )}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>
             {!isLoadingTable && totalPages > 1 && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
             )}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered backdrop="static" keyboard={!isSubmitting}>
                <ModalHeader toggle={!isSubmitting ? toggleMainModal : undefined}>
                     <Settings size={20} className="me-2" /> {isEditing ? 'Editar Tipo de Gasto' : 'Agregar Nuevo Tipo de Gasto'}
                </ModalHeader>
                <ModalBody>
                    {formErrors.api && <Alert color="danger" size="sm">{formErrors.api}</Alert>} {/* Para errores generales del API */}
                     <Form id="expenseTypeForm" noValidate onSubmit={(e) => e.preventDefault()}>
                        <FormGroup>
                            <Label for="name" className="form-label fw-bold">Nombre Tipo Gasto <span className="text-danger">*</span></Label>
                            <Input id="name" bsSize="sm" type="text" name="name" value={form.name} onChange={handleChange} invalid={!!formErrors.name} required disabled={isSubmitting} />
                            <FormFeedback>{formErrors.name}</FormFeedback>
                        </FormGroup>
                        <FormGroup>
                            <Label for="description" className="form-label">Descripción</Label> {/* No obligatorio */}
                            <Input id="description" bsSize="sm" type="textarea" name="description" value={form.description} onChange={handleChange} rows={3} invalid={!!formErrors.description} disabled={isSubmitting} />
                            <FormFeedback>{formErrors.description}</FormFeedback>
                        </FormGroup>
                        {/* 
                        <FormGroup check className="mb-3">
                             <Input type="checkbox" name="isBimonthly" id="isBimonthlyModal" checked={form.isBimonthly} onChange={handleChange} disabled={isSubmitting} className="form-check-input" />
                            <Label htmlFor="isBimonthlyModal" check className="form-check-label">Es Gasto Bimestral</Label>
                        </FormGroup> 
                        */}
                        {!isEditing && (
                            <FormGroup check>
                                <Input type="checkbox" name="status" id="statusModal" checked={form.status} onChange={handleChange} disabled={isSubmitting} />
                                <Label htmlFor="statusModal" check>Activo</Label>
                            </FormGroup>
                        )}
                    </Form>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={toggleMainModal} disabled={isSubmitting}>Cancelar</Button>
                     <Button color="primary" onClick={handleSubmit} disabled={isSubmitting}>
                         {isSubmitting ? <><Spinner size="sm" className="me-1"/> {isEditing ? 'Actualizando...' : 'Guardando...'}</>
                            : <><Save size={16} className="me-1"/> {isEditing ? 'Guardar Cambios' : 'Agregar Tipo Gasto'}</>
                         }
                    </Button>
                </ModalFooter>
            </Modal>
            <ConfirmationModal 
                isOpen={confirmModalProps.isOpen} 
                toggle={closeConfirmModal} 
                title={confirmModalProps.title} 
                onConfirm={executeConfirmedAction} 
                confirmText={confirmModalProps.confirmText} 
                confirmColor={confirmModalProps.confirmColor} 
                isConfirming={confirmModalProps.isConfirming}
            >
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default TablaGastos;