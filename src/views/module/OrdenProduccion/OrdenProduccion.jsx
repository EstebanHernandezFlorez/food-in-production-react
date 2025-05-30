// src/views/module/OrdenProduccion/OrdenProduccionForm.jsx
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
    Row, Col, Spinner, Button, Form, Container, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter, ListGroup, ListGroupItem, CardFooter,
    Collapse, Card, CardHeader, CardBody
} from 'reactstrap';
import { useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    Save, XCircle, AlertTriangle, Eye, PlayCircle, CheckCircle, ChefHat, FileText, Info,
    Package, PauseCircle, RotateCcw, ChevronDown, ChevronRight, ArrowRightCircle
} from 'lucide-react';

// Servicios
import productService from '../../services/productService';
import specSheetService from '../../services/specSheetService';
import employeeService from '../../services/empleadoService';
import productionOrderService from '../../services/productionOrderService';
import registroCompraService from '../../services/registroCompraService';

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

// --- Componentes Auxiliares ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText, confirmColor, isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={() => !isConfirming && toggle(false)} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={() => !isConfirming && toggle(false)} className="py-2 px-3">
            <div className="d-flex align-items-center">
                <AlertTriangle size={20} className={`text-${confirmColor || 'primary'} me-2`} />
                <span className="fw-bold small">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody className="py-3 px-3 small">{children}</ModalBody>
        <ModalFooter className="py-2 px-3">
            <Button size="sm" color="secondary" outline onClick={() => toggle(false)} disabled={isConfirming}>Cancelar</Button>
            <Button size="sm" color={confirmColor || 'primary'} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? <Spinner size="sm"/> : (confirmText || 'Confirmar')}
            </Button>
        </ModalFooter>
    </Modal>
);

const ViewSpecSheetModal = ({ isOpen, toggle, specSheetData, isLoading }) => {
    if (!isOpen) return null;
    const sheetId = specSheetData?.idSpecSheet || specSheetData?.id || 'N/A';
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered scrollable>
            <ModalHeader toggle={toggle}><FileText size={20} className="me-2"/>Detalles de Ficha Técnica (ID: {sheetId})</ModalHeader>
            <ModalBody>
                {isLoading && <div className="text-center p-4"><Spinner /> Cargando detalles de la ficha...</div>}
                {!isLoading && specSheetData && (
                    <>
                        <h5>Datos Generales</h5>
                        <Row><Col md={6}><p className="mb-1"><strong>Producto:</strong> {specSheetData.product?.productName || specSheetData.productNameSnapshot || 'N/A'}</p></Col><Col md={6}><p className="mb-1"><strong>Versión:</strong> {specSheetData.versionName || '(Sin versión)'}</p></Col><Col md={6}><p className="mb-1"><strong>Fecha Efectiva:</strong> {specSheetData.dateEffective ? new Date(specSheetData.dateEffective).toLocaleDateString() : 'N/A'}</p></Col><Col md={6}><p className="mb-1"><strong>Cant. Base:</strong> {specSheetData.quantityBase || 1} {specSheetData.unitOfMeasureBase || specSheetData.unitOfMeasure || 'unidad(es)'}</p></Col></Row>
                        {specSheetData.description && <p className="mb-2"><strong>Descripción:</strong> {specSheetData.description}</p>}
                        <hr /><h5>Insumos</h5>
                        {specSheetData.specSheetSupplies?.length > 0 ? (<ListGroup flush>{specSheetData.specSheetSupplies.map((ing, idx) => (<ListGroupItem key={idx} className="px-0 py-1 small d-flex justify-content-between"><span>{ing.supply?.supplyName || ing.supplyNameSnapshot || 'Insumo Desconocido'}</span><span>{ing.quantity} {ing.unitOfMeasure}</span></ListGroupItem>))}</ListGroup>) : <p className="text-muted small">No hay insumos.</p>}
                        <hr /><h5>Procesos</h5>
                        {specSheetData.specSheetProcesses?.length > 0 ? (specSheetData.specSheetProcesses.sort((a,b) => (a.processOrder || 0) - (b.processOrder || 0)).map((proc, idx) => (<div key={idx} className="mb-2 p-2 border rounded bg-light"><strong className="d-block">Paso {proc.processOrder}: {proc.processNameOverride || proc.process?.processName || proc.masterProcessData?.processName || 'Proceso Desconocido'}</strong><p className="small text-muted mb-0">{proc.processDescriptionOverride || proc.process?.description || proc.masterProcessData?.description || 'Sin descripción.'}</p>{proc.estimatedTimeMinutes && <small className="d-block text-info">Tiempo Estimado: {proc.estimatedTimeMinutes} min.</small>}</div>))) : <p className="text-muted small">No hay procesos.</p>}
                    </>
                )}
                {!isLoading && !specSheetData && <p className="text-danger text-center p-3">No se pudo cargar la ficha.</p>}
            </ModalBody>
            <ModalFooter><Button color="secondary" onClick={toggle}>Cerrar</Button></ModalFooter>
        </Modal>
    );
};

const SpinnerL = ({children}) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{minHeight: '200px'}}><Spinner style={{ width: '3rem', height: '3rem' }} color="primary" className="mb-2"/><p className="text-muted mb-0">{children}</p></div>);
const InfoS = ({children}) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{minHeight: '200px'}}><Info size={30} className="text-info mb-2"/><p className="text-muted mb-0">{children}</p></div>);
// --- FIN Componentes Auxiliares ---

const OrdenProduccionForm = () => {
    const { orderIdParam } = useParams();
    const context = useContext(ActiveOrdersContext);

    const [productos, setProductos] = useState([]);
    const [isLoadingProductos, setIsLoadingProductos] = useState(true);
    const [empleadosList, setEmpleadosList] = useState([]);
    const [isLoadingEmpleados, setIsLoadingEmpleados] = useState(true);
    const [providersList, setProvidersList] = useState([]);
    const [isLoadingProviders, setIsLoadingProviders] = useState(true);
    const [masterDataFullyLoaded, setMasterDataFullyLoaded] = useState(false);

    const [isLoadingFichas, setIsLoadingFichas] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [confirmEmployeeModalOpen, setConfirmEmployeeModalOpen] = useState(false);
    const selectedEmployeeTemp = useRef({});
    const [viewSpecSheetModalOpen, setViewSpecSheetModalOpen] = useState(false);
    const [showFinalizationFields, setShowFinalizationFields] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderToCancelInfo, setOrderToCancelInfo] = useState(null);
    const [isSuppliesOpen, setIsSuppliesOpen] = useState(false);

    // --- Contexto y Datos Base de la Orden ---
    if (!context) {
        return <Container fluid className="p-4 text-center"><Alert color="danger">Error Crítico: Contexto de Órdenes no disponible.</Alert></Container>;
    }
    const {
        activeOrders, currentViewedOrderId, isLoadingOrderContext,
        addOrFocusOrder, updateOrderState, removeOrder, transformFetchedOrderToContextFormat
    } = context;

    const currentOrderData = currentViewedOrderId ? activeOrders[currentViewedOrderId] : null;

    // --- Guardas Tempranas ---
     if (!masterDataFullyLoaded) {
        console.log("DEBUG: Atascado en !masterDataFullyLoaded");
        return <SpinnerL>Cargando datos esenciales...</SpinnerL>;
    }
    if (isLoadingOrderContext && !String(currentViewedOrderId).startsWith('NEW_')) { 
        console.log("DEBUG: Atascado en isLoadingOrderContext");
        return <SpinnerL>{currentViewedOrderId ? `Cargando orden ${currentViewedOrderId}...` : "Cargando..."}</SpinnerL>;
    }
    if (!currentViewedOrderId) {
        // Esta guarda no debería causar carga infinita, sino mostrar InfoS
        return <InfoS>{orderIdParam && orderIdParam !== 'crear' ? `Orden ${orderIdParam} no encontrada.` : "Seleccione o cree una orden."}</InfoS>;
    }
    if (!currentOrderData) {
        if (String(currentViewedOrderId).startsWith('NEW_')) {
            console.log("DEBUG: Atascado en !currentOrderData para NEW_ID");
            return <SpinnerL>Inicializando nueva orden...</SpinnerL>; 
        }
        // Esta es una alerta de error, no un spinner de carga.
        return <Alert color="danger" className="m-3">Error crítico: Datos de orden no disponibles para ID: {currentViewedOrderId}.</Alert>;
    }

    // --- Desestructuración de Propiedades de currentOrderData ---
    // Estas variables ahora están disponibles para el resto del componente.
    const { 
        localOrderStatus, 
        selectedSpecSheetData, 
        processSteps, 
        isNewForForm,
        formOrder, // Contiene los campos del formulario de la orden
        activeStepIndex, // El índice del paso actualmente activo según el contexto/backend
        id: orderId // El ID real de la orden (después de guardar borrador) o el temporal 'NEW_...'
    } = currentOrderData;

    const isOrderViewOnly = ['COMPLETED','CANCELLED'].includes(localOrderStatus);
    const currentActiveStepFromContext = activeStepIndex !== null && processSteps?.[activeStepIndex];
    
    const showLowerSections = !(isNewForForm && localOrderStatus === 'PENDING');
    const isSimplifiedBaseView = !isNewForForm && (localOrderStatus === 'PENDING' || localOrderStatus === 'SETUP');
    const toggleSupplies = () => setIsSuppliesOpen(!isSuppliesOpen);

    // --- useEffects y Callbacks ---
    // src/views/module/OrdenProduccion/OrdenProduccionForm.jsx

