// Copia y pega este archivo completo. Contiene la corrección final de los nombres de campo.
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Select from 'react-select';
import {
    Button, Container, Row, Col, Form, FormGroup, Input, Label,
    FormFeedback, Spinner, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter,
    Pagination, PaginationItem, PaginationLink,
    InputGroup, InputGroupText
} from "reactstrap";
import { Plus, Trash2, Save, X, AlertTriangle, Edit, Hash, ToggleLeft, ToggleRight } from 'lucide-react';
import toast, { Toaster } from "react-hot-toast";

// --- Servicios ---
import productService from "../../services/productService";
import fichaTecnicaService from "../../services/specSheetService";
import registerPurchaseService from "../../services/registroCompraService";
import processService from "../../services/masterProcessService";

// --- Estilos ---
import "../../../assets/css/App.css";
import "../../../assets/css/produccion/FichaTecnicaStyles.css"; 

// --- Helper de formato ---
const formatCurrency = (value) => {
    const numericValue = Number(value) || 0;
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericValue);
};

// --- Constantes y Helpers ---
const getInitialFichaFormState = () => ({ idProduct: '', dateEffective: new Date().toISOString().slice(0, 10), endDate: '', quantityBase: '', unitOfMeasure: '', status: true });
const getInitialIngredienteFormState = () => ({ key: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, selectedPurchaseDetailOption: null, idPurchaseDetail: '', idSupply: '', quantity: '', unitOfMeasure: '', stockDisponible: 0, error: '' });
const getInitialProcesoFormState = () => ({ key: `proc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, idProcess: null, selectedProcess: null, processOrder: 1, processNameOverride: '', processDescriptionOverride: '' });
const getInitialFormErrors = () => ({ idProduct: '', dateEffective: '', endDate: '', quantityBase: '', unitOfMeasure: '', ingredientes: '', procesos: '', general: "" });
const unitOfMeasures = [ { value: 'kg', label: 'Kilogramos (kg)' }, { value: 'g', label: 'Gramos (g)' }, { value: 'mg', label: 'Miligramos (mg)' }, { value: 'lb', label: 'Libras (lb)' }, { value: 'oz', label: 'Onzas (oz)' }, { value: 'L', label: 'Litros (L)' }, { value: 'mL', label: 'Mililitros (mL)' }, { value: 'gal', label: 'Galones (gal)' }, { value: 'm', label: 'Metros (m)' }, { value: 'cm', label: 'Centímetros (cm)' }, { value: 'mm', label: 'Milímetros (mm)' }, { value: 'unidad', label: 'Unidad(es)' }, { value: 'docena', label: 'Docena(s)' }, ];
const PROCESOS_PER_PAGE = 5;

const convertToBaseUnit = (quantity, unit) => {
    const qty = parseFloat(quantity);
    if (isNaN(qty)) return 0;
    
    let u = String(unit)?.toLowerCase() || 'g';
    u = u.split('(')[0];
    u = u.trim();

    switch (u) {
        case 'kg': case 'kilogramo': case 'kilogramos':
        case 'l':  case 'litro':     case 'litros':
            return qty * 1000;
        case 'lb': case 'libra': case 'libras':
            return qty * 453.592;
        case 'oz': case 'onza': case 'onzas':
            return qty * 28.3495;
        case 'mg': case 'miligramo': case 'miligramos':
            return qty / 1000;
        case 'g':  case 'gramo':    case 'gramos':
        case 'ml': case 'mililitro': case 'mililitros':
        case 'cm': case 'centimetro': case 'centimetros':
        case 'mm': case 'milimetro': case 'milimetros':
        case 'unidad': case 'unidades':
        default:
            return qty;
    }
};

const ConfirmationModalComponent = ({ isOpen, toggle, title, children, onConfirm, confirmText, confirmColor, isConfirming }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
            <div className="d-flex align-items-center"><AlertTriangle size={24} className={`text-${confirmColor === "danger" ? "danger" : "primary"} me-2`} /><span className="fw-bold">{title}</span></div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor || "primary"} onClick={onConfirm} disabled={isConfirming}>{isConfirming ? <Spinner size="sm" /> : (confirmText || "Confirmar")}</Button>
        </ModalFooter>
    </Modal>
);

const FichaTecnica = () => {
    // ... (hooks y estados sin cambios) ...
    const navigate = useNavigate();
    const { idSpecsheet: idSpecsheetFromUrl } = useParams();
    const location = useLocation();
    const [isEditing, setIsEditing] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [purchaseDetailOptions, setPurchaseDetailOptions] = useState([]);
    const [masterProcessOptions, setMasterProcessOptions] = useState([]);
    const [formFicha, setFormFicha] = useState(getInitialFichaFormState());
    const [formIngredientes, setFormIngredientes] = useState([getInitialIngredienteFormState()]);
    const [formProcesos, setFormProcesos] = useState([getInitialProcesoFormState()]);
    const [formErrors, setFormErrors] = useState(getInitialFormErrors());
    const [isLoadingPageData, setIsLoadingPageData] = useState(true);
    const [isLoadingFichaData, setIsLoadingFichaData] = useState(false);
    const [isDataInitialized, setIsDataInitialized] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({});
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [costoTotal, setCostoTotal] = useState(0);
    const [procesosCurrentPage, setProcesosCurrentPage] = useState(1);
    const confirmActionRef = useRef(null);
    const itemToRemoveRef = useRef({ type: null, keyToRemove: null });
    const [originalIdProductOnLoad, setOriginalIdProductOnLoad] = useState(null);
    const ingredientesEndRef = useRef(null);
    const idProductoFromUrl = new URLSearchParams(location.search).get('idProducto');

    // ... (useEffect y funciones sin cambios hasta executeSave) ...
    useEffect(() => {
        const editingMode = !!idSpecsheetFromUrl;
        setIsEditing(editingMode);
        setIsDataInitialized(false);
        if (!editingMode) {
            const initialState = getInitialFichaFormState();
            if (idProductoFromUrl) initialState.idProduct = idProductoFromUrl;
            setFormFicha(initialState);
            setFormIngredientes([getInitialIngredienteFormState()]);
            setFormProcesos([getInitialProcesoFormState()]);
            setFormErrors(getInitialFormErrors());
            setOriginalIdProductOnLoad(null);
            setIsDataInitialized(true);
        }
    }, [idSpecsheetFromUrl, idProductoFromUrl]);
    
    useEffect(() => {
        let isMounted = true;
        setIsLoadingPageData(true);
        const fetchOptionsData = async () => {
            try {
                const [productosRes, purchasesRes, processesRes] = await Promise.all([
                    productService.getAllProducts({ status: true }),
                    registerPurchaseService.getAllRegisterPurchasesWithDetails(),
                    processService.getAllMasterProcesses() 
                ]);
                if (!isMounted) return;
                const mappedProducts = (productosRes || []).map(p => ({ value: p.idProduct, label: p.productName, unitOfMeasure: p.unitOfMeasure }));
                setProductOptions(mappedProducts);
                if (!isEditing && idProductoFromUrl) {
                    const selectedProd = mappedProducts.find(p => p.value.toString() === idProductoFromUrl);
                    if (selectedProd) setFormFicha(prev => ({ ...prev, unitOfMeasure: selectedProd.unitOfMeasure || '' }));
                }
                const purchaseOptions = [];
                (Array.isArray(purchasesRes) ? purchasesRes : []).forEach(purchase => {
                    const providerName = purchase.provider?.company || 'No especificado';
                    (Array.isArray(purchase.details) ? purchase.details : []).forEach(detail => {
                        if (detail && detail.supply && detail.idPurchaseDetail) {
                            const stockDisponible = parseFloat(detail.stockDisponible || detail.quantity);
                            if (stockDisponible > 0) {
                                purchaseOptions.push({ value: detail.idPurchaseDetail, label: `${detail.supply.supplyName} (Lote: #${detail.idPurchaseDetail} | Disp: ${stockDisponible} ${detail.supply.unitOfMeasure}) - Prov: ${providerName}`, idSupply: detail.idSupply, unitOfMeasure: detail.supply.unitOfMeasure, stock: stockDisponible, pricePerUnit: parseFloat(detail.unitPrice || 0) });
                            }
                        }
                    });
                });
                setPurchaseDetailOptions(purchaseOptions);
                const mappedProcesses = (Array.isArray(processesRes) ? processesRes : []).map(p => ({ value: p.idProcess, label: p.processName, description: p.description || '' })).sort((a, b) => a.label.localeCompare(b.label));
                setMasterProcessOptions(mappedProcesses);
            } catch (error) { if (isMounted) toast.error("Error cargando datos para la ficha."); } 
            finally { if (isMounted) setIsLoadingPageData(false); }
        };
        fetchOptionsData();
        return () => { isMounted = false; };
    }, [isEditing, idProductoFromUrl]);
    
    useEffect(() => {
        let isMounted = true;
        if (isEditing && idSpecsheetFromUrl && !isLoadingPageData && !isDataInitialized && masterProcessOptions.length > 0) {
            setIsLoadingFichaData(true);
            const fetchFichaData = async () => {
                try {
                    const fichaFromApi = await fichaTecnicaService.getSpecSheetById(idSpecsheetFromUrl);
                    if (isMounted && fichaFromApi) {
                        setOriginalIdProductOnLoad(fichaFromApi.idProduct?.toString() || null);
                        setFormFicha({ idProduct: fichaFromApi.idProduct?.toString() || '', dateEffective: (fichaFromApi.dateEffective || '').slice(0, 10), endDate: (fichaFromApi.endDate || '').slice(0, 10), quantityBase: (fichaFromApi.quantityBase || '')?.toString(), unitOfMeasure: fichaFromApi.unitOfMeasure || '', status: fichaFromApi.status !== undefined ? fichaFromApi.status : true });
                        const backendSupplies = Array.isArray(fichaFromApi.specSheetSupplies) ? fichaFromApi.specSheetSupplies : [];
                        const mappedIngredientes = backendSupplies.map(ing => { const purchaseOpt = purchaseDetailOptions.find(opt => opt.value === ing.idPurchaseDetail); return { ...getInitialIngredienteFormState(), key: ing.idSpecSheetSupply, selectedPurchaseDetailOption: purchaseOpt || null, idPurchaseDetail: ing.idPurchaseDetail, idSupply: ing.idSupply, quantity: ing.quantity?.toString() || '', unitOfMeasure: ing.unitOfMeasure || purchaseOpt?.unitOfMeasure || '', stockDisponible: purchaseOpt?.stock || 0 }; });
                        setFormIngredientes(mappedIngredientes.length > 0 ? mappedIngredientes : [getInitialIngredienteFormState()]);
                        if (fichaFromApi.totalCost) setCostoTotal(parseFloat(fichaFromApi.totalCost));
                        const backendProcesses = Array.isArray(fichaFromApi.specSheetProcesses) ? fichaFromApi.specSheetProcesses : [];
                        const mappedProcesos = backendProcesses.map((proc, index) => { const masterProcess = masterProcessOptions.find(opt => opt.value === proc.idProcess); return { key: proc.idSpecSheetProcess || `proc-${Date.now()}-${index}`, idProcess: proc.idProcess, selectedProcess: masterProcess || null, processOrder: proc.processOrder || (index + 1), processNameOverride: proc.processNameOverride || masterProcess?.label || '', processDescriptionOverride: proc.processDescriptionOverride || '' }; }).sort((a, b) => a.processOrder - b.processOrder);
                        setFormProcesos(mappedProcesos.length > 0 ? mappedProcesos : [getInitialProcesoFormState()]);
                        if(isMounted) setIsDataInitialized(true);
                    } else if (isMounted) { toast.error(`Ficha ID: ${idSpecsheetFromUrl} no encontrada.`); navigate('/home/fichas-tecnicas/lista'); }
                } catch (error) { if (isMounted) toast.error(`Error al cargar la ficha técnica. ${error.message || ''}`); } 
                finally { if (isMounted) setIsLoadingFichaData(false); }
            };
            fetchFichaData();
        }
    }, [isEditing, idSpecsheetFromUrl, isLoadingPageData, purchaseDetailOptions, masterProcessOptions, navigate, isDataInitialized]);

    useEffect(() => {
        const calcularCostoTotal = () => {
            const total = formIngredientes.reduce((sum, ing) => {
                const lote = ing.selectedPurchaseDetailOption;
                if (!lote || !ing.quantity) return sum;
                const precioPorUnidadDeCompra = parseFloat(lote.pricePerUnit || 0);
                const unidadDeCompra = lote.unitOfMeasure;
                const cantidadEnReceta = parseFloat(ing.quantity);
                const unidadEnReceta = ing.unitOfMeasure;
                if (isNaN(precioPorUnidadDeCompra) || isNaN(cantidadEnReceta) || !unidadDeCompra || !unidadEnReceta) return sum;
                const cantidadRecetaEnUnidadDeCompra = convertToBaseUnit(cantidadEnReceta, unidadEnReceta) / convertToBaseUnit(1, unidadDeCompra);
                const costoItem = precioPorUnidadDeCompra * cantidadRecetaEnUnidadDeCompra;
                return sum + costoItem;
            }, 0);
            setCostoTotal(total);
        };
        calcularCostoTotal();
    }, [formIngredientes]);

    useEffect(() => { if (formIngredientes.length > 1) { ingredientesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); } }, [formIngredientes.length]);
    
    const procesosTotalPages = useMemo(() => Math.ceil(formProcesos.length / PROCESOS_PER_PAGE), [formProcesos]);
    const currentProcesos = useMemo(() => { const startIndex = (procesosCurrentPage - 1) * PROCESOS_PER_PAGE; return formProcesos.slice(startIndex, startIndex + PROCESOS_PER_PAGE); }, [formProcesos, procesosCurrentPage]);
    const handleProcesoPageChange = useCallback((e, pageNumber) => { e.preventDefault(); setProcesosCurrentPage(pageNumber); }, []);
    const clearSpecificFormErrors = useCallback((fields) => { setFormErrors(prev => { const newErrors = { ...prev };(Array.isArray(fields) ? fields : [fields]).forEach(field => { newErrors[field] = ''; }); if (!Object.values(newErrors).some(err => err && err !== prev.general) && newErrors.general) newErrors.general = ''; return newErrors;}); }, []);
    const handleFichaChange = useCallback((e) => { const { name, value, type, checked } = e.target; const val = type === 'checkbox' ? checked : value; setFormFicha(prev => { const newState = { ...prev, [name]: val }; if (name === 'idProduct' && val) { const selectedProd = productOptions.find(p => p.value.toString() === val.toString()); newState.unitOfMeasure = selectedProd?.unitOfMeasure || ''; } return newState; }); if (formErrors[name] || formErrors.general) clearSpecificFormErrors([name, 'general']); }, [formErrors, clearSpecificFormErrors, productOptions]);
    const handleIngredienteChange = useCallback((index, field, value) => { setFormIngredientes(prev => prev.map((ing, i) => { if (i === index) { const updatedIng = { ...ing, error: '' }; if (field === 'selectedPurchaseDetailOption') { updatedIng.selectedPurchaseDetailOption = value; updatedIng.idPurchaseDetail = value?.value || ''; updatedIng.idSupply = value?.idSupply || ''; updatedIng.unitOfMeasure = value?.unitOfMeasure || ''; updatedIng.stockDisponible = value?.stock || 0; } else { updatedIng[field] = value; } if ((field === 'quantity' || field === 'selectedPurchaseDetailOption') && updatedIng.idPurchaseDetail) { const cantidadRequerida = parseFloat(updatedIng.quantity); const stockDisponible = parseFloat(updatedIng.stockDisponible); if (!isNaN(cantidadRequerida) && !isNaN(stockDisponible) && cantidadRequerida > stockDisponible) { updatedIng.error = `Insuficiente. Disp: ${stockDisponible} ${updatedIng.unitOfMeasure}`; toast.error(`Stock insuficiente para "${updatedIng.selectedPurchaseDetailOption?.label.split(' (')[0]}"`); } } return updatedIng; } return ing; })); clearSpecificFormErrors([`ingrediente_${index}_idPurchaseDetail`, 'ingredientes', 'general']); }, [clearSpecificFormErrors]);
    const handleProcesoChange = useCallback((index, field, value) => { setFormProcesos(prev => prev.map((p, i) => { if (i === index) { const updatedProcess = { ...p }; if (field === 'selectedProcess') { updatedProcess.selectedProcess = value; updatedProcess.idProcess = value?.value || null; updatedProcess.processNameOverride = value?.label || ''; updatedProcess.processDescriptionOverride = value?.description || ''; } else if (field === 'processOrder') { const parsedOrder = parseInt(value, 10); updatedProcess.processOrder = (isNaN(parsedOrder) || parsedOrder < 1) ? p.processOrder : parsedOrder; } else { updatedProcess[field] = value; } return updatedProcess; } return p; })); clearSpecificFormErrors([`proceso_${index}_processOrder`, `proceso_${index}_processNameOverride`, 'procesos', 'general']); }, [clearSpecificFormErrors]);
    const addIngrediente = useCallback(() => setFormIngredientes(prev => [...prev, getInitialIngredienteFormState()]), []);
    const addProceso = useCallback(() => { setFormProcesos(prev => { const nextOrder = prev.length > 0 ? Math.max(0, ...prev.map(p => p.processOrder || 0)) + 1 : 1; const newProcesos = [...prev, { ...getInitialProcesoFormState(), processOrder: nextOrder }]; const newTotalPages = Math.ceil(newProcesos.length / PROCESOS_PER_PAGE); setProcesosCurrentPage(newTotalPages); return newProcesos; }); }, []);
    const validateFichaTecnicaForm = useCallback(() => {
        const errors = { ...getInitialFormErrors() }; let isValid = true;
        if (!formFicha.idProduct) { errors.idProduct = "Producto requerido."; isValid = false; }
        if (!formFicha.dateEffective) { errors.dateEffective = "Fecha efectiva requerida."; isValid = false; }
        if (formFicha.endDate && formFicha.dateEffective && new Date(formFicha.endDate) < new Date(formFicha.dateEffective)) { errors.endDate = "Fin no puede ser anterior."; isValid = false; }
        if (!formFicha.quantityBase || parseFloat(formFicha.quantityBase) <= 0) { errors.quantityBase = "Cant. base > 0."; isValid = false; }
        if (!formFicha.unitOfMeasure) { errors.unitOfMeasure = "Unidad requerida."; isValid = false; }
        let ingSectionError = false;
        formIngredientes.forEach((ing, idx) => {
            if (!ing.idPurchaseDetail) { errors[`ingrediente_${idx}_idPurchaseDetail`] = "Lote de compra requerido."; ingSectionError = true; }
            if (!ing.quantity || parseFloat(ing.quantity) <= 0) { errors[`ingrediente_${idx}_quantity`] = "Cant. > 0 requerida."; ingSectionError = true; }
            if (!ing.unitOfMeasure) { errors[`ingrediente_${idx}_unitOfMeasure`] = "Unidad requerida."; ingSectionError = true; }
            if (ing.error) { ingSectionError = true; }
        });
        if (ingSectionError) { errors.ingredientes = "Revise los errores en los ingredientes (lotes, cantidades o stock)."; isValid = false; }
        let procSectionError = false;
        if (formProcesos.length > 0) {
            const orders = new Set();
            formProcesos.forEach((proc, idx) => {
                if (!proc.processNameOverride?.trim()) { errors[`proceso_${idx}_processNameOverride`] = "Nombre del paso requerido."; procSectionError = true; }
                const orderVal = parseInt(proc.processOrder, 10);
                if (isNaN(orderVal) || orderVal < 1) { errors[`proceso_${idx}_processOrder`] = "Orden inválido."; procSectionError = true;}
                else if (orders.has(orderVal)) { errors[`proceso_${idx}_processOrder`] = `Orden duplicado.`; procSectionError = true;}
                else orders.add(orderVal);
            });
            if (procSectionError) { errors.procesos = "Revise los pasos de elaboración."; isValid = false; }
        }
        if (!isValid) toast.error("Por favor, corrija los errores marcados.");
        setFormErrors(errors);
        return isValid;
    }, [formFicha, formIngredientes, formProcesos]);
    const toggleConfirmModal = useCallback(() => { if (!isConfirmActionLoading) setConfirmModalOpen(p => !p); }, [isConfirmActionLoading]);
    const prepareActionConfirmation = useCallback((actionFn, props) => { confirmActionRef.current = actionFn; setConfirmModalProps(props); setConfirmModalOpen(true); }, []);
    const executeRemoveItem = useCallback(() => { const { type, keyToRemove } = itemToRemoveRef.current; if (type === 'ingrediente') { setFormIngredientes(prev => prev.filter(item => item.key !== keyToRemove)); } else if (type === 'proceso') { if (currentProcesos.length === 1 && procesosCurrentPage > 1) setProcesosCurrentPage(p => p - 1); setFormProcesos(prev => prev.filter(item => item.key !== keyToRemove).map((p, idx) => ({ ...p, processOrder: idx + 1 }))); } toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.`); toggleConfirmModal(); }, [toggleConfirmModal, currentProcesos.length, procesosCurrentPage]);
    const requestRemoveItemConfirmation = useCallback((type, index, itemKey) => { itemToRemoveRef.current = { type, keyToRemove: itemKey }; const itemArray = type === 'ingrediente' ? formIngredientes : formProcesos; const itemActual = itemArray.find(item => item.key === itemKey); const itemName = type === 'ingrediente' ? (itemActual?.selectedPurchaseDetailOption?.label || `Ingrediente #${index + 1}`) : (itemActual?.processNameOverride || `Paso #${itemActual?.processOrder || index + 1}`); prepareActionConfirmation(executeRemoveItem, { title: `Confirmar Eliminación`, message: `¿Está seguro de que desea eliminar "${itemName}"?`, confirmText: "Sí, Eliminar", confirmColor: "danger" }); }, [formIngredientes, formProcesos, prepareActionConfirmation, executeRemoveItem]);
    
    const executeSave = async () => {
        setIsSaving(true);
        setIsConfirmActionLoading(true);
        const actionText = isEditing ? "actualizando" : "creando";
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ficha...`);
    
        // ✅ --- CORRECCIÓN FINAL: Alineación de Nombres de Campo ---
        // Cambiamos `quantityBase` a `quantity` y `dateEffective` a `startDate` para que coincidan con el backend.
        const fichaPayload = {
            idProduct: parseInt(formFicha.idProduct, 10),
            startDate: formFicha.dateEffective, // <-- CORREGIDO
            endDate: formFicha.endDate || null,
            quantity: parseFloat(formFicha.quantityBase), // <-- CORREGIDO
            unitOfMeasure: formFicha.unitOfMeasure,
            status: formFicha.status,
            specSheetSupplies: formIngredientes
                .filter(ing => ing.idPurchaseDetail && ing.quantity)
                .map(ing => ({
                    idPurchaseDetail: parseInt(ing.idPurchaseDetail, 10),
                    idSupply: parseInt(ing.idSupply, 10),
                    quantity: parseFloat(ing.quantity),
                    unitOfMeasure: ing.unitOfMeasure,
                })),
            specSheetProcesses: formProcesos
                .filter(proc => proc.processNameOverride?.trim())
                .map((proc, index) => ({
                    ...(proc.idProcess && { idProcess: proc.idProcess }),
                    processOrder: proc.processOrder || (index + 1),
                    processNameOverride: proc.processNameOverride.trim(),
                    processDescriptionOverride: proc.processDescriptionOverride?.trim() || null,
                }))
        };
    
        try {
            if (isEditing && idSpecsheetFromUrl) {
                await fichaTecnicaService.updateSpecSheet(idSpecsheetFromUrl, fichaPayload);
            } else {
                await fichaTecnicaService.createSpecSheet(fichaPayload);
            }
            toast.success(`Ficha ${isEditing ? 'actualizada' : 'creada'} con éxito.`, { id: toastId });
            toggleConfirmModal();
            setTimeout(() => {
                const destination = isEditing ? `/home/producto/${formFicha.idProduct}/fichas` : (idProductoFromUrl ? `/home/producto/${idProductoFromUrl}/fichas` : '/home/produccion/producto-insumo');
                navigate(destination);
            }, 1200);
        } catch (error) {
            const backendErrors = error.response?.data?.errors;
            let newFormErrors = {};
            let generalErrorMsg = error.response?.data?.message || error.message || `Error al ${actionText} la ficha técnica.`;

            // Mapeamos los nombres de los campos del backend a los del frontend para los errores.
            const fieldNameMapping = {
                startDate: 'dateEffective',
                quantity: 'quantityBase'
            };

            if (Array.isArray(backendErrors)) {
                generalErrorMsg = "Se encontraron errores de validación. Por favor, revise los campos marcados.";
                backendErrors.forEach(err => {
                    const frontendFieldName = fieldNameMapping[err.path] || err.path;
                    newFormErrors[frontendFieldName] = err.msg;
                });
                setFormErrors(prev => ({ ...prev, ...newFormErrors, general: generalErrorMsg }));
                toast.error(<div><strong>Error:</strong><br/>{generalErrorMsg}</div>, { id: toastId, duration: 6000 });
            } else {
                setFormErrors(prev => ({ ...prev, general: generalErrorMsg }));
                toast.error(<div><strong>Error:</strong><br/>{generalErrorMsg}</div>, { id: toastId, duration: 8000 });
            }

            if (confirmModalOpen) toggleConfirmModal();
        } finally {
            setIsSaving(false);
            setIsConfirmActionLoading(false);
        }
    };

    const requestSaveConfirmation = useCallback(() => { if (!validateFichaTecnicaForm()) return; prepareActionConfirmation(executeSave, { title: `Confirmar ${isEditing ? 'Actualización' : 'Creación'}`, message: `¿Desea ${isEditing ? 'guardar los cambios en' : 'crear esta nueva'} la ficha técnica?`, confirmText: `Sí, ${isEditing ? 'Actualizar' : 'Guardar'}`, confirmColor: isEditing ? "primary" : "success" }); }, [validateFichaTecnicaForm, isEditing, executeSave, prepareActionConfirmation]);
    const handleCancel = () => { const destination = isEditing && originalIdProductOnLoad ? `/home/producto/${originalIdProductOnLoad}/fichas` : (idProductoFromUrl ? `/home/producto/${idProductoFromUrl}/fichas` : '/home/produccion/producto-insumo'); navigate(destination); };
    const getSelectStyles = (hasError) => ({ control: (base, state) => ({ ...base, borderColor: hasError ? '#dc3545' : '#ced4da', '&:hover': { borderColor: hasError ? '#dc3545' : '#adb5bd' }, boxShadow: state.isFocused ? (hasError ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)' : '0 0 0 0.25rem rgba(13, 110, 253, 0.25)') : 'none', }), option: (base, { isFocused, isSelected }) => ({ ...base, backgroundColor: isSelected ? '#0d6efd' : isFocused ? '#dee2e6' : 'white', color: isSelected ? 'white' : '#212529', }), });
    
    if (isLoadingPageData) { 
        return ( <Container fluid className="text-center py-5"><Spinner /><p className="mt-2">Cargando datos maestros...</p></Container> ); 
    }

    return (
        <React.Fragment>
            <style>
                {`
                    .process-list-container {
                      display: flex;
                      flex-direction: column;
                      gap: 1rem;
                    }
                    .process-item-grid {
                      display: grid;
                      grid-template-columns: auto 1fr auto;
                      gap: 0.75rem;
                      align-items: center;
                      padding: 1rem;
                      border: 1px solid #e9ecef;
                      border-radius: 0.375rem;
                      background-color: #fdfdfd;
                      transition: box-shadow 0.2s ease-in-out;
                    }
                    .process-item-grid:hover {
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
                    }
                    .process-order .form-control {
                      width: 60px;
                      text-align: center;
                      font-weight: bold;
                      font-size: 1.1rem;
                      background-color: #f8f9fa;
                    }
                    .process-main {
                      display: flex;
                      flex-direction: column;
                      gap: 0.5rem;
                    }
                    .process-main textarea.form-control {
                      font-size: 0.85rem;
                      color: #6c757d;
                      resize: vertical;
                      min-height: 40px;
                    }
                    @media (max-width: 768px) {
                      .process-item-grid {
                        grid-template-columns: 1fr;
                        grid-template-areas:
                          "order"
                          "main"
                          "action";
                        gap: 0.75rem;
                      }
                      .process-order { grid-area: order; }
                      .process-main { grid-area: main; }
                      .process-action { 
                        grid-area: action;
                        justify-self: end;
                      }
                      .process-order .form-control {
                        width: 100%;
                      }
                    }
                `}
            </style>
            
            <Container fluid className="main-content ficha-tecnica-page-content">
                <Toaster position="top-center" />
                <Row className="mb-4 align-items-center ficha-tecnica-page-header">
                    <Col><h2 className="mb-0 d-flex align-items-center">{isEditing ? <Edit size={28}/> : <Plus size={28}/>}{isEditing ? " Editar Ficha Técnica" : " Crear Ficha Técnica"}{isEditing && <span className="ms-2 fs-5 text-muted">(ID: {idSpecsheetFromUrl})</span>}</h2></Col>
                </Row>
                {isEditing && isLoadingFichaData && <div className="text-center py-3"><Spinner size="sm" /> Cargando datos de la ficha...</div>}
                {formErrors.general && <Alert color="danger">{formErrors.general}</Alert>}
                
                <Form onSubmit={(e) => { e.preventDefault(); requestSaveConfirmation(); }}>
                    <section className="ficha-tecnica-card">
                        <h4 className="section-title">Datos Generales</h4>
                        <Row>
                            <Col md={6}><FormGroup><Label for="idProduct">Producto Final</Label><Select options={productOptions} value={productOptions.find(p => p.value.toString() === formFicha.idProduct)} onChange={opt => handleFichaChange({ target: { name: 'idProduct', value: opt.value } })} placeholder="Seleccione un producto..." isDisabled={isSaving || isEditing} styles={getSelectStyles(!!formErrors.idProduct)} noOptionsMessage={() => "No hay productos disponibles"} />{formErrors.idProduct && <div className="invalid-feedback d-block x-small mt-1">{formErrors.idProduct}</div>}</FormGroup></Col>
                            <Col md={3}><FormGroup><Label for="dateEffective">Fecha Efectiva</Label><Input type="date" name="dateEffective" id="dateEffective" bsSize="sm" value={formFicha.dateEffective} onChange={handleFichaChange} invalid={!!formErrors.dateEffective} disabled={isSaving}/><FormFeedback className="x-small">{formErrors.dateEffective}</FormFeedback></FormGroup></Col>
                            <Col md={3}><FormGroup><Label for="endDate">Fecha de Fin (Opcional)</Label><Input type="date" name="endDate" id="endDate" bsSize="sm" value={formFicha.endDate} onChange={handleFichaChange} invalid={!!formErrors.endDate} disabled={isSaving}/><FormFeedback className="x-small">{formErrors.endDate}</FormFeedback></FormGroup></Col>
                        </Row>
                        <Row>
                            <Col md={4}><FormGroup><Label for="quantityBase">Peso Base</Label><InputGroup size="sm"><InputGroupText><Hash size={14}/></InputGroupText><Input type="number" name="quantityBase" id="quantityBase" min="0.01" step="any" value={formFicha.quantityBase} onChange={handleFichaChange} invalid={!!formErrors.quantityBase} disabled={isSaving} placeholder="Ej: 1000"/></InputGroup><FormFeedback className="x-small">{formErrors.quantityBase}</FormFeedback></FormGroup></Col>
                            <Col md={4}><FormGroup><Label for="unitOfMeasure">Unidad de Medida (del Peso Base)</Label><Input type="select" bsSize="sm" name="unitOfMeasure" id="unitOfMeasure" value={formFicha.unitOfMeasure} onChange={handleFichaChange} invalid={!!formErrors.unitOfMeasure} disabled={isSaving}><option value="">Seleccione unidad...</option>{unitOfMeasures.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}</Input><FormFeedback className="x-small">{formErrors.unitOfMeasure}</FormFeedback></FormGroup></Col>
                            <Col md={4}><FormGroup><Label>Estado de la Ficha</Label><div className="d-flex align-items-center"><Button color={formFicha.status ? 'success' : 'secondary'} outline size="sm" onClick={() => handleFichaChange({ target: { name: 'status', type: 'checkbox', checked: !formFicha.status }})} disabled={isSaving}>{formFicha.status ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}<span className="ms-2">{formFicha.status ? 'Activa' : 'Inactiva'}</span></Button></div></FormGroup></Col>
                        </Row>
                    </section>
                    
                    <section className="ficha-tecnica-card">
                        <Row className="align-items-center mb-3"><Col><h4 className="mb-0 section-title">Ingredientes</h4></Col><Col className="text-end"><Button color="success" outline size="sm" onClick={addIngrediente} disabled={isSaving}><Plus size={16}/> Añadir Ingrediente</Button></Col></Row>
                        {formErrors.ingredientes && <Alert color="warning" className="py-1 px-2 x-small mb-2"><small>{formErrors.ingredientes}</small></Alert>}
                        
                        {formIngredientes.map((ing, index) => {
                            let costoItem = 0;
                            const lote = ing.selectedPurchaseDetailOption;
                            if (lote && ing.quantity) {
                                const precioPorUnidadDeCompra = parseFloat(lote.pricePerUnit || 0);
                                const unidadDeCompra = lote.unitOfMeasure;
                                const cantidadEnReceta = parseFloat(ing.quantity);
                                const unidadEnReceta = ing.unitOfMeasure;
                                if (!isNaN(precioPorUnidadDeCompra) && !isNaN(cantidadEnReceta) && unidadDeCompra && unidadEnReceta) {
                                    const cantidadRecetaEnUnidadDeCompra = convertToBaseUnit(cantidadEnReceta, unidadEnReceta) / convertToBaseUnit(1, unidadDeCompra);
                                    costoItem = precioPorUnidadDeCompra * cantidadRecetaEnUnidadDeCompra;
                                }
                            }
                            return (
                                <Row key={ing.key} className="g-2 align-items-center dynamic-item-row">
                                    <Col sm={12} md={5}><FormGroup className="mb-2 mb-md-0"><Select options={purchaseDetailOptions} value={ing.selectedPurchaseDetailOption} onChange={opt => handleIngredienteChange(index, 'selectedPurchaseDetailOption', opt)} placeholder="Seleccione lote de insumo..." isDisabled={isSaving || purchaseDetailOptions.length === 0} styles={getSelectStyles(!!formErrors[`ingrediente_${index}_idPurchaseDetail`])} noOptionsMessage={() => "No hay lotes con stock"} menuPlacement="auto"/>{formErrors[`ingrediente_${index}_idPurchaseDetail`] && (<div className="invalid-feedback d-block x-small mt-1">{formErrors[`ingrediente_${index}_idPurchaseDetail`]}</div>)}</FormGroup></Col>
                                    <Col sm={4} md={2}><FormGroup className="mb-2 mb-md-0"><Input type="number" bsSize="sm" min="0.001" step="any" name="quantity" value={ing.quantity} onChange={e => handleIngredienteChange(index, 'quantity', e.target.value)} invalid={!!formErrors[`ingrediente_${index}_quantity`] || !!ing.error} disabled={isSaving} placeholder="Cantidad"/><FormFeedback className="x-small">{formErrors[`ingrediente_${index}_quantity`] || ing.error}</FormFeedback></FormGroup></Col>
                                    <Col sm={5} md={2}><FormGroup className="mb-2 mb-md-0"><Input type="select" bsSize="sm" name="unitOfMeasure" value={ing.unitOfMeasure} onChange={e => handleIngredienteChange(index, 'unitOfMeasure', e.target.value)} invalid={!!formErrors[`ingrediente_${index}_unitOfMeasure`]} disabled={isSaving}><option value="">Unidad...</option>{unitOfMeasures.map(u=>(<option key={u.value} value={u.value}>{u.label}</option>))}</Input>{formErrors[`ingrediente_${index}_unitOfMeasure`] && (<FormFeedback className="x-small">{formErrors[`ingrediente_${index}_unitOfMeasure`]}</FormFeedback>)}</FormGroup></Col>
                                    <Col sm={4} md={2}><div className="cost-display text-center text-md-start"><Label for={`costo-${index}`} className="d-block x-small text-muted mb-0">Costo del Ítem</Label><span id={`costo-${index}`} className="fw-bold">{formatCurrency(costoItem)}</span></div></Col>
                                    <Col sm={3} md={1} className="text-end"><Button color="danger" outline size="sm" onClick={() => requestRemoveItemConfirmation('ingrediente', index, ing.key)} disabled={isSaving || formIngredientes.length <= 1} title="Eliminar Ingrediente"><Trash2 size={16}/></Button></Col>
                                </Row>
                            );
                        })}
                        <div ref={ingredientesEndRef} />
                        {formIngredientes.length >= 3 && <Row className="mt-3"><Col className="text-end"><Button color="success" outline size="sm" onClick={addIngrediente} disabled={isSaving}><Plus size={16}/> Añadir Otro Ingrediente</Button></Col></Row>}
                        {formIngredientes.some(ing => ing.idPurchaseDetail) && (<div className="total-cost-section mt-4 pt-3 border-top"><Row className="align-items-center"><Col md={8} className="text-md-end"><h5 className="mb-0">Costo Total de la Receta:</h5><small className="text-muted">Calculado para una base de {formFicha.quantityBase || 0} {formFicha.unitOfMeasure || ''}</small></Col><Col md={4} className="text-md-end mt-2 mt-md-0"><h4 className="fw-bolder text-success mb-0">{formatCurrency(costoTotal)}</h4></Col></Row></div>)}
                        {purchaseDetailOptions.length === 0 && !isLoadingPageData && <Alert color="info" className="mt-3">No hay compras de insumos disponibles. Registre una nueva compra primero.</Alert>}
                    </section>
                    
                    <section className="ficha-tecnica-card">
                        <Row className="align-items-center mb-3"><Col><h4 className="mb-0 section-title">Pasos de Elaboración</h4></Col><Col className="text-end"><Button color="info" outline size="sm" onClick={addProceso} disabled={isSaving}><Plus size={16}/> Añadir Paso</Button></Col></Row>
                        {formErrors.procesos && <Alert color="warning" className="py-1 px-2 x-small mb-2"><small>{formErrors.procesos}</small></Alert>}
                        
                        <div className="process-list-container">
                            {currentProcesos.map((proc, procIndex) => {
                                const globalIndex = (procesosCurrentPage - 1) * PROCESOS_PER_PAGE + procIndex;
                                
                                return (
                                    <div key={proc.key} className="process-item-grid">
                                        <div className="process-order">
                                            <Input type="number" bsSize="sm" name="processOrder" value={proc.processOrder} onChange={e => handleProcesoChange(globalIndex, 'processOrder', e.target.value)} invalid={!!formErrors[`proceso_${globalIndex}_processOrder`]} disabled={isSaving} title={`Orden del paso ${proc.processOrder}`} />
                                            {formErrors[`proceso_${globalIndex}_processOrder`] && <div className="invalid-feedback d-block x-small mt-1">{formErrors[`proceso_${globalIndex}_processOrder`]}</div>}
                                        </div>

                                        <div className="process-main">
                                            <Select options={masterProcessOptions} value={proc.selectedProcess} onChange={opt => handleProcesoChange(globalIndex, 'selectedProcess', opt)} placeholder="Seleccione un proceso maestro para autocompletar..." isDisabled={isSaving} styles={getSelectStyles(!!formErrors[`proceso_${globalIndex}_processNameOverride`])} isClearable />
                                            <Input type="text" bsSize="sm" name="processNameOverride" value={proc.processNameOverride} onChange={e => handleProcesoChange(globalIndex, 'processNameOverride', e.target.value)} invalid={!!formErrors[`proceso_${globalIndex}_processNameOverride`]} placeholder="O escriba un nombre de paso personalizado" className="mt-1" />
                                            {formErrors[`proceso_${globalIndex}_processNameOverride`] && <FormFeedback className="x-small">{formErrors[`proceso_${globalIndex}_processNameOverride`]}</FormFeedback>}
                                            <Input type="textarea" bsSize="sm" name="processDescriptionOverride" value={proc.processDescriptionOverride} onChange={e => handleProcesoChange(globalIndex, 'processDescriptionOverride', e.target.value)} placeholder="Descripción detallada del paso (opcional)" disabled={isSaving} rows={2} />
                                        </div>

                                        <div className="process-action">
                                            <Button color="danger" outline size="sm" onClick={() => requestRemoveItemConfirmation('proceso', globalIndex, proc.key)} disabled={isSaving || formProcesos.length <= 1} title="Eliminar Paso">
                                                <Trash2 size={16}/>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {procesosTotalPages > 1 && (
                            <Pagination size="sm" listClassName="justify-content-center mt-3">
                                {[...Array(procesosTotalPages).keys()].map(page => (
                                    <PaginationItem key={page + 1} active={procesosCurrentPage === page + 1}>
                                        <PaginationLink href="#" onClick={(e) => handleProcesoPageChange(e, page + 1)}>
                                            {page + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                            </Pagination>
                        )}
                    </section>
                    
                    <div className="d-flex justify-content-end mt-4 mb-5 ficha-tecnica-actions">
                        <Button color="secondary" outline onClick={handleCancel} disabled={isSaving} className="me-2"><X size={18}/> Cancelar</Button>
                        <Button color={isEditing ? "primary" : "success"} type="submit" disabled={isSaving}>{isSaving ? <Spinner size="sm"/> : <Save size={18}/>} {isEditing ? " Actualizar Ficha" : " Guardar Ficha"}</Button>
                    </div>
                </Form>

                <ConfirmationModalComponent isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title} onConfirm={() => confirmActionRef.current && confirmActionRef.current()} confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor} isConfirming={isConfirmActionLoading}>
                    {confirmModalProps.message}
                </ConfirmationModalComponent>
            </Container>
        </React.Fragment>
    );
};

export default FichaTecnica;