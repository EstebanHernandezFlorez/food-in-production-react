import React, { useState, useEffect, useRef, useContext, useCallback, useMemo as useReactMemo } from 'react';
import {
    Row, Col, Spinner, Button, Form, Container, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter, CardFooter,
    Card, CardHeader, CardBody, Input, Label, FormGroup,
    InputGroup
} from 'reactstrap';
import toast, { Toaster } from 'react-hot-toast';
import {
    ArrowRightCircle, CheckCircle, ChefHat, ChevronLeft, ChevronRight,
    Clock, Edit, Info, ListChecks, Loader, PauseCircle, PlayCircle,
    Package, Save, XCircle
} from 'lucide-react';

// Servicios
import specSheetService from '../../services/specSheetService';
import productionOrderService from '../../services/productionOrderService';

// Estilos
import '../../../assets/css/produccion/ProduccionStyles.css';

// Contexto y Componentes
import { ActiveOrdersContext } from './ActiveOrdersContext';
import { useAuth } from '../../hooks/AuthProvider';
import ProcessManagementSection from './components/ProcessManagementSection';
import OrderFinalizationSection from './components/OrderFinalizationSection';
import CancelOrderModal from './components/CancelOrderModal';

// Funciones Helper
export const getStatusInfoInSpanish = (status) => {
    switch (status?.toUpperCase()) {
        case 'PENDING': return { text: 'Pendiente', color: 'secondary', icon: <Clock size={12} /> };
        case 'SETUP': return { text: 'Configuración', color: 'primary', icon: <Edit size={12} /> };
        case 'SETUP_COMPLETED': return { text: 'Lista para Iniciar', color: 'primary', icon: <CheckCircle size={12} /> };
        case 'IN_PROGRESS': return { text: 'En Proceso', color: 'warning', icon: <Loader size={12} className="lucide-spin" /> };
        case 'PAUSED': return { text: 'En Pausa', color: 'info', icon: <PauseCircle size={12} /> };
        case 'ALL_STEPS_COMPLETED': return { text: 'Pasos Completados', color: 'info', icon: <ListChecks size={12}/>};
        case 'COMPLETED': return { text: 'Completado', color: 'success', icon: <ChefHat size={12} /> };
        case 'CANCELLED': return { text: 'Cancelada', color: 'danger', icon: <XCircle size={12}/> };
        case 'SKIPPED': return { text: 'Omitido', color: 'info', icon: <ArrowRightCircle size={12} /> };
        default: return { text: status || 'Desconocido', color: 'light', icon: null };
    }
};

