import React, { useState, useEffect, useRef, useContext, useCallback, useMemo as useReactMemo } from 'react';
import {
    Row, Col, Spinner, Button, Form, Container, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter, ListGroup, ListGroupItem, CardFooter,
    Collapse, Card, CardHeader, CardBody, CardTitle
} from 'reactstrap';
import toast, { Toaster } from 'react-hot-toast';
import {
    Save, XCircle, AlertTriangle, Eye, PlayCircle, CheckCircle, ChefHat, FileText, Info,
    Package, PauseCircle, RotateCcw, ChevronDown, ChevronRight, ArrowRightCircle, Clock, Loader
} from 'lucide-react';

// Servicios
import specSheetService from '../../services/specSheetService';
import productionOrderService from '../../services/productionOrderService';

// Estilos
import '../../../assets/css/produccion/ProduccionStyles.css';

// Contexto
import { ActiveOrdersContext } from './ActiveOrdersContext';
import { useAuth } from '../../hooks/AuthProvider';

// Componentes Hijos
import OrderBaseFormSection from './components/OrderBaseFormSection';
import EstimatedSuppliesSection from './components/EstimatedSuppliesSection';
import ProcessManagementSection from './components/ProcessManagementSection';
import OrderFinalizationSection from './components/OrderFinalizationSection';
import CancelOrderModal from './components/CancelOrderModal';

// --- Función para traducir estados a Español ---
export const getStatusInfoInSpanish = (status) => {
    switch (status?.toUpperCase()) {
        case 'PENDING': return { text: 'Pendiente', color: 'secondary', icon: <Clock size={12} /> };
        case 'IN_PROGRESS': return { text: 'En Proceso', color: 'warning', icon: <Loader size={12} className="lucide-spin" /> };
        case 'PAUSED': return { text: 'En Pausa', color: 'info', icon: <PauseCircle size={12} /> };
        case 'COMPLETED': return { text: 'Completado', color: 'success', icon: <CheckCircle size={12} /> };
        case 'SKIPPED': return { text: 'Omitido', color: 'info', icon: <ArrowRightCircle size={12} /> };
        default: return { text: status || 'Desconocido', color: 'light', icon: null };
    }
};

