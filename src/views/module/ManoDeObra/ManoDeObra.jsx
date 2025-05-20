// src/components/ManoDeObra/ManoDeObra.js (o tu nuevo nombre de archivo)
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/App.css'; // Ajusta la ruta si es necesario
import '../../../assets/css/index.css'; // Ajusta la ruta si es necesario
import {
    Table, Button, Container, Row, Col, Input, FormGroup, Label, FormFeedback,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Card, CardBody, CardHeader,
    Form, Alert, InputGroup, InputGroupText, FormText,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import {
    Eye, Edit, Trash2, Plus, ArrowLeft, Save, Users, ListFilter, XCircle,
    AlertTriangle, CheckCircle, Settings, DollarSign, Hash, Edit3,
    SlidersHorizontal, ListChecks, FileText,
    Info // Info icon is correctly imported
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components ---
import { formatCurrencyCOP } from "../../../utils/formatting"; // Ajusta la ruta
import CustomPagination from '../../General/CustomPagination'; // Ajusta la ruta
import ConceptSpentSelect from './ConceptSpentSelect'; // Ajusta la ruta
import { ConfirmationModal } from '../../General/ConfirmationModal'; // Ajusta la ruta

// --- Services ---
import MonthlyOverallExpenseService from "../../services/MonthlyOverallExpenseService";
import ExpenseTypeService from "../../services/ExpenseType"; // Para Tipos de Gasto Generales
import SpecificConceptSpentService from "../../services/SpecificConceptSpentService"; // Para Conceptos Específicos

// --- Constants ---
const ITEMS_PER_PAGE = 7;

const INITIAL_OVERALL_FORM_STATE = {
    dateOverallExp: dayjs().format('YYYY-MM-DD'),
    novelty_expense: '',
    status: true,
};

const INITIAL_ITEM_FORM_STATE = {
    idSpecificConcept: '',
    price: '',
    numEmployees: '1',
    addBonus: false,
    bonusAmount: '',
};

const INITIAL_FORM_ERRORS = {
    selectedExpenseTypeId: null, // Still useful for context, but not a hard blocker for overall form
    dateOverallExp: null, novelty_expense: null, expenseItems: null,
    idSpecificConcept: null, price: null, numEmployees: null, bonusAmount: null
};
const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null
};

const ManoDeObra = () => { // Considera renombrar a GestionGastosMensuales
    const [monthlyExpenseRecords, setMonthlyExpenseRecords] = useState([]);
    const [isLoadingTable, setIsLoadingTable] = useState(true);

    const [overallForm, setOverallForm] = useState(INITIAL_OVERALL_FORM_STATE);
    const [itemForm, setItemForm] = useState(INITIAL_ITEM_FORM_STATE);
    const [addedExpenses, setAddedExpenses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [apiError, setApiError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [isSpecialSalaryConceptSelected, setIsSpecialSalaryConceptSelected] = useState(false);

    const [expenseTypes, setExpenseTypes] = useState([]);
    const [isLoadingExpenseTypes, setIsLoadingExpenseTypes] = useState(true);
    const [selectedExpenseTypeId, setSelectedExpenseTypeId] = useState(''); // This is for the *overall* record's type
    
    const [specificConcepts, setSpecificConcepts] = useState([]);
    const [isLoadingSpecificConcepts, setIsLoadingSpecificConcepts] = useState(false);

    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedMonthlyExpense, setSelectedMonthlyExpense] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [gastosDropdownOpen, setGastosDropdownOpen] = useState(false);

    const confirmActionRef = useRef(null);
    const navigate = useNavigate();

    const toggleGastosDropdown = () => setGastosDropdownOpen(prevState => !prevState);

    const fetchAllExpenseTypesData = useCallback(async () => {
        setIsLoadingExpenseTypes(true);
        try {
            const types = await ExpenseTypeService.getAllExpenseTypes();
            const activeTypes = Array.isArray(types) ? types.filter(t => t.status) : [];
            setExpenseTypes(activeTypes);
            // No toast error here if empty, user might not want to select one immediately
        } catch (error) {
            console.error("Error fetching expense types:", error);
            toast.error("Error al cargar los tipos de gasto generales.", { duration: 6000 });
            setExpenseTypes([]);
        } finally {
            setIsLoadingExpenseTypes(false);
        }
    }, []);

    const fetchMonthlyExpenseRecords = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoadingTable(true);
        try {
            const expenses = await MonthlyOverallExpenseService.getAllMonthlyOverallExpenses();
            setMonthlyExpenseRecords(Array.isArray(expenses) ? expenses : []);
        } catch (error) {
            console.error("Error fetching monthly expense records:", error);
            toast.error(`Error al cargar los registros de gastos mensuales.`);
            setMonthlyExpenseRecords([]);
        } finally {
            if (showLoadingSpinner) setIsLoadingTable(false);
        }
    }, []);

    const fetchSpecificConceptsForSelectedType = useCallback(async (expenseTypeId) => {
        if (!expenseTypeId) {
            setSpecificConcepts([]);
            return;
        }
        setIsLoadingSpecificConcepts(true);
        try {
            const conceptsData = await SpecificConceptSpentService.getAllSpecificConceptSpents({
                idExpenseType: expenseTypeId,
                status: true
            });
            const validConcepts = Array.isArray(conceptsData) ? conceptsData : [];
            setSpecificConcepts(validConcepts);

            const selectedType = expenseTypes.find(et => et.idExpenseType === parseInt(expenseTypeId));
            const typeName = selectedType ? selectedType.name : `ID ${expenseTypeId}`;
            if (validConcepts.length === 0) {
                 // CORRECTED LINE:
                 toast(
                    `No hay conceptos específicos activos para "${typeName}". Puede crearlos en "Configurar Gastos".`,
                    {
                        duration: 5000,
                        icon: <Info size={20} className="text-info" /> // Ensure icon is visible, added text-info for potential styling
                    }
                );
            }
        } catch (error) {
            console.error(`Error fetching specific concepts for type ${expenseTypeId}:`, error);
            toast.error(`Error al cargar los conceptos específicos.`);
            setSpecificConcepts([]);
        } finally {
            setIsLoadingSpecificConcepts(false);
        }
    }, [expenseTypes]);

    useEffect(() => {
        fetchMonthlyExpenseRecords();
        fetchAllExpenseTypesData();
    }, [fetchMonthlyExpenseRecords, fetchAllExpenseTypesData]);

    useEffect(() => {
        if (selectedExpenseTypeId) {
            fetchSpecificConceptsForSelectedType(selectedExpenseTypeId);
            setItemForm(prev => ({ ...prev, idSpecificConcept: '' }));
            setIsSpecialSalaryConceptSelected(false);
            setFormErrors(prev => ({...prev, idSpecificConcept: null, price: null, numEmployees: null, bonusAmount: null}));
        } else {
            setSpecificConcepts([]);
            setItemForm(INITIAL_ITEM_FORM_STATE); // Clear item form if no general type selected
            setIsSpecialSalaryConceptSelected(false);
        }
    }, [selectedExpenseTypeId, fetchSpecificConceptsForSelectedType]);

    const resetOverallForm = useCallback(() => {
        setOverallForm(INITIAL_OVERALL_FORM_STATE);
        setAddedExpenses([]);
        setSelectedExpenseTypeId(''); 
        setSpecificConcepts([]);    
        setFormErrors(INITIAL_FORM_ERRORS);
        setApiError(null);
        setIsSubmitting(false);
    }, []);

    const resetItemForm = useCallback(() => {
        setItemForm(INITIAL_ITEM_FORM_STATE);
        setEditingItemIndex(null);
        setFormErrors(prevErrors => ({
            ...prevErrors,
            idSpecificConcept: null, price: null, numEmployees: null, bonusAmount: null,
            expenseItems: prevErrors.expenseItems === 'Termine de editar el gasto actual o cancele la edición antes de guardar.' ? null : prevErrors.expenseItems
        }));
        setIsSpecialSalaryConceptSelected(false);
    }, []);

    const resetFullForm = useCallback(() => {
        resetOverallForm();
        resetItemForm(); 
    }, [resetOverallForm, resetItemForm]);

    const handleOverallFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setOverallForm(prevForm => ({ ...prevForm, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: null }));
        }
        if (apiError) setApiError(null);
    }, [formErrors, apiError]);
    
    const handleItemFormChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setItemForm(prevForm => ({ ...prevForm, [name]: val }));

        if (formErrors[name]) {
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: null }));
        }
        if (apiError) setApiError(null);
        if (formErrors.expenseItems && (name === 'idSpecificConcept' || name === 'price' || name === 'numEmployees' || name === 'bonusAmount')) {
             setFormErrors(prevErrors => ({ ...prevErrors, expenseItems: null }));
        }
    }, [formErrors, apiError]);

    const handleSelectedExpenseTypeChange = (e) => {
        const newSelectedId = e.target.value;
        setSelectedExpenseTypeId(newSelectedId);
        // No longer set formError for selectedExpenseTypeId here as it's optional for overall form
        // if (formErrors.selectedExpenseTypeId && newSelectedId) {
        //     setFormErrors(prev => ({ ...prev, selectedExpenseTypeId: null}));
        // }
    };

    useEffect(() => { 
        if (itemForm.idSpecificConcept && specificConcepts.length > 0) {
            const concept = specificConcepts.find(c => c.idSpecificConcept === parseInt(itemForm.idSpecificConcept));
            const isSpecial = concept && concept.requiresEmployeeCalculation === true;
            setIsSpecialSalaryConceptSelected(isSpecial);
            if (!isSpecial) { 
                setItemForm(prev => ({ ...prev, numEmployees: '1', addBonus: false, bonusAmount: '' }));
            }
        } else {
            setIsSpecialSalaryConceptSelected(false);
        }
    }, [itemForm.idSpecificConcept, specificConcepts]);

    const calculateItemFinalPrice = useCallback((currentItemFormToCalc) => {
        const basePrice = parseFloat(currentItemFormToCalc.price) || 0;
        let finalPrice = basePrice;
        let isItemSpecial = false;
        if (currentItemFormToCalc.idSpecificConcept && specificConcepts.length > 0) {
            const concept = specificConcepts.find(c => c.idSpecificConcept === parseInt(currentItemFormToCalc.idSpecificConcept));
            isItemSpecial = concept && concept.requiresEmployeeCalculation === true;
        }

        if (isItemSpecial) {
            const numEmps = parseInt(currentItemFormToCalc.numEmployees) || 1;
            finalPrice = basePrice * numEmps;
            if (currentItemFormToCalc.addBonus) {
                finalPrice += parseFloat(currentItemFormToCalc.bonusAmount) || 0;
            }
        }
        return finalPrice;
    }, [specificConcepts]); 

    const addOrUpdateExpenseToTable = useCallback(() => {
        let itemValid = true;
        const newErrorsForItems = { idSpecificConcept: null, price: null, numEmployees: null, bonusAmount: null };

        if (!selectedExpenseTypeId) { // Must have an overall type selected to add items
            toast.error("Seleccione primero un Tipo de Gasto General para el registro mensual.", { icon: <AlertTriangle className="text-warning" /> });
            return;
        }
        if (!itemForm.idSpecificConcept) {
            newErrorsForItems.idSpecificConcept = 'Seleccione un concepto específico'; itemValid = false;
        }
        
        const currentConcept = specificConcepts.find(c => c.idSpecificConcept === parseInt(itemForm.idSpecificConcept));
        const currentIsSpecial = currentConcept && currentConcept.requiresEmployeeCalculation === true;

        const parsedBasePrice = parseFloat(itemForm.price);
        if (!itemForm.price || isNaN(parsedBasePrice) || parsedBasePrice <= 0) {
            newErrorsForItems.price = `El ${currentIsSpecial ? 'sueldo base' : 'precio'} debe ser > 0`; itemValid = false;
        }
        if (currentIsSpecial) {
            const numEmps = parseInt(itemForm.numEmployees);
            if (isNaN(numEmps) || numEmps < 1) {
                newErrorsForItems.numEmployees = 'Cantidad inválida (mín. 1)'; itemValid = false;
            }
            if (itemForm.addBonus) {
                const bonus = parseFloat(itemForm.bonusAmount);
                if (isNaN(bonus) || bonus < 0) { 
                    newErrorsForItems.bonusAmount = 'Bonificación inválida (>= 0)'; itemValid = false;
                }
            }
        }

        if (!itemValid) {
            setFormErrors(prevErrors => ({ ...prevErrors, ...newErrorsForItems }));
            toast.error("Verifique los campos del concepto.", { icon: <AlertTriangle className="text-warning" /> });
            return;
        }

        const parsedIdSpecificConcept = parseInt(itemForm.idSpecificConcept, 10);
        if (currentConcept) {
            const finalPrice = calculateItemFinalPrice(itemForm);
            const expenseEntry = {
                // idExpenseType is implicitly defined by selectedExpenseTypeId for the whole record
                idSpecificConcept: parsedIdSpecificConcept,
                conceptName: currentConcept.name || 'Nombre Desconocido',
                price: finalPrice,
                baseSalary: currentIsSpecial ? parsedBasePrice : null,
                numEmployees: currentIsSpecial ? parseInt(itemForm.numEmployees) : null,
                addBonus: currentIsSpecial ? itemForm.addBonus : false,
                bonusAmount: currentIsSpecial && itemForm.addBonus ? (parseFloat(itemForm.bonusAmount) || 0) : null,
                requiresEmployeeCalculation: currentConcept.requiresEmployeeCalculation
            };

            if (editingItemIndex !== null) {
                const updatedExpenses = [...addedExpenses];
                updatedExpenses[editingItemIndex] = expenseEntry;
                setAddedExpenses(updatedExpenses);
                toast.success("Concepto actualizado en la lista.", { icon: <CheckCircle className="text-success" /> });
            } else {
                setAddedExpenses(prevExpenses => [...prevExpenses, expenseEntry]);
                 toast.success("Concepto agregado.", { icon: <CheckCircle className="text-success" /> });
            }
            resetItemForm();
            setFormErrors(prevErrors => ({ ...prevErrors, ...newErrorsForItems, expenseItems: null }));
        } else {
            setFormErrors(prevErrors => ({ ...prevErrors, idSpecificConcept: 'Concepto específico no encontrado' }));
            toast.error("Concepto específico no encontrado.");
        }
    }, [itemForm, specificConcepts, editingItemIndex, addedExpenses, calculateItemFinalPrice, resetItemForm, selectedExpenseTypeId]);

    const startEditAddedItem = useCallback((index) => {
        const itemToEdit = addedExpenses[index];
        setEditingItemIndex(index);
        const concept = specificConcepts.find(c => c.idSpecificConcept === itemToEdit.idSpecificConcept);
        setIsSpecialSalaryConceptSelected(concept && concept.requiresEmployeeCalculation === true);

        setItemForm({
            idSpecificConcept: itemToEdit.idSpecificConcept.toString(),
            price: (itemToEdit.baseSalary !== null ? itemToEdit.baseSalary : itemToEdit.price).toString(),
            numEmployees: (itemToEdit.numEmployees || '1').toString(),
            addBonus: itemToEdit.addBonus || false,
            bonusAmount: (itemToEdit.bonusAmount || '').toString(),
        });
        const addExpenseSection = document.getElementById('addExpenseItemSection');
        if (addExpenseSection) {
            addExpenseSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, [addedExpenses, specificConcepts]);

    const removeExpenseFromTable = useCallback((indexToRemove) => {
        setAddedExpenses(prevExpenses => prevExpenses.filter((_, i) => i !== indexToRemove));
        if (addedExpenses.length === 1 && formErrors.expenseItems) {
             setFormErrors(prevErrors => ({ ...prevErrors, expenseItems: null }));
        }
        if (editingItemIndex === indexToRemove) { 
            resetItemForm();
        }
    }, [addedExpenses, editingItemIndex, resetItemForm, formErrors]);

    const validateCreationForm = useCallback(() => {
        let isValid = true;
        const newErrors = { ...INITIAL_FORM_ERRORS }; 

        // Date and Novelty are primary requirements
        if (!overallForm.dateOverallExp || !dayjs(overallForm.dateOverallExp, 'YYYY-MM-DD', true).isValid()) {
            newErrors.dateOverallExp = 'Fecha inválida o faltante'; isValid = false;
        } else if (dayjs(overallForm.dateOverallExp).isAfter(dayjs(), 'day')) {
             newErrors.dateOverallExp = 'La fecha no puede ser futura.'; isValid = false;
        }
        if (!overallForm.novelty_expense || !overallForm.novelty_expense.trim()) {
             newErrors.novelty_expense = 'La novedad es obligatoria'; isValid = false;
        }

        // selectedExpenseTypeId is only required if items are added.
        // But if it's selected, it should be a valid one (handled by select options).
        // No direct error for selectedExpenseTypeId at this stage unless trying to add items without it.

        // addedExpenses.length === 0 is now allowed.
        // if (addedExpenses.length === 0) {
        //     newErrors.expenseItems = 'Debe agregar al menos un concepto de gasto.'; isValid = false;
        // }

        if (editingItemIndex !== null) {
            newErrors.expenseItems = (newErrors.expenseItems ? newErrors.expenseItems + " " : "") + 'Termine de editar el concepto actual o cancele la edición antes de guardar.';
            isValid = false;
        }
        setFormErrors(newErrors);
        return isValid;
    }, [overallForm, editingItemIndex /* removed addedExpenses, selectedExpenseTypeId as direct dependencies */]);

    const handleCreateSubmit = useCallback(async () => {
        if (!validateCreationForm()) {
            toast.error("Corrija los errores del formulario.", { icon: <XCircle className="text-danger" /> });
            return;
        }
        
        // If items are added, a general expense type must have been selected.
        if (addedExpenses.length > 0 && !selectedExpenseTypeId) {
            setFormErrors(prev => ({ ...prev, selectedExpenseTypeId: 'Si agrega conceptos, debe seleccionar un Tipo de Gasto General.' }));
            toast.error("Seleccione un Tipo de Gasto General si va a agregar conceptos.", { icon: <XCircle className="text-danger" /> });
            return;
        }

        setIsSubmitting(true); setApiError(null);
        const toastId = toast.loading('Guardando registro...');

        const payload = {
            idExpenseType: selectedExpenseTypeId ? parseInt(selectedExpenseTypeId) : null, // Allow null if backend supports it
            dateOverallExp: overallForm.dateOverallExp,
            novelty_expense: overallForm.novelty_expense,
            status: overallForm.status, 
            expenseItems: addedExpenses.map(item => ({
                idSpecificConcept: item.idSpecificConcept,
                price: item.price, 
                baseSalary: item.baseSalary,
                numEmployees: item.numEmployees,
                addBonus: item.addBonus, 
                bonusAmount: item.bonusAmount
            }))
        };
        try {
            await MonthlyOverallExpenseService.createMonthlyOverallExpense(payload);
            toast.success("Registro creado exitosamente.", { id: toastId, icon: <CheckCircle className="text-success" /> });
            setShowForm(false);
            resetFullForm(); 
            await fetchMonthlyExpenseRecords(false); 
        } catch (error) {
            console.error("Error al crear gasto mensual:", error);
            const errorMessage = error.response?.data?.message || error.message || "Error al guardar.";
            setApiError(errorMessage);
            toast.error(`Error: ${errorMessage}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    }, [overallForm, addedExpenses, validateCreationForm, resetFullForm, fetchMonthlyExpenseRecords, selectedExpenseTypeId]);

    // --- Edit Modal Logic (para editar CABECERA del registro mensual) ---
    const openEditModal = useCallback((item) => {
        setSelectedMonthlyExpense(item); 
        setOverallForm({ 
            dateOverallExp: item.dateOverallExp ? dayjs(item.dateOverallExp).format('YYYY-MM-DD') : '',
            novelty_expense: item.novelty_expense || '',
            status: item.status !== undefined ? item.status : true, 
        });
        setFormErrors(INITIAL_FORM_ERRORS);
        setApiError(null);
        setEditModalOpen(true);
    }, []);

    const closeEditModal = useCallback(() => {
        setEditModalOpen(false);
        setSelectedMonthlyExpense(null);
        setOverallForm(INITIAL_OVERALL_FORM_STATE);
        setFormErrors(INITIAL_FORM_ERRORS);
    }, []);

    const validateEditForm = useCallback(() => {
         let isValid = true; const newErrors = { dateOverallExp: null, novelty_expense: null };
         if (!overallForm.dateOverallExp || !dayjs(overallForm.dateOverallExp, 'YYYY-MM-DD', true).isValid()) {
             newErrors.dateOverallExp = 'Fecha inválida o faltante'; isValid = false;
         } else if (dayjs(overallForm.dateOverallExp).isAfter(dayjs(), 'day')) {
             newErrors.dateOverallExp = 'La fecha no puede ser futura.'; isValid = false;
         }
         if (!overallForm.novelty_expense || !overallForm.novelty_expense.trim()) {
              newErrors.novelty_expense = 'La novedad es obligatoria'; isValid = false;
         }
         setFormErrors(prev => ({ ...prev, ...newErrors })); return isValid;
    }, [overallForm.dateOverallExp, overallForm.novelty_expense]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedMonthlyExpense || !validateEditForm()) {
            toast.error("Corrija los errores del formulario de edición.", { icon: <XCircle className="text-danger"/> }); return;
        }
        setIsSubmitting(true); setApiError(null);
        const toastId = toast.loading('Actualizando registro...');
        const payload = {
            dateOverallExp: overallForm.dateOverallExp,
            novelty_expense: overallForm.novelty_expense
        };
        try {
            await MonthlyOverallExpenseService.updateMonthlyOverallExpense(selectedMonthlyExpense.idOverallMonth, payload);
            toast.success("Registro actualizado exitosamente.", { id: toastId, icon: <CheckCircle className="text-success"/> });
            closeEditModal();
            await fetchMonthlyExpenseRecords(false);
        } catch (error) {
            console.error("Error updating monthly expense header:", error);
            const errorMessage = error.response?.data?.message || error.message || "Error al actualizar.";
            setApiError(errorMessage); 
            toast.error(`Error: ${errorMessage}`, { id: toastId, icon: <XCircle className="text-danger"/>, duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedMonthlyExpense, overallForm, validateEditForm, closeEditModal, fetchMonthlyExpenseRecords]);
    
    const toggleConfirmModal = useCallback(() => { if (isConfirmActionLoading) return; setConfirmModalOpen(prev => !prev); }, [isConfirmActionLoading]);
    
    useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS); confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    const prepareConfirmation = useCallback((actionFn, props) => {
        confirmActionRef.current = () => {
            if (actionFn) actionFn(props.itemDetails); 
            else { console.error("Confirm actionFn is null."); toggleConfirmModal(); }
        };
        setConfirmModalProps(props); setConfirmModalOpen(true);
    }, [toggleConfirmModal]);

    const requestChangeStatusConfirmation = useCallback((item) => {
        if (!item || item.idOverallMonth == null) { console.error("Invalid item for status change:", item); return; }
        const { idOverallMonth, status: currentStatus } = item;
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";
        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: ( <p>¿Está seguro que desea <strong>{actionText}</strong> el registro mensual con ID <strong>#{idOverallMonth}</strong>? <br /> Su nuevo estado será: <strong>{futureStatusText}</strong>.</p> ),
            confirmText: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: confirmColor, itemDetails: { idOverallMonth, currentStatus }
        });
    }, [prepareConfirmation]);

    const executeChangeStatus = useCallback(async (details) => {
        if (!details || details.idOverallMonth == null) {
            toast.error("Error interno al cambiar estado."); toggleConfirmModal(); return;
        }
        const { idOverallMonth, currentStatus } = details;
        const newStatus = !currentStatus;
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${currentStatus ? "Desactivando" : "Activando"} registro...`);
        
        const originalRecords = [...monthlyExpenseRecords];
        setMonthlyExpenseRecords(prevData => prevData.map(item => 
            item.idOverallMonth === idOverallMonth ? { ...item, status: newStatus } : item 
        ));

        try {
            await MonthlyOverallExpenseService.changeStateMonthlyOverallExpense(idOverallMonth, newStatus);
            toast.success(`Estado actualizado a ${newStatus ? 'Activo' : 'Inactivo'}.`, { id: toastId, icon: <CheckCircle /> });
        } catch (error) {
            toast.error(`Error al cambiar estado: ${error.response?.data?.message || error.message || 'Error desconocido'}`, { id: toastId, icon: <XCircle className="text-danger"/> });
            setMonthlyExpenseRecords(originalRecords); 
        } finally {
            setIsConfirmActionLoading(false);
            toggleConfirmModal();
        }
    }, [monthlyExpenseRecords, toggleConfirmModal]);

    const handleTableSearch = useCallback((e) => { setTableSearchText(e.target.value); setCurrentPage(1); }, []);
    const handlePageChange = useCallback((pageNumber) => { setCurrentPage(pageNumber); }, []);

    const navigateToManageExpenseTypes = useCallback(() => navigate('/home/conceptos-gasto'), [navigate]);
    const navigateToManageSpecificConcepts = useCallback(() => navigate('/home/gestion-conceptos-especificos'), [navigate]);
    const handleNavigateToEmployees = useCallback(() => navigate('/home/rendimiento-empleado'), [navigate]);
    
    const openDetailModal = useCallback((item) => { setSelectedMonthlyExpense(item); setDetailModalOpen(true); }, []);
    const closeDetailModal = useCallback(() => { setDetailModalOpen(false); setSelectedMonthlyExpense(null); }, []);

    const filteredMonthlyExpenseRecords = useMemo(() => {
        if (!Array.isArray(monthlyExpenseRecords)) return [];
        const sortedData = [...monthlyExpenseRecords].sort((a, b) => (b.idOverallMonth || 0) - (a.idOverallMonth || 0));
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedData;

        return sortedData.filter(item => {
            const expenseType = expenseTypes.find(et => et.idExpenseType === item.idExpenseType);
            const expenseTypeName = expenseType ? expenseType.name.toLowerCase() : (item.idExpenseType ? `tipo id ${item.idExpenseType}` : 'sin tipo general');


            return item && (
                String(item.idOverallMonth || '').toLowerCase().includes(lowerSearchText) ||
                (item.dateOverallExp && dayjs(item.dateOverallExp).format('DD/MM/YYYY').includes(lowerSearchText)) ||
                String(item.valueExpense ?? '').toLowerCase().includes(lowerSearchText) ||
                (item.novelty_expense || '').toLowerCase().includes(lowerSearchText) ||
                expenseTypeName.includes(lowerSearchText) 
            );
        });
    }, [monthlyExpenseRecords, tableSearchText, expenseTypes]);

    const totalItems = useMemo(() => filteredMonthlyExpenseRecords.length, [filteredMonthlyExpenseRecords]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);
    const currentItemsOnPage = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredMonthlyExpenseRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredMonthlyExpenseRecords, validCurrentPage]);

    useEffect(() => { 
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (currentPage === 0 && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const totalExpensesInForm = useMemo(() => { 
        return addedExpenses.reduce((sum, item) => sum + Number(item.price || 0), 0);
    }, [addedExpenses]);

    if (isLoadingExpenseTypes && showForm) { 
        return (
            <Container fluid className="p-4 main-content text-center">
                <Spinner color="primary" className="mt-5" style={{ width: '3rem', height: '3rem' }} />
                <p className="mt-2">Cargando configuración de tipos de gasto...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            {!showForm ? (
                <>
                    <h2 className="mb-4"><FileText size={28} className="me-2" />Gestión de Gastos Mensuales</h2>
                     <Row className="mb-3 align-items-center">
                        <Col md={5} lg={4}>
                            <Input
                                bsSize="sm" type="text" placeholder="Buscar por ID, Fecha, Tipo, Novedad..."
                                value={tableSearchText} onChange={handleTableSearch}
                            />
                        </Col>
                        <Col md={7} lg={8} className="text-md-end mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-2">
                            <Button color="info" outline size="sm" onClick={handleNavigateToEmployees} title="Ir a Empleados">
                                <Users size={16} className="me-1" /> Empleados
                            </Button>

                            <Dropdown isOpen={gastosDropdownOpen} toggle={toggleGastosDropdown} size="sm">
                                <DropdownToggle caret color="secondary" outline>
                                    <ListChecks size={16} className="me-1" /> Configurar Gastos
                                </DropdownToggle>
                                <DropdownMenu end>
                                    <DropdownItem header>Administración de Conceptos</DropdownItem>
                                    <DropdownItem onClick={navigateToManageExpenseTypes}>
                                        <Settings size={16} className="me-2 text-muted" />Gestionar Tipos de Gasto
                                    </DropdownItem>
                                    <DropdownItem onClick={navigateToManageSpecificConcepts}>
                                        <SlidersHorizontal size={16} className="me-2 text-muted" />Gestionar Conceptos Específicos
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                            
                            <Button color="success" size="sm" onClick={() => { resetFullForm(); setShowForm(true); }} className="button-add">
                                <Plus size={18} className="me-1" /> Crear Gasto Mensual
                            </Button>
                        </Col>
                    </Row>
                    
                    <div className="table-responsive shadow-sm custom-table-container mb-3">
                        <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                            <thead className="table-dark">
                                <tr>
                                    <th style={{ width: '8%' }}>ID</th>
                                    <th style={{ width: '15%' }}>Fecha</th>
                                    <th style={{ width: '20%' }}>Tipo Gasto General</th>
                                    <th style={{ width: '15%' }} className="text-end">Monto Total</th>
                                    <th>Novedades</th>
                                    <th style={{ width: '8%' }} className="text-center">Estado</th>
                                    <th style={{ width: '12%' }} className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingTable ? (
                                    <tr><td colSpan="7" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                                ) : currentItemsOnPage.length > 0 ? (
                                    currentItemsOnPage.map((item) => {
                                        const expenseTypeInfo = expenseTypes.find(et => et.idExpenseType === item.idExpenseType);
                                        return (
                                            <tr key={item.idOverallMonth} style={{ verticalAlign: 'middle' }}>
                                                <th scope="row">{item.idOverallMonth}</th>
                                                <td>{item.dateOverallExp ? dayjs(item.dateOverallExp).format('DD/MM/YYYY') : '-'}</td>
                                                <td>{expenseTypeInfo ? expenseTypeInfo.name : (item.idExpenseType ? `ID ${item.idExpenseType}`: <span className="text-muted fst-italic">N/A</span>)}</td>
                                                <td className="text-end">{formatCurrencyCOP(item.valueExpense)}</td>
                                                <td>{item.novelty_expense || '-'}</td>
                                                <td className="text-center">
                                                    <Button
                                                        outline color={item.status ? "success" : "secondary"} size="sm" className="p-1"
                                                        onClick={() => requestChangeStatusConfirmation(item)}
                                                        disabled={item.idOverallMonth == null || isConfirmActionLoading}
                                                        title={item.status ? "Activo (Clic para inactivar)" : "Inactivo (Clic para activar)"}
                                                    >
                                                        {item.status ? "Activo" : "Inactivo"}
                                                    </Button>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-inline-flex gap-1 action-cell-content">
                                                        <Button color="warning" outline size="sm" onClick={() => openEditModal(item)} title="Editar Cabecera" className="p-1" disabled={isConfirmActionLoading}> <Edit size={14} /> </Button>
                                                        <Button color="info" outline size="sm" onClick={() => openDetailModal(item)} title="Ver Detalles" className="p-1" disabled={isConfirmActionLoading}> <Eye size={14} /> </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="7" className="text-center fst-italic p-4">
                                        {tableSearchText ? 'No se encontraron resultados para "' + tableSearchText + '".' : 'No hay registros de gastos mensuales.'}
                                        {!isLoadingTable && monthlyExpenseRecords.length === 0 && !tableSearchText && (
                                             <span className="d-block mt-2">Aún no hay gastos mensuales registrados. <Button size="sm" color="link" onClick={() => {resetFullForm(); setShowForm(true);}} className="p-0 align-baseline">Crear el primero</Button></span>
                                        )}
                                    </td></tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                     {!isLoadingTable && totalPages > 1 && (
                        <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    )}
                </>
            ) : ( 
                <Card className="shadow-sm">
                     <CardHeader className="bg-light">
                        <Row className="align-items-center">
                            <Col xs="auto">
                                <Button color="secondary" outline size="sm" onClick={() => { setShowForm(false); resetFullForm(); }} disabled={isSubmitting}>
                                    <ArrowLeft size={18} /> Volver
                                </Button>
                            </Col>
                            <Col><h4 className="mb-0 text-center">Crear Gasto Mensual</h4></Col>
                             <Col xs="auto" style={{ visibility: 'hidden' }}><Button size="sm" outline><ArrowLeft/></Button></Col>
                        </Row>
                    </CardHeader>
                    <CardBody>
                        {apiError && <Alert color="danger" size="sm" className="py-2 px-3">{apiError}</Alert>}
                        <Form id="createMonthlyExpenseForm" noValidate onSubmit={(e) => e.preventDefault()}>
                             {/* Moved Fecha and Novedades to the top */}
                             <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="dateOverallExp" className="form-label fw-bold">Fecha Mes <span className="text-danger">*</span></Label>
                                        <Input id="dateOverallExp" bsSize="sm" type="date" name="dateOverallExp"
                                            value={overallForm.dateOverallExp} onChange={handleOverallFormChange} max={dayjs().format('YYYY-MM-DD')}
                                            invalid={!!formErrors.dateOverallExp} disabled={isSubmitting} required />
                                        <FormFeedback>{formErrors.dateOverallExp}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="novelty_expense" className="form-label fw-bold">Novedades Mes <span className="text-danger">*</span></Label>
                                        <Input id="novelty_expense" bsSize="sm" type="text" name="novelty_expense"
                                            value={overallForm.novelty_expense} onChange={handleOverallFormChange} placeholder="Describa eventos..."
                                            invalid={!!formErrors.novelty_expense} disabled={isSubmitting} required />
                                        <FormFeedback>{formErrors.novelty_expense}</FormFeedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <hr />
                            {/* Tipo de Gasto General - Optional for saving record, but required for adding items */}
                             <Row className="g-3 mb-4">
                                <Col md={12}> {/* Spans full width, or adjust as needed */}
                                    <FormGroup>
                                        <Label for="selectedExpenseTypeId" className="form-label fw-bold">
                                            Tipo de Gasto General <small className="text-muted">(Opcional si no agrega conceptos específicos)</small>
                                        </Label>
                                        <Input
                                            type="select" name="selectedExpenseTypeId" id="selectedExpenseTypeId"
                                            bsSize="sm" value={selectedExpenseTypeId} onChange={handleSelectedExpenseTypeChange}
                                            disabled={isSubmitting || isLoadingExpenseTypes || expenseTypes.length === 0}
                                            invalid={!!formErrors.selectedExpenseTypeId} // Error might show if trying to add items without it
                                        >
                                            <option value="">Seleccione un Tipo...</option>
                                            {expenseTypes.map(type => (
                                                <option key={type.idExpenseType} value={type.idExpenseType}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </Input>
                                        <FormFeedback>{formErrors.selectedExpenseTypeId}</FormFeedback>
                                        {isLoadingExpenseTypes && <Spinner size="sm" className="ms-2" />}
                                        {expenseTypes.length === 0 && !isLoadingExpenseTypes && (
                                            <FormText color="muted">No hay Tipos de Gasto Generales activos. Configúrelos para poder agregar conceptos.</FormText>
                                        )}
                                    </FormGroup>
                                </Col>
                            </Row>
                            <hr />
                            
                            <div id="addExpenseItemSection">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0">{editingItemIndex !== null ? 'Editando Concepto Específico' : 'Agregar Conceptos Específicos'}</h5>
                                    <Button color="info" outline size="sm" onClick={navigateToManageSpecificConcepts} title="Gestionar los Conceptos Específicos">
                                        <SlidersHorizontal size={16} className="me-1"/> Configurar Conceptos
                                    </Button>
                                </div>

                                {formErrors.expenseItems && !editingItemIndex && <Alert color="danger" size="sm" className="py-2 px-3 mb-2">{formErrors.expenseItems}</Alert>}
                                
                                {!selectedExpenseTypeId && (
                                     <Alert color="info" size="sm" className="py-2 px-3 mb-3">
                                        <Info size={18} className="me-2"/>
                                        Seleccione un Tipo de Gasto General arriba para habilitar la adición de conceptos específicos.
                                    </Alert>
                                )}
                                {selectedExpenseTypeId && specificConcepts.length === 0 && !isLoadingSpecificConcepts && (
                                    <Alert color="warning" size="sm" className="py-2 px-3 mb-3">
                                        <AlertTriangle size={18} className="me-2"/>
                                        No hay conceptos específicos activos para el tipo de gasto seleccionado.
                                        Puede <Button color="link" size="sm" className="p-0 alert-link" onClick={navigateToManageSpecificConcepts}>crearlos aquí</Button>.
                                    </Alert>
                                )}

                                <Row className="g-3 mb-3 align-items-start">
                                    <Col md={isSpecialSalaryConceptSelected ? 12 : 5} lg={5}>
                                        <Label for="idSpecificConcept" className="form-label">Concepto Específico <span className="text-danger">*</span></Label>
                                        <ConceptSpentSelect
                                            id="idSpecificConcept" name="idSpecificConcept" value={itemForm.idSpecificConcept}
                                            onChange={handleItemFormChange} conceptSpents={specificConcepts}
                                            valueField="idSpecificConcept" labelField="name"
                                            invalid={!!formErrors.idSpecificConcept}
                                            disabled={isSubmitting || !selectedExpenseTypeId || isLoadingSpecificConcepts || specificConcepts.length === 0}
                                            bsSize="sm" defaultOptionText={
                                                isLoadingSpecificConcepts ? "Cargando conceptos..." :
                                                !selectedExpenseTypeId ? "Seleccione Tipo General primero" :
                                                specificConcepts.length === 0 ? "No hay conceptos disponibles" :
                                                "Seleccione un concepto..."
                                            }
                                        />
                                        {isLoadingSpecificConcepts && <Spinner size="sm" className="ms-2"/>}
                                        <FormFeedback className={formErrors.idSpecificConcept ? 'd-block' : ''}>{formErrors.idSpecificConcept}</FormFeedback>
                                    </Col>
                                    {isSpecialSalaryConceptSelected && ( <> <Col md={6} lg={3}> <FormGroup> <Label for="numEmployees" className="form-label">Nº Empleados <span className="text-danger">*</span></Label> <InputGroup size="sm"> <InputGroupText><Hash size={14}/></InputGroupText> <Input id="numEmployees" type="number" name="numEmployees" value={itemForm.numEmployees} onChange={handleItemFormChange} placeholder="1" min="1" step="1" invalid={!!formErrors.numEmployees} disabled={isSubmitting || !itemForm.idSpecificConcept || !selectedExpenseTypeId} required /> </InputGroup> <FormFeedback className={formErrors.numEmployees ? 'd-block' : ''}>{formErrors.numEmployees}</FormFeedback> </FormGroup> </Col> <Col md={6} lg={4}> <FormGroup> <Label for="price" className="form-label">Sueldo Base (COP) <span className="text-danger">*</span></Label> <InputGroup size="sm"> <InputGroupText><DollarSign size={14}/></InputGroupText> <Input id="price" type="number" name="price" value={itemForm.price} onChange={handleItemFormChange} placeholder="0.00" min="0.01" step="any" invalid={!!formErrors.price} disabled={isSubmitting || !itemForm.idSpecificConcept || !selectedExpenseTypeId} required /> </InputGroup> <FormFeedback className={formErrors.price ? 'd-block' : ''}>{formErrors.price}</FormFeedback> </FormGroup> </Col> <Col md={12} lg={5} className="mt-lg-0"> <FormGroup check inline className="mb-2 mt-lg-4 pt-lg-2"> <Input type="checkbox" name="addBonus" id="addBonus" checked={itemForm.addBonus} onChange={handleItemFormChange} disabled={isSubmitting || !itemForm.idSpecificConcept || !selectedExpenseTypeId} /> <Label for="addBonus" check>¿Agregar Bonificación?</Label> </FormGroup> {itemForm.addBonus && ( <FormGroup> <Label for="bonusAmount" className="form-label visually-hidden">Valor Bonificación</Label> <InputGroup size="sm"> <InputGroupText><DollarSign size={14}/></InputGroupText> <Input id="bonusAmount" type="number" name="bonusAmount" value={itemForm.bonusAmount} onChange={handleItemFormChange} placeholder="Monto Bonificación" min="0" step="any" invalid={!!formErrors.bonusAmount} disabled={isSubmitting || !itemForm.idSpecificConcept || !selectedExpenseTypeId} /> </InputGroup> <FormFeedback className={formErrors.bonusAmount ? 'd-block' : ''}>{formErrors.bonusAmount}</FormFeedback> </FormGroup> )} </Col> </> )}
                                    {!isSpecialSalaryConceptSelected && itemForm.idSpecificConcept && ( <Col md={4}> <Label for="price" className="form-label">Precio (COP) <span className="text-danger">*</span></Label> <InputGroup size="sm"> <InputGroupText><DollarSign size={14}/></InputGroupText> <Input id="price" type="number" name="price" value={itemForm.price} onChange={handleItemFormChange} placeholder="0.00" min="0.01" step="any" invalid={!!formErrors.price} disabled={isSubmitting || !itemForm.idSpecificConcept || !selectedExpenseTypeId} required /> </InputGroup> <FormFeedback className={formErrors.price ? 'd-block' : ''}>{formErrors.price}</FormFeedback> </Col> )}

                                    <Col md={3} className="align-self-end">
                                        <Button
                                            color={editingItemIndex !== null ? "warning" : "success"} outline
                                            onClick={addOrUpdateExpenseToTable} className="w-100" size="sm"
                                            disabled={isSubmitting || !selectedExpenseTypeId || !itemForm.idSpecificConcept || !itemForm.price } >
                                            {editingItemIndex !== null ? <><Edit3 size={16} className="me-1"/> Actualizar</> : <><Plus size={16} className="me-1"/> Agregar</>}
                                        </Button>
                                        {editingItemIndex !== null && (
                                            <Button color="secondary" outline size="sm" className="w-100 mt-1" onClick={resetItemForm} disabled={isSubmitting}>
                                                Cancelar Edición
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
                            </div>
                             <h6 className="mt-4">Conceptos Agregados al Gasto Mensual:</h6>
                            <div className="table-responsive mb-3">
                                <Table size="sm" bordered className="detail-table align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50%' }}>Concepto Específico</th>
                                            <th style={{ width: '25%' }} className="text-end">Precio Final</th>
                                            <th style={{ width: '25%' }} className="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addedExpenses.length > 0 ? addedExpenses.map((item, index) => (
                                            <tr key={index} className={editingItemIndex === index ? 'table-warning' : ''}>
                                                <td>
                                                    {item.conceptName}
                                                    {item.requiresEmployeeCalculation && (
                                                        <FormText color="muted" className="d-block small">
                                                            Base: {formatCurrencyCOP(item.baseSalary)} x {item.numEmployees} emp.
                                                            {item.addBonus && item.bonusAmount > 0 ? ` + Bono: ${formatCurrencyCOP(item.bonusAmount)}` : ''}
                                                        </FormText>
                                                    )}
                                                </td>
                                                <td className="text-end">{formatCurrencyCOP(item.price)}</td>
                                                <td className="text-center">
                                                    <Button color="warning" outline size="sm" className="p-1 me-1" onClick={() => startEditAddedItem(index)} disabled={isSubmitting} title="Editar Concepto"> <Edit3 size={14} /> </Button>
                                                    <Button color="danger" outline size="sm" className="p-1" onClick={() => removeExpenseFromTable(index)} disabled={isSubmitting} title="Quitar Concepto"> <Trash2 size={14} /> </Button>
                                                </td>
                                            </tr>))
                                        : (<tr><td colSpan="3" className="text-center text-muted fst-italic py-3">Aún no se han agregado conceptos. Seleccione un Tipo de Gasto General para empezar.</td></tr>)}
                                    </tbody>
                                    {addedExpenses.length > 0 && (
                                        <tfoot><tr className="table-light"><th colSpan="1" className="text-end fw-bold">Total Agregado:</th><th className="text-end fw-bold">{formatCurrencyCOP(totalExpensesInForm)}</th><th></th></tr></tfoot>
                                    )}
                                </Table>
                            </div>
                         </Form>
                    </CardBody>
                    <CardHeader className="bg-light d-flex justify-content-end gap-2 border-top">
                        <Button color="secondary" outline onClick={() => { setShowForm(false); resetFullForm(); }} disabled={isSubmitting}>
                            <XCircle size={18} className="me-1" /> Cancelar
                        </Button>
                        <Button color="primary" onClick={handleCreateSubmit}
                            disabled={isSubmitting || editingItemIndex !== null /* || !overallForm.dateOverallExp || !overallForm.novelty_expense  <-- Handled by validateCreationForm */ }
                        >
                            {isSubmitting ? <><Spinner size="sm"/> Guardando...</> : <><Save size={18} className="me-1"/> Guardar Gasto Mensual</>}
                        </Button>
                    </CardHeader>
                </Card>
            )}

            {/* Modal de Edición de Cabecera */}
             <Modal isOpen={editModalOpen} toggle={!isSubmitting ? closeEditModal : undefined} centered backdrop="static" keyboard={!isSubmitting}>
                <ModalHeader toggle={!isSubmitting ? closeEditModal : undefined}> <Edit size={20} className="me-2" /> Editar Cabecera del Gasto Mensual </ModalHeader>
                <ModalBody>
                    {selectedMonthlyExpense && (
                        <p><strong>Tipo de Gasto:</strong> {expenseTypes.find(et => et.idExpenseType === selectedMonthlyExpense.idExpenseType)?.name || (selectedMonthlyExpense.idExpenseType ? `ID ${selectedMonthlyExpense.idExpenseType}` : <span className="text-muted fst-italic">No asignado</span>)}</p>
                    )}
                    {apiError && <Alert color="danger" size="sm">{apiError}</Alert>}
                    <Form id="editMonthlyExpenseForm" noValidate onSubmit={(e) => e.preventDefault()}>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label for="editDateOverallExp" className="form-label">Fecha <span className="text-danger">*</span></Label>
                                    <Input id="editDateOverallExp" bsSize="sm" type="date" name="dateOverallExp" value={overallForm.dateOverallExp} onChange={handleOverallFormChange} max={dayjs().format('YYYY-MM-DD')}
                                        invalid={!!formErrors.dateOverallExp} disabled={isSubmitting} required />
                                    <FormFeedback>{formErrors.dateOverallExp}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label for="editNoveltyExpense" className="form-label">Novedades <span className="text-danger">*</span></Label>
                                    <Input id="editNoveltyExpense" bsSize="sm" type="textarea" name="novelty_expense" value={overallForm.novelty_expense} onChange={handleOverallFormChange} rows={4}
                                        invalid={!!formErrors.novelty_expense} disabled={isSubmitting} required />
                                    <FormFeedback>{formErrors.novelty_expense}</FormFeedback>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
                     <p className="text-muted mt-3"><small>Nota: El tipo de gasto general, los conceptos específicos y el valor total solo se pueden modificar creando un nuevo registro mensual o si se implementa una edición detallada de ítems.</small></p>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={closeEditModal} disabled={isSubmitting}>Cancelar</Button>
                     <Button color="primary" onClick={handleEditSubmit} disabled={isSubmitting}>
                         {isSubmitting ? <><Spinner size="sm"/> Actualizando...</> : <><Save size={16}/> Actualizar Cabecera</>}
                     </Button>
                </ModalFooter>
            </Modal>

            {/* Modal de Detalles */}
            <Modal isOpen={detailModalOpen} toggle={closeDetailModal} centered size="lg" backdrop="static">
                <ModalHeader toggle={closeDetailModal}> <Eye size={20} className="me-2" /> Detalles del Gasto Mensual</ModalHeader>
                <ModalBody>
                    {selectedMonthlyExpense && (
                         <Table bordered striped size="sm"><tbody>
                            <tr><th style={{ width: '30%' }}>ID Registro</th><td>{selectedMonthlyExpense.idOverallMonth}</td></tr>
                            <tr><th>Tipo Gasto General</th><td>{expenseTypes.find(et => et.idExpenseType === selectedMonthlyExpense.idExpenseType)?.name || (selectedMonthlyExpense.idExpenseType ? `ID ${selectedMonthlyExpense.idExpenseType}` : <span className="text-muted fst-italic">No asignado</span>)}</td></tr>
                            <tr><th>Fecha</th><td>{selectedMonthlyExpense.dateOverallExp ? dayjs(selectedMonthlyExpense.dateOverallExp).format('DD [de] MMMM [de] YYYY') : '-'}</td></tr>
                            <tr><th>Valor Total</th><td>{formatCurrencyCOP(selectedMonthlyExpense.valueExpense)}</td></tr>
                            <tr><th>Novedades</th><td>{selectedMonthlyExpense.novelty_expense || <span className="text-muted fst-italic">Ninguna</span>}</td></tr>
                            <tr><th>Estado</th><td>{selectedMonthlyExpense.status ? 'Activo' : 'Inactivo'}</td></tr>
                            {selectedMonthlyExpense.expenseItems && selectedMonthlyExpense.expenseItems.length > 0 && (
                                <>
                                <tr><td colSpan="2" className="fw-bold bg-light">Conceptos Específicos Aplicados:</td></tr>
                                {selectedMonthlyExpense.expenseItems.map((item, idx) => (
                                    <tr key={`detail-item-${idx}`}>
                                        <th>{item.conceptDetails?.name || item.concept?.name || `Concepto ID ${item.idSpecificConcept}`}</th>
                                        <td>
                                            {formatCurrencyCOP(item.price)}
                                            {(item.conceptDetails?.requiresEmployeeCalculation || item.concept?.requiresEmployeeCalculation) && ( 
                                                <small className="d-block text-muted">
                                                    (Base: {formatCurrencyCOP(item.baseSalary)} x {item.numEmployees} emp.
                                                    {item.hasBonus || item.addBonus ? ` + Bono: ${formatCurrencyCOP(item.bonusAmount)}` : ''}) 
                                                </small>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </>
                            )}
                            {(!selectedMonthlyExpense.expenseItems || selectedMonthlyExpense.expenseItems.length === 0) && (
                                 <tr><td colSpan="2" className="text-muted fst-italic">No se agregaron conceptos específicos a este registro.</td></tr>
                            )}
                         </tbody></Table>
                    )}
                </ModalBody>
                <ModalFooter><Button color="secondary" outline onClick={closeDetailModal}>Cerrar</Button></ModalFooter>
            </Modal>

            {/* Modal de Confirmación */}
             <ConfirmationModal 
                isOpen={confirmModalOpen} 
                toggle={toggleConfirmModal} 
                title={confirmModalProps.title} 
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()} 
                confirmText={confirmModalProps.confirmText} 
                confirmColor={confirmModalProps.confirmColor} 
                isConfirming={isConfirmActionLoading}
            >
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default ManoDeObra;