useEffect(() => {
    let isMounted = true;
    console.log("DEBUG_MASTER: useEffect para datos maestros ejecutado. masterDataFullyLoaded:", masterDataFullyLoaded);

    if (!masterDataFullyLoaded) {
        console.log("DEBUG_MASTER: masterDataFullyLoaded es false, procediendo a cargar datos maestros.");
        setIsLoadingProductos(true); 
        setIsLoadingEmpleados(true); 
        setIsLoadingProviders(true);
        console.log("DEBUG_MASTER: Estados de carga individuales (productos, empleados, providers) puestos en true.");

        const loadAllMasterData = async () => {
            console.log("DEBUG_MASTER: loadAllMasterData - INICIO");
            try {
                console.log("DEBUG_MASTER: loadAllMasterData - Llamando a Promise.all...");
                const [productsRes, employeesRes, providersRes] = await Promise.all([
                    productService.getAllProducts({ status: true, includeSpecSheetCount: true }),
                    employeeService.getAllEmpleados({ status: true }),
                    registroCompraService.getMeatCategoryProviders()
                ]);
                
                if (isMounted) {
                    console.log("DEBUG_MASTER: loadAllMasterData - Promise.all RESUELTO. isMounted:", isMounted);
                    console.log("DEBUG_MASTER: productsRes:", productsRes);
                    console.log("DEBUG_MASTER: employeesRes:", employeesRes);
                    console.log("DEBUG_MASTER: providersRes:", providersRes);

                    // Validar que las respuestas son arrays o tienen una propiedad data que es un array
                    const finalProducts = Array.isArray(productsRes) ? productsRes.filter(p => p.status) : (productsRes?.data && Array.isArray(productsRes.data) ? productsRes.data.filter(p => p.status) : []);
                    const finalEmployees = Array.isArray(employeesRes) ? employeesRes.filter(e => e.status && e.Role?.idRole !== 1) : (employeesRes?.data && Array.isArray(employeesRes.data) ? employeesRes.data.filter(e => e.status && e.Role?.idRole !== 1) : []);
                    const finalProviders = Array.isArray(providersRes) ? providersRes.filter(p => p.status) : (providersRes?.data && Array.isArray(providersRes.data) ? providersRes.data.filter(p => p.status) : []);

                    setProductos(finalProducts);
                    setEmpleadosList(finalEmployees);
                    setProvidersList(finalProviders);
                    console.log("DEBUG_MASTER: loadAllMasterData - Estados de listas (productos, empleados, providers) actualizados.");

                    setMasterDataFullyLoaded(true); // <--- PUNTO CRÍTICO
                    console.log("DEBUG_MASTER: loadAllMasterData - !!! masterDataFullyLoaded establecido en true !!!");
                } else {
                    console.log("DEBUG_MASTER: loadAllMasterData - Promise.all RESUELTO pero el componente ya NO ESTÁ MONTADO.");
                }
            } catch (error) { 
                if (isMounted) {
                    toast.error("Error crítico cargando datos maestros esenciales.");
                    console.error("DEBUG_MASTER: loadAllMasterData - CATCH ERROR:", error);
                    // Considerar si aquí se debe hacer algo más, como reintentar o mostrar un error persistente.
                    // Por ahora, masterDataFullyLoaded se queda en false, lo que causa el spinner infinito,
                    // lo cual es un indicador de que la app no puede continuar.
                } else {
                    console.error("DEBUG_MASTER: loadAllMasterData - CATCH ERROR pero el componente ya NO ESTÁ MONTADO:", error);
                }
            } finally { 
                if (isMounted) {    
                    setIsLoadingProductos(false); 
                    setIsLoadingEmpleados(false); 
                    setIsLoadingProviders(false); 
                    console.log("DEBUG_MASTER: loadAllMasterData - FINALLY. Estados de carga individuales puestos en false.");
                } else {
                    console.log("DEBUG_MASTER: loadAllMasterData - FINALLY pero el componente ya NO ESTÁ MONTADO.");
                }
            }
        };

        loadAllMasterData();
    } else {
        console.log("DEBUG_MASTER: masterDataFullyLoaded ya es true, no se cargan datos maestros.");
        // Si masterDataFullyLoaded es true, los loaders individuales deberían estar en false.
        // Esto es para cubrir el caso donde se entra al efecto, masterDataFullyLoaded es true, pero los loaders no se resetearon.
        // Normalmente el finally del primer load se encarga, pero por si acaso:
        if (isLoadingProductos) setIsLoadingProductos(false);
        if (isLoadingEmpleados) setIsLoadingEmpleados(false);
        if (isLoadingProviders) setIsLoadingProviders(false);
    }

    return () => { 
        isMounted = false; 
        console.log("DEBUG_MASTER: useEffect para datos maestros - Cleanup (componente desmontado o antes de re-ejecutar).");
    };
}, [masterDataFullyLoaded, isLoadingProductos, isLoadingEmpleados, isLoadingProviders]); // Añadir los loaders individuales a las dependencias por si se quiere resetearlos si masterDataFullyLoaded ya es true

    const updateSpecSheetAndProcesses = useCallback(async (productIdParam, specSheetIdFromFormParams) => { // Renombrar params para evitar shadowing
        if (!currentViewedOrderId || !activeOrders[currentViewedOrderId]) { return; } // Usar currentViewedOrderId del contexto
        
        const orderForUpdate = activeOrders[currentViewedOrderId]; // Usar el estado actual de la orden del contexto
        setIsLoadingFichas(true);
        let specSheetToUse = null;
        try {
            let errorMsg = null;
            if (specSheetIdFromFormParams) {
                specSheetToUse = await specSheetService.getSpecSheetById(specSheetIdFromFormParams);
                if (!specSheetToUse) errorMsg = "Ficha técnica no encontrada.";
            } else if (productIdParam) {
                const sheets = await specSheetService.getSpecSheetsByProductId(productIdParam);
                if (sheets?.length) specSheetToUse = sheets.find(s => s.status || s.active) || sheets[0];
                if (!specSheetToUse) errorMsg = "Producto sin ficha técnica activa asignada.";
            }
            
            const newStepsArray = specSheetToUse?.specSheetProcesses?.length 
                ? specSheetToUse.specSheetProcesses
                    .sort((a,b)=>(a.processOrder||0)-(b.processOrder||0))
                    .map(p=>({
                        idProductionOrderDetail:null,
                        idProcess:String(p.process?.idProcess||p.idProcess||p.idProcessSnapshot||p.masterProcessData?.idProcess||''),
                        processOrder:p.processOrder,
                        processName:p.processNameOverride||p.process?.processName||p.masterProcessData?.processName||'Proceso Desconocido',
                        processDescription:p.processDescriptionOverride||p.process?.description||p.masterProcessData?.description||'Sin descripción detallada.',
                        idEmployee:'',
                        startDate:'',
                        endDate:'',
                        status:'PENDING',
                        statusDisplay:'Pendiente',
                        observations:'',
                        estimatedTimeMinutes:p.estimatedTimeMinutes||p.process?.estimatedTimeMinutes||p.masterProcessData?.estimatedTimeMinutes||null,
                        isNewStep:true 
                    })) 
                : [];

            updateOrderState(currentViewedOrderId, { // Usar currentViewedOrderId del contexto
                formOrder:{...orderForUpdate.formOrder, idProduct:productIdParam||orderForUpdate.formOrder.idProduct, idSpecSheet:specSheetToUse?.idSpecSheet?.toString()||''},
                selectedSpecSheetData:specSheetToUse,
                processSteps:newStepsArray,
                activeStepIndex: newStepsArray.length > 0 ? 0 : null,
                formErrors:{...(orderForUpdate.formErrors||{}),idSpecSheet:errorMsg}
            });

            if (errorMsg && productIdParam) toast.info(errorMsg, {icon:"ℹ️"});
            else if (specSheetToUse && !errorMsg) toast.success("Ficha técnica cargada.", {icon:"📄"});

        } catch (err) { 
            toast.error("Error al cargar la ficha técnica."); 
            updateOrderState(currentViewedOrderId,{selectedSpecSheetData:null,processSteps:[],formOrder:{...orderForUpdate.formOrder,idSpecSheet:''},formErrors:{...(orderForUpdate.formErrors||{}),idSpecSheet:"Error al cargar ficha."}});
        } finally { 
            setIsLoadingFichas(false); 
        }
    }, [currentViewedOrderId, activeOrders, updateOrderState]); // Dependencias actualizadas

    useEffect(() => {
        // Usar las variables desestructuradas formOrder, selectedSpecSheetData
        if (!formOrder || isLoadingFichas || !masterDataFullyLoaded) return;
        const { idProduct: currentIdProduct, idSpecSheet: currentIdSpecSheet } = formOrder; // Renombrar para claridad
        const specSheetIdInState = selectedSpecSheetData?.idSpecSheet || selectedSpecSheetData?.id;
        
        if (currentIdProduct && (!currentIdSpecSheet || String(selectedSpecSheetData?.product?.idProduct) !== String(currentIdProduct))) {
            if (String(specSheetIdInState) !== String(currentIdSpecSheet) || !selectedSpecSheetData || String(selectedSpecSheetData?.product?.idProduct) !== String(currentIdProduct) ) {
                 updateSpecSheetAndProcesses(currentIdProduct, null);
            }
        } else if (currentIdSpecSheet && String(specSheetIdInState) !== String(currentIdSpecSheet)) {
            updateSpecSheetAndProcesses(currentIdProduct, currentIdSpecSheet);
        } else if (!currentIdProduct && selectedSpecSheetData) {
            updateOrderState(currentViewedOrderId, {selectedSpecSheetData:null,processSteps:[],formOrder:{...formOrder,idSpecSheet:''}});
        }
    }, [currentViewedOrderId, formOrder, selectedSpecSheetData, isLoadingFichas, masterDataFullyLoaded, updateSpecSheetAndProcesses, updateOrderState]); // Dependencias actualizadas

    const handleChangeOrderForm = useCallback((e) => {
        if (isSaving || !currentViewedOrderId) return; // formOrder ya está en el scope
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        let newFormOrderState = { ...formOrder, [name]: val }; // Usar formOrder desestructurado
        
        if (name === 'inputInitialWeight' && val && !newFormOrderState.inputInitialWeightUnit) {
            newFormOrderState.inputInitialWeightUnit = 'kg'; 
        }

        if (name === 'idProduct') {
            const prod = productos.find(p => String(p.idProduct) === String(val));
            newFormOrderState.productNameSnapshot = prod ? prod.productName : '';
            newFormOrderState.idSpecSheet = '';
            updateOrderState(currentViewedOrderId, {
                formOrder:newFormOrderState,
                selectedSpecSheetData:null, 
                processSteps:[], 
                formErrors:{...(currentOrderData.formErrors||{}),idProduct:null,idSpecSheet:null} // currentOrderData.formErrors es OK aquí para tomar el estado anterior
            });
            return;
        }
        updateOrderState(currentViewedOrderId, { formOrder: newFormOrderState, formErrors:{...(currentOrderData.formErrors||{}), [name]:null}});
    }, [formOrder, isSaving, productos, updateOrderState, currentViewedOrderId, currentOrderData?.formErrors]); // Dependencias actualizadas

    const validateFormForSave = useCallback((validationType = 'FULL_SETUP') => {
        if (!currentViewedOrderId) return false; // formOrder, selectedSpecSheetData, processSteps ya están en scope
        let errors = {};
        
        if (!formOrder.idProduct) errors.idProduct = "Producto es obligatorio.";
        if (!formOrder.idEmployeeRegistered) errors.idEmployeeRegistered = "Quién registra es obligatorio.";
        if (!formOrder.initialAmount || parseFloat(formOrder.initialAmount) <= 0) errors.initialAmount = "Cantidad a producir debe ser > 0.";
        if (!formOrder.orderDate) errors.orderDate = "Fecha de pedido es obligatoria.";
        if (!formOrder.inputInitialWeight || parseFloat(formOrder.inputInitialWeight) <= 0) errors.inputInitialWeight = "Peso bruto inicial (> 0) es obligatorio.";
        if (!formOrder.inputInitialWeightUnit) errors.inputInitialWeightUnit = "Unidad para peso bruto es obligatoria.";

        if (validationType === 'SETUP_COMPLETED' || validationType === 'PRODUCTION') {
            const productDetails = productos.find(p => String(p.idProduct) === String(formOrder.idProduct));
            const productRequiresSheet = productDetails?.specSheetCount > 0 || productDetails?.hasSpecSheets;
            if (productRequiresSheet && (!formOrder.idSpecSheet || !selectedSpecSheetData)) {
                errors.idSpecSheet = "Este producto requiere una ficha técnica válida.";
            }
            if (productRequiresSheet && processSteps && processSteps.length > 0) {
                const unassignedStep = processSteps.find(step => !step.idEmployee);
                if (unassignedStep) {
                    errors.processStepsValidation = `El paso "${unassignedStep.processName}" requiere un empleado asignado para validar la configuración.`;
                }
            }
        }
        
        updateOrderState(currentViewedOrderId, { formErrors: { ...(currentOrderData.formErrors || {}), ...errors } });
        if (Object.keys(errors).length > 0) { 
            toast.error(Object.values(errors)[0] || "Corrija los errores del formulario.", { duration: 4000 }); 
            return false; 
        }
        return true;
    }, [formOrder, selectedSpecSheetData, processSteps, productos, updateOrderState, currentViewedOrderId, currentOrderData?.formErrors]); // Dependencias actualizadas

    const handleSaveNewDraft = useCallback(async () => {
        // isNewForForm, localOrderStatus, formOrder, orderId (ID temporal) ya están en scope
        if (!isNewForForm || localOrderStatus !== 'PENDING' || (isSaving || isProcessingAction) || !currentViewedOrderId) return false;
        
        if (!validateFormForSave('DRAFT_NEW')) return false; 
        
        setIsSaving(true); const toastId = toast.loading("Guardando Borrador...");
        const productName = formOrder.productNameSnapshot || (productos.find(p=>String(p.idProduct)===String(formOrder.idProduct))?.productName);
        
        const payload = {
            idProduct:formOrder.idProduct||null, 
            idSpecSheet: null,
            initialAmount:parseFloat(formOrder.initialAmount)||0,
            orderDate:formOrder.orderDate||null, 
            idEmployeeRegistered:formOrder.idEmployeeRegistered||null,
            idProvider:formOrder.idProvider||null, 
            observations:formOrder.observations||null,
            status: 'PENDING', 
            productNameSnapshot: productName,
            inputInitialWeight: formOrder.inputInitialWeight ? parseFloat(formOrder.inputInitialWeight) : null, 
            inputInitialWeightUnit: formOrder.inputInitialWeightUnit || null,
        };
        
        Object.keys(payload).forEach(k=>{if(payload[k]==='')payload[k]=null;});
        
        try {
            const res = await productionOrderService.createProductionOrder(payload);
            const transformed = transformFetchedOrderToContextFormat(res);
            if(transformed){ 
                updateOrderState(orderId, transformed, transformed.id); // Usar orderId (temporal) y reemplazar con el real de transformed.id
                toast.success("Borrador guardado. Configure los procesos si es necesario y luego valide para iniciar.", {id:toastId, duration: 5000}); 
                return true; 
            }
            else throw new Error("Respuesta inválida del servidor al crear borrador.");
        } catch (err) { 
            toast.error(err.response?.data?.message||err.message||"Error guardando el borrador.",{id:toastId}); 
            if(err.response?.data?.errors){const errs=err.response.data.errors.reduce((a,e)=>({...a,[e.path||e.field||'general']:e.msg}),{});updateOrderState(currentViewedOrderId,{formErrors:{...(currentOrderData.formErrors||{}),...errs}});} 
            return false; 
        }
        finally { setIsSaving(false); }
    }, [isNewForForm, localOrderStatus, formOrder, orderId, isSaving, isProcessingAction, productos, validateFormForSave, transformFetchedOrderToContextFormat, updateOrderState, currentViewedOrderId, currentOrderData?.formErrors]); // Dependencias actualizadas

    const handleUpdateExistingOrder = useCallback(async (intendedFinalStatus = null) => {
        // isNewForForm, localOrderStatus, formOrder, orderId, selectedSpecSheetData, processSteps (como frontendProcessSteps) ya en scope
        if (isNewForForm || (isSaving || isProcessingAction) || !currentViewedOrderId) return false;
        
        let targetStatusForSave = intendedFinalStatus || localOrderStatus;
        let validationProfile = (targetStatusForSave === 'SETUP_COMPLETED' || localOrderStatus === 'SETUP_COMPLETED') ? 'SETUP_COMPLETED' : 'FULL_SETUP';
        if (targetStatusForSave === 'IN_PROGRESS') validationProfile = 'PRODUCTION';

        if (!validateFormForSave(validationProfile)) return false;
        
        setIsSaving(true); const toastId = toast.loading( intendedFinalStatus === 'SETUP_COMPLETED' ? "Validando configuración..." : "Guardando cambios...");
        const payload = {
            idProduct:formOrder.idProduct||null, 
            idSpecSheet:selectedSpecSheetData?.idSpecSheet?.toString()||formOrder.idSpecSheet||null,
            initialAmount:parseFloat(formOrder.initialAmount)||0, 
            inputInitialWeight:formOrder.inputInitialWeight?parseFloat(formOrder.inputInitialWeight):null,
            inputInitialWeightUnit:formOrder.inputInitialWeightUnit||null, 
            orderDate:formOrder.orderDate||null,
            idEmployeeRegistered:formOrder.idEmployeeRegistered||null, 
            idProvider:formOrder.idProvider||null,
            observations:formOrder.observations||null, 
            status:targetStatusForSave,
            productNameSnapshot: formOrder.productNameSnapshot || (productos.find(p=>String(p.idProduct)===String(formOrder.idProduct))?.productName),
        };

        if ( targetStatusForSave === 'SETUP_COMPLETED' && selectedSpecSheetData?.specSheetProcesses?.length > 0 ) {
            const stepsFromSheet = selectedSpecSheetData.specSheetProcesses.sort((a,b)=>(a.processOrder||0)-(b.processOrder||0));
            payload.productionOrderDetails = stepsFromSheet.map(sheetStep => {
                const matchingFrontendStep = processSteps?.find( // processSteps es el del scope (frontendProcessSteps)
                    fs => (fs.idProcess && String(fs.idProcess) === String(sheetStep.process?.idProcess || sheetStep.idProcess || sheetStep.idProcessSnapshot || sheetStep.masterProcessData?.idProcess)) || 
                          (fs.processOrder === sheetStep.processOrder && fs.isNewStep)
                );
                return {
                    idProductionOrderDetail: matchingFrontendStep?.idProductionOrderDetail || null, 
                    idProcess: String(sheetStep.process?.idProcess||sheetStep.idProcess||sheetStep.idProcessSnapshot||sheetStep.masterProcessData?.idProcess||''),
                    processOrder: sheetStep.processOrder,
                    processNameSnapshot: sheetStep.processNameOverride||sheetStep.process?.processName||sheetStep.masterProcessData?.processName||'Proceso Desconocido',
                    processDescriptionSnapshot: sheetStep.processDescriptionOverride||sheetStep.process?.description||sheetStep.masterProcessData?.description||'Sin descripción.',
                    idEmployeeAssigned: matchingFrontendStep?.idEmployee || null, 
                    observations: matchingFrontendStep?.observations || '',
                    status: matchingFrontendStep?.status || 'PENDING',
                };
            });
        }
        Object.keys(payload).forEach(k=>{if(payload[k]==='')payload[k]=null;});
        
        try {
            const res = await productionOrderService.updateProductionOrder(orderId, payload); // orderId es el ID actual de la orden
            const transformed = transformFetchedOrderToContextFormat(res);
            if(transformed){
                updateOrderState(orderId, transformed, transformed.id); // Usar orderId y el nuevo transformed.id si cambia (no debería)
                let msg = "Cambios guardados.";
                if(transformed.localOrderStatus==='SETUP'){msg="Configuración guardada. Puede asignar empleados a los pasos y luego validar.";}
                else if(transformed.localOrderStatus==='SETUP_COMPLETED'){
                    msg="Configuración validada. Lista para iniciar producción."; 
                    if(!transformed.processSteps?.length) {
                        setShowFinalizationFields(true);
                        toast.info("Orden sin procesos. Ingrese datos de finalización.", {icon:"✍️", duration: 4000});
                    }
                }
                else if(transformed.localOrderStatus==='IN_PROGRESS'){msg="Progreso guardado. Producción en curso.";}
                toast.success(msg,{id:toastId, duration: 4000}); return true;
            } else throw new Error("Respuesta inválida del servidor al actualizar la orden.");
        } catch (err) { 
            toast.error(err.response?.data?.message||err.message||"Error guardando los cambios de la orden.",{id:toastId}); 
            if(err.response?.data?.errors){const errs=err.response.data.errors.reduce((a,e)=>({...a,[e.path||e.field||'general']:e.msg}),{});updateOrderState(currentViewedOrderId,{formErrors:{...(currentOrderData.formErrors||{}),...errs}});} 
            return false; 
        }
        finally { setIsSaving(false); }
    }, [isNewForForm, localOrderStatus, formOrder, orderId, selectedSpecSheetData, processSteps, isSaving, isProcessingAction, productos, validateFormForSave, transformFetchedOrderToContextFormat, updateOrderState, currentViewedOrderId, setShowFinalizationFields, currentOrderData?.formErrors]); // Dependencias actualizadas
        
    const openCancelModal = useCallback(() => {
        // currentOrderData ya está en scope
        if (currentOrderData) { setOrderToCancelInfo({ id: orderId, displayName: currentOrderData.orderNumberDisplay || `ID ${orderId}` }); setIsCancelModalOpen(true); }
    }, [currentOrderData, orderId]); // Dependencias actualizadas

    const handleConfirmCancelOrder = useCallback(async (reason) => {
        if (!orderToCancelInfo || !reason || !currentViewedOrderId) return;
        setIsProcessingAction(true); const toastId = toast.loading("Cancelando orden...");
        try {
            if (String(orderToCancelInfo.id).startsWith('NEW_')) { removeOrder(orderToCancelInfo.id); toast.success("Borrador descartado.", { id: toastId }); }
            else {
                const updated = await productionOrderService.changeProductionOrderStatus(orderToCancelInfo.id, 'CANCELLED', { observations: reason });
                const transformed = transformFetchedOrderToContextFormat(updated);
                if (transformed) {
                    if (currentViewedOrderId === orderToCancelInfo.id) { updateOrderState(orderToCancelInfo.id, transformed); addOrFocusOrder(null, false, { navigateIfNeeded: true }); }
                    else updateOrderState(orderToCancelInfo.id, transformed);
                    toast.success(`Orden ${orderToCancelInfo.displayName} cancelada.`, { id: toastId });
                } else throw new Error("Respuesta inválida al cancelar la orden.");
            }
            setIsCancelModalOpen(false); setOrderToCancelInfo(null);
        } catch (error) { toast.error(error.response?.data?.message || "Error al cancelar la orden.", { id: toastId }); }
        finally { setIsProcessingAction(false); }
    }, [orderToCancelInfo, currentViewedOrderId, removeOrder, addOrFocusOrder, updateOrderState, transformFetchedOrderToContextFormat]);

    const handleSaveStep = useCallback(async (stepIndex, changesToSave) => {
        // processSteps, isProcessingAction, currentViewedOrderId, isNewForForm, orderId ya en scope
        if (!processSteps?.[stepIndex] || isProcessingAction || !currentViewedOrderId) { 
            if (isNewForForm) toast.info("Guarde la orden principal primero para gestionar detalles de pasos."); 
            return false; 
        }
        const step = processSteps[stepIndex];

        if (!step.idProductionOrderDetail) { 
            const newSteps = processSteps.map((s, i) => i === stepIndex ? { ...s, ...changesToSave } : s); 
            updateOrderState(currentViewedOrderId, { processSteps: newSteps }); 
            toast.info(`Cambios en "${step.processName}" (paso nuevo) se aplicaron localmente. Guarde la orden para persistir.`,{icon:"📝", duration: 4000}); 
            return true; 
        }

        setIsProcessingAction(true); const tId = toast.loading(`Guardando cambios en "${step.processName}"...`);
        try {
            const payload = {
                idEmployeeAssigned: changesToSave.idEmployeeAssigned !== undefined ? changesToSave.idEmployeeAssigned : step.idEmployee,
                startDate: changesToSave.startDate !== undefined ? changesToSave.startDate : step.startDate,
                endDate: changesToSave.endDate !== undefined ? changesToSave.endDate : step.endDate,
                status: changesToSave.status !== undefined ? changesToSave.status : step.status,
                observations: changesToSave.observations !== undefined ? changesToSave.observations : step.observations,
            };
            Object.keys(payload).forEach(k => {if(payload[k]==='')payload[k]=null;});

            const res = await productionOrderService.updateProductionOrderStep(orderId, step.idProductionOrderDetail, payload);
            const transformed = transformFetchedOrderToContextFormat(res.order || res); 
            if(transformed){
                updateOrderState(currentViewedOrderId,transformed);
                toast.success(`Cambios en "${step.processName}" guardados.`,{id:tId});
                return true;
            }
            else throw new Error("Respuesta inválida al guardar el detalle del paso.");
        } catch (err) { 
            toast.error(err.response?.data?.message||`Error guardando "${step.processName}".`,{id:tId}); 
            return false; 
        }
        finally { setIsProcessingAction(false); }
    }, [processSteps, isProcessingAction, currentViewedOrderId, isNewForForm, orderId, updateOrderState, transformFetchedOrderToContextFormat]); // Dependencias

    const handleEmployeeSelectionForStep = useCallback((stepIndex, newEmployeeId) => {
        // processSteps, isProcessingAction, currentViewedOrderId, isNewForForm, empleadosList ya en scope
        if (!processSteps?.[stepIndex] || isProcessingAction || !currentViewedOrderId) return;
        
        const step = processSteps[stepIndex];
        const emp = empleadosList.find(e => String(e.idEmployee) === String(newEmployeeId));
        selectedEmployeeTemp.current = { stepIndex, newEmployeeId, oldEmployeeId: step.idEmployee, processName:step.processName, employeeName:emp?.fullName||'Desconocido'};
        
        const updatedSteps = processSteps.map((s, i) => 
            i === stepIndex ? { ...s, idEmployee: newEmployeeId || '', isNewStep: s.isNewStep || !s.idProductionOrderDetail } : s
        );
        updateOrderState(currentViewedOrderId, { processSteps: updatedSteps });

        if(newEmployeeId){
            if (!isNewForForm && step.idProductionOrderDetail) {
                setConfirmEmployeeModalOpen(true);
            } else {
                toast.info(`${emp?.fullName||'Desconocido'} pre-asignado a "${step.processName}". Los cambios se guardarán con la orden.`, { icon: "ℹ️", duration: 4000 });
                selectedEmployeeTemp.current = {};
            }
        } else { 
            if (!isNewForForm && step.idProductionOrderDetail) {
                handleSaveStep(stepIndex, { idEmployeeAssigned: null, status: 'PENDING' });
            } else {
                toast.info(`Empleado desasignado de "${step.processName}". Se guardará con la orden.`,{icon:"ℹ️", duration: 4000});
            }
            selectedEmployeeTemp.current={};
        }
    }, [processSteps, isProcessingAction, currentViewedOrderId, isNewForForm, empleadosList, updateOrderState, handleSaveStep]); // Dependencias

    const confirmEmployeeAssignment = useCallback(async () => {
        // processSteps, isProcessingAction, currentViewedOrderId ya en scope
        if (selectedEmployeeTemp.current.stepIndex === undefined || isProcessingAction || !currentViewedOrderId) return;
        
        const {stepIndex, newEmployeeId, employeeName, processName, oldEmployeeId } = selectedEmployeeTemp.current;
        setConfirmEmployeeModalOpen(false);
        
        const success = await handleSaveStep(stepIndex, { 
            idEmployeeAssigned: newEmployeeId, 
            status: processSteps[stepIndex].status === 'COMPLETED' ? 'COMPLETED' : 'PENDING' 
        });

        if(success) toast.success(`${employeeName} asignado a "${processName}".`);
        else {
            const revertedSteps = processSteps.map((s, i) => 
                i === stepIndex ? { ...s, idEmployee: oldEmployeeId } : s
            );
            updateOrderState(currentViewedOrderId, { processSteps: revertedSteps });
            toast.error(`No se pudo asignar a ${employeeName} a "${processName}".`);
        }
        selectedEmployeeTemp.current = {};
    }, [processSteps, isProcessingAction, currentViewedOrderId, updateOrderState, handleSaveStep]); // Dependencias

    const handleSaveOrderStatusChange = useCallback(async (newStatus, reason = null) => {
        // isProcessingAction, isNewForForm, currentViewedOrderId, orderId ya en scope
        if (isProcessingAction||isNewForForm||!currentViewedOrderId) {if(isNewForForm)toast.error("Guarde la orden primero antes de cambiar su estado global.");return false;}
        setIsProcessingAction(true); const tId=toast.loading(`Actualizando estado a ${newStatus}...`);
        try {
            const payload = reason ? { observations: reason } : {};
            const updated = await productionOrderService.changeProductionOrderStatus(orderId, newStatus, payload);
            const transformed = transformFetchedOrderToContextFormat(updated);
            if(transformed){updateOrderState(currentViewedOrderId,transformed);toast.success(`Estado de la orden actualizado a ${transformed.localOrderStatusDisplay||newStatus}.`,{id:tId});if(newStatus==='CANCELLED'||newStatus==='COMPLETED')setShowFinalizationFields(false);return true;}
            else throw new Error("Respuesta inválida del servidor al cambiar estado de la orden.");
        } catch(err){toast.error(err.response?.data?.message||"Error cambiando estado de la orden.",{id:tId});return false;}
        finally{setIsProcessingAction(false);}
    }, [isProcessingAction, isNewForForm, currentViewedOrderId, orderId, updateOrderState, transformFetchedOrderToContextFormat]); // Dependencias

    const handleAttemptStartProduction = useCallback(async () => {
        // isSaving, isProcessingAction, isNewForForm, localOrderStatus, processSteps ya en scope
        if((isSaving||isProcessingAction) || isNewForForm || localOrderStatus !== 'SETUP_COMPLETED'){
            if(isNewForForm) toast.error("Guarde el borrador primero.");
            else if (localOrderStatus !== 'SETUP_COMPLETED') toast.error("La orden debe estar con la configuración validada para iniciar.");
            return false;
        }
        
        if(!processSteps?.length){
            toast.info("Orden sin procesos. Se marcará para finalización directa.",{icon:"ℹ️"});
            const ok=await handleSaveOrderStatusChange('ALL_STEPS_COMPLETED');
            if(ok)setShowFinalizationFields(true);
            return ok;
        }
        
        const ok=await handleSaveOrderStatusChange('IN_PROGRESS'); 
        if(ok)toast.success("Producción iniciada.",{icon:"▶️"});
        return ok;
    }, [isSaving, isProcessingAction, isNewForForm, localOrderStatus, processSteps, handleSaveOrderStatusChange, setShowFinalizationFields]); // Dependencias

    const handleStartCurrentStep = useCallback(async () => {
        // currentActiveStepFromContext, isProcessingAction, isNewForForm, currentViewedOrderId, orderId ya en scope
        if(!currentActiveStepFromContext||isProcessingAction||isNewForForm||!currentViewedOrderId)return;
        const step = currentActiveStepFromContext;
        if(!step.idEmployee){toast.error(`Debe asignar un empleado al paso "${step.processName}" para iniciarlo.`);return;}
        if(step.status!=='PENDING'&&step.status!=='PAUSED'){toast.warn(`El paso "${step.processName}" no está pendiente o pausado.`);return;}
        if(!step.idProductionOrderDetail){toast.error("Error: El detalle del proceso no tiene ID. Guarde la orden con la ficha técnica para generar los detalles de procesos.");return;}
        
        setIsProcessingAction(true); const tId=toast.loading(`Iniciando paso "${step.processName}"...`);
        try{
            const res=await productionOrderService.startProductionOrderStep(orderId,step.idProductionOrderDetail,{startDate:step.startDate||new Date().toISOString().slice(0,16)});
            const transformed=transformFetchedOrderToContextFormat(res.order||res);
            if(transformed){updateOrderState(currentViewedOrderId,transformed);toast.success(`Paso "${step.processName}" iniciado.`,{id:tId});}
            else throw new Error("Respuesta inválida del servidor al iniciar el paso.");
        }catch(err){toast.error(err.response?.data?.message||`Error al iniciar el paso "${step.processName}".`,{id:tId});}
        finally{setIsProcessingAction(false);}
    }, [currentActiveStepFromContext, isProcessingAction, isNewForForm, currentViewedOrderId, orderId, updateOrderState, transformFetchedOrderToContextFormat]); // Dependencias

    const handleCompleteCurrentStep = useCallback(async () => {
        // currentActiveStepFromContext, activeStepIndex (del currentOrderData), isProcessingAction, isNewForForm, currentViewedOrderId, orderId ya en scope
        if(!currentActiveStepFromContext||isProcessingAction||isNewForForm||!currentViewedOrderId)return;
        const step=currentActiveStepFromContext;
        if(step.status!=='IN_PROGRESS'){toast.error(`El paso "${step.processName}" no está en progreso.`);return;}
        if(!step.startDate){toast.error(`El paso "${step.processName}" no tiene fecha de inicio registrada.`);return;}
        if(!step.idEmployee){toast.error(`El paso "${step.processName}" no tiene un empleado asignado.`);return;}
        if(!step.idProductionOrderDetail){toast.error("Error: El detalle del proceso no tiene ID.");return;}
        
        let endDate=step.endDate?new Date(step.endDate):new Date(); 
        if(new Date(endDate)<new Date(step.startDate))endDate=new Date();
        
        setIsProcessingAction(true);const tId=toast.loading(`Completando paso "${step.processName}"...`);
        try{
            const res=await productionOrderService.completeProductionOrderStep(orderId,step.idProductionOrderDetail,{endDate:endDate.toISOString().slice(0,16),observations:step.observations||null});
            const transformed=transformFetchedOrderToContextFormat(res.order||res);
            if(transformed){
                updateOrderState(currentViewedOrderId,transformed);
                if(transformed.localOrderStatus==='ALL_STEPS_COMPLETED'){
                    toast.success("¡Todos los procesos han sido completados!",{id:tId,icon:"🎉"});
                    setShowFinalizationFields(true);
                } else if(transformed.activeStepIndex!==null && transformed.activeStepIndex !== activeStepIndex){
                    toast.success(`Paso "${step.processName}" completado. Siguiente paso activo.`,{id:tId,icon:"👍"});
                } else {
                    toast.success(`Paso "${step.processName}" completado.`,{id:tId,icon:"✔️"});
                }
            }
            else throw new Error("Respuesta inválida del servidor al completar el paso.");
        }catch(err){toast.error(err.response?.data?.message||`Error completando el paso "${step.processName}".`,{id:tId});}
        finally{setIsProcessingAction(false);}
    }, [currentActiveStepFromContext, activeStepIndex, isProcessingAction, isNewForForm, currentViewedOrderId, orderId, updateOrderState, transformFetchedOrderToContextFormat, setShowFinalizationFields]); // Dependencias
        
    const handlePrepareFinalization = useCallback(() => {
        // localOrderStatus, selectedSpecSheetData, processSteps, isProcessingAction ya en scope
        if(isProcessingAction)return;
        const baseDataValidated = !!selectedSpecSheetData;
        const canFinalizeNow = (localOrderStatus==='ALL_STEPS_COMPLETED') || 
                               (localOrderStatus==='SETUP_COMPLETED' && baseDataValidated && (!processSteps || processSteps.length === 0));
        if(!canFinalizeNow){
            // ... (mensajes de error)
            return;
        }
        setShowFinalizationFields(true);
        toast.info("Ingrese los datos de finalización de la orden.",{icon:"✍️"});
    }, [localOrderStatus, selectedSpecSheetData, processSteps, isProcessingAction, setShowFinalizationFields]); // Dependencias

    const handleFinalizeAndSaveOrder = useCallback(async () => {
        // formOrder, isProcessingAction, showFinalizationFields, isNewForForm, currentViewedOrderId, orderId ya en scope
        if(isProcessingAction||!showFinalizationFields||isNewForForm||!currentViewedOrderId) {if(isNewForForm)toast.error("Guarde la orden primero.");return;}
        let errors={};
        if(formOrder.finalQuantityProduct===undefined||formOrder.finalQuantityProduct===null||formOrder.finalQuantityProduct===''||parseFloat(formOrder.finalQuantityProduct)<=0)errors.finalQuantityProduct="Cantidad final del producto (>0) es requerida.";
        updateOrderState(currentViewedOrderId,{formErrors:{...(currentOrderData.formErrors||{}),...errors}});
        if(Object.keys(errors).length>0){toast.error(Object.values(errors)[0]);return;}

        setIsProcessingAction(true);const tId=toast.loading("Finalizando orden de producción...");
        const payload={
            finalQuantityProduct:parseFloat(formOrder.finalQuantityProduct),
            finishedProductWeight:formOrder.finishedProductWeight?parseFloat(formOrder.finishedProductWeight):null,
            finishedProductWeightUnit:formOrder.finishedProductWeightUnit||null,
            inputFinalWeightUnused:formOrder.inputFinalWeightUnused?parseFloat(formOrder.inputFinalWeightUnused):null,
            inputFinalWeightUnusedUnit:formOrder.inputFinalWeightUnusedUnit||null,
            observations:formOrder.observations||null
        };
        try{
            const finalized=await productionOrderService.finalizeProductionOrder(orderId,payload);
            const transformed=transformFetchedOrderToContextFormat(finalized);
            if(transformed){
                updateOrderState(currentViewedOrderId,transformed);
                setShowFinalizationFields(false);
                toast.success(`¡Orden ${transformed.orderNumberDisplay||transformed.id} finalizada exitosamente!`,{id:tId,icon:"🏆"});
            }
            else throw new Error("Respuesta inválida del servidor al finalizar la orden.");
        }catch(err){toast.error(err.response?.data?.message||"Error al finalizar la orden de producción.",{id:tId});}
        finally{setIsProcessingAction(false);}
    }, [formOrder, isProcessingAction, showFinalizationFields, isNewForForm, currentViewedOrderId, orderId, updateOrderState, transformFetchedOrderToContextFormat, currentOrderData?.formErrors]); // Dependencias

    const handleCancelFinalization = useCallback(() => setShowFinalizationFields(false), [setShowFinalizationFields]);
    
    const handleStepFieldChange = useCallback((stepIndex, fieldName, value) => {
        // processSteps, isProcessingAction, currentViewedOrderId ya en scope
        if (!processSteps?.[stepIndex] || isProcessingAction || !currentViewedOrderId) return;
        const updatedSteps = processSteps.map((s, i) => 
            i === stepIndex ? { ...s, [fieldName]: value, isNewStep: s.isNewStep || !s.idProductionOrderDetail } : s
        );
        updateOrderState(currentViewedOrderId, { processSteps: updatedSteps });
        if (!processSteps[stepIndex].idProductionOrderDetail) {
             toast.info(`Cambio en "${processSteps[stepIndex].processName}" se guardará con la orden.`, { icon: "ℹ️", duration: 3000 });
        }
    }, [processSteps, isProcessingAction, currentViewedOrderId, updateOrderState]); // Dependencias

    const toggleConfirmEmployeeModal = useCallback((isCancelling = false) => {
        // confirmEmployeeModalOpen, processSteps, currentViewedOrderId ya en scope
        if (isCancelling && confirmEmployeeModalOpen && selectedEmployeeTemp.current.stepIndex !== undefined && currentViewedOrderId) {
            const {stepIndex,oldEmployeeId}=selectedEmployeeTemp.current;
            const revertedSteps = processSteps.map((s, i) => 
                i === stepIndex ? { ...s, idEmployee: oldEmployeeId } : s
            );
            updateOrderState(currentViewedOrderId,{ processSteps: revertedSteps });
            toast.info("Asignación de empleado cancelada.",{icon:"ℹ️"});
        }
        setConfirmEmployeeModalOpen(prev => !prev);
        if (isCancelling || !confirmEmployeeModalOpen) selectedEmployeeTemp.current = {};
    }, [confirmEmployeeModalOpen, processSteps, currentViewedOrderId, updateOrderState]); // Dependencias

    const toggleViewSpecSheetModal = useCallback(() => {
        // selectedSpecSheetData, formOrder, isLoadingFichas ya en scope
        if (selectedSpecSheetData) setViewSpecSheetModalOpen(prev => !prev);
        else if (formOrder?.idProduct && !isLoadingFichas) toast.info("El producto seleccionado no tiene una ficha técnica asignada o la ficha está vacía.",{icon:"ℹ️"});
        else if (!formOrder?.idProduct) toast.info("Seleccione un producto para ver su ficha técnica.",{icon:"ℹ️"});
    }, [selectedSpecSheetData, formOrder, isLoadingFichas]); // Dependencias

    // --- Lógica para el Botón Principal Dinámico ---
    let mainButtonConfig = {
        action: null,
        text: "",
        icon: <Save size={16} className="me-1"/>,
        color: "primary",
        disabled: isSaving || isProcessingAction || isOrderViewOnly,
        visible: false
    };

    if (!isOrderViewOnly && !showFinalizationFields) { // usa variables desestructuradas
        mainButtonConfig.visible = true;
        
        const productDetails = productos.find(p => String(p.idProduct) === String(formOrder.idProduct));
        const productRequiresSheet = productDetails?.specSheetCount > 0 || productDetails?.hasSpecSheets;
        const baseDataConsideredValidForButton = 
            (productRequiresSheet ? !!selectedSpecSheetData : true) && 
            formOrder.idProduct && 
            parseFloat(formOrder.initialAmount) > 0 &&
            parseFloat(formOrder.inputInitialWeight) > 0;

        if (isNewForForm && localOrderStatus === 'PENDING') {
            mainButtonConfig.visible = false; 
        } else if (localOrderStatus === 'PENDING' || localOrderStatus === 'SETUP') {
            mainButtonConfig.action = () => handleUpdateExistingOrder('SETUP_COMPLETED');
            mainButtonConfig.text = "Validar e Iniciar Producción";
            mainButtonConfig.icon = <PlayCircle size={16} className="me-1"/>;
            mainButtonConfig.color = "info";
        } else if (localOrderStatus === 'SETUP_COMPLETED' && baseDataConsideredValidForButton) {
            if (!processSteps || processSteps.length === 0) {
                mainButtonConfig.action = async () => { 
                    const success = await handleSaveOrderStatusChange('ALL_STEPS_COMPLETED');
                    if (success) handlePrepareFinalization();
                };
                mainButtonConfig.text = "Proceder a Finalizar (Sin Procesos)";
                mainButtonConfig.icon = <ArrowRightCircle size={16} className="me-1"/>;
            } else {
                mainButtonConfig.action = handleAttemptStartProduction;
                mainButtonConfig.text = "Iniciar Producción";
                mainButtonConfig.icon = <PlayCircle size={16} className="me-1"/>;
                mainButtonConfig.color = "success";
            }
        } else if (localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') {
            mainButtonConfig.action = () => handleUpdateExistingOrder();
            mainButtonConfig.text = "Guardar Progreso de Orden";
            mainButtonConfig.icon = <Save size={16} className="me-1"/>;
        } else if (localOrderStatus === 'ALL_STEPS_COMPLETED') {
             mainButtonConfig.action = handlePrepareFinalization;
             mainButtonConfig.text = "Ingresar Datos de Finalización";
             mainButtonConfig.icon = <ChefHat size={16} className="me-1"/>;
        } else {
            mainButtonConfig.visible = false;
        }
    }
    // --- Fin Lógica Botón Principal ---
    
    const ordenTitulo = (isNewForForm && localOrderStatus === 'PENDING')
        ? "Nuevo Borrador de Orden"
        : (localOrderStatus === 'PENDING' || localOrderStatus === 'SETUP')
            ? `Configurando Orden: ${formOrder?.productNameSnapshot || (formOrder?.idProduct ? 'Cargando...' : 'Producto no definido')}`
            : `Orden: ${currentOrderData.orderNumberDisplay || `ID ${orderId}`}`; // Usar orderId (desestructurado)
    
    return (
        <Container fluid className="p-0 order-production-form-main-container production-module">
            <Toaster position="top-center" toastOptions={{duration:3500,error:{duration:5000}}}/>
            <Form onSubmit={(e)=>e.preventDefault()} className="production-order-form-content">
                
                <OrderBaseFormSection
                    currentOrderData={currentOrderData} // Pasa el objeto completo, el hijo desestructurará lo que necesite
                    handleChangeOrderForm={handleChangeOrderForm}
                    toggleViewSpecSheetModal={toggleViewSpecSheetModal}
                    productos={productos} 
                    isLoadingProductos={isLoadingProductos}
                    empleadosList={empleadosList} 
                    isLoadingEmpleados={isLoadingEmpleados}
                    providersList={providersList} 
                    isLoadingProviders={isLoadingProviders}
                    isSaving={isSaving||isProcessingAction} 
                    isLoadingFichas={isLoadingFichas}
                    isOrderViewOnly={isOrderViewOnly} 
                    ordenTitulo={ordenTitulo} 
                    employeeFieldLabel="Registrada por"
                    isSimplifiedView={isSimplifiedBaseView}
                />

                {isNewForForm && localOrderStatus === 'PENDING' && (
                    <CardFooter className="text-end py-2 px-3 bg-light border-top-0 mb-3">
                        <Button color="success" onClick={handleSaveNewDraft} disabled={isSaving || isProcessingAction} size="sm"><Save size={16} className="me-1"/>Guardar Borrador</Button>
                        <Button color="secondary" outline onClick={openCancelModal} disabled={isSaving || isProcessingAction} size="sm" className="ms-2"><XCircle size={16} className="me-1"/>Descartar</Button>
                    </CardFooter>
                )}
                
                {showLowerSections && (
                    <div className="mt-3">
                        <hr className="my-3"/>
                        <Card className="mb-3 shadow-sm">
                            <CardHeader 
                                onClick={toggleSupplies} 
                                style={{ cursor: 'pointer' }}
                                className="d-flex justify-content-between align-items-center py-2 px-3"
                            >
                                <h6 className="mb-0 d-flex align-items-center">
                                    <Package size={16} className="me-2"/> Insumos Estimados
                                </h6>
                                {isSuppliesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </CardHeader>
                            <Collapse isOpen={isSuppliesOpen}>
                                <CardBody className="p-0">
                                   <EstimatedSuppliesSection
                                        isLoadingFichas={isLoadingFichas} 
                                        selectedSpecSheetData={selectedSpecSheetData} // Usar variable desestructurada
                                        initialAmount={formOrder.initialAmount} // Usar variable desestructurada
                                    />
                                </CardBody>
                            </Collapse>
                        </Card>
                        
                        <ProcessManagementSection
                            currentOrderData={currentOrderData} // Pasa el objeto completo
                            empleadosList={empleadosList} 
                            isLoadingEmpleados={isLoadingEmpleados}
                            handleEmployeeSelectionForStep={handleEmployeeSelectionForStep} 
                            handleStepFieldChange={handleStepFieldChange}
                            handleStartCurrentStep={handleStartCurrentStep} 
                            handleCompleteCurrentStep={handleCompleteCurrentStep}
                            isSaving={isSaving||isProcessingAction} 
                            isOrderViewOnly={isOrderViewOnly} 
                            isLoadingFichas={isLoadingFichas}
                            processViewMode="sidebarWithFocus"
                            />
                        
                        {!isNewForForm && !isOrderViewOnly && !showFinalizationFields && (
                             <Row className="mt-3 g-2 justify-content-end">
                                <Col xs="auto">
                                    <Button color="danger" outline onClick={openCancelModal} disabled={isSaving || isProcessingAction || isOrderViewOnly} size="sm"><XCircle size={16} className="me-1"/> Cancelar Orden</Button>
                                </Col>
                                {mainButtonConfig.visible && mainButtonConfig.action && (
                                    <Col xs="auto">
                                        <Button 
                                            color={mainButtonConfig.color} 
                                            onClick={mainButtonConfig.action} 
                                            disabled={mainButtonConfig.disabled} 
                                            size="sm"
                                        >
                                            {mainButtonConfig.icon}
                                            {mainButtonConfig.text}
                                        </Button>
                                    </Col>
                                )}
                            </Row>
                        )}
                    </div>
                )}

                {showFinalizationFields && !isOrderViewOnly && ( 
                    <OrderFinalizationSection 
                        formOrder={formOrder} // Usar variable desestructurada
                        formErrors={currentOrderData.formErrors} // OK, para tomar el estado anterior de errores
                        handleChangeOrderForm={handleChangeOrderForm} 
                        isSaving={isSaving||isProcessingAction} 
                        onCancelFinalization={handleCancelFinalization}
                        onFinalizeAndSave={handleFinalizeAndSaveOrder}
                    /> 
                )}
                
                 {isOrderViewOnly && (
                     <div className="mt-4 pt-3 border-top text-end">
                        <Button color="secondary" outline onClick={() => addOrFocusOrder(null, false, { navigateIfNeeded: true })} size="sm"><XCircle size={16} className="me-1"/> Cerrar Vista</Button>
                     </div>
                )}
            </Form>

            <ConfirmationModal isOpen={confirmEmployeeModalOpen} toggle={() => toggleConfirmEmployeeModal(true)} onConfirm={confirmEmployeeAssignment} title="Confirmar Asignación de Empleado" confirmText="Sí, Asignar y Guardar" isConfirming={isProcessingAction}>
                {selectedEmployeeTemp.current.stepIndex!==undefined && processSteps?.[selectedEmployeeTemp.current.stepIndex]&&( // Usar processSteps desestructurado
                    <p>¿Asignar a 
                        <strong>{selectedEmployeeTemp.current.employeeName||'?'}</strong> al proceso 
                        <strong>"{processSteps[selectedEmployeeTemp.current.stepIndex].processName}"</strong>?
                        Este cambio se guardará en la base de datos.
                    </p>
                )}
            </ConfirmationModal>
            <ViewSpecSheetModal 
                isOpen={viewSpecSheetModalOpen} 
                toggle={toggleViewSpecSheetModal} 
                specSheetData={selectedSpecSheetData} // Usar variable desestructurada
                isLoading={isLoadingFichas && !selectedSpecSheetData}
            />
            <CancelOrderModal 
                isOpen={isCancelModalOpen} 
                toggle={() => setIsCancelModalOpen(false)} 
                onConfirmCancel={handleConfirmCancelOrder} 
                orderDisplayName={orderToCancelInfo?.displayName} 
                isCancelling={isProcessingAction}
            />
        </Container>
    );
};
export default OrdenProduccionForm;