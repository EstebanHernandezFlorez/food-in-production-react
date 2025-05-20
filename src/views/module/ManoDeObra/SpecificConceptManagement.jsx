// src/components/SpecificConceptManagement/SpecificConceptManagement.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/App.css'; // Ajusta la ruta si es necesario
import '../../../assets/css/index.css'; // Ajusta la ruta si es necesario
import {
    Table, Button, Container, Row, Col, Input, FormGroup, Label, FormFeedback,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Card, CardBody, CardHeader,
    Form, Alert, InputGroup,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem 
} from 'reactstrap';
import { 
    Eye, Edit, Trash2, Plus, ArrowLeft, Save, ListFilter, XCircle, AlertTriangle, 
    CheckCircle, Settings, Info, SlidersHorizontal, Users, ListChecks 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components ---
import CustomPagination from '../../General/CustomPagination'; // Ajusta la ruta
import { ConfirmationModal } from '../../General/ConfirmationModal'; // Ajusta la ruta

// --- Services ---
import SpecificConceptSpentService from "../../services/SpecificConceptSpentService";
import ExpenseTypeService from "../../services/ExpenseType"; 

// --- Constants ---
const ITEMS_PER_PAGE = 10;
const INITIAL_FORM_STATE = {
    idExpenseType: '', 
    name: '',
    description: '',
    requiresEmployeeCalculation: false,
    status: true, 
};
const INITIAL_FORM_ERRORS = { idExpenseType: null, name: null, description: null, duplicateError: null };
const INITIAL_CONFIRM_PROPS = { isOpen: false, title: "", message: null, onConfirm: () => {}, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null, isConfirming: false };

const SpecificConceptManagement = () => {
    const [specificConcepts, setSpecificConcepts] = useState([]);
    const [expenseTypes, setExpenseTypes] = useState([]); 
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [isLoadingExpenseTypes, setIsLoadingExpenseTypes] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentConcept, setCurrentConcept] = useState(INITIAL_FORM_STATE);
    const [editingConceptId, setEditingConceptId] = useState(null);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [apiError, setApiError] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [gastosDropdownOpen, setGastosDropdownOpen] = useState(false);

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

    // --- Data Fetching ---
    const fetchSpecificConcepts = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoadingTable(true);
        try {
            const concepts = await SpecificConceptSpentService.getAllSpecificConceptSpents();
            setSpecificConcepts(Array.isArray(concepts) ? concepts : []);
        } catch (error) {
            console.error("Error fetching specific concepts:", error);
            toast.error(`Error al cargar conceptos específicos: ${error.message}`);
            setSpecificConcepts([]);
        } finally {
            if (showLoadingSpinner) setIsLoadingTable(false);
        }
    }, []);

    const fetchExpenseTypes = useCallback(async () => {
        setIsLoadingExpenseTypes(true);
        try {
            const types = await ExpenseTypeService.getAllExpenseTypes();
            setExpenseTypes(Array.isArray(types) ? types.filter(type => type.status) : []); 
        } catch (error) {
            console.error("Error fetching expense types:", error);
            toast.error(`Error al cargar tipos de gasto generales: ${error.message}`);
            setExpenseTypes([]);
        } finally {
            setIsLoadingExpenseTypes(false);
        }
    }, []);

    useEffect(() => {
        fetchSpecificConcepts();
        fetchExpenseTypes();
    }, [fetchSpecificConcepts, fetchExpenseTypes]);

    // --- Modal and Form Logic ---
    const resetForm = () => {
        setCurrentConcept(INITIAL_FORM_STATE);
        setFormErrors(INITIAL_FORM_ERRORS);
        setApiError(null);
        setIsEditing(false);
        setEditingConceptId(null);
    };

    const handleOpenModal = (conceptToEdit = null) => {
        resetForm();
        if (conceptToEdit) {
            setIsEditing(true);
            setEditingConceptId(conceptToEdit.idSpecificConcept);
            setCurrentConcept({
                idExpenseType: typeof conceptToEdit.idExpenseType === 'object' && conceptToEdit.idExpenseType !== null 
                                ? conceptToEdit.idExpenseType.idExpenseType?.toString() 
                                : conceptToEdit.idExpenseType?.toString() || '',
                name: conceptToEdit.name || '',
                description: conceptToEdit.description || '',
                requiresEmployeeCalculation: conceptToEdit.requiresEmployeeCalculation || false,
                status: conceptToEdit.status !== undefined ? conceptToEdit.status : true, 
            });
        } else {
            setIsEditing(false);
            setCurrentConcept(INITIAL_FORM_STATE); 
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;
        setModalOpen(false);
    };
    
    const handleFormChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        
        setCurrentConcept(prev => ({ ...prev, [name]: val }));
        if (formErrors[name] || formErrors.duplicateError) { // Limpiar error de duplicado también
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: null, duplicateError: null }));
        }
        if (apiError) setApiError(null);
    }, [formErrors, apiError]);

    const validateForm = useCallback(() => {
        const { name, idExpenseType } = currentConcept;
        const newErrors = { ...INITIAL_FORM_ERRORS }; 
        let isValid = true;

        if (!name.trim()) {
            newErrors.name = "El nombre es obligatorio.";
            isValid = false;
        } else if (name.trim().length < 3) {
            newErrors.name = "El nombre debe tener al menos 3 caracteres.";
            isValid = false;
        }

        if (!idExpenseType) {
            newErrors.idExpenseType = "Debe seleccionar un Tipo de Gasto General.";
            isValid = false;
        }
        
        if (name.trim() && idExpenseType) {
            const currentIdExpenseTypeStr = idExpenseType.toString();
            const isDuplicate = specificConcepts.some(concept => 
                concept.name.trim().toLowerCase() === name.trim().toLowerCase() &&
                (typeof concept.idExpenseType === 'object' && concept.idExpenseType !== null 
                    ? concept.idExpenseType.idExpenseType?.toString() === currentIdExpenseTypeStr
                    : concept.idExpenseType?.toString() === currentIdExpenseTypeStr) &&
                (!isEditing || concept.idSpecificConcept !== editingConceptId) 
            );
            if (isDuplicate) {
                newErrors.duplicateError = "Ya existe un concepto específico con este nombre para el tipo de gasto general seleccionado.";
                newErrors.name = " "; 
                isValid = false;
            }
        }

        setFormErrors(newErrors);
        return isValid;
    }, [currentConcept, specificConcepts, isEditing, editingConceptId]);

    const handleSubmit = async () => {
        if (!validateForm()) {
             if (formErrors.duplicateError) {
                toast.error(formErrors.duplicateError, { icon: <AlertTriangle className="text-danger" /> });
            } else {
                toast.error("Por favor, corrija los errores del formulario.", { icon: <XCircle className="text-danger" /> });
            }
            return;
        }
        setIsSubmitting(true);
        setApiError(null);
        const toastId = toast.loading(isEditing ? 'Actualizando concepto...' : 'Creando concepto...');

        const payload = {
            name: currentConcept.name.trim(),
            idExpenseType: parseInt(currentConcept.idExpenseType, 10),
            requiresEmployeeCalculation: currentConcept.requiresEmployeeCalculation,
            description: currentConcept.description.trim() || null,
        };
        if (!isEditing) {
            payload.status = currentConcept.status; 
        }

        try {
            if (isEditing && editingConceptId) {
                await SpecificConceptSpentService.updateSpecificConceptSpent(editingConceptId, payload);
            } else {
                await SpecificConceptSpentService.createSpecificConceptSpent(payload);
            }
            toast.success(`Concepto ${isEditing ? 'actualizado' : 'creado'} exitosamente.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            handleCloseModal();
            resetForm(); 
            await fetchSpecificConcepts(false); 
        } catch (error) {
            console.error("Error submitting concept:", error);
            const errorMessage = error.response?.data?.message || error.message || (isEditing ? "Error al actualizar." : "Error al crear.");
            setApiError(errorMessage); 
            toast.error(`Error: ${errorMessage}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Confirmation Modal Logic & Actions ---
    const closeConfirmModal = () => {
        if (confirmModalProps.isConfirming) return;
        setConfirmModalProps(INITIAL_CONFIRM_PROPS);
    };

    const executeConfirmedAction = async () => {
        if (confirmModalProps.onConfirm) {
            setConfirmModalProps(prev => ({ ...prev, isConfirming: true }));
            await confirmModalProps.onConfirm(confirmModalProps.itemDetails);
        }
    };
    
    const requestDeleteConfirmation = (concept) => {
        setConfirmModalProps({
            isOpen: true, title: "Confirmar Eliminación",
            message: ( <p> ¿Está seguro que desea eliminar el concepto específico "<strong>{concept.name}</strong>" (ID: {concept.idSpecificConcept})?<br/><strong className="text-danger">Esta acción no se puede deshacer.</strong><br/><small>Asegúrese de que este concepto no esté en uso en registros de gastos mensuales, o considere desactivarlo en su lugar.</small></p>),
            onConfirm: executeDelete, confirmText: "Sí, Eliminar", confirmColor: "danger",
            itemDetails: concept, isConfirming: false,
        });
    };

    const executeDelete = async (concept) => {
        const toastId = toast.loading(`Eliminando "${concept.name}"...`);
        try {
            await SpecificConceptSpentService.deleteSpecificConceptSpent(concept.idSpecificConcept);
            toast.success(`Concepto "${concept.name}" eliminado.`, { id: toastId, icon: <CheckCircle /> });
            await fetchSpecificConcepts(false);
        } catch (error) {
            console.error("Error deleting concept:", error);
            toast.error(`Error al eliminar: ${error.response?.data?.message || error.message || 'Error desconocido'}`, { id: toastId, icon: <XCircle className="text-danger"/> });
        } finally {
            closeConfirmModal(); 
        }
    };

    const requestChangeStatusConfirmation = (concept) => {
        const actionText = concept.status ? "desactivar" : "activar";
        const futureStatusText = concept.status ? "Inactivo" : "Activo";
        setConfirmModalProps({
            isOpen: true, title: "Confirmar Cambio de Estado",
            message: ( <p> ¿Está seguro que desea <strong>{actionText}</strong> el concepto "<strong>{concept.name}</strong>"?<br/>Su nuevo estado será: <strong>{futureStatusText}</strong>.</p>),
            onConfirm: executeChangeStatus, confirmText: `Sí, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: concept.status ? "warning" : "success", itemDetails: concept, isConfirming: false,
        });
    };

    const executeChangeStatus = async (concept) => {
        const newStatus = !concept.status;
        const actionText = concept.status ? "desactivando" : "activando";
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} "${concept.name}"...`);
        const originalConcepts = [...specificConcepts];
        setSpecificConcepts(prev => prev.map(item => 
            item.idSpecificConcept === concept.idSpecificConcept ? { ...item, status: newStatus } : item
        ));
        try {
            await SpecificConceptSpentService.changeStateSpecificConceptSpent(concept.idSpecificConcept, newStatus);
            toast.success(`Estado de "${concept.name}" actualizado a ${newStatus ? 'Activo' : 'Inactivo'}.`, { id: toastId, icon: <CheckCircle /> });
        } catch (error) {
            console.error("Error changing concept status:", error);
            toast.error(`Error al cambiar estado: ${error.response?.data?.message || error.message || 'Error desconocido'}`, { id: toastId, icon: <XCircle className="text-danger"/> });
            setSpecificConcepts(originalConcepts); 
        } finally {
            closeConfirmModal();
        }
    };
    
    // --- Search and Pagination ---
    const handleTableSearch = (e) => { setTableSearchText(e.target.value); setCurrentPage(1); };
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const filteredData = useMemo(() => {
        if (!Array.isArray(specificConcepts)) return [];
        const sortedData = [...specificConcepts].sort((a, b) => (b.idSpecificConcept || 0) - (a.idSpecificConcept || 0));
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedData;
        return sortedData.filter(concept =>
            (concept.name && concept.name.toLowerCase().includes(lowerSearchText)) ||
            (concept.description && concept.description.toLowerCase().includes(lowerSearchText)) ||
            (concept.ExpenseType && concept.ExpenseType.name && concept.ExpenseType.name.toLowerCase().includes(lowerSearchText)) || 
            (expenseTypes.find(et => {
                const conceptEtId = typeof concept.idExpenseType === 'object' && concept.idExpenseType !== null 
                                    ? concept.idExpenseType.idExpenseType 
                                    : concept.idExpenseType;
                return et.idExpenseType === parseInt(conceptEtId);
            })?.name.toLowerCase().includes(lowerSearchText))
        );
    }, [specificConcepts, expenseTypes, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const getExpenseTypeName = (idExpenseTypeParam) => {
        const idNum = parseInt( typeof idExpenseTypeParam === 'object' && idExpenseTypeParam !== null 
                                ? idExpenseTypeParam.idExpenseType 
                                : idExpenseTypeParam, 10);
        const type = expenseTypes.find(et => et.idExpenseType === idNum);
        return type ? type.name : 'Desconocido';
    };

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            
            <h2 className="mb-4">Gestión de Conceptos de Gasto Específicos</h2>

            <Row className="mb-3 align-items-center">
                <Col md={5} lg={4}>
                    <Input
                        bsSize="sm" type="text" placeholder="Buscar por nombre, descripción, tipo..."
                        value={tableSearchText} onChange={handleTableSearch}
                        aria-label="Buscar conceptos específicos"
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
                    
                    <Button color="primary" size="sm" onClick={() => handleOpenModal()} className="button-add">
                        <Plus size={18} className="me-1" /> Crear Concepto Específico
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
                            <th scope="col" style={{width: '5%'}}>ID</th>
                            <th scope="col" style={{width: '25%'}}>Nombre Concepto</th>
                            <th scope="col" style={{width: '20%'}}>Tipo Gasto General</th>
                            <th scope="col">Descripción</th>
                            <th scope="col" style={{width: '10%'}} className="text-center">Req. Cálculo Empleados</th>
                            <th scope="col" style={{width: '10%'}} className="text-center">Estado</th>
                            <th scope="col" style={{width: '15%'}} className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingTable ? (
                            <tr><td colSpan="7" className="text-center p-5"><Spinner color="primary" /> Cargando conceptos...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((concept) => (
                                <tr key={concept.idSpecificConcept} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{concept.idSpecificConcept}</th>
                                    <td>{concept.name}</td>
                                    <td>{getExpenseTypeName(concept.idExpenseType)}</td>
                                    <td className="text-truncate" style={{maxWidth: '200px'}} title={concept.description || ''}>{concept.description || <span className="text-muted fst-italic">N/A</span>}</td>
                                    <td className="text-center">
                                        {concept.requiresEmployeeCalculation ? 
                                            <CheckCircle size={18} className="text-success" title="Sí"/> : 
                                            <XCircle size={18} className="text-muted" title="No"/>}
                                    </td>
                                    <td className="text-center">
                                        <Button
                                            outline color={concept.status ? "success" : "secondary"}
                                            size="sm" className="p-1"
                                            onClick={() => requestChangeStatusConfirmation(concept)}
                                            disabled={confirmModalProps.isConfirming}
                                            title={concept.status ? "Activo (Clic para inactivar)" : "Inactivo (Clic para activar)"}
                                        >
                                            {concept.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1 action-cell-content">
                                            <Button color="warning" outline size="sm" onClick={() => handleOpenModal(concept)} title="Editar" className="p-1" disabled={confirmModalProps.isConfirming}> <Edit size={14} /> </Button>
                                            <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(concept)} title="Eliminar" className="p-1" disabled={confirmModalProps.isConfirming}> <Trash2 size={14} /> </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="text-center fst-italic p-4">
                                {tableSearchText ? `No se encontraron conceptos para "${tableSearchText}".` : 'No hay conceptos específicos registrados.'}
                                {!isLoadingTable && specificConcepts.length === 0 && !tableSearchText && (
                                     <span className="d-block mt-2">Aún no hay conceptos. <Button size="sm" color="link" onClick={() => handleOpenModal()} className="p-0 align-baseline">Crear el primero</Button></span>
                                )}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {!isLoadingTable && totalPages > 1 && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            <Modal isOpen={modalOpen} toggle={!isSubmitting ? handleCloseModal : undefined} centered backdrop="static" keyboard={!isSubmitting}>
                <ModalHeader toggle={!isSubmitting ? handleCloseModal : undefined}>
                    <div className="d-flex align-items-center">
                        {isEditing ? <Edit size={20} className="me-2" /> : <Plus size={20} className="me-2" />}
                        {isEditing ? 'Editar Concepto Específico' : 'Crear Nuevo Concepto Específico'}
                    </div>
                </ModalHeader>
                <ModalBody>
                    {apiError && <Alert color="danger" size="sm" className="py-2 px-3">{apiError}</Alert>}
                    {formErrors.duplicateError && <Alert color="warning" size="sm" className="py-2 px-3">{formErrors.duplicateError}</Alert>}
                    <Form id="specificConceptForm" noValidate onSubmit={(e) => e.preventDefault()}>
                        <FormGroup>
                            <Label for="idExpenseType" className="form-label fw-bold">Tipo de Gasto General <span className="text-danger">*</span></Label>
                            <Input type="select" name="idExpenseType" id="idExpenseType" bsSize="sm"
                                value={currentConcept.idExpenseType} onChange={handleFormChange}
                                invalid={!!formErrors.idExpenseType || !!formErrors.duplicateError} 
                                disabled={isSubmitting || isLoadingExpenseTypes} required>
                                <option value="">{isLoadingExpenseTypes ? "Cargando tipos..." : "Seleccione un tipo..."}</option>
                                {expenseTypes.map(type => (
                                    <option key={type.idExpenseType} value={type.idExpenseType}>
                                        {type.name}
                                    </option>
                                ))}
                            </Input>
                            <FormFeedback>{formErrors.idExpenseType}</FormFeedback>
                            {expenseTypes.length === 0 && !isLoadingExpenseTypes && <small className="text-warning d-block mt-1">No hay Tipos de Gasto Generales activos para seleccionar. Debe crearlos primero.</small>}
                        </FormGroup>
                        <FormGroup>
                            <Label for="name" className="form-label fw-bold">Nombre del Concepto <span className="text-danger">*</span></Label>
                            <Input id="name" name="name" bsSize="sm"
                                value={currentConcept.name} onChange={handleFormChange}
                                invalid={!!formErrors.name || !!formErrors.duplicateError}
                                disabled={isSubmitting} required />
                            <FormFeedback>{formErrors.name !== " " ? formErrors.name : null}</FormFeedback> 
                        </FormGroup>
                        <FormGroup>
                            <Label for="description" className="form-label">Descripción <small className="text-muted">(Opcional)</small></Label>
                            <Input type="textarea" name="description" id="description" bsSize="sm" rows="3"
                                value={currentConcept.description} onChange={handleFormChange}
                                invalid={!!formErrors.description} disabled={isSubmitting} />
                            <FormFeedback>{formErrors.description}</FormFeedback>
                        </FormGroup>
                        <FormGroup check className="mb-3">
                            <Input type="checkbox" name="requiresEmployeeCalculation" id="requiresEmployeeCalculation"
                                checked={currentConcept.requiresEmployeeCalculation} onChange={handleFormChange}
                                disabled={isSubmitting} />
                            <Label for="requiresEmployeeCalculation" check className="form-label">
                                ¿Este concepto requiere cálculo basado en empleados?
                                <Info size={14} className="ms-1 text-muted" title="Marcar si este concepto implica multiplicar un valor base por número de empleados y/o añadir bonificaciones (ej: sueldos)." />
                            </Label>
                        </FormGroup>
                         {!isEditing && ( 
                            <FormGroup check>
                                <Input type="checkbox" name="status" id="statusModal"
                                    checked={currentConcept.status} onChange={handleFormChange}
                                    disabled={isSubmitting}/>
                                <Label for="statusModal" check className="form-label">Activo</Label>
                            </FormGroup>
                         )}
                    </Form>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={handleCloseModal} disabled={isSubmitting}>Cancelar</Button>
                     <Button color="primary" onClick={handleSubmit} disabled={isSubmitting || (isLoadingExpenseTypes && !currentConcept.idExpenseType)}>
                         {isSubmitting ? <><Spinner size="sm" className="me-1"/> Procesando...</> : (isEditing ? <><Save size={16} className="me-1"/> Actualizar Concepto</> : <><Save size={16} className="me-1"/> Guardar Concepto</>)}
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

export default SpecificConceptManagement;