// src/views/module/OrdenProduccion/components/OrderBaseFormSection.jsx
import React from 'react';
import { Card, CardHeader, CardBody, Row, Col, FormGroup, Label, Input, Button, Spinner } from 'reactstrap'; // Asegúrate que Spinner esté aquí
import { Eye, Edit2 } from 'lucide-react';

import '../../../../assets/css/produccion/ProduccionStyles.css'; // VERIFICA ESTA RUTA


const OrderBaseFormSection = ({
    currentOrderData,
    handleChangeOrderForm,
    toggleViewSpecSheetModal,
    productos, 
    isLoadingProductos,
    empleadosList, 
    isLoadingEmpleados,
    providersList, 
    isLoadingProviders,
    isSaving,
    isLoadingFichas,
    isOrderViewOnly,
    ordenTitulo,
    employeeFieldLabel,
    isSimplifiedView // True si es borrador guardado en estado SETUP o PENDING (!isNewForForm)
}) => {
    if (!currentOrderData) return <Card><CardBody>Cargando datos...</CardBody></Card>;

    const { formOrder, selectedSpecSheetData, formErrors } = currentOrderData;

    const canEditBaseFields = !isOrderViewOnly && !isSaving &&
        (currentOrderData.isNewForForm || currentOrderData.localOrderStatus === 'PENDING' || currentOrderData.localOrderStatus === 'SETUP' || currentOrderData.localOrderStatus === 'SETUP_COMPLETED');

    return (
        <Card className="mb-3 shadow-sm">
            <CardHeader className="py-2 px-3 bg-light">
                <h6 className="mb-0 d-flex align-items-center">
                    <Edit2 size={18} className="me-2 text-muted" /> {ordenTitulo}
                </h6>
            </CardHeader>
            <CardBody className={`p-3 ${isSimplifiedView ? 'py-2' : ''}`}> 
                {isSimplifiedView ? (
                     <Row className="g-2 align-items-center"> {/* g-2 para menos espacio entre columnas */}
                        <Col md={6} lg={5}>
                            <FormGroup className="mb-0">
                                {/* Label más pequeño */}
                                <Label for="simplifiedProductName" className="small text-muted mb-0" style={{fontSize: '0.75rem'}}>Producto:</Label>
                                <Input
                                    plaintext readOnly id="simplifiedProductName"
                                    value={formOrder.productNameSnapshot || (formOrder.idProduct ? "Cargando..." : "No seleccionado")}
                                    className="fw-bold ps-0" // ps-0 para quitar padding izquierdo del plaintext
                                    bsSize="sm" // Input más pequeño
                                    style={{fontSize: '0.8rem', lineHeight: '1.2'}} // Fuente más pequeña
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4} lg={4}>
                            <FormGroup className="mb-0">
                                <Label for="simplifiedInitialAmount" className="small text-muted mb-0" style={{fontSize: '0.75rem'}}>Cantidad:</Label>
                                <Input
                                    plaintext readOnly id="simplifiedInitialAmount"
                                    value={formOrder.initialAmount || "N/A"}
                                    className="fw-bold ps-0"
                                    bsSize="sm"
                                    style={{fontSize: '0.8rem', lineHeight: '1.2'}}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={2} lg={3} className="text-md-end align-self-center"> {/* Alinear botón verticalmente */}
                            {(selectedSpecSheetData || formOrder.idSpecSheet) && (
                                <Button
                                    outline color="info" size="sm"
                                    onClick={toggleViewSpecSheetModal} title="Ver Ficha Técnica"
                                    disabled={isLoadingFichas}
                                    // Quitar margen superior si ya está alineado
                                >
                                    {isLoadingFichas ? <Spinner size="sm" /> : <Eye size={14} />} {/* Icono más pequeño */}
                                    <span className="d-none d-lg-inline ms-1" style={{fontSize: '0.75rem'}}>Ficha</span> {/* Texto más pequeño */}
                                </Button>
                            )}
                        </Col>
                    </Row>
                ) : (
                    <Row className="g-3">
                        <Col md={6}>
                            <FormGroup>
                                <Label for="idProduct" className="small fw-bold">Producto <span className="text-danger">*</span></Label>
                                <Input type="select" name="idProduct" id="idProduct" bsSize="sm" value={formOrder.idProduct || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields || isLoadingProductos} invalid={!!formErrors?.idProduct}>
                                    <option value="">{isLoadingProductos ? "Cargando..." : "Seleccione..."}</option>
                                    {productos.map(p => <option key={p.idProduct} value={p.idProduct}>{p.productName}</option>)}
                                </Input>
                                {formErrors?.idProduct && <small className="text-danger">{formErrors.idProduct}</small>}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="idSpecSheetDisplay" className="small fw-bold">Ficha Técnica</Label>
                                <div className="d-flex">
                                    <Input type="text" name="idSpecSheetDisplay" id="idSpecSheetDisplay" bsSize="sm" value={isLoadingFichas ? "Buscando..." : (selectedSpecSheetData ? `${selectedSpecSheetData.versionName || 'Activa'} (ID: ${selectedSpecSheetData.idSpecSheet || selectedSpecSheetData.id})` : (formOrder.idProduct ? "Sin ficha" : "N/A"))} readOnly disabled invalid={!!formErrors?.idSpecSheet} />
                                    {(selectedSpecSheetData || formOrder.idSpecSheet) && (<Button outline color="info" size="sm" onClick={toggleViewSpecSheetModal} className="ms-2 flex-shrink-0" disabled={isLoadingFichas}><Eye size={16}/></Button>)}
                                </div>
                                {formErrors?.idSpecSheet && <small className="text-danger">{formErrors.idSpecSheet}</small>}
                            </FormGroup>
                        </Col>
                        <Col md={4} sm={6}>
                            <FormGroup>
                                <Label for="initialAmount" className="small fw-bold">Cant. a Producir <span className="text-danger">*</span></Label>
                                <Input type="number" name="initialAmount" id="initialAmount" bsSize="sm" value={formOrder.initialAmount || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} min="0" invalid={!!formErrors?.initialAmount} />
                                {formErrors?.initialAmount && <small className="text-danger">{formErrors.initialAmount}</small>}
                            </FormGroup>
                        </Col>
                        <Col md={4} sm={6}>
                            <FormGroup>
                                <Label for="orderDate" className="small fw-bold">Fecha Pedido <span className="text-danger">*</span></Label>
                                <Input type="date" name="orderDate" id="orderDate" bsSize="sm" value={formOrder.orderDate || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} invalid={!!formErrors?.orderDate} />
                                {formErrors?.orderDate && <small className="text-danger">{formErrors.orderDate}</small>}
                            </FormGroup>
                        </Col>
                         <Col md={4} sm={12}>
                            <FormGroup>
                                <Label for="idEmployeeRegistered" className="small fw-bold">{employeeFieldLabel} <span className="text-danger">*</span></Label>
                                <Input type="select" name="idEmployeeRegistered" id="idEmployeeRegistered" bsSize="sm" value={formOrder.idEmployeeRegistered || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields || isLoadingEmpleados} invalid={!!formErrors?.idEmployeeRegistered}>
                                    <option value="">{isLoadingEmpleados ? "Cargando..." : "Seleccione..."}</option>
                                    {empleadosList.map(e=><option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>)}
                                </Input>
                                {formErrors?.idEmployeeRegistered && <small className="text-danger">{formErrors.idEmployeeRegistered}</small>}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="inputInitialWeight" className="small fw-bold">Peso Bruto Inicial { (currentOrderData.localOrderStatus !== 'PENDING' && currentOrderData.localOrderStatus !== 'SETUP' && !currentOrderData.isNewForForm) && <span className="text-danger">*</span>}</Label>
                                <Row className="g-2">
                                    <Col><Input type="number" name="inputInitialWeight" id="inputInitialWeight" bsSize="sm" value={formOrder.inputInitialWeight || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} min="0" invalid={!!formErrors?.inputInitialWeight} /></Col>
                                    <Col xs="auto"><Input type="select" name="inputInitialWeightUnit" bsSize="sm" value={formOrder.inputInitialWeightUnit || 'kg'} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} invalid={!!formErrors?.inputInitialWeightUnit}><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option></Input></Col>
                                </Row>
                                {formErrors?.inputInitialWeight && <small className="text-danger d-block">{formErrors.inputInitialWeight}</small>}
                                {formErrors?.inputInitialWeightUnit && <small className="text-danger d-block">{formErrors.inputInitialWeightUnit}</small>}
                            </FormGroup>
                        </Col>
                         <Col md={6}>
                            <FormGroup>
                                <Label for="idProvider" className="small fw-bold">Proveedor (Opcional)</Label>
                                <Input type="select" name="idProvider" id="idProvider" bsSize="sm" value={formOrder.idProvider || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields || isLoadingProviders}>
                                    <option value="">{isLoadingProviders ? "Cargando..." : "Seleccione..."}</option>
                                    {providersList.map(p=><option key={p.idProvider} value={p.idProvider}>{p.providerName}</option>)}
                                </Input>
                            </FormGroup>
                        </Col>
                       <Col md={12}>
                           <FormGroup>
                               <Label for="observations" className="small fw-bold">Observaciones Generales</Label>
                               <Input type="textarea" name="observations" id="observations" bsSize="sm" rows={2} value={formOrder.observations || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} placeholder="Notas generales sobre la orden de producción..." />
                           </FormGroup>
                       </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    );
};
export default OrderBaseFormSection;