// src/components/Produccion/OrdenProduccionConPasosForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Row, Col, FormGroup, Label, Input, FormFeedback, Spinner, Button, Form, Container, Card, CardBody, CardHeader, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter, Badge, ListGroup, ListGroupItem
} from 'reactstrap';
import productService from '../../services/productoInsumoService';
import fichaTecnicaService from '../../services/fichaTecnicaService';
import employeeService from '../../services/empleadoService';
import productionOrderService from '../../services/ordenProduccionService';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import registroCompraService from '../../services/registroCompraService';
import { Save, XCircle, AlertTriangle, Eye, PlayCircle, Calendar, Info, ChevronRight, FileText, Edit, ChevronsRight } from 'lucide-react';

// --- Confirmation Modal Component (sin cambios) ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText, confirmColor, isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={() => toggle(false)} centered backdrop="static" keyboard={false}>
        <ModalHeader toggle={() => toggle(false)}>
            <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor || 'primary'} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={() => toggle(false)} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor || 'primary'} onClick={onConfirm} disabled={isConfirming}>{isConfirming ? <Spinner size="sm"/> : (confirmText || 'Confirmar')}</Button>
        </ModalFooter>
    </Modal>
);

// --- Modal para Ver Ficha Técnica (sin cambios) ---
const ViewSpecSheetModal = ({ isOpen, toggle, specSheetData, isLoading }) => {
    if (!specSheetData && !isLoading) return null;
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered scrollable>
            <ModalHeader toggle={toggle}>
                <FileText size={20} className="me-2"/>
                Detalles de la Ficha Técnica (ID: {specSheetData?.idSpecsheet || 'N/A'})
            </ModalHeader>
            <ModalBody>
                {isLoading && <div className="text-center"><Spinner /> Cargando ficha...</div>}
                {!isLoading && specSheetData && (
                    <>
                        <h5>Datos Generales</h5>
                        <p><strong>Producto:</strong> {specSheetData.Product?.productName || 'N/A'}</p>
                        <p><strong>Fecha Creación Ficha:</strong> {new Date(specSheetData.startDate).toLocaleDateString()}</p>
                        <p><strong>Peso Base:</strong> {specSheetData.quantity} {specSheetData.measurementUnit}</p>
                        <hr />
                        <h5>Ingredientes</h5>
                        {specSheetData.ingredients && specSheetData.ingredients.length > 0 ? (
                            <ListGroup flush>
                                {specSheetData.ingredients.map((ing, idx) => (
                                    <ListGroupItem key={idx} className="px-0 py-1">
                                        {ing.supplier?.supplierName || ing.insumoName || 'Insumo Desconocido'}: {ing.quantity} {ing.measurementUnit}
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        ) : <p>No hay ingredientes definidos.</p>}
                        <hr />
                        <h5>Procesos Definidos</h5>
                        {specSheetData.processes && specSheetData.processes.length > 0 ? (
                            specSheetData.processes.map((proc, idx) => (
                                <div key={proc.idProcess || idx} className="mb-2">
                                    <strong>Paso {proc.processOrder}: {proc.processName}</strong>
                                    <p className="small text-muted mb-0">{proc.processDescription}</p>
                                </div>
                            ))
                        ) : <p>No hay procesos definidos.</p>}
                    </>
                )}
                {!isLoading && !specSheetData && <p>No se pudo cargar la ficha técnica.</p>}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Cerrar</Button>
            </ModalFooter>
        </Modal>
    );
};


const OrdenProduccionConPasosForm = () => {
    const { orderIdParam } = useParams();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(!!orderIdParam);
    const [currentOrderId, setCurrentOrderId] = useState(orderIdParam ? parseInt(orderIdParam, 10) : null);

    const [formOrder, setFormOrder] = useState({
        idProduct: '', 
        idSpecSheet: '', 
        idProvider: '',
        idEmployeeOrder: '',
        initialAmount: '', 
        observations: '', // Se mantendrá en el estado por si se usa más adelante, pero se comenta en el Form
    });
    const [processSteps, setProcessSteps] = useState([]);
    const [activeStepIndex, setActiveStepIndex] = useState(null);

    const [formErrors, setFormErrors] = useState({});
    const [providersList, setProvidersList] = useState([]);
    const [isLoadingProviders, setIsLoadingProviders] = useState(true);
    const [productos, setProductos] = useState([]);
    const [isLoadingProductos, setIsLoadingProductos] = useState(true);
    const [isLoadingFichas, setIsLoadingFichas] = useState(false);
    const [selectedSpecSheetData, setSelectedSpecSheetData] = useState(null);
    const [isLoadingSelectedFichaView, setIsLoadingSelectedFichaView] = useState(false);
    const [empleadosList, setEmpleadosList] = useState([]);
    const [isLoadingEmpleados, setIsLoadingEmpleados] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingOrderData, setIsLoadingOrderData] = useState(false);

    const [confirmEmployeeModalOpen, setConfirmEmployeeModalOpen] = useState(false);
    const [confirmEmployeeData, setConfirmEmployeeData] = useState({
        stepIndex: null, newEmployeeId: null, employeeName: '', currentEmployeeIdInStep: '', processName: '',
    });
    const selectedEmployeeTemp = useRef({});
    const [viewSpecSheetModalOpen, setViewSpecSheetModalOpen] = useState(false);

    // Cargar datos iniciales (productos, empleados, proveedores)
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingProductos(true); setIsLoadingEmpleados(true); setIsLoadingProviders(true);
            try {
                const [productsRes, employeesRes, meatProvidersRes] = await Promise.all([
                    productService.getAllProducts(),
                    employeeService.getAllEmpleados(),
                    registroCompraService.getMeatCategoryProviders()
                ]);
                setProductos((Array.isArray(productsRes) ? productsRes : (productsRes?.data || [])).filter(p => p.status === true));
                setProvidersList((Array.isArray(meatProvidersRes) ? meatProvidersRes : (meatProvidersRes?.data || [])).filter(p => p.status === true));
                setEmpleadosList((Array.isArray(employeesRes) ? employeesRes : (employeesRes?.data || [])).filter(emp => emp.status === true));
            } catch (error) {
                toast.error("Error al cargar datos iniciales."); console.error("Error loading initial data:", error);
            } finally {
                setIsLoadingProductos(false); setIsLoadingEmpleados(false); setIsLoadingProviders(false);
            }
        };
        loadInitialData();
    }, []);
    
    // Cargar datos de la orden si se está editando
    useEffect(() => {
        if (isEditing && orderIdParam) {
            const fetchOrderData = async () => {
                setIsLoadingOrderData(true);
                setCurrentOrderId(parseInt(orderIdParam,10));
                try {
                    const orderData = await productionOrderService.getOrderById(orderIdParam);
                    setFormOrder({
                        idProduct: orderData.idProduct?.toString() || '',
                        idProvider: orderData.idProvider?.toString() || '',
                        idSpecSheet: orderData.idSpecSheet?.toString() || '',
                        idEmployeeOrder: orderData.idEmployee?.toString() || orderData.idEmployeeOrder?.toString() || '',
                        initialAmount: orderData.initialAmount?.toString() || '',
                        observations: orderData.observations || '', // Cargar observaciones si existen
                    });
                } catch (error) {
                    toast.error("Error al cargar datos de la orden para editar.");
                    console.error("Error fetching order for edit:", error);
                } finally {
                    setIsLoadingOrderData(false);
                }
            };
            fetchOrderData();
        } else {
            setCurrentOrderId(null);
            setFormOrder({ idProduct: '', idSpecSheet: '', idEmployeeOrder: '', initialAmount: '', observations: '', idProvider: '' });
            setProcessSteps([]);
            setActiveStepIndex(null);
        }
    }, [isEditing, orderIdParam]);

    // Auto-seleccionar Ficha Técnica cuando cambia el producto
    useEffect(() => {
        const autoSelectSpecSheet = async () => {
            if (!formOrder.idProduct) {
                setFormOrder(prev => ({ ...prev, idSpecSheet: '' }));
                return;
            }
            // Solo auto-seleccionar si es un formulario nuevo, o si en edición el producto cambia Y NO es la carga inicial de datos de la orden
            if (!isEditing || (isEditing && formOrder.idProduct !== selectedSpecSheetData?.Product?.idProduct?.toString() && !isLoadingOrderData) ) {
                setIsLoadingFichas(true);
                try {
                    const response = await fichaTecnicaService.getSpecSheetsByProduct(formOrder.idProduct);
                    const activeFichas = (Array.isArray(response) ? response : (response?.data || [])).filter(ft => ft.status === true);
                    let assignedSpecSheetId = '';
                    if (activeFichas.length === 1) {
                        assignedSpecSheetId = activeFichas[0].idSpecsheet.toString();
                    } else if (activeFichas.length > 1) {
                        toast("Producto con múltiples fichas activas. Selección manual necesaria (no implementado).", { icon: 'ℹ️' });
                    } else {
                        // No es un error si no hay ficha, puede ser opcional
                    }
                    setFormOrder(prev => ({ ...prev, idSpecSheet: assignedSpecSheetId }));
                } catch (error) {
                    toast.error("Error al buscar Fichas Técnicas.");
                    setFormOrder(prev => ({ ...prev, idSpecSheet: '' }));
                } finally {
                    setIsLoadingFichas(false);
                }
            }
        };
        
        if (formOrder.idProduct && !(isEditing && isLoadingOrderData)) { // Asegurar que no se ejecute durante la carga inicial de edición si el producto ya está seteado
           autoSelectSpecSheet();
        } else if (!formOrder.idProduct) { // Si se deselecciona el producto
             setFormOrder(prev => ({ ...prev, idSpecSheet: '' }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formOrder.idProduct, isEditing, isLoadingOrderData]); // No incluir selectedSpecSheetData para evitar bucles infinitos

    // Cargar detalles completos de la Ficha Técnica seleccionada Y sus procesos
    useEffect(() => {
        const fetchFullSpecSheetAndProcessSteps = async () => {
            if (!formOrder.idSpecSheet) {
                setSelectedSpecSheetData(null);
                setProcessSteps([]);
                setActiveStepIndex(null);
                return;
            }
            setIsLoadingFichas(true); 
            setIsLoadingSelectedFichaView(true);
            
            try {
                const specSheetFullData = await fichaTecnicaService.getSpecSheetById(formOrder.idSpecSheet);
                setSelectedSpecSheetData(specSheetFullData);

                let baseSteps = [];
                if (specSheetFullData && specSheetFullData.processes && specSheetFullData.processes.length > 0) {
                    baseSteps = specSheetFullData.processes.map((proc, index) => ({
                        idProductionOrderDetail: null,
                        idProcess: proc.idProcess || proc.processId,
                        processOrder: proc.processOrder || index + 1,
                        processName: proc.processName,
                        processDescription: proc.processDescription,
                        idEmployee: '', 
                        startDate: '', 
                        endDate: '', 
                        status: 'PENDING',
                        observations: '',
                    })).sort((a, b) => a.processOrder - b.processOrder);
                }

                if (isEditing && orderIdParam && !isLoadingOrderData) {
                    const orderDataFromService = await productionOrderService.getOrderById(orderIdParam);
                    if (orderDataFromService.productionOrderDetails && orderDataFromService.productionOrderDetails.length > 0) {
                        const detailsMap = new Map(orderDataFromService.productionOrderDetails.map(detail => [detail.idProcess, detail]));
                        baseSteps = baseSteps.map(step => {
                            const savedDetail = detailsMap.get(step.idProcess);
                            if (savedDetail) {
                                return {
                                    ...step,
                                    idProductionOrderDetail: savedDetail.idProductionOrderDetail,
                                    idEmployee: savedDetail.idEmployee?.toString() || '',
                                    startDate: savedDetail.startDate ? new Date(savedDetail.startDate).toISOString().slice(0, 16) : '',
                                    endDate: savedDetail.endDate ? new Date(savedDetail.endDate).toISOString().slice(0, 16) : '',
                                    status: savedDetail.status || 'PENDING',
                                    observations: savedDetail.observations || '',
                                };
                            }
                            return step;
                        });
                    }
                }
                setProcessSteps(baseSteps);
                setActiveStepIndex(baseSteps.length > 0 ? 0 : null);

            } catch (error) {
                toast.error("Error al cargar Ficha Técnica o sus procesos.");
                setSelectedSpecSheetData(null);
                setProcessSteps([]);
                setActiveStepIndex(null);
            } finally {
                setIsLoadingFichas(false);
                setIsLoadingSelectedFichaView(false);
            }
        };

        if (formOrder.idSpecSheet) { // Ejecutar si hay un idSpecSheet
            fetchFullSpecSheetAndProcessSteps();
        } else { // Limpiar si no hay idSpecSheet
            setSelectedSpecSheetData(null);
            setProcessSteps([]);
            setActiveStepIndex(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formOrder.idSpecSheet, isEditing, orderIdParam, isLoadingOrderData]);

    const handleChangeOrderForm = (e) => {
        const { name, value } = e.target;
        setFormOrder(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleEmployeeSelectionForStep = (stepIndex, newEmployeeId) => {
        const step = processSteps[stepIndex];
        const selectedEmp = empleadosList.find(emp => emp.idEmployee.toString() === newEmployeeId);
        selectedEmployeeTemp.current = { stepIndex, newEmployeeId, oldEmployeeId: step.idEmployee };
        setConfirmEmployeeData({
            stepIndex, newEmployeeId,
            employeeName: selectedEmp ? (selectedEmp.fullName || `${selectedEmp.employeeName} ${selectedEmp.employeeLastName || ''}`) : 'N/A',
            currentEmployeeIdInStep: step.idEmployee || '',
            processName: step.processName,
        });
        setProcessSteps(prevSteps => prevSteps.map((s, idx) => idx === stepIndex ? { ...s, idEmployee: newEmployeeId } : s));
        setConfirmEmployeeModalOpen(true);
    };
    
    const confirmEmployeeAssignment = () => {
        const { newEmployeeId } = confirmEmployeeData;
        if (newEmployeeId) {
             toast.success(`Empleado asignado a: ${confirmEmployeeData.processName}.`);
        } else {
             toast.info(`Empleado desasignado de: ${confirmEmployeeData.processName}.`);
        }
    };
    
    const toggleConfirmEmployeeModal = (confirmedAction = false) => {
        if (!confirmedAction && selectedEmployeeTemp.current.stepIndex !== null && confirmEmployeeModalOpen) {
            const {stepIndex, oldEmployeeId} = selectedEmployeeTemp.current;
            const currentStep = processSteps[stepIndex];
            if (currentStep && currentStep.idEmployee !== oldEmployeeId) {
                setProcessSteps(prevSteps =>
                    prevSteps.map((step, idx) =>
                        idx === stepIndex ? { ...step, idEmployee: oldEmployeeId } : step
                    )
                );
                toast.info("Asignación de empleado cancelada.");
            }
        }
        setConfirmEmployeeModalOpen(false);
        setConfirmEmployeeData({ stepIndex: null, newEmployeeId: null, employeeName: '', currentEmployeeIdInStep: '', processName: '' });
        selectedEmployeeTemp.current = {};
    };

    const handleStepFieldChange = (stepIndex, fieldName, value) => {
        setProcessSteps(prevSteps =>
            prevSteps.map((step, idx) => {
                if (idx === stepIndex) {
                    const updatedStep = { ...step, [fieldName]: value };
                    if (fieldName === 'status') {
                        if (value === 'IN_PROGRESS' && !updatedStep.startDate) {
                            updatedStep.startDate = new Date().toISOString().slice(0, 16);
                        } else if (value === 'COMPLETED' && !updatedStep.endDate) {
                            updatedStep.endDate = new Date().toISOString().slice(0, 16);
                            if (!updatedStep.startDate) updatedStep.startDate = new Date().toISOString().slice(0, 16);
                        } else if (value !== 'COMPLETED') {
                            updatedStep.endDate = '';
                        }
                    }
                    return updatedStep;
                }
                return step;
            })
        );
    };

    const validateMainForm = () => {
        const newErrors = {};
        if (!formOrder.idProduct) newErrors.idProduct = "Seleccione producto.";
        if (!formOrder.idEmployeeOrder) newErrors.idEmployeeOrder = "Seleccione empleado responsable.";
        // La ficha técnica puede ser opcional si el producto no la tiene por defecto.
        // if (!formOrder.idSpecSheet && formOrder.idProduct) { 
        //     newErrors.idSpecSheetValidation = "Ficha Técnica es requerida o no se pudo asignar.";
        // }
        if (!formOrder.initialAmount || !/^\d+$/.test(formOrder.initialAmount) || parseInt(formOrder.initialAmount, 10) < 1) {
            newErrors.initialAmount = "Cantidad entera ≥ 1.";
        }

        if(processSteps.length > 0){
            const allStepsHaveEmployee = processSteps.every(step => !!step.idEmployee);
            if(!allStepsHaveEmployee){
                newErrors.processStepsGeneral = "Asigne empleado a cada paso.";
            }
        } else if (formOrder.idSpecSheet && selectedSpecSheetData?.processes?.length > 0) {
             newErrors.processStepsLoad = "Error al cargar pasos de la ficha. Verifique la Ficha Técnica.";
        }
        setFormErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        if (!isValid) {
            const firstErrorKey = Object.keys(newErrors)[0];
            let firstErrorMessage = newErrors[firstErrorKey];
            if (firstErrorKey === 'processStepsGeneral' && activeStepIndex !== null && processSteps[activeStepIndex] && !processSteps[activeStepIndex].idEmployee) {
                 firstErrorMessage = `Asigne empleado al Paso ${processSteps[activeStepIndex].processOrder}.`;
            }
            toast.error(firstErrorMessage || "Corrija los errores.", { duration: 4000 });
        }
        return isValid;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateMainForm()) return;
        setIsSaving(true);
        const toastId = toast.loading(isEditing ? "Actualizando Orden..." : "Guardando Orden...");

        const orderPayload = {
            idProduct: parseInt(formOrder.idProduct, 10),
            idSpecSheet: formOrder.idSpecSheet ? parseInt(formOrder.idSpecSheet, 10) : null,
            idEmployee: parseInt(formOrder.idEmployeeOrder, 10),
            idProvider: formOrder.idProvider ? parseInt(formOrder.idProvider, 10) : null,
            initialAmount: parseInt(formOrder.initialAmount, 10),
            observations: formOrder.observations.trim() || null, // Se envía aunque esté comentado en UI
            dateTimeCreation: isEditing ? undefined : new Date().toISOString(),
            status: isEditing ? undefined : 'PENDING', 
            processDetails: processSteps.map(step => ({
                idProductionOrderDetail: isEditing ? step.idProductionOrderDetail : null,
                idProcess: step.idProcess,
                idEmployee: step.idEmployee ? parseInt(step.idEmployee, 10) : null,
                startDate: step.startDate || null,
                endDate: step.endDate || null,
                status: step.status || 'PENDING',
                observations: step.observations || null,
            }))
        };

        try {
            let savedData;
            if (isEditing) {
                savedData = await productionOrderService.updateOrder(orderIdParam, orderPayload);
                toast.success(`Orden Nº ${orderIdParam} actualizada.`, { id: toastId });
            } else {
                savedData = await productionOrderService.createOrderWithDetails(orderPayload);
                setCurrentOrderId(savedData.idOrder);
                toast.success(`Orden de Producción Nº ${savedData.idOrder} creada.`, { id: toastId });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al guardar la orden.", { id: toastId });
            console.error("Error submitting order:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleIniciarOrden = async () => {
        const orderIdToStart = currentOrderId;
        if (!orderIdToStart) {
            toast.error("Guarde la orden primero o asegúrese que está en modo edición con una orden válida."); return;
        }
        if (processSteps.some(step => !step.idEmployee)) {
            toast.error("Asigne empleados a todos los pasos antes de iniciar."); return;
        }
        const toastId = toast.loading(`Iniciando Orden Nº ${orderIdToStart}...`);
        setIsSaving(true);
        try {
            await productionOrderService.startOrder(orderIdToStart);
            toast.success(`Orden Nº ${orderIdToStart} iniciada.`, { id: toastId });
            if (isEditing) {
                // const orderData = await productionOrderService.getOrderById(orderIdToStart);
                // Podrías actualizar el estado global de la orden aquí si es necesario
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al iniciar la orden.", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleViewSpecSheetModal = () => {
        // Permitir abrir incluso si no hay ficha, para que el modal muestre "cargando" o error.
        // if (!formOrder.idSpecSheet && !isLoadingFichas) { 
        //     toast.error("No hay Ficha Técnica asignada o seleccionada para ver."); return; 
        // }
        setViewSpecSheetModal(prev => !prev);
    };

    const ordenTitulo = currentOrderId ? `Orden de Producción Nº ${currentOrderId}` : "Nueva Orden de Producción";

    const canSubmitForm = !isSaving && formOrder.idProduct && formOrder.idEmployeeOrder && formOrder.initialAmount &&
        (processSteps.length > 0 ? processSteps.every(step => !!step.idEmployee) : true );
    
    const canStartOrder = !!currentOrderId && !isSaving && processSteps.length > 0 && processSteps.every(step => !!step.idEmployee);
    
    const currentActiveStep = activeStepIndex !== null && processSteps[activeStepIndex] ? processSteps[activeStepIndex] : null;

    return (
        <Container fluid className="p-md-4 p-2 main-content">
            <Toaster position="top-center" />
            <Form onSubmit={handleSubmit}>
                <Card className="mb-4 shadow-sm">
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">{ordenTitulo}</h4>
                        {currentOrderId && <Badge color="secondary">ID: {currentOrderId}</Badge>}
                    </CardHeader>
                    <CardBody>
                        <Row className="mb-3 align-items-start">
                            <Col md={3} className="mb-3 mb-md-0">
                                <FormGroup>
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <Label for="idProduct" className="mb-0">Producto a Producir <span className="text-danger">*</span></Label>
                                        {formOrder.idProduct && ( // El botón de ojo ahora se muestra si hay un producto seleccionado
                                            <Button 
                                                color="link" 
                                                size="sm" 
                                                className="p-0 ms-2"
                                                onClick={toggleViewSpecSheetModal}
                                                // Deshabilitar si se está cargando la ficha o si explícitamente no hay ficha (idSpecSheet es null o vacío y no está cargando)
                                                disabled={isLoadingSelectedFichaView || isLoadingFichas || (!formOrder.idSpecSheet && !isLoadingFichas)}
                                                title={!formOrder.idSpecSheet && !isLoadingFichas ? "No hay ficha para este producto" : "Ver Ficha Técnica"}
                                            >
                                                {(isLoadingSelectedFichaView || isLoadingFichas) ? <Spinner size="sm" /> : <Eye size={18} />}
                                            </Button>
                                        )}
                                    </div>
                                    <Input type="select" name="idProduct" id="idProduct" value={formOrder.idProduct}
                                        onChange={handleChangeOrderForm} invalid={!!formErrors.idProduct} 
                                        disabled={isSaving || (isEditing && !!currentOrderId) || isLoadingProductos}>
                                        <option value="">Seleccione producto...</option>
                                        {productos.map(p => <option key={p.idProduct} value={p.idProduct}>{p.productName}</option>)}
                                    </Input>
                                    {isLoadingProductos && <Spinner size="sm" className="mt-1"/>}
                                    <FormFeedback>{formErrors.idProduct}</FormFeedback>
                                </FormGroup>
                                {formErrors.idSpecSheetValidation && <FormFeedback className="d-block text-danger small mt-1">{formErrors.idSpecSheetValidation}</FormFeedback>}
                                {/* Mensaje si el producto tiene ficha asignada pero no se pudo cargar */}
                                {formOrder.idProduct && formOrder.idSpecSheet && !selectedSpecSheetData && !isLoadingFichas && (
                                     <Alert color="danger" className="mt-2 py-1 px-2 x-small">Error al cargar Ficha ID: {formOrder.idSpecSheet}.</Alert>
                                )}
                                {/* Mensaje si el producto NO tiene ficha asignada (y no está cargando) */}
                                {formOrder.idProduct && !formOrder.idSpecSheet && !isLoadingFichas && (
                                     <Alert color="info" className="mt-2 py-1 px-2 x-small">Este producto no tiene una ficha técnica asignada por defecto.</Alert>
                                )}
                            </Col>
                            <Col md={3} className="mb-3 mb-md-0">
                                <FormGroup>
                                    <Label for="idEmployeeOrder">Empleado Responsable <span className="text-danger">*</span></Label>
                                    <Input type="select" name="idEmployeeOrder" id="idEmployeeOrder"
                                        value={formOrder.idEmployeeOrder} onChange={handleChangeOrderForm}
                                        invalid={!!formErrors.idEmployeeOrder} disabled={isSaving || isLoadingEmpleados}>
                                        <option value="">Seleccione...</option>
                                        {empleadosList.map(emp => <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName || `${emp.employeeName} ${emp.employeeLastName || ''}`}</option>)}
                                    </Input>
                                    {isLoadingEmpleados && <Spinner size="sm" className="mt-1"/>}
                                    <FormFeedback>{formErrors.idEmployeeOrder}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={3} className="mb-3 mb-md-0">
                                <FormGroup>
                                    <Label for="idProvider">Proveedor (Carnes)</Label>
                                    <Input type="select" name="idProvider" id="idProvider" value={formOrder.idProvider}
                                        onChange={handleChangeOrderForm} invalid={!!formErrors.idProvider} 
                                        disabled={isSaving || isLoadingProviders}>
                                        <option value="">Opcional...</option>
                                        {providersList.map(prov => <option key={prov.idProvider} value={prov.idProvider}>{prov.providerName}</option>)}
                                    </Input>
                                    {isLoadingProviders && <Spinner size="sm" className="mt-1"/>}
                                    <FormFeedback>{formErrors.idProvider}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label for="initialAmount">Cantidad a Producir <span className="text-danger">*</span></Label>
                                    <Input type="number" name="initialAmount" id="initialAmount" value={formOrder.initialAmount}
                                        onChange={handleChangeOrderForm} min={1} step="1" invalid={!!formErrors.initialAmount}
                                        disabled={isSaving} placeholder="Ej: 100" />
                                    <FormFeedback>{formErrors.initialAmount}</FormFeedback>
                                </FormGroup>
                            </Col>
                        </Row>
                        
                        {/* 
                        <Row className="mb-3">
                             <Col md={12}>
                                <FormGroup>
                                    <Label for="observations">Observaciones Generales de la Orden</Label>
                                    <Input type="textarea" name="observations" id="observations" bsSize="sm"
                                        value={formOrder.observations} onChange={handleChangeOrderForm}
                                        disabled={isSaving} rows={2} placeholder="Notas generales sobre esta orden de producción..." />
                                </FormGroup>
                            </Col>
                        </Row>
                        */}

                        <Row className="mb-3">
                            <Col md={4} className="mb-3 mb-md-0">
                                <Card className="h-100">
                                    <CardHeader className="py-2 px-3"><FileText size={16} className="me-1"/> Insumos Requeridos (Según Ficha Técnica)</CardHeader>
                                    <CardBody style={{maxHeight: '400px', overflowY: 'auto'}}>
                                        {(isLoadingFichas || isLoadingSelectedFichaView) && <div className="text-center"><Spinner size="sm"/> Cargando insumos...</div>}
                                        {!(isLoadingFichas || isLoadingSelectedFichaView) && selectedSpecSheetData && selectedSpecSheetData.ingredients && selectedSpecSheetData.ingredients.length > 0 && (
                                            <ListGroup flush>
                                                {selectedSpecSheetData.ingredients.map((ing, idx) => (
                                                    <ListGroupItem key={idx} className="px-0 py-1 small">
                                                        {ing.supplier?.supplierName || ing.insumoName || 'Insumo Desconocido'}: <strong>{ing.quantity} {ing.measurementUnit}</strong>
                                                    </ListGroupItem>
                                                ))}
                                            </ListGroup>
                                        )}
                                        {!(isLoadingFichas || isLoadingSelectedFichaView) && selectedSpecSheetData && (!selectedSpecSheetData.ingredients || selectedSpecSheetData.ingredients.length === 0) && (
                                            <p className="text-muted small">La ficha técnica no tiene ingredientes definidos.</p>
                                        )}
                                        {!(isLoadingFichas || isLoadingSelectedFichaView) && !selectedSpecSheetData && formOrder.idSpecSheet && ( // Si hay ID de ficha pero no datos de ficha
                                            <p className="text-muted small">No se pudieron cargar los detalles de la Ficha Técnica ID: {formOrder.idSpecSheet}.</p>
                                        )}
                                        {!formOrder.idSpecSheet && !(isLoadingFichas || isLoadingSelectedFichaView) && ( // Si no hay ID de ficha
                                            <p className="text-muted small">Seleccione un producto con ficha técnica para ver insumos.</p>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col md={8}>
                                <Card className="h-100">
                                    <CardHeader className="py-2 px-3"><Edit size={16} className="me-1"/> Gestión de Pasos del Proceso</CardHeader>
                                    <CardBody>
                                        {(isLoadingFichas || isLoadingSelectedFichaView) && <div className="text-center"><Spinner /> Cargando pasos...</div>}
                                        {!(isLoadingFichas || isLoadingSelectedFichaView) && formErrors.processStepsLoad && <Alert color="danger" size="sm">{formErrors.processStepsLoad}</Alert>}
                                        {!(isLoadingFichas || isLoadingSelectedFichaView) && formErrors.processStepsGeneral && <Alert color="danger" size="sm" className="mb-2">{formErrors.processStepsGeneral}</Alert>}

                                        {!(isLoadingFichas || isLoadingSelectedFichaView) && processSteps.length > 0 && (
                                            <>
                                                <div className="d-flex flex-wrap mb-3 border-bottom pb-2">
                                                    {processSteps.map((step, index) => (
                                                        <Button
                                                            key={step.idProcess || index}
                                                            color={activeStepIndex === index ? "primary" : "outline-secondary"}
                                                            size="sm" className="me-1 mb-1"
                                                            onClick={() => setActiveStepIndex(index)}
                                                            disabled={isSaving}
                                                        >
                                                            Paso {step.processOrder}
                                                            {!step.idEmployee && <Badge color="warning" pill className="ms-1">!</Badge>}
                                                        </Button>
                                                    ))}
                                                </div>

                                                {currentActiveStep && (
                                                    <div>
                                                        <h5>Paso {currentActiveStep.processOrder}: {currentActiveStep.processName}</h5>
                                                        <p className="small text-muted">{currentActiveStep.processDescription || "Sin descripción."}</p>
                                                        <hr/>
                                                        <Row className="g-3 align-items-end">
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for={`employee-step-${activeStepIndex}`} className="small fw-bold">Empleado <span className="text-danger">*</span></Label>
                                                                    <Input bsSize="sm" type="select" id={`employee-step-${activeStepIndex}`}
                                                                        value={currentActiveStep.idEmployee}
                                                                        onChange={(e) => handleEmployeeSelectionForStep(activeStepIndex, e.target.value)}
                                                                        invalid={!!(formErrors.processStepsGeneral && !currentActiveStep.idEmployee)}
                                                                        disabled={isSaving || isLoadingEmpleados } >
                                                                        <option value="">Seleccione...</option>
                                                                        {empleadosList.map(emp => <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName || `${emp.employeeName} ${emp.employeeLastName || ''}`}</option>)}
                                                                    </Input>
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for={`status-step-${activeStepIndex}`} className="small fw-bold">Estado</Label>
                                                                    <Input bsSize="sm" type="select" id={`status-step-${activeStepIndex}`}
                                                                        value={currentActiveStep.status}
                                                                        onChange={e => handleStepFieldChange(activeStepIndex, 'status', e.target.value)}
                                                                        disabled={isSaving || !currentActiveStep.idEmployee } >
                                                                        <option value="PENDING">Pendiente</option>
                                                                        <option value="IN_PROGRESS">En Progreso</option>
                                                                        <option value="COMPLETED">Completado</option>
                                                                        <option value="ON_HOLD">En Espera</option>
                                                                        <option value="CANCELLED">Cancelado</option>
                                                                    </Input>
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for={`startDate-step-${activeStepIndex}`} className="small fw-bold"><Calendar size={14} className="me-1"/>Inicio</Label>
                                                                    <Input bsSize="sm" type="datetime-local" id={`startDate-step-${activeStepIndex}`}
                                                                        value={currentActiveStep.startDate || ''}
                                                                        onChange={e => handleStepFieldChange(activeStepIndex, 'startDate', e.target.value)}
                                                                        disabled={isSaving || !currentActiveStep.idEmployee }
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={6}>
                                                                <FormGroup>
                                                                    <Label for={`endDate-step-${activeStepIndex}`} className="small fw-bold"><Calendar size={14} className="me-1"/>Fin</Label>
                                                                    <Input bsSize="sm" type="datetime-local" id={`endDate-step-${activeStepIndex}`}
                                                                        value={currentActiveStep.endDate || ''}
                                                                        onChange={e => handleStepFieldChange(activeStepIndex, 'endDate', e.target.value)}
                                                                        disabled={isSaving || !currentActiveStep.idEmployee || currentActiveStep.status !== 'COMPLETED'}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={12}>
                                                                <FormGroup>
                                                                    <Label for={`observations-step-${activeStepIndex}`} className="small fw-bold">Observaciones del Paso</Label>
                                                                    <Input bsSize="sm" type="textarea" rows="2" id={`observations-step-${activeStepIndex}`}
                                                                        value={currentActiveStep.observations || ''}
                                                                        onChange={e => handleStepFieldChange(activeStepIndex, 'observations', e.target.value)}
                                                                        placeholder="Notas específicas para este paso..."
                                                                        disabled={isSaving || !currentActiveStep.idEmployee}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {!(isLoadingFichas || isLoadingSelectedFichaView) && processSteps.length === 0 && formOrder.idSpecSheet && (
                                            <Alert color="info" className="mt-2">La ficha técnica seleccionada no tiene procesos definidos.</Alert>
                                        )}
                                        {!formOrder.idSpecSheet && !(isLoadingFichas || isLoadingSelectedFichaView) && (
                                            <Alert color="secondary" className="text-center">Seleccione un producto que tenga una ficha técnica asociada para ver y gestionar los pasos del proceso.</Alert>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                        
                        <Row className="mt-4">
                            <Col className="d-flex justify-content-between align-items-center">
                                <Button color="primary" outline onClick={handleIniciarOrden} disabled={!canStartOrder}
                                    title={!canStartOrder ? "Complete la orden y asigne empleados a todos los pasos" : "Iniciar ejecución de la orden"}>
                                    <PlayCircle size={18} className="me-1"/> Iniciar Orden
                                </Button>
                                <Button type="submit" color={isEditing ? "warning" : "success"} disabled={!canSubmitForm || isSaving}>
                                    {isSaving ? <Spinner size="sm" className="me-1" /> : (isEditing ? <Save size={18} className="me-1"/> : <ChevronsRight size={18} className="me-1"/>)}
                                    {isEditing ? "Actualizar Orden" : "Guardar Orden"}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Form>

            <ConfirmationModal
                isOpen={confirmEmployeeModalOpen} 
                toggle={() => toggleConfirmEmployeeModal(false)}
                onConfirm={() => { 
                    confirmEmployeeAssignment(); 
                    setConfirmEmployeeModalOpen(false); 
                    setConfirmEmployeeData({ stepIndex: null, newEmployeeId: null, employeeName: '', currentEmployeeIdInStep: '', processName: '' });
                    selectedEmployeeTemp.current = {};
                }}
                title="Confirmar Asignación de Empleado"
                confirmText="Sí, Asignar" confirmColor="success"
                isConfirming={isSaving}
                children={ confirmEmployeeData.stepIndex !== null && (
                    <p>¿Desea asignar al empleado <strong>{confirmEmployeeData.employeeName || 'seleccionado'}</strong> al paso <strong>"{confirmEmployeeData.processName}"</strong>?</p>
                )}
            />
            <ViewSpecSheetModal
                isOpen={viewSpecSheetModalOpen}
                toggle={toggleViewSpecSheetModal}
                specSheetData={selectedSpecSheetData}
                isLoading={isLoadingSelectedFichaView || isLoadingFichas} // Combinar estados de carga
            />
        </Container>
    );
};

export default OrdenProduccionConPasosForm;