// --- Componentes Auxiliares ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText, confirmColor, isConfirming = false }) => ( <Modal isOpen={isOpen} toggle={() => !isConfirming && toggle(false)} centered backdrop="static" keyboard={!isConfirming}><ModalHeader toggle={() => !isConfirming && toggle(false)} className="py-2 px-3"><div className="d-flex align-items-center"><AlertTriangle size={20} className={`text-${confirmColor || 'primary'} me-2`} /><span className="fw-bold small">{title}</span></div></ModalHeader><ModalBody className="py-3 px-3 small">{children}</ModalBody><ModalFooter className="py-2 px-3"><Button size="sm" color="secondary" outline onClick={() => toggle(false)} disabled={isConfirming}>Cancelar</Button><Button size="sm" color={confirmColor || 'primary'} onClick={onConfirm} disabled={isConfirming}>{isConfirming ? <Spinner size="sm"/> : (confirmText || 'Confirmar')}</Button></ModalFooter></Modal> );
const ViewSpecSheetModal = ({ isOpen, toggle, specSheetData, isLoading }) => { if (!isOpen) return null; const sheetId = specSheetData?.idSpecSheet || specSheetData?.id || 'N/A'; const supplies = specSheetData?.specSheetSupplies || []; const processes = specSheetData?.specSheetProcesses || []; return ( <Modal isOpen={isOpen} toggle={toggle} size="xl" centered scrollable><ModalHeader toggle={toggle}><div className="d-flex align-items-center"><FileText size={24} className="me-2 text-info" /><span className="fw-bold">Detalles de Ficha Técnica (ID: {sheetId})</span></div></ModalHeader><ModalBody>{isLoading && <div className="text-center p-5"><Spinner color="primary" /><p className="mt-2 text-muted">Cargando detalles...</p></div>}{!isLoading && !specSheetData && <Alert color="warning" className="text-center">No se han podido cargar los detalles de la ficha.</Alert>}{!isLoading && specSheetData && ( <Row><Col md={5}><Card className="mb-3 shadow-sm"><CardBody><CardTitle tag="h5" className="text-primary border-bottom pb-2 mb-3">Información General</CardTitle><ListGroup flush><ListGroupItem><strong>Producto:</strong> {specSheetData.product?.productName || specSheetData.productNameSnapshot || 'N/A'}</ListGroupItem><ListGroupItem><strong>Versión:</strong> {specSheetData.versionName || '(Sin versión)'}</ListGroupItem><ListGroupItem><strong>Fecha Efectiva:</strong> {specSheetData.dateEffective ? new Date(specSheetData.dateEffective).toLocaleDateString() : 'N/A'}</ListGroupItem><ListGroupItem><strong>Cant. Base:</strong> {specSheetData.quantityBase || 1} {specSheetData.unitOfMeasureBase || specSheetData.unitOfMeasure || 'unidad(es)'}</ListGroupItem><ListGroupItem><strong>Estado:</strong> <span className={`badge bg-${specSheetData.status ? 'success' : 'secondary'}`}>{specSheetData.status ? "Activa" : "Inactiva"}</span></ListGroupItem>{specSheetData.description && <ListGroupItem><strong>Descripción:</strong> {specSheetData.description}</ListGroupItem>}</ListGroup></CardBody></Card></Col><Col md={7}><Card className="mb-3 shadow-sm"><CardBody><CardTitle tag="h5" className="text-success border-bottom pb-2 mb-3">Insumos</CardTitle>{supplies.length > 0 ? ( <ListGroup flush>{supplies.map((ing, idx) => (<ListGroupItem key={idx}><strong>{ing.supply?.supplyName || ing.supplyNameSnapshot || 'Insumo Desconocido'}:</strong> {ing.quantity} {ing.unitOfMeasure}</ListGroupItem>))}</ListGroup> ) : <p className="text-muted fst-italic">No hay insumos definidos.</p>}</CardBody></Card><Card className="shadow-sm mt-3"><CardBody><CardTitle tag="h5" className="text-info border-bottom pb-2 mb-3">Pasos de Elaboración</CardTitle>{processes.length > 0 ? ( <ListGroup flush>{processes.sort((a, b) => (a.processOrder || 0) - (b.processOrder || 0)).map((proc, idx) => (<ListGroupItem key={idx}><strong>Paso {proc.processOrder}: {proc.processNameOverride || proc.process?.processName || proc.masterProcessData?.processName || 'Proceso Desconocido'}</strong><div className="text-muted small ps-2">{proc.processDescriptionOverride || proc.process?.description || proc.masterProcessData?.description || 'Sin descripción.'}</div>{proc.estimatedTimeMinutes && <div className="text-muted small ps-2 fst-italic">Tiempo Estimado: {proc.estimatedTimeMinutes} min.</div>}</ListGroupItem>))}</ListGroup> ) : <p className="text-muted fst-italic">No hay procesos definidos.</p>}</CardBody></Card></Col></Row> )}</ModalBody><ModalFooter><Button color="secondary" outline onClick={toggle}>Cerrar</Button></ModalFooter></Modal> );};
const SpinnerL = ({ children }) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{ minHeight: '200px' }}><Spinner style={{ width: '3rem', height: '3rem' }} color="primary" className="mb-2" /><p className="text-muted mb-0">{children}</p></div>);
const InfoS = ({ children }) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{ minHeight: '200px' }}><Info size={30} className="text-info mb-2" /><p className="text-muted mb-0">{children}</p></div>);
const validateAndPreparePayload = (formOrder, productos, validationType = 'DRAFT') => { const errors = {}; let isValid = true; if (!formOrder.idProduct) { isValid = false; errors.idProduct = 'Debe seleccionar un producto.'; } if (!formOrder.idEmployeeRegistered) { isValid = false; errors.idEmployeeRegistered = 'Debe seleccionar quién registra la orden.'; } if (!formOrder.initialAmount || formOrder.initialAmount.toString().trim() === '') { isValid = false; errors.initialAmount = 'La cantidad a producir es requerida.'; } else if (isNaN(parseFloat(formOrder.initialAmount)) || parseFloat(formOrder.initialAmount) <= 0) { isValid = false; errors.initialAmount = 'La cantidad debe ser un número mayor a cero.'; } if (!formOrder.idProvider) { isValid = false; errors.idProvider = 'Debe seleccionar un proveedor.'; } if (validationType === 'PRODUCTION') { const productoSeleccionado = productos.find(p => String(p.idProduct) === String(formOrder.idProduct)); if (productoSeleccionado && productoSeleccionado.specSheetCount > 0 && !formOrder.idSpecSheet) { isValid = false; errors.idSpecSheet = 'Este producto requiere una ficha técnica para iniciar producción.'; } } if (!isValid) { return { isValid: false, payload: null, errors }; } const payload = { idProduct: formOrder.idProduct || null, idSpecSheet: formOrder.idSpecSheet || null, initialAmount: parseFloat(formOrder.initialAmount), idEmployeeRegistered: formOrder.idEmployeeRegistered || null, idProvider: formOrder.idProvider || null, observations: formOrder.observations || null, status: 'SETUP', productNameSnapshot: formOrder.productNameSnapshot, inputInitialWeight: formOrder.inputInitialWeight || null, inputInitialWeightUnit: (formOrder.inputInitialWeight && parseFloat(formOrder.inputInitialWeight) > 0) ? (formOrder.inputInitialWeightUnit || 'kg') : null, }; Object.keys(payload).forEach(key => { if (payload[key] === '') payload[key] = null; }); return { isValid: true, payload, errors }; };


