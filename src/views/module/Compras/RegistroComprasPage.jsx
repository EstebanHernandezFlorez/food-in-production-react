// src/components/Compras/RegistrarCompraPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import "bootstrap/dist/css/bootstrap.min.css";
import {
    Container, Row, Col, Form, FormGroup, Input, Label, Button,
    Spinner, Alert, Table, Card, CardBody, CardHeader, FormFeedback,
    InputGroup, InputGroupText // Añadido para la unidad de medida
} from "reactstrap";
import { Plus, Trash2, Save, ArrowLeft, CheckCircle as IconSuccess, XCircle as IconError, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components ---
import { formatCurrencyCOP } from "../../../utils/formatting"; // Ajusta la ruta si es necesario

// --- Services ---
import purchaseService from '../../services/registroCompraService'; // Asegúrate que este servicio esté implementado correctamente
import supplyService from '../../services/supplyService';
import providerService from '../../services/proveedorSevice';

// --- Styles ---
import "../../../assets/css/App.css"; // Ajusta la ruta si es necesario

// --- Constants ---
const INITIAL_FORM_DATA = {
    idProvider: '',
    purchaseDate: dayjs().format('YYYY-MM-DD'),
    category: '',
    invoiceNumber: '',
    receptionDate: '',
    observations: '',
    details: [] // Cada detalle: { key, idSupply, quantity, unitPrice, subtotal, unitOfMeasure (para UI) }
};
const INITIAL_FORM_ERRORS = {
    idProvider: null,
    purchaseDate: null,
    category: null,
    invoiceNumber: null,
    receptionDate: null,
    details: null, // Error general para la sección de detalles
    detailRows: {} // Errores: { 0: { idSupply: "Error", quantity: "Error"}, ... }
};

const EXACT_BACKEND_CATEGORIES = [
    'CARNE', 'VEGETALES', 'LACTEOS', 'FRUTAS', 'ABARROTES', 'LIMPIEZA',
    'BEBIDAS', 'CONGELADOS', 'OTROS'
];

const PURCHASE_CATEGORIES_FOR_DROPDOWN = EXACT_BACKEND_CATEGORIES.map(catValue => ({
    value: catValue,
    label: catValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}));


// --- Componente: RegistrarCompraPage ---
const RegistrarCompraPage = () => {
    const [form, setForm] = useState(INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [providers, setProviders] = useState([]);
    const [supplies, setSupplies] = useState([]); // Lista de insumos
    const [isLoadingFormData, setIsLoadingFormData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const fetchFormData = useCallback(async () => {
        setIsLoadingFormData(true);
        try {
            // supplyService.getAllSupplies() debe devolver insumos con:
            // idSupply (PK), name (o supplyName), unitOfMeasure, y status
            const [providersData, suppliesData] = await Promise.all([
                providerService.getAllProveedores(),
                supplyService.getAllSupplies()
            ]);
            setProviders(Array.isArray(providersData) ? providersData.filter(p => p.status) : []);
            setSupplies(Array.isArray(suppliesData) ? suppliesData.filter(s => s.status) : []);
        } catch (error) {
            console.error("Error fetching form data:", error);
            toast.error(`Error al cargar datos: ${error.message || 'Error desconocido'}`);
            setProviders([]);
            setSupplies([]);
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
        else if (!dayjs(form.purchaseDate, 'YYYY-MM-DD', true).isValid()) { errors.purchaseDate = "Fecha de compra inválida."; isValid = false; }
        else if (dayjs(form.purchaseDate).isAfter(dayjs(), 'day')) { errors.purchaseDate = "Fecha de compra no puede ser futura."; isValid = false; }

        if (form.receptionDate && !dayjs(form.receptionDate, 'YYYY-MM-DD', true).isValid()) {
            errors.receptionDate = "Fecha de recepción inválida."; isValid = false;
        } else if (form.receptionDate && form.purchaseDate && dayjs(form.receptionDate).isBefore(dayjs(form.purchaseDate), 'day')) {
            errors.receptionDate = "Recepción no puede ser antes de la compra."; isValid = false;
        }

        if (!form.category) { errors.category = "Seleccione categoría de compra."; isValid = false; }

        if (!form.details || form.details.length === 0) {
            errors.details = "Agregue al menos un ítem/concepto."; isValid = false;
        } else {
            let detailErrorsExist = false;
            form.details.forEach((detail, index) => {
                let rowErrors = {};
                if (!detail.idSupply || isNaN(parseInt(detail.idSupply)) || parseInt(detail.idSupply) <= 0) {
                    rowErrors.idSupply = "Seleccione un insumo válido."; isValid = false; detailErrorsExist = true;
                }
                const quantity = Number(detail.quantity);
                if (isNaN(quantity) || quantity <= 0) { rowErrors.quantity = "Cant. debe ser > 0."; isValid = false; detailErrorsExist = true; }

                const unitPrice = Number(detail.unitPrice);
                if (detail.unitPrice === '' || isNaN(unitPrice) || unitPrice < 0) {
                    rowErrors.unitPrice = "Precio U. debe ser ≥ 0."; isValid = false; detailErrorsExist = true;
                }
                if (Object.keys(rowErrors).length > 0) errors.detailRows[index] = rowErrors;
            });
            if (detailErrorsExist && !errors.details) { errors.details = "Revise errores en los detalles de la compra."; }
        }
        setFormErrors(errors);
        return isValid;
    }, [form]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));

        if (name === 'category' && value && form.details.length === 0) {
            setForm(prevForm => ({
                ...prevForm,
                category: value,
                details: [{ key: Date.now(), idSupply: '', quantity: '1', unitPrice: '', subtotal: 0, unitOfMeasure: '' }]
            }));
            setFormErrors(prevErrors => ({ ...prevErrors, details: null, detailRows: {} }));
        } else if (name === 'category' && !value) {
            setForm(prevForm => ({ ...prevForm, details: [] }));
            setFormErrors(prevErrors => ({ ...prevErrors, details: null, detailRows: {} }));
        }
    }, [formErrors, form.details.length]);

    const handleAddDetailRow = useCallback(() => {
        setForm(prev => ({
            ...prev,
            details: [...prev.details, { key: Date.now(), idSupply: '', quantity: '1', unitPrice: '', subtotal: 0, unitOfMeasure: '' }]
        }));
        if (formErrors.details) setFormErrors(prev => ({ ...prev, details: null }));
    }, [formErrors.details]);

    const handleRemoveDetailRow = useCallback((keyToRemove) => {
        setForm(prev => {
            const newDetails = prev.details.filter(detail => detail.key !== keyToRemove);
            setFormErrors(currentErrors => ({ ...currentErrors, detailRows: {} }));
            return { ...prev, details: newDetails };
        });
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
                        const selectedSupply = supplies.find(s => s.idSupply === parseInt(value));
                        updatedItem.unitOfMeasure = selectedSupply ? (selectedSupply.unitOfMeasure || '') : ''; // Asume que el insumo tiene unitOfMeasure
                    } else if (field === 'idSupply' && !value) {
                        updatedItem.unitOfMeasure = '';
                    }
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, details: newDetails };
        });

        setFormErrors(prev => {
            const newDetailRowsErrors = { ...(prev.detailRows || {}) };
            if (newDetailRowsErrors[index] && newDetailRowsErrors[index][field]) {
                delete newDetailRowsErrors[index][field];
                if (Object.keys(newDetailRowsErrors[index]).length === 0) {
                    delete newDetailRowsErrors[index];
                }
            }
            const anyDetailRowError = Object.values(newDetailRowsErrors).some(rowErr => Object.keys(rowErr).length > 0);
            const generalDetailsError = anyDetailRowError ? (prev.formErrors?.details || "Revise errores en detalles.") : null;
            return { ...prev, detailRows: newDetailRowsErrors, details: generalDetailsError };
        });
    }, [supplies, formErrors]); // Añadido formErrors como dependencia por prev.formErrors?.details

    useEffect(() => {
        if (form.category && form.details.length === 0 && !isLoadingFormData && supplies.length > 0) {
            handleAddDetailRow();
        }
    }, [form.category, form.details.length, handleAddDetailRow, isLoadingFormData, supplies.length]);

    const calculatedTotal = useMemo(() => {
        return form.details.reduce((sum, detail) => sum + (Number(detail.subtotal) || 0), 0);
    }, [form.details]);

    const handleFormSubmit = useCallback(async (event) => {
        event.preventDefault();
        clearFormErrors();

        if (!validateForm()) {
            toast.error("Corrija los errores marcados en el formulario.", { icon: <IconError /> });
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Registrando compra...');
        try {
            // !!! CAMBIO CRÍTICO AQUÍ !!!
            // El backend espera 'idSupplier' para la FK del insumo en cada detalle.
            // 'detail.idSupply' en nuestro estado del formulario SÍ contiene el ID del insumo seleccionado.
            // Lo renombramos a 'idSupplier' SOLO para el envío al backend.
            const purchaseDetailsForApi = form.details.map(({ idSupply, quantity, unitPrice }) => ({ // Quita campos no necesarios para el backend si los hooks los calculan
                idSupply: parseInt(idSupply, 10), // CORRECTO: Coincide con el modelo PurchaseDetail
                quantity: Number(quantity),
                unitPrice: Number(unitPrice)
                // El subtotal, taxAmount, itemTotal del detalle serán calculados por el hook beforeValidate en PurchaseDetail.js
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
            
            console.log("Enviando al backend (RegistrarCompraPage - Payload):", JSON.stringify(purchaseData, null, 2)); // Para depurar

            const response = await purchaseService.createRegisterPurchase(purchaseData);
            toast.success(response?.message || 'Compra registrada exitosamente!', { id: toastId, icon: <IconSuccess /> });
            navigate('/home/produccion/gestion-de-compra');

        } catch (error) {
            console.error('[SUBMIT ERROR]', error);
            // El mensaje de error ya viene formateado por el servicio.
            toast.error(error.message || 'Error desconocido al guardar la compra.', { id: toastId, duration: 6000, icon: <IconError /> });
        } finally {
            setIsSubmitting(false);
        }
    }, [form, validateForm, navigate, clearFormErrors]); // Asegúrate que las dependencias sean correctas

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 }, duration: 4000 }} />
            <Row className="mb-3 align-items-center">
                <Col xs="auto"><Button color="secondary" outline size="sm" onClick={() => navigate('/home/gestion-compras')} disabled={isSubmitting}><ArrowLeft size={18} /> Volver</Button></Col>
                <Col><h2 className="mb-0 text-center">Registrar Nueva Compra</h2></Col>
                <Col xs="auto" style={{ visibility: 'hidden' }}><Button>Volver</Button></Col>
            </Row>
            <Card className="shadow-sm">
                <CardBody>
                    {isLoadingFormData ? (
                        <div className="text-center my-5 py-5">
                            <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
                            <p className="mt-3 mb-0 text-muted fs-5">Cargando datos...</p>
                        </div>
                    ) : (
                        <Form id="registerPurchaseForm" noValidate onSubmit={handleFormSubmit}>
                            <Row className="g-3 mb-4">
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="idProvider" className="form-label fw-bold">Proveedor <span className="text-danger">*</span></Label>
                                        <Input id="idProvider" bsSize="sm" type="select" name="idProvider" value={form.idProvider} onChange={handleChange} disabled={isSubmitting || providers.length === 0} invalid={!!formErrors.idProvider} required >
                                            <option value="">Seleccione proveedor...</option>
                                            {providers.map(p => (<option key={p.idProvider} value={p.idProvider}>{p.company}</option>))}
                                        </Input>
                                        <FormFeedback>{formErrors.idProvider}</FormFeedback>
                                        {providers.length === 0 && !isLoadingFormData && <small className="text-warning d-block mt-1">No hay proveedores activos.</small>}
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="purchaseDate" className="form-label fw-bold">Fecha Compra <span className="text-danger">*</span></Label>
                                        <Input id="purchaseDate" bsSize="sm" type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} max={dayjs().format('YYYY-MM-DD')} invalid={!!formErrors.purchaseDate} disabled={isSubmitting} required />
                                        <FormFeedback>{formErrors.purchaseDate}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="category" className="form-label fw-bold">Categoría <span className="text-danger">*</span></Label>
                                        <Input id="category" bsSize="sm" type="select" name="category" value={form.category} onChange={handleChange} disabled={isSubmitting} invalid={!!formErrors.category} required >
                                            <option value="">Seleccione categoría...</option>
                                            {PURCHASE_CATEGORIES_FOR_DROPDOWN.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </Input>
                                        <FormFeedback>{formErrors.category}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="invoiceNumber" className="form-label fw-bold">Nº Factura</Label>
                                        <Input id="invoiceNumber" bsSize="sm" type="text" name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} disabled={isSubmitting} invalid={!!formErrors.invoiceNumber} maxLength={50} />
                                        <FormFeedback>{formErrors.invoiceNumber}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="receptionDate" className="form-label fw-bold">Fecha Recepción</Label>
                                        <Input id="receptionDate" bsSize="sm" type="date" name="receptionDate" value={form.receptionDate} onChange={handleChange} min={form.purchaseDate || undefined} invalid={!!formErrors.receptionDate} disabled={isSubmitting} />
                                        <FormFeedback>{formErrors.receptionDate}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="observations" className="form-label fw-bold">Observaciones</Label>
                                        <Input id="observations" bsSize="sm" type="textarea" name="observations" value={form.observations} onChange={handleChange} disabled={isSubmitting} rows={1} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <hr />
                            {form.category && (
                                <>
                                    <h5 className="mb-3">Detalles de la Compra</h5>
                                    {formErrors.details && <Alert color="danger" size="sm" className="py-2 px-3 mb-3">{formErrors.details}</Alert>}
                                    
                                    {supplies.length === 0 && !isLoadingFormData && (
                                        <Alert color="warning" size="sm" className="py-2 px-3 mb-3">
                                            <Info size={18} className="me-2 flex-shrink-0"/>
                                            No hay insumos activos definidos. No podrá agregar detalles.
                                        </Alert>
                                    )}

                                    {supplies.length > 0 && (
                                        <div className="table-responsive mb-3">
                                            <Table bordered hover size="sm" className="detail-table align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ width: '35%' }}>Insumo/Concepto <span className="text-danger">*</span></th>
                                                        <th style={{ width: '25%' }} className="text-end">Cant. <span className="text-danger">*</span></th>
                                                        <th style={{ width: '20%' }} className="text-end">Precio U. <span className="text-danger">*</span></th>
                                                        <th style={{ width: '15%' }} className="text-end">Subtotal</th>
                                                        <th style={{ width: '5%' }} aria-label="Acciones"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.details.map((detail, index) => {
                                                        const detailErrors = formErrors.detailRows[index] || {};
                                                        return (
                                                            <tr key={detail.key}>
                                                                <td>
                                                                    <Input type="select" name="idSupply" bsSize="sm" value={detail.idSupply} onChange={(e) => handleDetailChange(index, 'idSupply', e.target.value)} invalid={!!detailErrors.idSupply} disabled={isSubmitting || supplies.length === 0} >
                                                                        <option value="">Seleccione insumo...</option>
                                                                        {supplies.map(s => (<option key={s.idSupply} value={s.idSupply}>{s.name || s.supplyName}</option>))}
                                                                    </Input>
                                                                    <FormFeedback className="d-block text-start">{detailErrors.idSupply}</FormFeedback>
                                                                </td>
                                                                <td>
                                                                    <InputGroup size="sm">
                                                                        <Input type="number" name="quantity" className="text-end" value={detail.quantity} min="0.001" step="any" onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)} invalid={!!detailErrors.quantity} disabled={isSubmitting} placeholder="0" style={{ borderTopRightRadius: detail.unitOfMeasure ? 0 : undefined, borderBottomRightRadius: detail.unitOfMeasure ? 0 : undefined }}/>
                                                                        {detail.unitOfMeasure && (
                                                                            <InputGroupText style={{ minWidth: '50px', justifyContent: 'center', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                                                                                {detail.unitOfMeasure}
                                                                            </InputGroupText>
                                                                        )}
                                                                    </InputGroup>
                                                                    <FormFeedback className="d-block text-start">{detailErrors.quantity}</FormFeedback>
                                                                </td>
                                                                <td>
                                                                    <Input type="number" name="unitPrice" bsSize="sm" className="text-end" value={detail.unitPrice} min="0" step="any" onChange={(e) => handleDetailChange(index, 'unitPrice', e.target.value)} invalid={!!detailErrors.unitPrice} disabled={isSubmitting} placeholder="0.00" />
                                                                    <FormFeedback className="d-block text-start">{detailErrors.unitPrice}</FormFeedback>
                                                                </td>
                                                                <td className="text-end">{formatCurrencyCOP(detail.subtotal)}</td>
                                                                <td className="text-center">
                                                                    <Button color="danger" outline size="sm" className="p-1" onClick={() => handleRemoveDetailRow(detail.key)} disabled={isSubmitting || form.details.length <= 1} title={form.details.length <= 1 ? "Debe haber al menos un detalle" : "Eliminar fila"} > <Trash2 size={14} /> </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                    <Row className="mt-3 align-items-center">
                                        <Col xs={6}>
                                            <Button color="secondary" outline size="sm" onClick={handleAddDetailRow} disabled={isSubmitting || supplies.length === 0 || !form.category}>
                                                <Plus size={16} className="me-1" /> Agregar Detalle
                                            </Button>
                                        </Col>
                                        <Col xs={6} className="text-end">
                                            <strong className="fs-5">Total Compra: {formatCurrencyCOP(calculatedTotal)}</strong>
                                        </Col>
                                    </Row>
                                </>
                            )}
                            {!form.category &&
                                <div className="text-center my-4">
                                    <Alert color="info" className="py-2 px-3 mb-3 fs-sm d-flex align-items-center justify-content-center">
                                        <Info size={18} className="me-2 flex-shrink-0" />
                                        Seleccione una categoría para agregar los detalles de la compra.
                                    </Alert>
                                </div>
                            }
                        </Form>
                    )}
                </CardBody>
                <CardHeader className="bg-light d-flex justify-content-end gap-2 border-top py-3">
                    <Button color="secondary" outline onClick={() => navigate('/home/gestion-compras')} disabled={isSubmitting}>
                        <IconError size={18} className="me-1" /> Cancelar
                    </Button>
                    <Button color="primary" type="submit" form="registerPurchaseForm"
                        disabled={
                            isLoadingFormData || 
                            isSubmitting || 
                            !form.idProvider || 
                            !form.purchaseDate || 
                            !form.category || 
                            (form.category && supplies.length > 0 && form.details.length === 0) ||
                            (form.category && supplies.length === 0 && form.details.length > 0) // Evitar guardar si no hay insumos para la categoría pero se intentó añadir detalles manualmente
                        }
                        title={
                            (!form.idProvider || !form.purchaseDate || !form.category) ? "Complete los campos obligatorios de la cabecera" :
                            (form.category && supplies.length === 0) ? "No hay insumos definidos para esta categoría. No se pueden agregar detalles." :
                            (form.category && supplies.length > 0 && form.details.length === 0) ? "Agregue al menos un detalle a la compra" :
                            "Guardar Compra"
                        }
                    >
                        {isSubmitting ? <><Spinner size="sm" /> Guardando...</> : <><Save size={18} className="me-1" /> Guardar Compra</>}
                    </Button>
                </CardHeader>
            </Card>
        </Container>
    );
};

export default RegistrarCompraPage;