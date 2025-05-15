// src/components/Compras/RegistrarCompraPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import "bootstrap/dist/css/bootstrap.min.css";
import {
    Container, Row, Col, Form, FormGroup, Input, Label, Button,
    Spinner, Alert, Table, Card, CardBody, CardHeader, FormFeedback
} from "reactstrap";
import { Plus, Trash2, Save, ArrowLeft, CheckCircle as IconSuccess, XCircle as IconError } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components ---
import { formatCurrencyCOP } from "../../../utils/formatting"; // Verifica la ruta

// --- Services ---
import purchaseService from '../../services/registroCompraService'; // Servicio para crear la compra
import insumoService from '../../services/insumoService'; // Servicio para obtener los insumos (suppliers)
import providerService from '../../services/proveedorSevice'; // Servicio para obtener los proveedores (verifica nombre de archivo)

// --- Styles ---
import "../../../assets/css/App.css"; // Verifica la ruta

// --- Constants ---
const INITIAL_FORM_DATA = {
    idProvider: '',
    purchaseDate: dayjs().format('YYYY-MM-DD'),
    category: '', // Campo de categoría añadido
    details: []
};
const INITIAL_FORM_ERRORS = {
    idProvider: null,
    purchaseDate: null,
    category: null, // Error para categoría añadido
    details: null,
    detailRows: {}
};

