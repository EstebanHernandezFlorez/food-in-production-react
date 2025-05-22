import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
    Button, Container, Row, Col, Form, FormGroup, Input, Label,
    FormFeedback, Spinner, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import { Plus, Trash2, Save, X, AlertTriangle, Edit, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from "react-hot-toast";
import productoInsumoService from "../../services/productoInsumoService";
import fichaTecnicaService from "../../services/fichaTecnicaService";
import "../../../assets/css/App.css";

// --- Constantes ---
const API_BASE_URL = 'http://localhost:3000';

const INITIAL_FICHA_FORM_STATE = {
    idProduct: '',
    startDate: new Date().toISOString().slice(0, 10),
    measurementUnit: '',
    quantity: '',
};

const INITIAL_INGREDIENTE_FORM_STATE = {
    idSupplier: '',
    supplierNameDisplay: '',
    quantity: '',
    measurementUnit: '',
};

const INITIAL_PROCESO_FORM_STATE = {
    processOrder: 1,
    processName: '',
    processDescription: '',
};
const INITIAL_FORM_ERRORS = { general: "" };
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null }; // Agregado itemDetails para consistencia

const measurementUnits = [
    { value: 'kg', label: 'Kilogramos' }, { value: 'g', label: 'Gramos' }, { value: 'mg', label: 'Miligramos' },
    { value: 'lb', label: 'Libras' }, { value: 'oz', label: 'Onzas' }, { value: 'L', label: 'Litros' },
    { value: 'mL', label: 'Mililitros' }, { value: 'gal', label: 'Galones' }, { value: 'm', label: 'Metros' },
    { value: 'cm', label: 'Centímetros' }, { value: 'mm', label: 'Milímetros' }, { value: 'unidad', label: 'Unidad(es)' },
    { value: 'docena', label: 'Docena(s)' },
];

// --- Confirmation Modal Component (Definición completa) ---
const ConfirmationModal = ({
    isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar",
    confirmColor = "primary", isConfirming = false,
  }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
      <ModalHeader toggle={!isConfirming ? toggle : undefined}>
        <div className="d-flex align-items-center">
          <AlertTriangle size={24} className={`text-${confirmColor === "danger" ? "danger" : confirmColor === "warning" ? "warning" : "primary"} me-2`}/>
          <span className="fw-bold">{title}</span>
        </div>
      </ModalHeader>
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
        <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? (<><Spinner size="sm" className="me-1" /> Procesando...</>) : (confirmText)}
        </Button>
      </ModalFooter>
    </Modal>
);

