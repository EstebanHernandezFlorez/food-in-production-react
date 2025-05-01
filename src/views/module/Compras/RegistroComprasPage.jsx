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

// *** CORREGIDO: Importa el servicio correcto para obtener los insumos/suppliers ***
// Se usa el alias 'insumoService' porque el resto del código lo espera, pero apunta a supplierService.jsx
import insumoService from '../../services/insumoService'; // <= ¡Asegúrate que este archivo exista y sea el correcto!

// *** REVISAR ESTA IMPORTACIÓN ***
// 1. ¿El archivo se llama 'proveedorService.js' o 'proveedorSevice.js'? Corrige el nombre.
// 2. ¿Este archivo exporta una función llamada 'getAllProveedores' (o similar)?
import providerService from '../../services/proveedorSevice'; // <= ¡Verifica nombre de archivo y función exportada!

// --- Styles ---
import "../../../assets/css/App.css"; // Verifica la ruta

// --- Constants ---
const INITIAL_FORM_DATA = { idProvider: '', purchaseDate: dayjs().format('YYYY-MM-DD'), details: [] };
const INITIAL_FORM_ERRORS = { idProvider: null, purchaseDate: null, details: null, detailRows: {} };

// --- Componente: RegistrarCompraPage ---
const RegistrarCompraPage = () => {
    const [form, setForm] = useState(INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [providers, setProviders] = useState([]); // Estado para proveedores
    const [insumos, setInsumos] = useState([]);     // Estado para insumos/suppliers
    const [isLoadingFormData, setIsLoadingFormData] = useState(true); // Inicia cargando
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDetailsTable, setShowDetailsTable] = useState(false); // Inicia oculta
    const navigate = useNavigate();

    // --- Fetch Data for Selects ---
    const fetchFormData = useCallback(async () => {
        console.log("[fetchFormData] Setting isLoadingFormData to true");
        setIsLoadingFormData(true);
        setProviders([]); // Limpiar estados antes de cargar
        setInsumos([]);
        try {
            console.log("[fetchFormData] Calling services for providers and insumos...");

            // *** VERIFICA ESTAS LLAMADAS ***
            // 1. Reemplaza 'getAllProveedores' si la función en 'proveedorService.js' se llama diferente.
            // 2. 'insumoService.getAllSuppliers' usa el 'supplierService.jsx' importado arriba.
            const [providersData, insumosData] = await Promise.all([
                providerService.getAllProveedores(), // <= ¡VERIFICA ESTA FUNCIÓN!
                insumoService.getAllSuppliers()      // <= Usa supplierService.jsx::getAllSuppliers
            ]);

            console.log("[fetchFormData] Services successful.");
            console.log("Providers Data Raw:", providersData); // Log para ver datos crudos
            console.log("Insumos/Suppliers Data Raw:", insumosData); // Log para ver datos crudos

            // Guarda los datos SOLO si son arrays válidos
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
            // Intentar dar un mensaje más específico
            if (error.message && error.message.toLowerCase().includes('provider')) {
                 toast.error("Error al cargar proveedores.");
            } else if (error.message && error.message.toLowerCase().includes('supplier')) {
                 toast.error("Error al cargar insumos.");
            } else {
                toast.error("Error al cargar datos iniciales (proveedores/insumos).");
            }
            // Resetear estados a vacío en caso de error total
            setProviders([]);
            setInsumos([]);
        } finally {
            // ASEGURA QUE SIEMPRE SE DESACTIVE LA CARGA
            console.log("[fetchFormData] Setting isLoadingFormData to false in finally block");
            setIsLoadingFormData(false);
        }
    }, []); // Dependencias vacías, no depende de props o state que cambien

    // Llamar a fetchFormData al montar el componente
    useEffect(() => {
        fetchFormData();
    }, [fetchFormData]); // Incluir fetchFormData como dependencia

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

        // Validar cabecera
        if (!form.idProvider) { errors.idProvider = "Seleccione un proveedor."; isValid = false; }
        if (!form.purchaseDate) { errors.purchaseDate = "Seleccione una fecha."; isValid = false; }
        else if (!dayjs(form.purchaseDate, 'YYYY-MM-DD', true).isValid()) { errors.purchaseDate = "Fecha inválida."; isValid = false; }
        else if (dayjs(form.purchaseDate).isAfter(dayjs(), 'day')) { errors.purchaseDate = "La fecha no puede ser futura."; isValid = false; }

        // Validar detalles SOLO si la tabla está visible
        if (showDetailsTable) {
            if (!form.details || form.details.length === 0) {
                errors.details = "Debe agregar al menos un insumo a la compra.";
                isValid = false;
            } else {
                let detailErrorsExist = false;
                form.details.forEach((detail, index) => {
                    let rowErrors = {};
                    // *** VALIDACIÓN DE INSUMO ***
                    // 'idSupplier' es el campo del state 'form.details'. Asegúrate que sea correcto.
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
    }, [form.idProvider, form.purchaseDate, form.details, showDetailsTable]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
        if ((name === 'idProvider' || name === 'purchaseDate') && formErrors.details) {
            setFormErrors(prev => ({ ...prev, details: null }));
        }
    }, [formErrors]);

    // --- Detail Row Handlers ---
    const handleAddDetailRow = useCallback(() => {
        if (!showDetailsTable) {
            setShowDetailsTable(true);
        }
        setForm(prev => ({
            ...prev,
             // Añade una fila vacía. 'idSupplier' aquí se refiere al ID del *insumo* seleccionado en esa fila.
            details: [...prev.details, { key: Date.now(), idSupplier: '', quantity: '', unitPrice: '', subtotal: 0 }]
        }));
        if (formErrors.details) {
            setFormErrors(prev => ({ ...prev, details: null }));
        }
    }, [showDetailsTable, formErrors.details]);

    const handleRemoveDetailRow = useCallback((keyToRemove) => {
        setForm(prev => {
            const newDetails = prev.details.filter(detail => detail.key !== keyToRemove);
            if (newDetails.length === 0 && showDetailsTable) {
                setShowDetailsTable(false);
            }
            setFormErrors(currentErrors => ({...currentErrors, detailRows: {}})); // Limpiar errores de fila
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

        // Limpiar error específico
        setFormErrors(prev => {
            const newDetailRows = { ...prev.detailRows };
            if (newDetailRows[index] && newDetailRows[index][field]) {
                delete newDetailRows[index][field];
                if (Object.keys(newDetailRows[index]).length === 0) {
                    delete newDetailRows[index];
                }
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

        // Dentro de handleFormSubmit, antes de purchaseDetailsForApi
console.log("Estado form.details ANTES de mapear:", JSON.stringify(form.details, null, 2));
form.details.forEach((d, i) => {
    console.log(`Detalle[${i}] - idSupplier: ${d.idSupplier} (tipo: ${typeof d.idSupplier}), quantity: ${d.quantity} (tipo: ${typeof d.quantity}), unitPrice: ${d.unitPrice} (tipo: ${typeof d.unitPrice})`);
});

const purchaseDetailsForApi = form.details.map(({ key, subtotal, ...detail }) => ({
    idInsumo: Number(detail.idSupplier),
    quantity: Number(detail.quantity),
    unitPrice: Number(detail.unitPrice)
}));
// ... resto del submit ...

        setIsSubmitting(true);
        const toastId = toast.loading('Registrando compra...');
         try {
            // *** PREPARAR DATOS PARA LA API DE CREAR COMPRA ***
            // Verifica qué campos espera tu API (registroCompraService.createRegisterPurchase)
            const purchaseDetailsForApi = form.details.map(({ key, subtotal, ...detail }) => ({
                // *** Prueba con parseInt ***
                idInsumo: parseInt(detail.idSupplier, 10) || 0, // Parsea como entero base 10, default a 0 si falla
                quantity: Number(detail.quantity) || 0,        // Number está bien para cantidad/precio
                unitPrice: Number(detail.unitPrice) || 0
            }));

             const purchaseData = {
                idProvider: form.idProvider, // ID del proveedor seleccionado
                purchaseDate: form.purchaseDate,
                totalAmount:Number(calculatedTotal) || 0,
                details: purchaseDetailsForApi, // Array de detalles con idInsumo, quantity, unitPrice
                // totalAmount: calculatedTotal // ¿Necesita el backend el total?
            };

             console.log("[SUBMIT] Sending purchase data:", purchaseData);
            // Llama al servicio de *creación* de compras
            await purchaseService.createRegisterPurchase(purchaseData); // <= ¡Asegúrate que esta función exista!

             toast.success('Compra registrada exitosamente!', { id: toastId, icon: <IconSuccess /> });
            navigate('/gestion-compras'); // Navegar a la página de gestión (o la ruta correcta)

        } catch (error) {
            console.error('[SUBMIT CREATE PURCHASE ERROR]', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error desconocido al guardar la compra.';
            toast.error(`Error al registrar: ${errorMsg}`, { id: toastId, duration: 6000, icon: <IconError /> });
        } finally {
            setIsSubmitting(false);
        }
    }, [form, validateForm, navigate, showDetailsTable, clearFormErrors, insumos.length, calculatedTotal]);


    // --- Calcular total ---
    

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            {/* Header */}
            <Row className="mb-3 align-items-center">
                 <Col xs="auto"><Button color="secondary" outline size="sm" onClick={() => navigate('/gestion-compras')} disabled={isSubmitting}><ArrowLeft size={18} /> Volver</Button></Col>
                 <Col><h2 className="mb-0 text-center">Registrar Nueva Compra</h2></Col>
                 <Col xs="auto" style={{ visibility: 'hidden' }}><Button color="secondary" outline size="sm"><ArrowLeft size={18} /> Volver</Button></Col>
            </Row>
            {/* Card Principal */}
            <Card className="shadow-sm">
            <CardBody>
                    {/* Estado de Carga Inicial */}
                    {isLoadingFormData ? (
                        <div className="text-center my-5 py-5">
                            <Spinner color="primary" style={{ width: '3rem', height: '3rem' }}/>
                            <p className="mt-3 mb-0 text-muted fs-5">Cargando datos necesarios...</p>
                        </div>
                    ) : (
                        // Formulario Principal (cuando no está cargando)
                        <Form id="registerPurchaseForm" noValidate onSubmit={handleFormSubmit}>
                            {/* --- Fila Proveedor y Fecha --- */}
                             <Row className="g-3 mb-4">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="idProvider" className="form-label fw-bold">Proveedor <span className="text-danger">*</span></Label>
                                        <Input
                                            id="idProvider" bsSize="sm" type="select" name="idProvider"
                                            value={form.idProvider} onChange={handleChange}
                                            disabled={isSubmitting || providers.length === 0}
                                            invalid={!!formErrors.idProvider} required
                                        >
                                            <option value="">Seleccione un proveedor...</option>
                                            {/* *** VERIFICA LAS PROPIEDADES DEL PROVEEDOR *** */}
                                            {/* ¿Tu API de proveedores devuelve 'idProvider' y 'company'? */}
                                            {providers.map(p => (<option key={p.idProvider} value={p.idProvider}>{p.company || p.name /* Fallback */}</option>))}
                                        </Input>
                                        <FormFeedback>{formErrors.idProvider}</FormFeedback>
                                        {providers.length === 0 && !isLoadingFormData && <small className="text-warning d-block mt-1">No hay proveedores activos disponibles.</small>}
                                    </FormGroup>
                                </Col>
                                 <Col md={6}>
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
                            </Row>
                            <hr />

                            {/* --- Sección Dinámica de Detalles (Insumos) --- */}
                            {!showDetailsTable ? (
                                // Botón para agregar el primer insumo
                                <div className="text-center my-4">
                                    <Button
                                        color="success" outline onClick={handleAddDetailRow}
                                        disabled={isSubmitting || insumos.length === 0} // Deshabilitar si no hay insumos cargados
                                    >
                                        <Plus size={16} className="me-1" /> Agregar Insumos a la Compra
                                    </Button>
                                     {insumos.length === 0 && !isLoadingFormData && <p className="text-warning mt-2 small">No hay insumos disponibles para agregar.</p>}
                                </div>
                            ) : (
                               // Tabla de Detalles (visible)
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
                                                 {/* Mapeo de las filas de detalle del formulario */}
                                                 {form.details.map((detail, index) => {
                                                    const detailErrors = formErrors.detailRows[index] || {};
                                                    return (
                                                        <tr key={detail.key}>
                                                            {/* Celda: Select de Insumo */}
                                                            <td>
                                                                <Input
                                                                    type="select"
                                                                    name="idSupplier" // Este es el nombre del campo en el state 'form.details'
                                                                    bsSize="sm" className="form-control-sm"
                                                                    value={detail.idSupplier} // El valor guardado en el state para esta fila
                                                                    onChange={(e) => handleDetailChange(index, 'idSupplier', e.target.value)}
                                                                    invalid={!!detailErrors.idSupplier}
                                                                    disabled={isSubmitting || insumos.length === 0}
                                                                >
                                                                    <option value="">Seleccione...</option>
                                                                    {/* *** ¡VERIFICA ESTAS PROPIEDADES! *** */}
                                                                    {/* Mapea el array 'insumos' cargado del servicio. */}
                                                                    {/* ¿Qué propiedades devuelve tu API de suppliers/insumos? */}
                                                                    {/* Ajusta 'i.idSupplier' y 'i.supplierName' a los nombres REALES */}
                                                                    {/* Ejemplos comunes: id, idInsumo, idSupplier, name, nombreInsumo, supplierName */}
                                                                    {insumos.map(i => (
                                                                        <option
                                                                            key={i.idSupplier || i.idSupplier || i.id} // Usa un ID único como key
                                                                            value={i.idSupplier || i.idSupplier || i.id} // Usa el mismo ID como value
                                                                        >
                                                                            {i.supplierName || i.nombreInsumo || i.name} {/* Usa el nombre para mostrar */}
                                                                        </option>
                                                                    ))}
                                                                </Input>
                                                                <FormFeedback className="d-block">{detailErrors.idSupplier}</FormFeedback>
                                                            </td>
                                                            {/* Celda: Cantidad */}
                                                            <td>
                                                                <Input type="number" name="quantity" bsSize="sm" className="form-control-sm text-end"
                                                                    value={detail.quantity} min="0.01" step="any"
                                                                    onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                                                                    invalid={!!detailErrors.quantity} disabled={isSubmitting} placeholder="0"
                                                                />
                                                                <FormFeedback className="d-block">{detailErrors.quantity}</FormFeedback>
                                                            </td>
                                                            {/* Celda: Precio Unitario */}
                                                            <td>
                                                                <Input type="number" name="unitPrice" bsSize="sm" className="form-control-sm text-end"
                                                                    value={detail.unitPrice} min="0" step="any"
                                                                    onChange={(e) => handleDetailChange(index, 'unitPrice', e.target.value)}
                                                                    invalid={!!detailErrors.unitPrice} disabled={isSubmitting} placeholder="0.00"
                                                                />
                                                                <FormFeedback className="d-block">{detailErrors.unitPrice}</FormFeedback>
                                                            </td>
                                                            {/* Celda: Subtotal (calculado) */}
                                                            <td className="text-end">
                                                                {formatCurrencyCOP(detail.subtotal)}
                                                            </td>
                                                            {/* Celda: Botón Eliminar Fila */}
                                                            <td className="text-center">
                                                                <Button color="danger" outline size="sm" className="p-1"
                                                                    onClick={() => handleRemoveDetailRow(detail.key)}
                                                                    disabled={isSubmitting} title="Eliminar fila"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                    {/* --- Botón Agregar Otra Fila y Total General --- */}
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
                 {/* Footer de la Card con Botones */}
                 <CardHeader className="bg-light d-flex justify-content-end gap-2 border-top">
                    <Button color="secondary" outline onClick={() => navigate('/gestion-compras')} disabled={isSubmitting}>
                        <IconError size={18} className="me-1" /> Cancelar
                    </Button>
                    <Button color="primary" type="submit" form="registerPurchaseForm"
                        disabled={isLoadingFormData || isSubmitting || (!showDetailsTable && insumos.length > 0 && !isLoadingFormData) } // Evitar guardar si no hay detalles y ya cargaron insumos
                    >
                        {isSubmitting ? <><Spinner size="sm"/> Guardando...</> : <><Save size={18} className="me-1"/> Guardar Compra</>}
                    </Button>
                 </CardHeader>
            </Card>
        </Container>
    );
};

export default RegistrarCompraPage;