// src/components/General/ConfirmationModal.js
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from 'reactstrap';
import { AlertTriangle } from 'lucide-react'; // Asegúrate de importar los iconos necesarios

// Exportación nombrada
export const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
            <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : (confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? (<><Spinner size="sm" className="me-1"/> Procesando...</>) : confirmText}
            </Button>
        </ModalFooter>
    </Modal>
);