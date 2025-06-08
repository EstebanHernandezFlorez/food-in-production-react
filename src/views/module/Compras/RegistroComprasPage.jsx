import React, { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import "bootstrap/dist/css/bootstrap.min.css";
import {
    Container, Row, Col, Form, FormGroup, Input, Label, Button,
    Spinner, Alert, Table, Card, CardBody, CardHeader, FormFeedback,
    InputGroup, InputGroupText
} from "reactstrap";
import { Plus, Trash2, Save, ArrowLeft, Info, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components & Services ---
import { formatCurrencyCOP } from "../../../utils/formatting";
import purchaseService from '../../services/registroCompraService';
import supplyService from '../../services/supplyService';
import providerService from '../../services/proveedorSevice';

import "../../../assets/css/App.css";

// --- Constants ---
const INITIAL_FORM_DATA = {
    idProvider: '',
    purchaseDate: dayjs().format('YYYY-MM-DD'),
    category: '',
    invoiceNumber: '',
    receptionDate: '',
    observations: '',
    details: []
};
const INITIAL_FORM_ERRORS = {
    idProvider: null,
    purchaseDate: null,
    category: null,
    invoiceNumber: null,
    receptionDate: null,
    details: null,
    detailRows: {}
};

const EXACT_BACKEND_CATEGORIES = [
    'CARNE', 'VEGETALES', 'LACTEOS', 'FRUTAS', 'ABARROTES', 'LIMPIEZA',
    'BEBIDAS', 'CONGELADOS', 'OTROS'
];

const PURCHASE_CATEGORIES_FOR_DROPDOWN = EXACT_BACKEND_CATEGORIES.map(catValue => ({
    value: catValue,
    label: catValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}));

const RegistrarCompraPage = () => {
    const [form, setForm] = useState(INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [providers, setProviders] = useState([]);
    const [allSupplies, setAllSupplies] = useState([]);
    const [availableSupplies, setAvailableSupplies] = useState([]);
    const [isLoadingFormData, setIsLoadingFormData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const fetchFormData = useCallback(async () => {
        setIsLoadingFormData(true);
        try {
            const [providersData, suppliesData] = await Promise.all([
                providerService.getAllProveedores({ status: true }),
                supplyService.getAllSupplies({ status: true }),
            ]);

            setProviders(Array.isArray(providersData) ? providersData.filter(p => p.status) : []);
            const allSuppliesList = Array.isArray(suppliesData) ? suppliesData.filter(s => s.status) : [];
            setAllSupplies(allSuppliesList);
            setAvailableSupplies(allSuppliesList);

        } catch (error) {
            console.error("Error fetching form data:", error);
            toast.error(`Error al cargar datos: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsLoadingFormData(false);
        }
    }, []);

    useEffect(() => {
        fetchFormData();
    }, [fetchFormData]);

    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    const validateForm = useCallback(() => {
        const errors = { ...INITIAL_FORM_ERRORS, detailRows: {} };
        let isValid = true;

        if (!form.idProvider) { errors.idProvider = "Seleccione un proveedor."; isValid = false; }
        if (!form.purchaseDate) { errors.purchaseDate = "Seleccione fecha de compra."; isValid = false; }
        if (!form.category) { errors.category = "Seleccione una categoría."; isValid = false; }

        if (!form.details || form.details.length === 0) {
            errors.details = "Agregue al menos un ítem."; isValid = false;
        } else {
            let detailErrorsExist = false;
            form.details.forEach((detail, index) => {
                let rowErrors = {};
                if (!detail.idSupply) { rowErrors.idSupply = "Seleccione un insumo."; isValid = false; detailErrorsExist = true; }
                if (!detail.quantity || Number(detail.quantity) <= 0) { rowErrors.quantity = "Cant. debe ser > 0."; isValid = false; detailErrorsExist = true; }
                if (detail.unitPrice === '' || Number(detail.unitPrice) < 0) { rowErrors.unitPrice = "Precio U. debe ser ≥ 0."; isValid = false; detailErrorsExist = true; }
                if (Object.keys(rowErrors).length > 0) errors.detailRows[index] = rowErrors;
            });
            if (detailErrorsExist) { errors.details = "Revise los errores en los detalles."; }
        }
        setFormErrors(errors);
        return isValid;
    }, [form]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
        if (name === 'category' && !value) setForm(prev => ({ ...prev, details: [] }));
    }, [formErrors]);

    const handleAddDetailRow = useCallback(() => {
        setForm(prev => ({
            ...prev,
            details: [...prev.details, { key: Date.now(), idSupply: '', quantity: '1', unitPrice: '', subtotal: 0, unitOfMeasure: '', previousPrice: null }]
        }));
        if (formErrors.details) setFormErrors(prev => ({ ...prev, details: null }));
    }, [formErrors.details]);

    const handleRemoveDetailRow = useCallback((keyToRemove) => {
        setForm(prev => ({ ...prev, details: prev.details.filter(detail => detail.key !== keyToRemove) }));
    }, []);

    const handleDetailChange = useCallback((index, field, value) => {
        setForm(prev => {
            const newDetails = prev.details.map((item, idx) => {
                if (idx === index) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'quantity' || field === 'unitPrice') {
                        const quantity = Number(updatedItem.quantity) || 0;
                        const unitPrice = Number(updatedItem.unitPrice) || 0;
                        updatedItem.subtotal = quantity * unitPrice;
                    }
                    if (field === 'idSupply' && value) {
                        const selectedSupply = allSupplies.find(s => s.idSupply === parseInt(value));
                        updatedItem.unitOfMeasure = selectedSupply?.unitOfMeasure || '';
                        updatedItem.previousPrice = selectedSupply?.lastPrice;
                        updatedItem.unitPrice = selectedSupply?.lastPrice || '';
                        updatedItem.subtotal = (Number(updatedItem.quantity) || 0) * (Number(selectedSupply?.lastPrice) || 0);
                    } else if (field === 'idSupply' && !value) {
                        updatedItem.unitOfMeasure = '';
                        updatedItem.previousPrice = null;
                        updatedItem.unitPrice = '';
                        updatedItem.subtotal = 0;
                    }
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, details: newDetails };
        });
    }, [allSupplies]);

    useEffect(() => {
        if (form.category && form.details.length === 0 && !isLoadingFormData) {
            handleAddDetailRow();
        }
    }, [form.category, form.details.length, handleAddDetailRow, isLoadingFormData]);

    const calculatedTotal = useMemo(() => {
        return form.details.reduce((sum, detail) => sum + (Number(detail.subtotal) || 0), 0);
    }, [form.details]);

    const handleFormSubmit = useCallback(async (event) => {
        event.preventDefault();
        clearFormErrors();
        if (!validateForm()) {
            toast.error("Corrija los errores marcados en el formulario.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading('Registrando compra...');
        try {
            const purchaseDetailsForApi = form.details.map(({ idSupply, quantity, unitPrice, subtotal }) => ({
                idSupply: parseInt(idSupply, 10),
                quantity: Number(quantity),
                unitPrice: Number(unitPrice),
                subtotal: Number(subtotal)
            }));
            const purchaseData = {
                idProvider: parseInt(form.idProvider, 10),
                purchaseDate: form.purchaseDate,
                category: form.category,
                invoiceNumber: form.invoiceNumber || null,
                receptionDate: form.receptionDate || null,
                observations: form.observations || null,
                details: purchaseDetailsForApi,
            };
            
            const response = await purchaseService.createRegisterPurchase(purchaseData);
            toast.success(response?.message || 'Compra registrada exitosamente!', { id: toastId });
            navigate('/home/produccion/gestion-de-compra');
        } catch (error) {
            toast.error(error.message || 'Error desconocido al guardar la compra.', { id: toastId, duration: 6000 });
        } finally {
            setIsSubmitting(false);
        }
    }, [form, validateForm, navigate, clearFormErrors]);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" />
            <Row className="mb-3 align-items-center">
                <Col xs="auto"><Button color="secondary" outline size="sm" onClick={() => navigate('/home/gestion-compras')} disabled={isSubmitting}><ArrowLeft size={18} /> Volver</Button></Col>
                <Col><h2 className="mb-0 text-center">Registrar Nueva Compra</h2></Col>
                <Col xs="auto" style={{ visibility: 'hidden' }}><Button>Volver</Button></Col>
            </Row>
            <Card className="shadow-sm">
                <CardBody>
                    {isLoadingFormData ? (
                        <div className="text-center my-5 py-5"><Spinner /><p className="mt-3">Cargando...</p></div>
                    ) : (
                        <Form id="registerPurchaseForm" noValidate onSubmit={handleFormSubmit}>
                            <Row className="g-3 mb-4">
                                <Col md={4}><FormGroup><Label for="idProvider" className="fw-bold">Proveedor <span className="text-danger">*</span></Label><Input id="idProvider" bsSize="sm" type="select" name="idProvider" value={form.idProvider} onChange={handleChange} disabled={isSubmitting} invalid={!!formErrors.idProvider}><option value="">Seleccione...</option>{providers.map(p => (<option key={p.idProvider} value={p.idProvider}>{p.company}</option>))}</Input><FormFeedback>{formErrors.idProvider}</FormFeedback></FormGroup></Col>
                                <Col md={4}><FormGroup><Label for="purchaseDate" className="fw-bold">Fecha Compra <span className="text-danger">*</span></Label><Input id="purchaseDate" bsSize="sm" type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} max={dayjs().format('YYYY-MM-DD')} invalid={!!formErrors.purchaseDate} disabled={isSubmitting} /></FormGroup></Col>
                                <Col md={4}><FormGroup><Label for="category" className="fw-bold">Categoría <span className="text-danger">*</span></Label><Input id="category" bsSize="sm" type="select" name="category" value={form.category} onChange={handleChange} disabled={isSubmitting} invalid={!!formErrors.category}><option value="">Seleccione...</option>{PURCHASE_CATEGORIES_FOR_DROPDOWN.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}</Input><FormFeedback>{formErrors.category}</FormFeedback></FormGroup></Col>
                                <Col md={4}><FormGroup><Label for="invoiceNumber" className="fw-bold">Nº Factura</Label><Input id="invoiceNumber" bsSize="sm" type="text" name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} disabled={isSubmitting} maxLength={50} /></FormGroup></Col>
                                <Col md={4}><FormGroup><Label for="receptionDate" className="fw-bold">Fecha Recepción</Label><Input id="receptionDate" bsSize="sm" type="date" name="receptionDate" value={form.receptionDate} onChange={handleChange} min={form.purchaseDate || undefined} invalid={!!formErrors.receptionDate} disabled={isSubmitting} /></FormGroup></Col>
                                <Col md={4}><FormGroup><Label for="observations" className="fw-bold">Observaciones</Label><Input id="observations" bsSize="sm" type="textarea" name="observations" value={form.observations} onChange={handleChange} disabled={isSubmitting} rows={1} /></FormGroup></Col>
                            </Row>
                            <hr />
                            {form.category ? (
                                <>
                                    <h5 className="mb-3">Detalles de la Compra</h5>
                                    {formErrors.details && <Alert color="danger" size="sm" className="py-2 mb-3">{formErrors.details}</Alert>}
                                    {form.details.length > 0 && (
                                        <div className="table-responsive mb-3">
                                            <Table bordered hover size="sm" className="detail-table align-middle">
                                                <thead className="table-light"><tr><th style={{ width: '35%' }}>Insumo <span className="text-danger">*</span></th><th style={{ width: '25%' }} className="text-end">Cant. <span className="text-danger">*</span></th><th style={{ width: '20%' }} className="text-end">Precio U. <span className="text-danger">*</span></th><th style={{ width: '15%' }} className="text-end">Subtotal</th><th style={{ width: '5%' }}></th></tr></thead>
                                                <tbody>
                                                    {form.details.map((detail, index) => {
                                                        const detailErrors = formErrors.detailRows[index] || {};
                                                        const hasPriceChanged = detail.previousPrice !== null && detail.previousPrice !== undefined && Number(detail.unitPrice) !== Number(detail.previousPrice);
                                                        const priceChangeDirection = hasPriceChanged ? (Number(detail.unitPrice) > Number(detail.previousPrice) ? 'increase' : 'decrease') : null;

                                                        return (<tr key={detail.key}>
                                                            <td>
                                                                <Input type="select" bsSize="sm" value={detail.idSupply} onChange={(e) => handleDetailChange(index, 'idSupply', e.target.value)} invalid={!!detailErrors.idSupply} disabled={isSubmitting}>
                                                                    <option value="">Seleccione insumo...</option>
                                                                    {availableSupplies.map(s => (<option key={s.idSupply} value={s.idSupply}>{s.supplyName}</option>))}
                                                                </Input>
                                                                <FormFeedback>{detailErrors.idSupply}</FormFeedback>
                                                            </td>
                                                            <td><InputGroup size="sm"><Input type="number" className="text-end" value={detail.quantity} min="0.001" step="any" onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)} invalid={!!detailErrors.quantity} disabled={isSubmitting} /><InputGroupText>{detail.unitOfMeasure || 'U.'}</InputGroupText></InputGroup><FormFeedback>{detailErrors.quantity}</FormFeedback></td>
                                                            <td>
                                                                <Input type="number" bsSize="sm" className="text-end" value={detail.unitPrice} min="0" step="any" onChange={(e) => handleDetailChange(index, 'unitPrice', e.target.value)} invalid={!!detailErrors.unitPrice} disabled={isSubmitting} />
                                                                <FormFeedback>{detailErrors.unitPrice}</FormFeedback>
                                                                {hasPriceChanged && (
                                                                    <div className={`small mt-1 text-${priceChangeDirection === 'increase' ? 'danger' : 'success'}`}>
                                                                        Precio anterior: {formatCurrencyCOP(detail.previousPrice)}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="text-end">{formatCurrencyCOP(detail.subtotal)}</td>
                                                            <td className="text-center"><Button color="danger" outline size="sm" className="p-1" onClick={() => handleRemoveDetailRow(detail.key)} disabled={isSubmitting || form.details.length <= 1}><Trash2 size={14} /></Button></td>
                                                        </tr>);
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                    <Row className="mt-3 align-items-center">
                                        <Col xs={6}><Button color="secondary" outline size="sm" onClick={handleAddDetailRow} disabled={isSubmitting || availableSupplies.length === 0}><Plus size={16} className="me-1"/> Agregar Detalle</Button></Col>
                                        <Col xs={6} className="text-end"><strong className="fs-5">Total: {formatCurrencyCOP(calculatedTotal)}</strong></Col>
                                    </Row>
                                </>
                            ) : (
                                <div className="text-center my-4"><Alert color="info"><Info size={18} className="me-2"/>Seleccione una categoría para agregar detalles.</Alert></div>
                            )}
                        </Form>
                    )}
                </CardBody>
                <CardHeader className="bg-light d-flex justify-content-end gap-2 border-top py-3">
                    <Button color="secondary" outline onClick={() => navigate('/home/gestion-compras')} disabled={isSubmitting}>Cancelar</Button>
                    <Button color="primary" type="submit" form="registerPurchaseForm" disabled={isLoadingFormData || isSubmitting || !form.category || form.details.length === 0}><Save size={18} className="me-1" />{isSubmitting ? 'Guardando...' : 'Guardar Compra'}</Button>
                </CardHeader>
            </Card>
        </Container>
    );
};

export default RegistrarCompraPage;