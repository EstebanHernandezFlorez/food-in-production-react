import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Select from 'react-select';
import {
    Button, Container, Row, Col, Form, FormGroup, Input, Label,
    FormFeedback, Spinner, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter,
    Pagination, PaginationItem, PaginationLink
} from "reactstrap";
import { Plus, Trash2, Save, X, AlertTriangle, Edit } from 'lucide-react';
import toast, { Toaster } from "react-hot-toast";

// --- Servicios ---
import productService from "../../services/productService";
import fichaTecnicaService from "../../services/specSheetService";
import registerPurchaseService from "../../services/registroCompraService";
import processService from "../../services/masterProcessService";

// --- Estilos ---
import "../../../assets/css/App.css";
import "../../../assets/css/produccion/FichaTecnicaStyles.css";

// --- Constantes y Helpers ---
const getInitialFichaFormState = () => ({
    idProduct: '', dateEffective: new Date().toISOString().slice(0, 10), endDate: '',
    quantityBase: '', unitOfMeasure: '', status: true,
});
const getInitialIngredienteFormState = () => ({
    key: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    selectedPurchaseDetailOption: null,
    idPurchaseDetail: '', idSupply: '', quantity: '', unitOfMeasure: '',
    stockDisponible: 0, // <-- Nuevo campo para el stock
    error: '', // <-- Nuevo campo para el mensaje de error de stock
});
const getInitialProcesoFormState = () => ({
    key: `proc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    idProcess: null,
    selectedProcess: null,
    processOrder: 1, 
    processNameOverride: '', 
    processDescriptionOverride: '',
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

const PROCESOS_PER_PAGE = 5;

const ConfirmationModalComponent = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
            <div className="d-flex align-items-center"><AlertTriangle size={24} className={`text-${confirmColor === "danger" ? "danger" : "primary"} me-2`} /><span className="fw-bold">{title}</span></div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>{isConfirming ? <Spinner size="sm" /> : confirmText}</Button>
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
    const [masterProcessOptions, setMasterProcessOptions] = useState([]);
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
    
    const [procesosCurrentPage, setProcesosCurrentPage] = useState(1);

    const confirmActionRef = useRef(null);
    const itemToRemoveRef = useRef({ type: null, keyToRemove: null });
    const [originalIdProductOnLoad, setOriginalIdProductOnLoad] = useState(null);
    const ingredientesEndRef = useRef(null);

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

    useEffect(() => {
        let isMounted = true;
        setIsLoadingPageData(true);
        const fetchOptionsData = async () => {
            try {
                const [productosRes, purchasesRes, processesRes] = await Promise.all([
                    productService.getAllProducts({ status: true }),
                    registerPurchaseService.getAllRegisterPurchasesWithDetails(),
                    processService.getAllMasterProcesses() 
                ]);

                if (!isMounted) return;
                
                const mappedProducts = (productosRes || []).map(p => ({ value: p.idProduct, label: p.productName, unitOfMeasure: p.unitOfMeasure }));
                setProductOptions(mappedProducts);
                if (!isEditing && idProductoFromUrl) {
                    const selectedProd = mappedProducts.find(p => p.value.toString() === idProductoFromUrl);
                    if (selectedProd) setFormFicha(prev => ({ ...prev, unitOfMeasure: selectedProd.unitOfMeasure || '' }));
                }

                const purchaseOptions = [];
                const purchasesArray = Array.isArray(purchasesRes) ? purchasesRes : [];
                purchasesArray.forEach((purchase) => {
                    const detailsArray = Array.isArray(purchase.details) ? purchase.details : [];
                    if (detailsArray.length === 0) return;
                    const providerName = purchase.provider?.company || 'No especificado';
                    detailsArray.forEach((detail) => {
                        if (detail && detail.supply && detail.idPurchaseDetail) {
                            // Asumimos que el backend devuelve `stockDisponible` para cada lote.
                            // Si no, la lógica de validación usará `detail.quantity` como fallback, lo cual no es ideal.
                            const stockDisponible = parseFloat(detail.stockDisponible || detail.quantity);

                            if (stockDisponible > 0) { // Solo mostrar lotes con stock positivo
                                purchaseOptions.push({
                                    value: detail.idPurchaseDetail,
                                    label: `${detail.supply.supplyName} (Lote: #${detail.idPurchaseDetail} | Disp: ${stockDisponible} ${detail.supply.unitOfMeasure}) - Prov: ${providerName}`,
                                    idSupply: detail.idSupply,
                                    unitOfMeasure: detail.supply.unitOfMeasure,
                                    stock: stockDisponible // Guardamos el stock para validación
                                });
                            }
                        }
                    });
                });
                setPurchaseDetailOptions(purchaseOptions);

                const mappedProcesses = (Array.isArray(processesRes) ? processesRes : [])
                    .map(p => ({ value: p.idProcess, label: p.processName, description: p.description || '' }))
                    .sort((a, b) => a.label.localeCompare(b.label));
                setMasterProcessOptions(mappedProcesses);

            } catch (error) {
                if (isMounted) toast.error("Error cargando datos para la ficha.");
            } finally {
                if (isMounted) setIsLoadingPageData(false);
            }
        };
        fetchOptionsData();
        return () => { isMounted = false; };
    }, [isEditing, idProductoFromUrl]);

    useEffect(() => {
        let isMounted = true;
        if (isEditing && idSpecsheetFromUrl && !isLoadingPageData && !isDataInitialized && masterProcessOptions.length > 0) {
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
                                ...getInitialIngredienteFormState(), // Asegura que todos los campos existan
                                key: ing.idSpecSheetSupply,
                                selectedPurchaseDetailOption: purchaseOpt || null,
                                idPurchaseDetail: ing.idPurchaseDetail,
                                idSupply: ing.idSupply,
                                quantity: ing.quantity?.toString() || '',
                                unitOfMeasure: ing.unitOfMeasure || purchaseOpt?.unitOfMeasure || '',
                                stockDisponible: purchaseOpt?.stock || 0,
                            };
                        });
                        setFormIngredientes(mappedIngredientes.length > 0 ? mappedIngredientes : [getInitialIngredienteFormState()]);
                        
                        const backendProcesses = Array.isArray(fichaFromApi.specSheetProcesses) ? fichaFromApi.specSheetProcesses : [];
                        const mappedProcesos = backendProcesses.map((proc, index) => {
                                const masterProcess = masterProcessOptions.find(opt => opt.value === proc.idProcess);
                                return {
                                    key: proc.idSpecSheetProcess || `proc-${Date.now()}-${index}`,
                                    idProcess: proc.idProcess,
                                    selectedProcess: masterProcess || null,
                                    processOrder: proc.processOrder || (index + 1),
                                    processNameOverride: proc.processNameOverride || masterProcess?.label || '',
                                    processDescriptionOverride: proc.processDescriptionOverride || '',
                                };
                            })
                            .sort((a, b) => a.processOrder - b.processOrder);
                        setFormProcesos(mappedProcesos.length > 0 ? mappedProcesos : [getInitialProcesoFormState()]);
                        if(isMounted) setIsDataInitialized(true);
                    } else if (isMounted) {
                        toast.error(`Ficha ID: ${idSpecsheetFromUrl} no encontrada.`);
                        navigate('/home/fichas-tecnicas/lista');
                    }
                } catch (error) {
                    if (isMounted) toast.error(`Error al cargar la ficha técnica. ${error.message || ''}`);
                } finally {
                    if (isMounted) setIsLoadingFichaData(false);
                }
            };
            fetchFichaData();
        }
    }, [isEditing, idSpecsheetFromUrl, isLoadingPageData, purchaseDetailOptions, masterProcessOptions, navigate, isDataInitialized]);

    useEffect(() => { if (formIngredientes.length > 1) { ingredientesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); } }, [formIngredientes.length]);
    
    const procesosTotalPages = useMemo(() => Math.ceil(formProcesos.length / PROCESOS_PER_PAGE), [formProcesos]);
    const currentProcesos = useMemo(() => {
        const startIndex = (procesosCurrentPage - 1) * PROCESOS_PER_PAGE;
        const endIndex = startIndex + PROCESOS_PER_PAGE;
        return formProcesos.slice(startIndex, endIndex);
    }, [formProcesos, procesosCurrentPage]);
    
    const handleProcesoPageChange = useCallback((e, pageNumber) => { e.preventDefault(); setProcesosCurrentPage(pageNumber); }, []);

    const clearSpecificFormErrors = useCallback((fields) => {
        setFormErrors(prev => {
            const newErrors = { ...prev };
            (Array.isArray(fields) ? fields : [fields]).forEach(field => { newErrors[field] = ''; });
            if (!Object.values(newErrors).some(err => err && err !== prev.general) && newErrors.general) newErrors.general = '';
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
                    const updatedIng = { ...ing, error: '' }; // Limpia error previo
                    if (field === 'selectedPurchaseDetailOption') {
                        updatedIng.selectedPurchaseDetailOption = value;
                        updatedIng.idPurchaseDetail = value ? value.value : '';
                        updatedIng.idSupply = value ? value.idSupply : '';
                        updatedIng.unitOfMeasure = value ? value.unitOfMeasure : '';
                        updatedIng.stockDisponible = value ? value.stock : 0; // Guarda el stock
                    } else {
                        updatedIng[field] = value;
                    }

                    // Lógica de validación de stock
                    if ((field === 'quantity' || field === 'selectedPurchaseDetailOption') && updatedIng.idPurchaseDetail) {
                        const cantidadRequerida = parseFloat(updatedIng.quantity);
                        const stockDisponible = parseFloat(updatedIng.stockDisponible);
                        if (!isNaN(cantidadRequerida) && !isNaN(stockDisponible) && cantidadRequerida > stockDisponible) {
                            updatedIng.error = `Insuficiente. Disp: ${stockDisponible} ${updatedIng.unitOfMeasure}`;
                            toast.error(`Stock insuficiente para "${updatedIng.selectedPurchaseDetailOption?.label.split(' (')[0]}"`);
                        }
                    }
                    return updatedIng;
                }
                return ing;
            })
        );
        clearSpecificFormErrors([`ingrediente_${index}_idPurchaseDetail`, 'ingredientes', 'general']);
    }, [clearSpecificFormErrors]);

    const handleProcesoChange = useCallback((index, field, value) => {
        setFormProcesos(prev =>
            prev.map((p, i) => {
                if (i === index) {
                    const updatedProcess = { ...p };
                    if (field === 'selectedProcess') {
                        updatedProcess.selectedProcess = value;
                        updatedProcess.idProcess = value ? value.value : null;
                        updatedProcess.processNameOverride = value ? value.label : '';
                        updatedProcess.processDescriptionOverride = value ? value.description : '';
                    } else if (field === 'processOrder') {
                        const parsedOrder = parseInt(value, 10);
                        updatedProcess.processOrder = (isNaN(parsedOrder) || parsedOrder < 1) ? p.processOrder : parsedOrder;
                    } else {
                        updatedProcess[field] = value;
                    }
                    return updatedProcess;
                }
                return p;
            })
        );
        clearSpecificFormErrors([`proceso_${index}_processOrder`, `proceso_${index}_processNameOverride`, 'procesos', 'general']);
    }, [clearSpecificFormErrors]);

    const addIngrediente = useCallback(() => setFormIngredientes(prev => [...prev, getInitialIngredienteFormState()]), []);

    const addProceso = useCallback(() => {
        setFormProcesos(prev => {
            const nextOrder = prev.length > 0 ? Math.max(0, ...prev.map(p => p.processOrder || 0)) + 1 : 1;
            const newProcesos = [...prev, { ...getInitialProcesoFormState(), processOrder: nextOrder }];
            const newTotalPages = Math.ceil(newProcesos.length / PROCESOS_PER_PAGE);
            setProcesosCurrentPage(newTotalPages);
            return newProcesos;
        });
    }, []);

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
            if (ing.error) { ingSectionError = true; } // Si hay un error de stock, el formulario es inválido
        });
        if (ingSectionError) { errors.ingredientes = "Revise los errores en los ingredientes (lotes, cantidades o stock)."; isValid = false; }

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
        if (type === 'ingrediente') {
            setFormIngredientes(prev => prev.filter(item => item.key !== keyToRemove));
        } else if (type === 'proceso') {
            if (currentProcesos.length === 1 && procesosCurrentPage > 1) setProcesosCurrentPage(p => p - 1);
            setFormProcesos(prev => prev.filter(item => item.key !== keyToRemove).map((p, idx) => ({ ...p, processOrder: idx + 1 })));
        }
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.`);
        toggleConfirmModal();
    }, [toggleConfirmModal, currentProcesos.length, procesosCurrentPage]);

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
        const fichaPayload = {
            idProduct: parseInt(formFicha.idProduct, 10),
            dateEffective: formFicha.dateEffective, // Cambiado de startDate a dateEffective
            endDate: formFicha.endDate || null,
            quantityBase: parseFloat(formFicha.quantityBase), // Cambiado de quantity a quantityBase
            unitOfMeasure: formFicha.unitOfMeasure,
            status: formFicha.status,
            specSheetSupplies: formIngredientes // Nombre de la propiedad que espera el backend
                .filter(ing => ing.idPurchaseDetail && ing.quantity)
                .map(ing => ({
                    idPurchaseDetail: parseInt(ing.idPurchaseDetail, 10),
                    idSupply: parseInt(ing.idSupply, 10),
                    quantity: parseFloat(ing.quantity),
                    unitOfMeasure: ing.unitOfMeasure,
                })),
            specSheetProcesses: formProcesos // Nombre de la propiedad que espera el backend
                .filter(proc => proc.processNameOverride?.trim())
                .map((proc, index) => ({
                    idProcess: proc.idProcess,
                    processOrder: proc.processOrder || (index + 1),
                    processNameOverride: proc.processNameOverride.trim(),
                    processDescriptionOverride: proc.processDescriptionOverride?.trim() || null,
                }))
        };
            
        try {
            if (isEditing && idSpecsheetFromUrl) {
                await fichaTecnicaService.updateSpecSheet(idSpecsheetFromUrl, fichaPayload);
            } else {
                await fichaTecnicaService.createSpecSheet(fichaPayload);
            }
            toast.success(`Ficha ${isEditing ? 'actualizada' : 'creada'} con éxito.`, { id: toastId });
            toggleConfirmModal();
            setTimeout(() => {
                const destination = isEditing ? `/home/producto/${formFicha.idProduct}/fichas` : (idProductoFromUrl ? `/home/producto/${idProductoFromUrl}/fichas` : '/home/produccion/producto-insumo');
                navigate(destination);
            }, 1200);
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

    const handleCancel = () => {
        const destination = isEditing && originalIdProductOnLoad ? `/home/producto/${originalIdProductOnLoad}/fichas` : (idProductoFromUrl ? `/home/producto/${idProductoFromUrl}/fichas` : '/home/produccion/producto-insumo');
        navigate(destination);
    };
    
    const getSelectStyles = (hasError) => ({ /* ...tu código de estilos... */ });
    
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
                     {/* ... tu JSX para datos generales ... */}
                </section>
                
                <section className="ficha-tecnica-card">
                    <Row className="align-items-center mb-3"><Col><h4 className="mb-0 section-title">Ingredientes</h4></Col><Col className="text-end"><Button color="success" outline size="sm" onClick={addIngrediente} disabled={isSaving}><Plus size={16}/> Añadir Ingrediente</Button></Col></Row>
                    {formErrors.ingredientes && <Alert color="warning" className="py-1 px-2 x-small mb-2"><small>{formErrors.ingredientes}</small></Alert>}
                    
                    {formIngredientes.map((ing, index) => (
                        <Row key={ing.key} className="g-2 align-items-center dynamic-item-row">
                            <Col sm={12} md={6}>
                                <FormGroup className="mb-2 mb-md-0">
                                    <Select 
                                        options={purchaseDetailOptions} 
                                        value={ing.selectedPurchaseDetailOption} 
                                        onChange={opt => handleIngredienteChange(index, 'selectedPurchaseDetailOption', opt)}
                                        placeholder="Seleccione lote de insumo (stock disponible)..."
                                        isDisabled={isSaving || purchaseDetailOptions.length === 0} 
                                        styles={getSelectStyles(!!formErrors[`ingrediente_${index}_idPurchaseDetail`])}
                                        noOptionsMessage={() => "No hay lotes con stock disponibles"} menuPlacement="auto"
                                    />
                                    {formErrors[`ingrediente_${index}_idPurchaseDetail`] && (<div className="invalid-feedback d-block x-small mt-1">{formErrors[`ingrediente_${index}_idPurchaseDetail`]}</div>)}
                                </FormGroup>
                            </Col>
                            <Col sm={4} md={3}>
                                <FormGroup className="mb-2 mb-md-0">
                                    <Input 
                                        type="number" 
                                        bsSize="sm" 
                                        min="0.001" 
                                        step="any" 
                                        name="quantity" 
                                        value={ing.quantity} 
                                        onChange={e => handleIngredienteChange(index, 'quantity', e.target.value)} 
                                        invalid={!!formErrors[`ingrediente_${index}_quantity`] || !!ing.error}
                                        disabled={isSaving} 
                                        placeholder="Cantidad a usar"
                                    />
                                    <FormFeedback className="x-small">
                                        {formErrors[`ingrediente_${index}_quantity`] || ing.error}
                                    </FormFeedback>
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

                    <div ref={ingredientesEndRef} />
                    {formIngredientes.length >= 3 && <Row className="mt-3"><Col className="text-end"><Button color="success" outline size="sm" onClick={addIngrediente} disabled={isSaving}><Plus size={16}/> Añadir Otro Ingrediente</Button></Col></Row>}
                    {purchaseDetailOptions.length === 0 && !isLoadingPageData && <Alert color="info" className="mt-3">No hay compras de insumos disponibles. Registre una nueva compra primero.</Alert>}
                </section>
                
                <section className="ficha-tecnica-card">
                    {/* ... tu JSX para pasos de elaboración ... */}
                </section>
                
                <div className="d-flex justify-content-end mt-4 mb-5 ficha-tecnica-actions">
                    <Button color="secondary" outline onClick={handleCancel} disabled={isSaving} className="me-2"><X size={18}/> Cancelar</Button>
                    <Button color={isEditing ? "primary" : "success"} type="submit" disabled={isSaving}>{isSaving ? <Spinner size="sm"/> : <Save size={18}/>} {isEditing ? " Actualizar Ficha" : " Guardar Ficha"}</Button>
                </div>
            </Form>

            <ConfirmationModalComponent isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title} onConfirm={() => confirmActionRef.current && confirmActionRef.current()} confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor} isConfirming={isConfirmActionLoading}>
                {confirmModalProps.message}
            </ConfirmationModalComponent>
        </Container>
    );
};

export default FichaTecnica;