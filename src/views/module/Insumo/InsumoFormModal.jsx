// src/views/module/Insumos/components/InsumoFormModal.jsx
import React from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Input, Label,
    Row, Col, FormFeedback, Button, Spinner, Alert
} from 'reactstrap';
import { Edit, Plus, AlertTriangle } from 'lucide-react';

const InsumoFormModal = ({
    modalOpen,
    toggleMainModal,
    isEditing,
    modalTitle,
    form,         // Objeto del formulario con supplyName, description, unitOfMeasure, status
    handleChange, // Función para manejar cambios en los inputs
    handleSubmit, // Función para manejar el submit del formulario
    formErrors,   // Objeto de errores con supplyName, description, unitOfMeasure, general
    unitOfMeasures, // Array de unidades de medida
    isSavingForm, // Booleano para indicar si el formulario se está guardando
    submitButtonText,
    canSubmitForm,
}) => {
    return (
        <Modal isOpen={modalOpen} toggle={!isSavingForm ? toggleMainModal : undefined} centered size="lg" backdrop="static" keyboard={!isSavingForm} aria-labelledby="insumoModalTitle">
            <ModalHeader toggle={!isSavingForm ? toggleMainModal : undefined} id="insumoModalTitle">
                <div className="d-flex align-items-center">
                    {isEditing ? <Edit size={20} className="me-2" /> : <Plus size={20} className="me-2" />}
                    {modalTitle}
                </div>
            </ModalHeader>
            <ModalBody>
                {formErrors.general && (
                    <Alert color="danger" fade={false} className="d-flex align-items-center py-2 mb-3">
                        <AlertTriangle size={18} className="me-2" /> {formErrors.general}
                    </Alert>
                )}
                {/* El onSubmit del Form llama a la prop handleSubmit que viene del componente padre Insumos.jsx */}
                <Form id="insumoFormInternal" noValidate onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <Row className="g-3">
                        <Col md={6}>
                            <FormGroup>
                                <Label for="modalSupplyName" className="form-label fw-bold">Nombre Insumo <span className="text-danger">*</span></Label>
                                <Input
                                    id="modalSupplyName" // ID único para el label
                                    type="text"
                                    name="supplyName" // <<< CAMBIADO: Coincide con el modelo y estado
                                    value={form.supplyName || ''}
                                    onChange={handleChange}
                                    invalid={!!formErrors.supplyName} // Usar !! para asegurar booleano
                                    required
                                    disabled={isSavingForm}
                                    placeholder="Ej: Harina de Trigo"
                                    aria-describedby="supplyNameFeedback"
                                />
                                <FormFeedback id="supplyNameFeedback">
                                    {/* Mensaje dinámico basado en el error específico si lo tienes, o uno genérico */}
                                    {formErrors.supplyName && (form.supplyName.trim() === '' ? "El nombre del insumo es requerido." : "El nombre debe tener entre 2 y 100 caracteres y ser válido.")}
                                </FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="modalunitOfMeasure" className="form-label fw-bold">Unidad de Medida <span className="text-danger">*</span></Label>
                                <Input
                                    id="modalunitOfMeasure"
                                    type="select"
                                    name="unitOfMeasure" // <<< COINCIDE CON EL MODELO Y ESTADO
                                    value={form.unitOfMeasure || ''}
                                    onChange={handleChange}
                                    invalid={!!formErrors.unitOfMeasure}
                                    required
                                    disabled={isSavingForm}
                                    aria-describedby="unitOfMeasureFeedback"
                                >
                                    <option value="">Seleccione...</option>
                                    {unitOfMeasures.map((unit) => (<option key={unit.value} value={unit.value}>{unit.label}</option>))}
                                </Input>
                                <FormFeedback id="unitOfMeasureFeedback">
                                    {formErrors.unitOfMeasure && "Seleccione una unidad de medida."}
                                </FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={12}>
                            <FormGroup>
                                <Label for="modalDescription" className="form-label fw-bold">Descripción</Label>
                                <Input
                                    id="modalDescription"
                                    type="textarea"
                                    name="description" // <<< COINCIDE CON EL MODELO Y ESTADO
                                    value={form.description || ''}
                                    onChange={handleChange}
                                    invalid={!!formErrors.description}
                                    disabled={isSavingForm}
                                    placeholder="Descripción detallada del insumo (opcional)"
                                    rows={3}
                                    aria-describedby="descriptionFeedback"
                                />
                                <FormFeedback id="descriptionFeedback">
                                    {formErrors.description && "La descripción no puede exceder los 500 caracteres."}
                                </FormFeedback>
                            </FormGroup>
                        </Col>
                        
                        {/* Solo mostrar el switch de estado si se está editando, 
                            ya que al crear el estado por defecto es 'true' según el modelo 
                            y la lógica de creación en handleSubmit.
                            O puedes mostrarlo siempre si quieres controlarlo al crear también.
                        */}
                        {isEditing && (
                            <Col md={12}>
                                <FormGroup switch>
                                    <Input
                                        type="switch"
                                        id="modalSupplyStatus"
                                        name="status" // <<< COINCIDE CON EL MODELO Y ESTADO
                                        checked={form.status}
                                        onChange={handleChange} // handleChange maneja type="switch"
                                        disabled={isSavingForm}
                                    />
                                    <Label for="modalSupplyStatus" check>
                                        Insumo Activo
                                    </Label>
                                </FormGroup>
                            </Col>
                        )}
                    </Row>
                </Form>
            </ModalBody>
            <ModalFooter className="border-top pt-3">
                <Button color="secondary" outline onClick={toggleMainModal} disabled={isSavingForm}>Cancelar</Button>
                {/* El botón de submit ahora llama a la prop handleSubmit */}
                <Button type="button" color="primary" disabled={!canSubmitForm} onClick={handleSubmit}>
                    {submitButtonText}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default InsumoFormModal;