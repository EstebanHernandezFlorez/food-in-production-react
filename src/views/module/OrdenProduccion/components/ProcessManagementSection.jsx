import React, { useState, useEffect, useMemo } from 'react';
import {
    Row, Col, Card, CardHeader, CardBody, ListGroup, ListGroupItem,
    Input, Button, FormGroup, Label, Spinner, Alert
} from 'reactstrap';
import {
    Edit, PlayCircle, CheckCircle, Info, ChevronLeft,
    ChevronRight, PauseCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import '../../../../assets/css/produccion/ProduccionStyles.css';

// Componente para el estado de un paso (sin cambios)
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
    getStatusInfo 
}) => {
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
        return <Col md={12}><Card className="shadow-sm"><CardHeader>Gestión de Procesos</CardHeader><CardBody className="text-center p-4"><Spinner size="sm" /> Cargando...</CardBody></Card></Col>;
    }
    if (!processSteps.length && !isLoadingFichas) {
        return <Col md={12}><Card className="shadow-sm"><CardHeader>Gestión de Procesos</CardHeader><CardBody><Alert color="info" className="m-3 text-center small">Guarde el borrador para cargar los procesos.</Alert></CardBody></Card></Col>;
    }

    if (processViewMode === "sidebarWithFocus") {
        return (
            <Col md={12}>
                <Card className="shadow-sm">
                    <CardHeader className="py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                        <div><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</div>
                        <Button size="sm" outline color="secondary" onClick={() => setIsStepSidebarOpen(p => !p)} className="d-none d-md-inline-flex align-items-center">
                            {isStepSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}<span className="ms-1">{isStepSidebarOpen ? "Ocultar" : "Mostrar"}</span>
                        </Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        {isOrderViewOnlyProp && localOrderStatus === 'PAUSED' && (
                            <Alert color="info" className="m-3 text-center"><PauseCircle className="me-2" />La orden está en pausa.</Alert>
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
                                        <Row className="g-3">
                                            <Col sm={6}>
                                                <FormGroup className="mb-2">
                                                    <Label className="small fw-semibold" htmlFor={`employee-select-${focusedStepIndex}`}>Empleado Asignado:</Label>
                                                    <Input
                                                        id={`employee-select-${focusedStepIndex}`}
                                                        type="select"
                                                        bsSize="sm"
                                                        value={focusedStepData.idEmployee || ''}
                                                        onChange={(e) => handleEmployeeSelectionForStep(focusedStepIndex, e.target.value)}
                                                        disabled={isOrderViewOnlyProp || isSaving || focusedStepData.status === 'COMPLETED'}
                                                    >
                                                        <option value="">{isLoadingEmpleados ? "Cargando..." : "-- Seleccionar --"}</option>
                                                        {empleadosList && empleadosList.length > 0 && empleadosList.map(emp => (
                                                            // =========== CORRECCIÓN PRINCIPAL AQUÍ ===========
                                                            // Ahora, este selector también usará la propiedad `emp.fullName` 
                                                            // para ser consistente con el otro selector.
                                                            <option key={emp.idEmployee} value={emp.idEmployee}>
                                                                {emp.fullName}
                                                            </option>
                                                            // ===============================================
                                                        ))}
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                            <Col sm={6}>
                                                <FormGroup className="mb-2">
                                                    <Label className="small fw-semibold">Estado del Paso:</Label>
                                                    <div className="mt-1"><StepStatusBadge status={focusedStepData.status} getStatusInfo={getStatusInfo} /></div>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <FormGroup className="mb-2">
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
                                                        <PlayCircle size={16} className="me-1" /> Iniciar Paso
                                                    </Button>
                                                )}
                                                {focusedStepData.status === 'IN_PROGRESS' && (
                                                    <Button color="primary" size="sm" onClick={handleCompleteCurrentStep} disabled={isProcessingAction || isSaving}>
                                                        <CheckCircle size={16} className="me-1" /> Completar Paso
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        {focusedStepData.status === 'COMPLETED' && (<Alert color="success" className="mt-2 py-1 px-2 small text-center">Paso completado.</Alert>)}
                                    </div>
                                ) : (<div className="text-center text-muted py-5"><Info size={32} className="mb-2" /><p>Seleccione un paso de la lista.</p></div>)}
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Col>
        );
    }
    return null;
};

export default ProcessManagementSection;