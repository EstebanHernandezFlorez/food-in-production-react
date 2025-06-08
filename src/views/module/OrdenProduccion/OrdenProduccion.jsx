import React, { useState, useEffect, useRef, useContext, useCallback, useMemo as useReactMemo } from 'react';
import {
    Row, Col, Spinner, Button, Form, Container, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter, ListGroup, ListGroupItem, CardFooter,
    Collapse, Card, CardHeader, CardBody
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

// Componentes Hijos
import OrderBaseFormSection from './components/OrderBaseFormSection';
import EstimatedSuppliesSection from './components/EstimatedSuppliesSection';
import ProcessManagementSection from './components/ProcessManagementSection';
import OrderFinalizationSection from './components/OrderFinalizationSection';
import CancelOrderModal from './components/CancelOrderModal';

// <<<--- NUEVA FUNCIÓN PARA TRADUCIR ESTADOS A ESPAÑOL --- >>>
export const getStatusInfoInSpanish = (status) => {
    switch (status?.toUpperCase()) {
        case 'PENDING':
            return { text: 'Pendiente', color: 'secondary', icon: <Clock size={12} /> };
        case 'IN_PROGRESS':
            return { text: 'En Proceso', color: 'warning', icon: <Loader size={12} className="lucide-spin" /> };
        case 'COMPLETED':
            return { text: 'Completado', color: 'success', icon: <CheckCircle size={12} /> };
        case 'SKIPPED':
            return { text: 'Omitido', color: 'info', icon: <ArrowRightCircle size={12} /> };
        default:
            return { text: status || 'Desconocido', color: 'light', icon: null };
    }
};

// --- Componentes Auxiliares ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText, confirmColor, isConfirming = false }) => ( <Modal isOpen={isOpen} toggle={() => !isConfirming && toggle(false)} centered backdrop="static" keyboard={!isConfirming}><ModalHeader toggle={() => !isConfirming && toggle(false)} className="py-2 px-3"><div className="d-flex align-items-center"><AlertTriangle size={20} className={`text-${confirmColor || 'primary'} me-2`} /><span className="fw-bold small">{title}</span></div></ModalHeader><ModalBody className="py-3 px-3 small">{children}</ModalBody><ModalFooter className="py-2 px-3"><Button size="sm" color="secondary" outline onClick={() => toggle(false)} disabled={isConfirming}>Cancelar</Button><Button size="sm" color={confirmColor || 'primary'} onClick={onConfirm} disabled={isConfirming}>{isConfirming ? <Spinner size="sm"/> : (confirmText || 'Confirmar')}</Button></ModalFooter></Modal> );
const ViewSpecSheetModal = ({ isOpen, toggle, specSheetData, isLoading }) => { if (!isOpen) return null; const sheetId = specSheetData?.idSpecSheet || specSheetData?.id || 'N/A'; return ( <Modal isOpen={isOpen} toggle={toggle} size="lg" centered scrollable><ModalHeader toggle={toggle}><FileText size={20} className="me-2"/>Detalles de Ficha Técnica (ID: {sheetId})</ModalHeader><ModalBody>{isLoading && <div className="text-center p-4"><Spinner /> Cargando detalles...</div>}{!isLoading && specSheetData && (<><h5>Datos Generales</h5><Row><Col md={6}><p className="mb-1"><strong>Producto:</strong> {specSheetData.product?.productName || specSheetData.productNameSnapshot || 'N/A'}</p></Col><Col md={6}><p className="mb-1"><strong>Versión:</strong> {specSheetData.versionName || '(Sin versión)'}</p></Col><Col md={6}><p className="mb-1"><strong>Fecha Efectiva:</strong> {specSheetData.dateEffective ? new Date(specSheetData.dateEffective).toLocaleDateString() : 'N/A'}</p></Col><Col md={6}><p className="mb-1"><strong>Cant. Base:</strong> {specSheetData.quantityBase || 1} {specSheetData.unitOfMeasureBase || specSheetData.unitOfMeasure || 'unidad(es)'}</p></Col></Row>{specSheetData.description && <p className="mb-2"><strong>Descripción:</strong> {specSheetData.description}</p>}<hr /><h5>Insumos</h5>{specSheetData.specSheetSupplies?.length > 0 ? (<ListGroup flush>{specSheetData.specSheetSupplies.map((ing, idx) => (<ListGroupItem key={idx} className="px-0 py-1 small d-flex justify-content-between"><span>{ing.supply?.supplyName || ing.supplyNameSnapshot || 'Insumo Desconocido'}</span><span>{ing.quantity} {ing.unitOfMeasure}</span></ListGroupItem>))}</ListGroup>) : <p className="text-muted small">No hay insumos.</p>}<hr /><h5>Procesos</h5>{specSheetData.specSheetProcesses?.length > 0 ? (specSheetData.specSheetProcesses.sort((a,b) => (a.processOrder || 0) - (b.processOrder || 0)).map((proc, idx) => (<div key={idx} className="mb-2 p-2 border rounded bg-light"><strong className="d-block">Paso {proc.processOrder}: {proc.processNameOverride || proc.process?.processName || proc.masterProcessData?.processName || 'Proceso Desconocido'}</strong><p className="small text-muted mb-0">{proc.processDescriptionOverride || proc.process?.description || proc.masterProcessData?.description || 'Sin descripción.'}</p>{proc.estimatedTimeMinutes && <small className="d-block text-info">Tiempo Estimado: {proc.estimatedTimeMinutes} min.</small>}</div>))) : <p className="text-muted small">No hay procesos.</p>}</>)}{!isLoading && !specSheetData && <p className="text-danger text-center p-3">No se pudo cargar la ficha.</p>}</ModalBody><ModalFooter><Button color="secondary" onClick={toggle}>Cerrar</Button></ModalFooter></Modal> );};
const SpinnerL = ({children}) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{minHeight: '200px'}}><Spinner style={{ width: '3rem', height: '3rem' }} color="primary" className="mb-2"/><p className="text-muted mb-0">{children}</p></div>);
const InfoS = ({children}) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{minHeight: '200px'}}><Info size={30} className="text-info mb-2"/><p className="text-muted mb-0">{children}</p></div>);
// --- FIN Componentes Auxiliares ---

