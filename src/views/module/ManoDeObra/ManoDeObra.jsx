// src/components/ManoDeObra/ManoDeObra.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/App.css';
import '../../../assets/css/index.css'; // Asegúrate de tener este archivo si defines .expense-item-card allí
import {
    Table, Button, Container, Row, Col, Input, FormGroup, Label, FormFeedback,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Card, CardBody, CardHeader,
    Form, Alert, InputGroup, InputGroupText, FormText,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import {
    Eye, Edit, Trash2, Plus, ArrowLeft, Save, Users, ListFilter, XCircle,
    AlertTriangle, CheckCircle, Settings, DollarSign, Hash, Edit3,
    SlidersHorizontal, ListChecks, FileText, Info,
    Tag, Briefcase, CalendarDays
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components ---
import { formatCurrencyCOP } from "../../../utils/formatting";
import CustomPagination from '../../General/CustomPagination';
import { ConfirmationModal } from '../../General/ConfirmationModal';

// --- Services ---
import MonthlyOverallExpenseService from "../../services/MonthlyOverallExpenseService";
import ExpenseCategoryService from "../../services/ExpenseCategoryService";
import SpecificConceptSpentService from "../../services/SpecificConceptSpentService";

// --- Constants ---
const ITEMS_PER_PAGE_MAIN_TABLE = 7;
const ITEMS_PER_PAGE_MODAL_DETAIL = 3;

const INITIAL_OVERALL_FORM_STATE = {
    dateOverallExp: dayjs().format('YYYY-MM-DD'),
    noveltyExpense: '',
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
    dateOverallExp: null, noveltyExpense: null, expenseItems: null,
    idSpecificConcept: null, price: null, numEmployees: null, bonusAmount: null,
};
const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null, isOpen: false, isConfirming: false
};

const ManoDeObra = () => {
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
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [isLoadingExpenseCategories, setIsLoadingExpenseCategories] = useState(true);
    const [specificConcepts, setSpecificConcepts] = useState([]);
    const [isLoadingSpecificConcepts, setIsLoadingSpecificConcepts] = useState(true);
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedMonthlyExpense, setSelectedMonthlyExpense] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [gastosDropdownOpen, setGastosDropdownOpen] = useState(false);
    const [detailModalCurrentPage, setDetailModalCurrentPage] = useState(1);

    const confirmActionRef = useRef(null);
    const navigate = useNavigate();

    const toggleGastosDropdown = () => setGastosDropdownOpen(prevState => !prevState);
    const navigateToManageExpenseCategories = useCallback(() => navigate('/home/mano-de-obra/gastos'), [navigate]);
    const navigateToManageSpecificConcepts = useCallback(() => navigate('/home/mano-de-obra/conceptos'), [navigate]);
    const handleNavigateToEmployees = useCallback(() => navigate('/home/mano-de-obra/rendimiento'), [navigate]);

    const fetchAllExpenseCategoriesData = useCallback(async () => { setIsLoadingExpenseCategories(true); try { const c = await ExpenseCategoryService.getAllExpenseCategories(); setExpenseCategories(Array.isArray(c) ? c : []); } catch (e) { console.error("Error fetching categories:", e); toast.error("Error cargando categorías."); } finally { setIsLoadingExpenseCategories(false); }}, []);
    const fetchMonthlyExpenseRecords = useCallback(async (showSpinner = true) => { if (showSpinner) setIsLoadingTable(true); try { const e = await MonthlyOverallExpenseService.getAllMonthlyOverallExpenses(); setMonthlyExpenseRecords(Array.isArray(e) ? e : []); } catch (err) { console.error("Error fetching records:", err); toast.error("Error cargando gastos mensuales."); } finally { if (showSpinner) setIsLoadingTable(false); }}, []);
    const fetchAllActiveSpecificConcepts = useCallback(async () => { setIsLoadingSpecificConcepts(true); try { const c = await SpecificConceptSpentService.getAllSpecificConceptSpents({ status: true }); setSpecificConcepts(Array.isArray(c) ? c : []); if (c.length === 0 && showForm) toast.info("No hay conceptos de gasto activos."); } catch (err) { console.error("Error fetching specific concepts:", err); toast.error("Error cargando conceptos específicos."); } finally { setIsLoadingSpecificConcepts(false); }}, [showForm]);

    useEffect(() => { fetchMonthlyExpenseRecords(); fetchAllExpenseCategoriesData(); fetchAllActiveSpecificConcepts(); }, [fetchMonthlyExpenseRecords, fetchAllExpenseCategoriesData, fetchAllActiveSpecificConcepts]);

    const resetOverallForm = useCallback(() => { setOverallForm(INITIAL_OVERALL_FORM_STATE); setAddedExpenses([]); setFormErrors(prev => ({ ...INITIAL_FORM_ERRORS, expenseItems: prev.expenseItems })); setApiError(null); setIsSubmitting(false); }, []);
    const resetItemForm = useCallback(() => { setItemForm(INITIAL_ITEM_FORM_STATE); setEditingItemIndex(null); setFormErrors(prev => ({ ...prev, idSpecificConcept: null, price: null, numEmployees: null, bonusAmount: null, })); setIsSpecialSalaryConceptSelected(false); }, []);
    const resetFullForm = useCallback(() => { resetOverallForm(); resetItemForm(); setFormErrors(INITIAL_FORM_ERRORS); }, [resetOverallForm, resetItemForm]);

    const handleOverallFormChange = useCallback((e) => { const { name, value } = e.target; setOverallForm(p => ({ ...p, [name]: value })); if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: null })); if (apiError) setApiError(null); }, [formErrors, apiError]);
    const handleItemFormChange = useCallback((e) => { const { name, value, type, checked } = e.target; const val = type === 'checkbox' ? checked : value; setItemForm(p => ({ ...p, [name]: val })); if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: null })); if (apiError) setApiError(null); if (formErrors.expenseItems && (name === 'idSpecificConcept' || name === 'price' || name === 'numEmployees' || name === 'bonusAmount')) setFormErrors(p => ({ ...p, expenseItems: null })); if (name === 'idSpecificConcept') { setItemForm(p => ({ ...p, price: '', numEmployees: '1', addBonus: false, bonusAmount: '' })); setFormErrors(p => ({ ...p, price: null, numEmployees: null, bonusAmount: null })); } }, [formErrors, apiError]);

    useEffect(() => { if (itemForm.idSpecificConcept && specificConcepts.length > 0) { const c = specificConcepts.find(c => c.idSpecificConcept === parseInt(itemForm.idSpecificConcept)); const iS = c && c.requiresEmployeeCalculation === true; setIsSpecialSalaryConceptSelected(iS); if (!iS) setItemForm(p => ({ ...p, numEmployees: '1', addBonus: false, bonusAmount: '' })); } else { setIsSpecialSalaryConceptSelected(false); setItemForm(p => ({ ...p, price: '', numEmployees: '1', addBonus: false, bonusAmount: '' })); } }, [itemForm.idSpecificConcept, specificConcepts]);

    const calculateItemFinalPrice = useCallback((cI) => { const bP = parseFloat(cI.price) || 0; let fP = bP; if (cI.idSpecificConcept && specificConcepts.length > 0) { const c = specificConcepts.find(c => c.idSpecificConcept === parseInt(cI.idSpecificConcept)); const iS = c && c.requiresEmployeeCalculation === true; if (iS) { const nE = parseInt(cI.numEmployees) || 1; fP = bP * nE; if (cI.addBonus) fP += parseFloat(cI.bonusAmount) || 0; } } return fP; }, [specificConcepts]);
    const addOrUpdateExpenseToTable = useCallback(() => { let iV = true; const nE = { idSpecificConcept: null, price: null, numEmployees: null, bonusAmount: null }; let eE; const pIP = parseFloat(itemForm.price); if (!itemForm.idSpecificConcept) { nE.idSpecificConcept = 'Debe seleccionar un concepto.'; iV = false; } const cC = specificConcepts.find(c => c.idSpecificConcept === parseInt(itemForm.idSpecificConcept)); if (!itemForm.price || isNaN(pIP) || pIP <= 0) { nE.price = `El ${isSpecialSalaryConceptSelected ? 'sueldo base' : 'valor'} debe ser > 0`; iV = false; } if (isSpecialSalaryConceptSelected) { const nEVal = parseInt(itemForm.numEmployees); if (isNaN(nEVal) || nEVal < 1) { nE.numEmployees = 'Cantidad inválida (mín. 1)'; iV = false; } if (itemForm.addBonus) { const b = parseFloat(itemForm.bonusAmount); if (isNaN(b) || b < 0) { nE.bonusAmount = 'Bonificación inválida (>= 0)'; iV = false; } } } if (iV && cC) { const fP = calculateItemFinalPrice(itemForm); eE = { idSpecificConcept: parseInt(itemForm.idSpecificConcept, 10), conceptName: cC.name || 'N/A', price: fP, baseSalary: isSpecialSalaryConceptSelected ? pIP : null, numEmployees: isSpecialSalaryConceptSelected ? parseInt(itemForm.numEmployees) : null, addBonus: isSpecialSalaryConceptSelected ? itemForm.addBonus : false, bonusAmount: isSpecialSalaryConceptSelected && itemForm.addBonus ? (parseFloat(itemForm.bonusAmount) || 0) : null, requiresEmployeeCalculation: cC.requiresEmployeeCalculation, idExpenseCategory: cC.expenseCategoryDetails?.idExpenseCategory, categoryName: cC.expenseCategoryDetails?.name || 'N/A', }; } else if (!cC && itemForm.idSpecificConcept) { nE.idSpecificConcept = 'Concepto no encontrado.'; iV = false; } if (!iV) { setFormErrors(pE => ({ ...pE, ...nE })); toast.error("Verifique campos.", { icon: <AlertTriangle /> }); return; } if (eE) { if (editingItemIndex !== null) { const uE = [...addedExpenses]; uE[editingItemIndex] = eE; setAddedExpenses(uE); toast.success("Concepto actualizado.", { icon: <CheckCircle /> }); } else { setAddedExpenses(pE => [...pE, eE]); toast.success("Concepto agregado.", { icon: <CheckCircle /> }); } resetItemForm(); setFormErrors(pE => ({ ...pE, expenseItems: null, ...nE })); } }, [itemForm, specificConcepts, editingItemIndex, addedExpenses, calculateItemFinalPrice, resetItemForm, isSpecialSalaryConceptSelected]);
    const startEditAddedItem = useCallback((idx) => { const iTE = addedExpenses[idx]; setEditingItemIndex(idx); const c = specificConcepts.find(c => c.idSpecificConcept === iTE.idSpecificConcept); const iS = c && c.requiresEmployeeCalculation === true; setIsSpecialSalaryConceptSelected(iS); setItemForm({ idSpecificConcept: iTE.idSpecificConcept.toString(), price: (iS ? iTE.baseSalary : iTE.price).toString(), numEmployees: (iTE.numEmployees || '1').toString(), addBonus: iTE.addBonus || false, bonusAmount: (iTE.bonusAmount || '').toString(), }); const el = document.getElementById('addExpenseItemSection'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, [addedExpenses, specificConcepts]);
    const removeExpenseFromTable = useCallback((idx) => { setAddedExpenses(pE => pE.filter((_, i) => i !== idx)); if (addedExpenses.length === 1 && formErrors.expenseItems) setFormErrors(pE => ({ ...pE, expenseItems: null })); if (editingItemIndex === idx) resetItemForm(); }, [addedExpenses, editingItemIndex, resetItemForm, formErrors]);
    const validateCreationForm = useCallback(() => { let iV = true; const nE = { ...INITIAL_FORM_ERRORS }; if (!overallForm.dateOverallExp || !dayjs(overallForm.dateOverallExp, 'YYYY-MM-DD', true).isValid()) { nE.dateOverallExp = 'Fecha inválida.'; iV = false; } else if (dayjs(overallForm.dateOverallExp).isAfter(dayjs(), 'day')) { nE.dateOverallExp = 'Fecha no futura.'; iV = false; } if (!overallForm.noveltyExpense || !overallForm.noveltyExpense.trim()) { nE.noveltyExpense = 'Novedad obligatoria.'; iV = false; } if (editingItemIndex !== null) { nE.expenseItems = 'Termine edición.'; iV = false; } if (addedExpenses.length === 0) { nE.expenseItems = 'Agregue conceptos.'; iV = false; } setFormErrors(nE); return iV; }, [overallForm, editingItemIndex, addedExpenses]);
    const totalExpensesInForm = useMemo(() => addedExpenses.reduce((s, i) => s + Number(i.price || 0), 0), [addedExpenses]);
    const handleCreateSubmit = useCallback(async () => { if (!validateCreationForm()) { toast.error("Corrija errores.", { icon: <XCircle /> }); return; } setIsSubmitting(true); setApiError(null); const tId = toast.loading('Guardando...'); const pL = { dateOverallExp: overallForm.dateOverallExp, noveltyExpense: overallForm.noveltyExpense, status: overallForm.status, valueExpense: totalExpensesInForm, expenseItems: addedExpenses.map(i => ({ idSpecificConcept: i.idSpecificConcept, price: i.price, baseSalary: i.baseSalary, numEmployees: i.numEmployees, hasBonus: i.addBonus, bonusAmountValue: i.bonusAmount })) }; try { await MonthlyOverallExpenseService.createMonthlyOverallExpense(pL); toast.success("Registro creado.", { id: tId, icon: <CheckCircle /> }); setShowForm(false); resetFullForm(); await fetchMonthlyExpenseRecords(false); } catch (e) { console.error("Error creando gasto:", e.response?.data || e.message); const bE = e.response?.data?.errors; let eM = e.message || "Error guardando."; if (bE && Array.isArray(bE)) eM = bE.map(er => er.msg).join(', '); else if (e.response?.data?.message) eM = e.response.data.message; setApiError(eM); toast.error(`Error: ${eM}`, { id: tId, icon: <XCircle />, duration: 6000 }); } finally { setIsSubmitting(false); } }, [overallForm, addedExpenses, validateCreationForm, resetFullForm, fetchMonthlyExpenseRecords, totalExpensesInForm]);
    const openEditModal = useCallback((i) => { setSelectedMonthlyExpense(i); setOverallForm({ dateOverallExp: i.dateOverallExp ? dayjs(i.dateOverallExp).format('YYYY-MM-DD') : '', noveltyExpense: i.noveltyExpense || i.novelty_expense || '', status: i.status !== undefined ? i.status : true, }); setFormErrors(INITIAL_FORM_ERRORS); setApiError(null); setEditModalOpen(true); }, []);
    const closeEditModal = useCallback(() => { setEditModalOpen(false); setSelectedMonthlyExpense(null); setOverallForm(INITIAL_OVERALL_FORM_STATE); setFormErrors(INITIAL_FORM_ERRORS); }, []);
    const validateEditForm = useCallback(() => { let iV = true; const nE = { dateOverallExp: null, noveltyExpense: null }; if (!overallForm.dateOverallExp || !dayjs(overallForm.dateOverallExp, 'YYYY-MM-DD', true).isValid()) { nE.dateOverallExp = 'Fecha inválida.'; iV = false; } else if (dayjs(overallForm.dateOverallExp).isAfter(dayjs(), 'day')) { nE.dateOverallExp = 'Fecha no futura.'; iV = false; } if (!overallForm.noveltyExpense || !overallForm.noveltyExpense.trim()) { nE.noveltyExpense = 'Novedad obligatoria.'; iV = false; } setFormErrors(p => ({ ...p, ...nE })); return iV; }, [overallForm.dateOverallExp, overallForm.noveltyExpense]);
    const handleEditSubmit = useCallback(async () => { if (!selectedMonthlyExpense || !validateEditForm()) { toast.error("Corrija errores.", { icon: <XCircle /> }); return; } setIsSubmitting(true); setApiError(null); const tId = toast.loading('Actualizando...'); const pL = { dateOverallExp: overallForm.dateOverallExp, noveltyExpense: overallForm.noveltyExpense }; try { await MonthlyOverallExpenseService.updateMonthlyOverallExpense(selectedMonthlyExpense.idOverallMonth, pL); toast.success("Registro actualizado.", { id: tId, icon: <CheckCircle /> }); closeEditModal(); await fetchMonthlyExpenseRecords(false); } catch (e) { console.error("Error actualizando:", e); const msg = e.message || "Error actualizando."; setApiError(msg); toast.error(`Error: ${msg}`, { id: tId, icon: <XCircle /> }); } finally { setIsSubmitting(false); } }, [selectedMonthlyExpense, overallForm, validateEditForm, closeEditModal, fetchMonthlyExpenseRecords]);
    const handleToggleConfirmModal = useCallback(() => { setConfirmModalProps(prev => ({ ...prev, isOpen: !prev.isOpen })); if (confirmModalProps.isOpen && !isConfirmActionLoading) { setConfirmModalProps(INITIAL_CONFIRM_PROPS); confirmActionRef.current = null; } }, [isConfirmActionLoading, confirmModalProps.isOpen]);
    const prepareConfirmation = useCallback((actionFn, props) => { confirmActionRef.current = () => { if (actionFn) actionFn(props.itemDetails); else { handleToggleConfirmModal(); } }; setConfirmModalProps({ ...props, isOpen: true, isConfirming: false }); }, [handleToggleConfirmModal]);
    const requestChangeStatusConfirmation = useCallback((i) => { if (!i || i.idOverallMonth == null) return; const { idOverallMonth, status: cS } = i; const aT = cS ? "desactivar" : "activar"; const fST = cS ? "Inactivo" : "Activo"; const cC = cS ? "warning" : "success"; prepareConfirmation(executeChangeStatus, { title: "Confirmar Estado", message: (<p>¿Seguro que desea <strong>{aT}</strong> el registro ID <strong>#{idOverallMonth}</strong>?<br />Nuevo estado: <strong>{fST}</strong>.</p>), confirmText: `Sí, ${aT.charAt(0).toUpperCase() + aT.slice(1)}`, confirmColor: cC, itemDetails: { idOverallMonth, cS } }); }, [prepareConfirmation]);
    const executeChangeStatus = useCallback(async (d) => { if (!d || d.idOverallMonth == null) { toast.error("Error interno."); handleToggleConfirmModal(); return; } const { idOverallMonth, cS } = d; const nS = !cS; setIsConfirmActionLoading(true); setConfirmModalProps(p => ({ ...p, isConfirming: true })); const tId = toast.loading(`${cS ? "Desactivando" : "Activando"}...`); const oR = [...monthlyExpenseRecords]; setMonthlyExpenseRecords(pD => pD.map(i => i.idOverallMonth === idOverallMonth ? { ...i, status: nS } : i)); try { await MonthlyOverallExpenseService.changeStateMonthlyOverallExpense(idOverallMonth, nS); toast.success(`Estado actualizado.`, { id: tId, icon: <CheckCircle /> }); } catch (e) { toast.error(`Error: ${e.message || 'Error desconocido'}`, { id: tId, icon: <XCircle /> }); setMonthlyExpenseRecords(oR); } finally { setIsConfirmActionLoading(false); setConfirmModalProps(p => ({ ...p, isConfirming: false, isOpen: false })); confirmActionRef.current = null; } }, [monthlyExpenseRecords, handleToggleConfirmModal]);
    const handleTableSearch = useCallback((e) => { setTableSearchText(e.target.value); setCurrentPage(1); }, []);
    const handlePageChange = useCallback((pN) => { setCurrentPage(pN); }, []);
    const filteredMonthlyExpenseRecords = useMemo(() => { if (!Array.isArray(monthlyExpenseRecords)) return []; const sD = [...monthlyExpenseRecords].sort((a, b) => (b.idOverallMonth || 0) - (a.idOverallMonth || 0)); const lST = tableSearchText.trim().toLowerCase(); if (!lST) return sD; return sD.filter(i => { const n = i.noveltyExpense || i.novelty_expense || ''; return i && (String(i.idOverallMonth || '').toLowerCase().includes(lST) || (i.dateOverallExp && dayjs(i.dateOverallExp).format('DD/MM/YYYY').includes(lST)) || String(i.valueExpense ?? '').toLowerCase().includes(lST) || n.toLowerCase().includes(lST)); }); }, [monthlyExpenseRecords, tableSearchText]);
    const totalItems = useMemo(() => filteredMonthlyExpenseRecords.length, [filteredMonthlyExpenseRecords]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE_MAIN_TABLE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);
    const currentItemsOnPage = useMemo(() => { const sI = (validCurrentPage - 1) * ITEMS_PER_PAGE_MAIN_TABLE; return filteredMonthlyExpenseRecords.slice(sI, sI + ITEMS_PER_PAGE_MAIN_TABLE); }, [filteredMonthlyExpenseRecords, validCurrentPage]);
    useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); else if (currentPage === 0 && totalPages > 0) setCurrentPage(1); }, [totalPages, currentPage]);

    const openDetailModal = useCallback((item) => { setSelectedMonthlyExpense(item); setDetailModalCurrentPage(1); setDetailModalOpen(true); }, []);
    const closeDetailModal = useCallback(() => { setDetailModalOpen(false); setSelectedMonthlyExpense(null); setDetailModalCurrentPage(1); }, []);
    const handleDetailModalPageChange = useCallback((pageNumber) => { setDetailModalCurrentPage(pageNumber); }, []);

    const paginatedExpenseItems = useMemo(() => {
        if (!selectedMonthlyExpense || !selectedMonthlyExpense.expenseItems || selectedMonthlyExpense.expenseItems.length === 0) {
            return { items: [], totalPages: 0, totalItems: 0 };
        }
        const items = selectedMonthlyExpense.expenseItems;
        const totalItemsCount = items.length;
        const totalItemPages = Math.ceil(totalItemsCount / ITEMS_PER_PAGE_MODAL_DETAIL);
        const startIndex = (detailModalCurrentPage - 1) * ITEMS_PER_PAGE_MODAL_DETAIL;
        const currentItemsForModal = items.slice(startIndex, startIndex + ITEMS_PER_PAGE_MODAL_DETAIL);
        return { items: currentItemsForModal, totalPages: totalItemPages, totalItems: totalItemsCount };
    }, [selectedMonthlyExpense, detailModalCurrentPage]);

    if (isLoadingSpecificConcepts && showForm && !specificConcepts.length) {
        return ( <Container fluid className="p-4 main-content text-center"> <Spinner color="primary" className="mt-5" style={{ width: '3rem', height: '3rem' }} /> <p className="mt-2">Cargando conceptos...</p> </Container> );
    }

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            {!showForm ? (
                <>
                   <h2 className="mb-4"><FileText size={28} className="me-2" />Gestión de Gastos Mensuales</h2>
                     <Row className="mb-3 align-items-center">
                        <Col md={5} lg={4}><Input bsSize="sm" type="text" placeholder="Buscar por ID, Fecha, Novedad..." value={tableSearchText} onChange={handleTableSearch} /></Col>
                        <Col md={7} lg={8} className="text-md-end mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-2">
                            <Button color="info" outline size="sm" onClick={handleNavigateToEmployees} title="Ir a Empleados"><Users size={16} className="me-1" /> Empleados</Button>
                            <Dropdown isOpen={gastosDropdownOpen} toggle={toggleGastosDropdown} size="sm">
                                <DropdownToggle caret color="secondary" outline><ListChecks size={16} className="me-1" /> Configurar Gastos</DropdownToggle>
                                <DropdownMenu end>
                                    <DropdownItem header>Administración</DropdownItem>
                                    <DropdownItem onClick={navigateToManageExpenseCategories}><Settings size={16} className="me-2 text-muted" />Categorías</DropdownItem>
                                    <DropdownItem onClick={navigateToManageSpecificConcepts}><SlidersHorizontal size={16} className="me-2 text-muted" />Conceptos Específicos</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                            <Button color="success" size="sm" onClick={() => { resetFullForm(); setShowForm(true); }} className="button-add"><Plus size={18} className="me-1" /> Crear Gasto Mensual</Button>
                        </Col>
                    </Row>
                    <div className="table-responsive shadow-sm custom-table-container mb-3">
                        <Table hover striped size="sm" className="mb-0 custom-table" aria-live="polite">
                            <thead className="table-dark">
                                <tr>
                                    <th style={{ width: '8%' }}>ID</th><th style={{ width: '15%' }}>Fecha</th>
                                    <th style={{ width: '20%' }} className="text-end">Monto Total</th><th>Novedades</th>
                                    <th style={{ width: '8%' }} className="text-center">Estado</th><th style={{ width: '12%' }} className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingTable ? (<tr><td colSpan="6" className="text-center p-5"><Spinner /> Cargando...</td></tr>)
                                : currentItemsOnPage.length > 0 ? ( currentItemsOnPage.map((item) => (
                                    <tr key={item.idOverallMonth} style={{ verticalAlign: 'middle' }}>
                                        <th scope="row">{item.idOverallMonth}</th><td>{item.dateOverallExp ? dayjs(item.dateOverallExp).format('DD/MM/YYYY') : '-'}</td>
                                        <td className="text-end">{formatCurrencyCOP(item.valueExpense)}</td>
                                        <td>{item.noveltyExpense || item.novelty_expense || '-'}</td>
                                        <td className="text-center"><Button outline color={item.status ? "success" : "secondary"} size="sm" className="p-1" onClick={() => requestChangeStatusConfirmation(item)} disabled={isConfirmActionLoading || confirmModalProps.isConfirming}>{item.status ? "Activo" : "Inactivo"}</Button></td>
                                        <td className="text-center"><div className="d-inline-flex gap-1"><Button color="warning" outline size="sm" onClick={() => openEditModal(item)} title="Editar Cabecera" className="p-1" disabled={isConfirmActionLoading || confirmModalProps.isConfirming}><Edit size={14} /></Button><Button color="info" outline size="sm" onClick={() => openDetailModal(item)} title="Ver Detalles" className="p-1" disabled={isConfirmActionLoading || confirmModalProps.isConfirming}><Eye size={14} /></Button></div></td>
                                    </tr>
                                ))) : (<tr><td colSpan="6" className="text-center fst-italic p-4">{tableSearchText ? `No se encontraron resultados para "${tableSearchText}".` : 'No hay registros.'} {!isLoadingTable && monthlyExpenseRecords.length === 0 && !tableSearchText && (<span className="d-block mt-2">Aún no hay gastos. <Button size="sm" color="link" onClick={() => {resetFullForm(); setShowForm(true);}} className="p-0 align-baseline">Crear el primero</Button></span>)}</td></tr>)}
                            </tbody>
                        </Table>
                    </div>
                     {!isLoadingTable && totalPages > 1 && (<CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />)}
                </>
            ) : (
                <>
                    <Row className="mb-3 align-items-center bg-light p-3 rounded shadow-sm">
                        <Col xs="auto"><Button color="secondary" outline size="sm" onClick={() => { setShowForm(false); resetFullForm(); }} disabled={isSubmitting}><ArrowLeft size={18} /> Volver</Button></Col>
                        <Col><h4 className="mb-0 text-center">Crear Gasto Mensual</h4></Col>
                        <Col xs="auto" style={{ visibility: 'hidden' }}><Button size="sm" outline><ArrowLeft/></Button></Col>
                    </Row>
                    <div className="p-3 mb-4 bg-white rounded shadow-sm">
                        {apiError && <Alert color="danger" className="py-2 px-3 mb-3">{apiError}</Alert>}
                        <Form id="createMonthlyExpenseForm" noValidate onSubmit={(e) => e.preventDefault()}>
                            <h5 className="mb-3 text-primary border-bottom pb-2">Datos Generales del Mes</h5>
                            <Row className="g-3 mb-4">
                                <Col md={6}><FormGroup><Label for="dateOverallExp" className="form-label fw-bold">Fecha Mes <span className="text-danger">*</span></Label><Input id="dateOverallExp" type="date" name="dateOverallExp" value={overallForm.dateOverallExp} onChange={handleOverallFormChange} max={dayjs().format('YYYY-MM-DD')} invalid={!!formErrors.dateOverallExp} disabled={isSubmitting} required /><FormFeedback>{formErrors.dateOverallExp}</FormFeedback></FormGroup></Col>
                                <Col md={6}><FormGroup><Label for="noveltyExpense" className="form-label fw-bold">Novedades Mes <span className="text-danger">*</span></Label><Input id="noveltyExpense" type="text" name="noveltyExpense" value={overallForm.noveltyExpense} onChange={handleOverallFormChange} placeholder="Describa eventos..." invalid={!!formErrors.noveltyExpense} disabled={isSubmitting} required /><FormFeedback>{formErrors.noveltyExpense}</FormFeedback></FormGroup></Col>
                            </Row>
                            <h5 className="mb-3 text-primary border-bottom pb-2 mt-4">Conceptos de Gasto</h5>
                            <div id="addExpenseItemSection" className="p-3 border rounded mb-4 bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0 text-secondary">{editingItemIndex !== null ? 'Editando Concepto' : 'Agregar Nuevo Concepto'}</h6>
                                    <Button color="info" outline size="sm" onClick={navigateToManageSpecificConcepts} title="Gestionar Conceptos Específicos"><SlidersHorizontal size={16} className="me-1"/> Config. Conceptos</Button>
                                </div>
                                {formErrors.expenseItems && !editingItemIndex && <Alert color="danger" size="sm" className="py-2 px-3 mb-3">{formErrors.expenseItems}</Alert>}
                                {specificConcepts.length === 0 && !isLoadingSpecificConcepts && (<Alert color="warning" size="sm" className="py-2 px-3 mb-3"><AlertTriangle size={18} className="me-2"/>No hay conceptos de gasto. <Button color="link" size="sm" className="p-0 alert-link" onClick={navigateToManageSpecificConcepts}>Crearlos aquí</Button>.</Alert>)}
                                <Row className="g-3 mb-3 align-items-end">
                                    <Col md={isSpecialSalaryConceptSelected ? 12 : 7} lg={isSpecialSalaryConceptSelected ? 12 : (itemForm.idSpecificConcept ? 5 : 9 )}>
                                        <FormGroup className="mb-md-0">
                                            <Label for="idSpecificConcept" className="form-label">Concepto de Gasto <span className="text-danger">*</span></Label>
                                            <Input type="select" name="idSpecificConcept" id="idSpecificConcept" value={itemForm.idSpecificConcept} onChange={handleItemFormChange} invalid={!!formErrors.idSpecificConcept} disabled={isSubmitting || isLoadingSpecificConcepts || specificConcepts.length === 0}>
                                                <option value="">{isLoadingSpecificConcepts ? "Cargando..." : specificConcepts.length === 0 ? "No hay conceptos" : "Seleccione..."}</option>
                                                {specificConcepts.map(concept => (<option key={concept.idSpecificConcept} value={concept.idSpecificConcept}>{concept.name} ({concept.expenseCategoryDetails?.name || 'Sin Cat.'})</option>))}
                                            </Input>
                                            <FormFeedback>{formErrors.idSpecificConcept}</FormFeedback>
                                            {isLoadingSpecificConcepts && <Spinner size="sm" className="ms-2 mt-1"/>}
                                        </FormGroup>
                                    </Col>
                                    {itemForm.idSpecificConcept && (
                                        <>
                                            <Col md={isSpecialSalaryConceptSelected ? 6 : 5} lg={isSpecialSalaryConceptSelected ? 3 : 4}><FormGroup className="mb-md-0"><Label for="price" className="form-label">{isSpecialSalaryConceptSelected ? "Sueldo Base" : "Valor"} <span className="text-danger">*</span></Label><InputGroup><InputGroupText><DollarSign size={16}/></InputGroupText><Input id="price" type="number" name="price" value={itemForm.price} onChange={handleItemFormChange} placeholder="0" min="0.01" step="any" invalid={!!formErrors.price} disabled={isSubmitting || !itemForm.idSpecificConcept} required /></InputGroup><FormFeedback className={formErrors.price ? 'd-block' : ''}>{formErrors.price}</FormFeedback></FormGroup></Col>
                                            {isSpecialSalaryConceptSelected && (
                                                <>
                                                    <Col md={6} lg={2}><FormGroup  className="mb-md-0"><Label for="numEmployees" className="form-label">Nº Empleados <span className="text-danger">*</span></Label><InputGroup><InputGroupText><Hash size={16}/></InputGroupText><Input id="numEmployees" type="number" name="numEmployees" value={itemForm.numEmployees} onChange={handleItemFormChange} placeholder="1" min="1" step="1" invalid={!!formErrors.numEmployees} disabled={isSubmitting || !itemForm.idSpecificConcept} required /></InputGroup><FormFeedback className={formErrors.numEmployees ? 'd-block' : ''}>{formErrors.numEmployees}</FormFeedback></FormGroup></Col>
                                                    <Col md={6} lg={3}><FormGroup check inline className="mb-2 mt-md-4 pt-md-2"><Input type="checkbox" name="addBonus" id="addBonus" checked={itemForm.addBonus} onChange={handleItemFormChange} disabled={isSubmitting || !itemForm.idSpecificConcept} /><Label for="addBonus" check className="form-label">¿Bonificación?</Label></FormGroup>{itemForm.addBonus && (<FormGroup className="mb-md-0"><InputGroup><InputGroupText><DollarSign size={16}/></InputGroupText><Input id="bonusAmount" type="number" name="bonusAmount" value={itemForm.bonusAmount} onChange={handleItemFormChange} placeholder="Monto Bonificación" min="0" step="any" invalid={!!formErrors.bonusAmount} disabled={isSubmitting || !itemForm.idSpecificConcept} /></InputGroup><FormFeedback className={formErrors.bonusAmount ? 'd-block' : ''}>{formErrors.bonusAmount}</FormFeedback></FormGroup>)}</Col>
                                                    <Col md={6} lg={4}><FormGroup  className="mb-md-0"><Label className="form-label fw-bold">Total Concepto:</Label><Input type="text" value={formatCurrencyCOP(calculateItemFinalPrice(itemForm))} disabled readOnly className="fw-bold text-success border-success"/></FormGroup></Col>
                                                </>
                                            )}
                                        </>
                                    )}
                                    <Col md={12} lg={itemForm.idSpecificConcept ? (isSpecialSalaryConceptSelected ? 12 : 3) : 3} className="mt-3 mt-lg-0">
                                        <Button color={editingItemIndex !== null ? "warning" : "success"} onClick={addOrUpdateExpenseToTable} className="w-100" disabled={ isSubmitting || !itemForm.idSpecificConcept || !itemForm.price }>{editingItemIndex !== null ? <><Edit3 size={16} className="me-1"/> Actualizar</> : <><Plus size={16} className="me-1"/> Agregar</>}</Button>
                                        {editingItemIndex !== null && (<Button color="secondary" outline className="w-100 mt-1" onClick={resetItemForm} disabled={isSubmitting}>Cancelar Edición</Button>)}
                                    </Col>
                                </Row>
                            </div>
                            {addedExpenses.length > 0 && (
                                <>
                                    <h6 className="mt-4 mb-3">Conceptos Agregados:</h6>
                                    <div className="table-responsive mb-3 shadow-sm">
                                        <Table hover striped bordered size="sm" className="align-middle custom-detail-table">
                                            <thead className="table-light"><tr><th style={{ width: '40%' }}>Concepto</th><th style={{ width: '25%' }}>Categoría</th><th style={{ width: '20%' }} className="text-end">Precio Final</th><th style={{ width: '15%' }} className="text-center">Acciones</th></tr></thead>
                                            <tbody>{addedExpenses.map((item, index) => (<tr key={index} className={editingItemIndex === index ? 'table-warning' : ''}><td>{item.conceptName}{item.requiresEmployeeCalculation && (<FormText color="muted" className="d-block small">Base: {formatCurrencyCOP(item.baseSalary)} x {item.numEmployees} emp.{item.addBonus && parseFloat(item.bonusAmount) > 0 ? ` + Bono: ${formatCurrencyCOP(item.bonusAmount)}` : ''}</FormText>)}</td><td>{item.categoryName || <span className="text-muted fst-italic">N/A</span>}</td><td className="text-end fw-medium">{formatCurrencyCOP(item.price)}</td><td className="text-center"><Button color="warning" outline size="sm" className="p-1 me-1 btn-icon-only" onClick={() => startEditAddedItem(index)} disabled={isSubmitting} title="Editar"><Edit3 size={14} /></Button><Button color="danger" outline size="sm" className="p-1 btn-icon-only" onClick={() => removeExpenseFromTable(index)} disabled={isSubmitting} title="Quitar"><Trash2 size={14} /></Button></td></tr>))}</tbody>
                                            <tfoot className="table-light"><tr><th colSpan="2" className="text-end fw-bold">Total Agregado:</th><th className="text-end fw-bold">{formatCurrencyCOP(totalExpensesInForm)}</th><th></th></tr></tfoot>
                                        </Table>
                                    </div>
                                </>
                            )}
                            {addedExpenses.length === 0 && (<Alert color="info" className="text-center fst-italic py-3">Aún no se han agregado conceptos.</Alert>)}
                         </Form>
                    </div>
                    <Row className="mt-4 pt-3 border-top "><Col className="d-flex justify-content-end gap-2"><Button color="secondary" outline onClick={() => { setShowForm(false); resetFullForm(); }} disabled={isSubmitting}><XCircle size={18} className="me-1" /> Cancelar</Button><Button color="primary" onClick={handleCreateSubmit} disabled={isSubmitting || editingItemIndex !== null || addedExpenses.length === 0 }>{isSubmitting ? <><Spinner size="sm"/> Guardando...</> : <><Save size={18} className="me-1"/> Guardar Gasto</>}</Button></Col></Row>
                </>
            )}

            <Modal isOpen={editModalOpen} toggle={!isSubmitting ? closeEditModal : undefined} centered backdrop="static" keyboard={!isSubmitting}><ModalHeader toggle={!isSubmitting ? closeEditModal : undefined}><Edit size={20} className="me-2" /> Editar Cabecera Gasto</ModalHeader><ModalBody>{apiError && <Alert color="danger" size="sm">{apiError}</Alert>}<Form id="editMonthlyExpenseForm" noValidate onSubmit={(e) => e.preventDefault()}><Row><Col md={12}><FormGroup><Label for="editDateOverallExp" className="form-label">Fecha <span className="text-danger">*</span></Label><Input id="editDateOverallExp" type="date" name="dateOverallExp" value={overallForm.dateOverallExp} onChange={handleOverallFormChange} max={dayjs().format('YYYY-MM-DD')} invalid={!!formErrors.dateOverallExp} disabled={isSubmitting} required /><FormFeedback>{formErrors.dateOverallExp}</FormFeedback></FormGroup></Col><Col md={12}><FormGroup><Label for="editNoveltyExpense" className="form-label">Novedades <span className="text-danger">*</span></Label><Input id="editNoveltyExpense" type="textarea" name="noveltyExpense" value={overallForm.noveltyExpense} onChange={handleOverallFormChange} rows={4} invalid={!!formErrors.noveltyExpense} disabled={isSubmitting} required /><FormFeedback>{formErrors.noveltyExpense}</FormFeedback></FormGroup></Col></Row></Form><p className="text-muted mt-3"><small>Conceptos y valor total solo se modifican creando nuevo registro o con edición detallada.</small></p></ModalBody><ModalFooter><Button color="secondary" outline onClick={closeEditModal} disabled={isSubmitting}>Cancelar</Button><Button color="primary" onClick={handleEditSubmit} disabled={isSubmitting}>{isSubmitting ? <><Spinner size="sm"/> Actualizando...</> : <><Save size={16}/> Actualizar</>}</Button></ModalFooter></Modal>
            
            {/* MODAL DE DETALLE CON CARDS Y PAGINACIÓN */}
            <Modal isOpen={detailModalOpen} toggle={closeDetailModal} centered size="xl" backdrop="static"> {/* Cambiado a size="xl" */}
                <ModalHeader toggle={closeDetailModal} className="bg-light">
                    <Eye size={20} className="me-2" /> Detalles del Gasto Mensual (ID: {selectedMonthlyExpense?.idOverallMonth})
                </ModalHeader>
                <ModalBody className="p-4">
                    {selectedMonthlyExpense && (
                        <>
                            <Row className="mb-3 pb-3 border-bottom">
                                <Col md={6}>
                                    <p className="mb-1"><strong><CalendarDays size={16} className="me-2 text-muted" /> Fecha:</strong> {selectedMonthlyExpense.dateOverallExp ? dayjs(selectedMonthlyExpense.dateOverallExp).format('DD [de] MMMM [de] YYYY') : '-'}</p>
                                    <p className="mb-0"><strong><DollarSign size={16} className="me-2 text-muted" /> Valor Total del Mes:</strong> <span className="h5 text-primary fw-bold">{formatCurrencyCOP(selectedMonthlyExpense.valueExpense)}</span></p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1"><strong><Info size={16} className="me-2 text-muted" /> Estado:</strong> <span className={`fw-bold text-${selectedMonthlyExpense.status ? 'success' : 'secondary'}`}>{selectedMonthlyExpense.status ? 'Activo' : 'Inactivo'}</span></p>
                                    {selectedMonthlyExpense.noveltyExpense || selectedMonthlyExpense.novelty_expense ? (
                                        <p className="mb-0"><strong><FileText size={16} className="me-2 text-muted" /> Novedades:</strong></p>
                                    ) : null}
                                </Col>
                                {(selectedMonthlyExpense.noveltyExpense || selectedMonthlyExpense.novelty_expense) && (
                                     <Col xs={12} className="mt-2">
                                        <Input type="textarea" value={selectedMonthlyExpense.noveltyExpense || selectedMonthlyExpense.novelty_expense} readOnly rows="2" className="form-control-plaintext p-2 bg-light rounded border" style={{fontSize: '0.9rem'}}/>
                                     </Col>
                                )}
                            </Row>
                            
                            <h5 className="mb-3 mt-4">Conceptos Aplicados ({paginatedExpenseItems.totalItems || 0} en total)</h5>
                            {paginatedExpenseItems.items && paginatedExpenseItems.items.length > 0 ? (
                                <>
                                <Row xs="1" md={ITEMS_PER_PAGE_MODAL_DETAIL === 3 ? 3 : 2} className="g-3 mb-3">
                                    {paginatedExpenseItems.items.map((item, idx) => {
                                        const conceptDetails = specificConcepts.find(sc => sc.idSpecificConcept === item.idSpecificConcept);
                                        const categoryName = conceptDetails?.expenseCategoryDetails?.name || 'Desconocida';
                                        return (
                                            <Col key={`detail-item-card-${idx}`}>
                                                <Card className="h-100 shadow-sm expense-item-card">
                                                    <CardHeader className="d-flex justify-content-between align-items-center py-2 px-3" style={{backgroundColor: '#f0f0f0'}}> {/* Un color más suave */}
                                                        <h6 className="mb-0 text-truncate text-dark" title={item.conceptName || conceptDetails?.name}>
                                                           <Briefcase size={16} className="me-2 text-primary"/> {item.conceptName || conceptDetails?.name || `Concepto ID ${item.idSpecificConcept}`}
                                                        </h6>
                                                        <span className="badge bg-info text-dark rounded-pill" style={{fontSize: '0.75rem'}}>{categoryName}</span>
                                                    </CardHeader>
                                                    <CardBody className="p-3">
                                                        <p className="mb-2 h5 text-success fw-bold">
                                                            {formatCurrencyCOP(item.price)}
                                                        </p>
                                                        {conceptDetails?.requiresEmployeeCalculation && (
                                                            <div className="small text-muted border-top pt-2 mt-2">
                                                                <p className="mb-0"><strong>Sueldo Base:</strong> {formatCurrencyCOP(item.baseSalary)}</p>
                                                                <p className="mb-0"><strong>Nº Empleados:</strong> {item.numEmployees}</p>
                                                                {item.hasBonus && ( // Siempre mostrar la línea de bono si hasBonus es true
                                                                    <p className="mb-0"><strong>Bono:</strong> {formatCurrencyCOP(item.bonusAmountValue || 0)}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        {!conceptDetails?.requiresEmployeeCalculation && item.baseSalary && (
                                                            <p className="mb-0 small text-muted">(Valor directo)</p>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                                {paginatedExpenseItems.totalPages > 1 && (
                                    <CustomPagination
                                        currentPage={detailModalCurrentPage}
                                        totalPages={paginatedExpenseItems.totalPages}
                                        onPageChange={handleDetailModalPageChange}
                                        size="sm" // Paginador más pequeño para el modal
                                        className="mt-3 justify-content-center"
                                    />
                                )}
                                </>
                            ) : (
                                <Alert color="light" className="text-center fst-italic py-3">No se agregaron conceptos específicos a este registro.</Alert>
                            )}
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={closeDetailModal}>Cerrar</Button>
                </ModalFooter>
            </Modal>

            <ConfirmationModal isOpen={confirmModalProps.isOpen} toggle={handleToggleConfirmModal} title={confirmModalProps.title} onConfirm={() => {if(confirmActionRef.current) confirmActionRef.current();}} confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor} isConfirming={confirmModalProps.isConfirming || isConfirmActionLoading}>{confirmModalProps.message}</ConfirmationModal>
        </Container>
    );
};

export default ManoDeObra;