const OrdenProduccionForm = ({
    productosMaestrosProps,
    empleadosMaestrosProps,
    proveedoresMaestrosProps,
    masterDataLoadedPageProps,
}) => {
    const { user } = useAuth();
    const currentUserRole = user?.idRole;

    const [productos, setProductos] = useState([]);
    const [empleadosList, setEmpleadosList] = useState([]);
    const [providersList, setProvidersList] = useState([]);
    const [masterDataFullyLoaded, setMasterDataFullyLoaded] = useState(false);
    const [availableSpecSheets, setAvailableSpecSheets] = useState([]);
    const [isLoadingFichas, setIsLoadingFichas] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [viewSpecSheetModalOpen, setViewSpecSheetModalOpen] = useState(false);
    const [showFinalizationFields, setShowFinalizationFields] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderToCancelInfo, setOrderToCancelInfo] = useState(null);
    const [isSuppliesOpen, setIsSuppliesOpen] = useState(false);
    const prevProductIdRef = useRef();
    const [activeOrderWarning, setActiveOrderWarning] = useState(null);
    const [isVerifyingProduct, setIsVerifyingProduct] = useState(false);

    const ordersContext = useContext(ActiveOrdersContext);

    const canPauseOrResume = useReactMemo(() => {
        return [1, 2].includes(Number(currentUserRole));
    }, [currentUserRole]);

    if (!ordersContext) {
        return <Container fluid className="p-4 text-center"><Alert color="danger">Error Crítico: Contexto de órdenes no disponible.</Alert></Container>;
    }

    const {
        activeOrders,
        currentViewedOrderId,
        isLoadingOrderContext,
        addOrFocusOrder,
        updateOrderState,
        transformFetchedOrderToContextFormat,
        removeOrder
    } = ordersContext;

    const currentOrderData = useReactMemo(() => {
        if (!currentViewedOrderId || !activeOrders[currentViewedOrderId]) { return null; }
        return activeOrders[currentViewedOrderId];
    }, [activeOrders, currentViewedOrderId]);

    useEffect(() => { 
        if (masterDataLoadedPageProps) {
            setProductos(productosMaestrosProps || []);
            setEmpleadosList(empleadosMaestrosProps || []);
            const proveedoresMapeados = (proveedoresMaestrosProps || []).map(p => ({ ...p, providerName: p.providerName || p.company || `ID: ${p.idProvider}` }));
            setProvidersList(proveedoresMapeados);
            setMasterDataFullyLoaded(true); 
        }
    }, [masterDataLoadedPageProps, productosMaestrosProps, empleadosMaestrosProps, proveedoresMaestrosProps]);
    
    const updateSpecSheetAndProcesses = useCallback(async (productIdParam, specSheetIdFromFormParams) => {
        if (!currentViewedOrderId || !activeOrders[currentViewedOrderId]) return;
        const orderForUpdate = activeOrders[currentViewedOrderId];
        setIsLoadingFichas(true);
        try {
            const allSheetsForProduct = await specSheetService.getSpecSheetsByProductId(productIdParam);
            setAvailableSpecSheets(allSheetsForProduct || []);
            let specSheetToUse = null;
            let errorMsg = null;
            if (allSheetsForProduct && allSheetsForProduct.length > 0) {
                if (specSheetIdFromFormParams) { specSheetToUse = allSheetsForProduct.find(s => String(s.idSpecSheet) === String(specSheetIdFromFormParams)); }
                if (!specSheetToUse) { specSheetToUse = allSheetsForProduct.find(s => s.status === true) || allSheetsForProduct[0]; }
            } else { errorMsg = "Este producto no tiene fichas técnicas asociadas."; }
            const newSteps = specSheetToUse?.specSheetProcesses?.sort((a, b) => a.processOrder - b.processOrder).map(p => ({ idProductionOrderDetail: null, idProcess: String(p.idProcess || p.masterProcessData?.idProcess || ''), processOrder: p.processOrder, processName: p.processNameOverride || p.masterProcessData?.processName || 'Proceso Desconocido', processDescription: p.processDescriptionOverride || p.masterProcessData?.description || 'Sin descripción', estimatedTimeMinutes: p.estimatedTimeMinutes ?? p.masterProcessData?.estimatedTimeMinutes, status: 'PENDING', isNewStep: true })) || [];
            updateOrderState(currentViewedOrderId, { formOrder: { ...orderForUpdate.formOrder, idProduct: productIdParam, idSpecSheet: specSheetToUse?.idSpecSheet.toString() || '' }, selectedSpecSheetData: specSheetToUse, processSteps: newSteps, activeStepIndex: newSteps.length > 0 ? 0 : null, formErrors: { ...orderForUpdate.formErrors, idSpecSheet: errorMsg } });
            if (errorMsg) toast.error(errorMsg);
        } catch (err) {
            toast.error("Error al cargar las fichas del producto.");
        } finally {
            setIsLoadingFichas(false);
        }
    }, [currentViewedOrderId, activeOrders, updateOrderState]);

    const handleChangeOrderForm = useCallback((e) => {
        if (!currentViewedOrderId || !currentOrderData) return;
        const { name, value } = e.target;
        let newForm = { ...currentOrderData.formOrder, [name]: value };
        if (name === 'idProduct') {
            setActiveOrderWarning(null);
            const p = productos.find(pr => String(pr.idProduct) === String(value));
            newForm.productNameSnapshot = p ? p.productName : '';
            newForm.idSpecSheet = '';
            updateOrderState(currentViewedOrderId, { formOrder: newForm, selectedSpecSheetData: null, processSteps: [], formErrors: { ...currentOrderData.formErrors, idProduct: null, idSpecSheet: null } });
        } else if (name === 'idSpecSheet') {
            updateSpecSheetAndProcesses(currentOrderData.formOrder.idProduct, value);
        } else {
            updateOrderState(currentViewedOrderId, { formOrder: newForm });
        }
    }, [currentViewedOrderId, currentOrderData, productos, updateOrderState, updateSpecSheetAndProcesses]);
    
    const handleSaveNewDraft = useCallback(async () => {
        if (!currentOrderData || !currentOrderData.isNewForForm || isSaving) return;
        const validationResult = validateAndPreparePayload(currentOrderData.formOrder, productos, 'DRAFT');
        updateOrderState(currentViewedOrderId, { formErrors: validationResult.errors });
        if (!validationResult.isValid) { toast.error(Object.values(validationResult.errors).find(msg => msg) || "Corrija los errores."); return; }
        setIsSaving(true);
        const toastIdOuter = toast.loading("Guardando borrador...");
        try {
            const resOrderHeader = await productionOrderService.createProductionOrder(validationResult.payload);
            const transformedOrderHeader = transformFetchedOrderToContextFormat(resOrderHeader);
            if (!transformedOrderHeader) { throw new Error("Respuesta inválida del servidor."); }
            updateOrderState(currentViewedOrderId, transformedOrderHeader, transformedOrderHeader.id);
            toast.success("Borrador guardado.", { id: toastIdOuter });
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Error al guardar.";
            toast.error(errorMsg, { id: toastIdOuter });
            if (err.response?.data?.errors) { updateOrderState(currentViewedOrderId, { formErrors: err.response.data.errors.reduce((acc, e) => { acc[e.path] = e.msg; return acc; }, {}) }); }
        } finally {
            setIsSaving(false);
        }
    }, [currentOrderData, isSaving, productos, updateOrderState, transformFetchedOrderToContextFormat]);
    
    const handleUpdateExistingOrder = useCallback(async (intendedFinalStatus = null, options = {}) => {
        if (!currentViewedOrderId || !currentOrderData || currentOrderData.isNewForForm) return false;
        const validationResult = validateAndPreparePayload(currentOrderData.formOrder, productos, 'PRODUCTION');
        updateOrderState(currentViewedOrderId, { formErrors: validationResult.errors });
        if (!validationResult.isValid && !options.skipValidation) { toast.error(Object.values(validationResult.errors).find(msg => msg) || "Corrija los errores."); return false; }
        setIsSaving(true);
        const toastId = toast.loading("Guardando cambios...");
        const updatePayload = { ...validationResult.payload, status: intendedFinalStatus || currentOrderData.localOrderStatus };
        try {
            const res = await productionOrderService.updateProductionOrder(currentOrderData.id, updatePayload);
            const transformed = transformFetchedOrderToContextFormat(res);
            if (transformed) {
                updateOrderState(currentViewedOrderId, transformed);
                toast.success("Orden actualizada.", { id: toastId });
                return transformed;
            } else { throw new Error("Respuesta inválida del servidor."); }
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al actualizar.", { id: toastId });
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [currentViewedOrderId, currentOrderData, productos, transformFetchedOrderToContextFormat, updateOrderState]);
    
    const handleTogglePauseOrder = useCallback(async () => {
        if (!currentViewedOrderId || !currentOrderData || isProcessingAction) return;
        const isCurrentlyPaused = currentOrderData.localOrderStatus === 'PAUSED';
        const newStatus = isCurrentlyPaused ? 'IN_PROGRESS' : 'PAUSED';
        const actionText = isCurrentlyPaused ? 'Reanudando' : 'Pausando';
        setIsProcessingAction(true);
        const toastId = toast.loading(`${actionText} la orden...`);
        try {
            const updatedOrder = await productionOrderService.changeProductionOrderStatus(currentOrderData.id, newStatus);
            const transformed = transformFetchedOrderToContextFormat(updatedOrder);
            if (transformed) {
                updateOrderState(currentViewedOrderId, transformed);
                toast.success(`Orden ${actionText.toLowerCase().slice(0, -1)}a.`, { id: toastId });
            } else { throw new Error("Respuesta inválida del servidor."); }
        } catch (err) {
            toast.error(err.response?.data?.message || `Error al ${actionText.toLowerCase()} la orden.`, { id: toastId });
        } finally {
            setIsProcessingAction(false);
        }
    }, [currentViewedOrderId, currentOrderData, isProcessingAction, transformFetchedOrderToContextFormat, updateOrderState]);

    const handleEmployeeSelectionForStep = useCallback((stepIndex, newEmployeeId) => { if (!currentViewedOrderId || !currentOrderData) return; const newSteps = currentOrderData.processSteps.map((s, i) => i === stepIndex ? { ...s, idEmployee: newEmployeeId || '' } : s); updateOrderState(currentViewedOrderId, { processSteps: newSteps }); }, [currentViewedOrderId, currentOrderData, updateOrderState]);
    const handleStartCurrentStep = useCallback(async () => { if (!currentViewedOrderId || !currentOrderData || isProcessingAction) return; const orderToStart = currentOrderData; const stepToStart = orderToStart.processSteps?.[orderToStart.activeStepIndex]; if (!stepToStart) { return toast.error("No hay un paso activo para iniciar."); } if (!stepToStart.idEmployee) { return toast.error(`Asigne un empleado al paso "${stepToStart.processName}".`); } if (!stepToStart.idProductionOrderDetail) { const updatedOrder = await handleUpdateExistingOrder('IN_PROGRESS', { showToast: false }); if (!updatedOrder) { toast.error("No se pudo preparar la orden."); } return; } setIsProcessingAction(true); const toastIdStartStep = toast.loading(`Iniciando paso "${stepToStart.processName}"...`); try { const payload = { startDate: new Date().toISOString(), status: 'IN_PROGRESS', idEmployeeAssigned: stepToStart.idEmployee }; const res = await productionOrderService.updateProductionOrderStep(orderToStart.id, stepToStart.idProductionOrderDetail, payload); const transformed = transformFetchedOrderToContextFormat(res); if (transformed) { updateOrderState(orderToStart.id, transformed); toast.success(`Paso "${stepToStart.processName}" iniciado.`, { id: toastIdStartStep }); } else { throw new Error("Respuesta inválida del servidor."); } } catch (err) { toast.error(err.response?.data?.message || `Error iniciando el paso.`, { id: toastIdStartStep }); } finally { setIsProcessingAction(false); } }, [currentViewedOrderId, currentOrderData, isProcessingAction, handleUpdateExistingOrder, updateOrderState, transformFetchedOrderToContextFormat]);
    const handleCompleteCurrentStep = useCallback(async () => { if (!currentViewedOrderId || !currentOrderData || isProcessingAction) return; const orderToComplete = currentOrderData; const step = orderToComplete.processSteps?.[orderToComplete.activeStepIndex]; if (!step || !step.idProductionOrderDetail) { return toast.error("No se puede completar un paso no guardado."); } if (step.status !== 'IN_PROGRESS') { return toast.error(`El paso no está en progreso.`); } setIsProcessingAction(true); const tId = toast.loading(`Completando "${step.processName}"...`); try { const res = await productionOrderService.updateProductionOrderStep(orderToComplete.id, step.idProductionOrderDetail, { endDate: new Date().toISOString(), status: 'COMPLETED', observations: step.observations || null }); const transformed = transformFetchedOrderToContextFormat(res); if (transformed) { updateOrderState(currentViewedOrderId, transformed); toast.success(`Paso completado.`, { id: tId, icon: "✔️" }); } else { throw new Error("Respuesta inválida del servidor."); } } catch (err) { toast.error(err.response?.data?.message || `Error completando el paso.`, { id: tId }); } finally { setIsProcessingAction(false); } }, [currentViewedOrderId, currentOrderData, isProcessingAction, updateOrderState, transformFetchedOrderToContextFormat]);
    const handlePrepareFinalization = useCallback(() => { if (!currentViewedOrderId || !currentOrderData) return; setShowFinalizationFields(true); toast("Ingrese los datos de finalización.", { icon: "✍️" }); }, [currentViewedOrderId, currentOrderData]);
    const handleFinalizeAndSaveOrder = useCallback(async () => { if (!currentViewedOrderId || !currentOrderData) return; setIsProcessingAction(true); const tId = toast.loading("Finalizando orden..."); try { const { formOrder } = currentOrderData; const payload = { finalQuantityProduct: parseFloat(formOrder.finalQuantityProduct), finishedProductWeight: formOrder.finishedProductWeight ? parseFloat(formOrder.finishedProductWeight) : null, finishedProductWeightUnit: (formOrder.finishedProductWeight && parseFloat(formOrder.finishedProductWeight) > 0) ? (formOrder.finishedProductWeightUnit || 'kg') : null, inputFinalWeightUnused: formOrder.inputFinalWeightUnused ? parseFloat(formOrder.inputFinalWeightUnused) : null, inputFinalWeightUnusedUnit: (formOrder.inputFinalWeightUnused && parseFloat(formOrder.inputFinalWeightUnused) > 0) ? (formOrder.inputFinalWeightUnusedUnit || 'kg') : null, observations: formOrder.observations || null, }; const finalizedOrder = await productionOrderService.finalizeProductionOrder(currentOrderData.id, payload); const trans = transformFetchedOrderToContextFormat(finalizedOrder); if (trans) { updateOrderState(currentViewedOrderId, trans); setShowFinalizationFields(false); toast.success(`¡Orden finalizada!`, { id: tId, icon: "🏆" }); } else { throw new Error("Respuesta inválida del servidor."); } } catch (err) { toast.error(err.response?.data?.message || "Error al finalizar.", { id: tId }); } finally { setIsProcessingAction(false); } }, [currentViewedOrderId, currentOrderData, isProcessingAction, transformFetchedOrderToContextFormat, updateOrderState]);
    const handleCancelFinalization = useCallback(() => { setShowFinalizationFields(false); toast.info("Finalización cancelada."); }, []);
    const handleStepFieldChange = useCallback((stepIndex, fieldName, value) => { if (!currentViewedOrderId || !currentOrderData) return; const newSteps = currentOrderData.processSteps.map((s, i) => i === stepIndex ? { ...s, [fieldName]: value } : s); updateOrderState(currentViewedOrderId, { processSteps: newSteps }); }, [currentViewedOrderId, currentOrderData, updateOrderState]);
    const toggleViewSpecSheetModal = useCallback(() => setViewSpecSheetModalOpen(p => !p), []);
    const toggleSuppliesCallback = useCallback(() => setIsSuppliesOpen(prev => !prev), []);
    const openCancelModal = useCallback(() => { if (!currentViewedOrderId || !currentOrderData) return; setOrderToCancelInfo({ id: currentOrderData.id, displayName: currentOrderData.orderNumberDisplay || "Nuevo Borrador" }); setIsCancelModalOpen(true); }, [currentViewedOrderId, currentOrderData]);
    const handleConfirmCancelOrder = useCallback(async (reason) => { if (!orderToCancelInfo?.id) return; setIsProcessingAction(true); const tId = toast.loading(`Cancelando orden...`); try { if (String(orderToCancelInfo.id).startsWith('NEW_')) { removeOrder(orderToCancelInfo.id); toast.success("Borrador descartado.", { id: tId }); } else { const updatedOrder = await productionOrderService.changeProductionOrderStatus(orderToCancelInfo.id, 'CANCELLED', reason); const trans = transformFetchedOrderToContextFormat(updatedOrder); if (trans) { updateOrderState(orderToCancelInfo.id, trans); toast.success(`Orden cancelada.`, { id: tId }); } else { throw new Error("Respuesta inválida."); } } setIsCancelModalOpen(false); } catch (error) { toast.error(error.response?.data?.message || "Error al cancelar.", { id: tId }); } finally { setIsProcessingAction(false); } }, [orderToCancelInfo, removeOrder, transformFetchedOrderToContextFormat, updateOrderState]);
    
    useEffect(() => { const order = currentOrderData; if (!order || !masterDataFullyLoaded || isSaving) return; const productId = order.formOrder?.idProduct; if (productId && productId !== prevProductIdRef.current) { const verifyProduct = async () => { setIsVerifyingProduct(true); setActiveOrderWarning(null); try { const verificationResult = await productionOrderService.checkActiveOrderForProduct(productId); if (verificationResult.hasActiveOrder) { const conflictingOrder = verificationResult.activeOrder; if (String(conflictingOrder.idProductionOrder) !== String(order.id)) { setActiveOrderWarning({ message: `Este producto ya tiene una orden activa (ID: ${conflictingOrder.idProductionOrder}, Estado: ${conflictingOrder.status}). No podrá guardar o iniciar esta orden.`, orderId: conflictingOrder.idProductionOrder }); } } await updateSpecSheetAndProcesses(productId, order.formOrder.idSpecSheet || null); } catch (error) { console.error("Error al verificar el producto:", error); toast.error("No se pudo verificar el estado del producto."); } finally { setIsVerifyingProduct(false); } }; verifyProduct(); } else if (!productId) { setActiveOrderWarning(null); } prevProductIdRef.current = productId; }, [currentOrderData, masterDataFullyLoaded, isSaving, updateSpecSheetAndProcesses]);

    if (!masterDataFullyLoaded || !user) return <SpinnerL>Preparando formulario...</SpinnerL>;
    if (!currentViewedOrderId && !isLoadingOrderContext) return <InfoS>Seleccione o cree una orden.</InfoS>;
    if (isLoadingOrderContext && (!currentOrderData || String(currentOrderData?.id).startsWith('NEW_'))) return <SpinnerL>{currentViewedOrderId && !String(currentViewedOrderId).startsWith('NEW_') ? `Cargando orden ${currentViewedOrderId}...` : "Cargando..."}</SpinnerL>;
    if (!currentOrderData) return <Alert color="warning" className="m-3">No se pudieron cargar los datos de la orden (ID: {currentViewedOrderId || 'N/A'}).</Alert>;
    
    const { localOrderStatus, selectedSpecSheetData, isNewForForm, formOrder, id: orderId } = currentOrderData;
    const isOrderSystemReadOnly = ['COMPLETED', 'CANCELLED'].includes(localOrderStatus);
    const isPausedForCurrentUser = localOrderStatus === 'PAUSED' && !canPauseOrResume;
    const isEffectivelyReadOnly = isOrderSystemReadOnly || isPausedForCurrentUser;
    const showLowerSectionsFromData = !(isNewForForm && localOrderStatus === 'PENDING');
    
    const ordenTitulo = (isNewForForm && localOrderStatus === 'PENDING') ? "Nuevo Borrador de Orden" : `Orden: ${currentOrderData.orderNumberDisplay || `ID ${orderId}`} (${currentOrderData.localOrderStatusDisplay || localOrderStatus})`;

    // En OrdenProduccionForm.jsx

const renderActionButtons = () => {
    // Si la orden está completada, cancelada o en proceso de finalización, no mostrar nada.
    if (isOrderSystemReadOnly || showFinalizationFields) {
        return null;
    }

    const isBusy = isSaving || isProcessingAction;
    const disabledByWarning = !!activeOrderWarning;

    // Caso 1: Orden en configuración, lista para iniciar
    if (['PENDING', 'SETUP', 'SETUP_COMPLETED'].includes(localOrderStatus) && !isNewForForm) {
        return (
            <Button color="success" onClick={() => handleUpdateExistingOrder('IN_PROGRESS')} disabled={isBusy || disabledByWarning} size="sm">
                <PlayCircle size={16} className="me-1"/> Iniciar Producción
            </Button>
        );
    }

    // Caso 2: Orden en progreso o pausada
    if (['IN_PROGRESS', 'PAUSED'].includes(localOrderStatus)) {
        // Si está en pausa Y el usuario NO tiene permisos para reanudar, no mostrar NINGÚN botón.
        if (localOrderStatus === 'PAUSED' && !canPauseOrResume) {
            return null;
        }

        // Si llegamos aquí, o está en progreso, o está en pausa y el usuario SÍ tiene permisos.
        return (
            <div className="d-flex gap-2">
                {/* El botón de Pausa/Reanudar solo aparece para roles permitidos. */}
                {canPauseOrResume && (
                    <Button
                        color={localOrderStatus === 'PAUSED' ? 'success' : 'warning'}
                        outline
                        onClick={handleTogglePauseOrder}
                        disabled={isBusy}
                        size="sm"
                    >
                        {localOrderStatus === 'PAUSED' ? <><PlayCircle size={16} className="me-1"/> Reanudar</> : <><PauseCircle size={16} className="me-1"/> Pausar</>}
                    </Button>
                )}
                {/* Los botones de Cancelar y Guardar siempre se muestran en este bloque (a menos que se oculte todo antes) */}
                <Button color="danger" outline onClick={openCancelModal} disabled={isBusy} size="sm">
                    <XCircle size={16} className="me-1"/> Cancelar
                </Button>
                <Button color="primary" onClick={() => handleUpdateExistingOrder(null, { skipValidation: true })} disabled={isBusy} size="sm">
                    <Save size={16} className="me-1"/> Guardar Progreso
                </Button>
            </div>
        );
    }

    // Caso 3: Todos los pasos completados, lista para finalizar
    if (localOrderStatus === 'ALL_STEPS_COMPLETED') {
         return (
            <div className="d-flex gap-2">
                <Button color="danger" outline onClick={openCancelModal} disabled={isBusy} size="sm">
                    <XCircle size={16} className="me-1"/> Cancelar
                </Button>
                <Button color="warning" onClick={handlePrepareFinalization} disabled={isBusy} size="sm">
                    <ChefHat size={16} className="me-1"/> Ingresar Datos Finales
                </Button>
            </div>
         );
    }

    return null;
};
    
    return (
        <Container fluid className="p-0 order-production-form-main-container production-module">
            <style>{`.process-sidebar { background-color: #ffffff; border-left: 1px solid #dee2e6; } .process-sidebar .list-group-item.active { background-color: #f0f3ff; color: #495057; border-color: #dee2e6; } .process-sidebar .list-group-item.active .step-name-container { color: #0d6efd; font-weight: 600; } .step-name-container { flex-grow: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; } .step-number { font-weight: 700; margin-right: 0.5rem; } .step-status-pill { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 50px; color: white; flex-shrink: 0; } .step-status-pill.status-pending { background-color: #6c757d; } .step-status-pill.status-in-progress { background-color: #ffc107; color: #000; } .step-status-pill.status-completed { background-color: #198754; } .step-status-pill.status-skipped, .step-status-pill.status-paused { background-color: #0dcaf0; } @keyframes lucide-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .lucide-spin { animation: lucide-spin 2s linear infinite; }`}</style>
            <Toaster position="top-center" toastOptions={{duration:3500,error:{duration:5000}}}/>
            <Form onSubmit={(e)=>e.preventDefault()} className="production-order-form-content">
                <OrderBaseFormSection
                    currentOrderData={currentOrderData}
                    handleChangeOrderForm={handleChangeOrderForm}
                    toggleViewSpecSheetModal={toggleViewSpecSheetModal} 
                    productos={productos}
                    empleadosList={empleadosList}
                    providersList={providersList}
                    isSaving={isSaving || isProcessingAction || isVerifyingProduct}
                    isLoadingFichas={isLoadingFichas}
                    selectedSpecSheetData={selectedSpecSheetData}
                    isOrderViewOnly={isEffectivelyReadOnly}
                    ordenTitulo={ordenTitulo}
                    employeeFieldLabel="Registrada por"
                    availableSpecSheets={availableSpecSheets}
                    masterDataFullyLoaded={masterDataFullyLoaded}
                />
                {activeOrderWarning && <Alert color="warning" className="d-flex align-items-center mt-2 mx-3 small py-2"><AlertTriangle size={20} className="me-2 flex-shrink-0" /><div>{activeOrderWarning.message}</div></Alert>}
                {isNewForForm && localOrderStatus === 'PENDING' && ( <CardFooter className="text-end py-2 px-3 bg-light border-top-0 mb-3 shadow-sm"><Button color="success" onClick={handleSaveNewDraft} disabled={isSaving || isProcessingAction || !masterDataFullyLoaded || !!activeOrderWarning} size="sm"><Save size={16} className="me-1"/>Guardar Borrador</Button><Button color="secondary" outline onClick={openCancelModal} disabled={isSaving || isProcessingAction} size="sm" className="ms-2"><XCircle size={16} className="me-1"/>Descartar</Button></CardFooter> )}
                {showLowerSectionsFromData && !showFinalizationFields && (
                    <div className="p-3">
                        <Card className="mb-3 shadow-sm">
                            <CardHeader onClick={toggleSuppliesCallback} style={{ cursor: 'pointer' }} className="d-flex justify-content-between align-items-center py-2 px-3 bg-light">
                                <h6 className="mb-0 d-flex align-items-center small"><Package size={16} className="me-2"/> Insumos Estimados</h6> {isSuppliesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </CardHeader>
                            <Collapse isOpen={isSuppliesOpen}><CardBody className="p-0"><EstimatedSuppliesSection isLoadingFichas={isLoadingFichas} selectedSpecSheetData={selectedSpecSheetData} initialAmount={formOrder.initialAmount} /></CardBody></Collapse>
                        </Card>
                        <ProcessManagementSection
                            currentOrderData={currentOrderData}
                            empleadosList={empleadosList}
                            handleEmployeeSelectionForStep={handleEmployeeSelectionForStep}
                            handleStepFieldChange={handleStepFieldChange}
                            handleStartCurrentStep={handleStartCurrentStep}
                            handleCompleteCurrentStep={handleCompleteCurrentStep}
                            isSaving={isSaving || isProcessingAction}
                            isOrderViewOnly={isEffectivelyReadOnly}
                            isProcessingAction={isProcessingAction}
                            isLoadingFichas={isLoadingFichas}
                            processViewMode="sidebarWithFocus"
                            masterDataFullyLoaded={masterDataFullyLoaded}
                            getStatusInfo={getStatusInfoInSpanish}
                        />
                        <Row className="mt-3 g-2 justify-content-end align-items-center">
                            <Col xs="auto">
                                {renderActionButtons()}
                            </Col>
                        </Row>
                    </div>
                )}
                {showFinalizationFields && !isOrderViewOnlyFromData && ( <OrderFinalizationSection formOrder={formOrder} formErrors={currentOrderData.formErrors} handleChangeOrderForm={handleChangeOrderForm} isSaving={isSaving||isProcessingAction} onCancelFinalization={handleCancelFinalization} onConfirmFinalize={handleFinalizeAndSaveOrder} /> )}
                {isOrderSystemReadOnly && ( <div className="mt-4 p-3 border-top text-end"> <Alert color={localOrderStatus === 'COMPLETED' ? 'success' : 'danger'} className="text-center small py-2">Orden <strong>{currentOrderData.localOrderStatusDisplay}</strong>. No más cambios.</Alert> <Button color="secondary" outline onClick={() => addOrFocusOrder(null, false, { navigateIfNeeded: true })} size="sm" className="mt-2"><Eye size={16} className="me-1"/> Ver Lista</Button> </div> )}
            </Form>
            <ViewSpecSheetModal isOpen={viewSpecSheetModalOpen} toggle={toggleViewSpecSheetModal} specSheetData={selectedSpecSheetData} isLoading={isLoadingFichas} />
            <CancelOrderModal isOpen={isCancelModalOpen} toggle={() => setIsCancelModalOpen(false)} onConfirmCancel={handleConfirmCancelOrder} orderDisplayName={orderToCancelInfo?.displayName} isCancelling={isProcessingAction} />
        </Container>
    );
};

export default OrdenProduccionForm;