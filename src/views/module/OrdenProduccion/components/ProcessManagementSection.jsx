import React, { useState, useEffect, useMemo } from 'react';
import {
    Row, Col, Card, CardHeader, CardBody, ListGroup, ListGroupItem,
    Collapse, Input, Button, FormGroup, Label, Spinner, Alert
} from 'reactstrap';
import {
    Edit, PlayCircle, CheckCircle, FileText, Info, ChevronLeft,
    ChevronRight, Menu as MenuIcon, X as XIcon, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

import '../../../../assets/css/produccion/ProduccionStyles.css';

// Componente para el estado de un paso, ahora más visual
const StepStatusBadge = ({ status, getStatusInfo }) => {
    if (!getStatusInfo) {
        return <span className="badge bg-secondary">{status}</span>;
    }
    
    const { text, icon, color } = getStatusInfo(status);
    
    const statusClassMap = {
        secondary: 'status-pending',
        warning: 'status-in-progress',
        success: 'status-completed',
        info: 'status-skipped'
    };
    
    const pillClass = statusClassMap[color] || 'status-default';

    return (
        <div className={`step-status-pill ${pillClass}`}>
            {icon}
            <span>{text}</span>
        </div>
    );
};


const ProcessManagementSection = ({
    currentOrderData,
    empleadosList,
    isLoadingEmpleados,
    handleEmployeeSelectionForStep,
    handleStepFieldChange,
    handleStartCurrentStep,
    handleCompleteCurrentStep,
    isSaving,
    isProcessingAction,
    isOrderViewOnly: isOrderViewOnlyProp,
    isLoadingFichas,
    processViewMode,
    getStatusInfo 
}) => {
    // ... (Toda la lógica inicial sin cambios)
    const [focusedStepIndex, setFocusedStepIndex] = useState(null);
    const [isStepSidebarOpen, setIsStepSidebarOpen] = useState(true);

    const {
        processSteps = [],
        activeStepIndex: contextActiveStepIndex = null,
        localOrderStatus = 'PENDING',
        selectedSpecSheetData = null,
        formOrder = {},
        id: orderId = null,
        isNewForForm: isOrderNewInFormContext = true
    } = currentOrderData || {};

    useEffect(() => {
        let newFocusIndex = null;
        if (processSteps?.length > 0) {
            if (localOrderStatus === 'ALL_STEPS_COMPLETED' || localOrderStatus === 'COMPLETED') {
                newFocusIndex = processSteps.length - 1;
            } else if (contextActiveStepIndex !== null && contextActiveStepIndex >= 0 && contextActiveStepIndex < processSteps.length) {
                newFocusIndex = contextActiveStepIndex;
            } else {
                newFocusIndex = 0;
            }
        }
        if (newFocusIndex !== focusedStepIndex || (focusedStepIndex !== null && newFocusIndex !== null && focusedStepIndex >= processSteps.length)) {
            setFocusedStepIndex(newFocusIndex);
        } else if (focusedStepIndex === null && newFocusIndex !== null) {
            setFocusedStepIndex(newFocusIndex);
        }
    }, [contextActiveStepIndex, processSteps, localOrderStatus, orderId]);

    const focusedStepData = (focusedStepIndex !== null && processSteps && processSteps[focusedStepIndex])
        ? processSteps[focusedStepIndex]
        : null;

    const assignedEmployee = useMemo(() => {
        if (!focusedStepData?.idEmployee || !empleadosList?.length) return null;
        return empleadosList.find(emp => String(emp.idEmployee) === String(focusedStepData.idEmployee));
    }, [focusedStepData?.idEmployee, empleadosList]);


    const handleStepSelect = (index) => {
        if (!processSteps || index < 0 || index >= processSteps.length) return;
        const targetStep = processSteps[index];
        let canView = false;
        if (index === focusedStepIndex) canView = true;
        else if (targetStep.status === 'COMPLETED') canView = true;
        else if (!isOrderNewInFormContext && ['PENDING', 'SETUP', 'SETUP_COMPLETED', 'IN_PROGRESS', 'PAUSED', 'ALL_STEPS_COMPLETED'].includes(localOrderStatus)) {
            canView = true;
        }
        if (['IN_PROGRESS', 'PAUSED'].includes(localOrderStatus) && contextActiveStepIndex !== null && !canView) {
            if (index <= contextActiveStepIndex) canView = true;
            else { toast.error("Aún no puede acceder a este paso futuro.", { icon: "🚫" }); canView = false; }
        }
        if (canView) setFocusedStepIndex(index);
    };

    const canAssignEmployeesToSteps = !isOrderViewOnlyProp && (localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED');
    const canEditGeneralStepFields = focusedStepData && !isOrderViewOnlyProp && !isSaving && focusedStepData.status !== 'COMPLETED' &&
        ((localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') && focusedStepIndex === contextActiveStepIndex);

    if (isLoadingFichas && (!processSteps || processSteps.length === 0) && !selectedSpecSheetData) {
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</CardHeader><CardBody className="text-center p-4"><Spinner size="sm" /> Cargando procesos...</CardBody></Card></Col>);
    }
    if (!formOrder?.idProduct && (!processSteps || processSteps.length === 0)) {
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</CardHeader><CardBody><Alert color="secondary" className="m-3 text-center small">Seleccione un producto y guarde para cargar los procesos.</Alert></CardBody></Card></Col>);
    }
    if (formOrder?.idProduct && !selectedSpecSheetData && (!processSteps || processSteps.length === 0) && !isLoadingFichas) {
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</CardHeader><CardBody><Alert color="info" className="m-3 text-center small"><FileText size={16} className="me-1" />El producto seleccionado no tiene una ficha técnica con procesos definidos.</Alert></CardBody></Card></Col>);
    }
    if (selectedSpecSheetData && (!selectedSpecSheetData.specSheetProcesses || selectedSpecSheetData.specSheetProcesses.length === 0) && (!processSteps || processSteps.length === 0) && !isLoadingFichas) {
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</CardHeader><CardBody><p className="text-muted p-4 text-center">La ficha técnica seleccionada no tiene procesos.</p></CardBody></Card></Col>);
    }
    if ((!processSteps || processSteps.length === 0) && !isLoadingFichas) {
        let message = <p className="text-muted p-4 text-center">No hay procesos definidos para esta orden.</p>;
        if (localOrderStatus === 'PENDING' && isOrderNewInFormContext) {
            message = <Alert color="info" className="m-3 text-center small">Guarde el borrador para poder iniciar la orden y gestionar los procesos.</Alert>;
        } else if (['SETUP', 'SETUP_COMPLETED'].includes(localOrderStatus)) {
            message = <Alert color="info" className="m-3 text-center small">La orden está lista para ser iniciada. Al iniciarla, podrá gestionar los procesos.</Alert>;
        }
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</CardHeader><CardBody>{message}</CardBody></Card></Col>);
    }


    if (processViewMode === "sidebarWithFocus") {
        return (
            <Col md={12}>
                <Card className="shadow-sm">
                    <CardHeader className="py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                        <div><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</div>
                        <Button size="sm" outline color="secondary" onClick={() => setIsStepSidebarOpen(prev => !prev)} className="d-none d-md-inline-flex align-items-center" title={isStepSidebarOpen ? "Ocultar lista" : "Mostrar lista"}>
                            {isStepSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                            <span className="ms-1">{isStepSidebarOpen ? "Ocultar" : "Mostrar"}</span>
                        </Button>
                        <Button color="light" size="sm" onClick={() => setIsStepSidebarOpen(prev => !prev)} className="d-md-none border" title={isStepSidebarOpen ? "Cerrar menú" : "Abrir menú"}>
                            {isStepSidebarOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
                        </Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        <Row className="g-0">
                            <Col md={isStepSidebarOpen ? 4 : 0} lg={isStepSidebarOpen ? 3 : 0} className={`process-sidebar ${isStepSidebarOpen ? '' : ' visually-hidden d-md-block'}`} style={{ width: isStepSidebarOpen ? (window.innerWidth < 768 ? '100%' : undefined) : '0px', transition: 'width 0.3s ease-in-out', position: window.innerWidth < 768 && isStepSidebarOpen ? 'absolute' : 'relative', zIndex: window.innerWidth < 768 && isStepSidebarOpen ? 1050 : 1, height: window.innerWidth < 768 && isStepSidebarOpen ? 'calc(100% - 0px)' : 'auto', overflowY: 'auto' }} >
                                <Collapse isOpen={isStepSidebarOpen} className="h-100">
                                    <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                        <ListGroup flush>
                                            {processSteps.map((step, idx) => {
                                                const isFutureStepNotAllowed = (localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') && contextActiveStepIndex !== null && idx > contextActiveStepIndex && step.status !== 'COMPLETED';
                                                
                                                // <<<--- JSX MODIFICADO PARA SEPARAR NOMBRE Y ESTADO --- >>>
                                                return (
                                                    <ListGroupItem
                                                        key={step.idProductionOrderDetail || `step-${idx}-${orderId}`}
                                                        action
                                                        active={idx === focusedStepIndex}
                                                        onClick={() => handleStepSelect(idx)}
                                                        disabled={isSaving || isFutureStepNotAllowed}
                                                        className="py-2 px-3 list-group-item-action-condensed"
                                                        title={isFutureStepNotAllowed ? "Paso no disponible" : `Ver Paso ${step.processOrder}: ${step.processName}`}
                                                        style={{ cursor: (isSaving || isFutureStepNotAllowed) ? 'not-allowed' : 'pointer', opacity: (isSaving || isFutureStepNotAllowed) ? 0.6 : 1 }}
                                                    >
                                                        {/* Contenedor principal que permite el diseño vertical */}
                                                        <div>
                                                            {/* Línea 1: Nombre del paso */}
                                                            <div className={`step-name-container small ${idx === focusedStepIndex ? 'fw-bold' : ''}`}>
                                                                <span className="step-number">{step.processOrder || (idx + 1)}.</span>
                                                                <span className="step-name">{step.processName}</span>
                                                            </div>
                                                            {/* Línea 2: Estado del paso, con un pequeño margen superior */}
                                                            <div className="mt-1">
                                                                <StepStatusBadge status={step.status} getStatusInfo={getStatusInfo} />
                                                            </div>
                                                        </div>
                                                    </ListGroupItem>
                                                );
                                            })}
                                        </ListGroup>
                                    </div>
                                </Collapse>
                            </Col>

                            <Col md={isStepSidebarOpen && window.innerWidth >= 768 ? 8 : 12} lg={isStepSidebarOpen && window.innerWidth >= 768 ? 9 : 12} className={`p-3 process-step-content ${isStepSidebarOpen && window.innerWidth < 768 ? 'd-none' : ''}`} >
                                {focusedStepData ? (
                                    <div>
                                        <h6 className="mb-1">Paso {focusedStepData.processOrder || (focusedStepIndex !== null ? focusedStepIndex + 1 : '')}: {focusedStepData.processName}</h6>
                                        <p className="small text-muted mb-2">{focusedStepData.processDescription || "Sin descripción."}</p>
                                        {focusedStepData.estimatedTimeMinutes && <p className="small text-info mb-2">Tiempo Estimado: {focusedStepData.estimatedTimeMinutes} min.</p>}
                                        <hr className="my-2" />
                                        <Row className="g-2">
                                            <Col sm={6}>
                                                <FormGroup className="mb-2">
                                                    <Label for={`stepEmployee-${focusedStepIndex}`} className="small fw-semibold">Empleado Asignado:</Label>
                                                    {(focusedStepData.status === 'IN_PROGRESS' || focusedStepData.status === 'COMPLETED') && assignedEmployee ? (
                                                        <div className="d-flex align-items-center">
                                                            <Input type="text" bsSize="sm" readOnly disabled value={assignedEmployee.fullName || 'ID: ' + focusedStepData.idEmployee} className="fw-bold bg-light" title={`Empleado asignado: ${assignedEmployee.fullName}`} />
                                                            <UserCheck size={18} className="text-success ms-2 flex-shrink-0" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Input type="select" bsSize="sm" name={`stepEmployee-${focusedStepIndex}`} id={`stepEmployee-${focusedStepIndex}`} value={focusedStepData.idEmployee || ''}
                                                                onChange={(e) => handleEmployeeSelectionForStep(focusedStepIndex, e.target.value)}
                                                                disabled={ isLoadingEmpleados || isOrderViewOnlyProp || !canAssignEmployeesToSteps || ((localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') && focusedStepIndex !== contextActiveStepIndex) }
                                                                title={ isLoadingEmpleados ? "Cargando lista de empleados..." : isOrderViewOnlyProp ? "Orden en modo de solo lectura." : !canAssignEmployeesToSteps ? "La orden debe estar 'En Proceso' para asignar empleados." : ((localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') && focusedStepIndex !== contextActiveStepIndex) ? "Solo se puede asignar el empleado del paso activo." : "Seleccionar empleado para este paso" }
                                                            >
                                                                <option value="">{isLoadingEmpleados ? "Cargando..." : "Seleccionar..."}</option>
                                                                {empleadosList.map(emp => (<option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>))}
                                                            </Input>
                                                        </>
                                                    )}
                                                </FormGroup>
                                            </Col>
                                            <Col sm={6}>
                                                <FormGroup className="mb-2">
                                                    <Label for={`stepStatus-${focusedStepIndex}`} className="small fw-semibold d-flex align-items-center">
                                                        Estado del Paso:
                                                    </Label>
                                                    <div className="mt-1">
                                                       <StepStatusBadge status={focusedStepData.status} getStatusInfo={getStatusInfo} />
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <FormGroup className="mb-2">
                                            <Label for={`stepObs-${focusedStepIndex}`} className="small fw-semibold">Observaciones:</Label>
                                            <Input type="textarea" bsSize="sm" rows={2} name={`stepObs-${focusedStepIndex}`} id={`stepObs-${focusedStepIndex}`} value={focusedStepData.observations || ''} onChange={(e) => handleStepFieldChange(focusedStepIndex, 'observations', e.target.value)} disabled={!canEditGeneralStepFields || isOrderViewOnlyProp} placeholder="Añadir notas sobre el paso..." />
                                        </FormGroup>

                                        {!isOrderViewOnlyProp && !isSaving && (localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED') && focusedStepIndex === contextActiveStepIndex && (
                                            <div className="mt-2 text-end">
                                                {focusedStepData.status === 'PENDING' && (<Button color="success" size="sm" onClick={() => handleStartCurrentStep()} disabled={!focusedStepData.idEmployee || isSaving || isProcessingAction} title={!focusedStepData.idEmployee ? "Asigne un empleado para poder iniciar" : "Iniciar paso"}> <PlayCircle size={16} className="me-1" /> Iniciar Paso </Button>)}
                                                {focusedStepData.status === 'IN_PROGRESS' && (<Button color="primary" size="sm" onClick={() => handleCompleteCurrentStep()} disabled={isSaving || isProcessingAction} > <CheckCircle size={16} className="me-1" /> Completar Paso </Button>)}
                                            </div>
                                        )}
                                        {focusedStepData.status === 'COMPLETED' && (<Alert color="success" className="mt-2 py-1 px-2 small d-flex align-items-center"><CheckCircle size={14} className="me-1" />Paso completado.</Alert>)}
                                        {(localOrderStatus === 'PENDING' || localOrderStatus === 'SETUP' || localOrderStatus === 'SETUP_COMPLETED') && focusedStepData.status === 'PENDING' && (<Alert color="info" className="mt-2 py-1 px-2 small">La orden debe estar "En Proceso" para poder gestionar este paso.</Alert>)}
                                    </div>
                                ) : (<div className="text-center text-muted py-5"><Info size={32} className="mb-2" /><p>{processSteps?.length > 0 ? "Seleccione un paso de la lista." : "No hay procesos definidos."}</p></div>)}
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Col>
        );
    }
    return <Col md={12}><Card><CardHeader>Gestión de Procesos</CardHeader><CardBody><Alert color="danger">Error: Modo de vista no válido.</Alert></CardBody></Card></Col>;
};

export default ProcessManagementSection;