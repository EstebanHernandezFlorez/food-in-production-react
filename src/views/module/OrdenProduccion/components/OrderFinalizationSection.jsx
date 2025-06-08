// src/views/module/OrdenProduccion/components/OrderFinalizationSection.jsx
import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback, Card, CardBody, CardHeader, Button, Spinner } from 'reactstrap';
import { Package, Scale, CheckCircle, X } from 'lucide-react';

const OrderFinalizationSection = ({
    formOrder,
    formErrors,
    handleChangeOrderForm,
    isSaving,
    onCancelFinalization,
    onConfirmFinalize
}) => {
    // Determina si los campos de unidad deben estar habilitados
    const isFinishedWeightUnitDisabled = isSaving || !formOrder.finishedProductWeight || parseFloat(formOrder.finishedProductWeight) <= 0;
    const isUnusedWeightUnitDisabled = isSaving || !formOrder.inputFinalWeightUnused || parseFloat(formOrder.inputFinalWeightUnused) <= 0;

    return (
        <Card className="mb-4 shadow-sm border-success">
            <CardHeader className="py-2 px-3 bg-success text-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0 d-flex align-items-center">
                    <Package size={18} className="me-2"/> Datos de Finalización de Orden
                </h6>
                <Button close color="white" onClick={onCancelFinalization} disabled={isSaving} title="Cancelar finalización" />
            </CardHeader>
            <CardBody>
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
                            {/* --- INICIO DE LA MODIFICACIÓN --- */}
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
                            {/* --- FIN DE LA MODIFICACIÓN --- */}
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
                            {/* --- INICIO DE LA MODIFICACIÓN --- */}
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
                            {/* --- FIN DE LA MODIFICACIÓN --- */}
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
                    <Button color="secondary" outline onClick={onCancelFinalization} disabled={isSaving} className="me-2">
                        <X size={16} className="me-1"/> Cancelar
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