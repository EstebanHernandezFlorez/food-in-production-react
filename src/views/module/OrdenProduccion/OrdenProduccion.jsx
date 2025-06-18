import React, { useState, useEffect, useRef, useContext, useCallback, useMemo as useReactMemo } from 'react';
import {
    Row, Col, Spinner, Button, Form, Container, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter, ListGroup, ListGroupItem, CardFooter,
    Collapse, Card, CardHeader, CardBody, CardTitle, Input, Label, FormGroup, Badge, FormFeedback,
    InputGroup, FormText
} from 'reactstrap';
import toast, { Toaster } from 'react-hot-toast';
import {
    AlertTriangle, ArrowRightCircle, CheckCircle, ChefHat, ChevronDown, ChevronLeft, ChevronRight,
    Clock, Edit, Eye, FileText, Hash, Info, Loader, Package, PauseCircle, PlayCircle, RotateCcw,
    Save, Scale, Timer as TimerIcon, X, XCircle
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

// =========================================================================
// INICIO: DEFINICIÓN DE COMPONENTES AUXILIARES Y FUNCIONES HELPER
// =========================================================================

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

const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText, confirmColor, isConfirming = false, icons }) => {
    const { AlertTriangleIcon } = icons;
    return ( <Modal isOpen={isOpen} toggle={() => !isConfirming && toggle(false)} centered backdrop="static" keyboard={!isConfirming}><ModalHeader toggle={() => !isConfirming && toggle(false)} className="py-2 px-3"><div className="d-flex align-items-center"><AlertTriangleIcon size={20} className={`text-${confirmColor || 'primary'} me-2`} /><span className="fw-bold small">{title}</span></div></ModalHeader><ModalBody className="py-3 px-3 small">{children}</ModalBody><ModalFooter className="py-2 px-3"><Button size="sm" color="secondary" outline onClick={() => toggle(false)} disabled={isConfirming}>Cancelar</Button><Button size="sm" color={confirmColor || 'primary'} onClick={onConfirm} disabled={isConfirming}>{isConfirming ? <Spinner size="sm"/> : (confirmText || 'Confirmar')}</Button></ModalFooter></Modal> );
};

const ViewSpecSheetModal = ({ isOpen, toggle, specSheetData, isLoading, icons }) => {
    const { FileTextIcon } = icons;
    if (!isOpen) return null; const sheetId = specSheetData?.idSpecSheet || specSheetData?.id || 'N/A'; const supplies = specSheetData?.specSheetSupplies || []; const processes = specSheetData?.specSheetProcesses || []; return ( <Modal isOpen={isOpen} toggle={toggle} size="xl" centered scrollable><ModalHeader toggle={toggle}><div className="d-flex align-items-center"><FileTextIcon size={24} className="me-2 text-info" /><span className="fw-bold">Detalles de Ficha Técnica (ID: {sheetId})</span></div></ModalHeader><ModalBody>{isLoading && <div className="text-center p-5"><Spinner color="primary" /><p className="mt-2 text-muted">Cargando detalles...</p></div>}{!isLoading && !specSheetData && <Alert color="warning" className="text-center">No se han podido cargar los detalles de la ficha.</Alert>}{!isLoading && specSheetData && ( <Row><Col md={5}><Card className="mb-3 shadow-sm"><CardBody><CardTitle tag="h5" className="text-primary border-bottom pb-2 mb-3">Información General</CardTitle><ListGroup flush><ListGroupItem><strong>Producto:</strong> {specSheetData.product?.productName || specSheetData.productNameSnapshot || 'N/A'}</ListGroupItem><ListGroupItem><strong>Versión:</strong> {specSheetData.versionName || '(Sin versión)'}</ListGroupItem><ListGroupItem><strong>Fecha Efectiva:</strong> {specSheetData.dateEffective ? new Date(specSheetData.dateEffective).toLocaleDateString() : 'N/A'}</ListGroupItem><ListGroupItem><strong>Cant. Base:</strong> {specSheetData.quantityBase || 1} {specSheetData.unitOfMeasureBase || specSheetData.unitOfMeasure || 'unidad(es)'}</ListGroupItem><ListGroupItem><strong>Estado:</strong> <span className={`badge bg-${specSheetData.status ? 'success' : 'secondary'}`}>{specSheetData.status ? "Activa" : "Inactiva"}</span></ListGroupItem>{specSheetData.description && <ListGroupItem><strong>Descripción:</strong> {specSheetData.description}</ListGroupItem>}</ListGroup></CardBody></Card></Col><Col md={7}><Card className="mb-3 shadow-sm"><CardBody><CardTitle tag="h5" className="text-success border-bottom pb-2 mb-3">Insumos</CardTitle>{supplies.length > 0 ? ( <ListGroup flush>{supplies.map((ing, idx) => (<ListGroupItem key={idx}><strong>{ing.supply?.supplyName || ing.supplyNameSnapshot || 'Insumo Desconocido'}:</strong> {ing.quantity} {ing.unitOfMeasure}</ListGroupItem>))}</ListGroup> ) : <p className="text-muted fst-italic">No hay insumos definidos.</p>}</CardBody></Card><Card className="shadow-sm mt-3"><CardBody><CardTitle tag="h5" className="text-info border-bottom pb-2 mb-3">Pasos de Elaboración</CardTitle>{processes.length > 0 ? ( <ListGroup flush>{processes.sort((a, b) => (a.processOrder || 0) - (b.processOrder || 0)).map((proc, idx) => (<ListGroupItem key={idx}><strong>Paso {proc.processOrder}: {proc.processNameOverride || proc.process?.processName || proc.masterProcessData?.processName || 'Proceso Desconocido'}</strong><div className="text-muted small ps-2">{proc.processDescriptionOverride || proc.process?.description || proc.masterProcessData?.description || 'Sin descripción.'}</div>{proc.estimatedTimeMinutes && <div className="text-muted small ps-2 fst-italic">Tiempo Estimado: {proc.estimatedTimeMinutes} min.</div>}</ListGroupItem>))}</ListGroup> ) : <p className="text-muted fst-italic">No hay procesos definidos.</p>}</CardBody></Card></Col></Row> )}</ModalBody><ModalFooter><Button color="secondary" outline onClick={toggle}>Cerrar</Button></ModalFooter></Modal> );};

