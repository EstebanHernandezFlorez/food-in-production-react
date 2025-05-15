import React, { useState, useEffect, useCallback } from "react"; // Eliminado useRef si no se usa
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Button, Container, Row, Col, Form, FormGroup, Input, Label,
    FormFeedback, Spinner, Alert // Eliminado ListGroup, ListGroupItem si no se usan
} from "reactstrap";
import { Plus, Trash2, Save, X } from 'lucide-react'; // Eliminado AlertTriangle si no se usa directamente aquí
import toast, { Toaster } from "react-hot-toast";
import productoInsumoService from "../../services/productoInsumoService";
import fichaTecnicaService from "../../services/fichaTecnicaService";
import "../../../assets/css/App.css";

// --- Constantes ---
const API_BASE_URL = 'http://localhost:3000';

const INITIAL_ORDER_FORM_STATE = {
    idProduct: '',
    startDate: new Date().toISOString().slice(0, 10),
    status: true,
    measurementUnit: '',
    quantity: '',
};
const INITIAL_INGREDIENTE_STATE = { nombre: '', cantidad: '', unidadMedida: '' };
const INITIAL_PROCESO_STATE = { numero: 1, nombre: '', descripcion: '' };
const INITIAL_FORM_ERRORS = {};

const measurementUnits = [
    { value: 'kg', label: 'Kilogramos' }, { value: 'g', label: 'Gramos' }, { value: 'mg', label: 'Miligramos' },
    { value: 'lb', label: 'Libras' }, { value: 'oz', label: 'Onzas' }, { value: 'L', label: 'Litros' },
    { value: 'mL', label: 'Mililitros' }, { value: 'gal', label: 'Galones' }, { value: 'm', label: 'Metros' },
    { value: 'cm', label: 'Centímetros' }, { value: 'mm', label: 'Milímetros' }, { value: 'unidad', label: 'Unidad(es)' },
    { value: 'docena', label: 'Docena(s)' },
];

