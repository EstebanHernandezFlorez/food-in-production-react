// src/views/module/OrdenProduccion/components/OrderFinalizationSection.jsx
import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback, Card, CardBody, CardHeader, Button } from 'reactstrap';
import { Package, Scale, X } from 'lucide-react'; // X para botón cancelar finalización

const OrderFinalizationSection = ({
    formOrder,
    formErrors,
    handleChangeOrderForm,
    isSaving,
    onCancelFinalization // Nueva prop para ocultar esta sección
    // onSaveFinalization no se necesita aquí, el botón está en OrderActionButtons
}) => {
    return (
        <Card className="mb-4 shadow-sm border-success"> {/* Borde para destacar */}
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
                            <Label for="finalQuantityProduct" className="fw-semibold small"> {/* fw-semibold en vez de fw-bold */}
                                Cantidad Producida (Unidades) <span className="text-danger">*</span>
                            </Label>
                            <Input
                                type="number"
                                name="finalQuantityProduct"
                                id="finalQuantityProduct"
                                value={formOrder.finalQuantityProduct || ''} // Asegurar que sea string vacío si es null/undefined
                                onChange={handleChangeOrderForm}
                                invalid={!!formErrors?.finalQuantityProduct}
                                disabled={isSaving}
                                min={0}
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
                                invalid={!!formErrors?.finishedProductWeight}
                                disabled={isSaving}
                                min={0} step="0.001"
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
                                type="text" // Considerar select si las unidades son fijas
                                name="finishedProductWeightUnit"
                                id="finishedProductWeightUnit"
                                value={formOrder.finishedProductWeightUnit || 'kg'} // Default a kg
                                onChange={handleChangeOrderForm}
                                disabled={isSaving || !formOrder.finishedProductWeight} // Deshabilitar si no hay peso
                                bsSize="sm"
                                placeholder="Ej: kg"
                                list="commonUnitsFinal"
                            />
                             <datalist id="commonUnitsFinal">
                                <option value="kg" />
                                <option value="g" />
                                <option value="lb" />
                                <option value="unidad" />
                            </datalist>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4} className="mb-3"> {/* Añadido mb-3 */}
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
                                disabled={isSaving}
                                min={0} step="0.001"
                                bsSize="sm"
                                placeholder="Ej: 0.500"
                            />
                        </FormGroup>
                    </Col>
                     <Col md={4} className="mb-3"> {/* Añadido mb-3 */}
                        <FormGroup>
                            <Label for="inputFinalWeightUnusedUnit" className="fw-semibold small">Unidad Peso No Usado</Label>
                            <Input
                                type="text" // Considerar select
                                name="inputFinalWeightUnusedUnit"
                                id="inputFinalWeightUnusedUnit"
                                value={formOrder.inputFinalWeightUnusedUnit || 'kg'} // Default a kg
                                onChange={handleChangeOrderForm}
                                disabled={isSaving || !formOrder.inputFinalWeightUnused} // Deshabilitar si no hay peso no usado
                                bsSize="sm"
                                placeholder="Ej: kg"
                                list="commonUnitsFinal" // Reutilizar datalist
                            />
                        </FormGroup>
                    </Col>
                </Row>
                {/* Aquí podrías añadir la sección para registrar Consumo Real de Insumos si lo deseas */}
            </CardBody>
        </Card>
    );
};

export default OrderFinalizationSection;