// src/views/module/OrdenProduccion/components/OrderFinalizationSection.jsx
// ESTE ARCHIVO YA ESTÁ BIEN, EL PROBLEMA ESTÁ EN CÓMO SE LE LLAMA

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback, Card, CardBody, CardHeader, Button, Spinner } from 'reactstrap';
// Los iconos se importan aquí para que el componente sea autocontenido
import { Package, Scale, CheckCircle, XCircle } from 'lucide-react';

const OrderFinalizationSection = ({
    formOrder,
    formErrors,
    handleChangeOrderForm,
    isSaving,
    onCancelFinalization,
    onConfirmFinalize,
    onHideSection,
    // La prop 'icons' ya no es necesaria si importas los iconos directamente
}) => {
    const isFinishedWeightUnitDisabled = isSaving || !formOrder.finishedProductWeight || parseFloat(formOrder.finishedProductWeight) <= 0;
    const isUnusedWeightUnitDisabled = isSaving || !formOrder.inputFinalWeightUnused || parseFloat(formOrder.inputFinalWeightUnused) <= 0;

    return (
        <Card className="mb-4 shadow-sm border-success">
            <CardHeader className="py-2 px-3 bg-success text-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0 d-flex align-items-center">
                    <Package size={18} className="me-2"/> Datos de Finalización de Orden
                </h6>
                <Button close color="white" onClick={onHideSection} disabled={isSaving} title="Ocultar finalización" />
            </CardHeader>
            <CardBody>
                {/* ... (Todo tu formulario de inputs aquí) ... */}
                <Row>
                    <Col md={4} className="mb-3">
                        <FormGroup>
                            <Label for="finalQuantityProduct" className="fw-semibold small">
                                Cantidad Producida (Unidades) <span className="text-danger">*</span>
                            </Label>
                            <Input
                                type="number"
                                name="finalQuantityProduct"
                                id="finalQuantityProduct"
                                value={formOrder.finalQuantityProduct || ''}
                                onChange={handleChangeOrderForm}
                                invalid={!!formErrors?.finalQuantityProduct}
                                disabled={isSaving}
                                min="0"
                                bsSize="sm"
                                placeholder="Ej: 98"
                            />
                            <FormFeedback>{formErrors?.finalQuantityProduct}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4} className="mb-3">
                        <FormGroup>
                            <Label for="finishedProductWeight" className="fw-semibold small">
                                <Scale size={14} className="me-1"/>Peso Total Producto Terminado
                            </Label>
                            <Input
                                type="number"
                                name="finishedProductWeight"
                                id="finishedProductWeight"
                                value={formOrder.finishedProductWeight || ''}
                                onChange={handleChangeOrderForm}
                                invalid={!!formErrors?.finishedProductWeight || !!formErrors?.finishedProductWeightUnit}
                                disabled={isSaving}
                                min="0" step="0.001"
                                bsSize="sm"
                                placeholder="Ej: 48.500"
                            />
                            <FormFeedback>{formErrors?.finishedProductWeight}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4} className="mb-3">
                        <FormGroup>
                            <Label for="finishedProductWeightUnit" className="fw-semibold small">Unidad Peso Terminado</Label>
                            <Input
                                type="select"
                                name="finishedProductWeightUnit"
                                id="finishedProductWeightUnit"
                                value={formOrder.finishedProductWeightUnit || 'kg'}
                                onChange={handleChangeOrderForm}
                                disabled={isFinishedWeightUnitDisabled}
                                bsSize="sm"
                                invalid={!!formErrors?.finishedProductWeightUnit}
                            >
                                <option value="kg">kg (Kilogramos)</option>
                                <option value="g">g (Gramos)</option>
                                <option value="lb">lb (Libras)</option>
                                <option value="oz">oz (Onzas)</option>
                            </Input>
                            <FormFeedback>{formErrors?.finishedProductWeightUnit}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4} className="mb-3">
                        <FormGroup>
                            <Label for="inputFinalWeightUnused" className="fw-semibold small">
                                <Scale size={14} className="me-1"/>Material Inicial No Usado (Merma)
                            </Label>
                            <Input
                                type="number"
                                name="inputFinalWeightUnused"
                                id="inputFinalWeightUnused"
                                value={formOrder.inputFinalWeightUnused || ''}
                                onChange={handleChangeOrderForm}
                                invalid={!!formErrors?.inputFinalWeightUnused || !!formErrors?.inputFinalWeightUnusedUnit}
                                disabled={isSaving}
                                min="0" step="0.001"
                                bsSize="sm"
                                placeholder="Ej: 0.500"
                            />
                             <FormFeedback>{formErrors?.inputFinalWeightUnused}</FormFeedback>
                        </FormGroup>
                    </Col>
                     <Col md={4} className="mb-3">
                        <FormGroup>
                            <Label for="inputFinalWeightUnusedUnit" className="fw-semibold small">Unidad Peso No Usado</Label>
                            <Input
                                type="select"
                                name="inputFinalWeightUnusedUnit"
                                id="inputFinalWeightUnusedUnit"
                                value={formOrder.inputFinalWeightUnusedUnit || 'kg'}
                                onChange={handleChangeOrderForm}
                                disabled={isUnusedWeightUnitDisabled}
                                bsSize="sm"
                                invalid={!!formErrors?.inputFinalWeightUnusedUnit}
                            >
                                <option value="kg">kg (Kilogramos)</option>
                                <option value="g">g (Gramos)</option>
                                <option value="lb">lb (Libras)</option>
                                <option value="oz">oz (Onzas)</option>
                            </Input>
                            <FormFeedback>{formErrors?.inputFinalWeightUnusedUnit}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <FormGroup>
                            <Label for="observations" className="fw-semibold small">Observaciones de Finalización (Opcional)</Label>
                            <Input
                                type="textarea"
                                name="observations"
                                id="observations"
                                value={formOrder.observations || ''}
                                onChange={handleChangeOrderForm}
                                disabled={isSaving}
                                rows="3"
                                bsSize="sm"
                                placeholder="Cualquier detalle relevante sobre la finalización..."
                            />
                        </FormGroup>
                    </Col>
                </Row>
                <div className="text-end mt-3">
                    <Button color="danger" outline onClick={onCancelFinalization} disabled={isSaving} className="me-2">
                        <XCircle size={16} className="me-1"/> Cancelar Orden
                    </Button>
                    <Button color="success" onClick={onConfirmFinalize} disabled={isSaving}>
                        {isSaving ? <Spinner size="sm" className="me-1"/> : <CheckCircle size={16} className="me-1"/>}
                        Confirmar y Finalizar Orden
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};

export default OrderFinalizationSection;