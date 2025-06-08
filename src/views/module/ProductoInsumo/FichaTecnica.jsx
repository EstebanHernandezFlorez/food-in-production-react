// src/components/tu/ruta/FichaTecnica.js

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Select from 'react-select';
import {
    Button, Container, Row, Col, Form, FormGroup, Input, Label,
    FormFeedback, Spinner, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import { Plus, Trash2, Save, X, AlertTriangle, Edit } from 'lucide-react';
import toast, { Toaster } from "react-hot-toast";

// --- Servicios ---
import productService from "../../services/productService";
import fichaTecnicaService from "../../services/specSheetService";
import registerPurchaseService from "../../services/registroCompraService";

// --- Estilos ---
import "../../../assets/css/App.css";
import "../../../assets/css/produccion/FichaTecnicaStyles.css";

// --- Constantes y Helpers (sin cambios) ---
const getInitialFichaFormState = () => ({
    idProduct: '', dateEffective: new Date().toISOString().slice(0, 10), endDate: '',
    quantityBase: '', unitOfMeasure: '', status: true,
});
const getInitialIngredienteFormState = () => ({
    key: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    selectedPurchaseDetailOption: null,
    idPurchaseDetail: '',
    idSupply: '',
    quantity: '',
    unitOfMeasure: '',
});
const getInitialProcesoFormState = () => ({
    key: `proc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    processOrder: 1, processNameOverride: '', processDescriptionOverride: '',
});
const getInitialFormErrors = () => ({
    idProduct: '', dateEffective: '', endDate: '', quantityBase: '',
    unitOfMeasure: '', ingredientes: '', procesos: '', general: ""
});
const unitOfMeasures = [
    { value: 'kg', label: 'Kilogramos (kg)' }, { value: 'g', label: 'Gramos (g)' },
    { value: 'mg', label: 'Miligramos (mg)' }, { value: 'lb', label: 'Libras (lb)' },
    { value: 'oz', label: 'Onzas (oz)' }, { value: 'L', label: 'Litros (L)' },
    { value: 'mL', label: 'Mililitros (mL)' }, { value: 'gal', label: 'Galones (gal)' },
    { value: 'm', label: 'Metros (m)' }, { value: 'cm', label: 'Centímetros (cm)' },
    { value: 'mm', label: 'Milímetros (mm)' }, { value: 'unidad', label: 'Unidad(es)' },
    { value: 'docena', label: 'Docena(s)' },
];

const ConfirmationModalComponent = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
            <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === "danger" ? "danger" : "primary"} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? <Spinner size="sm" /> : confirmText}
            </Button>
        </ModalFooter>
    </Modal>
);

const FichaTecnica = () => {
    const navigate = useNavigate();
    const { idSpecsheet: idSpecsheetFromUrl } = useParams();
    const location = useLocation();

    const [isEditing, setIsEditing] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [purchaseDetailOptions, setPurchaseDetailOptions] = useState([]);

    const [formFicha, setFormFicha] = useState(getInitialFichaFormState());
    const [formIngredientes, setFormIngredientes] = useState([getInitialIngredienteFormState()]);
    const [formProcesos, setFormProcesos] = useState([getInitialProcesoFormState()]);
    const [formErrors, setFormErrors] = useState(getInitialFormErrors());

    const [isLoadingPageData, setIsLoadingPageData] = useState(true);
    const [isLoadingFichaData, setIsLoadingFichaData] = useState(false);
    const [isDataInitialized, setIsDataInitialized] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({});
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const confirmActionRef = useRef(null);
    const itemToRemoveRef = useRef({ type: null, keyToRemove: null });
    const [originalIdProductOnLoad, setOriginalIdProductOnLoad] = useState(null);

    const idProductoFromUrl = new URLSearchParams(location.search).get('idProducto');

    useEffect(() => {
        const editingMode = !!idSpecsheetFromUrl;
        setIsEditing(editingMode);
        setIsDataInitialized(false);
        if (!editingMode) {
            const initialState = getInitialFichaFormState();
            if (idProductoFromUrl) {
                initialState.idProduct = idProductoFromUrl;
            }
            setFormFicha(initialState);
            setFormIngredientes([getInitialIngredienteFormState()]);
            setFormProcesos([getInitialProcesoFormState()]);
            setFormErrors(getInitialFormErrors());
            setOriginalIdProductOnLoad(null);
            setIsDataInitialized(true);
        }
    }, [idSpecsheetFromUrl, idProductoFromUrl]);

    // <--- *** USE EFFECT DE CARGA DE DATOS *** --->
    useEffect(() => {
        let isMounted = true;
        setIsLoadingPageData(true);

        const fetchOptionsData = async () => {
            try {
                const [productosRes, purchasesRes] = await Promise.all([
                    productService.getAllProducts({ status: true }),
                    registerPurchaseService.getAllRegisterPurchasesWithDetails()
                ]);
                
                if (!isMounted) return;
                
                const mappedProducts = (productosRes || []).map(p => ({ value: p.idProduct, label: p.productName, unitOfMeasure: p.unitOfMeasure }));
                setProductOptions(mappedProducts);
                
                if (!isEditing && idProductoFromUrl) {
                    const selectedProd = mappedProducts.find(p => p.value.toString() === idProductoFromUrl);
                    if (selectedProd) {
                        setFormFicha(prev => ({ ...prev, unitOfMeasure: selectedProd.unitOfMeasure || '' }));
                    }
                }

                const purchaseOptions = [];
                const purchasesArray = Array.isArray(purchasesRes) ? purchasesRes : [];
                
                purchasesArray.forEach((purchase) => {
                    const detailsArray = Array.isArray(purchase.details) ? purchase.details : [];
                    if (detailsArray.length === 0) return;

                    const providerName = purchase.provider?.company || 'No especificado';

                    detailsArray.forEach((detail) => {
                        if (detail && detail.supply && detail.idPurchaseDetail) {
                            purchaseOptions.push({
                                value: detail.idPurchaseDetail,
                                label: `${detail.supply.supplyName} (Proveedor: ${providerName})`,
                                idSupply: detail.idSupply,
                                unitOfMeasure: detail.supply.unitOfMeasure
                            });
                        }
                    });
                });

                setPurchaseDetailOptions(purchaseOptions);

            } catch (error) {
                console.error("[FichaTecnica] ERROR en fetchOptionsData:", error);
                if (isMounted) toast.error("Error cargando datos para la ficha.");
            } finally {
                if (isMounted) setIsLoadingPageData(false);
            }
        };

        fetchOptionsData();

        return () => { isMounted = false; };
    }, [isEditing, idProductoFromUrl]);


    // <--- *** USE EFFECT DE EDICIÓN MEJORADO *** --->
    useEffect(() => {
        let isMounted = true;
        if (isEditing && idSpecsheetFromUrl && !isLoadingPageData && !isDataInitialized) {
            setIsLoadingFichaData(true);
            const fetchFichaData = async () => {
                try {
                    const fichaFromApi = await fichaTecnicaService.getSpecSheetById(idSpecsheetFromUrl);
                    if (isMounted && fichaFromApi) {
                        setOriginalIdProductOnLoad(fichaFromApi.idProduct?.toString() || null);
                        setFormFicha({
                            idProduct: fichaFromApi.idProduct?.toString() || '',
                            dateEffective: (fichaFromApi.dateEffective || fichaFromApi.startDate) ? new Date(fichaFromApi.dateEffective || fichaFromApi.startDate).toISOString().slice(0, 10) : '',
                            endDate: (fichaFromApi.endDate) ? new Date(fichaFromApi.endDate).toISOString().slice(0, 10) : '',
                            quantityBase: (fichaFromApi.quantityBase || fichaFromApi.quantity)?.toString() || '',
                            unitOfMeasure: fichaFromApi.unitOfMeasure || '',
                            status: fichaFromApi.status !== undefined ? fichaFromApi.status : true,
                        });

                        const backendSupplies = Array.isArray(fichaFromApi.specSheetSupplies) ? fichaFromApi.specSheetSupplies : [];
                        const mappedIngredientes = backendSupplies.map(ing => {
                            const purchaseOpt = purchaseDetailOptions.find(opt => opt.value === ing.idPurchaseDetail);
                            return {
                                key: ing.idSpecSheetSupply,
                                selectedPurchaseDetailOption: purchaseOpt || null,
                                idPurchaseDetail: ing.idPurchaseDetail,
                                idSupply: ing.idSupply,
                                quantity: ing.quantity?.toString() || '',
                                unitOfMeasure: ing.unitOfMeasure || purchaseOpt?.unitOfMeasure || '',
                            };
                        });
                        setFormIngredientes(mappedIngredientes.length > 0 ? mappedIngredientes : [getInitialIngredienteFormState()]);

                        const backendProcesses = Array.isArray(fichaFromApi.specSheetProcesses) ? fichaFromApi.specSheetProcesses : [];
                        const mappedProcesos = backendProcesses
                            .map((proc, index) => ({
                                key: proc.idSpecSheetProcess,
                                processOrder: proc.processOrder || (index + 1),
                                processNameOverride: proc.processNameOverride || '',
                                processDescriptionOverride: proc.processDescriptionOverride || '',
                            }))
                            .sort((a, b) => a.processOrder - b.processOrder);
                        setFormProcesos(mappedProcesos.length > 0 ? mappedProcesos : [getInitialProcesoFormState()]);
                        
                        if(isMounted) setIsDataInitialized(true);

                    } else if (isMounted) {
                        toast.error(`Ficha ID: ${idSpecsheetFromUrl} no encontrada.`);
                        navigate('/home/fichas-tecnicas/lista');
                    }
                } catch (error) {
                    if (isMounted) {
                        toast.error(`Error al cargar la ficha técnica. ${error.message || ''}`);
                        navigate('/home/fichas-tecnicas/lista');
                    }
                } finally {
                    if (isMounted) setIsLoadingFichaData(false);
                }
            };
            
            fetchFichaData();
        }
    }, [isEditing, idSpecsheetFromUrl, isLoadingPageData, purchaseDetailOptions, navigate, isDataInitialized]);


    const clearSpecificFormErrors = useCallback((fields) => {
        setFormErrors(prev => {
            const newErrors = { ...prev };
            (Array.isArray(fields) ? fields : [fields]).forEach(field => { newErrors[field] = ''; });
            const hasOtherErrors = Object.values(newErrors).some(err => err && err !== prev.general);
            if (!hasOtherErrors && newErrors.general) newErrors.general = '';
            return newErrors;
        });
    }, []);

    const handleFichaChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'switch' ? checked : value;
        setFormFicha(prev => {
            const newState = { ...prev, [name]: val };
            if (name === 'idProduct' && val) {
                const selectedProd = productOptions.find(p => p.value.toString() === val.toString());
                newState.unitOfMeasure = selectedProd?.unitOfMeasure || '';
            }
            return newState;
        });
        if (formErrors[name] || formErrors.general) clearSpecificFormErrors([name, 'general']);
    }, [formErrors, clearSpecificFormErrors, productOptions]);

    const handleIngredienteChange = useCallback((index, field, value) => {
        setFormIngredientes(prev =>
            prev.map((ing, i) => {
                if (i === index) {
                    const updatedIng = { ...ing };
                    if (field === 'selectedPurchaseDetailOption') {
                        updatedIng.selectedPurchaseDetailOption = value;
                        updatedIng.idPurchaseDetail = value ? value.value : '';
                        updatedIng.idSupply = value ? value.idSupply : '';
                        updatedIng.unitOfMeasure = value ? value.unitOfMeasure : '';
                    } else {
                        updatedIng[field] = value;
                    }
                    return updatedIng;
                }
                return ing;
            })
        );
        clearSpecificFormErrors([`ingrediente_${index}_idPurchaseDetail`, 'ingredientes', 'general']);
    }, [clearSpecificFormErrors]);

    const handleProcesoChange = useCallback((index, e) => {
        const { name, value } = e.target;
        setFormProcesos(prev =>
            prev.map((p, i) => {
                if (i === index) {
                    const updatedProcess = { ...p, [name]: value };
                    if (name === 'processOrder') {
                        const parsedOrder = parseInt(value, 10);
                        updatedProcess.processOrder = (isNaN(parsedOrder) || parsedOrder < 1) ? p.processOrder : parsedOrder;
                    }
                    return updatedProcess;
                }
                return p;
            })
        );
        clearSpecificFormErrors([`proceso_${index}_processOrder`, 'procesos', 'general']);
    }, [clearSpecificFormErrors]);

    const addIngrediente = useCallback(() => setFormIngredientes(prev => [...prev, getInitialIngredienteFormState()]), []);
    const addProceso = useCallback(() => setFormProcesos(prev => {
        const nextOrder = prev.length > 0 ? Math.max(0, ...prev.map(p => p.processOrder || 0)) + 1 : 1;
        return [...prev, { ...getInitialProcesoFormState(), processOrder: nextOrder }];
    }), []);

    const validateFichaTecnicaForm = useCallback(() => {
        const errors = { ...getInitialFormErrors() }; let isValid = true;
        if (!formFicha.idProduct) { errors.idProduct = "Producto requerido."; isValid = false; }
        if (!formFicha.dateEffective) { errors.dateEffective = "Fecha efectiva requerida."; isValid = false; }
        if (formFicha.endDate && formFicha.dateEffective && new Date(formFicha.endDate) < new Date(formFicha.dateEffective)) { errors.endDate = "Fin no puede ser anterior."; isValid = false; }
        if (!formFicha.quantityBase || parseFloat(formFicha.quantityBase) <= 0) { errors.quantityBase = "Cant. base > 0."; isValid = false; }
        if (!formFicha.unitOfMeasure) { errors.unitOfMeasure = "Unidad requerida."; isValid = false; }
        
        let ingSectionError = false;
        formIngredientes.forEach((ing, idx) => {
            if (!ing.idPurchaseDetail) { errors[`ingrediente_${idx}_idPurchaseDetail`] = "Lote de compra requerido."; ingSectionError = true; }
            if (!ing.quantity || parseFloat(ing.quantity) <= 0) { errors[`ingrediente_${idx}_quantity`] = "Cant. > 0 requerida."; ingSectionError = true; }
            if (!ing.unitOfMeasure) { errors[`ingrediente_${idx}_unitOfMeasure`] = "Unidad requerida."; ingSectionError = true; }
        });
        if (ingSectionError) { errors.ingredientes = "Revise los lotes de compra."; isValid = false; }

        let procSectionError = false;
        if (formProcesos.length > 0) {
            const orders = new Set();
            formProcesos.forEach((proc, idx) => {
                if (!proc.processNameOverride?.trim()) { errors[`proceso_${idx}_processNameOverride`] = "Nombre del paso requerido."; procSectionError = true; }
                const orderVal = parseInt(proc.processOrder, 10);
                if (isNaN(orderVal) || orderVal < 1) { errors[`proceso_${idx}_processOrder`] = "Orden inválido."; procSectionError = true;}
                else if (orders.has(orderVal)) { errors[`proceso_${idx}_processOrder`] = `Orden duplicado.`; procSectionError = true;}
                else orders.add(orderVal);
            });
            if (procSectionError) { errors.procesos = "Revise los pasos de elaboración."; isValid = false; }
        }
        
        if (!isValid) toast.error("Por favor, corrija los errores marcados.");
        setFormErrors(errors);
        return isValid;
    }, [formFicha, formIngredientes, formProcesos]);

    const toggleConfirmModal = useCallback(() => { if (!isConfirmActionLoading) setConfirmModalOpen(p => !p); }, [isConfirmActionLoading]);
    const prepareActionConfirmation = useCallback((actionFn, props) => { confirmActionRef.current = actionFn; setConfirmModalProps(props); setConfirmModalOpen(true); }, []);
    
    const executeRemoveItem = useCallback(() => {
        const { type, keyToRemove } = itemToRemoveRef.current;
        if (type === 'ingrediente') setFormIngredientes(prev => prev.filter(item => item.key !== keyToRemove));
        else if (type === 'proceso') setFormProcesos(prev => prev.filter(item => item.key !== keyToRemove).map((p, idx) => ({ ...p, processOrder: idx + 1 })));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.`);
        toggleConfirmModal();
    }, [toggleConfirmModal]);

    const requestRemoveItemConfirmation = useCallback((type, index, itemKey) => {
        itemToRemoveRef.current = { type, keyToRemove: itemKey };
        const itemArray = type === 'ingrediente' ? formIngredientes : formProcesos;
        const itemActual = itemArray.find(item => item.key === itemKey);
        const itemName = type === 'ingrediente' ? (itemActual?.selectedPurchaseDetailOption?.label || `Ingrediente #${index + 1}`) : (itemActual?.processNameOverride || `Paso #${itemActual?.processOrder || index + 1}`);
        prepareActionConfirmation(executeRemoveItem, { title: `Confirmar Eliminación`, message: `¿Está seguro de que desea eliminar "${itemName}"?`, confirmText: "Sí, Eliminar", confirmColor: "danger" });
    }, [formIngredientes, formProcesos, prepareActionConfirmation, executeRemoveItem]);
    
    const executeSave = async () => {
        setIsSaving(true);
        setIsConfirmActionLoading(true);
        const actionText = isEditing ? "actualizando" : "creando";
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ficha...`);

        const fichaDataPrincipal = {
            idProduct: parseInt(formFicha.idProduct, 10),
            startDate: formFicha.dateEffective,
            endDate: formFicha.endDate || null,
            quantity: parseFloat(formFicha.quantityBase),
            unitOfMeasure: formFicha.unitOfMeasure,
            status: formFicha.status,
        };

        const suppliesPayload = formIngredientes
            .filter(ing => ing.idPurchaseDetail && ing.quantity)
            .map(ing => ({
                idPurchaseDetail: parseInt(ing.idPurchaseDetail, 10),
                idSupply: parseInt(ing.idSupply, 10),
                quantity: parseFloat(ing.quantity),
                unitOfMeasure: ing.unitOfMeasure,
            }));

        const processesPayload = formProcesos
            .filter(proc => proc.processNameOverride?.trim())
            .map((proc, index) => ({
                processOrder: proc.processOrder || (index + 1),
                processNameOverride: proc.processNameOverride.trim(),
                processDescriptionOverride: proc.processDescriptionOverride?.trim() || null,
            }));

        const fichaPayload = { ...fichaDataPrincipal, supplies: suppliesPayload, processes: processesPayload };

        try {
            if (isEditing && idSpecsheetFromUrl) {
                await fichaTecnicaService.updateSpecSheet(idSpecsheetFromUrl, fichaPayload);
            } else {
                await fichaTecnicaService.createSpecSheet(fichaPayload);
            }
            toast.success(`Ficha ${isEditing ? 'actualizada' : 'creada'} con éxito.`, { id: toastId });
            toggleConfirmModal();
            
            // --- INICIO DE LA CORRECCIÓN DE REDIRECCIÓN ---
            setTimeout(() => {
                // Por defecto, si no sabemos a dónde ir, volvemos a la lista principal de productos.
                // Asegúrate que esta ruta '/home/produccion/producto-insumo' es correcta.
                let destination = '/home/produccion/producto-insumo';

                // Si se estaba editando, volvemos a la lista de fichas de ese producto.
                if (isEditing) {
                    destination = `/home/producto/${formFicha.idProduct}/fichas`;
                } 
                // Si se estaba creando, pero veníamos de un producto específico, volvemos a él.
                else if (idProductoFromUrl) {
                    destination = `/home/producto/${idProductoFromUrl}/fichas`;
                }

                navigate(destination);
            }, 1200);
            // --- FIN DE LA CORRECCIÓN DE REDIRECCIÓN ---

        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || `Error al ${actionText} la ficha técnica.`;
            setFormErrors(prev => ({ ...prev, general: errorMsg }));
            toast.error(<div><strong>Error:</strong><br/>{errorMsg}</div>, { id: toastId, duration: 8000 });
            if (confirmModalOpen) toggleConfirmModal();
        } finally {
            setIsSaving(false);
            setIsConfirmActionLoading(false);
        }
    };

    const requestSaveConfirmation = useCallback(() => {
        if (!validateFichaTecnicaForm()) return;
        prepareActionConfirmation(executeSave, {
            title: `Confirmar ${isEditing ? 'Actualización' : 'Creación'}`,
            message: `¿Desea ${isEditing ? 'guardar los cambios en' : 'crear esta nueva'} la ficha técnica?`,
            confirmText: `Sí, ${isEditing ? 'Actualizar' : 'Guardar'}`,
            confirmColor: isEditing ? "primary" : "success"
        });
    }, [validateFichaTecnicaForm, isEditing, executeSave, prepareActionConfirmation]);

    // --- CORRECCIÓN EN EL BOTÓN DE CANCELAR ---
    const handleCancel = () => {
        // La lógica es la misma que la de la redirección al guardar.
        // Si estamos editando, volvemos a la lista del producto original.
        if (isEditing && originalIdProductOnLoad) {
            navigate(`/home/producto/${originalIdProductOnLoad}/fichas`);
        } 
        // Si estamos creando desde un producto, volvemos a su lista.
        else if (idProductoFromUrl) {
            navigate(`/home/producto/${idProductoFromUrl}/fichas`);
        } 
        // Si no, volvemos a la lista general de productos.
        else {
            navigate('/home/produccion/producto-insumo');
        }
    };
    
    const getSelectStyles = (hasError) => ({ control: (base, state) => ({ ...base, minHeight: 'calc(1.5em + 0.5rem + 2px)', height: 'calc(1.5em + 0.5rem + 2px)', fontSize: '0.875rem', borderColor: hasError ? '#dc3545' : state.isFocused ? '#86b7fe' : '#ced4da', boxShadow: hasError ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)' : state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none', '&:hover': { borderColor: hasError ? '#dc3545' : '#adb5bd' } }), valueContainer: base => ({ ...base, height: 'calc(1.5em + 0.5rem + 2px)', padding: '0.25rem 0.5rem' }), input: base => ({ ...base, margin: '0px', paddingBottom: '0px', paddingTop: '0px' }), indicatorSeparator: () => ({ display: 'none' }), indicatorsContainer: base => ({ ...base, height: 'calc(1.5em + 0.5rem + 2px)' }), menu: base => ({ ...base, zIndex: 1055, fontSize: '0.875rem' }), option: (base, {isSelected, isFocused}) => ({ ...base, fontSize: '0.875rem', backgroundColor: isSelected ? '#0d6efd' : isFocused ? '#e9ecef' : undefined, color: isSelected ? 'white' : undefined, '&:active': { backgroundColor: !isSelected ? '#dbeafe' : undefined } }), });
    
    if (isLoadingPageData) { 
        return ( <Container fluid className="text-center py-5"><Spinner /><p className="mt-2">Cargando datos maestros...</p></Container> ); 
    }

    return (
        <Container fluid className="main-content ficha-tecnica-page-content">
            <Toaster position="top-center" />
            <Row className="mb-4 align-items-center ficha-tecnica-page-header">
                 <Col><h2 className="mb-0 d-flex align-items-center">{isEditing ? <Edit size={28}/> : <Plus size={28}/>}{isEditing ? " Editar Ficha Técnica" : " Crear Ficha Técnica"}{isEditing && <span className="ms-2 fs-5 text-muted">(ID: {idSpecsheetFromUrl})</span>}</h2></Col>
            </Row>
            {isEditing && isLoadingFichaData && <div className="text-center py-3"><Spinner size="sm" /> Cargando datos de la ficha...</div>}
            {formErrors.general && <Alert color="danger">{formErrors.general}</Alert>}
            
            <Form onSubmit={(e) => { e.preventDefault(); requestSaveConfirmation(); }}>
                <section className="ficha-tecnica-card">
                     <h4 className="section-title">Datos Generales</h4>
                    <Row className="g-3">
                        <Col md={6}><FormGroup><Label htmlFor="idProduct" className="fw-bold">Producto <span className="text-danger">*</span></Label>
                        <Select 
                          inputId="idProduct" 
                          name="idProduct" 
                          options={productOptions} 
                          value={productOptions.find(opt => String(opt.value) === String(formFicha.idProduct)) || null} 
                          onChange={selectedOption => handleFichaChange({ target: { name: 'idProduct', value: selectedOption ? selectedOption.value.toString() : '' }})} 
                          placeholder="Seleccione un producto..." 
                          isDisabled={isSaving || (isEditing && !!originalIdProductOnLoad) || (!isEditing && !!idProductoFromUrl)} 
                          styles={getSelectStyles(!!formErrors.idProduct)} 
                          noOptionsMessage={() => 'No hay productos activos'} 
                          menuPlacement="auto" 
                        />
                        <FormFeedback className={formErrors.idProduct ? 'd-block' : ''}>{formErrors.idProduct}</FormFeedback></FormGroup></Col>
                        <Col md={3} sm={6}><FormGroup><Label htmlFor="dateEffective" className="fw-bold">Fecha Efectiva <span className="text-danger">*</span></Label><Input id="dateEffective" type="date" name="dateEffective" bsSize="sm" value={formFicha.dateEffective} onChange={handleFichaChange} invalid={!!formErrors.dateEffective} disabled={isSaving}/><FormFeedback>{formErrors.dateEffective}</FormFeedback></FormGroup></Col>
                        <Col md={3} sm={6}><FormGroup><Label htmlFor="endDate" className="fw-bold">Fin Vigencia (Opc.)</Label><Input id="endDate" type="date" name="endDate" bsSize="sm" value={formFicha.endDate} onChange={handleFichaChange} invalid={!!formErrors.endDate} disabled={isSaving} min={formFicha.dateEffective || undefined}/><FormFeedback>{formErrors.endDate}</FormFeedback></FormGroup></Col>
                        <Col md={4} lg={3} sm={6}><FormGroup><Label htmlFor="quantityBase" className="fw-bold">Cant. Base <span className="text-danger">*</span></Label><Input id="quantityBase" type="number" name="quantityBase" bsSize="sm" min="0.001" step="any" value={formFicha.quantityBase} onChange={handleFichaChange} invalid={!!formErrors.quantityBase} disabled={isSaving} placeholder="Ej: 1.0"/><FormFeedback>{formErrors.quantityBase}</FormFeedback></FormGroup></Col>
                        <Col md={4} lg={3} sm={6}><FormGroup><Label htmlFor="unitOfMeasure" className="fw-bold">Unidad (Cant. Base) <span className="text-danger">*</span></Label><Input id="unitOfMeasure" type="select" name="unitOfMeasure" bsSize="sm" value={formFicha.unitOfMeasure} onChange={handleFichaChange} invalid={!!formErrors.unitOfMeasure} disabled={isSaving}><option value="">Seleccione...</option>{unitOfMeasures.map(u=>(<option key={u.value} value={u.value}>{u.label}</option>))}</Input><FormFeedback>{formErrors.unitOfMeasure}</FormFeedback></FormGroup></Col>
                        <Col md={4} lg={3} sm={12} className="d-flex align-items-md-end pb-md-1"><FormGroup switch className="mt-2 mt-md-0"><Input type="switch" name="status" checked={formFicha.status} onChange={e => handleFichaChange({ target: { name: 'status', value: e.target.checked, type: 'switch' }})} disabled={isSaving} /><Label check>Ficha Activa</Label></FormGroup></Col>
                    </Row>
                </section>
                
                <section className="ficha-tecnica-card">
                    <Row className="align-items-center mb-3"><Col><h4 className="mb-0 section-title">Ingredientes</h4></Col><Col className="text-end"><Button color="success" outline size="sm" onClick={addIngrediente} disabled={isSaving}><Plus size={16}/> Añadir Ingrediente</Button></Col></Row>
                    {formErrors.ingredientes && <Alert color="warning" className="py-1 px-2 x-small mb-2"><small>{formErrors.ingredientes}</small></Alert>}
                    
                    {formIngredientes.map((ing, index) => (
                        <Row key={ing.key} className="g-2 align-items-center dynamic-item-row">
                            <Col sm={12} md={6}>
                                <FormGroup className="mb-2 mb-md-0">
                                    <Select 
                                        inputId={`ing-select-${ing.key}`} 
                                        options={purchaseDetailOptions} 
                                        value={ing.selectedPurchaseDetailOption} 
                                        onChange={opt => handleIngredienteChange(index, 'selectedPurchaseDetailOption', opt)}
                                        placeholder="Seleccione un insumo y su proveedor..."
                                        isClearable isDisabled={isSaving || purchaseDetailOptions.length === 0} 
                                        styles={getSelectStyles(!!formErrors[`ingrediente_${index}_idPurchaseDetail`])}
                                        noOptionsMessage={() => "No hay compras de insumos disponibles"} menuPlacement="auto"
                                    />
                                    {formErrors[`ingrediente_${index}_idPurchaseDetail`] && (<div className="invalid-feedback d-block x-small mt-1">{formErrors[`ingrediente_${index}_idPurchaseDetail`]}</div>)}
                                </FormGroup>
                            </Col>
                            <Col sm={4} md={3}>
                                <FormGroup className="mb-2 mb-md-0">
                                    <Input type="number" bsSize="sm" min="0.001" step="any" name="quantity" value={ing.quantity} onChange={e => handleIngredienteChange(index, 'quantity', e.target.value)} invalid={!!formErrors[`ingrediente_${index}_quantity`]} disabled={isSaving} placeholder="Cantidad a usar"/>
                                    {formErrors[`ingrediente_${index}_quantity`] && (<FormFeedback className="x-small">{formErrors[`ingrediente_${index}_quantity`]}</FormFeedback>)}
                                </FormGroup>
                            </Col>
                            <Col sm={5} md={2}>
                                <FormGroup className="mb-2 mb-md-0">
                                    <Input type="select" bsSize="sm" name="unitOfMeasure" value={ing.unitOfMeasure} onChange={e => handleIngredienteChange(index, 'unitOfMeasure', e.target.value)} invalid={!!formErrors[`ingrediente_${index}_unitOfMeasure`]} disabled={isSaving}>
                                        <option value="">Unidad...</option>
                                        {unitOfMeasures.map(u=>(<option key={u.value} value={u.value}>{u.label}</option>))}
                                    </Input>
                                    {formErrors[`ingrediente_${index}_unitOfMeasure`] && (<FormFeedback className="x-small">{formErrors[`ingrediente_${index}_unitOfMeasure`]}</FormFeedback>)}
                                </FormGroup>
                            </Col>
                            <Col sm={3} md={1} className="text-end">
                                <Button color="danger" outline size="sm" onClick={() => requestRemoveItemConfirmation('ingrediente', index, ing.key)} disabled={isSaving || formIngredientes.length <= 1} title="Eliminar Ingrediente"><Trash2 size={16}/></Button>
                            </Col>
                        </Row>
                    ))}
                    {purchaseDetailOptions.length === 0 && !isLoadingPageData && (
                        <Alert color="info" className="mt-3">
                            No hay compras de insumos disponibles para agregar. Por favor, registre una nueva compra primero.
                        </Alert>
                    )}
                </section>
                
                <section className="ficha-tecnica-card">
                    <Row className="align-items-center mb-3"><Col><h4 className="mb-0 section-title">Pasos de Elaboración</h4></Col><Col className="text-end"><Button color="info" outline size="sm" onClick={addProceso} disabled={isSaving}><Plus size={16}/> Añadir Paso</Button></Col></Row>
                    {formErrors.procesos && <Alert color="warning" className="py-1 px-2 x-small mb-2"><small>{formErrors.procesos}</small></Alert>}
                    {formProcesos.map((proc, index) => (
                        <Row key={proc.key} className="g-2 align-items-start dynamic-item-row">
                            <Col xs="auto" className="d-flex align-items-center pt-md-2 pe-2">
                                <Input type="number" bsSize="sm" name="processOrder" style={{width:"70px"}} value={proc.processOrder} onChange={e=>handleProcesoChange(index,e)} invalid={!!formErrors[`proceso_${index}_processOrder`]} disabled={isSaving} min="1" title="Orden"/>
                                {formErrors[`proceso_${index}_processOrder`] && (<FormFeedback className="x-small d-block ms-1 text-start">{formErrors[`proceso_${index}_processOrder`]}</FormFeedback>)}
                            </Col>
                            <Col>
                                <FormGroup className="mb-2 mb-md-0">
                                    <Input type="text" bsSize="sm" name="processNameOverride" value={proc.processNameOverride} onChange={e=>handleProcesoChange(index,e)} invalid={!!formErrors[`proceso_${index}_processNameOverride`]} disabled={isSaving} placeholder={`Paso ${proc.processOrder}: Ej: Mezclar ingredientes secos`}/>
                                    <FormFeedback className="x-small">{formErrors[`proceso_${index}_processNameOverride`]}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col xs={12} md={5}>
                                <FormGroup className="mb-2 mb-md-0">
                                    <Input type="textarea" bsSize="sm" rows="1" name="processDescriptionOverride" value={proc.processDescriptionOverride} onChange={e=>handleProcesoChange(index,e)} disabled={isSaving} placeholder="Describa el paso (opcional)..." style={{minHeight:'31px',resize:'vertical'}}/>
                                </FormGroup>
                            </Col>
                            <Col xs={12} md="auto" className="text-end">
                                <Button color="danger" outline size="sm" onClick={() => requestRemoveItemConfirmation('proceso', index, proc.key)} disabled={isSaving || formProcesos.length <= 1} title="Eliminar Paso"><Trash2 size={16}/></Button>
                            </Col>
                        </Row>
                    ))}
                </section>
                
                <div className="d-flex justify-content-end mt-4 mb-5 ficha-tecnica-actions">
                    <Button color="secondary" outline onClick={handleCancel} disabled={isSaving} className="me-2"><X size={18}/> Cancelar</Button>
                    <Button color={isEditing ? "primary" : "success"} type="submit" disabled={isSaving}>{isSaving ? <Spinner size="sm"/> : <Save size={18}/>} {isEditing ? " Actualizar Ficha" : " Guardar Ficha"}</Button>
                </div>
            </Form>

            <ConfirmationModalComponent 
                isOpen={confirmModalOpen} 
                toggle={toggleConfirmModal} 
                title={confirmModalProps.title} 
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()} 
                confirmText={confirmModalProps.confirmText} 
                confirmColor={confirmModalProps.confirmColor} 
                isConfirming={isConfirmActionLoading}
            >
                {confirmModalProps.message}
            </ConfirmationModalComponent>
        </Container>
    );
};

export default FichaTecnica;