// src/components/modals/CancelOrderModal.jsx (o donde prefieras)
import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Spinner } from 'reactstrap';
import { AlertTriangle } from 'lucide-react';

import '../../../../assets/css/produccion/ProduccionStyles.css'; // VERIFICA ESTA RUTA


const CancelOrderModal = ({ isOpen, toggle, onConfirmCancel, orderDisplayName, isCancelling }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError('Debe proporcionar un motivo para la cancelación.');
            return;
        }
        setError('');
        onConfirmCancel(reason);
    };

    const handleToggle = () => {
        if (!isCancelling) {
            setReason(''); // Limpiar motivo al cerrar/cancelar
            setError('');
            toggle();
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={handleToggle} centered backdrop="static" keyboard={false}>
            <ModalHeader toggle={handleToggle} className="py-2 px-3">
                <div className="d-flex align-items-center">
                    <AlertTriangle size={20} className="text-danger me-2" />
                    <span className="fw-bold small">Cancelar Orden de Producción</span>
                </div>
            </ModalHeader>
            <ModalBody className="py-3 px-3">
                <p>¿Está seguro que desea cancelar la orden <strong>{orderDisplayName || 'seleccionada'}</strong>?</p>
                <Form>
                    <FormGroup>
                        <Label for="cancelReason" className="small fw-bold">Motivo de la cancelación (obligatorio):</Label>
                        <Input
                            type="textarea"
                            name="cancelReason"
                            id="cancelReason"
                            rows="3"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isCancelling}
                            placeholder="Describa brevemente por qué se cancela esta orden..."
                        />
                        {error && <small className="text-danger mt-1 d-block">{error}</small>}
                    </FormGroup>
                </Form>
            </ModalBody>
            <ModalFooter className="py-2 px-3">
                <Button size="sm" color="secondary" outline onClick={handleToggle} disabled={isCancelling}>
                    Volver
                </Button>
                <Button size="sm" color="danger" onClick={handleConfirm} disabled={isCancelling || !reason.trim()}>
                    {isCancelling ? <Spinner size="sm" className="me-1"/> : null}
                    Confirmar Cancelación
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default CancelOrderModal;