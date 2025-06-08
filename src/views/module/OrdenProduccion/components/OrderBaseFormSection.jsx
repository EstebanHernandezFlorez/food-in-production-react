import React from 'react';
import { Card, CardHeader, CardBody, Row, Col, FormGroup, Label, Input, Button, Spinner, FormFeedback } from 'reactstrap';
import { Eye, Edit2 } from 'lucide-react';

import '../../../../assets/css/produccion/ProduccionStyles.css';


const OrderBaseFormSection = ({
    currentOrderData,
    handleChangeOrderForm,
    toggleViewSpecSheetModal,
    productos, 
    // isLoadingProductos ya no se necesita si se carga en el padre
    empleadosList, 
    // isLoadingEmpleados ya no se necesita
    providersList, 
    // isLoadingProviders ya no se necesita
    isSaving,
    isLoadingFichas,
    isOrderViewOnly,
    ordenTitulo,
    employeeFieldLabel,
    isSimplifiedView,
    availableSpecSheets, // Prop necesaria para la lógica de la ficha
    masterDataFullyLoaded, // Para saber si las listas están listas
    isVerifyingProduct // <- NUEVA PROP para el spinner de verificación
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
                     <Row className="g-2 align-items-center">
                        <Col md={6} lg={5}>
                            <FormGroup className="mb-0">
                                <Label for="simplifiedProductName" className="small text-muted mb-0" style={{fontSize: '0.75rem'}}>Producto:</Label>
                                <Input
                                    plaintext readOnly id="simplifiedProductName"
                                    value={formOrder.productNameSnapshot || (formOrder.idProduct ? "Cargando..." : "No seleccionado")}
                                    className="fw-bold ps-0" bsSize="sm"
                                    style={{fontSize: '0.8rem', lineHeight: '1.2'}}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4} lg={4}>
                            <FormGroup className="mb-0">
                                <Label for="simplifiedInitialAmount" className="small text-muted mb-0" style={{fontSize: '0.75rem'}}>Cantidad:</Label>
                                <Input
                                    plaintext readOnly id="simplifiedInitialAmount"
                                    value={formOrder.initialAmount || "N/A"}
                                    className="fw-bold ps-0" bsSize="sm"
                                    style={{fontSize: '0.8rem', lineHeight: '1.2'}}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={2} lg={3} className="text-md-end align-self-center">
                            {(selectedSpecSheetData || formOrder.idSpecSheet) && (
                                <Button outline color="info" size="sm" onClick={toggleViewSpecSheetModal} title="Ver Ficha Técnica" disabled={isLoadingFichas}>
                                    {isLoadingFichas ? <Spinner size="sm" /> : <Eye size={14} />}
                                    <span className="d-none d-lg-inline ms-1" style={{fontSize: '0.75rem'}}>Ficha</span>
                                </Button>
                            )}
                        </Col>
                    </Row>
                ) : (
                    <Row className="g-3">
                        <Col md={6}>
                            <FormGroup>
                                <Label for="idProduct" className="small fw-bold">Producto <span className="text-danger">*</span></Label>
                                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                                <div className="d-flex align-items-center">
                                    <Input 
                                        type="select" 
                                        name="idProduct" 
                                        id="idProduct" 
                                        bsSize="sm" 
                                        value={formOrder.idProduct || ''} 
                                        onChange={handleChangeOrderForm} 
                                        disabled={!canEditBaseFields || !masterDataFullyLoaded || isVerifyingProduct} 
                                        invalid={!!formErrors?.idProduct}
                                    >
                                        <option value="">{!masterDataFullyLoaded ? "Cargando..." : "Seleccione..."}</option>
                                        {productos.map(p => <option key={p.idProduct} value={p.idProduct}>{p.productName}</option>)}
                                    </Input>
                                    {isVerifyingProduct && <Spinner size="sm" className="ms-2" color="primary" title="Verificando producto..." />}
                                </div>
                                <FormFeedback>{formErrors?.idProduct}</FormFeedback>
                                {/* --- FIN DE LA MODIFICACIÓN --- */}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="idSpecSheet" className="small fw-bold">Ficha Técnica</Label>
                                <div className="d-flex">
                                    <Input
                                        type="select"
                                        name="idSpecSheet"
                                        id="idSpecSheet"
                                        bsSize="sm"
                                        value={formOrder.idSpecSheet || ''}
                                        onChange={handleChangeOrderForm}
                                        disabled={!canEditBaseFields || isLoadingFichas || availableSpecSheets.length === 0}
                                        invalid={!!formErrors?.idSpecSheet}
                                    >
                                        <option value="">{isLoadingFichas ? "Cargando..." : (availableSpecSheets.length === 0 ? "Sin fichas disponibles" : "Seleccione una...")}</option>
                                        {availableSpecSheets.map(s => <option key={s.idSpecSheet} value={s.idSpecSheet}>{`${s.versionName || 'Activa'} (ID: ${s.idSpecSheet})`}</option>)}
                                    </Input>
                                    {(selectedSpecSheetData || formOrder.idSpecSheet) && (<Button outline color="info" size="sm" onClick={toggleViewSpecSheetModal} className="ms-2 flex-shrink-0" disabled={isLoadingFichas}><Eye size={16}/></Button>)}
                                </div>
                                <FormFeedback>{formErrors?.idSpecSheet}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4} sm={6}>
                            <FormGroup>
                                <Label for="initialAmount" className="small fw-bold">Cant. a Producir <span className="text-danger">*</span></Label>
                                <Input type="number" name="initialAmount" id="initialAmount" bsSize="sm" value={formOrder.initialAmount || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} min="0" invalid={!!formErrors?.initialAmount} />
                                <FormFeedback>{formErrors?.initialAmount}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4} sm={6}>
                            <FormGroup>
                                <Label for="orderDate" className="small fw-bold">Fecha Pedido <span className="text-danger">*</span></Label>
                                <Input type="date" name="orderDate" id="orderDate" bsSize="sm" value={formOrder.orderDate || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} invalid={!!formErrors?.orderDate} />
                                <FormFeedback>{formErrors?.orderDate}</FormFeedback>
                            </FormGroup>
                        </Col>
                         <Col md={4} sm={12}>
                            <FormGroup>
                                <Label for="idEmployeeRegistered" className="small fw-bold">{employeeFieldLabel} <span className="text-danger">*</span></Label>
                                <Input type="select" name="idEmployeeRegistered" id="idEmployeeRegistered" bsSize="sm" value={formOrder.idEmployeeRegistered || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields || !masterDataFullyLoaded} invalid={!!formErrors?.idEmployeeRegistered}>
                                    <option value="">{!masterDataFullyLoaded ? "Cargando..." : "Seleccione..."}</option>
                                    {empleadosList.map(e=><option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>)}
                                </Input>
                                <FormFeedback>{formErrors?.idEmployeeRegistered}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="inputInitialWeight" className="small fw-bold">Peso Bruto Inicial</Label>
                                <Row className="g-2">
                                    <Col><Input type="number" name="inputInitialWeight" id="inputInitialWeight" bsSize="sm" value={formOrder.inputInitialWeight || ''} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} min="0" invalid={!!formErrors?.inputInitialWeight} /></Col>
                                    <Col xs="auto"><Input type="select" name="inputInitialWeightUnit" bsSize="sm" value={formOrder.inputInitialWeightUnit || 'kg'} onChange={handleChangeOrderForm} disabled={!canEditBaseFields} invalid={!!formErrors?.inputInitialWeightUnit}><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option></Input></Col>
                                </Row>
                                <FormFeedback className="d-block">{formErrors?.inputInitialWeight}</FormFeedback>
                                <FormFeedback className="d-block">{formErrors?.inputInitialWeightUnit}</FormFeedback>
                            </FormGroup>
                        </Col>
                         <Col md={6}>
                            <FormGroup>
                                {/* --- REQUISITO: Etiqueta de Proveedor actualizada --- */}
                                <Label for="idProvider" className="small fw-bold">Proveedor <span className="text-danger">*</span></Label>
                                <Input 
                                    type="select" 
                                    name="idProvider" 
                                    id="idProvider" 
                                    bsSize="sm" 
                                    value={formOrder.idProvider || ''} 
                                    onChange={handleChangeOrderForm} 
                                    disabled={!canEditBaseFields || !masterDataFullyLoaded}
                                    invalid={!!formErrors?.idProvider}
                                >
                                    <option value="">{!masterDataFullyLoaded ? "Cargando..." : "Seleccione..."}</option>
                                    {providersList.map(p=><option key={p.idProvider} value={p.idProvider}>{p.providerName}</option>)}
                                </Input>
                                <FormFeedback>{formErrors?.idProvider}</FormFeedback>
                            </FormGroup>
                        </Col>
                       <Col md={12}>
                           <FormGroup>
                               <Label for="observations" className="small fw-bold">Observaciones Generales</Label>
                               <Input type="textarea" name="observations" id="observations" bsSize="sm" rows={2} value={formOrder.observations || ''} onChange={handleChangeOrderForm} disabled={isSaving || isOrderViewOnly} placeholder="Notas generales sobre la orden de producción..." />
                           </FormGroup>
                       </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    );
};
export default OrderBaseFormSection;