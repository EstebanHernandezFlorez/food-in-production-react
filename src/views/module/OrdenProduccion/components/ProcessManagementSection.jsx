// src/views/module/OrdenProduccion/components/ProcessManagementSection.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardHeader, CardBody, ListGroup, ListGroupItem, Badge, Collapse, Input, Button, FormGroup, Label, Spinner, Alert } from 'reactstrap';
import { Edit, PlayCircle, CheckCircle, AlertTriangle, FileText, Info, ChevronLeft, ChevronRight, Menu as MenuIcon, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import '../../../../assets/css/produccion/ProduccionStyles.css';


const ProcessManagementSection = ({
    currentOrderData, // Contiene localOrderStatus, isNewForForm, etc.
    empleadosList,
    isLoadingEmpleados,
    handleEmployeeSelectionForStep,
    handleStepFieldChange,
    handleStartCurrentStep,
    handleCompleteCurrentStep,
    isSaving, // Estado general de guardado de la orden principal
    isOrderViewOnly: isOrderViewOnlyProp, // Renombrado para evitar conflicto si se recalcula localmente
    isLoadingFichas,
    processViewMode
}) => {
    const [focusedStepIndex, setFocusedStepIndex] = useState(null);
    const [isStepSidebarOpen, setIsStepSidebarOpen] = useState(true);

    // Desestructurar con valores por defecto para evitar errores si currentOrderData es null/undefined temporalmente
    const { 
        processSteps = [], 
        activeStepIndex: contextActiveStepIndex = null,
        localOrderStatus = 'PENDING', 
        selectedSpecSheetData = null, 
        formOrder = {}, 
        id: orderId = null,
        isNewForForm: isOrderNewInFormContext = true // Tomar de currentOrderData
    } = currentOrderData || {};

    useEffect(() => {
        if (processSteps?.length > 0) {
            let defaultFocus = 0;
            // Si la orden está completada o todos los pasos están completados, enfocar el último paso.
            if (localOrderStatus === 'ALL_STEPS_COMPLETED' || localOrderStatus === 'COMPLETED') {
                defaultFocus = processSteps.length - 1;
            } else if (contextActiveStepIndex !== null && contextActiveStepIndex >= 0 && contextActiveStepIndex < processSteps.length) {
                // Si hay un paso activo definido por el contexto, enfocar ese.
                defaultFocus = contextActiveStepIndex;
            }
            // Si no hay paso activo y no está completada, enfocar el primer paso (0).

            // Solo actualizar si el índice enfocado es diferente o si los pasos cambian (ej. nueva ficha)
            if (newFocus !== focusedStepIndex || (focusedStepIndex !== null && focusedStepIndex >= processSteps.length)) {
                 setFocusedStepIndex(defaultFocus);
            } else if (focusedStepIndex === null && processSteps.length > 0) { // Si no había foco pero ahora hay pasos
                setFocusedStepIndex(defaultFocus);
            }

        } else {
            // Si no hay pasos, no hay nada que enfocar.
            if (focusedStepIndex !== null) { // Solo actualizar si había un foco previo
                setFocusedStepIndex(null);
            }
        }
    }, [contextActiveStepIndex, processSteps, localOrderStatus, orderId, focusedStepIndex]);


    const focusedStepData = (focusedStepIndex !== null && processSteps && processSteps[focusedStepIndex])
        ? processSteps[focusedStepIndex]
        : null;

    const handleStepSelect = (index) => {
        if (!processSteps || index < 0 || index >= processSteps.length) return;
        const targetStep = processSteps[index];

        let canView = false;
        if (index === focusedStepIndex) canView = true; // Ya está enfocado
        else if (targetStep.status === 'COMPLETED') canView = true; // Pasos completados siempre se pueden ver
        // En PENDING (borrador guardado), SETUP, SETUP_COMPLETED, se pueden ver todos los pasos para configurar
        else if (['PENDING', 'SETUP', 'SETUP_COMPLETED'].includes(localOrderStatus)) canView = true; 
        // En IN_PROGRESS o PAUSED, solo se puede ver el paso activo o los anteriores
        else if (['IN_PROGRESS', 'PAUSED'].includes(localOrderStatus) && contextActiveStepIndex !== null) {
            if (index <= contextActiveStepIndex) canView = true; 
            else { toast.error("Aún no puede acceder a este paso futuro.", {icon: "🚫"}); canView = false; }
        } else if (localOrderStatus === 'ALL_STEPS_COMPLETED') canView = true; // Si todos completados, ver todos

        if (canView) setFocusedStepIndex(index);
    };
    
    // Determina si los CAMPOS del paso enfocado (empleado, observaciones) son editables.
    // Los botones de acción del paso (Iniciar/Completar) tienen su propia lógica más específica.
    const canEditGeneralStepFields = focusedStepData && 
        !isOrderViewOnlyProp && // Si la orden completa es de solo lectura
        !isSaving && // Si la orden principal se está guardando
        focusedStepData.status !== 'COMPLETED' && // Un paso completado no se edita
        (
            // Se puede editar en SETUP o SETUP_COMPLETED
            localOrderStatus === 'SETUP' || 
            localOrderStatus === 'SETUP_COMPLETED' ||
            // Se puede editar en PENDING, SIEMPRE Y CUANDO NO SEA un "isNewForForm"
            // (es decir, es un borrador YA GUARDADO en la BD)
            (localOrderStatus === 'PENDING' && !isOrderNewInFormContext) || 
            // Se puede editar el paso activo si la producción está en curso o pausada
            ((localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') && focusedStepIndex === contextActiveStepIndex)
        );

    if (isLoadingFichas && (!processSteps || processSteps.length === 0) && !selectedSpecSheetData) {
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted"/> Gestión de Procesos</CardHeader><CardBody className="text-center p-4"><Spinner size="sm" /> Cargando procesos desde ficha...</CardBody></Card></Col>);
    }
    
    // Si no hay producto en el formOrder, es probable que no se haya seleccionado nada aún.
    if (!formOrder?.idProduct && (!processSteps || processSteps.length === 0)) {
         return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted"/> Gestión de Procesos</CardHeader><CardBody><Alert color="secondary" className="m-3 text-center small">Seleccione un producto y guarde el borrador para cargar o definir sus procesos.</Alert></CardBody></Card></Col>);
    }

    // Si hay producto, pero no ficha seleccionada Y no hay pasos (podría ser que el producto no tenga ficha)
    if (formOrder?.idProduct && !selectedSpecSheetData && (!processSteps || processSteps.length === 0) && !isLoadingFichas) {
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted"/> Gestión de Procesos</CardHeader><CardBody><Alert color="info" className="m-3 text-center small"><FileText size={16} className="me-1"/>El producto seleccionado podría no tener una ficha técnica asignada, o la ficha no contiene procesos. Verifique la configuración del producto o seleccione una ficha manualmente si es aplicable.</Alert></CardBody></Card></Col>);
    }
    
    // Si hay ficha seleccionada pero esta no tiene procesos.
    if (selectedSpecSheetData && (!selectedSpecSheetData.specSheetProcesses || selectedSpecSheetData.specSheetProcesses.length === 0) && (!processSteps || processSteps.length === 0) && !isLoadingFichas) {
         return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted"/> Gestión de Procesos</CardHeader><CardBody><p className="text-muted p-4 text-center">La ficha técnica seleccionada no tiene procesos definidos.</p></CardBody></Card></Col>);
    }

    // Si después de todo lo anterior, aún no hay processSteps (podría ser un borrador muy inicial sin ficha seleccionada aún)
    if ((!processSteps || processSteps.length === 0) && !isLoadingFichas) {
        let message = <p className="text-muted p-4 text-center">No hay procesos definidos para esta orden.</p>;
        if (localOrderStatus === 'PENDING' && isOrderNewInFormContext) {
            message = <Alert color="info" className="m-3 text-center small">Guarde el borrador primero. Luego, si el producto tiene una ficha técnica, sus procesos se cargarán aquí para que pueda asignar empleados y configurar.</Alert>;
        } else if (localOrderStatus === 'PENDING' && !isOrderNewInFormContext && !selectedSpecSheetData) {
             message = <Alert color="warning" className="m-3 text-center small">Borrador guardado. Si el producto requiere una ficha técnica, selecciónela en la sección base para cargar los procesos.</Alert>;
        }
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted"/> Gestión de Procesos</CardHeader><CardBody>{message}</CardBody></Card></Col>);
    }


    if (processViewMode === "sidebarWithFocus") {
        return (
            <Col md={12}>
                <Card className="shadow-sm">
                    <CardHeader className="py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                        <div><Edit size={16} className="me-2 text-muted"/> Gestión de Procesos</div>
                        <Button size="sm" outline color="secondary" onClick={() => setIsStepSidebarOpen(prev => !prev)} className="d-none d-md-inline-flex align-items-center" title={isStepSidebarOpen ? "Ocultar lista de pasos" : "Mostrar lista de pasos"}>
                            {isStepSidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
                            <span className="ms-1">{isStepSidebarOpen ? "Ocultar" : "Mostrar"} Pasos</span>
                        </Button>
                        <Button color="light" size="sm" onClick={() => setIsStepSidebarOpen(prev => !prev)} className="d-md-none border" title={isStepSidebarOpen ? "Cerrar menú de pasos" : "Abrir menú de pasos"}>
                            {isStepSidebarOpen ? <XIcon size={18}/> : <MenuIcon size={18}/>}
                        </Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        <Row className="g-0"> {/* g-0 para eliminar gutters */}
                            
                            {/* Sidebar de Pasos */}
                            <Col
                                md={isStepSidebarOpen ? 4 : 0}
                                lg={isStepSidebarOpen ? 3 : 0}
                                className={`process-steps-sidebar-col ${isStepSidebarOpen ? '' : ' visually-hidden d-md-block'}`}
                                style={{
                                    width: isStepSidebarOpen ? (window.innerWidth < 768 ? '100%' : undefined) : '0px',
                                    transition: 'width 0.3s ease-in-out, opacity 0.3s ease-in-out', // Añadido opacity para suavizar
                                    opacity: isStepSidebarOpen || window.innerWidth >=768 ? 1 : 0, // Opacidad para móvil
                                    borderRight: isStepSidebarOpen && window.innerWidth >= 768 ? '1px solid #dee2e6' : 'none',
                                    position: window.innerWidth < 768 && isStepSidebarOpen ? 'absolute' : 'relative',
                                    backgroundColor: '#f8f9fa', // Fondo para diferenciar
                                    zIndex: window.innerWidth < 768 && isStepSidebarOpen ? 1050 : 1, // Alto z-index para overlay móvil
                                    height: window.innerWidth < 768 && isStepSidebarOpen ? 'calc(100% - 0px)' : 'auto', // Ajustar altura para móvil
                                    overflowY: 'auto' // Permitir scroll si el contenido es largo
                                }}
                            >
                                <Collapse isOpen={isStepSidebarOpen} className="h-100">
                                    <div style={{maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', borderBottom: window.innerWidth < 768 ? '1px solid #dee2e6' : 'none' }}>
                                        <ListGroup flush>
                                            {processSteps.map((step, idx) => {
                                                const isFutureStepNotAllowed = (localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') &&
                                                                             contextActiveStepIndex !== null &&
                                                                             idx > contextActiveStepIndex &&
                                                                             step.status !== 'COMPLETED'; // Un paso completado futuro sí se puede ver
                                                return (
                                                    <ListGroupItem
                                                        key={step.idProductionOrderDetail || `step-${idx}-${orderId}`} // Clave única
                                                        action
                                                        active={idx === focusedStepIndex}
                                                        onClick={() => handleStepSelect(idx)}
                                                        disabled={isSaving || isFutureStepNotAllowed}
                                                        className="d-flex justify-content-between align-items-center py-2 px-3 list-group-item-action-condensed"
                                                        title={isFutureStepNotAllowed ? "Este paso aún no está disponible" : `Ver detalles del Paso ${step.processOrder}: ${step.processName}`}
                                                        style={{cursor: (isSaving || isFutureStepNotAllowed) ? 'not-allowed' : 'pointer', opacity: (isSaving || isFutureStepNotAllowed) ? 0.6 : 1}}
                                                    >
                                                        <span className={`small text-truncate ${idx === focusedStepIndex ? 'fw-bold' : ''}`}>
                                                            {step.processOrder || (idx + 1)}. {step.processName}
                                                        </span>
                                                        <Badge
                                                            color={
                                                                step.status === 'COMPLETED' ? 'success' :
                                                                step.status === 'IN_PROGRESS' ? 'warning' :
                                                                step.status === 'PAUSED' ? 'secondary' : 
                                                                (step.idEmployee && step.status === 'PENDING') ? 'info' : 'light' // Azul si pendiente y asignado
                                                            }
                                                            pill className="ms-2 small"
                                                        >
                                                            {step.statusDisplay || step.status}
                                                        </Badge>
                                                    </ListGroupItem>
                                                );
                                            })}
                                        </ListGroup>
                                    </div>
                                </Collapse>
                            </Col>

                            {/* Contenido del Paso Enfocado */}
                            <Col
                                md={isStepSidebarOpen && window.innerWidth >= 768 ? 8 : 12}
                                lg={isStepSidebarOpen && window.innerWidth >= 768 ? 9 : 12}
                                className={`p-3 process-step-content ${isStepSidebarOpen && window.innerWidth < 768 ? 'd-none' : ''}`} // Ocultar si sidebar está abierto en móvil
                            >
                                {focusedStepData ? (
                                    <div>
                                        <h6 className="mb-1">Paso {focusedStepData.processOrder || (focusedStepIndex !== null ? focusedStepIndex + 1 : '')}: {focusedStepData.processName}</h6>
                                        <p className="small text-muted mb-2">{focusedStepData.processDescription || "Sin descripción para este proceso."}</p>
                                        {focusedStepData.estimatedTimeMinutes && <p className="small text-info mb-2">Tiempo Estimado: {focusedStepData.estimatedTimeMinutes} minutos.</p>}
                                        <hr className="my-2"/>
                                        <Row className="g-2">
                                            <Col sm={6}>
                                                <FormGroup className="mb-2">
                                                    <Label for={`stepEmployee-${focusedStepIndex}`} className="small fw-semibold">Empleado Asignado:</Label>
                                                    {/* Mostrar "Requerido" si es editable, está pendiente y no tiene empleado */}
                                                    {!focusedStepData.idEmployee && canEditGeneralStepFields && focusedStepData.status === 'PENDING' && 
                                                        (localOrderStatus === 'PENDING' || localOrderStatus === 'SETUP' || localOrderStatus === 'SETUP_COMPLETED') &&
                                                        <Badge color="danger" pill className="ms-2 small">Requerido</Badge>
                                                    }
                                                    <Input 
                                                        type="select" 
                                                        bsSize="sm" 
                                                        name={`stepEmployee-${focusedStepIndex}`} 
                                                        id={`stepEmployee-${focusedStepIndex}`} 
                                                        value={focusedStepData.idEmployee || ''} 
                                                        onChange={(e) => handleEmployeeSelectionForStep(focusedStepIndex, e.target.value)} 
                                                        disabled={!canEditGeneralStepFields || isLoadingEmpleados || isOrderViewOnlyProp}
                                                    >
                                                        <option value="">{isLoadingEmpleados ? "Cargando empleados..." : "Seleccionar empleado..."}</option>
                                                        {empleadosList.map(emp => (<option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>))}
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                            <Col sm={6}>
                                                <FormGroup className="mb-2">
                                                    <Label for={`stepStatus-${focusedStepIndex}`} className="small fw-semibold">Estado del Paso:</Label>
                                                    <Input bsSize="sm" type="text" readOnly disabled value={focusedStepData.statusDisplay || focusedStepData.status} />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <FormGroup className="mb-2">
                                            <Label for={`stepObs-${focusedStepIndex}`} className="small fw-semibold">Observaciones del Paso:</Label>
                                            <Input 
                                                type="textarea" 
                                                bsSize="sm" 
                                                rows={2} 
                                                name={`stepObs-${focusedStepIndex}`} 
                                                id={`stepObs-${focusedStepIndex}`} 
                                                value={focusedStepData.observations || ''} 
                                                onChange={(e) => handleStepFieldChange(focusedStepIndex, 'observations', e.target.value)} 
                                                disabled={!canEditGeneralStepFields || isOrderViewOnlyProp} 
                                                placeholder="Añadir notas o comentarios específicos de este proceso..." 
                                            />
                                        </FormGroup>
                                        
                                        {/* Botones de Acción del Paso (Iniciar/Completar) */}
                                        {/* Estos botones solo aparecen si la orden está en producción y es el paso activo */}
                                        {!isOrderViewOnlyProp && !isSaving && (localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') && focusedStepIndex === contextActiveStepIndex && (
                                            <div className="mt-2 text-end">
                                                {focusedStepData.status === 'PENDING' && (
                                                    <Button color="success" size="sm" onClick={() => handleStartCurrentStep()} disabled={!focusedStepData.idEmployee || isSaving}>
                                                        <PlayCircle size={16} className="me-1"/> Iniciar Paso
                                                    </Button>
                                                )}
                                                {focusedStepData.status === 'IN_PROGRESS' && (
                                                    <Button color="primary" size="sm" onClick={() => handleCompleteCurrentStep()} disabled={isSaving}> {/* No debería depender de idEmployee aquí ya que ya está en progreso */}
                                                        <CheckCircle size={16} className="me-1"/> Completar Paso
                                                    </Button>
                                                )}
                                                {/* Podrías añadir un botón de Pausar aquí si lo necesitas */}
                                            </div>
                                        )}

                                        {/* Mensajes de estado del paso */}
                                        {focusedStepData.status === 'COMPLETED' && (<Alert color="success" className="mt-2 py-1 px-2 small d-flex align-items-center"><CheckCircle size={14} className="me-1"/>Este paso ya ha sido completado.</Alert>)}
                                        
                                        {!canEditGeneralStepFields && focusedStepData.status !== 'COMPLETED' && focusedStepIndex !== null && contextActiveStepIndex !== null && focusedStepIndex < contextActiveStepIndex && (
                                            <Alert color="light" className="mt-2 py-1 px-2 small border text-muted">Visualizando paso anterior (solo lectura).</Alert>
                                        )}
                                        {!canEditGeneralStepFields && focusedStepData.status !== 'COMPLETED' && focusedStepIndex !== null && contextActiveStepIndex !== null && focusedStepIndex > contextActiveStepIndex && (
                                            <Alert color="light" className="mt-2 py-1 px-2 small border text-muted">Visualizando paso futuro (configuración no disponible aún).</Alert>
                                        )}


                                    </div>
                                ) : (
                                  processSteps?.length > 0 ? 
                                    <div className="text-center text-muted py-5"><Info size={32} className="mb-2"/><p>Seleccione un paso de la lista para ver y gestionar sus detalles.</p></div>
                                    :
                                    <div className="text-center text-muted py-5"><Info size={32} className="mb-2"/><p>No hay procesos cargados para esta orden.</p></div>
                                )}
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Col>
        );
    }
    // Fallback por si processViewMode no es el esperado (aunque no debería ocurrir si se maneja bien en el padre)
    return <Col md={12}><Card><CardHeader>Gestión de Procesos</CardHeader><CardBody><Alert color="danger">Error en el modo de visualización de procesos. Contacte a soporte.</Alert></CardBody></Card></Col>;
};
export default ProcessManagementSection;