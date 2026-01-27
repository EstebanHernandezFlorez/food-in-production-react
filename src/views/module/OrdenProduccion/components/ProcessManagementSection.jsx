import React, { useState, useEffect, useMemo } from 'react';
import {
    Row, Col, Card, CardHeader, CardBody, ListGroup, ListGroupItem,
    Input, Button, FormGroup, Label, Spinner, Alert, UncontrolledTooltip
} from 'reactstrap';
import {
    Edit, ChevronLeft, ChevronRight, PlayCircle, CheckCircle, Info, Lock
} from 'lucide-react';

// Se asume que los estilos están en la ruta correcta
import '../../../../assets/css/produccion/ProduccionStyles.css';

/**
 * Componente interno para visualizar el estado de cada paso con un estilo moderno (Pills).
 * Utiliza las clases definidas en tu CSS para evitar el look genérico de Bootstrap.
 */
const StepStatusBadge = ({ status, getStatusInfo }) => {
    const info = getStatusInfo ? getStatusInfo(status) : { text: status, color: 'secondary' };
    
    // Mapeo a las clases modernas de tu CSS (status-pending, status-in-progress, etc.)
    const statusClassMap = {
        'secondary': 'status-pending',
        'warning': 'status-in-progress',
        'success': 'status-completed',
        'info': 'status-paused',
        'primary': 'status-in-progress'
    };

    return (
        <div className={`step-status-pill ${statusClassMap[info.color] || 'status-pending'}`}>
            {info.icon && React.cloneElement(info.icon, { size: 12, strokeWidth: 2.5 })}
            <span>{info.text}</span>
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
    isOrderViewOnly,
    isLoadingFichas,
    processViewMode, // "sidebarWithFocus"
    getStatusInfo,
    icons
}) => {
    // Iconos pasados por props
    const { EditIcon, ChevronLeftIcon, ChevronRightIcon, PlayCircleIcon, CheckCircleIcon, InfoIcon } = icons;

    const [focusedStepIndex, setFocusedStepIndex] = useState(null);
    const [isStepSidebarOpen, setIsStepSidebarOpen] = useState(true);

    const {
        processSteps = [],
        activeStepIndex: contextActiveStepIndex = null,
        id: orderId = null
    } = currentOrderData || {};

    // Sincronizar el foco con el paso activo al cargar la orden
    useEffect(() => {
        if (processSteps?.length > 0) {
            const newFocusIndex = (contextActiveStepIndex !== null && contextActiveStepIndex >= 0) 
                ? contextActiveStepIndex 
                : 0;
            setFocusedStepIndex(newFocusIndex);
        }
    }, [contextActiveStepIndex, processSteps.length, orderId]);

    const focusedStepData = useMemo(() => (
        (focusedStepIndex !== null && processSteps[focusedStepIndex]) ? processSteps[focusedStepIndex] : null
    ), [focusedStepIndex, processSteps]);

    const handleStepSelect = (index) => {
        setFocusedStepIndex(index);
    };

    // Mensajes de ayuda para el selector de empleados
    const getEmployeeSelectorTooltip = () => {
        if (!focusedStepData) return "";
        if (isOrderViewOnly) return "La orden está en modo de solo lectura.";
        if (focusedStepData.status === 'IN_PROGRESS') return "No se puede cambiar el empleado mientras el paso está en progreso.";
        if (focusedStepData.status === 'COMPLETED' || focusedStepData.status === 'SKIPPED') return "Este paso ya ha sido finalizado.";
        if (focusedStepIndex !== contextActiveStepIndex) return "Solo se puede asignar el empleado en el paso activo actual.";
        return "";
    };

    if (isLoadingFichas && !processSteps.length) {
        return (
            <Card className="shadow-sm border-0">
                <CardBody className="text-center py-5">
                    <Spinner size="sm" color="primary" className="mb-2" />
                    <p className="text-muted mb-0 small">Cargando procesos de producción...</p>
                </CardBody>
            </Card>
        );
    }

    if (!processSteps.length && !isLoadingFichas) {
        return (
            <Card className="shadow-sm border-0">
                <CardBody className="text-center py-4">
                    <Alert color="info" className="mb-0 small">
                        Guarde la orden para cargar los procesos de la ficha técnica.
                    </Alert>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-0 overflow-hidden">
            <CardHeader className="py-2 px-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                <div className="fw-bold text-brown d-flex align-items-center">
                    <EditIcon size={16} className="me-2 text-muted" /> Gestión de Procesos
                </div>
                <Button 
                    size="sm" 
                    outline 
                    color="secondary" 
                    onClick={() => setIsStepSidebarOpen(p => !p)} 
                    className="d-none d-md-inline-flex align-items-center border-0"
                >
                    {isStepSidebarOpen ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}
                    <span className="ms-1 small">{isStepSidebarOpen ? "Ocultar Pasos" : "Mostrar Pasos"}</span>
                </Button>
            </CardHeader>
            <CardBody className="p-0">
                <Row className="g-0" style={{ minHeight: '250px' }}>
                    {/* SIDEBAR DE PASOS */}
                    <Col 
                        md={isStepSidebarOpen ? 4 : 0} 
                        className={`process-steps-sidebar-col ${isStepSidebarOpen ? '' : 'd-none'}`}
                    >
                        <div className="process-steps-list-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                            <ListGroup flush>
                                {processSteps.map((step, idx) => (
                                    <ListGroupItem 
                                        key={step.idProductionOrderDetail || `step-${idx}`} 
                                        className={`process-step-item ${idx === focusedStepIndex ? 'process-step-item-selected' : ''}`}
                                        onClick={() => handleStepSelect(idx)}
                                        disabled={isSaving || isProcessingAction}
                                    >
                                        <div className="d-flex justify-content-between align-items-start w-100">
                                            <div className="d-flex flex-column">
                                                <span className="step-number-sub">Paso {step.processOrder || (idx + 1)}</span>
                                                <span className="step-name-text text-truncate" style={{maxWidth: '180px'}}>
                                                    {step.processNameSnapshot}
                                                </span>
                                            </div>
                                            {/* Indicador visual del paso activo real */}
                                            {idx === contextActiveStepIndex && (
                                                <div className="pulsating-dot mt-1" title="Paso actual en ejecución" />
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <StepStatusBadge status={step.status} getStatusInfo={getStatusInfo} />
                                        </div>
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        </div>
                    </Col>

                    {/* CONTENIDO DEL PASO ENFOCADO */}
                    <Col md={isStepSidebarOpen ? 8 : 12} className="p-4 bg-white border-start">
                        {focusedStepData ? (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 className="fw-bold mb-1 text-brown">
                                            {focusedStepData.processNameSnapshot}
                                        </h5>
                                        <p className="small text-muted mb-0">
                                            {focusedStepData.processDescriptionSnapshot || "Sin descripción detallada."}
                                        </p>
                                    </div>
                                    <StepStatusBadge status={focusedStepData.status} getStatusInfo={getStatusInfo} />
                                </div>

                                <hr className="my-3 opacity-25" />

                                <Row className="g-3">
                                    <Col md={7}>
                                        <FormGroup className="mb-0" id={`employee-group-${focusedStepIndex}`}>
                                            <Label className="small fw-bold text-uppercase opacity-75 mb-1">
                                                {focusedStepData.status !== 'PENDING' && <Lock size={12} className="me-1" />}
                                                Responsable Asignado
                                            </Label>
                                            <Input
                                                id={`employee-select-${focusedStepIndex}`}
                                                type="select"
                                                bsSize="sm"
                                                className="border-0 bg-light shadow-sm"
                                                value={String(focusedStepData.idEmployeeAssigned || '')}
                                                onChange={(e) => handleEmployeeSelectionForStep(focusedStepIndex, e.target.value)}
                                                disabled={
                                                    isOrderViewOnly || 
                                                    isSaving || isProcessingAction || 
                                                    focusedStepData.status !== 'PENDING' || 
                                                    focusedStepIndex !== contextActiveStepIndex
                                                }
                                            >
                                                <option value="">{isLoadingEmpleados ? "Cargando..." : "-- Seleccionar Empleado --"}</option>
                                                {empleadosList?.map(emp => (
                                                    <option key={emp.idEmployee} value={String(emp.idEmployee)}>{emp.fullName}</option>
                                                ))}
                                            </Input>
                                            {getEmployeeSelectorTooltip() && (
                                                <UncontrolledTooltip placement="top" target={`employee-group-${focusedStepIndex}`}>
                                                    {getEmployeeSelectorTooltip()}
                                                </UncontrolledTooltip>
                                            )}
                                        </FormGroup>
                                    </Col>
                                    <Col md={5}>
                                        <FormGroup className="mb-0">
                                            <Label className="small fw-bold text-uppercase opacity-75 mb-1">Estado de Tarea</Label>
                                            <div className="p-1 px-2 bg-light rounded border-start border-3 border-warning d-flex align-items-center" style={{height: '31px'}}>
                                                <span className="small fw-semibold">{getStatusInfo ? getStatusInfo(focusedStepData.status).text : focusedStepData.status}</span>
                                            </div>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <FormGroup className="mt-4 mb-4">
                                    <Label className="small fw-bold text-uppercase opacity-75 mb-1">
                                        Observaciones y Bitácora
                                    </Label>
                                    <Input
                                        id={`observations-text-${focusedStepIndex}`}
                                        type="textarea"
                                        rows={3}
                                        className="border-0 bg-light p-3"
                                        style={{ borderRadius: '10px' }}
                                        value={focusedStepData.observations || ''}
                                        onChange={(e) => handleStepFieldChange(focusedStepIndex, 'observations', e.target.value)}
                                        disabled={isOrderViewOnly || isSaving || focusedStepData.status !== 'IN_PROGRESS'}
                                        placeholder={focusedStepData.status === 'IN_PROGRESS' 
                                            ? "Escriba aquí notas sobre este proceso..." 
                                            : "Las observaciones se registran mientras el paso está en proceso."}
                                    />
                                </FormGroup>

                                {/* ACCIONES DEL PASO ACTIVO */}
                                {!isOrderViewOnly && focusedStepIndex === contextActiveStepIndex && (
                                    <div className="d-flex justify-content-end gap-3 mt-4 border-top pt-3">
                                        {focusedStepData.status === 'PENDING' && (
                                            <Button 
                                                color="success" 
                                                className="px-4 py-2 d-flex align-items-center"
                                                onClick={handleStartCurrentStep} 
                                                disabled={!focusedStepData.idEmployeeAssigned || isProcessingAction || isSaving}
                                            >
                                                <PlayCircleIcon size={18} className="me-2" /> Iniciar Paso
                                            </Button>
                                        )}
                                        {focusedStepData.status === 'IN_PROGRESS' && (
                                            <Button 
                                                color="primary" 
                                                className="px-4 py-2 d-flex align-items-center"
                                                onClick={handleCompleteCurrentStep} 
                                                disabled={isProcessingAction || isSaving}
                                            >
                                                <CheckCircleIcon size={18} className="me-2" /> Completar Paso
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50 py-5">
                                <InfoIcon size={48} className="mb-3" />
                                <p className="fw-medium">Seleccione un paso de la lista para gestionar el progreso</p>
                            </div>
                        )}
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
};

export default ProcessManagementSection;