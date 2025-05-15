import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../assets/css/App.css"; // Asegúrate que la ruta es correcta y contiene estilos necesarios
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert, FormFeedback
} from 'reactstrap';
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'; // Iconos lucide
import toast, { Toaster } from 'react-hot-toast';

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

// --- Constantes para Insumos ---
const API_BASE_URL = 'http://localhost:3000';
const LOG_PREFIX = "[Insumos]";

const INITIAL_FORM_STATE = {
    idSupplier: '',
    supplierName: '',
    measurementUnit: '', // Guarda el 'value' (ej: 'kg')
    status: true,
};

const INITIAL_FORM_ERRORS = {
    supplierName: false,
    measurementUnit: false,
    general: '',
};

const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null,
};

const ITEMS_PER_PAGE = 7; // O el que prefieras

// --- Main Component ---
const Insumos = () => {
    // --- State ---
    const [data, setData] = useState([]);
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
    const [isSavingForm, setIsSavingForm] = useState(false);

    // --- Refs ---
    const confirmActionRef = useRef(null);

    // --- Opciones Unidad de Medida ---
    const measurementUnits = useMemo(() => [
        { value: 'kg', label: 'Kilogramos' }, { value: 'g', label: 'Gramos' }, { value: 'mg', label: 'Miligramos' },
        { value: 'lb', label: 'Libras' }, { value: 'oz', label: 'Onzas' }, { value: 'L', label: 'Litros' },
        { value: 'mL', label: 'Mililitros' }, { value: 'gal', label: 'Galones' }, { value: 'm', label: 'Metros' },
        { value: 'cm', label: 'Centímetros' }, { value: 'mm', label: 'Milímetros' }, { value: 'unidad', label: 'Unidad(es)' },
        { value: 'docena', label: 'Docena(s)' },
    ], []);
    const measurementUnitMap = useMemo(() => {
        const map = {};
        measurementUnits.forEach(unit => { map[unit.value] = unit.label; });
        return map;
    }, [measurementUnits]);

    // --- Función Helper para label de unidad ---
    const getUnitLabel = useCallback((value) => {
        return measurementUnitMap[value] || value || '-';
    }, [measurementUnitMap]);

    // ***** INICIO: LÓGICA DE FILTRADO Y PAGINACIÓN (declarada ANTES) *****
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        const search = tableSearchText;
        return data.filter(item =>
            (item?.supplierName?.toLowerCase() ?? '').includes(search) ||
            (item?.measurementUnit?.toLowerCase() ?? '').includes(search) ||
            (getUnitLabel(item?.measurementUnit)?.toLowerCase() ?? '').includes(search) ||
            (String(item?.idSupplier ?? '').toLowerCase()).includes(search)
        );
    }, [data, tableSearchText, getUnitLabel]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);
    // ***** FIN: LÓGICA DE FILTRADO Y PAGINACIÓN *****

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        console.log(`${LOG_PREFIX} [FETCH] Fetching suppliers...`);
        try {
            const response = await axios.get(`${API_BASE_URL}/supplier`);
            setData(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(`${LOG_PREFIX} [FETCH ERROR]`, error);
            toast.error("Error al cargar insumos.");
            setData([]);
        } finally {
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, []); // Sin dependencias externas

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Llama a fetchData al montar

    // --- Form Helper Functions ---
    const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);
    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    // --- VALIDACIÓN (Restaurada y usando booleanos) ---
    const validateForm = useCallback(() => {
        const errors = { ...INITIAL_FORM_ERRORS }; // Resetea a false
        let isValid = true;
        errors.general = '';
        const trimmedName = String(form.supplierName ?? '').trim();

        if (!trimmedName) { errors.supplierName = true; isValid = false; }
        else if (trimmedName.length < 3) { errors.supplierName = true; isValid = false; }
        else if (!/^[a-zA-Z0-9\s]+$/.test(trimmedName)) { errors.supplierName = true; isValid = false; }

        if (!form.measurementUnit) { errors.measurementUnit = true; isValid = false; }

        setFormErrors(errors); // Actualiza estado de errores
        if (!isValid) {
            toast.error("Revise los campos marcados."); // Notificación si hay error
        }
        return isValid;
    }, [form]); // Depende del formulario

    // --- Event Handlers ---
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        // Limpia error específico al cambiar
        if (formErrors[name]) {
            setFormErrors(prevErr => ({ ...prevErr, [name]: false, general: '' }));
        }
    }, [formErrors]); // Depende de formErrors para limpiar

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1);
    }, []); // Sin dependencias

    const handlePageChange = useCallback((pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]); // Depende de totalPages

    // --- Modal Toggles ---
    const toggleMainModal = useCallback(() => {
        const closing = modalOpen;
        setModalOpen(prev => !prev);
        if (closing) { resetForm(); clearFormErrors(); setIsEditing(false); }
    }, [modalOpen, resetForm, clearFormErrors]);

    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return;
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    // --- Effect to Reset Confirmation Modal State ---
     useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    // --- Confirmation Preparation ---
    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
            if (actionFn) { actionFn(detailsToPass); }
            else { toast.error("Error interno."); toggleConfirmModal(); }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]); // toggleConfirmModal es estable

    // --- CRUD Operations ---

    // SUBMIT (Agregar/Editar)
    const handleSubmit = useCallback(async () => {
        // *** LLAMA A LA VALIDACIÓN ***
        if (!validateForm()) return;

        setIsSavingForm(true);
        const actionText = isEditing ? 'Actualizando' : 'Agregando';
        const toastId = toast.loading(`${actionText} insumo...`);
        try {
            const url = isEditing ? `${API_BASE_URL}/supplier/${form.idSupplier}` : `${API_BASE_URL}/supplier`;
            const method = isEditing ? 'put' : 'post';
            const dataToSend = {
                supplierName: form.supplierName.trim(),
                measurementUnit: form.measurementUnit,
            };
            if (!isEditing) { dataToSend.status = true; }
            else if (!form.idSupplier) { throw new Error("ID no encontrado para actualizar."); }

            await axios({ method, url, data: dataToSend });
            toast.success(`Insumo ${isEditing ? 'actualizado' : 'agregado'}!`, { id: toastId });
            toggleMainModal();
            await fetchData(false); // Refresca datos sin spinner principal
            setCurrentPage(1);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            setFormErrors(prev => ({ ...prev, general: `Error: ${errorMsg}` })); // Muestra error general en alert
            toast.error(`Error al ${actionText.toLowerCase()}: ${errorMsg}`, { id: toastId, duration: 5000 });
        } finally { setIsSavingForm(false); }
    // Asegúrate de incluir todas las dependencias necesarias
    }, [form, isEditing, validateForm, toggleMainModal, fetchData]);

    // CAMBIAR ESTADO (Solicitud)
    const requestChangeStatusConfirmation = useCallback((insumo) => {
        if (!insumo || !insumo.idSupplier) return;
        const { idSupplier, status: currentStatus, supplierName } = insumo;
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";
        // *** LLAMA A prepareConfirmation ***
        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: <p>¿<strong>{actionText}</strong> el insumo <strong>{supplierName || 'seleccionado'}</strong>? <br /> Estado será: <strong>{futureStatusText}</strong>.</p>,
            confirmText: `Sí, ${actionText}`, confirmColor,
            itemDetails: { idSupplier, currentStatus, supplierName }
        });
    }, [prepareConfirmation]); // Depende de prepareConfirmation

    // CAMBIAR ESTADO (Ejecución)
    const executeChangeStatus = useCallback(async (details) => {
        if (!details || !details.idSupplier) { toast.error("Error interno."); toggleConfirmModal(); return; }
        const { idSupplier, currentStatus, supplierName } = details;
        const newStatus = !currentStatus;
        const actionText = newStatus ? "activado" : "desactivado";
        // *** MANEJA ESTADO DE CARGA ***
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${currentStatus ? 'Desactivando' : 'Activando'}...`);
        try {
            await axios.patch(`${API_BASE_URL}/supplier/${idSupplier}`, { status: newStatus });

            // Actualización optimista
             setData(prevData => {
                const newData = prevData.map(item =>
                    item.idSupplier === idSupplier ? { ...item, status: newStatus } : item
                );
                 return newData;
             });

            toast.success(`Insumo "${supplierName || ''}" ${actionText}.`, { id: toastId });
            toggleConfirmModal(); // Cierra modal de confirmación
            // await fetchData(false); // Opcional si la optimista es suficiente

        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al ${currentStatus ? 'desactivar' : 'activar'}: ${errorMsg}`, { id: toastId });
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false); // Termina estado de carga
        }
    // Asegúrate de dependencias correctas
    }, [toggleConfirmModal /*, fetchData */]);

    // ELIMINAR (Solicitud)
    const requestDeleteConfirmation = useCallback((insumo) => {
        if (!insumo || !insumo.idSupplier) return;
        // *** LLAMA A prepareConfirmation ***
        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: (<><p>¿Eliminar <strong>{insumo.supplierName || 'este insumo'}</strong>?</p><p><strong className="text-danger">¡Acción irreversible!</strong></p></>),
            confirmText: "Eliminar Definitivamente", confirmColor: "danger",
            itemDetails: { ...insumo } // Pasa detalles completos
        });
    }, [prepareConfirmation]); // Depende de prepareConfirmation

    // ELIMINAR (Ejecución)
    const executeDelete = useCallback(async (insumoToDelete) => {
        if (!insumoToDelete || !insumoToDelete.idSupplier) { toast.error("Error interno."); toggleConfirmModal(); return; }
        // *** MANEJA ESTADO DE CARGA ***
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`Eliminando...`);
        try {
            await axios.delete(`${API_BASE_URL}/supplier/${insumoToDelete.idSupplier}`);
            toast.success(`Insumo "${insumoToDelete.supplierName || ''}" eliminado.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            toggleConfirmModal(); // Cierra modal de confirmación

            // Actualiza estado local y maneja paginación
            let newTotalItemsAfterDelete = 0;
            setData(prevData => {
                 const nextData = prevData.filter(item => item.idSupplier !== insumoToDelete.idSupplier);
                 // Calcula nuevo total filtrado
                 newTotalItemsAfterDelete = nextData.filter(item =>
                     (item?.supplierName?.toLowerCase() ?? '').includes(tableSearchText) ||
                     (item?.measurementUnit?.toLowerCase() ?? '').includes(tableSearchText) ||
                     (getUnitLabel(item?.measurementUnit)?.toLowerCase() ?? '').includes(tableSearchText) ||
                     (String(item?.idSupplier ?? '').toLowerCase()).includes(tableSearchText)
                 ).length;
                 return nextData;
            });

            // Ajusta paginación
            const newTotalPages = Math.ceil(newTotalItemsAfterDelete / ITEMS_PER_PAGE);
             if (currentPage > newTotalPages && newTotalPages > 0) {
                 setCurrentPage(newTotalPages);
             } else if (currentPage > 1 && newTotalItemsAfterDelete > 0 && newTotalItemsAfterDelete % ITEMS_PER_PAGE === 0 && newTotalItemsAfterDelete === (currentPage - 1) * ITEMS_PER_PAGE) {
                 setCurrentPage(currentPage - 1);
             } else if (newTotalItemsAfterDelete === 0) {
                 setCurrentPage(1);
             }
             // await fetchData(false); // Alternativa si el manejo de paginación es complejo

        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al eliminar: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" /> });
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false); // Termina estado de carga
        }
    // Dependencias actualizadas
    }, [toggleConfirmModal, currentPage, tableSearchText, getUnitLabel]);

    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm(); clearFormErrors(); setIsEditing(false); setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((insumo) => {
        setForm({
            idSupplier: insumo.idSupplier || '',
            supplierName: insumo.supplierName || '',
            measurementUnit: insumo.measurementUnit || '',
            status: insumo.status !== undefined ? insumo.status : true,
        });
        setIsEditing(true); clearFormErrors(); setModalOpen(true);
    }, [clearFormErrors]);

    // --- Effecto para ajustar página ---
     useEffect(() => {
         const calculatedTotalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
         if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
             setCurrentPage(calculatedTotalPages);
         } else if (currentItems.length === 0 && currentPage > 1) {
              setCurrentPage(prev => Math.max(1, calculatedTotalPages));
         }
     }, [filteredData.length, currentPage, currentItems.length]);


    // --- Render Logic Variables ---
    const modalTitle = isEditing ? `Editar Insumo` : "Agregar Nuevo Insumo";
    const submitButtonText = isSavingForm
        ? <><Spinner size="sm" className="me-1" /> Guardando...</>
        : (isEditing ? <><Edit size={18} className="me-1"/> Actualizar</> : <><Plus size={18} className="me-1"/> Guardar</>);
    const canSubmitForm = !isSavingForm;

    // --- JSX Structure (Con validaciones y confirmaciones funcionales) ---
    return (
        <Container fluid className="p-4 main-content">
             <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
            <h2 className="mb-4">Gestión de Insumos</h2>

            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input type="text" bsSize="sm" placeholder="Buscar por nombre, unidad o ID..." value={tableSearchText} onChange={handleTableSearch} disabled={isLoading && data.length === 0} style={{ borderRadius: '0.25rem' }} aria-label="Buscar insumos"/>
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add"> <Plus size={18} className="me-1" /> Agregar Insumo </Button>
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover striped size="sm" className="mb-0 custom-table align-middle">
                     <thead className="table-light">
                        <tr>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>ID</th>
                            <th scope="col" style={{ width: '40%' }}>Nombre Insumo</th>
                            <th scope="col" style={{ width: '20%' }}>Unidad Medida</th>
                            <th scope="col" className="text-center" style={{ width: '15%' }}>Estado</th>
                            <th scope="col" className="text-center" style={{ width: '15%' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading && data.length === 0 ? (
                            <tr><td colSpan="5" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idSupplier}>
                                    <th scope="row" className="text-center">{item.idSupplier}</th>
                                    <td>{item.supplierName || '-'}</td>
                                    <td>{getUnitLabel(item.measurementUnit)}</td>
                                    <td className="text-center">
                                        {/* BOTÓN DE ESTADO FUNCIONAL */}
                                        <Button size="sm" className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`} onClick={() => requestChangeStatusConfirmation(item)} disabled={isConfirmActionLoading} title={item.status ? "Activo (Desactivar)" : "Inactivo (Activar)"}>
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        {/* BOTONES DE ACCIÓN FUNCIONALES */}
                                        <div className="d-inline-flex gap-1 action-cell-content">
                                            <Button disabled={isConfirmActionLoading} size="sm" onClick={() => openEditModal(item)} title="Editar" className="action-button action-edit" color="secondary" outline> <Edit size={18} /> </Button>
                                            <Button disabled={isConfirmActionLoading} size="sm" onClick={() => requestDeleteConfirmation(item)} title="Eliminar" className="action-button action-delete" color="danger" outline> <Trash2 size={18} /> </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         ) : (
                            <tr><td colSpan="5" className="text-center fst-italic p-4"> {tableSearchText ? "No se encontraron insumos." : "No hay insumos registrados."} </td></tr>
                         )}
                          {isLoading && data.length > 0 && (
                              <tr><td colSpan="5" className="text-center p-2"><Spinner size="sm" color="secondary" /> Actualizando...</td></tr>
                         )}
                    </tbody>
                </Table>
            </div>

             { totalPages > 1 && !isLoading && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
             )}

            {/* MODAL DE FORMULARIO CON VALIDACIONES FUNCIONALES */}
            <Modal isOpen={modalOpen} toggle={!isSavingForm ? toggleMainModal : undefined} centered size="lg" backdrop="static" keyboard={!isSavingForm} aria-labelledby="insumoModalTitle">
                <ModalHeader toggle={!isSavingForm ? toggleMainModal : undefined} id="insumoModalTitle">
                    <div className="d-flex align-items-center">
                       {isEditing ? <Edit size={20} className="me-2"/> : <Plus size={20} className="me-2"/>}
                       {modalTitle}
                   </div>
                </ModalHeader>
                <ModalBody>
                    {formErrors.general && (
                         <Alert color="danger" fade={false} className="d-flex align-items-center py-2 mb-3">
                            <AlertTriangle size={18} className="me-2"/> {formErrors.general}
                         </Alert>
                     )}
                    <Form id="insumoForm" noValidate onSubmit={(e) => {e.preventDefault(); handleSubmit();}}>
                        <Row className="g-3">
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="modalSupplierName" className="form-label fw-bold">Nombre Insumo <span className="text-danger">*</span></Label>
                                    <Input
                                        id="modalSupplierName" type="text" name="supplierName"
                                        value={form.supplierName} onChange={handleChange}
                                        invalid={formErrors.supplierName} // Usa booleano
                                        required aria-describedby="supplierNameFeedback"
                                        disabled={isSavingForm} placeholder="Ej: Harina de Trigo"
                                    />
                                    <FormFeedback id="supplierNameFeedback">
                                        {formErrors.supplierName && "Nombre requerido (mín. 3 caracteres, letras/números/espacios)."}
                                    </FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="modalMeasurementUnit" className="form-label fw-bold">Unidad de Medida <span className="text-danger">*</span></Label>
                                    <Input
                                        id="modalMeasurementUnit" type="select" name="measurementUnit"
                                        value={form.measurementUnit} onChange={handleChange}
                                        invalid={formErrors.measurementUnit} // Usa booleano
                                        required aria-describedby="measurementUnitFeedback"
                                        disabled={isSavingForm}
                                    >
                                         <option value="" disabled>Seleccione...</option>
                                         {measurementUnits.map((unit) => (<option key={unit.value} value={unit.value}>{unit.label}</option>))}
                                    </Input>
                                    <FormFeedback id="measurementUnitFeedback">
                                        {formErrors.measurementUnit && "Seleccione una unidad de medida."}
                                    </FormFeedback>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
                </ModalBody>
                <ModalFooter className="border-top pt-3">
                     <Button color="secondary" outline onClick={toggleMainModal} disabled={isSavingForm}>Cancelar</Button>
                    {/* BOTÓN DE SUBMIT FUNCIONAL CON VALIDACIÓN */}
                    <Button type="submit" form="insumoForm" color="primary" disabled={!canSubmitForm} onClick={handleSubmit}>
                         {submitButtonText}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* MODAL DE CONFIRMACIÓN FUNCIONAL */}
            <ConfirmationModal
                isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title}
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()} // Llama a la acción guardada
                confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor}
                isConfirming={isConfirmActionLoading} // Muestra spinner si está cargando
            >
                {confirmModalProps.message}
            </ConfirmationModal>

        </Container>
    );
};

export default Insumos;