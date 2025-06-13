// src/views/module/OrdenProduccion/components/ProcessManagementSection.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
    Row, Col, Card, CardHeader, CardBody, ListGroup, ListGroupItem,
    Input, Button, FormGroup, Label, Spinner, Alert
} from 'reactstrap';

// Se han eliminado las importaciones directas de lucide-react, ya que vendrán por props.

import '../../../../assets/css/produccion/ProduccionStyles.css';

// --- Funciones Helper para el tiempo (sin cambios) ---
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m `;
    result += `${s}s`;
    return result.trim();
};

const calculateTotalDuration = (start, end) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
    return formatDuration((endDate - startDate) / 1000);
};

// --- Componente para el Cronómetro en Vivo (Modificado para usar el ícono de las props) ---
const StepTimer = ({ startDate, TimerIcon }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!startDate) return;
        const startTimestamp = new Date(startDate).getTime();
        const intervalId = setInterval(() => {
            const now = Date.now();
            setElapsedSeconds((now - startTimestamp) / 1000);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [startDate]);

    if (!TimerIcon) return null; // Guarda contra el ícono faltante

    return (
        <div className="d-flex align-items-center text-warning fw-bold">
            <TimerIcon size={16} className="me-2" />
            <span>{formatDuration(elapsedSeconds)}</span>
        </div>
    );
};

// --- Componente para el estado de un paso (sin cambios) ---
const StepStatusBadge = ({ status, getStatusInfo }) => {
    if (!getStatusInfo) {
        return <span className="badge bg-secondary">{status || 'Desconocido'}</span>;
    }
    const { text, icon, color } = getStatusInfo(status);
    const statusClassMap = {
        secondary: 'status-pending',
        warning: 'status-in-progress',
        success: 'status-completed',
        info: 'status-paused'
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
    getStatusInfo,
    icons // <-- Aceptamos el prop 'icons'
}) => {
    // Desestructuramos los iconos que necesitamos del prop 'icons'
    const { 
        EditIcon, ChevronLeftIcon, ChevronRightIcon, PauseCircleIcon, 
        PlayCircleIcon, CheckCircleIcon, InfoIcon, TimerIcon 
    } = icons;

    const [focusedStepIndex, setFocusedStepIndex] = useState(null);
    const [isStepSidebarOpen, setIsStepSidebarOpen] = useState(true);

    const {
        processSteps = [],
        activeStepIndex: contextActiveStepIndex = null,
        localOrderStatus = 'PENDING',
        id: orderId = null
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
        if (newFocusIndex !== focusedStepIndex) {
            setFocusedStepIndex(newFocusIndex);
        }
    }, [contextActiveStepIndex, processSteps, localOrderStatus, orderId, focusedStepIndex]);

    const focusedStepData = useMemo(() => (
        (focusedStepIndex !== null && processSteps[focusedStepIndex]) ? processSteps[focusedStepIndex] : null
    ), [focusedStepIndex, processSteps]);

    const handleStepSelect = (index) => {
        if (!processSteps || index < 0 || index >= processSteps.length) return;
        setFocusedStepIndex(index);
    };
    
    if (isLoadingFichas && !processSteps.length) {
        return <Card className="shadow-sm"><CardHeader>Gestión de Procesos</CardHeader><CardBody className="text-center p-4"><Spinner size="sm" /> Cargando...</CardBody></Card>;
    }
    if (!processSteps.length && !isLoadingFichas) {
        return <Card className="shadow-sm"><CardHeader>Gestión de Procesos</CardHeader><CardBody><Alert color="info" className="m-3 text-center small">Guarde el borrador para cargar los procesos.</Alert></CardBody></Card>;
    }
    
    // Verificamos que los iconos existan antes de renderizar para evitar errores
    if (!EditIcon || !ChevronLeftIcon || !ChevronRightIcon || !PauseCircleIcon || !PlayCircleIcon || !CheckCircleIcon || !InfoIcon || !TimerIcon) {
        console.error("Faltan uno o más componentes de iconos en las props.");
        return <Alert color="danger">Error: Faltan componentes de UI.</Alert>;
    }

    if (processViewMode === "sidebarWithFocus") {
        return (
            <Card className="shadow-sm">
                <CardHeader className="py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                    <div><EditIcon size={16} className="me-2 text-muted" /> Gestión de Procesos</div>
                    <Button size="sm" outline color="secondary" onClick={() => setIsStepSidebarOpen(p => !p)} className="d-none d-md-inline-flex align-items-center">
                        {isStepSidebarOpen ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}<span className="ms-1">{isStepSidebarOpen ? "Ocultar" : "Mostrar"}</span>
                    </Button>
                </CardHeader>
                <CardBody className="p-0">
                    {isOrderViewOnlyProp && localOrderStatus === 'PAUSED' && (
                        <Alert color="info" className="m-3 text-center"><PauseCircleIcon className="me-2" />La orden está en pausa.</Alert>
                    )}
                    <Row className="g-0">
                        <Col md={isStepSidebarOpen ? 4 : 0} lg={isStepSidebarOpen ? 3 : 0} className={`process-sidebar ${isStepSidebarOpen ? '' : 'd-none'}`}>
                            <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                                <ListGroup flush>
                                    {processSteps.map((step, idx) => (
                                        <ListGroupItem key={step.idProductionOrderDetail || `step-${idx}`} action active={idx === focusedStepIndex} onClick={() => handleStepSelect(idx)} disabled={isSaving} className="py-2 px-3">
                                            <div className={`step-name-container small ${idx === focusedStepIndex ? 'fw-bold' : ''}`}>
                                                <span className="step-number">{step.processOrder || (idx + 1)}.</span>
                                                <span className="step-name">{step.processName}</span>
                                            </div>
                                            <div className="mt-1"><StepStatusBadge status={step.status} getStatusInfo={getStatusInfo} /></div>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            </div>
                        </Col>
                        <Col md={isStepSidebarOpen ? 8 : 12} lg={isStepSidebarOpen ? 9 : 12} className="p-3 border-start">
                            {focusedStepData ? (
                                <div>
                                    <h6 className="mb-1">Paso {focusedStepData.processOrder}: {focusedStepData.processName}</h6>
                                    <p className="small text-muted mb-2">{focusedStepData.processDescription || "Sin descripción."}</p>
                                    <hr className="my-2" />
                                    <Row className="g-3 align-items-center">
                                        <Col sm={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-semibold" htmlFor={`employee-select-${focusedStepIndex}`}>Empleado Asignado:</Label>
                                                <Input
                                                    id={`employee-select-${focusedStepIndex}`}
                                                    type="select"
                                                    bsSize="sm"
                                                    value={focusedStepData.idEmployee || ''}
                                                    onChange={(e) => handleEmployeeSelectionForStep(focusedStepIndex, e.target.value)}
                                                    disabled={ isOrderViewOnlyProp || isSaving || focusedStepData.status === 'COMPLETED' || focusedStepData.status === 'IN_PROGRESS'}
                                                >
                                                    <option value="">{isLoadingEmpleados ? "Cargando..." : "-- Seleccionar --"}</option>
                                                    {empleadosList && empleadosList.map(emp => (
                                                        <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col sm={3}>
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-semibold">Estado:</Label>
                                                <div className="mt-1"><StepStatusBadge status={focusedStepData.status} getStatusInfo={getStatusInfo} /></div>
                                            </FormGroup>
                                        </Col>
                                        <Col sm={3}>
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-semibold">Duración:</Label>
                                                <div className="mt-1">
                                                    {focusedStepData.status === 'IN_PROGRESS' && <StepTimer startDate={focusedStepData.startDate} TimerIcon={TimerIcon} />}
                                                    {focusedStepData.status === 'COMPLETED' && (
                                                        <div className="d-flex align-items-center text-success fw-bold">
                                                            <TimerIcon size={16} className="me-2" />
                                                            <span>{calculateTotalDuration(focusedStepData.startDate, focusedStepData.endDate) || '-'}</span>
                                                        </div>
                                                    )}
                                                    {(focusedStepData.status === 'PENDING' || focusedStepData.status === 'PAUSED' || !focusedStepData.status) && (
                                                        <div className="d-flex align-items-center text-muted">
                                                            <TimerIcon size={16} className="me-2" />
                                                            <span>-</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <FormGroup className="mt-3 mb-2">
                                        <Label className="small fw-semibold" htmlFor={`observations-text-${focusedStepIndex}`}>Observaciones:</Label>
                                        <Input
                                            id={`observations-text-${focusedStepIndex}`}
                                            type="textarea"
                                            bsSize="sm"
                                            rows={2}
                                            value={focusedStepData.observations || ''}
                                            onChange={(e) => handleStepFieldChange(focusedStepIndex, 'observations', e.target.value)}
                                            disabled={isOrderViewOnlyProp || isSaving || localOrderStatus !== 'IN_PROGRESS' || focusedStepIndex !== contextActiveStepIndex}
                                            placeholder="Añadir notas sobre el paso..."
                                        />
                                    </FormGroup>
                                    {focusedStepIndex === contextActiveStepIndex && !isOrderViewOnlyProp && (
                                        <div className="mt-3 text-end">
                                            {focusedStepData.status === 'PENDING' && (
                                                <Button color="success" size="sm" onClick={handleStartCurrentStep} disabled={!focusedStepData.idEmployee || isProcessingAction || isSaving}>
                                                    <PlayCircleIcon size={16} className="me-1" /> Iniciar Paso
                                                </Button>
                                            )}
                                            {focusedStepData.status === 'IN_PROGRESS' && (
                                                <Button color="primary" size="sm" onClick={handleCompleteCurrentStep} disabled={isProcessingAction || isSaving}>
                                                    <CheckCircleIcon size={16} className="me-1" /> Completar Paso
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    {focusedStepData.status === 'COMPLETED' && (<Alert color="success" className="mt-2 py-1 px-2 small text-center">Paso completado.</Alert>)}
                                </div>
                            ) : (<div className="text-center text-muted py-5"><InfoIcon size={32} className="mb-2" /><p>Seleccione un paso de la lista.</p></div>)}
                        </Col>
                    </Row>
                </CardBody>
            </Card>
        );
    }
    return null;
};

export default ProcessManagementSection;