const SpinnerL = ({ children }) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{ minHeight: '200px' }}><Spinner style={{ width: '3rem', height: '3rem' }} color="primary" className="mb-2" /><p className="text-muted mb-0">{children}</p></div>);
const InfoS = ({ children }) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{ minHeight: '200px' }}><Info size={30} className="text-info mb-2" /><p className="text-muted mb-0">{children}</p></div>);
const convertToBaseUnit = (quantity, unit) => { 
    const qty = parseFloat(quantity); 
    if (isNaN(qty)) return 0; 
    // Si unit es null o undefined, asumimos 'kg'
    const u = String(unit || 'kg').toLowerCase(); 
    if (u.includes('kg')) return qty * 1000; 
    return qty; 
};
const OrdenProduccionForm = ({
    productosMaestrosProps,
    empleadosMaestrosProps,
    proveedoresMaestrosProps,
    masterDataLoadedPageProps,
}) => {
    // --- 1. CONTEXTO Y ESTADO ---
    const { user } = useAuth();
    const { activeOrders, currentViewedOrderId, isLoadingOrderContext, addOrFocusOrder, updateOrderState, transformFetchedOrderToContextFormat, removeOrder } = useContext(ActiveOrdersContext);
    
    const [productos, setProductos] = useState(productosMaestrosProps || []);
    const [empleadosList, setEmpleadosList] = useState(empleadosMaestrosProps || []);
    const [providersList, setProvidersList] = useState([]);
    const [masterDataFullyLoaded, setMasterDataFullyLoaded] = useState(masterDataLoadedPageProps || false);
    const [availableSpecSheets, setAvailableSpecSheets] = useState([]);
    
    const [isLoadingFichas, setIsLoadingFichas] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [showFinalizationFields, setShowFinalizationFields] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderToCancelInfo, setOrderToCancelInfo] = useState(null);
    const [startProductionModalOpen, setStartProductionModalOpen] = useState(false);
    const [selectedEmployeeForStart, setSelectedEmployeeForStart] = useState('');
    
    const [stockCheck, setStockCheck] = useState({ isLoading: false, isSufficient: true, message: null, details: [] });
    
    const prevProductIdRef = useRef();
    const currentOrderData = useReactMemo(() => (!currentViewedOrderId || !activeOrders?.[currentViewedOrderId]) ? null : activeOrders[currentViewedOrderId], [activeOrders, currentViewedOrderId]);
    const icons = { EditIcon: Edit, ChevronLeftIcon: ChevronLeft, ChevronRightIcon: ChevronRight, PlayCircleIcon: PlayCircle, CheckCircleIcon: CheckCircle, InfoIcon: Info, XCircle };
    const formOrderData = currentOrderData?.formOrder; 

    // Helpers flexibles para leer valores numéricos desde `stockCheck.details`
    const extractNumericField = (detail, candidates) => {
        if (!detail) return null;
        for (const key of candidates) {
            if (detail.hasOwnProperty(key) && detail[key] !== null && detail[key] !== undefined && detail[key] !== '') {
                const val = detail[key];
                const n = Number(val);
                if (!isNaN(n)) return n;
                return val;
            }
        }
        for (const k of Object.keys(detail)) {
            const v = detail[k];
            const n = Number(v);
            if (!isNaN(n)) return n;
        }
        return null;
    };

    const getNeededFromDetail = (detail) => {
        const candidates = ['needed','quantityNeeded','required','need','neededQty','requiredQuantity','quantityRequired','neededQuantity','quantity','requiredQty'];
        return extractNumericField(detail, candidates);
    };

    const getAvailableFromDetail = (detail) => {
        const candidates = ['available','quantityAvailable','stock','availableQuantity','quantityAvailable','qtyAvailable','stockAvailable'];
        return extractNumericField(detail, candidates);
    };

    // --- 2. DECLARACIÓN DE FUNCIONES (useCallback) ---
    const loadSpecSheetsForProduct = useCallback(async (productId) => {
        if (!productId || !updateOrderState || !currentViewedOrderId) return;
        setIsLoadingFichas(true);
        try {
            const allSheets = await specSheetService.getSpecSheetsByProductId(productId);
            setAvailableSpecSheets(allSheets || []);
            const activeSheet = allSheets?.find(s => s.status === true);
            const defaultSheet = activeSheet || allSheets?.[0];
            if (defaultSheet) {
                updateOrderState(currentViewedOrderId, {
                    formOrder: { ...currentOrderData.formOrder, idSpecSheet: String(defaultSheet.idSpecSheet) },
                    selectedSpecSheetData: defaultSheet,
                });
            } else {
                updateOrderState(currentViewedOrderId, {
                    formOrder: { ...currentOrderData.formOrder, idSpecSheet: '' },
                    selectedSpecSheetData: null,
                });
                toast.error("Este producto no tiene fichas técnicas disponibles.", { icon: 'ℹ️' });
            }
        } catch (error) {
            toast.error("Error al cargar las fichas técnicas del producto.");
        } finally {
            setIsLoadingFichas(false);
        }
    }, [currentViewedOrderId, updateOrderState, currentOrderData]);

    const handleChangeOrderForm = useCallback((e) => {
        if (!currentViewedOrderId || !currentOrderData || !updateOrderState) return;
        const { name, value } = e.target;
        let newForm = { ...currentOrderData.formOrder, [name]: value };
        
        if (name === 'idProduct') {
            const selectedProduct = productos.find(p => String(p.idProduct) === String(value));
            newForm.productNameSnapshot = selectedProduct ? selectedProduct.productName : '';
            newForm.idProvider = selectedProduct?.idProvider || selectedProduct?.mainIngredientProviderId || '';            newForm.idSpecSheet = ''; newForm.initialAmount = ''; newForm.targetProductionWeight = ''; newForm.targetProductionWeightUnit = 'kg'; 
            updateOrderState(currentViewedOrderId, { formOrder: newForm, selectedSpecSheetData: null, formErrors: {} });
        } else if (name === 'idSpecSheet') {
            const newSelectedSheet = availableSpecSheets.find(s => String(s.idSpecSheet) === value);
            updateOrderState(currentViewedOrderId, { formOrder: newForm, selectedSpecSheetData: newSelectedSheet || null });
        } else {
            updateOrderState(currentViewedOrderId, { formOrder: newForm });
        }
    }, [currentViewedOrderId, currentOrderData, productos, updateOrderState, availableSpecSheets]);

    const handleCreateAndPrepareOrder = useCallback(async () => {
        // 1. Verificación inicial de seguridad
        if (!currentOrderData || !currentOrderData.isNewForForm || isSaving) return;
        
        // Clonamos los datos actuales para no mutar el estado directamente
        let formOrder = { ...currentOrderData.formOrder };
        
        // Buscamos la ficha técnica directamente del estado local 'availableSpecSheets' 
        // porque el contexto puede tardar milisegundos en actualizarse.
        const currentSheet = availableSpecSheets.find(s => String(s.idSpecSheet) === String(formOrder.idSpecSheet));

        console.log("--- DEPURACIÓN DE CREACIÓN ---");
        console.log("Formulario actual:", formOrder);
        console.log("Ficha técnica encontrada:", currentSheet);

        // 2. Intentar recalcular las porciones SI FALTA EL DATO pero tenemos el peso y la ficha
        if (!formOrder.initialAmount && formOrder.targetProductionWeight && currentSheet) {
            const targetWeight = parseFloat(formOrder.targetProductionWeight);
            const recipePortions = parseInt(currentSheet.portions, 10);
            const recipeYieldInGrams = parseFloat(currentSheet.quantityBase);

            if (targetWeight > 0 && recipePortions > 0 && recipeYieldInGrams > 0) {
                const weightPerPortionInGrams = recipeYieldInGrams / recipePortions;
                const targetWeightInGrams = convertToBaseUnit(targetWeight, formOrder.targetProductionWeightUnit);
                const calculatedPortions = Math.floor(targetWeightInGrams / weightPerPortionInGrams);
                
                if (calculatedPortions > 0) {
                    formOrder.initialAmount = String(calculatedPortions);
                    console.log("Porciones calculadas al vuelo:", formOrder.initialAmount);
                }
            }
        }

        // 3. Validación campo por campo para saber EXACTAMENTE qué falla
        const missing = [];
        if (!formOrder.idProduct) missing.push("Producto");
        if (!formOrder.idSpecSheet) missing.push("Ficha Técnica");
        if (!formOrder.targetProductionWeight || parseFloat(formOrder.targetProductionWeight) <= 0) missing.push("Peso válido");
        if (!formOrder.initialAmount || parseInt(formOrder.initialAmount) <= 0) missing.push("Porciones (cálculo fallido)");
        if (!formOrder.idEmployeeRegistered) missing.push("Empleado que registra");

        if (missing.length > 0) {
            toast.error(`Faltan datos: ${missing.join(", ")}`, { duration: 5000 });
            console.error("Validación fallida. Campos faltantes:", missing);
            return;
        }

        // 4. Proceder con el guardado
        setIsSaving(true);
        const toastId = toast.loading("Creando y preparando orden...");
        
        // El payload debe llevar el formOrder que acabamos de validar/corregir
        const payload = { 
            ...formOrder, 
            status: 'SETUP_COMPLETED',
            initialAmount: parseInt(formOrder.initialAmount, 10),
            targetProductionWeight: parseFloat(formOrder.targetProductionWeight),
            // Si idProvider es una cadena vacía, lo enviamos como null
            idProvider: formOrder.idProvider && formOrder.idProvider !== "" ? parseInt(formOrder.idProvider, 10) : null
        };

        try {
            console.log("Enviando Payload al servidor:", payload);
            const resOrder = await productionOrderService.createProductionOrder(payload);
            const transformedOrder = transformFetchedOrderToContextFormat(resOrder);
            
            // Actualizamos el contexto con el ID real que viene de la DB
            updateOrderState(currentViewedOrderId, transformedOrder, transformedOrder.id);
            toast.success("Orden creada y lista para iniciar.", { id: toastId });
        } catch (err) {
            console.error("Error del servidor:", err.response?.data);
            const errorMsg = err.response?.data?.message || "Error al crear la orden.";
            toast.error(errorMsg, { id: toastId, duration: 6000 });
        } finally {
            setIsSaving(false);
        }
    }, [currentOrderData, isSaving, updateOrderState, transformFetchedOrderToContextFormat, currentViewedOrderId, availableSpecSheets]);


    const handleStartProduction = useCallback(() => { setStartProductionModalOpen(true); }, []);

    const handleConfirmStartProduction = useCallback(async () => {
        if (!selectedEmployeeForStart) { toast.error("Debe seleccionar un empleado."); return; }
        setIsProcessingAction(true);
        const toastId = toast.loading("Iniciando producción...");
        try {
            const res = await productionOrderService.startProductionAndDeductSupplies(currentOrderData.id, { idEmployeeAssigned: selectedEmployeeForStart });
            updateOrderState(currentOrderData.id, transformFetchedOrderToContextFormat(res));
            window.dispatchEvent(new Event('inventory:updated'));
            // Notificar a otras partes de la UI que el inventario pudo haber cambiado
            try { window.dispatchEvent(new CustomEvent('inventory:updated', { detail: { productionOrder: res } })); } catch (e) { /* no bloquear si falla */ }
            toast.success("¡Producción iniciada!", { id: toastId });
            setStartProductionModalOpen(false);
            setSelectedEmployeeForStart('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al iniciar producción.", { id: toastId, duration: 6000 });
        } finally {
            setIsProcessingAction(false);
        }
    }, [selectedEmployeeForStart, currentOrderData, updateOrderState, transformFetchedOrderToContextFormat]);

    const handleStepFieldChange = useCallback((stepIndex, fieldName, value) => {
        if (!currentViewedOrderId || !updateOrderState || !currentOrderData) return;
        const newSteps = [...currentOrderData.processSteps];
        newSteps[stepIndex] = { ...newSteps[stepIndex], [fieldName]: value };
        updateOrderState(currentViewedOrderId, { processSteps: newSteps });
    }, [currentViewedOrderId, currentOrderData, updateOrderState]);
    
    const handleEmployeeSelectionForStep = useCallback((stepIndex, newEmployeeId) => {
        if (!currentViewedOrderId || !updateOrderState || !currentOrderData) return;
        const newSteps = [...currentOrderData.processSteps];
        newSteps[stepIndex] = { ...newSteps[stepIndex], idEmployeeAssigned: newEmployeeId };
        updateOrderState(currentViewedOrderId, { processSteps: newSteps });
    }, [currentViewedOrderId, currentOrderData, updateOrderState]);
    
    const handleStartCurrentStep = useCallback(async () => {
        if (!currentOrderData || isProcessingAction) return;
        const { id: orderId, processSteps, activeStepIndex } = currentOrderData;
        const currentStep = processSteps[activeStepIndex];
        
        if (!currentStep || !currentStep.idEmployeeAssigned) {
            toast.error("Debe asignar un empleado al paso antes de iniciarlo.");
            return;
        }
        
        setIsProcessingAction(true);
        const toastId = toast.loading("Iniciando paso...");
        try {
            // CORRECCIÓN: Se agrega idEmployeeAssigned al payload
            const res = await productionOrderService.updateProductionOrderStep(
                orderId, 
                currentStep.idProductionOrderDetail, 
                { 
                    status: 'IN_PROGRESS',
                    idEmployeeAssigned: currentStep.idEmployeeAssigned // <--- ESTO FALTABA
                }
            );
            updateOrderState(orderId, transformFetchedOrderToContextFormat(res));
            toast.success("Paso iniciado correctamente.", { id: toastId });
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al iniciar el paso.", { id: toastId });
        } finally {
            setIsProcessingAction(false);
        }
    }, [currentOrderData, isProcessingAction, updateOrderState, transformFetchedOrderToContextFormat]);
    
    const handleCompleteCurrentStep = useCallback(async () => {
        if (!currentOrderData || isProcessingAction) return;
        const { id: orderId, processSteps, activeStepIndex } = currentOrderData;
        const currentStep = processSteps[activeStepIndex];
        
        if (!currentStep || currentStep.status !== 'IN_PROGRESS') {
            toast.error("Este paso no se puede completar en su estado actual.", { icon: 'ℹ️' });
            return;
        }
        
        setIsProcessingAction(true);
        const toastId = toast.loading("Completando paso...");
        try {
            // CORRECCIÓN: Se agrega idEmployeeAssigned al payload
            const res = await productionOrderService.updateProductionOrderStep(
                orderId, 
                currentStep.idProductionOrderDetail, 
                { 
                    status: 'COMPLETED', 
                    observations: currentStep.observations,
                    idEmployeeAssigned: currentStep.idEmployeeAssigned // <--- ESTO FALTABA
                }
            );
            updateOrderState(orderId, transformFetchedOrderToContextFormat(res));
            toast.success("¡Paso completado!", { id: toastId });
            if (res.status === 'ALL_STEPS_COMPLETED') {
                setShowFinalizationFields(true);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al completar el paso.", { id: toastId });
        } finally { setIsProcessingAction(false); }
    }, [currentOrderData, isProcessingAction, updateOrderState, transformFetchedOrderToContextFormat]);

    const handlePrepareFinalization = useCallback(() => { setShowFinalizationFields(true); }, []);
    
    const handleFinalizeAndSaveOrder = useCallback(async () => {
        if (!currentOrderData || isProcessingAction) return;
        const { formOrder } = currentOrderData;
        const newErrors = {};
        if (!formOrder.finalQuantityProduct || parseFloat(formOrder.finalQuantityProduct) <= 0) {
            newErrors.finalQuantityProduct = 'La cantidad producida es requerida y debe ser un número positivo.';
        }
        if (Object.keys(newErrors).length > 0) {
            updateOrderState(currentViewedOrderId, { formErrors: newErrors });
            toast.error("Por favor, corrija los errores marcados.");
            return;
        }
        setIsProcessingAction(true);
        const toastId = toast.loading("Finalizando orden...");
        const payload = {
            finalQuantityProduct: parseFloat(formOrder.finalQuantityProduct),
            finishedProductWeight: formOrder.finishedProductWeight ? parseFloat(formOrder.finishedProductWeight) : null,
            finishedProductWeightUnit: formOrder.finishedProductWeight ? formOrder.finishedProductWeightUnit : null,
            observations: formOrder.observations || null,
        };
        try {
            await productionOrderService.finalizeProductionOrder(currentOrderData.id, payload);
            toast.success("¡Orden finalizada con éxito!", { id: toastId });
            removeOrder(currentOrderData.id);
            addOrFocusOrder(null, false, { navigateIfNeeded: true });
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Error al finalizar la orden.";
            toast.error(errorMsg, { id: toastId });
            if (err.response?.data?.errors) {
                const backendErrors = err.response.data.errors.reduce((acc, e) => ({ ...acc, [e.path]: e.msg }), {});
                updateOrderState(currentViewedOrderId, { formErrors: backendErrors });
            }
        } finally {
            setIsProcessingAction(false);
        }
    }, [currentOrderData, isProcessingAction, updateOrderState, removeOrder, addOrFocusOrder, currentViewedOrderId]);
    
    const handleCancelFinalization = useCallback(() => { setShowFinalizationFields(false); }, []);    
    
    const openCancelModal = useCallback(() => { 
        if (!currentOrderData) return; 
        setOrderToCancelInfo({ id: currentOrderData.id, displayName: currentOrderData.orderNumberDisplay || "Borrador" }); 
        setIsCancelModalOpen(true); 
    }, [currentOrderData]);

    const handleConfirmCancelOrder = useCallback(async (reason) => {
        if (!orderToCancelInfo?.id) return;
        setIsProcessingAction(true);
        const toastId = toast.loading("Cancelando orden...");
        try {
            await productionOrderService.changeProductionOrderStatus(orderToCancelInfo.id, 'CANCELLED', reason);
            toast.success(`Orden ${orderToCancelInfo.displayName} cancelada.`, { id: toastId });
            removeOrder(orderToCancelInfo.id);
            addOrFocusOrder(null, false, { navigateIfNeeded: true });
            setIsCancelModalOpen(false);
            setOrderToCancelInfo(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al cancelar la orden.", { id: toastId });
        } finally { 
            setIsProcessingAction(false); 
        }
    }, [orderToCancelInfo, removeOrder, addOrFocusOrder]);

    // --- 3. EFECTOS SECUNDARIOS (useEffect) ---
    useEffect(() => { 
        if (masterDataLoadedPageProps) {
            setProductos(productosMaestrosProps || []);
            setEmpleadosList(empleadosMaestrosProps || []);
            setProvidersList((proveedoresMaestrosProps || []).map(p => ({ ...p, providerName: p.providerName || p.company || `ID: ${p.idProvider}` })));
            setMasterDataFullyLoaded(true); 
        }
    }, [masterDataLoadedPageProps, productosMaestrosProps, empleadosMaestrosProps, proveedoresMaestrosProps]);
    
    useEffect(() => {
        const productId = formOrderData?.idProduct;
        if (productId && productId !== prevProductIdRef.current) {
            loadSpecSheetsForProduct(productId);
        }
        prevProductIdRef.current = productId;
    }, [formOrderData?.idProduct, loadSpecSheetsForProduct]);
    
    useEffect(() => {
        const { idSpecSheet, targetProductionWeight, targetProductionWeightUnit } = formOrderData || {};
        if (!idSpecSheet || !targetProductionWeight || parseFloat(targetProductionWeight) <= 0 || !targetProductionWeightUnit) {
            setStockCheck({ isLoading: false, isSufficient: true, message: null, details: [] });
            return;
        }
        const handler = setTimeout(() => {
            const performCheck = async () => {
                setStockCheck(prev => ({ ...prev, isLoading: true }));
                const result = await productionOrderService.checkStockAvailability({
                    idSpecSheet: parseInt(idSpecSheet, 10),
                    targetProductionWeight: parseFloat(targetProductionWeight),
                    targetProductionWeightUnit
                });
                setStockCheck({
                    isLoading: false,
                    isSufficient: result.sufficient,
                    message: result.message,
                    details: result.details || []
                });
            };
            performCheck();
        }, 500);
        return () => clearTimeout(handler);
    }, [formOrderData?.idSpecSheet, formOrderData?.targetProductionWeight, formOrderData?.targetProductionWeightUnit]);

    useEffect(() => {
        if (!currentOrderData || !updateOrderState) return;
        const { targetProductionWeight, targetProductionWeightUnit, initialAmount } = formOrderData || {};
        const { selectedSpecSheetData } = currentOrderData; 

        if (targetProductionWeight && selectedSpecSheetData) {
            const targetWeight = parseFloat(targetProductionWeight);
            // Cantidad que rinde la receta base (ej: 1000g o 1kg)
            const recipeYield = parseFloat(selectedSpecSheetData.quantityBase) || 0;
            const recipePortions = parseInt(selectedSpecSheetData.portions, 10) || 1;
            
            // Convertimos el peso de la ficha técnica a GRAMOS si es necesario
            // (Asumimos que la ficha técnica guarda su base en gramos)
            const recipeYieldInGrams = recipeYield; 

            if (targetWeight > 0 && recipeYieldInGrams > 0) {
                const targetWeightInGrams = convertToBaseUnit(targetWeight, targetProductionWeightUnit);
                
                // Calculamos cuánto pesa una sola porción según la receta original
                const gramsPerPortion = recipeYieldInGrams / recipePortions;
                
                if (gramsPerPortion > 0) {
                    // Cuántas porciones de ese peso caben en lo que el usuario quiere producir
                    const calculatedPortions = Math.floor(targetWeightInGrams / gramsPerPortion);
                    
                    if (String(calculatedPortions) !== (initialAmount || '')) {
                        updateOrderState(currentViewedOrderId, { 
                            formOrder: { ...formOrderData, initialAmount: String(calculatedPortions) } 
                        });
                    }
                }
            }
        }
    }, [formOrderData?.targetProductionWeight, formOrderData?.targetProductionWeightUnit, currentOrderData?.selectedSpecSheetData]);

    useEffect(() => {
        if (currentOrderData && !showFinalizationFields && currentOrderData.localOrderStatus === 'ALL_STEPS_COMPLETED') {
            setShowFinalizationFields(true);
        }
    }, [currentOrderData, showFinalizationFields, handlePrepareFinalization]);

    // --- 4. LÓGICA DE RENDERIZADO Y RETORNO ---
    if (!activeOrders || !masterDataFullyLoaded || !user) { return <SpinnerL>Preparando formulario...</SpinnerL>; }
    if (!currentViewedOrderId && !isLoadingOrderContext) { return <InfoS>Seleccione o cree una orden para comenzar.</InfoS>; }
    if (isLoadingOrderContext && !currentOrderData) { return <SpinnerL>Cargando orden...</SpinnerL>; }
    if (!currentOrderData) { return <Alert color="warning" className="m-3">No se pudieron cargar los datos de la orden.</Alert>; }
    
    const { localOrderStatus, isNewForForm } = currentOrderData;
    const isEffectivelyReadOnly = ['COMPLETED', 'CANCELLED'].includes(localOrderStatus);
    const isBaseDataLocked = !isNewForForm;
    const ordenTitulo = isNewForForm ? "Nuevo Borrador de Orden" : `Orden: ${currentOrderData.orderNumberDisplay}`;

    const renderActionButtons = () => {
        if (isEffectivelyReadOnly || showFinalizationFields) return null;
        const isBusy = isSaving || isProcessingAction;
        if (localOrderStatus === 'SETUP_COMPLETED') {
            return (<Button color="success" onClick={handleStartProduction} disabled={isBusy} size="sm"><PlayCircle size={16} className="me-1"/> Iniciar Producción</Button>);
        }
        if (localOrderStatus === 'ALL_STEPS_COMPLETED') { 
            return (<Button color="warning" onClick={handlePrepareFinalization} disabled={isBusy} size="sm"><ChefHat size={16} className="me-1"/> Ingresar Datos Finales</Button> ); 
        }
        return null;
    };
    
    return (
        <Container fluid className="p-3">
            <Toaster position="top-center" />
            <Form onSubmit={(e)=>e.preventDefault()}>
                <Card className="mb-3 shadow-sm">
                    <CardHeader className="py-2 px-3 bg-light">{ordenTitulo}</CardHeader>
                    <CardBody>
                        <Row>
                           <Col md={4}><FormGroup><Label for="idProduct">Producto</Label><Input id="idProduct" name="idProduct" type="select" value={formOrderData.idProduct || ''} onChange={handleChangeOrderForm} disabled={isBaseDataLocked}><option value="">Seleccione...</option>{productos.map(p => <option key={p.idProduct} value={p.idProduct}>{p.productName}</option>)}</Input></FormGroup></Col>
                           <Col md={4}><FormGroup><Label for="idSpecSheet">Ficha Técnica</Label><Input id="idSpecSheet" name="idSpecSheet" type="select" value={formOrderData.idSpecSheet || ''} onChange={handleChangeOrderForm} disabled={isBaseDataLocked || isLoadingFichas}><option value="">{isLoadingFichas ? "Cargando..." : "Seleccione..."}</option>{availableSpecSheets.map(s => <option key={s.idSpecSheet} value={s.idSpecSheet}>{s.versionName || `ID ${s.idSpecSheet}`}</option>)}</Input></FormGroup></Col>
                           <Col md={4}>
                                <FormGroup>
                                    <Label for="idProvider">Proveedor Principal</Label>
                                    <Input 
                                        id="idProvider" 
                                        type="select" 
                                        value={formOrderData.idProvider || ''} 
                                        disabled 
                                        style={{ backgroundColor: '#e9ecef', color: '#495057' }}
                                    >
                                        <option value="">Sin proveedor asignado</option>
                                        {providersList.map(p => (
                                            <option key={p.idProvider} value={p.idProvider}>
                                                {p.providerName}
                                            </option>
                                        ))}
                                    </Input>
                                    {formOrderData.idProvider && (
                                        <small className="text-muted">Detectado automáticamente del producto</small>
                                    )}
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}><FormGroup><Label for="targetProductionWeight">Peso a Producir</Label><InputGroup><Input id="targetProductionWeight" name="targetProductionWeight" type="number" value={formOrderData.targetProductionWeight || ''} onChange={handleChangeOrderForm} disabled={isBaseDataLocked || !formOrderData.idSpecSheet} placeholder={!formOrderData.idSpecSheet ? 'Seleccione ficha' : 'Ingrese peso'} /><Input name="targetProductionWeightUnit" type="select" value={formOrderData.targetProductionWeightUnit || 'kg'} onChange={handleChangeOrderForm} disabled={isBaseDataLocked || !formOrderData.idSpecSheet}><option>kg</option><option>g</option></Input></InputGroup></FormGroup></Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Porciones (Estimado)</Label>
                                    <Input 
                                        type="text" 
                                        value={formOrderData.initialAmount || ''} 
                                        readOnly 
                                        disabled 
                                        style={{ backgroundColor: '#e9ecef' }} 
                                        placeholder={formOrderData.targetProductionWeight ? "Calculando..." : "Se calcula automáticamente"} 
                                    />
                                </FormGroup>
                            </Col>                            
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="idEmployeeRegistered">Registrada por</Label>
                                    <Input id="idEmployeeRegistered" name="idEmployeeRegistered" type="select" value={formOrderData.idEmployeeRegistered || ''} onChange={handleChangeOrderForm} disabled={isBaseDataLocked}>
                                        <option value="">Seleccione un empleado...</option>
                                        {empleadosList.map(e => (<option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>))}
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                        {isNewForForm && (
                          <Row>
                              <Col>
                                  {stockCheck.isLoading && (
                                      <div className="d-flex align-items-center text-muted small mt-2">
                                          <Spinner size="sm" className="me-2" /> Verificando stock disponible...
                                      </div>
                                  )}
                                  {!stockCheck.isLoading && !stockCheck.isSufficient && (
                                      <Alert color="danger" className="mt-2 small">
                                          <h6 className="alert-heading"><XCircle size={18} className="me-1" /> ¡Stock Insuficiente!</h6>
                                          <p className="mb-1">{stockCheck.message}</p>
                                          {stockCheck.details && stockCheck.details.length > 0 && (
                                            <ul className="mb-0 ps-4">
                                                {stockCheck.details.filter(d => !d.sufficient).map((item, idx) => (
                                                    <li key={item.idSupply || idx}>
                                                        <strong>{item.supplyName || item.name || 'Insumo'}:</strong> 
                                                        {/* Buscamos todos los posibles nombres que el backend pueda enviar */}
                                                        Necesitas <span className="fw-bold text-danger">
                                                            {item.needed ?? item.quantityNeeded ?? item.required ?? 'Calculando...'}
                                                        </span>
                                                        , pero solo hay <span className="fw-bold">
                                                            {item.available ?? item.quantityAvailable ?? item.stock ?? '0'}
                                                        </span>.
                                                    </li>
                                                ))}
                                            </ul>
                                            )}
                                      </Alert>
                                  )}
                              </Col>
                          </Row>
                        )}
                    </CardBody>
                    {isNewForForm && (
                        <CardFooter className="text-end">
                            <Button
                                color="success"
                                onClick={handleCreateAndPrepareOrder}
                                disabled={isSaving || stockCheck.isLoading || !stockCheck.isSufficient}
                            >
                                <Save size={16} className="me-1"/> 
                                {stockCheck.isLoading ? 'Verificando...' : 'Crear y Preparar Orden'}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
                
                {showFinalizationFields ? 
                    <OrderFinalizationSection 
                        formOrder={currentOrderData.formOrder}
                        formErrors={currentOrderData.formErrors || {}}
                        handleChangeOrderForm={handleChangeOrderForm}
                        isSaving={isProcessingAction}
                        onCancelFinalization={openCancelModal}
                        onConfirmFinalize={handleFinalizeAndSaveOrder}
                        onHideSection={handleCancelFinalization}
                    /> 
                    : <ProcessManagementSection 
                        currentOrderData={currentOrderData}
                        empleadosList={empleadosList}
                        isLoadingEmpleados={!masterDataFullyLoaded}
                        handleEmployeeSelectionForStep={handleEmployeeSelectionForStep}
                        handleStepFieldChange={handleStepFieldChange}
                        handleStartCurrentStep={handleStartCurrentStep}
                        handleCompleteCurrentStep={handleCompleteCurrentStep}
                        isSaving={isSaving || isProcessingAction}
                        isOrderViewOnly={isEffectivelyReadOnly}
                        isProcessingAction={isProcessingAction}
                        isLoadingFichas={isLoadingFichas}
                        processViewMode="sidebarWithFocus"
                        getStatusInfo={getStatusInfoInSpanish}
                        icons={icons}
                    />
                }
                
                <div className="mt-3 p-3 border-top text-end d-flex justify-content-between align-items-center">
                    <div>
                        { (user.idRole === 1 || user.idRole === 2) && !isNewForForm && !isEffectivelyReadOnly && (
                            <Button color="danger" outline onClick={openCancelModal} disabled={isSaving || isProcessingAction}>
                                <XCircle size={16} className="me-1"/> Cancelar Orden
                            </Button>
                        )}
                    </div>
                    <div>{renderActionButtons()}</div>
                </div>
            </Form>
            
            <Modal isOpen={startProductionModalOpen} toggle={() => !isProcessingAction && setStartProductionModalOpen(false)} centered>
                <ModalHeader toggle={() => !isProcessingAction && setStartProductionModalOpen(false)}>Asignar Empleado para Iniciar</ModalHeader>
                <ModalBody>
                    <p>Seleccione el empleado a cargo del primer paso. Esta acción iniciará la producción y descontará los insumos del inventario.</p>
                    <Input type="select" value={selectedEmployeeForStart} onChange={(e) => setSelectedEmployeeForStart(e.target.value)} disabled={isProcessingAction}>
                        <option value="">-- Seleccione --</option>
                        {empleadosList.map(e => <option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>)}
                    </Input>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setStartProductionModalOpen(false)} disabled={isProcessingAction}>Cancelar</Button>
                    <Button color="success" onClick={handleConfirmStartProduction} disabled={!selectedEmployeeForStart || isProcessingAction}>
                        {isProcessingAction ? <><Spinner size="sm"/> Iniciando...</> : "Confirmar e Iniciar"}
                    </Button>
                </ModalFooter>
            </Modal>
            
            <CancelOrderModal
                isOpen={isCancelModalOpen}
                toggle={() => !isProcessingAction && setIsCancelModalOpen(false)}
                onConfirmCancel={handleConfirmCancelOrder}
                orderDisplayName={orderToCancelInfo?.displayName}
                isCancelling={isProcessingAction}
            />
        </Container>
    );
};

export default OrdenProduccionForm;