// --- Componente ---
const FichaTecnica = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [insumosList, setInsumosList] = useState([]);
    const [form, setForm] = useState(INITIAL_ORDER_FORM_STATE);
    const [ingredientes, setIngredientes] = useState([INITIAL_INGREDIENTE_STATE]);
    const [procesos, setProcesos] = useState([INITIAL_PROCESO_STATE]);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [productosData, insumosData] = await Promise.all([
                    productoInsumoService.getAllProducts(),
                    axios.get(`${API_BASE_URL}/supplier`) // Asumiendo que /supplier devuelve los insumos
                ]);
                if (isMounted) {
                    const filterActive = (data) => (Array.isArray(data) ? data : (data?.data || [])).filter(p => p.status === true);
                    setProductos(filterActive(productosData));
                    // Asegurarse que insumosData.data es el array correcto, y que tiene 'supplierName' y 'idSupplier'
                    setInsumosList(filterActive(insumosData.data));
                }
            } catch (error) {
                if (isMounted) toast.error(`Error al cargar datos: ${error.message}`);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    }, [formErrors]);

    const handleIngredienteChange = useCallback((index, field, value) => {
        setIngredientes(prev => {
            const newIngredientes = [...prev];
            newIngredientes[index] = { ...newIngredientes[index], [field]: value };
            if (formErrors[`ingrediente_${index}_${field}`]) {
                 setFormErrors(prevErr => ({ ...prevErr, [`ingrediente_${index}_${field}`]: null }));
            }
            if (formErrors.ingredientes) {
                 setFormErrors(prevErr => ({ ...prevErr, ingredientes: null }));
            }
             if (field === 'nombre' && formErrors[`ingrediente_${index}_nombre_existe`]) {
                setFormErrors(prevErr => ({ ...prevErr, [`ingrediente_${index}_nombre_existe`]: null }));
            }
            return newIngredientes;
        });
    }, [formErrors]);

    const handleProcesoChange = useCallback((index, field, value) => {
        setProcesos(prev => {
            const newProcesos = [...prev];
            newProcesos[index] = { ...newProcesos[index], [field]: value };
             if (formErrors[`proceso_${index}_${field}`]) {
                 setFormErrors(prevErr => ({ ...prevErr, [`proceso_${index}_${field}`]: null }));
            }
             if (formErrors.procesos) { setFormErrors(prevErr => ({ ...prevErr, procesos: null })); }
            return newProcesos;
        });
    }, [formErrors]);

    const addIngrediente = useCallback(() => {
        setIngredientes(prev => [...prev, { ...INITIAL_INGREDIENTE_STATE }]);
    }, []);

    const removeIngrediente = useCallback((index) => {
        setIngredientes(prev => prev.filter((_, i) => i !== index));
    }, []);

    const addProceso = useCallback(() => {
        setProcesos(prev => [...prev, { ...INITIAL_PROCESO_STATE, numero: prev.length + 1 }]);
    }, []);

    const removeProceso = useCallback((index) => {
        setProcesos(prev => {
            const newProcesos = prev.filter((_, i) => i !== index);
            return newProcesos.map((proc, i) => ({ ...proc, numero: i + 1 }));
        });
    }, []);

    const validateForm = useCallback(() => {
        const errors = {};
        let isValidOverall = true;

        if (!form.idProduct) errors.idProduct = "Seleccione producto.";
        if (!form.startDate) errors.startDate = "Seleccione fecha.";
        if (!form.measurementUnit) errors.measurementUnit = "Seleccione unidad.";
        if (!form.quantity || isNaN(parseFloat(form.quantity)) || parseFloat(form.quantity) <= 0) errors.quantity = "Cantidad > 0.";

        if (ingredientes.length === 0) {
            errors.ingredientes = "Agregue al menos un ingrediente.";
            isValidOverall = false;
        } else {
            ingredientes.forEach((insumo, index) => {
                const nombreTrimmed = insumo.nombre.trim();
                if (!nombreTrimmed) {
                    errors[`ingrediente_${index}_nombre`] = "Requerido.";
                    isValidOverall = false;
                } else {
                    const existe = insumosList.some(item =>
                        (item.supplierName || '').toLowerCase() === nombreTrimmed.toLowerCase()
                    );
                    if (!existe) {
                        errors[`ingrediente_${index}_nombre_existe`] = `"${nombreTrimmed}" no es un insumo válido/existente.`;
                        isValidOverall = false;
                    }
                }
                if (!insumo.cantidad || isNaN(parseFloat(insumo.cantidad)) || parseFloat(insumo.cantidad) <= 0) {
                    errors[`ingrediente_${index}_cantidad`] = "Cantidad > 0.";
                    isValidOverall = false;
                }
                if (!insumo.unidadMedida) {
                    errors[`ingrediente_${index}_unidadMedida`] = "Seleccione unidad.";
                    isValidOverall = false;
                }
            });
        }

        if (procesos.length === 0) {
            errors.procesos = "Agregue al menos un proceso.";
            isValidOverall = false;
        } else {
            procesos.forEach((proceso, index) => {
                if (!proceso.nombre.trim()) {
                    errors[`proceso_${index}_nombre`] = "Requerido.";
                    isValidOverall = false;
                }
                if (!proceso.descripcion.trim()) {
                    errors[`proceso_${index}_descripcion`] = "Requerida.";
                    isValidOverall = false;
                }
            });
        }

        setFormErrors(errors);
        const finalValidation = Object.keys(errors).length === 0 && isValidOverall;
        if (!finalValidation) toast.error("Revise los campos marcados o insumos inválidos.");
        return finalValidation;
    }, [form, ingredientes, procesos, insumosList]);

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        const toastId = toast.loading("Guardando ficha técnica...");

        const fichaData = {
            idProduct: parseInt(form.idProduct, 10),
            startDate: form.startDate,
            status: form.status, // Asumiendo que `form.status` viene de INITIAL_ORDER_FORM_STATE
            measurementUnit: form.measurementUnit,
            quantity: parseFloat(form.quantity),
            ingredients: ingredientes.map(ing => {
                const insumoEncontrado = insumosList.find(item =>
                    (item.supplierName || '').toLowerCase() === ing.nombre.trim().toLowerCase()
                );
                return {
                    idSupplier: insumoEncontrado ? insumoEncontrado.idSupplier : null,
                    quantity: parseFloat(ing.cantidad),
                    measurementUnit: ing.unidadMedida
                };
            }).filter(ing => ing.idSupply), // Importante: solo enviar ingredientes con ID válido
            processes: procesos.map(proc => ({
                processOrder: proc.numero,
                processName: proc.nombre.trim(),
                processDescription: proc.descripcion.trim()
            }))
        };

        // Opcional: remover arrays vacíos si el backend no los maneja bien
        // if (fichaData.ingredients?.length === 0) delete fichaData.ingredients;
        // if (fichaData.processes?.length === 0) delete fichaData.processes;

        try {
            console.log("Enviando Ficha:", fichaData);
            await fichaTecnicaService.createSpecSheet(fichaData);
            toast.success("Ficha técnica creada exitosamente!", { id: toastId });

           

            navigate('/home/produccion/producto_insumo', {
            
            });
            // --- FIN DE NAVEGACIÓN CON ESTADO ---

        }  catch (error) {
            console.error("Error detallado al guardar:", error); // <--- ESTA LÍNEA
            const errorMessage = error.response?.data?.message || error.message || "Error al guardar la ficha.";
            toast.error(`Error: ${errorMessage}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Container fluid className="p-4">
            <Toaster position="top-center" />
            <Row className="mb-4 align-items-center">
                <Col><h2 className="mb-0">Ficha Técnica</h2></Col>
            </Row>

            {isLoading && <div className="text-center p-5"><Spinner/> Cargando datos iniciales...</div>}

            {!isLoading && (
                <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <section className="mb-4 p-3 border rounded shadow-sm">
                         <h4 className="mb-3 border-bottom pb-2">Datos Generales</h4>
                        <Row className="g-3">
                             <Col md={6} lg={4}>
                                <FormGroup>
                                    <Label for="idProduct" className="fw-bold">Producto/Insumo <span className="text-danger">*</span></Label>
                                    <Input id="idProduct" type="select" name="idProduct" bsSize="sm" value={form.idProduct} onChange={handleChange} invalid={!!formErrors.idProduct} disabled={isSaving}>
                                        <option value="">Seleccione...</option>
                                        {productos.map((p) => (<option key={p.idProduct || p.id} value={p.idProduct || p.id}>{p.productName || p.name}</option>))}
                                    </Input>
                                    <FormFeedback>{formErrors.idProduct}</FormFeedback>
                                </FormGroup>
                            </Col>
                             <Col md={6} lg={3}>
                                <FormGroup>
                                    <Label for="startDate" className="fw-bold">Fecha Creación <span className="text-danger">*</span></Label>
                                    <Input id="startDate" type="date" name="startDate" bsSize="sm" value={form.startDate} onChange={handleChange} invalid={!!formErrors.startDate} disabled={isSaving}/>
                                    <FormFeedback>{formErrors.startDate}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6} lg={2}>
                                <FormGroup>
                                    <Label for="quantity" className="fw-bold">Peso base<span className="text-danger">*</span></Label>
                                    <Input id="quantity" type="number" name="quantity" bsSize="sm" min="0.01" step="any" value={form.quantity} onChange={handleChange} invalid={!!formErrors.quantity} disabled={isSaving} placeholder="Ej: 1.5"/>
                                    <FormFeedback>{formErrors.quantity}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6} lg={3}>
                                <FormGroup>
                                    <Label for="measurementUnit" className="fw-bold">Unidad Base <span className="text-danger">*</span></Label>
                                    <Input id="measurementUnit" type="select" name="measurementUnit" bsSize="sm" value={form.measurementUnit} onChange={handleChange} invalid={!!formErrors.measurementUnit} disabled={isSaving}>
                                        <option value="">Seleccione...</option>
                                        {measurementUnits.map((unit) => (<option key={unit.value} value={unit.value}>{unit.label}</option>))}
                                    </Input>
                                    <FormFeedback>{formErrors.measurementUnit}</FormFeedback>
                                </FormGroup>
                            </Col>
                        </Row>
                    </section>

                    <section className="mb-4 p-3 border rounded shadow-sm">
                         <Row className="align-items-center mb-2">
                            <Col><h4 className="mb-0 border-bottom pb-2">Ingredientes</h4></Col>
                            <Col className="text-end">
                                <Button color="success" outline size="sm" onClick={addIngrediente} disabled={isSaving}><Plus size={16} className="me-1" /> Agregar Ingrediente</Button>
                            </Col>
                        </Row>
                         {formErrors.ingredientes && <Alert color="danger" className="py-2 px-3"><small>{formErrors.ingredientes}</small></Alert>}
                        {ingredientes.map((insumo, index) => (
                            <Row key={index} className="g-2 mb-2 align-items-start">
                                <Col sm={5}>
                                    <FormGroup className="mb-0">
                                        {index === 0 && <Label className="small fw-bold">Nombre Insumo <span className="text-danger">*</span></Label>}
                                        <Input
                                            type="text" bsSize="sm"
                                            placeholder="Ingrese nombre de insumo existente"
                                            name="nombre"
                                            value={insumo.nombre}
                                            onChange={(e) => handleIngredienteChange(index, 'nombre', e.target.value)}
                                            invalid={!!formErrors[`ingrediente_${index}_nombre`] || !!formErrors[`ingrediente_${index}_nombre_existe`]}
                                            disabled={isSaving}
                                        />
                                        <FormFeedback>
                                            {formErrors[`ingrediente_${index}_nombre`] || formErrors[`ingrediente_${index}_nombre_existe`]}
                                        </FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col sm={3}>
                                    <FormGroup className="mb-0">
                                        {index === 0 && <Label className="small fw-bold">Cantidad <span className="text-danger">*</span></Label>}
                                        <Input type="number" bsSize="sm" min="0.01" step="any" name="cantidad" value={insumo.cantidad} onChange={(e) => handleIngredienteChange(index, 'cantidad', e.target.value)} invalid={!!formErrors[`ingrediente_${index}_cantidad`]} disabled={isSaving} placeholder="Ej: 0.5"/>
                                        <FormFeedback>{formErrors[`ingrediente_${index}_cantidad`]}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col sm={3}>
                                    <FormGroup className="mb-0">
                                        {index === 0 && <Label className="small fw-bold">Unidad <span className="text-danger">*</span></Label>}
                                        <Input type="select" bsSize="sm" name="unidadMedida" value={insumo.unidadMedida} onChange={(e) => handleIngredienteChange(index, 'unidadMedida', e.target.value)} invalid={!!formErrors[`ingrediente_${index}_unidadMedida`]} disabled={isSaving}>
                                            <option value="">Seleccione...</option>
                                            {measurementUnits.map(unit => (<option key={unit.value} value={unit.value}>{unit.label}</option>))}
                                        </Input>
                                        <FormFeedback>{formErrors[`ingrediente_${index}_unidadMedida`]}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col sm={1} className="text-center align-self-center pt-3">
                                    <Button color="danger" outline size="sm" onClick={() => removeIngrediente(index)} disabled={isSaving || ingredientes.length <= 1} title="Eliminar Ingrediente"><Trash2 size={16} /></Button>
                                </Col>
                            </Row>
                        ))}
                    </section>

                    <section className="mb-4 p-3 border rounded shadow-sm">
                         <Row className="align-items-center mb-2">
                            <Col><h4 className="mb-0 border-bottom pb-2">Procesos</h4></Col>
                            <Col className="text-end">
                                <Button color="success" outline size="sm" onClick={addProceso} disabled={isSaving}><Plus size={16} className="me-1" /> Agregar Proceso</Button>
                            </Col>
                        </Row>
                         {formErrors.procesos && <Alert color="danger" className="py-2 px-3"><small>{formErrors.procesos}</small></Alert>}
                        {procesos.map((proceso, index) => (
                            <Row key={index} className="g-2 mb-2 align-items-start">
                                <Col xs={1} className="d-flex justify-content-center align-items-center pt-2"><Label className="fw-bold">{proceso.numero}.</Label></Col>
                                <Col xs={10} sm={3}>
                                    <FormGroup className="mb-0">
                                         {index === 0 && <Label className="small fw-bold">Nombre <span className="text-danger">*</span></Label>}
                                        <Input type="text" bsSize="sm" value={proceso.nombre} onChange={(e) => handleProcesoChange(index, 'nombre', e.target.value)} invalid={!!formErrors[`proceso_${index}_nombre`]} disabled={isSaving} placeholder="Ej: Mezclado"/>
                                        <FormFeedback>{formErrors[`proceso_${index}_nombre`]}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col xs={10} sm={6}>
                                    <FormGroup className="mb-0">
                                        {index === 0 && <Label className="small fw-bold">Descripción <span className="text-danger">*</span></Label>}
                                        <Input type="textarea" bsSize="sm" rows="1" value={proceso.descripcion} onChange={(e) => handleProcesoChange(index, 'descripcion', e.target.value)} invalid={!!formErrors[`proceso_${index}_descripcion`]} disabled={isSaving} placeholder="Describa el paso..." style={{ minHeight: '31px', resize: 'vertical' }}/>
                                        <FormFeedback>{formErrors[`proceso_${index}_descripcion`]}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col xs={2} sm={1} className="text-center align-self-center pt-3">
                                    <Button color="danger" outline size="sm" onClick={() => removeProceso(index)} disabled={isSaving || procesos.length <= 1} title="Eliminar Proceso"> <Trash2 size={16} /> </Button>
                                </Col>
                            </Row>
                        ))}
                    </section>

                    <div className="d-flex justify-content-end mt-4">
                        <Button color="secondary" outline onClick={() => navigate("/home/produccion/producto_insumo")} disabled={isSaving}>Cancelar</Button>
                        <Button color="success" type="submit" disabled={isSaving || isLoading} className="ms-2">{isSaving ? <Spinner size="sm" className="me-1"/> : <Save size={18} className="me-1" />} Guardar Ficha</Button>
                    </div>
                </Form>
            )}
        </Container>
    );
};

export default FichaTecnica;