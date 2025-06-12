import React, { useState, useEffect, useMemo } from 'react';
import {
    Row, Col, Card, CardHeader, CardBody, ListGroup, ListGroupItem,
    Collapse, Input, Button, FormGroup, Label, Spinner, Alert
} from 'reactstrap';
import {
    Edit, PlayCircle, CheckCircle, FileText, Info, ChevronLeft,
    ChevronRight, Menu as MenuIcon, X as XIcon, UserCheck, PauseCircle
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
        // --- CORRECCIÓN: Añadir el color 'info' para que 'PAUSED' y 'SKIPPED' tengan el estilo correcto
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
    isOrderViewOnly: isOrderViewOnlyProp, // Esta prop ahora encapsula todas las reglas de solo lectura
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
            } else if (processSteps.length > 0) {
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
        if (isOrderViewOnlyProp) {
            toast.error("La orden está en modo de solo lectura.", { icon: "🔒" });
            return;
        }
        if (!processSteps || index < 0 || index >= processSteps.length) return;
        setFocusedStepIndex(index);
    };

    // --- CORRECCIÓN: La lógica de deshabilitación ahora es más simple y depende de isOrderViewOnlyProp ---
    const canAssignEmployeesToSteps = !isOrderViewOnlyProp && localOrderStatus === 'IN_PROGRESS';
    const canEditGeneralStepFields = focusedStepData && !isOrderViewOnlyProp && !isSaving && focusedStepData.status === 'IN_PROGRESS' && localOrderStatus === 'IN_PROGRESS' && focusedStepIndex === contextActiveStepIndex;

    // --- Renderizados condicionales iniciales (sin cambios) ---
    if (isLoadingFichas && (!processSteps || processSteps.length === 0) && !selectedSpecSheetData) {
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</CardHeader><CardBody className="text-center p-4"><Spinner size="sm" /> Cargando procesos...</CardBody></Card></Col>);
    }
    if (!formOrder?.idProduct && (!processSteps || processSteps.length === 0)) {
        return (<Col md={12}><Card className="shadow-sm"><CardHeader className="py-2 px-3 bg-light"><Edit size={16} className="me-2 text-muted" /> Gestión de Procesos</CardHeader><CardBody><Alert color="secondary" className="m-3 text-center small">Seleccione un producto y guarde para cargar los procesos.</Alert></CardBody></Card></Col>);
    }
    if ((!processSteps || processSteps.length === 0) && !isLoadingFichas) {
        let message = <p className="text-muted p-4 text-center">No hay procesos definidos para esta orden.</p>;
        if (localOrderStatus === 'PENDING' && isOrderNewInFormContext) {
            message = <Alert color="info" className="m-3 text-center small">Guarde el borrador para poder iniciar la orden y gestionar los procesos.</Alert>;
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
                    </CardHeader>
                    <CardBody className="p-0">
                         {/* --- ALERTA INFORMATIVA CUANDO ESTÁ EN PAUSA Y NO SE TIENEN PERMISOS --- */}
                        {isOrderViewOnlyProp && localOrderStatus === 'PAUSED' && (
                            <Alert color="info" className="m-3 text-center">
                                <PauseCircle className="me-2" />
                                La orden está en pausa. Solo un Administrador o Jefe de Cocina puede reanudarla.
                            </Alert>
                        )}
                        <Row className="g-0">
                            <Col md={isStepSidebarOpen ? 4 : 0} lg={isStepSidebarOpen ? 3 : 0} className={`process-sidebar ${isStepSidebarOpen ? '' : 'd-none'}`}>
                                <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                    <ListGroup flush>
                                        {processSteps.map((step, idx) => {
                                            return (
                                                <ListGroupItem
                                                    key={step.idProductionOrderDetail || `step-${idx}-${orderId}`}
                                                    action
                                                    active={idx === focusedStepIndex}
                                                    onClick={() => handleStepSelect(idx)}
                                                    disabled={isSaving || isOrderViewOnlyProp}
                                                    className="py-2 px-3"
                                                    style={{ cursor: (isSaving || isOrderViewOnlyProp) ? 'not-allowed' : 'pointer' }}
                                                >
                                                    <div>
                                                        <div className={`step-name-container small ${idx === focusedStepIndex ? 'fw-bold' : ''}`}>
                                                            <span className="step-number">{step.processOrder || (idx + 1)}.</span>
                                                            <span className="step-name">{step.processName}</span>
                                                        </div>
                                                        <div className="mt-1">
                                                            <StepStatusBadge status={step.status} getStatusInfo={getStatusInfo} />
                                                        </div>
                                                    </div>
                                                </ListGroupItem>
                                            );
                                        })}
                                    </ListGroup>
                                </div>
                            </Col>

                            <Col md={isStepSidebarOpen ? 8 : 12} lg={isStepSidebarOpen ? 9 : 12} className="p-3">
                                {focusedStepData ? (
                                    <div>
                                        <h6 className="mb-1">Paso {focusedStepData.processOrder}: {focusedStepData.processName}</h6>
                                        <p className="small text-muted mb-2">{focusedStepData.processDescription || "Sin descripción."}</p>
                                        <hr className="my-2" />
                                        <Row className="g-2">
                                            <Col sm={6}>
                                                <FormGroup className="mb-2">
                                                    <Label className="small fw-semibold">Empleado Asignado:</Label>
                                                    <Input
                                                        type="select"
                                                        bsSize="sm"
                                                        value={focusedStepData.idEmployee || ''}
                                                        onChange={(e) => handleEmployeeSelectionForStep(focusedStepIndex, e.target.value)}
                                                        // --- CORRECCIÓN: Simplificamos la condición de deshabilitado
                                                        disabled={isOrderViewOnlyProp || isSaving || focusedStepData.status !== 'PENDING' || focusedStepIndex !== contextActiveStepIndex}
                                                    >
                                                        <option value="">{isLoadingEmpleados ? "Cargando..." : "Seleccionar..."}</option>
                                                        {empleadosList.map(emp => (<option key={emp.idEmployee} value={emp.idEmployee}>{emp.firstName} {emp.lastName}</option>))}
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                            <Col sm={6}>
                                                <FormGroup className="mb-2">
                                                    <Label className="small fw-semibold">Estado del Paso:</Label>
                                                    <div className="mt-1">
                                                       <StepStatusBadge status={focusedStepData.status} getStatusInfo={getStatusInfo} />
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <FormGroup className="mb-2">
                                            <Label className="small fw-semibold">Observaciones:</Label>
                                            <Input
                                                type="textarea"
                                                bsSize="sm"
                                                rows={2}
                                                value={focusedStepData.observations || ''}
                                                onChange={(e) => handleStepFieldChange(focusedStepIndex, 'observations', e.target.value)}
                                                // --- CORRECCIÓN: Usamos la prop directamente
                                                disabled={isOrderViewOnlyProp || isSaving || localOrderStatus !== 'IN_PROGRESS' || focusedStepIndex !== contextActiveStepIndex}
                                                placeholder="Añadir notas sobre el paso..."
                                            />
                                        </FormGroup>

                                        {/* --- CORRECCIÓN: Botones de acción de los pasos --- */}
                                        {focusedStepIndex === contextActiveStepIndex && !isOrderViewOnlyProp && (
                                            <div className="mt-2 text-end">
                                                {focusedStepData.status === 'PENDING' && (
                                                    <Button color="success" size="sm" onClick={handleStartCurrentStep} disabled={!focusedStepData.idEmployee || isProcessingAction}>
                                                        <PlayCircle size={16} className="me-1" /> Iniciar Paso
                                                    </Button>
                                                )}
                                                {focusedStepData.status === 'IN_PROGRESS' && (
                                                    <Button color="primary" size="sm" onClick={handleCompleteCurrentStep} disabled={isProcessingAction}>
                                                        <CheckCircle size={16} className="me-1" /> Completar Paso
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        {focusedStepData.status === 'COMPLETED' && (<Alert color="success" className="mt-2 py-1 px-2 small">Paso completado.</Alert>)}
                                    </div>
                                ) : (<div className="text-center text-muted py-5"><Info size={32} className="mb-2" /><p>Seleccione un paso.</p></div>)}
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