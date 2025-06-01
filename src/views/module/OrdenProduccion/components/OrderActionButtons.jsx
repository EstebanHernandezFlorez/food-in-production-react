// src/views/module/OrdenProduccion/components/OrderActionButtons.jsx
import React from 'react';
import { Button, Row, Col } from 'reactstrap';
import { Save, PlayCircle, CheckSquare, Package, PauseCircle, XCircle } from 'lucide-react';

import '../../../../assets/css/produccion/ProduccionStyles.css'; // VERIFICA ESTA RUTA


const OrderActionButtons = ({
    currentOrderData,
    handleCancel, // Para el modal de cancelación
    handleUpdateExistingOrder, // Para "Guardar Configuración/Progreso"
    handleStartProductionProcesses,
    handlePrepareFinalization,
    handleFinalizeAndSaveOrder,
    handleSaveOrderStatusChange, // Para Pausar/Reanudar
    canStartProduction,
    canFinalizeOrder,
    isSaving, // Estado combinado (isSaving || isProcessingAction del form)
    isFinalizationActive
}) => {
    if (!currentOrderData) return null;

    const { localOrderStatus, baseDataValidated, processSteps } = currentOrderData;

    // Este componente NO se muestra si es isNewForForm y PENDING, o si es isOrderViewOnly
    // Esa lógica está en OrdenProduccionForm.

    return (
        <Row>
            <Col className="text-end d-flex flex-wrap justify-content-end gap-2">
                
                <Button color="danger" outline onClick={handleCancel} disabled={isSaving} size="sm">
                    <XCircle size={16} className="me-1"/> Cancelar Orden
                </Button>

                {/* Botón Guardar Configuración (si está en PENDING existente o SETUP) o Guardar Progreso */}
                {(localOrderStatus === 'PENDING' || localOrderStatus === 'SETUP' || localOrderStatus === 'SETUP_COMPLETED' || localOrderStatus === 'IN_PROGRESS' || localOrderStatus === 'PAUSED' || localOrderStatus === 'ALL_STEPS_COMPLETED') && !isFinalizationActive && (
                    <Button 
                        color="primary" 
                        onClick={() => {
                            if (localOrderStatus === 'PENDING') handleUpdateExistingOrder('SETUP'); // Intención de pasar a SETUP
                            else if (localOrderStatus === 'SETUP') handleUpdateExistingOrder('SETUP_COMPLETED'); // Intención de validar y completar setup
                            else handleUpdateExistingOrder(); // Guardar progreso con estado actual
                        }} 
                        disabled={isSaving} 
                        size="sm"
                    >
                        <Save size={16} className="me-1"/>
                        {localOrderStatus === 'PENDING' ? 'Guardar y Configurar' : (localOrderStatus === 'SETUP' ? 'Validar y Guardar Config.' : 'Guardar Progreso')}
                    </Button>
                )}
                
                {/* Botón Iniciar Producción */}
                {canStartProduction && processSteps?.length > 0 && !isFinalizationActive && (
                    <Button color="success" onClick={handleStartProductionProcesses} disabled={isSaving}>
                        <PlayCircle size={16} className="me-1"/> Iniciar Producción
                    </Button>
                )}
                 {/* Si no hay pasos y se puede iniciar (SETUP_COMPLETED y base validada) */}
                {canStartProduction && (!processSteps || processSteps.length === 0) && !isFinalizationActive && (
                     <Button color="success" onClick={handleStartProductionProcesses} disabled={isSaving} title="Esta orden no tiene pasos definidos en su ficha. Se marcará para finalización directa.">
                        <PlayCircle size={16} className="me-1"/> Iniciar (Sin Pasos)
                    </Button>
                )}
                
                {canFinalizeOrder && !isFinalizationActive && (
                     <Button color="info" onClick={handlePrepareFinalization} disabled={isSaving} size="sm">
                        <Package size={16} className="me-1"/> Finalizar Orden
                    </Button>
                )}

                {isFinalizationActive && (
                    <Button color="success" onClick={handleFinalizeAndSaveOrder} disabled={isSaving} size="sm">
                        <CheckSquare size={16} className="me-1"/> Confirmar Finalización
                    </Button>
                )}

                {localOrderStatus === 'IN_PROGRESS' && !isFinalizationActive && (
                     <Button color="warning" outline onClick={() => handleSaveOrderStatusChange('PAUSED')} disabled={isSaving} size="sm">
                        <PauseCircle size={16} className="me-1" /> Pausar
                    </Button>
                )}
                 {localOrderStatus === 'PAUSED' && !isFinalizationActive && (
                     <Button color="success" outline onClick={() => handleSaveOrderStatusChange('IN_PROGRESS')} disabled={isSaving} size="sm">
                        <PlayCircle size={16} className="me-1" /> Reanudar
                    </Button>
                )}
            </Col>
        </Row>
    );
};

export default OrderActionButtons;