const SpinnerL = ({ children }) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{ minHeight: '200px' }}><Spinner style={{ width: '3rem', height: '3rem' }} color="primary" className="mb-2" /><p className="text-muted mb-0">{children}</p></div>);
const InfoS = ({ children }) => (<div className="d-flex flex-column align-items-center justify-content-center p-3" style={{ minHeight: '200px' }}><Info size={30} className="text-info mb-2" /><p className="text-muted mb-0">{children}</p></div>);
const validateAndPreparePayload = (formOrder, productos, validationType = 'DRAFT') => { const errors = {}; let isValid = true; if (!formOrder.idProduct) { isValid = false; errors.idProduct = 'Debe seleccionar un producto.'; } if (!formOrder.idEmployeeRegistered) { isValid = false; errors.idEmployeeRegistered = 'Debe seleccionar quién registra la orden.'; } if (!formOrder.initialAmount || formOrder.initialAmount.toString().trim() === '') { isValid = false; errors.initialAmount = 'La cantidad a producir es requerida.'; } else if (isNaN(parseFloat(formOrder.initialAmount)) || parseFloat(formOrder.initialAmount) <= 0) { isValid = false; errors.initialAmount = 'La cantidad debe ser un número mayor a cero.'; } if (!formOrder.idProvider) { isValid = false; errors.idProvider = 'Debe seleccionar un proveedor.'; } if (validationType === 'PRODUCTION') { const productoSeleccionado = productos.find(p => String(p.idProduct) === String(formOrder.idProduct)); if (productoSeleccionado && productoSeleccionado.specSheetCount > 0 && !formOrder.idSpecSheet) { isValid = false; errors.idSpecSheet = 'Este producto requiere una ficha técnica para iniciar producción.'; } } if (!isValid) { return { isValid: false, payload: null, errors }; } const payload = { idProduct: formOrder.idProduct || null, idSpecSheet: formOrder.idSpecSheet || null, initialAmount: parseFloat(formOrder.initialAmount), idEmployeeRegistered: formOrder.idEmployeeRegistered || null, idProvider: formOrder.idProvider || null, observations: formOrder.observations || null, status: 'SETUP', productNameSnapshot: formOrder.productNameSnapshot, inputInitialWeight: formOrder.inputInitialWeight || null, inputInitialWeightUnit: (formOrder.inputInitialWeight && parseFloat(formOrder.inputInitialWeight) > 0) ? (formOrder.inputInitialWeightUnit || 'kg') : null, }; Object.keys(payload).forEach(key => { if (payload[key] === '') payload[key] = null; }); return { isValid: true, payload, errors }; };
const CancelOrderModal = ({ isOpen, toggle, onConfirmCancel, orderDisplayName, isCancelling }) => { const [reason, setReason] = useState(''); const handleConfirm = () => { onConfirmCancel(reason); setReason(''); }; return ( <Modal isOpen={isOpen} toggle={() => !isCancelling && toggle()} centered><ModalHeader toggle={() => !isCancelling && toggle()}>Cancelar Orden: {orderDisplayName}</ModalHeader><ModalBody><p>¿Está seguro de que desea cancelar esta orden? Esta acción no se puede deshacer.</p><FormGroup><Label for="cancelReason">Motivo de la cancelación (opcional):</Label><Input id="cancelReason" type="textarea" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isCancelling} /></FormGroup></ModalBody><ModalFooter><Button color="secondary" outline onClick={toggle} disabled={isCancelling}>Volver</Button><Button color="danger" onClick={handleConfirm} disabled={isCancelling}>{isCancelling ? <Spinner size="sm" /> : "Confirmar Cancelación"}</Button></ModalFooter></Modal> );};
const EstimatedSuppliesSection = ({ isLoadingFichas, selectedSpecSheetData, initialAmount }) => { const supplies = selectedSpecSheetData?.specSheetSupplies || []; const baseQuantity = selectedSpecSheetData?.quantityBase || 1; const productionFactor = initialAmount > 0 && baseQuantity > 0 ? initialAmount / baseQuantity : 0; return (<CardBody>{isLoadingFichas && <div className="text-center p-3"><Spinner size="sm" /></div>}{!isLoadingFichas && supplies.length > 0 && (<ListGroup flush>{supplies.map((supply, index) => (<ListGroupItem key={index} className="d-flex justify-content-between align-items-center small"><span>{supply.supply?.supplyName || 'Insumo desconocido'}</span><strong>{(supply.quantity * productionFactor).toFixed(3)} {supply.unitOfMeasure}</strong></ListGroupItem>))}</ListGroup>)}{!isLoadingFichas && supplies.length === 0 && (<p className="text-muted fst-italic p-3 mb-0">No hay insumos definidos para la ficha seleccionada.</p>)}</CardBody>);};
const SimplifiedOrderHeader = ({ orderData, onToggleSpecSheet, icons }) => { if (!orderData) return null; const { InfoIcon, PackageIcon, HashIcon, EyeIcon } = icons; return ( <Card className="mb-3 shadow-sm"><CardHeader className="py-2 px-3 bg-light d-flex justify-content-between align-items-center"><h6 className="mb-0 d-flex align-items-center small"><InfoIcon size={16} className="me-2 text-primary"/>Orden de Producción: {orderData.orderNumberDisplay}</h6><Badge color="warning" pill>{orderData.localOrderStatusDisplay}</Badge></CardHeader><CardBody><Row className="align-items-center"><Col md={6} className="mb-2 mb-md-0"><div className="d-flex align-items-center"><PackageIcon size={24} className="me-3 text-muted" /><div><Label className="small text-muted mb-0">Producto</Label><h5 className="mb-0 fw-bold">{orderData.formOrder.productNameSnapshot || 'N/A'}</h5></div></div></Col><Col md={3} className="mb-2 mb-md-0"><div className="d-flex align-items-center"><HashIcon size={24} className="me-3 text-muted" /><div><Label className="small text-muted mb-0">Cantidad a Producir</Label><h5 className="mb-0">{orderData.formOrder.initialAmount || 'N/A'}</h5></div></div></Col><Col md={3} className="text-md-end">{orderData.selectedSpecSheetData && (<Button color="info" outline size="sm" onClick={onToggleSpecSheet}><EyeIcon size={16} className="me-1"/> Ver Ficha</Button>)}</Col></Row></CardBody></Card> );};
const OrderBaseFormSection = ({ currentOrderData, handleChangeOrderForm, toggleViewSpecSheetModal, productos, empleadosList, providersList, isSaving, isLoadingFichas, selectedSpecSheetData, isOrderViewOnly, ordenTitulo, employeeFieldLabel, availableSpecSheets, masterDataFullyLoaded, isBaseDataLocked, isVerifyingProduct, isSimplifiedView, icons}) => { if (isSimplifiedView) { return <SimplifiedOrderHeader orderData={currentOrderData} onToggleSpecSheet={toggleViewSpecSheetModal} icons={icons} />; } const { EyeIcon } = icons; const { formOrder, formErrors } = currentOrderData; return ( <Card className="mb-3 shadow-sm"><CardHeader className="py-2 px-3 bg-light"><h6 className="mb-0 d-flex align-items-center small">{ordenTitulo}</h6></CardHeader><CardBody><Row><Col md={6}><FormGroup><Label for="idProduct" className="fw-semibold small">Producto <span className="text-danger">*</span></Label><Input id="idProduct" name="idProduct" type="select" value={formOrder.idProduct || ''} onChange={handleChangeOrderForm} invalid={!!formErrors?.idProduct} disabled={isBaseDataLocked || isOrderViewOnly || !masterDataFullyLoaded || isVerifyingProduct}><option value="">{isVerifyingProduct ? "Verificando..." : "Seleccione un producto..."}</option>{productos.map(p => <option key={p.idProduct} value={p.idProduct}>{p.productName}</option>)}</Input><FormFeedback>{formErrors?.idProduct}</FormFeedback></FormGroup></Col><Col md={4}><FormGroup><Label for="idSpecSheet" className="fw-semibold small">Ficha Técnica</Label><Input id="idSpecSheet" name="idSpecSheet" type="select" value={formOrder.idSpecSheet || ''} onChange={handleChangeOrderForm} invalid={!!formErrors?.idSpecSheet} disabled={isBaseDataLocked || isOrderViewOnly || isLoadingFichas || availableSpecSheets.length === 0}>{isLoadingFichas && <option>Cargando fichas...</option>}{!isLoadingFichas && availableSpecSheets.length === 0 && <option>No hay fichas para este producto</option>}{!isLoadingFichas && availableSpecSheets.length > 0 && <option value="">Seleccione una ficha (opcional)</option>}{!isLoadingFichas && availableSpecSheets.map(s => <option key={s.idSpecSheet} value={s.idSpecSheet}>{`${s.versionName || `ID: ${s.idSpecSheet}`} (Estado: ${s.status ? 'Activa' : 'Inactiva'})`}</option>)}</Input><FormFeedback>{formErrors?.idSpecSheet}</FormFeedback></FormGroup></Col><Col md={2} className="d-flex align-items-end mb-3"><Button color="info" outline size="sm" className="w-100" onClick={toggleViewSpecSheetModal} disabled={!selectedSpecSheetData || isLoadingFichas}><EyeIcon size={16} className="me-1"/> Ver</Button></Col></Row><Row><Col md={4}><FormGroup><Label for="initialAmount" className="fw-semibold small">Cantidad a Producir <span className="text-danger">*</span></Label><Input id="initialAmount" name="initialAmount" type="number" min="1" value={formOrder.initialAmount || ''} onChange={handleChangeOrderForm} invalid={!!formErrors?.initialAmount} disabled={isBaseDataLocked || isOrderViewOnly} /><FormFeedback>{formErrors?.initialAmount}</FormFeedback></FormGroup></Col><Col md={4}><FormGroup><Label for="inputInitialWeight" className="fw-semibold small">Peso Materia Prima (Opcional)</Label><InputGroup><Input id="inputInitialWeight" name="inputInitialWeight" type="number" placeholder="Ej: 50.5" step="0.01" min="0" value={formOrder.inputInitialWeight || ''} onChange={handleChangeOrderForm} disabled={isBaseDataLocked || isOrderViewOnly} /><Input name="inputInitialWeightUnit" type="select" value={formOrder.inputInitialWeightUnit || 'kg'} onChange={handleChangeOrderForm} disabled={isBaseDataLocked || isOrderViewOnly || !formOrder.inputInitialWeight || parseFloat(formOrder.inputInitialWeight) <= 0} style={{ maxWidth: '80px', flex: '0 0 80px' }}><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option></Input></InputGroup></FormGroup></Col><Col md={4}><FormGroup><Label for="idProvider" className="fw-semibold small">Proveedor <span className="text-danger">*</span></Label><Input id="idProvider" name="idProvider" type="select" value={formOrder.idProvider || ''} onChange={handleChangeOrderForm} invalid={!!formErrors?.idProvider} disabled={isBaseDataLocked || isOrderViewOnly || !masterDataFullyLoaded}><option value="">Seleccione proveedor...</option>{providersList.map(p => <option key={p.idProvider} value={p.idProvider}>{p.providerName}</option>)}</Input><FormFeedback>{formErrors?.idProvider}</FormFeedback></FormGroup></Col></Row><Row><Col md={4}><FormGroup><Label for="idEmployeeRegistered" className="fw-semibold small">{employeeFieldLabel} <span className="text-danger">*</span></Label><Input id="idEmployeeRegistered" name="idEmployeeRegistered" type="select" value={formOrder.idEmployeeRegistered || ''} onChange={handleChangeOrderForm} invalid={!!formErrors?.idEmployeeRegistered} disabled={isBaseDataLocked || isOrderViewOnly || !masterDataFullyLoaded}><option value="">Seleccione empleado...</option>{empleadosList.map(e => <option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>)}</Input><FormFeedback>{formErrors?.idEmployeeRegistered}</FormFeedback></FormGroup></Col><Col md={8}><FormGroup><Label for="observations" className="fw-semibold small">Observaciones Generales</Label><Input id="observations" name="observations" type="textarea" rows="1" value={formOrder.observations || ''} onChange={handleChangeOrderForm} disabled={isOrderViewOnly} placeholder="Añadir notas sobre la orden en general..."/></FormGroup></Col></Row></CardBody></Card> );};
const OrderFinalizationSection = ({ formOrder, formErrors, handleChangeOrderForm, isSaving, onCancelFinalization, onConfirmFinalize, icons }) => { const { PackageIcon, ScaleIcon, CheckCircleIcon, XIcon } = icons; const isFinishedWeightUnitDisabled = isSaving || !formOrder.finishedProductWeight || parseFloat(formOrder.finishedProductWeight) <= 0; const isUnusedWeightUnitDisabled = isSaving || !formOrder.inputFinalWeightUnused || parseFloat(formOrder.inputFinalWeightUnused) <= 0; return ( <Card className="mb-4 shadow-sm border-success"><CardHeader className="py-2 px-3 bg-success text-white d-flex justify-content-between align-items-center"><h6 className="mb-0 d-flex align-items-center"><PackageIcon size={18} className="me-2"/> Datos de Finalización de Orden</h6><Button close color="white" onClick={onCancelFinalization} disabled={isSaving} title="Cancelar finalización" /></CardHeader><CardBody><Row><Col md={4} className="mb-3"><FormGroup><Label for="finalQuantityProduct" className="fw-semibold small">Cantidad Producida (Unidades) <span className="text-danger">*</span></Label><Input type="number" name="finalQuantityProduct" id="finalQuantityProduct" value={formOrder.finalQuantityProduct || ''} onChange={handleChangeOrderForm} invalid={!!formErrors?.finalQuantityProduct} disabled={isSaving} min="0" bsSize="sm" placeholder="Ej: 98" /><FormFeedback>{formErrors?.finalQuantityProduct}</FormFeedback></FormGroup></Col><Col md={4} className="mb-3"><FormGroup><Label for="finishedProductWeight" className="fw-semibold small"><ScaleIcon size={14} className="me-1"/>Peso Total Producto Terminado</Label><Input type="number" name="finishedProductWeight" id="finishedProductWeight" value={formOrder.finishedProductWeight || ''} onChange={handleChangeOrderForm} invalid={!!formErrors?.finishedProductWeight || !!formErrors?.finishedProductWeightUnit} disabled={isSaving} min="0" step="0.001" bsSize="sm" placeholder="Ej: 48.500" /><FormFeedback>{formErrors?.finishedProductWeight}</FormFeedback></FormGroup></Col><Col md={4} className="mb-3"><FormGroup><Label for="finishedProductWeightUnit" className="fw-semibold small">Unidad Peso Terminado</Label><Input type="select" name="finishedProductWeightUnit" id="finishedProductWeightUnit" value={formOrder.finishedProductWeightUnit || 'kg'} onChange={handleChangeOrderForm} disabled={isFinishedWeightUnitDisabled} bsSize="sm" invalid={!!formErrors?.finishedProductWeightUnit}><option value="kg">kg (Kilogramos)</option><option value="g">g (Gramos)</option><option value="lb">lb (Libras)</option><option value="oz">oz (Onzas)</option></Input><FormFeedback>{formErrors?.finishedProductWeightUnit}</FormFeedback></FormGroup></Col></Row><Row><Col md={4} className="mb-3"><FormGroup><Label for="inputFinalWeightUnused" className="fw-semibold small"><ScaleIcon size={14} className="me-1"/>Material Inicial No Usado (Merma)</Label><Input type="number" name="inputFinalWeightUnused" id="inputFinalWeightUnused" value={formOrder.inputFinalWeightUnused || ''} onChange={handleChangeOrderForm} invalid={!!formErrors?.inputFinalWeightUnused || !!formErrors?.inputFinalWeightUnusedUnit} disabled={isSaving} min="0" step="0.001" bsSize="sm" placeholder="Ej: 0.500" /><FormFeedback>{formErrors?.inputFinalWeightUnused}</FormFeedback></FormGroup></Col><Col md={4} className="mb-3"><FormGroup><Label for="inputFinalWeightUnusedUnit" className="fw-semibold small">Unidad Peso No Usado</Label><Input type="select" name="inputFinalWeightUnusedUnit" id="inputFinalWeightUnusedUnit" value={formOrder.inputFinalWeightUnusedUnit || 'kg'} onChange={handleChangeOrderForm} disabled={isUnusedWeightUnitDisabled} bsSize="sm" invalid={!!formErrors?.inputFinalWeightUnusedUnit}><option value="kg">kg (Kilogramos)</option><option value="g">g (Gramos)</option><option value="lb">lb (Libras)</option><option value="oz">oz (Onzas)</option></Input><FormFeedback>{formErrors?.inputFinalWeightUnusedUnit}</FormFeedback></FormGroup></Col></Row><Row><Col><FormGroup><Label for="observations" className="fw-semibold small">Observaciones de Finalización (Opcional)</Label><Input type="textarea" name="observations" id="observations" value={formOrder.observations || ''} onChange={handleChangeOrderForm} disabled={isSaving} rows="3" bsSize="sm" placeholder="Cualquier detalle relevante sobre la finalización..."/></FormGroup></Col></Row><div className="text-end mt-3"><Button color="secondary" outline onClick={onCancelFinalization} disabled={isSaving} className="me-2"><XIcon size={16} className="me-1"/> Cancelar</Button><Button color="success" onClick={onConfirmFinalize} disabled={isSaving}>{isSaving ? <Spinner size="sm" className="me-1"/> : <CheckCircleIcon size={16} className="me-1"/>}Confirmar y Finalizar Orden</Button></div></CardBody></Card> );};