// --- Componente: RegistrarCompraPage ---
const RegistrarCompraPage = () => {
    const [form, setForm] = useState(INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [providers, setProviders] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [categories, setCategories] = useState([ // Define tus categorías aquí
        { value: 'INSUMOS_COCINA', label: 'Insumos de Cocina' },
        { value: 'BEBIDAS', label: 'Bebidas' },
        { value: 'LIMPIEZA', label: 'Productos de Limpieza' },
        { value: 'MENAJE_UTENSILIOS', label: 'Menaje y Utensilios' },
        { value: 'EQUIPAMIENTO_MENOR', label: 'Equipamiento Menor' },
        { value: 'MANTENIMIENTO', label: 'Mantenimiento y Reparaciones' },
        { value: 'MARKETING_PUBLICIDAD', label: 'Marketing y Publicidad' },
        { value: 'SERVICIOS_PUBLICOS', label: 'Servicios Públicos' },
        { value: 'GASTOS_ADMINISTRATIVOS', label: 'Gastos Administrativos' },
        { value: 'OTROS', label: 'Otros' },
    ]);
    const [isLoadingFormData, setIsLoadingFormData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDetailsTable, setShowDetailsTable] = useState(false);
    const navigate = useNavigate();

    // --- Fetch Data for Selects ---
    const fetchFormData = useCallback(async () => {
        console.log("[fetchFormData] Setting isLoadingFormData to true");
        setIsLoadingFormData(true);
        setProviders([]);
        setInsumos([]);
        try {
            console.log("[fetchFormData] Calling services for providers and insumos...");
            const [providersData, insumosData] = await Promise.all([
                providerService.getAllProveedores(), // Asegúrate que esta función exista y el servicio esté bien importado
                insumoService.getAllSuppliers()      // Asume que insumoService.getAllSuppliers() es correcto
            ]);

            console.log("[fetchFormData] Services successful.");
            console.log("Providers Data Raw:", providersData);
            console.log("Insumos/Suppliers Data Raw:", insumosData);

            setProviders(Array.isArray(providersData) ? providersData : []);
            setInsumos(Array.isArray(insumosData) ? insumosData : []);

            if (!Array.isArray(providersData)) {
                console.warn("Providers data received is not an array:", providersData);
                toast.error("Formato inesperado de datos de proveedores.");
            }
            if (!Array.isArray(insumosData)) {
                console.warn("Insumos/Suppliers data received is not an array:", insumosData);
                 toast.error("Formato inesperado de datos de insumos.");
            }
        } catch (error) {
            console.error("Error fetching form data:", error);
            toast.error("Error al cargar datos iniciales (proveedores/insumos).");
            setProviders([]);
            setInsumos([]);
        } finally {
            console.log("[fetchFormData] Setting isLoadingFormData to false in finally block");
            setIsLoadingFormData(false);
        }
    }, []);

    useEffect(() => {
        fetchFormData();
    }, [fetchFormData]);

    // --- Form Logic ---
    const resetForm = useCallback(() => {
        setForm(INITIAL_FORM_DATA);
        setFormErrors(INITIAL_FORM_ERRORS);
        setShowDetailsTable(false);
    }, []);

    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    const validateForm = useCallback(() => {
        const errors = { ...INITIAL_FORM_ERRORS, detailRows: {} };
        let isValid = true;

        if (!form.idProvider) { errors.idProvider = "Seleccione un proveedor."; isValid = false; }
        if (!form.purchaseDate) { errors.purchaseDate = "Seleccione una fecha."; isValid = false; }
        else if (!dayjs(form.purchaseDate, 'YYYY-MM-DD', true).isValid()) { errors.purchaseDate = "Fecha inválida."; isValid = false; }
        else if (dayjs(form.purchaseDate).isAfter(dayjs(), 'day')) { errors.purchaseDate = "La fecha no puede ser futura."; isValid = false; }

        if (!form.category) { errors.category = "Seleccione una categoría para la compra."; isValid = false; }

        if (showDetailsTable) {
            if (!form.details || form.details.length === 0) {
                errors.details = "Debe agregar al menos un insumo a la compra.";
                isValid = false;
            } else {
                let detailErrorsExist = false;
                form.details.forEach((detail, index) => {
                    let rowErrors = {};
                    if (!detail.idSupplier) { rowErrors.idSupplier = "Seleccione"; isValid = false; detailErrorsExist = true; }
                    const quantity = Number(detail.quantity);
                    if (isNaN(quantity) || quantity <= 0) { rowErrors.quantity = "Inválido (>0)"; isValid = false; detailErrorsExist = true; }
                    const unitPrice = Number(detail.unitPrice);
                    if (detail.unitPrice === '' || isNaN(unitPrice) || unitPrice < 0) { rowErrors.unitPrice = "Inválido (≥0)"; isValid = false; detailErrorsExist = true; }
                    if (Object.keys(rowErrors).length > 0) errors.detailRows[index] = rowErrors;
                });
                 if (detailErrorsExist && !errors.details) { errors.details = "Revise los campos marcados en los insumos."; }
            }
        }
        setFormErrors(errors);
        return isValid;
    }, [form.idProvider, form.purchaseDate, form.category, form.details, showDetailsTable]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
        if ((name === 'idProvider' || name === 'purchaseDate' || name === 'category') && formErrors.details) {
            setFormErrors(prev => ({ ...prev, details: null }));
        }
    }, [formErrors]);

    // --- Detail Row Handlers ---
    const handleAddDetailRow = useCallback(() => {
        if (!showDetailsTable) setShowDetailsTable(true);
        setForm(prev => ({
            ...prev,
            details: [...prev.details, { key: Date.now(), idSupplier: '', quantity: '', unitPrice: '', subtotal: 0 }]
        }));
        if (formErrors.details) setFormErrors(prev => ({ ...prev, details: null }));
    }, [showDetailsTable, formErrors.details]);

    const handleRemoveDetailRow = useCallback((keyToRemove) => {
        setForm(prev => {
            const newDetails = prev.details.filter(detail => detail.key !== keyToRemove);
            if (newDetails.length === 0 && showDetailsTable) setShowDetailsTable(false);
            setFormErrors(currentErrors => ({...currentErrors, detailRows: {}}));
            return { ...prev, details: newDetails };
        });
    }, [showDetailsTable]);

    const handleDetailChange = useCallback((index, field, value) => {
        setForm(prev => {
            const newDetails = [...prev.details];
            const detailToUpdate = { ...newDetails[index], [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                const quantity = Number(detailToUpdate.quantity) || 0;
                const unitPrice = Number(detailToUpdate.unitPrice) || 0;
                detailToUpdate.subtotal = quantity * unitPrice;
            }
            newDetails[index] = detailToUpdate;
            return { ...prev, details: newDetails };
        });
        setFormErrors(prev => {
            const newDetailRows = { ...prev.detailRows };
            if (newDetailRows[index] && newDetailRows[index][field]) {
                delete newDetailRows[index][field];
                if (Object.keys(newDetailRows[index]).length === 0) delete newDetailRows[index];
            }
            const generalDetailError = Object.keys(newDetailRows).length > 0 ? prev.details : null;
            return { ...prev, detailRows: newDetailRows, details: generalDetailError };
        });
    }, []);

    const calculatedTotal = useMemo(() => {
        return form.details.reduce((sum, detail) => sum + (Number(detail.subtotal) || 0), 0);
    }, [form.details]);

    // --- Submit Handler ---
    const handleFormSubmit = useCallback(async (event) => {
        event.preventDefault();
        clearFormErrors();

        if (!showDetailsTable && insumos.length > 0) {
             setShowDetailsTable(true);
             toast.error("Por favor, agregue los insumos de la compra.", { icon: <IconError/> });
             setFormErrors(prev => ({...prev, details: "Agregue al menos un insumo."}));
             return;
        }

        if (!validateForm()) {
            toast.error("Por favor, corrija los errores marcados en el formulario.", { icon: <IconError /> });
            return;
        }

        if (showDetailsTable && (!form.details || form.details.length === 0)) {
             toast.error("Debe agregar al menos un insumo antes de guardar.", { icon: <IconError /> });
             setFormErrors(prev => ({...prev, details: "Agregue al menos un insumo."}));
             return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Registrando compra...');
         try {
            const purchaseDetailsForApi = form.details.map(({ key, subtotal, ...detail }) => ({
                idInsumo: parseInt(detail.idSupplier, 10) || 0,
                quantity: Number(detail.quantity) || 0,
                unitPrice: Number(detail.unitPrice) || 0
            }));

             const purchaseData = {
                idProvider: parseInt(form.idProvider, 10), // Asegurar que sea número
                purchaseDate: form.purchaseDate,
                category: form.category, // Enviar la categoría
                totalAmount: Number(calculatedTotal) || 0,
                details: purchaseDetailsForApi,
                // status: 'PENDIENTE' // El backend ya tiene un default
            };

            console.log("[SUBMIT] Sending purchase data:", JSON.stringify(purchaseData, null, 2));
            await purchaseService.createRegisterPurchase(purchaseData);

            toast.success('Compra registrada exitosamente!', { id: toastId, icon: <IconSuccess /> });
            navigate('/gestion-compras');

        } catch (error) {
            console.error('[SUBMIT CREATE PURCHASE ERROR]', error);
            let errorMsg = 'Error desconocido al guardar la compra.';
            if (error.response) {
                console.error("Error Response Data:", error.response.data);
                console.error("Error Response Status:", error.response.status);
                errorMsg = error.response.data?.message || error.response.data?.error || error.message;
            } else {
                errorMsg = error.message;
            }
            toast.error(`Error al registrar: ${errorMsg}`, { id: toastId, duration: 6000, icon: <IconError /> });
        } finally {
            setIsSubmitting(false);
        }
    }, [form, validateForm, navigate, showDetailsTable, clearFormErrors, insumos.length, calculatedTotal]);


    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            <Row className="mb-3 align-items-center">
                 <Col xs="auto"><Button color="secondary" outline size="sm" onClick={() => navigate('/gestion-compras')} disabled={isSubmitting}><ArrowLeft size={18} /> Volver</Button></Col>
                 <Col><h2 className="mb-0 text-center">Registrar Nueva Compra</h2></Col>
                 <Col xs="auto" style={{ visibility: 'hidden' }}><Button color="secondary" outline size="sm"><ArrowLeft size={18} /> Volver</Button></Col>
            </Row>
            <Card className="shadow-sm">
            <CardBody>
                    {isLoadingFormData ? (
                        <div className="text-center my-5 py-5">
                            <Spinner color="primary" style={{ width: '3rem', height: '3rem' }}/>
                            <p className="mt-3 mb-0 text-muted fs-5">Cargando datos necesarios...</p>
                        </div>
                    ) : (
                        <Form id="registerPurchaseForm" noValidate onSubmit={handleFormSubmit}>
                             <Row className="g-3 mb-4">
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="idProvider" className="form-label fw-bold">Proveedor <span className="text-danger">*</span></Label>
                                        <Input
                                            id="idProvider" bsSize="sm" type="select" name="idProvider"
                                            value={form.idProvider} onChange={handleChange}
                                            disabled={isSubmitting || providers.length === 0}
                                            invalid={!!formErrors.idProvider} required
                                        >
                                            <option value="">Seleccione un proveedor...</option>
                                            {/* Verifica propiedades: p.id (o p.idProvider) y p.name (o p.company) */}
                                            {providers.map(p => (<option key={p.idProvider || p.id} value={p.idProvider || p.id}>{p.company || p.name}</option>))}
                                        </Input>
                                        <FormFeedback>{formErrors.idProvider}</FormFeedback>
                                        {providers.length === 0 && !isLoadingFormData && <small className="text-warning d-block mt-1">No hay proveedores activos.</small>}
                                    </FormGroup>
                                </Col>
                                 <Col md={4}>
                                     <FormGroup>
                                        <Label for="purchaseDate" className="form-label fw-bold">Fecha Compra <span className="text-danger">*</span></Label>
                                        <Input
                                            id="purchaseDate" bsSize="sm" type="date" name="purchaseDate"
                                            value={form.purchaseDate} onChange={handleChange}
                                            max={dayjs().format('YYYY-MM-DD')}
                                            invalid={!!formErrors.purchaseDate} disabled={isSubmitting} required
                                        />
                                        <FormFeedback>{formErrors.purchaseDate}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="category" className="form-label fw-bold">Categoría Compra <span className="text-danger">*</span></Label>
                                        <Input
                                            id="category" bsSize="sm" type="select" name="category"
                                            value={form.category} onChange={handleChange}
                                            disabled={isSubmitting}
                                            invalid={!!formErrors.category} required
                                        >
                                            <option value="">Seleccione una categoría...</option>
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </Input>
                                        <FormFeedback>{formErrors.category}</FormFeedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <hr />

                            {!showDetailsTable ? (
                                <div className="text-center my-4">
                                    <Button
                                        color="success" outline onClick={handleAddDetailRow}
                                        disabled={isSubmitting || insumos.length === 0}
                                    >
                                        <Plus size={16} className="me-1" /> Agregar Insumos a la Compra
                                    </Button>
                                     {insumos.length === 0 && !isLoadingFormData && <p className="text-warning mt-2 small">No hay insumos disponibles para agregar.</p>}
                                </div>
                            ) : (
                                <>
                                    <h5 className="mb-3">Detalles de Insumos</h5>
                                    {formErrors.details && <Alert color="danger" size="sm" className="py-2 px-3 mb-3">{formErrors.details}</Alert>}

                                    <div className="table-responsive mb-3">
                                         <Table bordered hover size="sm" className="detail-table align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '40%' }}>Insumo <span className="text-danger">*</span></th>
                                                    <th style={{ width: '15%' }} className="text-end">Cant. <span className="text-danger">*</span></th>
                                                    <th style={{ width: '20%' }} className="text-end">Precio U. <span className="text-danger">*</span></th>
                                                    <th style={{ width: '20%' }} className="text-end">Subtotal</th>
                                                    <th style={{ width: '5%' }} aria-label="Acciones"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                 {form.details.map((detail, index) => {
                                                    const detailErrors = formErrors.detailRows[index] || {};
                                                    return (
                                                        <tr key={detail.key}>
                                                            <td>
                                                                <Input
                                                                    type="select" name="idSupplier"
                                                                    bsSize="sm" className="form-control-sm"
                                                                    value={detail.idSupplier}
                                                                    onChange={(e) => handleDetailChange(index, 'idSupplier', e.target.value)}
                                                                    invalid={!!detailErrors.idSupplier}
                                                                    disabled={isSubmitting || insumos.length === 0}
                                                                >
                                                                    <option value="">Seleccione...</option>
                                                                    {/* Verifica propiedades: i.id (o i.idSupplier) y i.name (o i.supplierName) */}
                                                                    {insumos.map(i => (
                                                                        <option key={i.idSupplier || i.id} value={i.idSupplier || i.id}>
                                                                            {i.supplierName || i.name || i.nombreInsumo}
                                                                        </option>
                                                                    ))}
                                                                </Input>
                                                                <FormFeedback className="d-block">{detailErrors.idSupplier}</FormFeedback>
                                                            </td>
                                                            <td>
                                                                <Input type="number" name="quantity" bsSize="sm" className="form-control-sm text-end"
                                                                    value={detail.quantity} min="0.01" step="any"
                                                                    onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                                                                    invalid={!!detailErrors.quantity} disabled={isSubmitting} placeholder="0"
                                                                />
                                                                <FormFeedback className="d-block">{detailErrors.quantity}</FormFeedback>
                                                            </td>
                                                            <td>
                                                                <Input type="number" name="unitPrice" bsSize="sm" className="form-control-sm text-end"
                                                                    value={detail.unitPrice} min="0" step="any"
                                                                    onChange={(e) => handleDetailChange(index, 'unitPrice', e.target.value)}
                                                                    invalid={!!detailErrors.unitPrice} disabled={isSubmitting} placeholder="0.00"
                                                                />
                                                                <FormFeedback className="d-block">{detailErrors.unitPrice}</FormFeedback>
                                                            </td>
                                                            <td className="text-end">{formatCurrencyCOP(detail.subtotal)}</td>
                                                            <td className="text-center">
                                                                <Button color="danger" outline size="sm" className="p-1"
                                                                    onClick={() => handleRemoveDetailRow(detail.key)}
                                                                    disabled={isSubmitting} title="Eliminar fila"
                                                                > <Trash2 size={14} /> </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                     <Row className="mt-3 align-items-center">
                                        <Col xs={6}>
                                            <Button color="secondary" outline size="sm" onClick={handleAddDetailRow} disabled={isSubmitting || insumos.length === 0}>
                                                <Plus size={16} className="me-1"/> Agregar Otro Insumo
                                            </Button>
                                        </Col>
                                        <Col xs={6} className="text-end">
                                            <strong className="fs-5">Total Compra: {formatCurrencyCOP(calculatedTotal)}</strong>
                                        </Col>
                                     </Row>
                                </>
                            )}
                        </Form>
                    )}
                </CardBody>
                 <CardHeader className="bg-light d-flex justify-content-end gap-2 border-top">
                    <Button color="secondary" outline onClick={() => navigate('/home/gestion-compras')} disabled={isSubmitting}>
                        <IconError size={18} className="me-1" /> Cancelar
                    </Button>
                    <Button color="primary" type="submit" form="registerPurchaseForm"
                        disabled={isLoadingFormData || isSubmitting || (!showDetailsTable && insumos.length > 0 && !isLoadingFormData) }
                    >
                        {isSubmitting ? <><Spinner size="sm"/> Guardando...</> : <><Save size={18} className="me-1"/> Guardar Compra</>}
                    </Button>
                 </CardHeader>
            </Card>
        </Container>
    );
};

export default RegistrarCompraPage;