const validateAndPreparePayload = (formOrder, productos, validationType = 'DRAFT') => {
    const errors = {};
    let isValid = true;
    
    if (!formOrder.idProduct) { isValid = false; errors.idProduct = 'Debe seleccionar un producto.'; }
    if (!formOrder.idEmployeeRegistered) { isValid = false; errors.idEmployeeRegistered = 'Debe seleccionar quién registra la orden.'; }
    if (!formOrder.initialAmount || formOrder.initialAmount.toString().trim() === '') {
        isValid = false; errors.initialAmount = 'La cantidad a producir es requerida.';
    } else if (isNaN(parseFloat(formOrder.initialAmount)) || parseFloat(formOrder.initialAmount) <= 0) {
        isValid = false; errors.initialAmount = 'La cantidad debe ser un número mayor a cero.';
    }
    if (!formOrder.idProvider) { isValid = false; errors.idProvider = 'Debe seleccionar un proveedor.'; }
    
    if (validationType === 'PRODUCTION') {
        const productoSeleccionado = productos.find(p => String(p.idProduct) === String(formOrder.idProduct));
        if (productoSeleccionado && productoSeleccionado.specSheetCount > 0 && !formOrder.idSpecSheet) {
            isValid = false; errors.idSpecSheet = 'Este producto requiere una ficha técnica para iniciar producción.';
        }
    }

    if (!isValid) {
        return { isValid: false, payload: null, errors };
    }

    const payload = {
        idProduct: formOrder.idProduct || null,
        idSpecSheet: formOrder.idSpecSheet || null,
        initialAmount: parseFloat(formOrder.initialAmount),
        idEmployeeRegistered: formOrder.idEmployeeRegistered || null,
        idProvider: formOrder.idProvider || null,
        observations: formOrder.observations || null,
        status: 'SETUP',
        productNameSnapshot: formOrder.productNameSnapshot,
        inputInitialWeight: formOrder.inputInitialWeight || null,
        inputInitialWeightUnit: (formOrder.inputInitialWeight && parseFloat(formOrder.inputInitialWeight) > 0) ? (formOrder.inputInitialWeightUnit || 'kg') : null,
    };
    
    Object.keys(payload).forEach(key => { if (payload[key] === '') payload[key] = null; });
    return { isValid: true, payload, errors };
};