// =========================================================================
// FIN: DEFINICIÓN DE COMPONENTES AUXILIARES
// =========================================================================


// =========================================================================
// INICIO: COMPONENTE PRINCIPAL DEL FORMULARIO DE ORDEN DE PRODUCCIÓN
// =========================================================================
const OrdenProduccionForm = ({
    productosMaestrosProps,
    empleadosMaestrosProps,
    proveedoresMaestrosProps,
    masterDataLoadedPageProps,
}) => {
    // 1. Hooks y Declaración de Estados
    const { user } = useAuth();
    const ordersContext = useContext(ActiveOrdersContext);
    const [productos, setProductos] = useState(productosMaestrosProps || []);
    const [empleadosList, setEmpleadosList] = useState(empleadosMaestrosProps || []);
    const [providersList, setProvidersList] = useState([]);
    const [masterDataFullyLoaded, setMasterDataFullyLoaded] = useState(masterDataLoadedPageProps || false);
    const [availableSpecSheets, setAvailableSpecSheets] = useState([]);
    const [isLoadingFichas, setIsLoadingFichas] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [viewSpecSheetModalOpen, setViewSpecSheetModalOpen] = useState(false);
    const [showFinalizationFields, setShowFinalizationFields] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderToCancelInfo, setOrderToCancelInfo] = useState(null);
    const [isSuppliesOpen, setIsSuppliesOpen] = useState(false);
    const [activeOrderWarning, setActiveOrderWarning] = useState(null);
    const [isVerifyingProduct, setIsVerifyingProduct] = useState(false);
    const [confirmAction, setConfirmAction] = useState({ isOpen: false, title: '', body: '', onConfirm: null, toggle: null });
    const [confirmNextEmployee, setConfirmNextEmployee] = useState({ isOpen: false, employeeToCarryOver: null, nextStepIndex: null });
    const prevProductIdRef = useRef();

    // 2. Lógica Derivada y de Contexto
    const { activeOrders, currentViewedOrderId, isLoadingOrderContext, addOrFocusOrder, updateOrderState, transformFetchedOrderToContextFormat, removeOrder } = ordersContext || {};
    const currentUserRole = user?.idRole;
    const canPauseOrResume = useReactMemo(() => [1, 2].includes(Number(currentUserRole)), [currentUserRole]);
    const currentOrderData = useReactMemo(() => (!currentViewedOrderId || !activeOrders?.[currentViewedOrderId]) ? null : activeOrders[currentViewedOrderId], [activeOrders, currentViewedOrderId]);
    const icons = { AlertTriangleIcon: AlertTriangle, ArrowRightCircle, CheckCircleIcon: CheckCircle, ChefHatIcon: ChefHat, ChevronDownIcon: ChevronDown, ChevronLeftIcon: ChevronLeft, ChevronRightIcon: ChevronRight, Clock, EditIcon: Edit, EyeIcon: Eye, FileTextIcon: FileText, HashIcon: Hash, InfoIcon: Info, Loader, PackageIcon: Package, PauseCircleIcon: PauseCircle, PlayCircleIcon: PlayCircle, RotateCcw, Save, ScaleIcon: Scale, TimerIcon, XIcon: X, XCircle };

    // 3. Callbacks y Efectos
    useEffect(() => { 
        if (masterDataLoadedPageProps) {
            setProductos(productosMaestrosProps || []);
            setEmpleadosList(empleadosMaestrosProps || []);
            const proveedoresMapeados = (proveedoresMaestrosProps || []).map(p => ({ ...p, providerName: p.providerName || p.company || `ID: ${p.idProvider}` }));
            setProvidersList(proveedoresMapeados);
            setMasterDataFullyLoaded(true); 
        }
    }, [masterDataLoadedPageProps, productosMaestrosProps, empleadosMaestrosProps, proveedoresMaestrosProps]);
    
    const updateSpecSheetAndProcesses = useCallback(async (productIdParam, specSheetIdFromFormParams, existingOrderData) => {
    // El 'existingOrderData' es la orden actual ANTES de hacer cambios, para poder comparar.
        if (!currentViewedOrderId || !updateOrderState) return;

        setIsLoadingFichas(true);
        try {
            const allSheetsForProduct = await specSheetService.getSpecSheetsByProductId(productIdParam);
            setAvailableSpecSheets(allSheetsForProduct || []);

            let specSheetToUse = null;
            let errorMsg = null;

            if (allSheetsForProduct?.length > 0) {
                // Intenta encontrar la ficha que ya estaba seleccionada o la nueva que se seleccionó
                if (specSheetIdFromFormParams) {
                    specSheetToUse = allSheetsForProduct.find(s => String(s.idSpecSheet) === String(specSheetIdFromFormParams));
                }
                // Si no se encontró (o no se especificó), busca la activa por defecto
                if (!specSheetToUse) {
                    specSheetToUse = allSheetsForProduct.find(s => s.status === true) || allSheetsForProduct[0];
                }
            } else {
                errorMsg = "Este producto no tiene fichas técnicas asociadas.";
            }

            // --- INICIO DE LA NUEVA LÓGICA INTELIGENTE DE FUSIÓN ---

            // 1. Obtener los pasos de la plantilla de la ficha técnica
            const templateSteps = specSheetToUse?.specSheetProcesses
                ?.sort((a, b) => a.processOrder - b.processOrder)
                .map(p => ({
                    idProcess: String(p.idProcess || p.masterProcessData?.idProcess || ''),
                    processOrder: p.processOrder,
                    processName: p.processNameOverride || p.masterProcessData?.processName || 'Proceso Desconocido',
                    processDescription: p.processDescriptionOverride || p.masterProcessData?.description || 'Sin descripción',
                    estimatedTimeMinutes: p.estimatedTimeMinutes ?? p.masterProcessData?.estimatedTimeMinutes,
                    // Estado por defecto, se sobrescribirá si hay progreso guardado
                    idProductionOrderDetail: null, 
                    idEmployee: '',
                    startDate: '',
                    endDate: '',
                    status: 'PENDING',
                    observations: '',
                    isNewStep: true
                })) || [];

            // 2. Obtener los pasos que ya tienen progreso (los que vienen del backend)
            const savedProgressSteps = existingOrderData?.processSteps?.filter(p => !p.isNewStep && p.idProductionOrderDetail) || [];

            // 3. Fusionar la plantilla con el progreso guardado
            const mergedSteps = templateSteps.map(templateStep => {
                // Buscar si este paso ya tiene un progreso guardado, comparando por el ID del proceso maestro
                const savedStep = savedProgressSteps.find(saved => 
                    String(saved.idProcess) === String(templateStep.idProcess) &&
                    saved.processOrder === templateStep.processOrder
                );
                
                // Si se encuentra un paso guardado, se usa su estado. Si no, se usa el de la plantilla.
                return savedStep ? { ...templateStep, ...savedStep, isNewStep: false } : templateStep;
            });
            
            // --- FIN DE LA NUEVA LÓGICA INTELIGENTE DE FUSIÓN ---
            
            const finalSteps = mergedSteps.length > 0 ? mergedSteps : (savedProgressSteps.length > 0 ? savedProgressSteps : []);

            updateOrderState(currentViewedOrderId, {
                formOrder: {
                    ...existingOrderData.formOrder,
                    idProduct: productIdParam,
                    idSpecSheet: specSheetToUse?.idSpecSheet.toString() || ''
                },
                selectedSpecSheetData: specSheetToUse,
                processSteps: finalSteps, // Usamos los pasos fusionados
                // El activeStepIndex se recalculará en el contexto basado en los estados de los pasos
                formErrors: { ...existingOrderData.formErrors, idSpecSheet: errorMsg }
            });
            
            if (errorMsg) toast.error(errorMsg);

        } catch (err) {
            toast.error("Error al cargar las fichas del producto.");
        } finally {
            setIsLoadingFichas(false);
        }
    }, [currentViewedOrderId, updateOrderState]);

    const handleChangeOrderForm = useCallback((e) => {
        if (!currentViewedOrderId || !currentOrderData || !updateOrderState) return;
        const { name, value } = e.target;

        // Guardamos una copia de los datos actuales ANTES de hacer cambios
        const orderBeforeChange = { ...currentOrderData };

        let newForm = { ...orderBeforeChange.formOrder, [name]: value };

        if (name === 'idProduct') {
            setActiveOrderWarning(null);
            const p = productos.find(pr => String(pr.idProduct) === String(value));
            newForm.productNameSnapshot = p ? p.productName : '';
            newForm.idSpecSheet = ''; // Resetear la selección de ficha

            // Actualizamos el estado del formulario, pero ¡NO borramos los pasos aún!
            updateOrderState(currentViewedOrderId, { 
                formOrder: newForm, 
                selectedSpecSheetData: null,
                // Los pasos se actualizarán en `useEffect` o en la llamada explícita a updateSpecSheetAndProcesses
                formErrors: { ...orderBeforeChange.formErrors, idProduct: null, idSpecSheet: null }
            });
        } else if (name === 'idSpecSheet') {
            // Le pasamos la orden actual para que pueda fusionar el progreso
            updateSpecSheetAndProcesses(orderBeforeChange.formOrder.idProduct, value, orderBeforeChange);
        } else {
            updateOrderState(currentViewedOrderId, { formOrder: newForm });
        }
    }, [currentViewedOrderId, currentOrderData, productos, updateOrderState, updateSpecSheetAndProcesses]);
    
    const handleSaveNewDraft = useCallback(async () => {
        if (!currentOrderData || !currentOrderData.isNewForForm || isSaving || !updateOrderState) return;
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
        } catch (err) { const errorMsg = err.response?.data?.message || err.message || "Error al guardar."; toast.error(errorMsg, { id: toastIdOuter }); if (err.response?.data?.errors) { updateOrderState(currentViewedOrderId, { formErrors: err.response.data.errors.reduce((acc, e) => { acc[e.path] = e.msg; return acc; }, {}) }); } } finally { setIsSaving(false); }
    }, [currentOrderData, isSaving, productos, updateOrderState, transformFetchedOrderToContextFormat]);
    
    const handleUpdateExistingOrder = useCallback(async (intendedFinalStatus = null, options = {}) => {
        if (!currentViewedOrderId || !currentOrderData || currentOrderData.isNewForForm || !updateOrderState) return false;
        const validationResult = validateAndPreparePayload(currentOrderData.formOrder, productos, 'PRODUCTION');
        updateOrderState(currentViewedOrderId, { formErrors: validationResult.errors });
        if (!validationResult.isValid && !options.skipValidation) { toast.error(Object.values(validationResult.errors).find(msg => msg) || "Corrija los errores."); return false; }
        setIsSaving(true);
        const toastId = toast.loading("Guardando cambios...");
        const updatePayload = { ...validationResult.payload, status: intendedFinalStatus || currentOrderData.localOrderStatus };
        try {
            const res = await productionOrderService.updateProductionOrder(currentOrderData.id, updatePayload);
            const transformed = transformFetchedOrderToContextFormat(res);
            if (transformed) { updateOrderState(currentViewedOrderId, transformed); if (options.showToast !== false) { toast.success("Orden actualizada.", { id: toastId }); } else { toast.dismiss(toastId); } return transformed; } else { throw new Error("Respuesta inválida del servidor."); }
        } catch (err) { toast.error(err.response?.data?.message || "Error al actualizar.", { id: toastId }); return false; } finally { setIsSaving(false); }
    }, [currentViewedOrderId, currentOrderData, productos, transformFetchedOrderToContextFormat, updateOrderState]);
    
    const handleTogglePauseOrder = useCallback(async () => {
        if (!currentViewedOrderId || !currentOrderData || isProcessingAction || !updateOrderState) return;
        const isCurrentlyPaused = currentOrderData.localOrderStatus === 'PAUSED';
        const newStatus = isCurrentlyPaused ? 'IN_PROGRESS' : 'PAUSED';
        const actionText = isCurrentlyPaused ? 'Reanudando' : 'Pausando';
        setIsProcessingAction(true);
        const toastId = toast.loading(`${actionText} la orden...`);
        try {
            const updatedOrder = await productionOrderService.changeProductionOrderStatus(currentOrderData.id, newStatus);
            const transformed = transformFetchedOrderToContextFormat(updatedOrder);
            if (transformed) { updateOrderState(currentViewedOrderId, transformed); toast.success(`Orden ${actionText.toLowerCase().slice(0, -1)}a.`, { id: toastId }); } else { throw new Error("Respuesta inválida del servidor."); }
        } catch (err) { toast.error(err.response?.data?.message || `Error al ${actionText.toLowerCase()} la orden.`, { id: toastId }); } finally { setIsProcessingAction(false); }
    }, [currentViewedOrderId, currentOrderData, isProcessingAction, transformFetchedOrderToContextFormat, updateOrderState]);

    const handleEmployeeSelectionForStep = useCallback((stepIndex, newEmployeeId) => {
        if (!currentViewedOrderId || !currentOrderData || !updateOrderState) return;
        const newSteps = currentOrderData.processSteps.map((s, i) => i === stepIndex ? { ...s, idEmployee: newEmployeeId || '' } : s);
        updateOrderState(currentViewedOrderId, { processSteps: newSteps });
    }, [currentViewedOrderId, currentOrderData, updateOrderState]);
    
    const handleContinueWithSameEmployee = useCallback(() => {
        if (!confirmNextEmployee.employeeToCarryOver || confirmNextEmployee.nextStepIndex === null) return;
        handleEmployeeSelectionForStep(confirmNextEmployee.nextStepIndex, confirmNextEmployee.employeeToCarryOver.idEmployee);
        toast.success(`${confirmNextEmployee.employeeToCarryOver.fullName} asignado al siguiente paso.`);
        setConfirmNextEmployee({ isOpen: false, employeeToCarryOver: null, nextStepIndex: null });
    }, [confirmNextEmployee, handleEmployeeSelectionForStep]);

    const handleCloseEmployeeModal = useCallback(() => {
        setConfirmNextEmployee({ isOpen: false, employeeToCarryOver: null, nextStepIndex: null });
    }, []);

    const handleCompleteCurrentStep = useCallback(async () => {
        if (!currentViewedOrderId || !currentOrderData || isProcessingAction || !updateOrderState) return;
        const orderToComplete = currentOrderData;
        const step = orderToComplete.processSteps?.[orderToComplete.activeStepIndex];
        if (!step || !step.idProductionOrderDetail) { return toast.error("No se puede completar un paso no guardado."); }
        if (step.status !== 'IN_PROGRESS') { return toast.error(`El paso no está en progreso.`); }
        
        setIsProcessingAction(true);
        const tId = toast.loading(`Completando "${step.processName}"...`);
        
        try {
            const res = await productionOrderService.updateProductionOrderStep(orderToComplete.id, step.idProductionOrderDetail, { endDate: new Date().toISOString(), status: 'COMPLETED', observations: step.observations || null });
            const transformed = transformFetchedOrderToContextFormat(res);
            
            if (transformed) {
                updateOrderState(currentViewedOrderId, transformed);
                toast.success(`Paso completado.`, { id: tId, icon: "✔️" });
                const nextStepIndex = orderToComplete.activeStepIndex + 1;
                const hasNextStep = nextStepIndex < (transformed.processSteps?.length || 0);
                if (hasNextStep && step.idEmployee) {
                    const employee = empleadosList.find(e => String(e.idEmployee) === String(step.idEmployee));
                    setConfirmNextEmployee({ isOpen: true, employeeToCarryOver: employee, nextStepIndex: nextStepIndex });
                }
            } else { throw new Error("Respuesta inválida del servidor."); }
        } catch (err) { toast.error(err.response?.data?.message || `Error completando el paso.`, { id: tId }); }
        finally { setIsProcessingAction(false); }
    }, [currentViewedOrderId, currentOrderData, isProcessingAction, updateOrderState, transformFetchedOrderToContextFormat, empleadosList]);

    const handleStartCurrentStep = useCallback(async () => {
        if (!currentViewedOrderId || !currentOrderData || isProcessingAction) return;
        const orderToStart = currentOrderData;
        const stepToStart = orderToStart.processSteps?.[orderToStart.activeStepIndex];
        const employeeIdToAssign = stepToStart?.idEmployee;
        if (!employeeIdToAssign) { toast.error(`Por favor, asigne un empleado al paso "${stepToStart?.processName || 'actual'}".`); return; }
        const assignedEmployee = empleadosList.find(e => String(e.idEmployee) === String(employeeIdToAssign));
        const employeeName = assignedEmployee?.fullName || `ID ${employeeIdToAssign}`;
        const executeStart = async () => {
            if (isProcessingAction) return;
            setIsProcessingAction(true);
            setConfirmAction({ isOpen: false });
            let orderForStepStart = orderToStart;
            if (!stepToStart.idProductionOrderDetail) {
                const updatedOrderResult = await handleUpdateExistingOrder('IN_PROGRESS', { showToast: false });
                if (!updatedOrderResult) { toast.error("No se pudo preparar la orden para iniciar la producción."); setIsProcessingAction(false); return; }
                orderForStepStart = updatedOrderResult;
            }
            const toastIdStartStep = toast.loading(`Iniciando paso "${stepToStart.processName}"...`);
            try {
                const stepDataForApi = orderForStepStart.processSteps[orderForStepStart.activeStepIndex];
                const stepId = stepDataForApi.idProductionOrderDetail;
                if (!stepId) { toast.error("Error crítico: No se pudo obtener el ID del paso para iniciar. Por favor, recargue e intente de nuevo.", { id: toastIdStartStep }); setIsProcessingAction(false); return; }
                const payload = { startDate: new Date().toISOString(), status: 'IN_PROGRESS', idEmployeeAssigned: employeeIdToAssign };
                const res = await productionOrderService.updateProductionOrderStep(orderForStepStart.id, stepId, payload);
                const transformed = transformFetchedOrderToContextFormat(res);
                if (transformed) { updateOrderState(orderForStepStart.id, transformed); toast.success(`Paso "${stepToStart.processName}" iniciado.`, { id: toastIdStartStep }); }
                else { throw new Error("Respuesta inválida del servidor."); }
            } catch (err) { const errorMsg = err.response?.data?.message || err.message || `Error iniciando el paso.`; toast.error(errorMsg, { id: toastIdStartStep }); }
            finally { setIsProcessingAction(false); }
        };
        setConfirmAction({ isOpen: true, title: "Confirmar Inicio de Paso", body: `¿Está seguro de que desea iniciar el paso "${stepToStart.processName}" con el empleado: ${employeeName}?`, confirmText: "Sí, Iniciar", confirmColor: "success", onConfirm: executeStart, toggle: () => setConfirmAction({ isOpen: false }) });
    }, [currentViewedOrderId, currentOrderData, isProcessingAction, handleUpdateExistingOrder, updateOrderState, transformFetchedOrderToContextFormat, empleadosList]);
    
    const handlePrepareFinalization = useCallback(() => {
        if (!currentViewedOrderId || !currentOrderData) return;
        setShowFinalizationFields(true);
        toast("Ingrese los datos de finalización.", { icon: "✍️" });
    }, [currentViewedOrderId, currentOrderData]);
    
    const handleFinalizeAndSaveOrder = useCallback(async () => {
        if (!currentViewedOrderId || !currentOrderData || isProcessingAction || !updateOrderState || !removeOrder) return;
        const { formOrder } = currentOrderData;
        const newErrors = {};
        if (!formOrder.finalQuantityProduct || parseFloat(formOrder.finalQuantityProduct) < 0) { newErrors.finalQuantityProduct = 'La cantidad producida es requerida y debe ser un número positivo.'; }
        if (Object.keys(newErrors).length > 0) { updateOrderState(currentViewedOrderId, { formErrors: newErrors }); toast.error('Por favor, corrija los errores en el formulario de finalización.'); return; }
        setIsProcessingAction(true);
        const tId = toast.loading("Finalizando orden...");
        try {
            const finalQuantityProduct = formOrder.finalQuantityProduct ? parseFloat(formOrder.finalQuantityProduct) : null;
            const finishedProductWeight = formOrder.finishedProductWeight ? parseFloat(formOrder.finishedProductWeight) : null;
            const inputFinalWeightUnused = formOrder.inputFinalWeightUnused ? parseFloat(formOrder.inputFinalWeightUnused) : null;
            const payload = { finalQuantityProduct, finishedProductWeight, finishedProductWeightUnit: finishedProductWeight ? (formOrder.finishedProductWeightUnit || 'kg') : null, inputFinalWeightUnused, inputFinalWeightUnusedUnit: inputFinalWeightUnused ? (formOrder.inputFinalWeightUnusedUnit || 'kg') : null, observations: formOrder.observations || null, };
            await productionOrderService.finalizeProductionOrder(currentOrderData.id, payload);
            removeOrder(currentOrderData.id); 
            setShowFinalizationFields(false);
            toast.success(`¡Orden finalizada!`, { id: tId, icon: "🏆" });
            addOrFocusOrder(null, false, { navigateIfNeeded: true });
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Error al finalizar la orden.";
            toast.error(errorMsg, { id: tId });
            if (err.response?.data?.errors) { const backendErrors = err.response.data.errors.reduce((acc, e) => { acc[e.path] = e.msg; return acc; }, {}); updateOrderState(currentViewedOrderId, { formErrors: backendErrors }); }
        } finally { setIsProcessingAction(false); }
    }, [currentViewedOrderId, currentOrderData, isProcessingAction, updateOrderState, removeOrder, addOrFocusOrder]);
    
    const handleCancelFinalization = useCallback(() => { 
        setShowFinalizationFields(false); 
        toast("Finalización cancelada.", { icon: "ℹ️" }); // Puedes usar cualquier emoji
    }, []);    

    const handleStepFieldChange = useCallback((stepIndex, fieldName, value) => {
        if (!currentViewedOrderId || !currentOrderData || !updateOrderState) return;
        const newSteps = currentOrderData.processSteps.map((s, i) => i === stepIndex ? { ...s, [fieldName]: value } : s);
        updateOrderState(currentViewedOrderId, { processSteps: newSteps });
    }, [currentViewedOrderId, currentOrderData, updateOrderState]);
    
    const toggleViewSpecSheetModal = useCallback(() => setViewSpecSheetModalOpen(p => !p), []);
    const toggleSuppliesCallback = useCallback(() => setIsSuppliesOpen(prev => !prev), []);
    const openCancelModal = useCallback(() => { if (!currentViewedOrderId || !currentOrderData) return; setOrderToCancelInfo({ id: currentOrderData.id, displayName: currentOrderData.orderNumberDisplay || "Nuevo Borrador" }); setIsCancelModalOpen(true); }, [currentViewedOrderId, currentOrderData]);
    
    const handleConfirmCancelOrder = useCallback(async (reason) => {
    // Si no hay información de la orden, no hacer nada.
    if (!orderToCancelInfo?.id || !removeOrder) return;
    
    // El contexto de las órdenes debe tener la función addOrFocusOrder
    if (!addOrFocusOrder) {
        console.error("La función addOrFocusOrder no está disponible en el contexto.");
        return;
    }

    setIsProcessingAction(true);
    const tId = toast.loading(`Cancelando orden...`);
    
    try {
        const orderIdToCancel = orderToCancelInfo.id;

        // Si es un borrador nuevo (no guardado en BD)
        if (String(orderIdToCancel).startsWith('NEW_')) {
            removeOrder(orderIdToCancel);
            toast.success("Borrador descartado.", { id: tId });
        } else {
            // Si es una orden existente en la BD
            await productionOrderService.changeProductionOrderStatus(orderIdToCancel, 'CANCELLED', reason);
            removeOrder(orderIdToCancel); // Elimina la orden del estado activo del contexto
            toast.success(`Orden cancelada.`, { id: tId });
        }

        setIsCancelModalOpen(false); // Cierra el modal de cancelación

        // --- ¡LÍNEA CLAVE AÑADIDA! ---
        // Navega fuera del formulario actual, volviendo a la vista por defecto (lista de órdenes).
        addOrFocusOrder(null, false, { navigateIfNeeded: true });

    } catch (error) {
        toast.error(error.response?.data?.message || "Error al cancelar.", { id: tId });
    } finally {
        setIsProcessingAction(false);
    }
}, [orderToCancelInfo, removeOrder, addOrFocusOrder, transformFetchedOrderToContextFormat, updateOrderState]);
    
    useEffect(() => {
        const order = currentOrderData;
        if (!order || !masterDataFullyLoaded || isSaving) return;

        const productId = order.formOrder?.idProduct;

        // Solo se ejecuta si el ID del producto ha cambiado
        if (productId && productId !== prevProductIdRef.current) {
            const verifyProduct = async () => {
                setIsVerifyingProduct(true);
                setActiveOrderWarning(null);
                try {
                    const verificationResult = await productionOrderService.checkActiveOrderForProduct(productId);
                    if (verificationResult.hasActiveOrder) {
                        const conflictingOrder = verificationResult.activeOrder;
                        if (String(conflictingOrder.idProductionOrder) !== String(order.id)) {
                            setActiveOrderWarning({ message: `Este producto ya tiene una orden activa (ID: ${conflictingOrder.idProductionOrder}, Estado: ${conflictingOrder.status}). No podrá guardar o iniciar esta orden.`, orderId: conflictingOrder.idProductionOrder });
                        }
                    }
                    // Llamamos a la función inteligente de actualización, pasándole la orden actual
                    await updateSpecSheetAndProcesses(productId, order.formOrder.idSpecSheet || null, order);
                } catch (error) {
                    console.error("Error al verificar el producto:", error);
                    toast.error("No se pudo verificar el estado del producto.");
                } finally {
                    setIsVerifyingProduct(false);
                }
            };
            verifyProduct();
        } else if (!productId) {
            setActiveOrderWarning(null);
        }
        prevProductIdRef.current = productId;
    }, [currentOrderData, masterDataFullyLoaded, isSaving, updateSpecSheetAndProcesses]); // Asegúrate de incluir la dependencia

    useEffect(() => {
        if (currentOrderData && !showFinalizationFields) {
            if (currentOrderData.localOrderStatus === 'ALL_STEPS_COMPLETED') {
                handlePrepareFinalization();
            }
        }
    }, [currentOrderData, showFinalizationFields, handlePrepareFinalization]);

    // 4. Guard Clauses (Retornos Tempranos)
    if (!ordersContext) { return <Container fluid className="p-4 text-center"><Alert color="danger">Error Crítico: Contexto de órdenes no disponible.</Alert></Container>; }
    if (!masterDataFullyLoaded || !user) { return <SpinnerL>Preparando formulario...</SpinnerL>; }
    if (!currentViewedOrderId && !isLoadingOrderContext) { return <InfoS>Seleccione o cree una orden.</InfoS>; }
    if (isLoadingOrderContext && (!currentOrderData || String(currentOrderData?.id).startsWith('NEW_'))) { return <SpinnerL>{currentViewedOrderId && !String(currentViewedOrderId).startsWith('NEW_') ? `Cargando orden ${currentViewedOrderId}...` : "Cargando..."}</SpinnerL>; }
    if (!currentOrderData) { return <Alert color="warning" className="m-3">No se pudieron cargar los datos de la orden (ID: {currentViewedOrderId || 'N/A'}).</Alert>; }
    
    // 5. Lógica de Renderizado y JSX Final
    const { localOrderStatus, selectedSpecSheetData, isNewForForm, formOrder, id: orderId } = currentOrderData;
    const isOrderSystemReadOnly = ['COMPLETED', 'CANCELLED'].includes(localOrderStatus);
    const isPausedForCurrentUser = localOrderStatus === 'PAUSED' && !canPauseOrResume;
    const isEffectivelyReadOnly = isOrderSystemReadOnly || isPausedForCurrentUser;
    const showLowerSectionsFromData = !(isNewForForm && localOrderStatus === 'PENDING');
    const ordenTitulo = (isNewForForm && localOrderStatus === 'PENDING') ? "Nuevo Borrador de Orden" : `Orden: ${currentOrderData.orderNumberDisplay || `ID ${orderId}`} (${currentOrderData.localOrderStatusDisplay || localOrderStatus})`;
    const isBaseDataLocked = !isNewForForm && !['PENDING', 'SETUP'].includes(localOrderStatus);
    const isSimplifiedView = useReactMemo(() => ['IN_PROGRESS', 'PAUSED', 'ALL_STEPS_COMPLETED'].includes(currentOrderData?.localOrderStatus), [currentOrderData]);
    
    const renderActionButtons = () => {
        if (isOrderSystemReadOnly || showFinalizationFields) { return null; }
        const isBusy = isSaving || isProcessingAction;
        const disabledByWarning = !!activeOrderWarning;
        if (['PENDING', 'SETUP', 'SETUP_COMPLETED'].includes(localOrderStatus) && !isNewForForm) { return ( <Button color="success" onClick={() => handleUpdateExistingOrder('IN_PROGRESS')} disabled={isBusy || disabledByWarning} size="sm"><icons.PlayCircleIcon size={16} className="me-1"/> Iniciar Producción</Button> ); }
        if (['IN_PROGRESS', 'PAUSED'].includes(localOrderStatus)) { if (localOrderStatus === 'PAUSED' && !canPauseOrResume) { return null; } return ( <div className="d-flex gap-2"> {canPauseOrResume && ( <Button color={localOrderStatus === 'PAUSED' ? 'success' : 'warning'} outline onClick={handleTogglePauseOrder} disabled={isBusy} size="sm"> {localOrderStatus === 'PAUSED' ? <><icons.PlayCircleIcon size={16} className="me-1"/> Reanudar</> : <><icons.PauseCircleIcon size={16} className="me-1"/> Pausar</>} </Button> )} <Button color="danger" outline onClick={openCancelModal} disabled={isBusy} size="sm"><icons.XCircle size={16} className="me-1"/> Cancelar</Button> <Button color="primary" onClick={() => handleUpdateExistingOrder(null, { skipValidation: true })} disabled={isBusy} size="sm"><icons.Save size={16} className="me-1"/> Guardar Progreso</Button> </div> ); }
        if (localOrderStatus === 'ALL_STEPS_COMPLETED') { return ( <div className="d-flex gap-2"> <Button color="danger" outline onClick={openCancelModal} disabled={isBusy} size="sm"><icons.XCircle size={16} className="me-1"/> Cancelar</Button> <Button color="warning" onClick={handlePrepareFinalization} disabled={isBusy} size="sm"><icons.ChefHatIcon size={16} className="me-1"/> Ingresar Datos Finales</Button> </div> ); }
        return null;
    };
    
    return (
        <Container fluid className="p-0 order-production-form-main-container production-module">
            <style>{`.process-sidebar { background-color: #ffffff; border-left: 1px solid #dee2e6; } .process-sidebar .list-group-item.active { background-color: #f0f3ff; color: #495057; border-color: #dee2e6; } .process-sidebar .list-group-item.active .step-name-container { color: #0d6efd; font-weight: 600; } .step-name-container { flex-grow: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; } .step-number { font-weight: 700; margin-right: 0.5rem; } .step-status-pill { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 50px; color: white; flex-shrink: 0; } .step-status-pill.status-pending { background-color: #6c757d; } .step-status-pill.status-in-progress { background-color: #ffc107; color: #000; } .step-status-pill.status-completed { background-color: #198754; } .step-status-pill.status-skipped, .step-status-pill.status-paused { background-color: #0dcaf0; } @keyframes lucide-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .lucide-spin { animation: lucide-spin 2s linear infinite; }`}</style>
            <Toaster position="top-center" toastOptions={{duration:3500,error:{duration:5000}}}/>
            <Form onSubmit={(e)=>e.preventDefault()} className="production-order-form-content">
                <OrderBaseFormSection currentOrderData={currentOrderData} handleChangeOrderForm={handleChangeOrderForm} toggleViewSpecSheetModal={toggleViewSpecSheetModal} productos={productos} empleadosList={empleadosList} providersList={providersList} isSaving={isSaving || isProcessingAction || isVerifyingProduct} isLoadingFichas={isLoadingFichas} selectedSpecSheetData={selectedSpecSheetData} isOrderViewOnly={isEffectivelyReadOnly} ordenTitulo={ordenTitulo} employeeFieldLabel="Registrada por" availableSpecSheets={availableSpecSheets} masterDataFullyLoaded={masterDataFullyLoaded} isBaseDataLocked={isBaseDataLocked} isVerifyingProduct={isVerifyingProduct} isSimplifiedView={isSimplifiedView} icons={icons} />
                {activeOrderWarning && <Alert color="warning" className="d-flex align-items-center mt-2 mx-3 small py-2"><icons.AlertTriangleIcon size={20} className="me-2 flex-shrink-0" /><div>{activeOrderWarning.message}</div></Alert>}
                {isNewForForm && localOrderStatus === 'PENDING' && ( <CardFooter className="text-end py-2 px-3 bg-light border-top-0 mb-3 shadow-sm"><Button color="success" onClick={handleSaveNewDraft} disabled={isSaving || isProcessingAction || !masterDataFullyLoaded || !!activeOrderWarning} size="sm"><icons.Save size={16} className="me-1"/>Guardar Borrador</Button><Button color="secondary" outline onClick={openCancelModal} disabled={isSaving || isProcessingAction} size="sm" className="ms-2"><icons.XCircle size={16} className="me-1"/>Descartar</Button></CardFooter> )}
                {showLowerSectionsFromData && !showFinalizationFields && (
                    <div className="p-3">
                        <Card className="mb-3 shadow-sm"><CardHeader onClick={toggleSuppliesCallback} style={{ cursor: 'pointer' }} className="d-flex justify-content-between align-items-center py-2 px-3 bg-light"><h6 className="mb-0 d-flex align-items-center small"><icons.PackageIcon size={16} className="me-2"/> Insumos Estimados</h6> {isSuppliesOpen ? <icons.ChevronDownIcon size={18} /> : <icons.ChevronRightIcon size={18} />}</CardHeader><Collapse isOpen={isSuppliesOpen}><CardBody className="p-0"><EstimatedSuppliesSection isLoadingFichas={isLoadingFichas} selectedSpecSheetData={selectedSpecSheetData} initialAmount={formOrder.initialAmount} /></CardBody></Collapse></Card>
                        <ProcessManagementSection currentOrderData={currentOrderData} empleadosList={empleadosList} handleEmployeeSelectionForStep={handleEmployeeSelectionForStep} handleStepFieldChange={handleStepFieldChange} handleStartCurrentStep={handleStartCurrentStep} handleCompleteCurrentStep={handleCompleteCurrentStep} isSaving={isSaving || isProcessingAction} isOrderViewOnly={isEffectivelyReadOnly} isProcessingAction={isProcessingAction} isLoadingFichas={isLoadingFichas} processViewMode="sidebarWithFocus" getStatusInfo={getStatusInfoInSpanish} isLoadingEmpleados={!masterDataFullyLoaded} icons={icons} />
                        <Row className="mt-3 g-2 justify-content-end align-items-center"><Col xs="auto">{renderActionButtons()}</Col></Row>
                    </div>
                )}
                {showFinalizationFields && ( 
                    <OrderFinalizationSection 
                        formOrder={formOrder} 
                        formErrors={currentOrderData.formErrors} 
                        handleChangeOrderForm={handleChangeOrderForm} 
                        isSaving={isSaving||isProcessingAction} 
                        
                        // La prop para cancelar la ORDEN llama al modal
                        onCancelFinalization={openCancelModal} 
                        
                        // La prop para OCULTAR EL FORMULARIO llama a la función que ya tenías
                        onHideSection={handleCancelFinalization} 
                        
                        onConfirmFinalize={handleFinalizeAndSaveOrder}
                        icons={icons}
                    /> 
                )}
                {isOrderSystemReadOnly && ( <div className="mt-4 p-3 border-top text-end"> <Alert color={localOrderStatus === 'COMPLETED' ? 'success' : 'danger'} className="text-center small py-2">Orden <strong>{currentOrderData.localOrderStatusDisplay}</strong>. No más cambios.</Alert> <Button color="secondary" outline onClick={() => addOrFocusOrder(null, false, { navigateIfNeeded: true })} size="sm" className="mt-2"><icons.EyeIcon size={16} className="me-1"/> Ver Lista</Button> </div> )}
            </Form>
            <ConfirmationModal isOpen={confirmAction.isOpen} toggle={confirmAction.toggle} title={confirmAction.title} onConfirm={confirmAction.onConfirm} confirmText={confirmAction.confirmText} confirmColor={confirmAction.confirmColor} isConfirming={isProcessingAction} icons={icons}>{confirmAction.body}</ConfirmationModal>
            <ViewSpecSheetModal isOpen={viewSpecSheetModalOpen} toggle={toggleViewSpecSheetModal} specSheetData={selectedSpecSheetData} isLoading={isLoadingFichas} icons={icons} />
            <CancelOrderModal isOpen={isCancelModalOpen} toggle={() => setIsCancelModalOpen(false)} onConfirmCancel={handleConfirmCancelOrder} orderDisplayName={orderToCancelInfo?.displayName} isCancelling={isProcessingAction} />
            <Modal isOpen={confirmNextEmployee.isOpen} toggle={handleCloseEmployeeModal} centered>
                <ModalHeader toggle={handleCloseEmployeeModal}>Continuar con el Empleado</ModalHeader>
                <ModalBody>
                    <p>¿Desea que <strong>{confirmNextEmployee.employeeToCarryOver?.fullName}</strong> continúe con el siguiente paso?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={handleCloseEmployeeModal}>No, cambiar empleado</Button>
                    <Button color="primary" onClick={handleContinueWithSameEmployee}>Sí, continuar</Button>
                </ModalFooter>
            </Modal>
        </Container>
    );
};

export default OrdenProduccionForm;