const FichaTecnica = () => {
    const navigate = useNavigate();
    const { idSpecsheet } = useParams();
    const [isEditing, setIsEditing] = useState(!!idSpecsheet);

    const [productos, setProductos] = useState([]);
    const [insumosList, setInsumosList] = useState([]);
    const [form, setForm] = useState(INITIAL_FICHA_FORM_STATE);
    const [ingredientes, setIngredientes] = useState([{ ...INITIAL_INGREDIENTE_FORM_STATE }]);
    const [procesos, setProcesos] = useState([{ ...INITIAL_PROCESO_FORM_STATE }]);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isLoadingFichaData, setIsLoadingFichaData] = useState(false);
    const [isSavingFicha, setIsSavingFicha] = useState(false);

    // CAMBIO: Añadido setConfirmModalOpen
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const confirmActionRef = useRef(null);
    const itemToRemoveRef = useRef({ type: null, index: null });

    useEffect(() => {
        let isMounted = true;
        const fetchInitialData = async () => {
            try {
                const [productosResponse, suppliersResponse] = await Promise.all([
                    productoInsumoService.getAllProducts(),
                    axios.get(`${API_BASE_URL}/supplier`)
                ]);

                if (isMounted) {
                    const extractData = (response) => Array.isArray(response) ? response : (response?.data || []);
                    
                    const activeProductos = extractData(productosResponse).filter(p => p.status === true);
                    setProductos(activeProductos.map(p => ({
                        idProduct: p.idProduct,
                        productName: p.productName
                    })));

                    const activeSuppliers = extractData(suppliersResponse).filter(s => s.status === true); // Asumiendo que suppliers también tienen 'status'
                    setInsumosList(activeSuppliers.map(s => ({
                        idSupplier: s.idSupplier,
                        supplierName: s.supplierName
                    })));
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
                if (isMounted) toast.error(`Error al cargar datos iniciales: ${error.message || 'Error desconocido'}`);
            } finally {
                if (isMounted) setIsLoadingInitialData(false);
            }
        };
        fetchInitialData();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (isEditing && idSpecsheet) {
            let isMounted = true;
            const fetchFichaData = async () => {
                setIsLoadingFichaData(true);
                setFormErrors(INITIAL_FORM_ERRORS);
                console.log("EDITAR FICHA: Intentando cargar con idSpecsheet:", idSpecsheet); // <--- AÑADE ESTO
                try {
                    const dataBackend = await fichaTecnicaService.getSpecSheetById(idSpecsheet);
                    console.log("EDITAR FICHA: Datos recibidos del backend:", dataBackend); // <--- AÑADE ESTO
                    if (isMounted && dataBackend) {
                        setForm({
                            idProduct: dataBackend.product?.idProduct?.toString() || dataBackend.idProduct?.toString() || '',
                            startDate: dataBackend.startDate ? new Date(dataBackend.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                            measurementUnit: dataBackend.measurementUnit || '',
                            quantity: dataBackend.quantity?.toString() || '',
                        });

                        setIngredientes(dataBackend.ingredients?.map(ingBackend => ({ // ingBackend es ProductSheet
                            idSupplier: ingBackend.supplier?.idSupplier || '', // o ingBackend.idSupplier si lo seleccionaste
                            supplierNameDisplay: ingBackend.supplier?.supplierName || 'Insumo Desconocido',
                            quantity: ingBackend.quantity?.toString() || '',         // De ProductSheet
                            measurementUnit: ingBackend.measurementUnit || ''      // De ProductSheet
                        })) || []);
                        

                        setProcesos(dataBackend.processes?.map((procBackend, index) => ({
                            processOrder: procBackend.processOrder || index + 1,
                            processName: procBackend.processName || '',
                            processDescription: procBackend.processDescription || ''
                        }))?.sort((a,b) => a.processOrder - b.processOrder) || [{ ...INITIAL_PROCESO_FORM_STATE }]);

                    } else if (isMounted) {
                        toast.error(`No se encontraron datos para la ficha ID: ${idSpecsheet}`);
                        navigate('/home/produccion/producto_insumo'); // Ajusta esta ruta si es necesario
                    }
                } catch (error) {
                    if (isMounted) {
                        toast.error("Error al cargar la ficha técnica para editar.");
                        console.error("Error en fetchFichaData:", error);
                        navigate('/home/produccion/producto_insumo'); // Ajusta esta ruta si es necesario
                    }
                } finally {
                    if (isMounted) setIsLoadingFichaData(false);
                }
            };
            if (insumosList.length > 0 || !isLoadingInitialData) {
                fetchFichaData();
            }
            return () => { isMounted = false; };
        } else {
            setForm(INITIAL_FICHA_FORM_STATE);
            setIngredientes([{ ...INITIAL_INGREDIENTE_FORM_STATE }]);
            setProcesos([{ ...INITIAL_PROCESO_FORM_STATE }]);
            setFormErrors(INITIAL_FORM_ERRORS);
        }
    }, [idSpecsheet, isEditing, navigate, insumosList, isLoadingInitialData]);


    const clearSpecificFormErrors = useCallback((fieldsToClear) => {
        setFormErrors(prev => {
            const newErrors = { ...prev };
            fieldsToClear.forEach(field => delete newErrors[field]);
            if (fieldsToClear.some(f => f.startsWith('ingrediente_')) && newErrors.ingredientes) delete newErrors.ingredientes;
            if (fieldsToClear.some(f => f.startsWith('proceso_')) && newErrors.procesos) delete newErrors.procesos;
            // Si no quedan errores específicos pero hay un error general que depende de ellos, limpiarlo también.
            const specificErrorsLeft = Object.keys(newErrors).some(key => key !== 'general');
            if (!specificErrorsLeft && newErrors.general === "Por favor, corrija los errores en el formulario.") {
                delete newErrors.general;
            }
            return newErrors;
        });
    }, []);


    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name] || formErrors.general) {
            clearSpecificFormErrors([name, 'general']);
        }
    }, [formErrors, clearSpecificFormErrors]);

    const handleIngredienteChange = useCallback((index, field, value) => {
        setIngredientes(prev => {
            const newIngredientes = [...prev];
            const currentIngrediente = { ...newIngredientes[index] };

            if (field === 'supplierNameDisplay') {
                currentIngrediente.supplierNameDisplay = value;
                const insumoEncontrado = insumosList.find(item =>
                    (item.supplierName || '').toLowerCase() === value.trim().toLowerCase()
                );
                currentIngrediente.idSupplier = insumoEncontrado ? insumoEncontrado.idSupplier : '';
            } else {
                currentIngrediente[field] = value;
            }
            newIngredientes[index] = currentIngrediente;
            return newIngredientes;
        });
        clearSpecificFormErrors([
            `ingrediente_${index}_${field === 'supplierNameDisplay' ? 'nombre' : field}`,
            `ingrediente_${index}_nombre_existe`,
            'ingredientes',
            'general'
        ]);
    }, [insumosList, clearSpecificFormErrors]);

    const handleProcesoChange = useCallback((index, field, value) => {
        setProcesos(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
        clearSpecificFormErrors([`proceso_${index}_${field}`, 'procesos', 'general']);
    }, [clearSpecificFormErrors]);

    const addIngrediente = useCallback(() => {
        setIngredientes(prev => [...prev, { ...INITIAL_INGREDIENTE_FORM_STATE }]);
        clearSpecificFormErrors(['ingredientes', 'general']);
    }, [clearSpecificFormErrors]);
    
    const addProceso = useCallback(() => {
        setProcesos(prev => [...prev, { ...INITIAL_PROCESO_FORM_STATE, processOrder: prev.length + 1 }]);
        clearSpecificFormErrors(['procesos', 'general']);
    }, [clearSpecificFormErrors]);


    const validateFichaForm = useCallback(() => {
        const errors = {};
        let isValid = true;

        if (!form.idProduct) { errors.idProduct = "Seleccione el producto asociado."; isValid = false; }
        if (!form.startDate) { errors.startDate = "La fecha de creación es requerida."; isValid = false; }
        if (!form.measurementUnit) { errors.measurementUnit = "Seleccione la unidad para el peso base."; isValid = false; }
        if (!form.quantity || isNaN(parseFloat(form.quantity)) || parseFloat(form.quantity) <= 0) {
            errors.quantity = "El peso base debe ser un número mayor a 0."; isValid = false;
        }

        if (ingredientes.length === 0) {
            errors.ingredientes = "Debe agregar al menos un ingrediente."; isValid = false;
        } else {
            ingredientes.forEach((ingForm, index) => {
                const nombreTrimmed = (ingForm.supplierNameDisplay || '').trim();
                if (!nombreTrimmed) { errors[`ingrediente_${index}_nombre`] = "Nombre requerido."; isValid = false; }
                else if (!ingForm.idSupplier) { errors[`ingrediente_${index}_nombre_existe`] = `"${nombreTrimmed}" no es un insumo válido.`; isValid = false; }
                if (!ingForm.quantity || isNaN(parseFloat(ingForm.quantity)) || parseFloat(ingForm.quantity) <= 0) { errors[`ingrediente_${index}_cantidad`] = "Cant. > 0."; isValid = false; }
                if (!ingForm.measurementUnit) { errors[`ingrediente_${index}_unidadMedida`] = "Unidad requerida."; isValid = false; }
            });
        }

        if (procesos.length === 0) {
            errors.procesos = "Debe agregar al menos un proceso."; isValid = false;
        } else {
            procesos.forEach((procForm, index) => {
                if (!(procForm.processName || '').trim()) { errors[`proceso_${index}_nombre`] = "Nombre requerido."; isValid = false; }
                if (!(procForm.processDescription || '').trim()) { errors[`proceso_${index}_descripcion`] = "Descripción requerida."; isValid = false; }
            });
        }
        
        if (!isValid && !errors.general) errors.general = "Por favor, corrija los errores en el formulario.";
        else if (isValid) delete errors.general;

        setFormErrors(errors);
        if (!isValid && (errors.general || Object.keys(errors).length > 0)) {
            toast.error(errors.general || "Revise los campos marcados.");
        }
        return isValid;
    }, [form, ingredientes, procesos]);

    // CAMBIO: toggleConfirmModal ahora usa setConfirmModalOpen
    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return;
        setConfirmModalOpen((prev) => !prev);
      }, [isConfirmActionLoading]);

    useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
          setConfirmModalProps(INITIAL_CONFIRM_PROPS);
          confirmActionRef.current = null;
          itemToRemoveRef.current = { type: null, index: null }; // Limpiar item a remover también
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
          if (actionFn) {
            actionFn(detailsToPass);
          } else {
            toast.error("Error interno al ejecutar la acción.");
            toggleConfirmModal();
          }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]);

    const requestRemoveItemConfirmation = (type, index, itemName) => {
        itemToRemoveRef.current = { type, index };
        const itemTypeDisplay = type === 'ingrediente' ? 'el ingrediente' : 'el proceso';
        prepareConfirmation(executeRemoveItem, {
            title: `Confirmar Eliminación de ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            message: `¿Está seguro de que desea eliminar ${itemTypeDisplay} "${itemName || (type === 'proceso' ? `Paso ${procesos[index]?.processOrder}` : 'seleccionado')}"?`,
            confirmText: "Sí, eliminar",
            confirmColor: "danger",
            itemDetails: null // No necesitamos pasar detalles específicos para esta acción de remover
        });
    };
    
    // Unificado requestRemoveIngredienteConfirmation y requestRemoveProcesoConfirmation
    const requestRemoveIngredienteConfirmation = (index) => {
        requestRemoveItemConfirmation('ingrediente', index, ingredientes[index]?.supplierNameDisplay);
    };
    const requestRemoveProcesoConfirmation = (index) => {
        requestRemoveItemConfirmation('proceso', index, procesos[index]?.processName);
    };


    const executeRemoveItem = useCallback(() => {
        const { type, index } = itemToRemoveRef.current;
        if (type === 'ingrediente' && typeof index === 'number') {
            setIngredientes(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'proceso' && typeof index === 'number') {
            setProcesos(prev => {
                const newProcesos = prev.filter((_, i) => i !== index);
                // Re-numerar processOrder
                return newProcesos.map((p, idx) => ({ ...p, processOrder: idx + 1 }));
            });
        }
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.`, { icon: <CheckCircle className="text-success" /> });
        toggleConfirmModal();
    }, [toggleConfirmModal]);


    const requestSaveConfirmation = () => {
        if (!validateFichaForm()) return;
        prepareConfirmation(executeSaveFicha, {
            title: `Confirmar ${isEditing ? 'Actualización' : 'Creación'} de Ficha`,
            message: `¿Está seguro de que desea ${isEditing ? 'actualizar' : 'guardar'} esta ficha técnica?`,
            confirmText: `Sí, ${isEditing ? 'Actualizar' : 'Guardar'}`,
            confirmColor: isEditing ? "warning" : "success",
        });
    };

    const executeSaveFicha = async () => {
        setIsConfirmActionLoading(true); // Se activa aquí
        setIsSavingFicha(true);
        const actionText = isEditing ? "actualizando" : "creando";
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ficha técnica...`);

        const fichaDataPayload = {
            idProduct: parseInt(form.idProduct, 10),
            startDate: form.startDate,
            measurementUnit: form.measurementUnit,
            quantity: parseFloat(form.quantity),
            ingredients: ingredientes.map(ingForm => ({
                idSupplier: parseInt(ingForm.idSupplier, 10), // Asegurarse que idSupplier es número si el backend lo espera así
                quantity: parseFloat(ingForm.quantity),
                measurementUnit: ingForm.measurementUnit
            })).filter(ing => ing.idSupplier),
            processes: procesos.map(procForm => ({
                processOrder: procForm.processOrder,
                processName: procForm.processName.trim(),
                processDescription: procForm.processDescription.trim()
            }))
        };

        try {
            if (isEditing) {
                await fichaTecnicaService.updateSpecSheet(idSpecsheet, fichaDataPayload);
                toast.success("Ficha técnica actualizada exitosamente!", { id: toastId, icon: <CheckCircle className="text-success" /> });
            } else {
                await fichaTecnicaService.createSpecSheet(fichaDataPayload);
                toast.success("Ficha técnica creada exitosamente!", { id: toastId, icon: <CheckCircle className="text-success" /> });
            }
            toggleConfirmModal(); // Se cierra el modal de confirmación
            setTimeout(() => {
                const basePath = '/home'; // Asumiendo que 'home' es la base para estas rutas
                // Definir la ruta de productos/insumos (donde está la tabla ProductoInsumo)
                const productoInsumoListPath = `${basePath}/gestion-inventario/producto-insumo`; // Ejemplo, ajusta a tu ruta real
                
                if (form.idProduct) {
                     navigate(`${basePath}/producto/${form.idProduct}/fichas`);
                } else {
                     navigate(productoInsumoListPath);
                }
            }, 1000);

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || `Error al ${actionText} la ficha.`;
            toast.error(`Error: ${errorMessage}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
            // No cerramos el modal de confirmación en caso de error, para que el usuario no pierda el contexto,
            // pero sí reseteamos los loaders.
        } finally {
            setIsConfirmActionLoading(false); // Se desactiva aquí
            setIsSavingFicha(false);
            // No se llama a toggleConfirmModal() aquí si se quiere mantener abierto en error.
            // Si se quiere cerrar siempre, se puede agregar, pero puede ser confuso para el usuario.
        }
    };

    const pageTitle = isEditing ? "Editar Ficha Técnica" : "Crear Nueva Ficha Técnica";
    const submitButtonText = isEditing ? "Actualizar Ficha" : "Guardar Ficha";

    if (isLoadingInitialData || (isEditing && isLoadingFichaData)) {
        return <Container fluid className="p-4 text-center"><Spinner/> Cargando datos...</Container>;
    }

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="mb-0 d-flex align-items-center">
                        {isEditing && <Edit size={28} className="me-2 text-primary"/>}
                        {!isEditing && <Plus size={28} className="me-2 text-success"/>}
                        {pageTitle}
                        {isEditing && idSpecsheet && <span className="ms-2 fs-5 text-muted">(ID: {idSpecsheet})</span>}
                    </h2>
                </Col>
            </Row>

            {formErrors.general && (
                <Alert color="danger" fade={false} className="d-flex align-items-center py-2 mb-3">
                    <AlertTriangle size={18} className="me-2" /> {formErrors.general}
                </Alert>
            )}

            <Form onSubmit={(e) => { e.preventDefault(); requestSaveConfirmation(); }}>
                <section className="mb-4 p-3 border rounded shadow-sm">
                     <h4 className="mb-3 border-bottom pb-2">Datos Generales</h4>
                    <Row className="g-3">
                         <Col md={6} lg={4}>
                            <FormGroup>
                                <Label for="idProduct" className="fw-bold">Producto Asociado <span className="text-danger">*</span></Label>
                                <Input id="idProduct" type="select" name="idProduct" bsSize="sm" value={form.idProduct} onChange={handleChange} invalid={!!formErrors.idProduct} disabled={isSavingFicha || isEditing}>
                                    <option value="">Seleccione un producto...</option>
                                    {productos.map((p) => (<option key={p.idProduct} value={p.idProduct}>{p.productName}</option>))}
                                </Input>
                                <FormFeedback>{formErrors.idProduct}</FormFeedback>
                            </FormGroup>
                        </Col>
                         <Col md={6} lg={3}>
                            <FormGroup>
                                <Label for="startDate" className="fw-bold">Fecha Creación <span className="text-danger">*</span></Label>
                                <Input id="startDate" type="date" name="startDate" bsSize="sm" value={form.startDate} onChange={handleChange} invalid={!!formErrors.startDate} disabled={isSavingFicha}/>
                                <FormFeedback>{formErrors.startDate}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={6} lg={2}>
                            <FormGroup>
                                <Label for="quantity" className="fw-bold">Peso Base <span className="text-danger">*</span></Label>
                                <Input id="quantity" type="number" name="quantity" bsSize="sm" min="0.01" step="any" value={form.quantity} onChange={handleChange} invalid={!!formErrors.quantity} disabled={isSavingFicha} placeholder="Ej: 1.5"/>
                                <FormFeedback>{formErrors.quantity}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={6} lg={3}>
                            <FormGroup>
                                <Label for="measurementUnit" className="fw-bold">Unidad (Peso Base) <span className="text-danger">*</span></Label>
                                <Input id="measurementUnit" type="select" name="measurementUnit" bsSize="sm" value={form.measurementUnit} onChange={handleChange} invalid={!!formErrors.measurementUnit} disabled={isSavingFicha}>
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
                            <Button color="success" outline size="sm" onClick={addIngrediente} disabled={isSavingFicha}><Plus size={16} className="me-1" /> Agregar Ingrediente</Button>
                        </Col>
                    </Row>
                     {formErrors.ingredientes && <Alert color="danger" className="py-1 px-2 x-small"><small>{formErrors.ingredientes}</small></Alert>}
                    {ingredientes.map((ingForm, index) => (
                        <Row key={index} className="g-2 mb-2 align-items-start">
                            <Col sm={5}>
                                <FormGroup className="mb-0">
                                    {index === 0 && <Label className="small fw-bold">Nombre Insumo (Proveedor) <span className="text-danger">*</span></Label>}
                                    <Input
                                        type="text" bsSize="sm" list={`insumos-list-${index}`}
                                        placeholder="Escriba y seleccione insumo"
                                        name="supplierNameDisplay"
                                        value={ingForm.supplierNameDisplay}
                                        onChange={(e) => handleIngredienteChange(index, 'supplierNameDisplay', e.target.value)}
                                        invalid={!!formErrors[`ingrediente_${index}_nombre`] || !!formErrors[`ingrediente_${index}_nombre_existe`]}
                                        disabled={isSavingFicha}
                                    />
                                    <datalist id={`insumos-list-${index}`}>
                                        {insumosList.map(i => <option key={i.idSupplier} value={i.supplierName} />)}
                                    </datalist>
                                    <FormFeedback>
                                        {formErrors[`ingrediente_${index}_nombre`] || formErrors[`ingrediente_${index}_nombre_existe`]}
                                    </FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup className="mb-0">
                                    {index === 0 && <Label className="small fw-bold">Cantidad <span className="text-danger">*</span></Label>}
                                    <Input type="number" bsSize="sm" min="0.01" step="any" name="quantity" value={ingForm.quantity} onChange={(e) => handleIngredienteChange(index, 'quantity', e.target.value)} invalid={!!formErrors[`ingrediente_${index}_cantidad`]} disabled={isSavingFicha} placeholder="Ej: 0.5"/>
                                    <FormFeedback>{formErrors[`ingrediente_${index}_cantidad`]}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup className="mb-0">
                                    {index === 0 && <Label className="small fw-bold">Unidad <span className="text-danger">*</span></Label>}
                                    <Input type="select" bsSize="sm" name="measurementUnit" value={ingForm.measurementUnit} onChange={(e) => handleIngredienteChange(index, 'measurementUnit', e.target.value)} invalid={!!formErrors[`ingrediente_${index}_unidadMedida`]} disabled={isSavingFicha}>
                                        <option value="">Seleccione...</option>
                                        {measurementUnits.map(unit => (<option key={unit.value} value={unit.value}>{unit.label}</option>))}
                                    </Input>
                                    <FormFeedback>{formErrors[`ingrediente_${index}_unidadMedida`]}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col sm={1} className="text-center align-self-center pt-sm-3 pt-2">
                                <Button color="danger" outline size="sm" onClick={() => requestRemoveIngredienteConfirmation(index)} disabled={isSavingFicha || ingredientes.length <= 1} title="Eliminar Ingrediente"><Trash2 size={16} /></Button>
                            </Col>
                        </Row>
                    ))}
                </section>

                <section className="mb-4 p-3 border rounded shadow-sm">
                     <Row className="align-items-center mb-2">
                        <Col><h4 className="mb-0 border-bottom pb-2">Procesos</h4></Col>
                        <Col className="text-end">
                            <Button color="success" outline size="sm" onClick={addProceso} disabled={isSavingFicha}><Plus size={16} className="me-1" /> Agregar Proceso</Button>
                        </Col>
                    </Row>
                     {formErrors.procesos && <Alert color="danger" className="py-1 px-2 x-small"><small>{formErrors.procesos}</small></Alert>}
                    {procesos.map((procForm, index) => (
                        <Row key={index} className="g-2 mb-2 align-items-start">
                            <Col xs={1} className="d-flex justify-content-center align-items-center pt-sm-2 pt-1"><Label className="fw-bold">{procForm.processOrder}.</Label></Col>
                            <Col xs={10} sm={3}>
                                <FormGroup className="mb-0">
                                     {index === 0 && <Label className="small fw-bold">Nombre <span className="text-danger">*</span></Label>}
                                    <Input type="text" bsSize="sm" name="processName" value={procForm.processName} onChange={(e) => handleProcesoChange(index, 'processName', e.target.value)} invalid={!!formErrors[`proceso_${index}_nombre`]} disabled={isSavingFicha} placeholder="Ej: Mezclado"/>
                                    <FormFeedback>{formErrors[`proceso_${index}_nombre`]}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col xs={10} sm={6}>
                                <FormGroup className="mb-0">
                                    {index === 0 && <Label className="small fw-bold">Descripción <span className="text-danger">*</span></Label>}
                                    <Input type="textarea" bsSize="sm" rows="1" name="processDescription" value={procForm.processDescription} onChange={(e) => handleProcesoChange(index, 'processDescription', e.target.value)} invalid={!!formErrors[`proceso_${index}_descripcion`]} disabled={isSavingFicha} placeholder="Describa el paso..." style={{ minHeight: '31px', resize: 'vertical' }}/>
                                    <FormFeedback>{formErrors[`proceso_${index}_descripcion`]}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col xs={2} sm={1} className="text-center align-self-center pt-sm-3 pt-2">
                                <Button color="danger" outline size="sm" onClick={() => requestRemoveProcesoConfirmation(index)} disabled={isSavingFicha || procesos.length <= 1} title="Eliminar Proceso"> <Trash2 size={16} /> </Button>
                            </Col>
                        </Row>
                    ))}
                </section>

                <div className="d-flex justify-content-end mt-4">
                    <Button 
                        color="secondary" 
                        outline 
                        onClick={() => {
                            const basePath = '/home';
                            const productoInsumoListPath = `${basePath}/produccion/producto_insumo`; // Ajusta
                            navigate(
                                isEditing && form.idProduct 
                                    ? `${basePath}/producto/${form.idProduct}/fichas`
                                    : productoInsumoListPath
                            )
                        }} 
                        disabled={isSavingFicha}>
                        <X size={18} className="me-1"/> Cancelar
                    </Button>
                    
                    <Button color={isEditing ? "warning" : "success"} type="submit" disabled={isSavingFicha || isLoadingInitialData || (isEditing && isLoadingFichaData)} className="ms-2">
                        {isSavingFicha ? <Spinner size="sm" className="me-1"/> : (isEditing ? <Edit size={18} className="me-1"/> : <Save size={18} className="me-1" />)}
                        {submitButtonText}
                    </Button>
                </div>
            </Form>

            <ConfirmationModal
                isOpen={confirmModalOpen}
                toggle={toggleConfirmModal}
                title={confirmModalProps.title}
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()}
                confirmText={confirmModalProps.confirmText}
                confirmColor={confirmModalProps.confirmColor}
                isConfirming={isConfirmActionLoading}
            >
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default FichaTecnica;