const OrdenProduccionForm = ({
    productosMaestrosProps,
    empleadosMaestrosProps,
    proveedoresMaestrosProps,
    masterDataLoadedPageProps
}) => {
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
    const instanceId = useRef(Math.random().toString(36).substring(7));
    const [isVerifyingProduct, setIsVerifyingProduct] = useState(false);
    const prevProductIdRef = useRef();
    const [activeOrderWarning, setActiveOrderWarning] = useState(null);

    const context = useContext(ActiveOrdersContext);

    if (!context) {
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
    } = context;

    const currentOrderData = useReactMemo(() => {
        if (!currentViewedOrderId || !activeOrders[currentViewedOrderId]) {
            return null;
        }
        return activeOrders[currentViewedOrderId];
    }, [activeOrders, currentViewedOrderId]);

    useEffect(() => { 
        if (masterDataLoadedPageProps) {
            setProductos(productosMaestrosProps || []);
            setEmpleadosList(empleadosMaestrosProps || []);
            const proveedoresMapeados = (proveedoresMaestrosProps || []).map(p => ({
                ...p,
                providerName: p.providerName || p.company || `ID: ${p.idProvider}`
            }));
            setProvidersList(proveedoresMapeados);
            setMasterDataFullyLoaded(true); 
        }
    }, [masterDataLoadedPageProps]);
    
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
                if (specSheetIdFromFormParams) {
                    specSheetToUse = allSheetsForProduct.find(s => String(s.idSpecSheet) === String(specSheetIdFromFormParams));
                }
                if (!specSheetToUse) {
                    specSheetToUse = allSheetsForProduct.find(s => s.status === true) || allSheetsForProduct[0];
                }
            } else {
                errorMsg = "Este producto no tiene fichas técnicas asociadas.";
            }

            const newSteps = specSheetToUse?.specSheetProcesses?.sort((a, b) => a.processOrder - b.processOrder).map(p => ({
                idProductionOrderDetail: null, idProcess: String(p.idProcess || p.masterProcessData?.idProcess || ''),
                processOrder: p.processOrder, processName: p.processNameOverride || p.masterProcessData?.processName || 'Proceso Desconocido',
                processDescription: p.processDescriptionOverride || p.masterProcessData?.description || 'Sin descripción',
                estimatedTimeMinutes: p.estimatedTimeMinutes ?? p.masterProcessData?.estimatedTimeMinutes, status: 'PENDING', isNewStep: true
            })) || [];

            updateOrderState(currentViewedOrderId, { 
                formOrder: { ...orderForUpdate.formOrder, idProduct: productIdParam, idSpecSheet: specSheetToUse?.idSpecSheet.toString() || '' }, 
                selectedSpecSheetData: specSheetToUse, 
                processSteps: newSteps,
                activeStepIndex: newSteps.length > 0 ? 0 : null, 
                formErrors: { ...orderForUpdate.formErrors, idSpecSheet: errorMsg }
            });

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
            updateOrderState(currentViewedOrderId, { 
                formOrder: newForm, selectedSpecSheetData: null, processSteps: [],
                formErrors: { ...currentOrderData.formErrors, idProduct: null, idSpecSheet: null }
            });
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
        
        if (!validationResult.isValid) {
            toast.error(Object.values(validationResult.errors).find(msg => msg) || "Por favor, corrija los errores del formulario.");
            return;
        }

        setIsSaving(true);
        const toastIdOuter = toast.loading("Guardando borrador...");
        
        try {
            console.log("Payload enviado al backend:", JSON.stringify(validationResult.payload, null, 2));
            const resOrderHeader = await productionOrderService.createProductionOrder(validationResult.payload);
            const transformedOrderHeader = transformFetchedOrderToContextFormat(resOrderHeader);

            if (!transformedOrderHeader) {
                throw new Error("Respuesta inválida del servidor al crear el borrador.");
            }

            updateOrderState(currentViewedOrderId, transformedOrderHeader, transformedOrderHeader.id);
            toast.success("Borrador guardado. Ahora puede iniciar la producción.", { id: toastIdOuter });
        } catch (err) {
            console.error("Error detallado al guardar la orden:", err.response?.data || err);
            const errorMsg = err.response?.data?.message || err.message || "Error al guardar la orden.";
            toast.error(errorMsg, { id: toastIdOuter });

            if (err.response?.data?.errors) {
                const backendErrors = err.response.data.errors.reduce((acc, e) => {
                    acc[e.path] = e.msg;
                    return acc;
                }, {});
                updateOrderState(currentViewedOrderId, { formErrors: backendErrors });
            }
        } finally {
            setIsSaving(false);
        }
    }, [currentOrderData, isSaving, productos, updateOrderState, transformFetchedOrderToContextFormat]);
    
    const handleUpdateExistingOrder = useCallback(async (intendedFinalStatus = null, options = {}) => {
        if (!currentViewedOrderId || !currentOrderData || currentOrderData.isNewForForm) return false;
        
        const validationResult = validateAndPreparePayload(currentOrderData.formOrder, productos, 'PRODUCTION');
        updateOrderState(currentViewedOrderId, { formErrors: validationResult.errors });
        
        if (!validationResult.isValid && !options.skipValidation) {
            toast.error(Object.values(validationResult.errors).find(msg => msg) || "Corrija los errores del formulario.");
            return false;
        }

        setIsSaving(true);
        const toastId = toast.loading("Guardando cambios...");
        
        const updatePayload = {
            ...validationResult.payload,
            status: intendedFinalStatus || currentOrderData.localOrderStatus
        };

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
    
    const handleEmployeeSelectionForStep = useCallback((stepIndex, newEmployeeId) => {
        if (!currentViewedOrderId || !currentOrderData) return;
        const newSteps = currentOrderData.processSteps.map((s, i) => i === stepIndex ? { ...s, idEmployee: newEmployeeId || '' } : s);
        updateOrderState(currentViewedOrderId, { processSteps: newSteps });
    }, [currentViewedOrderId, currentOrderData, updateOrderState]);

    const handleStartCurrentStep = useCallback(async () => {
        if (!currentViewedOrderId || !currentOrderData || isProcessingAction) return;
        
        const orderToStart = currentOrderData;
        const stepToStart = orderToStart.processSteps?.[orderToStart.activeStepIndex];

        if (!stepToStart) { return toast.error("No hay un paso activo para iniciar."); }
        if (!stepToStart.idEmployee) { return toast.error(`Asigne un empleado al paso "${stepToStart.processName}".`); }
        
        if (!stepToStart.idProductionOrderDetail) {
            const updatedOrder = await handleUpdateExistingOrder('IN_PROGRESS', { showToast: false });
            if (!updatedOrder) {
                toast.error("No se pudo preparar la orden. Guarde los cambios primero.");
            }
            return;
        }

        setIsProcessingAction(true);
        const toastIdStartStep = toast.loading(`Iniciando paso "${stepToStart.processName}"...`);
        try {
            const payload = { startDate: new Date().toISOString(), status: 'IN_PROGRESS', idEmployeeAssigned: stepToStart.idEmployee };
            const res = await productionOrderService.updateProductionOrderStep(orderToStart.id, stepToStart.idProductionOrderDetail, payload);
            const transformedOrderAfterStepStart = transformFetchedOrderToContextFormat(res);
            if (transformedOrderAfterStepStart) {
                updateOrderState(orderToStart.id, transformedOrderAfterStepStart);
                toast.success(`Paso "${stepToStart.processName}" iniciado.`, { id: toastIdStartStep });
            } else { throw new Error("Respuesta inválida del servidor."); }
        } catch (err) {
            toast.error(err.response?.data?.message || `Error iniciando el paso.`, { id: toastIdStartStep });
        } finally {
            setIsProcessingAction(false);
        }
    }, [currentOrderData, isProcessingAction, handleUpdateExistingOrder, updateOrderState, transformFetchedOrderToContextFormat]);

    const handleCompleteCurrentStep = useCallback(async () => {
        if (!currentViewedOrderId || !currentOrderData || isProcessingAction) return;
        
        const orderToComplete = currentOrderData;
        const step = orderToComplete.processSteps?.[orderToComplete.activeStepIndex];
        
        if (!step || !step.idProductionOrderDetail) { return toast.error("Error: no se puede completar un paso no guardado."); }
        if (step.status !== 'IN_PROGRESS') { return toast.error(`El paso no está en progreso.`); }

        setIsProcessingAction(true);
        const tId = toast.loading(`Completando "${step.processName}"...`);
        try {
            const endDateToSend = new Date().toISOString();
            const res = await productionOrderService.updateProductionOrderStep(orderToComplete.id, step.idProductionOrderDetail, { endDate: endDateToSend, status: 'COMPLETED', observations: step.observations || null });
            const transformedOrder = transformFetchedOrderToContextFormat(res);
            if (transformedOrder) {
                updateOrderState(currentViewedOrderId, transformedOrder);
                toast.success(`Paso completado.`, { id: tId, icon: "✔️" });
            } else { throw new Error("Respuesta inválida del servidor."); }
        } catch (err) {
            toast.error(err.response?.data?.message || `Error completando el paso.`, { id: tId });
        } finally {
            setIsProcessingAction(false);
        }
    }, [currentViewedOrderId, currentOrderData, isProcessingAction, updateOrderState, transformFetchedOrderToContextFormat]);

    const handlePrepareFinalization = useCallback(() => {
        if (!currentViewedOrderId || !currentOrderData) return;
        setShowFinalizationFields(true);
        toast("Ingrese los datos de finalización.", { icon: "✍️" });
    }, [currentViewedOrderId, currentOrderData]);

    const handleFinalizeAndSaveOrder = useCallback(async () => {
        if (!currentViewedOrderId || !currentOrderData) return;
        setIsProcessingAction(true);
        const tId = toast.loading("Finalizando orden...");
        try {
            const { formOrder } = currentOrderData;
            const payload = {
                finalQuantityProduct: parseFloat(formOrder.finalQuantityProduct),
                finishedProductWeight: formOrder.finishedProductWeight ? parseFloat(formOrder.finishedProductWeight) : null,
                finishedProductWeightUnit: (formOrder.finishedProductWeight && parseFloat(formOrder.finishedProductWeight) > 0) ? (formOrder.finishedProductWeightUnit || 'kg') : null,
                inputFinalWeightUnused: formOrder.inputFinalWeightUnused ? parseFloat(formOrder.inputFinalWeightUnused) : null,
                inputFinalWeightUnusedUnit: (formOrder.inputFinalWeightUnused && parseFloat(formOrder.inputFinalWeightUnused) > 0) ? (formOrder.inputFinalWeightUnusedUnit || 'kg') : null,
                observations: formOrder.observations || null,
            };
            const finalizedOrder = await productionOrderService.finalizeProductionOrder(currentOrderData.id, payload);
            const trans = transformFetchedOrderToContextFormat(finalizedOrder);
            if (trans) {
                updateOrderState(currentViewedOrderId, trans);
                setShowFinalizationFields(false);
                toast.success(`¡Orden finalizada!`, { id: tId, icon: "🏆" });
            } else { throw new Error("Respuesta inválida del servidor."); }
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al finalizar.", { id: tId });
        } finally {
            setIsProcessingAction(false);
        }
    }, [currentViewedOrderId, currentOrderData, isProcessingAction, transformFetchedOrderToContextFormat, updateOrderState]);

    const handleCancelFinalization = useCallback(() => {
        setShowFinalizationFields(false);
        toast.info("Finalización cancelada.");
    }, []);

    const handleStepFieldChange = useCallback((stepIndex, fieldName, value) => {
        if (!currentViewedOrderId || !currentOrderData) return;
        const newSteps = currentOrderData.processSteps.map((s, i) => i === stepIndex ? { ...s, [fieldName]: value } : s);
        updateOrderState(currentViewedOrderId, { processSteps: newSteps });
    }, [currentViewedOrderId, currentOrderData, updateOrderState]);

    const toggleViewSpecSheetModal = useCallback(() => setViewSpecSheetModal(p => !p), []);
    const toggleSuppliesCallback = useCallback(() => setIsSuppliesOpen(prev => !prev), []);
    
    const openCancelModal = useCallback(() => {
        if (!currentViewedOrderId || !currentOrderData) return;
        setOrderToCancelInfo({ id: currentOrderData.id, displayName: currentOrderData.orderNumberDisplay || "Nuevo Borrador" });
        setIsCancelModalOpen(true);
    }, [currentViewedOrderId, currentOrderData]);

    const handleConfirmCancelOrder = useCallback(async (reason) => {
        if (!orderToCancelInfo?.id) return;
        setIsProcessingAction(true);
        const tId = toast.loading(`Cancelando orden...`);
        try {
            if (String(orderToCancelInfo.id).startsWith('NEW_')) {
                removeOrder(orderToCancelInfo.id);
                toast.success("Borrador descartado.", { id: tId });
            } else {
                const updatedOrder = await productionOrderService.changeProductionOrderStatus(orderToCancelInfo.id, 'CANCELLED', reason);
                const trans = transformFetchedOrderToContextFormat(updatedOrder);
                if (trans) {
                    updateOrderState(orderToCancelInfo.id, trans);
                    toast.success(`Orden cancelada.`, { id: tId });
                } else { throw new Error("Respuesta inválida."); }
            }
            setIsCancelModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al cancelar.", { id: tId });
        } finally {
            setIsProcessingAction(false);
        }
    }, [orderToCancelInfo, removeOrder, transformFetchedOrderToContextFormat, updateOrderState]);

    useEffect(() => {
        const order = currentOrderData;
        if (!order || !masterDataFullyLoaded || isSaving) return;
        
        const productId = order.formOrder?.idProduct;
        
        if (productId && productId !== prevProductIdRef.current) {
            const verifyProduct = async () => {
                setIsVerifyingProduct(true);
                setActiveOrderWarning(null); 
                
                const verificationResult = await productionOrderService.checkActiveOrderForProduct(productId);
                
                if (verificationResult.hasActiveOrder) {
                    const conflictingOrder = verificationResult.activeOrder;
                    if (String(conflictingOrder.idProductionOrder) !== String(order.id)) {
                         setActiveOrderWarning({
                            message: `Este producto ya tiene una orden activa (ID: ${conflictingOrder.idProductionOrder}, Estado: ${conflictingOrder.status}). No podrá guardar o iniciar esta orden hasta que la otra finalice.`,
                            orderId: conflictingOrder.idProductionOrder,
                        });
                    }
                }
                
                await updateSpecSheetAndProcesses(productId, order.formOrder.idSpecSheet || null);
                
                setIsVerifyingProduct(false);
            };
            
            verifyProduct();
        } else if (!productId) {
            setActiveOrderWarning(null);
        }
        
        prevProductIdRef.current = productId;
    }, [currentOrderData?.formOrder?.idProduct, currentOrderData?.id, masterDataFullyLoaded, isSaving, updateSpecSheetAndProcesses]);


    if (!masterDataFullyLoaded) return <SpinnerL>Preparando formulario de orden...</SpinnerL>;
    if (!currentViewedOrderId && !isLoadingOrderContext) return <InfoS>Seleccione una orden o cree una nueva.</InfoS>;
    if (isLoadingOrderContext && (!currentOrderData || String(currentOrderData?.id).startsWith('NEW_'))) return <SpinnerL>{currentViewedOrderId && !String(currentViewedOrderId).startsWith('NEW_') ? `Cargando orden ${currentViewedOrderId}...` : "Cargando..."}</SpinnerL>;
    if (!currentOrderData) return <Alert color="warning" className="m-3">No se pudieron cargar los datos para la orden (ID: {currentViewedOrderId || 'N/A'}).</Alert>;
    
    const { localOrderStatus, selectedSpecSheetData, processSteps = [], isNewForForm, formOrder, activeStepIndex, id: orderId, formErrors } = currentOrderData;
    const isOrderViewOnlyFromData = ['COMPLETED','CANCELLED'].includes(localOrderStatus);
    const showLowerSectionsFromData = !(isNewForForm && localOrderStatus === 'PENDING');
    const isSimplifiedBaseViewFromData = !isNewForForm && (localOrderStatus === 'PENDING' || localOrderStatus === 'SETUP');
    
    let mainButtonConfig = { action: null, text: "", icon: <Save size={16} className="me-1"/>, color: "primary", disabled: isSaving || isProcessingAction || isOrderViewOnlyFromData || !!activeOrderWarning, visible: false };
    if (currentOrderData && !isOrderViewOnlyFromData && !showFinalizationFields && masterDataFullyLoaded) {
        if (isNewForForm && localOrderStatus === 'PENDING') { /* no button */ }
        else if (localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') mainButtonConfig = { ...mainButtonConfig, visible: true, action: () => handleUpdateExistingOrder(null, {skipValidation: false}), text: "Guardar Progreso" };
        else if (localOrderStatus === 'ALL_STEPS_COMPLETED') mainButtonConfig = { ...mainButtonConfig, visible: true, action: handlePrepareFinalization, text: "Ingresar Datos Finales", icon: <ChefHat size={16} className="me-1"/>, color: "warning" };
        else if ((localOrderStatus === 'PENDING' && !isNewForForm) || localOrderStatus === 'SETUP' || localOrderStatus === 'SETUP_COMPLETED') {
            let actionText = "Iniciar Producción", nextStatusAction = 'IN_PROGRESS', iconAction = <PlayCircle size={16} className="me-1"/>;
            if (localOrderStatus === 'SETUP_COMPLETED' && (!processSteps || processSteps.length === 0)) actionText = "Iniciar Producción (Sin Pasos)";
            else if (localOrderStatus === 'SETUP' || (localOrderStatus === 'PENDING' && !isNewForForm)) actionText = (formOrder.idProduct && selectedSpecSheetData?.specSheetProcesses?.length > 0) ? "Iniciar Producción" : "Iniciar Producción (Sin Pasos de Ficha)";
            mainButtonConfig = { ...mainButtonConfig, visible: true, action: () => handleUpdateExistingOrder(nextStatusAction, {skipValidation: false}), text: actionText, icon: iconAction, color: "success" };
        }
    }
    const ordenTitulo = (isNewForForm && localOrderStatus === 'PENDING') ? "Nuevo Borrador de Orden" : `Orden: ${currentOrderData.orderNumberDisplay || `ID ${orderId}`} (${currentOrderData.localOrderStatusDisplay || localOrderStatus})`;
    
    return (
        <Container fluid className="p-0 order-production-form-main-container production-module">
            {/* <<<--- NUEVOS ESTILOS CSS PARA EL SIDEBAR DE PASOS --- >>> */}
            <style>{`
                /* Estilos para el sidebar de procesos */
                .process-sidebar {
                    background-color: #ffffff; /* Fondo blanco para el sidebar */
                    border-left: 1px solid #dee2e6;
                }

                /* Anula el fondo azul por defecto del elemento activo */
                .process-sidebar .list-group-item.active {
                    background-color: #f0f3ff; /* Un fondo azul muy sutil */
                    color: #495057; /* Mantenemos el color de texto oscuro */
                    border-color: #dee2e6; /* Borde normal */
                }
                
                /* Añade un borde izquierdo para indicar el paso activo */
                .process-sidebar .list-group-item.active .step-name-container {
                    color: #0d6efd; /* Color primario para el texto del paso activo */
                    font-weight: 600;
                }
                
                .process-sidebar .list-group-item {
                    transition: background-color 0.2s ease;
                }

                /* Contenedor para el nombre del paso, evita que se monte */
                .step-name-container {
                    flex-grow: 1; /* Permite que ocupe el espacio disponible */
                    min-width: 0; /* Clave para que text-truncate funcione en flexbox */
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: flex;
                    align-items: center;
                }

                .step-number {
                    font-weight: 700;
                    margin-right: 0.5rem;
                }

                /* Estilos para las "píldoras" de estado */
                .step-status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 0.2rem 0.5rem;
                    border-radius: 50px;
                    color: white;
                    flex-shrink: 0; /* Evita que la píldora se encoja */
                }
                .step-status-pill.status-pending { background-color: #6c757d; }
                .step-status-pill.status-in-progress { background-color: #ffc107; color: #000; }
                .step-status-pill.status-completed { background-color: #198754; }
                .step-status-pill.status-skipped { background-color: #0dcaf0; }


                /* Animación para el icono de carga */
                @keyframes lucide-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .lucide-spin {
                    animation: lucide-spin 2s linear infinite;
                }
            `}</style>
            
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
                    isOrderViewOnly={isOrderViewOnlyFromData}
                    ordenTitulo={ordenTitulo}
                    employeeFieldLabel="Registrada por"
                    isSimplifiedView={isSimplifiedBaseViewFromData}
                    availableSpecSheets={availableSpecSheets}
                    masterDataFullyLoaded={masterDataFullyLoaded}
                />

                {activeOrderWarning && (
                    <Alert color="warning" className="d-flex align-items-center mt-2 mx-3 small py-2">
                        <AlertTriangle size={20} className="me-2 flex-shrink-0" />
                        <div>
                            {activeOrderWarning.message}
                        </div>
                    </Alert>
                )}

                {isNewForForm && localOrderStatus === 'PENDING' && (
                    <CardFooter className="text-end py-2 px-3 bg-light border-top-0 mb-3 shadow-sm">
                        <Button color="success" onClick={handleSaveNewDraft} disabled={isSaving || isProcessingAction || !masterDataFullyLoaded || !!activeOrderWarning} size="sm">
                            <Save size={16} className="me-1"/>Guardar Borrador
                        </Button>
                        <Button color="secondary" outline onClick={openCancelModal} disabled={isSaving || isProcessingAction} size="sm" className="ms-2"><XCircle size={16} className="me-1"/>Descartar</Button>
                    </CardFooter>
                )}
                {showLowerSectionsFromData && !showFinalizationFields && (
                    <div className="mt-3"> <hr className="my-3"/>
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
                            isOrderViewOnly={isOrderViewOnlyFromData}
                            isProcessingAction={isProcessingAction}
                            isLoadingFichas={isLoadingFichas}
                            processViewMode="sidebarWithFocus"
                            masterDataFullyLoaded={masterDataFullyLoaded}
                            getStatusInfo={getStatusInfoInSpanish} // <<< PASANDO LA FUNCIÓN DE TRADUCCIÓN AL COMPONENTE HIJO
                        />
                        {mainButtonConfig.visible && !isNewForForm && !isOrderViewOnlyFromData && (
                             <Row className="mt-3 g-2 justify-content-end align-items-center">
                                <Col xs="auto"><Button color="danger" outline onClick={openCancelModal} disabled={isSaving || isProcessingAction || isOrderViewOnlyFromData || ['COMPLETED', 'CANCELLED'].includes(localOrderStatus)} size="sm" title="Cancelar Orden"><XCircle size={16} className="me-1"/> Cancelar Orden</Button></Col>
                                {mainButtonConfig.action && (<Col xs="auto"><Button color={mainButtonConfig.color} onClick={mainButtonConfig.action} disabled={mainButtonConfig.disabled} size="sm">{mainButtonConfig.icon}{mainButtonConfig.text}</Button></Col>)}
                            </Row>
                        )}
                    </div>
                )}
                {showFinalizationFields && !isOrderViewOnlyFromData && (
                    <OrderFinalizationSection
                        formOrder={formOrder}
                        formErrors={formErrors}
                        handleChangeOrderForm={handleChangeOrderForm}
                        isSaving={isSaving||isProcessingAction}
                        onCancelFinalization={handleCancelFinalization}
                        onConfirmFinalize={handleFinalizeAndSaveOrder} 
                    />
                )}
                {isOrderViewOnlyFromData && ( <div className="mt-4 pt-3 border-top text-end"> <Alert color={localOrderStatus === 'COMPLETED' ? 'success' : 'danger'} className="text-center small py-2">Orden <strong>{currentOrderData.localOrderStatusDisplay}</strong>. No más cambios.</Alert> <Button color="secondary" outline onClick={() => addOrFocusOrder(null, false, { navigateIfNeeded: true })} size="sm" className="mt-2"><Eye size={16} className="me-1"/> Ver Lista</Button> </div> )}
            </Form>
            <ViewSpecSheetModal isOpen={viewSpecSheetModalOpen} toggle={toggleViewSpecSheetModal} specSheetData={selectedSpecSheetData} isLoading={isLoadingFichas && !selectedSpecSheetData}/>
            <CancelOrderModal isOpen={isCancelModalOpen} toggle={() => setIsCancelModalOpen(false)} onConfirmCancel={handleConfirmCancelOrder} orderDisplayName={orderToCancelInfo?.displayName} isCancelling={isProcessingAction}/>
        </Container>
    );
};

export default OrdenProduccionForm;