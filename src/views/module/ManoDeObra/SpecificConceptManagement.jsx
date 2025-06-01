// src/components/SpecificConceptManagement/SpecificConceptManagement.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/App.css';
import '../../../assets/css/index.css';
import {
    Table, Button, Container, Row, Col, Input, FormGroup, Label, FormFeedback,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
    Form, Alert,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import {
    Edit, Plus, Save, XCircle, AlertTriangle, CheckCircle, Settings,
    SlidersHorizontal, Users, ListChecks, Trash2, ListFilter
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components ---
import CustomPagination from '../../General/CustomPagination';
import { ConfirmationModal } from '../../General/ConfirmationModal';

// --- Services ---
import SpecificConceptSpentService from "../../services/SpecificConceptSpentService";
import ExpenseCategoryService from "../../services/ExpenseCategoryService";

// --- Constants ---
const ITEMS_PER_PAGE = 10;

const INITIAL_DYNAMIC_CONCEPT_ITEM = { name: '', isBimonthly: false, error: null };

const INITIAL_FORM_STATE_CREATE_MODE = {
    idExpenseCategory: '',
    dynamicConcepts: [INITIAL_DYNAMIC_CONCEPT_ITEM],
    description: '',
    requiresEmployeeCalculation: false,
    status: true,
};

const INITIAL_FORM_STATE_EDIT_MODE = {
    name: '',
    idExpenseCategory: '',
    description: '',
    requiresEmployeeCalculation: false,
    isBimonthly: false,
    status: true,
};

const INITIAL_FORM_ERRORS = {
    idExpenseCategory: null,
    dynamicConcepts: null,
    description: null,
    name: null,
};

const INITIAL_CONFIRM_PROPS = { isOpen: false, title: "", message: null, onConfirm: () => {}, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null, isConfirming: false };

const SpecificConceptManagement = () => {
    const [specificConcepts, setSpecificConcepts] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [isLoadingExpenseCategories, setIsLoadingExpenseCategories] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentConcept, setCurrentConcept] = useState(INITIAL_FORM_STATE_CREATE_MODE);
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

    const navigateToManageExpenseCategories = useCallback(() => navigate('/home/mano-de-obra/gastos'), [navigate]);
    const navigateToMonthlyExpenses = useCallback(() => navigate('/home/mano-de-obra'), [navigate]);
    const navigateToEmployees = useCallback(() => navigate('/home/mano-de-obra/rendimiento'), [navigate]);
    const navigateToManageSpecificConcepts = useCallback(() => navigate('/home/mano-de-obra/conceptos'), [navigate]);


    const fetchSpecificConcepts = useCallback(async (showSpinner = true) => {
        if (showSpinner) setIsLoadingTable(true);
        try {
            const concepts = await SpecificConceptSpentService.getAllSpecificConceptSpents({ status: true }); // Filtrar por activos si es necesario
            setSpecificConcepts(Array.isArray(concepts) ? concepts : []);
        } catch (error) {
            console.error("Error fetching specific concepts:", error);
            toast.error(`Error al cargar conceptos: ${error.message || 'Error desconocido'}`);
            setSpecificConcepts([]);
        } finally {
            if (showSpinner) setIsLoadingTable(false);
        }
    }, []);

    const fetchExpenseCategories = useCallback(async () => { // Ya no necesita parámetro showSpinner
        setIsLoadingExpenseCategories(true); // Siempre mostrar spinner para esta carga
        try {
            const categories = await ExpenseCategoryService.getAllExpenseCategories();
            setExpenseCategories(Array.isArray(categories) ? categories.filter(cat => cat.status) : []);
        } catch (error) {
            console.error("Error fetching expense categories:", error);
            toast.error(`Error al cargar categorías: ${error.message || 'Error desconocido'}`);
            setExpenseCategories([]);
        } finally {
            setIsLoadingExpenseCategories(false); // Siempre ocultar spinner
        }
    }, []);

    useEffect(() => {
        fetchSpecificConcepts(true); // Puedes pasar true o dejar que use el default
        fetchExpenseCategories();    // Llama sin argumentos, el spinner se maneja internamente
    }, [fetchSpecificConcepts, fetchExpenseCategories]);

    const resetFormAndErrors = () => {
        setCurrentConcept(isEditing ? INITIAL_FORM_STATE_EDIT_MODE : INITIAL_FORM_STATE_CREATE_MODE);
        setFormErrors(INITIAL_FORM_ERRORS);
        setApiError(null);
    };

    const handleOpenModal = (conceptToEdit = null) => {
        if (conceptToEdit) {
            setIsEditing(true);
            setEditingConceptId(conceptToEdit.idSpecificConcept);
            setCurrentConcept({
                name: conceptToEdit.name || '',
                idExpenseCategory: conceptToEdit.expenseCategoryDetails?.idExpenseCategory?.toString() || '',
                description: conceptToEdit.description || '',
                requiresEmployeeCalculation: conceptToEdit.requiresEmployeeCalculation || false,
                isBimonthly: conceptToEdit.isBimonthly || false,
                status: conceptToEdit.status !== undefined ? conceptToEdit.status : true,
            });
        } else {
            setIsEditing(false);
            setEditingConceptId(null);
            setCurrentConcept(INITIAL_FORM_STATE_CREATE_MODE);
        }
        setFormErrors(INITIAL_FORM_ERRORS);
        setApiError(null);
        setModalOpen(true);
    };

    const handleCloseModal = () => { if (!isSubmitting) { setModalOpen(false); resetFormAndErrors(); }};

    const handleCommonFormChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setCurrentConcept(prev => ({ ...prev, [name]: val }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
        if (apiError) setApiError(null);
    }, [formErrors, apiError]);

    const handleDynamicConceptChange = (index, field, value) => {
        setCurrentConcept(prev => {
            const updatedDynamicConcepts = prev.dynamicConcepts.map((item, i) =>
                i === index ? { ...item, [field]: value, error: null } : item
            );
            return { ...prev, dynamicConcepts: updatedDynamicConcepts };
        });
        if (formErrors.dynamicConcepts) setFormErrors(prev => ({ ...prev, dynamicConcepts: null }));
    };

    const handleAddDynamicConcept = () => {
        setCurrentConcept(prev => {
            const lastConcept = prev.dynamicConcepts[prev.dynamicConcepts.length - 1];
            if (!lastConcept.name.trim()) {
                toast.error("Complete el nombre del gasto actual antes de agregar otro.");
                const updatedDynamicConcepts = prev.dynamicConcepts.map((item, i) =>
                    i === prev.dynamicConcepts.length - 1 ? { ...item, error: "El nombre es obligatorio." } : item
                );
                setFormErrors(prevE => ({ ...prevE, dynamicConcepts: "Complete los campos de los gastos." }));
                return { ...prev, dynamicConcepts: updatedDynamicConcepts };
            }
            return { ...prev, dynamicConcepts: [...prev.dynamicConcepts, { ...INITIAL_DYNAMIC_CONCEPT_ITEM }] };
        });
    };

    const handleRemoveDynamicConcept = (index) => {
        setCurrentConcept(prev => {
            if (prev.dynamicConcepts.length <= 1) {
                toast.error("Debe haber al menos un nombre de gasto."); return prev;
            }
            const newDynamicConcepts = prev.dynamicConcepts.filter((_, i) => i !== index);
            return { ...prev, dynamicConcepts: newDynamicConcepts };
        });
    };

    const validateForm = useCallback(() => {
        const newErrors = { ...INITIAL_FORM_ERRORS };
        let isValid = true;

        if (!currentConcept.idExpenseCategory || currentConcept.idExpenseCategory.trim() === '') {
            newErrors.idExpenseCategory = "Debe seleccionar una Categoría de Gasto.";
            isValid = false;
        }

        if (isEditing) {
            if (!currentConcept.name.trim()) {
                newErrors.name = "El nombre del concepto es obligatorio."; isValid = false;
            } else if (currentConcept.name.trim().length < 2) {
                newErrors.name = "El nombre debe tener al menos 2 caracteres."; isValid = false;
            }
        } else {
            let dynamicConceptsValid = true;
            const namesInForm = new Set();
            const updatedDynamicConcepts = currentConcept.dynamicConcepts.map(dc => {
                let itemError = null;
                const trimmedName = dc.name.trim();
                if (!trimmedName) {
                    dynamicConceptsValid = false; itemError = "El nombre es obligatorio.";
                } else if (trimmedName.length < 2) {
                    dynamicConceptsValid = false; itemError = "Mínimo 2 caracteres.";
                } else if (namesInForm.has(trimmedName.toLowerCase())) {
                    dynamicConceptsValid = false; itemError = "Nombre duplicado en el formulario.";
                } else {
                    namesInForm.add(trimmedName.toLowerCase());
                    if (currentConcept.idExpenseCategory) {
                        const existingConceptDB = specificConcepts.find(
                            sc => sc.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
                                  sc.expenseCategoryDetails?.idExpenseCategory?.toString() === currentConcept.idExpenseCategory
                        );
                        if (existingConceptDB) {
                             dynamicConceptsValid = false; itemError = "Este nombre ya existe para la categoría seleccionada.";
                        }
                    }
                }
                return { ...dc, error: itemError };
            });

            if (!dynamicConceptsValid) {
                newErrors.dynamicConcepts = "Revise los nombres de los gastos ingresados.";
                isValid = false;
                setCurrentConcept(prev => ({ ...prev, dynamicConcepts: updatedDynamicConcepts }));
            }
        }
        setFormErrors(newErrors);
        return isValid;
    }, [currentConcept, isEditing, specificConcepts]);

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error("Por favor, corrija los errores del formulario.", { icon: <XCircle /> });
            return;
        }
        setIsSubmitting(true); setApiError(null);

        if (isEditing) {
            const toastId = toast.loading('Actualizando concepto...');
            const payload = {
                name: currentConcept.name.trim(),
                description: currentConcept.description.trim() || null,
                requiresEmployeeCalculation: currentConcept.requiresEmployeeCalculation,
                isBimonthly: currentConcept.isBimonthly,
                idExpenseCategory: parseInt(currentConcept.idExpenseCategory, 10),
                status: currentConcept.status
            };
            try {
                await SpecificConceptSpentService.updateSpecificConceptSpent(editingConceptId, payload);
                toast.success(`Concepto "${payload.name}" actualizado.`, { id: toastId, icon: <CheckCircle /> });
                handleCloseModal();
                await fetchSpecificConcepts(false); // No mostrar spinner de tabla aquí
            } catch (error) {
                const errorMessage = error.message || "Error al actualizar.";
                setApiError(errorMessage);
                toast.error(`Error: ${errorMessage}`, { id: toastId, icon: <XCircle />, duration: 5000 });
            }
        } else {
            const toastId = toast.loading('Creando conceptos...');
            let allSuccess = true;
            let createdCount = 0;

            const commonData = {
                description: currentConcept.description.trim() || null,
                requiresEmployeeCalculation: currentConcept.requiresEmployeeCalculation,
                status: currentConcept.status,
                idExpenseCategory: parseInt(currentConcept.idExpenseCategory, 10),
            };

            const validDynamicConcepts = currentConcept.dynamicConcepts.filter(dc => dc.name.trim() !== '');

            if (validDynamicConcepts.length === 0) {
                toast.error("No hay nombres de conceptos válidos para crear.", { id: toastId, icon: <XCircle /> });
                setIsSubmitting(false); return;
            }

            for (const conceptItem of validDynamicConcepts) {
                const singlePayload = {
                    ...commonData,
                    name: conceptItem.name.trim(),
                    isBimonthly: conceptItem.isBimonthly,
                };
                try {
                    await SpecificConceptSpentService.createSpecificConceptSpent(singlePayload);
                    createdCount++;
                } catch (individualError) {
                    allSuccess = false;
                    toast.error(`Error creando "${singlePayload.name}": ${individualError.message || 'Error desconocido'}`, { duration: 4000 });
                }
            }

            if (allSuccess && createdCount > 0) {
                toast.success(`${createdCount} Concepto(s) creado(s) exitosamente.`, { id: toastId, icon: <CheckCircle /> });
            } else if (createdCount > 0 && !allSuccess) {
                toast.warning(`${createdCount} Concepto(s) creado(s), pero algunos fallaron.`, { id: toastId, icon: <AlertTriangle /> });
            } else if (!allSuccess && createdCount === 0) {
                toast.error('No se pudo crear ningún concepto.', { id: toastId, icon: <XCircle /> });
            }

            handleCloseModal();
            if (createdCount > 0) await fetchSpecificConcepts(false); // No mostrar spinner de tabla aquí
        }
        setIsSubmitting(false);
    };

    const closeConfirmModal = () => { if (!confirmModalProps.isConfirming) setConfirmModalProps(INITIAL_CONFIRM_PROPS); };
    const executeConfirmedAction = async () => { if (confirmModalProps.onConfirm) { setConfirmModalProps(prev => ({ ...prev, isConfirming: true })); await confirmModalProps.onConfirm(confirmModalProps.itemDetails); } };
    const requestDeleteConfirmation = (concept) => { setConfirmModalProps({ isOpen: true, title: "Confirmar Eliminación", message: ( <p> ¿Está seguro que desea eliminar el concepto "<strong>{concept.name}</strong>" (ID: {concept.idSpecificConcept}) de la categoría "<strong>{concept.expenseCategoryDetails?.name || 'N/A'}</strong>"?<br/><strong className="text-danger">Esta acción no se puede deshacer.</strong></p>), onConfirm: executeDelete, confirmText: "Sí, Eliminar", confirmColor: "danger", itemDetails: concept, isConfirming: false, }); };
    const executeDelete = async (concept) => { const toastId = toast.loading(`Eliminando "${concept.name}"...`); try { await SpecificConceptSpentService.deleteSpecificConceptSpent(concept.idSpecificConcept); toast.success(`Concepto "${concept.name}" eliminado.`, { id: toastId }); await fetchSpecificConcepts(false); } catch (error) { toast.error(`Error al eliminar: ${error.message || 'Error desconocido'}`, { id: toastId }); } finally { closeConfirmModal(); } };
    const requestChangeStatusConfirmation = (concept) => { const actionText = concept.status ? "desactivar" : "activar"; const futureStatusText = concept.status ? "Inactivo" : "Activo"; setConfirmModalProps({ isOpen: true, title: "Confirmar Cambio de Estado", message: ( <p> ¿Está seguro que desea <strong>{actionText}</strong> el concepto "<strong>{concept.name}</strong>"?<br/>Su nuevo estado será: <strong>{futureStatusText}</strong>.</p>), onConfirm: executeChangeStatus, confirmText: `Sí, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`, confirmColor: concept.status ? "warning" : "success", itemDetails: concept, isConfirming: false, }); };
    const executeChangeStatus = async (concept) => { const newStatus = !concept.status; const actionText = concept.status ? "desactivando" : "activando"; const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} "${concept.name}"...`); const originalConcepts = [...specificConcepts]; setSpecificConcepts(prev => prev.map(item => item.idSpecificConcept === concept.idSpecificConcept ? { ...item, status: newStatus } : item )); try { await SpecificConceptSpentService.changeStateSpecificConceptSpent(concept.idSpecificConcept, newStatus); toast.success(`Estado de "${concept.name}" actualizado.`, { id: toastId }); } catch (error) { toast.error(`Error al cambiar estado: ${error.message || 'Error desconocido'}`, { id: toastId }); setSpecificConcepts(originalConcepts); } finally { closeConfirmModal(); } };

    const handleTableSearch = (e) => { setTableSearchText(e.target.value); setCurrentPage(1); };
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const getAssociatedCategoryName = (concept) => {
        if (!concept || !concept.expenseCategoryDetails || !concept.expenseCategoryDetails.name) {
            return <span className="text-muted fst-italic">N/A</span>;
        }
        return concept.expenseCategoryDetails.name;
    };

    const filteredData = useMemo(() => {
        if (!Array.isArray(specificConcepts)) return [];
        const sortedData = [...specificConcepts].sort((a, b) => (b.idSpecificConcept || 0) - (a.idSpecificConcept || 0));
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedData;
        return sortedData.filter(concept => {
            const nameMatch = concept.name && concept.name.toLowerCase().includes(lowerSearchText);
            const descriptionMatch = concept.description && concept.description.toLowerCase().includes(lowerSearchText);
            const categoryNameMatch = concept.expenseCategoryDetails?.name?.toLowerCase().includes(lowerSearchText);
            return nameMatch || descriptionMatch || categoryNameMatch;
        });
    }, [specificConcepts, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); else if (currentPage === 0 && totalPages > 0) setCurrentPage(1)}, [totalPages, currentPage]);

    return (
        <Container fluid className="p-4 main-content">
            {/* ... JSX sin cambios significativos desde la última versión que te di, 
                 asumiendo que los ajustes para la tabla y el modal ya estaban bien ... */}
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />

            <h2 className="mb-4">Gestión de Conceptos de Gasto Específicos</h2>
            <Row className="mb-3 align-items-center">
                 <Col md={5} lg={4}>
                    <Input bsSize="sm" type="text" placeholder="Buscar por nombre, descripción, categoría..." value={tableSearchText} onChange={handleTableSearch}/>
                </Col>
                <Col md={7} lg={8} className="text-md-end mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-2">
                    <Button color="info" outline size="sm" onClick={navigateToEmployees} title="Ir a Empleados"><Users size={16} className="me-1" /> Empleados</Button>
                    <Dropdown isOpen={gastosDropdownOpen} toggle={toggleGastosDropdown} size="sm">
                        <DropdownToggle caret color="secondary" outline><ListChecks size={16} className="me-1" /> Configurar Gastos</DropdownToggle>
                        <DropdownMenu end>
                            <DropdownItem header>Administración de Conceptos</DropdownItem>
                            <DropdownItem onClick={navigateToManageExpenseCategories}><SlidersHorizontal size={16} className="me-2 text-muted" />Gestionar Categorías</DropdownItem>
                            <DropdownItem onClick={navigateToManageSpecificConcepts} active><Settings size={16} className="me-2 text-muted" />Gestionar Conceptos Específicos</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    <Button color="primary" size="sm" onClick={() => handleOpenModal()} className="button-add"><Plus size={18} className="me-1" /> Crear Concepto</Button>
                    <Button color="success" outline size="sm" onClick={navigateToMonthlyExpenses} title="Ir a registro mensual"><ListFilter size={16} className="me-1" /> Crear Gasto Mensual</Button>
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                    <thead className="table-dark">
                        <tr>
                            <th style={{width: '5%'}}>ID</th>
                            <th style={{width: '20%'}}>Nombre Concepto</th>
                            <th style={{width: '20%'}}>Categoría Asociada</th>
                            <th style={{width: '20%'}}>Descripción</th>
                            <th style={{width: '10%'}} className="text-center">Req. Empleados</th>
                            <th style={{width: '10%'}} className="text-center">Es Bimestral</th>
                            <th style={{width: '5%'}} className="text-center">Estado</th>
                            <th style={{width: '10%'}} className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingTable ? (<tr><td colSpan="8" className="text-center p-5"><Spinner /> Cargando...</td></tr>)
                        : currentItems.length > 0 ? ( currentItems.map(concept => (
                            <tr key={concept.idSpecificConcept} style={{ verticalAlign: 'middle' }}>
                                <th scope="row">{concept.idSpecificConcept}</th>
                                <td>{concept.name}</td>
                                <td>{getAssociatedCategoryName(concept)}</td>
                                <td className="text-truncate" style={{maxWidth: '150px'}} title={concept.description}>{concept.description || <span className="text-muted fst-italic">N/A</span>}</td>
                                <td className="text-center">{concept.requiresEmployeeCalculation ? <CheckCircle className="text-success" /> : <XCircle className="text-muted" />}</td>
                                <td className="text-center">{concept.isBimonthly ? <CheckCircle className="text-primary" /> : <XCircle className="text-muted" />}</td>
                                <td className="text-center"><Button outline color={concept.status ? "success" : "secondary"} size="sm" className="p-1" onClick={() => requestChangeStatusConfirmation(concept)} disabled={confirmModalProps.isConfirming}>{concept.status ? "Activo" : "Inactivo"}</Button></td>
                                <td className="text-center"><div className="d-inline-flex gap-1">
                                    <Button color="warning" outline size="sm" onClick={() => handleOpenModal(concept)} className="p-1" disabled={confirmModalProps.isConfirming}><Edit size={14} /></Button>
                                    <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(concept)} className="p-1" disabled={confirmModalProps.isConfirming}><Trash2 size={14} /></Button>
                                </div></td>
                            </tr>
                        ))) : (<tr><td colSpan="8" className="text-center fst-italic p-4">{tableSearchText ? `No se encontraron conceptos para "${tableSearchText}".` : 'No hay conceptos específicos.'}</td></tr>)}
                    </tbody>
                </Table>
            </div>
            {!isLoadingTable && totalPages > 1 && (<CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />)}

            <Modal isOpen={modalOpen} toggle={!isSubmitting ? handleCloseModal : undefined} centered backdrop="static" keyboard={!isSubmitting} size="lg">
                <ModalHeader toggle={!isSubmitting ? handleCloseModal : undefined}>
                    <div className="d-flex align-items-center">
                        {isEditing ? <Edit size={20} className="me-2" /> : <Plus size={20} className="me-2" />}
                        {isEditing ? 'Editar Concepto Específico' : 'Crear Nuevo(s) Concepto(s) Específico(s)'}
                    </div>
                </ModalHeader>
                <ModalBody>
                    {apiError && <Alert color="danger" size="sm" className="py-2 px-3">{apiError}</Alert>}
                    {formErrors.dynamicConcepts && !isEditing && <Alert color="danger" size="sm" className="py-2 px-3">{formErrors.dynamicConcepts}</Alert>}

                    <Form id="specificConceptForm" noValidate onSubmit={(e) => e.preventDefault()}>
                        <FormGroup className="mb-3">
                            <Label for="idExpenseCategory" className="form-label fw-bold">Categoría de Gasto <span className="text-danger">*</span></Label>
                            <Input type="select" name="idExpenseCategory" id="idExpenseCategory" bsSize="sm"
                                value={currentConcept.idExpenseCategory}
                                onChange={handleCommonFormChange}
                                invalid={!!formErrors.idExpenseCategory}
                                disabled={isSubmitting || isLoadingExpenseCategories || expenseCategories.length === 0}>
                                <option value="">
                                    {isLoadingExpenseCategories ? "Cargando categorías..." : (expenseCategories.length === 0 ? "No hay categorías activas" : "Seleccione una categoría...")}
                                </option>
                                {expenseCategories.map(cat => (
                                    <option key={cat.idExpenseCategory} value={cat.idExpenseCategory.toString()}>{cat.name}</option>
                                ))}
                            </Input>
                            <FormFeedback>{formErrors.idExpenseCategory}</FormFeedback>
                            {expenseCategories.length === 0 && !isLoadingExpenseCategories && (
                                 <small className="form-text text-muted">No hay categorías activas. Por favor, <Button color="link" size="sm" className="p-0 alert-link" onClick={navigateToManageExpenseCategories}>cree una</Button> primero.</small>
                            )}
                        </FormGroup>
                        <hr />

                        {isEditing ? (
                            <>
                                <FormGroup>
                                    <Label for="nameEdit" className="form-label fw-bold">Nombre del Concepto <span className="text-danger">*</span></Label>
                                    <Input id="nameEdit" name="name" bsSize="sm" value={currentConcept.name} onChange={handleCommonFormChange}
                                        invalid={!!formErrors.name} disabled={isSubmitting} />
                                    <FormFeedback>{formErrors.name}</FormFeedback>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="descriptionEdit" className="form-label">Descripción <small className="text-muted">(Opcional)</small></Label>
                                    <Input type="textarea" name="description" id="descriptionEdit" bsSize="sm" rows="2" value={currentConcept.description} onChange={handleCommonFormChange} disabled={isSubmitting} />
                                </FormGroup>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup check className="mb-2">
                                            <Input type="checkbox" name="requiresEmployeeCalculation" id="requiresEmployeeCalculationEdit" checked={currentConcept.requiresEmployeeCalculation} onChange={handleCommonFormChange} disabled={isSubmitting} />
                                            <Label for="requiresEmployeeCalculationEdit" check>¿Cálculo por empleados?</Label>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup check className="mb-2">
                                            <Input type="checkbox" name="isBimonthly" id="isBimonthlyEdit" checked={currentConcept.isBimonthly} onChange={handleCommonFormChange} disabled={isSubmitting} />
                                            <Label for="isBimonthlyEdit" check>¿Es Bimestral?</Label>
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <FormGroup check>
                                    <Input type="checkbox" name="status" id="statusEdit" checked={currentConcept.status} onChange={handleCommonFormChange} disabled={isSubmitting} />
                                    <Label for="statusEdit" check>Activo</Label>
                                </FormGroup>
                            </>
                        ) : (
                            <>
                                <Label className="form-label fw-bold">Nombres de los Nuevos Gastos Específicos:</Label>
                                <small className="d-block text-muted mb-2">La categoría seleccionada arriba y los campos comunes de abajo aplicarán a todos estos gastos.</small>
                                {currentConcept.dynamicConcepts.map((dc, index) => (
                                    <Row key={`dyn-concept-${index}`} className="g-2 mb-2 align-items-start">
                                        <Col>
                                            <FormGroup className="mb-0">
                                                <Input bsSize="sm" type="text" placeholder={`Nombre del Gasto ${index + 1}`}
                                                    value={dc.name}
                                                    onChange={(e) => handleDynamicConceptChange(index, 'name', e.target.value)}
                                                    invalid={!!dc.error}
                                                    disabled={isSubmitting}
                                                />
                                                {dc.error && <FormFeedback className="d-block">{dc.error}</FormFeedback>}
                                            </FormGroup>
                                        </Col>
                                        <Col xs="auto" className="d-flex align-items-center pt-1">
                                            <FormGroup check inline className="me-2 mb-0">
                                                <Input type="checkbox" bsSize="sm" id={`isBimonthly-${index}`}
                                                    checked={dc.isBimonthly}
                                                    onChange={(e) => handleDynamicConceptChange(index, 'isBimonthly', e.target.checked)}
                                                    disabled={isSubmitting}
                                                />
                                                <Label for={`isBimonthly-${index}`} check className="small">Bimestral</Label>
                                            </FormGroup>
                                        </Col>
                                        <Col xs="auto">
                                            {currentConcept.dynamicConcepts.length > 1 && (
                                                <Button color="danger" outline size="sm" onClick={() => handleRemoveDynamicConcept(index)} disabled={isSubmitting} style={{ padding: '0.25rem 0.5rem' }}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>
                                ))}
                                <Button color="info" outline size="sm" onClick={handleAddDynamicConcept} disabled={isSubmitting} className="mt-1 mb-3">
                                    <Plus size={16} className="me-1" /> Agregar Otro Gasto
                                </Button>
                                <hr/>
                                <p className="form-text text-muted small">Los siguientes campos comunes aplicarán a todos los gastos específicos creados arriba:</p>
                                <FormGroup>
                                    <Label for="descriptionCreate" className="form-label">Descripción Común <small className="text-muted">(Opcional)</small></Label>
                                    <Input type="textarea" name="description" id="descriptionCreate" bsSize="sm" rows="2" value={currentConcept.description} onChange={handleCommonFormChange} disabled={isSubmitting} />
                                </FormGroup>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup check className="mb-2">
                                            <Input type="checkbox" name="requiresEmployeeCalculation" id="requiresEmployeeCalculationCreate" checked={currentConcept.requiresEmployeeCalculation} onChange={handleCommonFormChange} disabled={isSubmitting} />
                                            <Label for="requiresEmployeeCalculationCreate" check>¿Requieren cálculo por empleados?</Label>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup check>
                                            <Input type="checkbox" name="status" id="statusCreate" checked={currentConcept.status} onChange={handleCommonFormChange} disabled={isSubmitting} />
                                            <Label for="statusCreate" check>Activos al crear</Label>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Form>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={handleCloseModal} disabled={isSubmitting}>Cancelar</Button>
                     <Button color="primary" onClick={handleSubmit} disabled={isSubmitting || isLoadingExpenseCategories || (expenseCategories.length === 0 && currentConcept.idExpenseCategory === '')}>
                         {isSubmitting ? <><Spinner size="sm" className="me-1"/> Procesando...</> : (isEditing ? <><Save size={16} className="me-1"/> Actualizar</> : <><Save size={16} className="me-1"/> Guardar</>)}
                     </Button>
                </ModalFooter>
            </Modal>

            <ConfirmationModal
                isOpen={confirmModalProps.isOpen} toggle={closeConfirmModal} title={confirmModalProps.title}
                onConfirm={executeConfirmedAction} confirmText={confirmModalProps.confirmText}
                confirmColor={confirmModalProps.confirmColor} isConfirming={confirmModalProps.isConfirming}
            >
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default SpecificConceptManagement;