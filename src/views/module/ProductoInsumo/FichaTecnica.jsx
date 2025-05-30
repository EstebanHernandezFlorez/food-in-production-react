// src/views/module/ProductoInsumo/FichaTecnica.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from 'react-select';
import {
    Button, Container, Row, Col, Form, FormGroup, Input, Label,
    FormFeedback, Spinner, Alert,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import { Plus, Trash2, Save, X, AlertTriangle, Edit, CheckCircle } from 'lucide-react'; // XCircle no se usa aquí
import toast, { Toaster } from "react-hot-toast";

import productService from "../../services/productService";
import fichaTecnicaService from "../../services/specSheetService";
import supplyService from "../../services/supplyService";

import "../../../assets/css/App.css";
import "../../../assets/css/produccion/FichaTecnicaStyles.css";

// --- Constantes ---
const getInitialFichaFormState = () => ({
    idProduct: '', dateEffective: new Date().toISOString().slice(0, 10), endDate: '',      
    quantityBase: '', unitOfMeasure: '', status: true,
});
const getInitialIngredienteFormState = () => ({
    key: `ing-${Date.now()}-${Math.random().toString(36).substr(2,5)}`, idSupply: '', 
    selectedSupplyOption: null, quantity: '', unitOfMeasure: '',
});
const getInitialProcesoFormState = () => ({
    key: `proc-${Date.now()}-${Math.random().toString(36).substr(2,5)}`, processOrder: 1,
    processNameOverride: '', processDescriptionOverride: '',
});
const getInitialFormErrors = () => ({ 
    idProduct: '', dateEffective: '', endDate: '', quantityBase: '', 
    unitOfMeasure: '', ingredientes: '', procesos: '', general: "" 
});
const unitOfMeasures = [ /* ... (tu array de unidades) ... */ 
    { value: 'kg', label: 'Kilogramos (kg)' }, { value: 'g', label: 'Gramos (g)' }, 
    { value: 'mg', label: 'Miligramos (mg)' }, { value: 'lb', label: 'Libras (lb)' }, 
    { value: 'oz', label: 'Onzas (oz)' }, { value: 'L', label: 'Litros (L)' }, 
    { value: 'mL', label: 'Mililitros (mL)' }, { value: 'gal', label: 'Galones (gal)' }, 
    { value: 'm', label: 'Metros (m)' }, { value: 'cm', label: 'Centímetros (cm)' }, 
    { value: 'mm', label: 'Milímetros (mm)' }, { value: 'unidad', label: 'Unidad(es)' },
    { value: 'docena', label: 'Docena(s)' },
];

// --- Modal de Confirmación (sin cambios) ---
const ConfirmationModalComponent = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}><ModalHeader toggle={!isConfirming ? toggle : undefined}><div className="d-flex align-items-center"><AlertTriangle size={24} className={`text-${confirmColor === "danger" ? "danger" : "primary"} me-2`}/> <span className="fw-bold">{title}</span></div></ModalHeader><ModalBody>{children}</ModalBody><ModalFooter><Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button><Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>{isConfirming ? <Spinner size="sm"/> : confirmText}</Button></ModalFooter></Modal>
);

const FichaTecnica = () => {
    const navigate = useNavigate();
    const { idSpecsheet: idSpecsheetFromUrl } = useParams();
    
    const [isEditing, setIsEditing] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [supplyOptions, setSupplyOptions] = useState([]);   
    
    const [formFicha, setFormFicha] = useState(getInitialFichaFormState());
    const [formIngredientes, setFormIngredientes] = useState([getInitialIngredienteFormState()]);
    const [formProcesos, setFormProcesos] = useState([getInitialProcesoFormState()]);
    const [formErrors, setFormErrors] = useState(getInitialFormErrors());
    
    const [isLoadingPageData, setIsLoadingPageData] = useState(true);
    const [isLoadingFichaData, setIsLoadingFichaData] = useState(false);
    const [isDataInitialized, setIsDataInitialized] = useState(false); // Para controlar la carga inicial completa

    const [isSaving, setIsSaving] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({});
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const confirmActionRef = useRef(null);
    const itemToRemoveRef = useRef({ type: null, keyToRemove: null });
    const [originalIdProductOnLoad, setOriginalIdProductOnLoad] = useState(null); // Para saber si el producto original se cargó


    useEffect(() => {
        const editingMode = !!idSpecsheetFromUrl;
        setIsEditing(editingMode);
        setIsDataInitialized(false); // Resetear al cambiar de modo o ID

        if (!editingMode) { // Modo Creación
            setFormFicha(getInitialFichaFormState());
            setFormIngredientes([getInitialIngredienteFormState()]);
            setFormProcesos([getInitialProcesoFormState()]);
            setFormErrors(getInitialFormErrors());
            setOriginalIdProductOnLoad(null);
            setIsDataInitialized(true); // Para creación, los datos iniciales están "listos" (vacíos)
        }
        // La carga de la ficha en modo edición se maneja en otro useEffect
    }, [idSpecsheetFromUrl]);

    useEffect(() => {
        let isMounted = true;
        setIsLoadingPageData(true);
        const fetchOptionsData = async () => {
            try {
                const [productosRes, suppliesRes] = await Promise.all([
                    productService.getAllProducts({ status: true }),
                    supplyService.getAllSupplies({ status: true })
                ]);
                if (isMounted) {
                    setProductOptions(
                        (Array.isArray(productosRes) ? productosRes : []).map(p => ({ value: p.idProduct, label: p.productName, unitOfMeasure: p.unitOfMeasure }))
                    );
                    const activeSupplies = Array.isArray(suppliesRes) ? suppliesRes : [];
                    setSupplyOptions(
                        activeSupplies.map(s => ({ value: s.idSupply, label: s.supplyName, unitOfMeasure: s.unitOfMeasure }))
                    );
                }
            } catch (error) {
                if (isMounted) toast.error("Error cargando opciones de productos/insumos.");
            } finally {
                if (isMounted) setIsLoadingPageData(false);
            }
        };
        fetchOptionsData();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        // Solo intentar cargar si es edición, tenemos ID, las opciones base están cargadas y los datos aún no se han inicializado para esta ficha
        if (isEditing && idSpecsheetFromUrl && !isLoadingPageData && !isDataInitialized) {
            setIsLoadingFichaData(true);
            setFormErrors(getInitialFormErrors());

            const fetchFichaData = async () => {
                console.log(`FichaTecnica - fetchFichaData: Cargando ficha ID ${idSpecsheetFromUrl}`);
                try {
                    const fichaFromApi = await fichaTecnicaService.getSpecSheetById(idSpecsheetFromUrl);
                    console.log("FichaTecnica - fetchFichaData: Datos RECIBIDOS del backend:", JSON.stringify(fichaFromApi, null, 2));

                    if (isMounted && fichaFromApi) {
                        const selectedProductOption = productOptions.find(p => p.value === fichaFromApi.idProduct);
                        setOriginalIdProductOnLoad(fichaFromApi.idProduct?.toString() || null);

                        setFormFicha({
                            idProduct: fichaFromApi.idProduct?.toString() || '',
                            dateEffective: fichaFromApi.dateEffective ? new Date(fichaFromApi.dateEffective).toISOString().slice(0, 10) : getInitialFichaFormState().dateEffective,
                            endDate: fichaFromApi.endDate ? new Date(fichaFromApi.endDate).toISOString().slice(0, 10) : '',
                            quantityBase: fichaFromApi.quantityBase?.toString() || '',
                            unitOfMeasure: selectedProductOption?.unitOfMeasure || fichaFromApi.unitOfMeasure || '',
                            status: fichaFromApi.status !== undefined ? fichaFromApi.status : true,
                        });

                        const backendSupplies = fichaFromApi.specSheetSupplies || fichaFromApi.SpecSheetSupplies || [];
                        console.log("FichaTecnica - fetchFichaData: Insumos del backend:", backendSupplies);
                        const mappedIngredientes = backendSupplies.map((ing, index) => {
                            const supplyData = ing.Supply || ing.supply; // 'Supply' según tu log
                            const idSupplyApi = supplyData?.idSupply || ing.idSupply;
                            const supplyOpt = supplyOptions.find(opt => opt.value === idSupplyApi);
                            return {
                                key: ing.idSpecSheetSupply || `ing-loaded-${idSupplyApi || index}-${Date.now()}`,
                                idSupply: idSupplyApi?.toString() || '',
                                selectedSupplyOption: supplyOpt || null,
                                quantity: ing.quantity?.toString() || '',
                                unitOfMeasure: supplyOpt?.unitOfMeasure || ing.unitOfMeasure || '',
                            };
                        });
                        setFormIngredientes(mappedIngredientes.length > 0 ? mappedIngredientes : [getInitialIngredienteFormState()]);
                        console.log("FichaTecnica - fetchFichaData: Insumos Mapeados:", mappedIngredientes);
                        
                        const backendProcesses = fichaFromApi.specSheetProcesses || fichaFromApi.SpecSheetProcesses || [];
                        console.log("FichaTecnica - fetchFichaData: Procesos del backend:", backendProcesses);
                        const mappedProcesos = backendProcesses
                            .map((proc, index) => {
                                const masterProcessData = proc.MasterProcess || proc.masterProcess;
                                return {
                                    key: proc.idSpecSheetProcess || `proc-loaded-${proc.processOrder || index}-${Date.now()}`,
                                    processOrder: proc.processOrder || (index + 1),
                                    processNameOverride: proc.processNameOverride || masterProcessData?.processName || '',
                                    processDescriptionOverride: proc.processDescriptionOverride || masterProcessData?.description || '',
                                };
                            })
                            .sort((a, b) => a.processOrder - b.processOrder);
                        setFormProcesos(mappedProcesos.length > 0 ? mappedProcesos : [getInitialProcesoFormState()]);
                        console.log("FichaTecnica - fetchFichaData: Procesos Mapeados:", mappedProcesos);
                        
                        if(isMounted) setIsDataInitialized(true); // Marcar que los datos de esta ficha se han cargado/inicializado

                    } else if (isMounted) {
                        toast.error(`Ficha ID: ${idSpecsheetFromUrl} no encontrada.`);
                        navigate('/home/fichas-tecnicas/lista');
                    }
                } catch (error) {
                    if (isMounted) {
                        toast.error(`Error al cargar ficha ID: ${idSpecsheetFromUrl}.`);
                        console.error("FichaTecnica: Error en fetchFichaData:", error);
                        navigate('/home/fichas-tecnicas/lista');
                    }
                } finally {
                    if (isMounted) setIsLoadingFichaData(false);
                }
            };
            
            if (productOptions.length > 0 && supplyOptions.length > 0) { // Asegurar que las opciones estén listas
                fetchFichaData();
            } else if (!isLoadingPageData) { // Si las opciones no cargaron y no está cargando, algo falló antes
                console.warn("FichaTecnica: No se pueden cargar datos de ficha porque las opciones de producto/insumo no están disponibles.");
                 setIsLoadingFichaData(false); // Detener el spinner de carga de ficha
                 setIsDataInitialized(true); // Marcar como "inicializado" para evitar bucles, aunque sea con error
            }
            return () => { isMounted = false; };
        }
    }, [isEditing, idSpecsheetFromUrl, isLoadingPageData, productOptions, supplyOptions, navigate, isDataInitialized]);

    // ... (resto de tus funciones: clearSpecificFormErrors, handleFichaChange, handleIngredienteChange, etc. SIN CAMBIOS IMPORTANTES en su lógica interna, solo nombres de estado)

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

        if (formErrors[name] || formErrors.general) {
            clearSpecificFormErrors([name, 'general']);
        }
    }, [formErrors, clearSpecificFormErrors, productOptions]);

    const handleIngredienteChange = useCallback((index, fieldOrEvent, valueIfField) => {
        setFormIngredientes(prev => 
            prev.map((ing, i) => {
                if (i === index) {
                    const updatedIng = { ...ing };
                    if (typeof fieldOrEvent === 'string') {
                        const field = fieldOrEvent;
                        const value = valueIfField;
                        if (field === 'selectedSupplyOption') {
                            updatedIng.selectedSupplyOption = value;
                            updatedIng.idSupply = value ? value.value.toString() : '';
                            updatedIng.unitOfMeasure = value ? value.unitOfMeasure || '' : '';
                        } else {
                            updatedIng[field] = value;
                        }
                    } else {
                        const e = fieldOrEvent;
                        updatedIng[e.target.name] = e.target.value;
                    }
                    return updatedIng;
                }
                return ing;
            })
        );
        clearSpecificFormErrors([`ingrediente_${index}_idSupply`, `ingrediente_${index}_quantity`, `ingrediente_${index}_unitOfMeasure`, 'ingredientes', 'general']);
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
        clearSpecificFormErrors([`proceso_${index}_processOrder`, `proceso_${index}_processNameOverride`, `proceso_${index}_processDescriptionOverride`, 'procesos', 'general']);
    }, [clearSpecificFormErrors]);

    const addIngrediente = useCallback(() => setFormIngredientes(prev => [...prev, getInitialIngredienteFormState()]), []);
    const addProceso = useCallback(() => setFormProcesos(prev => {
        const nextOrder = prev.length > 0 ? Math.max(0, ...prev.map(p => p.processOrder || 0)) + 1 : 1;
        return [...prev, { ...getInitialProcesoFormState(), processOrder: nextOrder }];
    }), []);

    const validateFichaTecnicaForm = useCallback(() => {
        const errors = { ...getInitialFormErrors() };
        let isValid = true; let generalErrorMessages = [];
        if (!formFicha.idProduct) { errors.idProduct = "Producto requerido."; isValid = false; generalErrorMessages.push(errors.idProduct); }
        if (!formFicha.dateEffective) { errors.dateEffective = "Fecha efectiva requerida."; isValid = false; generalErrorMessages.push(errors.dateEffective); }
        if (formFicha.endDate && formFicha.dateEffective && new Date(formFicha.endDate) < new Date(formFicha.dateEffective)) { errors.endDate = "Fin no puede ser anterior a inicio."; isValid = false; generalErrorMessages.push(errors.endDate); }
        const qtyBase = parseFloat(formFicha.quantityBase);
        if (isNaN(qtyBase) || qtyBase <= 0) { errors.quantityBase = "Cant. base debe ser > 0."; isValid = false; generalErrorMessages.push(errors.quantityBase); }
        if (!formFicha.unitOfMeasure) { errors.unitOfMeasure = "Unidad (cant. base) requerida."; isValid = false; generalErrorMessages.push(errors.unitOfMeasure); }
        if (formIngredientes.length === 0 && formFicha.status) { errors.ingredientes = "Fichas activas: al menos un ingrediente."; isValid = false; generalErrorMessages.push(errors.ingredientes); }
        else {
            let ingSectionError = false;
            formIngredientes.forEach((ing, idx) => {
                if (!ing.idSupply) { errors[`ingrediente_${idx}_idSupply`] = "Insumo req."; ingSectionError = true; }
                const ingQty = parseFloat(ing.quantity);
                if (isNaN(ingQty) || ingQty <= 0) { errors[`ingrediente_${idx}_quantity`] = "Cant. > 0 req."; ingSectionError = true; }
                if (!ing.unitOfMeasure) { errors[`ingrediente_${idx}_unitOfMeasure`] = "Unidad req."; ingSectionError = true; }
            });
            if (ingSectionError) { errors.ingredientes = "Revise ingredientes."; isValid = false; generalErrorMessages.push(errors.ingredientes); }
        }
        if (formProcesos.length > 0) {
            const orders = new Set(); let procSectionError = false;
            formProcesos.forEach((proc, idx) => {
                if (!proc.processNameOverride?.trim()) { errors[`proceso_${idx}_processNameOverride`] = "Nombre paso req."; procSectionError = true; }
                const orderVal = parseInt(proc.processOrder, 10);
                if (isNaN(orderVal) || orderVal < 1) { errors[`proceso_${idx}_processOrder`] = "Orden inválido."; procSectionError = true;}
                else if (orders.has(orderVal)) { errors[`proceso_${idx}_processOrder`] = `Orden ${orderVal} duplicado.`; procSectionError = true;}
                else orders.add(orderVal);
            });
            if (procSectionError) { errors.procesos = "Revise procesos."; isValid = false; generalErrorMessages.push(errors.procesos); }
        }
        if (!isValid) errors.general = generalErrorMessages.length > 1 ? "Corrija errores." : (generalErrorMessages[0] || "Errores.");
        else errors.general = "";
        setFormErrors(errors);
        if (!isValid) toast.error(errors.general.split(". ").join(".\n") || "Revise campos.");
        return isValid;
    }, [formFicha, formIngredientes, formProcesos]);

    const toggleConfirmModal = useCallback(() => { if (isConfirmActionLoading) return; setConfirmModalOpen(p => !p); }, [isConfirmActionLoading]);
    useEffect(() => { if (!confirmModalOpen && !isConfirmActionLoading) { setConfirmModalProps({}); confirmActionRef.current = null; itemToRemoveRef.current = { type: null, keyToRemove: null }; } }, [confirmModalOpen, isConfirmActionLoading]);
    const prepareActionConfirmation = useCallback((actionFn, props) => { confirmActionRef.current = actionFn; setConfirmModalProps(props); setConfirmModalOpen(true); }, []);
    
    const executeRemoveItem = useCallback(() => {
        const { type, keyToRemove } = itemToRemoveRef.current; 
        if (type === 'ingrediente') setFormIngredientes(prev => prev.filter(item => item.key !== keyToRemove));
        else if (type === 'proceso') setFormProcesos(prev => prev.filter(item => item.key !== keyToRemove).map((p, idx) => ({ ...p, processOrder: idx + 1 })));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.`);
        toggleConfirmModal();
    }, [toggleConfirmModal]);
    const requestRemoveItemConfirmation = (type, index, itemKey) => {
        itemToRemoveRef.current = { type, keyToRemove: itemKey };
        const itemArray = type === 'ingrediente' ? formIngredientes : formProcesos;
        const itemActual = itemArray.find(item => item.key === itemKey); 
        const itemName = type === 'ingrediente' ? (itemActual?.selectedSupplyOption?.label || `Ingrediente #${index + 1}`) : (itemActual?.processNameOverride || `Paso #${itemActual?.processOrder || index + 1}`);
        prepareConfirmation(executeRemoveItem, { title: `Confirmar Eliminación`, message: `¿Eliminar ${itemName}?`, confirmText: "Sí, Eliminar", confirmColor: "danger"});
    };
    
    const executeSave = async () => {
        setIsSaving(true); setIsConfirmActionLoading(true);
        const actionText = isEditing ? "actualizando" : "creando";
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ficha...`);
        const fichaPayload = {
            idProduct: parseInt(formFicha.idProduct, 10), dateEffective: formFicha.dateEffective,
            endDate: formFicha.endDate || null, quantityBase: parseFloat(formFicha.quantityBase),
            unitOfMeasure: formFicha.unitOfMeasure, status: formFicha.status,
            supplies: formIngredientes.filter(ing => ing.idSupply && ing.quantity && ing.unitOfMeasure)
                .map(ing => ({ idSupply: parseInt(ing.idSupply, 10), quantity: parseFloat(ing.quantity), unitOfMeasure: ing.unitOfMeasure })),
            processes: formProcesos.filter(proc => proc.processNameOverride?.trim())
                .map((proc, index) => ({ processOrder: proc.processOrder || (index + 1), processNameOverride: proc.processNameOverride.trim(), processDescriptionOverride: proc.processDescriptionOverride?.trim() || null })),
        };
        try {
            let response;
            if (isEditing && idSpecsheetFromUrl) response = await fichaTecnicaService.updateSpecSheet(idSpecsheetFromUrl, fichaPayload);
            else response = await fichaTecnicaService.createSpecSheet(fichaPayload);
            toast.success(`Ficha ${isEditing ? 'actualizada' : 'creada'}.`, { id: toastId });
            toggleConfirmModal();
            const prodIdNav = fichaPayload.idProduct || originalIdProductOnLoad; // Usar el original si el del form no está
            setTimeout(() => { if (prodIdNav) navigate(`/home/producto/${prodIdNav}/fichas`); else navigate('/home/fichas-tecnicas/lista'); }, 1200);
        } catch (error) {
            let apiErrors = error.response?.data?.errors; let errorMsg = error.response?.data?.message || `Error al ${actionText}.`;
            const newLocalErrors = { ...getInitialFormErrors() };
            if (Array.isArray(apiErrors)) { errorMsg = "Corrija errores: "; apiErrors.forEach(err => { const iMatch=err.path.match(/supplies\[(\d+)\]\.(\w+)/); const pMatch=err.path.match(/processes\[(\d+)\]\.(\w+)/); if(iMatch){const[,,field]=iMatch;newLocalErrors[`ingrediente_${iMatch[1]}_${field==='idSupply'?'idSupply':field}`]=err.msg;if(!newLocalErrors.ingredientes)newLocalErrors.ingredientes="Revise ingredientes."}else if(pMatch){const[,,field]=pMatch;newLocalErrors[`proceso_${pMatch[1]}_${field}`]=err.msg;if(!newLocalErrors.procesos)newLocalErrors.procesos="Revise procesos."}else newLocalErrors[err.path]=err.msg; errorMsg+=`\n- ${err.msg}`;});newLocalErrors.general="Errores del servidor.";}
            else newLocalErrors.general = errorMsg;
            setFormErrors(newLocalErrors);
            toast.error(<div><strong>Error:</strong><br/>{errorMsg.split("\n").map((l,i)=>(<React.Fragment key={i}>{l}<br/></React.Fragment>))}</div>, { id: toastId, duration: 8000 });
            if(confirmModalOpen) toggleConfirmModal();
        } finally { setIsSaving(false); setIsConfirmActionLoading(false); }
    };
    const requestSaveConfirmation = () => { if (!validateFichaTecnicaForm()) return; prepareConfirmation(executeSave, {title: `Confirmar ${isEditing ? 'Actualización' : 'Creación'}`, message: `¿${isEditing ? 'Guardar cambios en' : 'Crear esta nueva'} ficha?`, confirmText: `Sí, ${isEditing ? 'Actualizar' : 'Guardar'}`, confirmColor: isEditing ? "primary" : "success"});};
    const handleCancel = () => navigate(isEditing && formFicha.idProduct ? `/home/producto/${formFicha.idProduct}/fichas` : (originalIdProductOnLoad ? `/home/producto/${originalIdProductOnLoad}/fichas` : '/home/fichas-tecnicas/lista'));    
    const getSelectStyles = (hasError) => ({ control: (base, state) => ({ ...base, minHeight: 'calc(1.5em + 0.5rem + 2px)', height: 'calc(1.5em + 0.5rem + 2px)', fontSize: '0.875rem', borderColor: hasError ? '#dc3545' : state.isFocused ? '#86b7fe' : '#ced4da', boxShadow: hasError ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)' : state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none', '&:hover': { borderColor: hasError ? '#dc3545' : '#adb5bd' } }), valueContainer: base => ({ ...base, height: 'calc(1.5em + 0.5rem + 2px)', padding: '0.25rem 0.5rem' }), input: base => ({ ...base, margin: '0px', paddingBottom: '0px', paddingTop: '0px' }), indicatorSeparator: () => ({ display: 'none' }), indicatorsContainer: base => ({ ...base, height: 'calc(1.5em + 0.5rem + 2px)' }), menu: base => ({ ...base, zIndex: 1055, fontSize: '0.875rem' }), option: (base, {isSelected, isFocused}) => ({ ...base, fontSize: '0.875rem', backgroundColor: isSelected ? '#0d6efd' : isFocused ? '#e9ecef' : undefined, color: isSelected ? 'white' : undefined, '&:active': { backgroundColor: !isSelected ? '#dbeafe' : undefined } }), });

    if (isLoadingPageData || (isEditing && !isDataInitialized && isLoadingFichaData)) {
        return ( <Container fluid className="ficha-tecnica-page-content text-center py-5"><Spinner style={{ width: '3rem', height: '3rem' }} /><p className="mt-2">Cargando datos...</p></Container> );
    }
    if (isEditing && !isLoadingPageData && !isDataInitialized && !isLoadingFichaData) { // Falló la carga de opciones o ficha
        return (<Container fluid className="ficha-tecnica-page-content text-center py-5"><Alert color="danger">No se pudieron cargar todos los datos necesarios para la edición.</Alert><Button color="secondary" onClick={handleCancel}>Volver</Button></Container>)
    }


    return (
        <Container fluid className="main-content ficha-tecnica-page-content">
            <Toaster position="top-center" toastOptions={{ duration: 4000, error: {duration: 7000} }} />
            <Row className="mb-4 align-items-center ficha-tecnica-page-header">
                 <Col><h2 className="mb-0 d-flex align-items-center">{isEditing ? <Edit size={28} className="me-2 text-primary"/> : <Plus size={28} className="me-2 text-success"/>}{isEditing ? "Editar Ficha Técnica" : "Crear Ficha Técnica"}{isEditing && idSpecsheetFromUrl && <span className="ms-2 fs-5 text-muted">(ID: {idSpecsheetFromUrl})</span>}</h2></Col>
            </Row>
            {formErrors.general && ( <Alert color="danger" className="d-flex align-items-center py-2 mb-3"><AlertTriangle size={18} className="me-2 flex-shrink-0" /><div>{formErrors.general.split("\n").map((line,i)=>(<React.Fragment key={i}>{line}<br/></React.Fragment>))}</div></Alert> )}
            <Form onSubmit={(e) => { e.preventDefault(); requestSaveConfirmation(); }}>
                <section className="ficha-tecnica-card">
                     <h4 className="section-title">Datos Generales</h4>
                    <Row className="g-3">
                        <Col md={6}><FormGroup><Label htmlFor="idProduct" className="fw-bold">Producto <span className="text-danger">*</span></Label><Select inputId="idProduct" name="idProduct" options={productOptions} value={productOptions.find(opt => opt.value.toString() === formFicha.idProduct.toString()) || null} onChange={selectedOption => handleFichaChange({ target: { name: 'idProduct', value: selectedOption ? selectedOption.value.toString() : '' }})} placeholder="Seleccione producto..." isDisabled={isSaving || (isEditing && !!originalIdProductOnLoad)} styles={getSelectStyles(!!formErrors.idProduct)} noOptionsMessage={() => productOptions.length === 0 ? 'No hay productos activos' : 'No hay coincidencias' } menuPlacement="auto" /><FormFeedback className={formErrors.idProduct ? 'd-block' : ''}>{formErrors.idProduct}</FormFeedback></FormGroup></Col>
                        <Col md={3} sm={6}><FormGroup><Label htmlFor="dateEffective" className="fw-bold">Fecha Efectiva <span className="text-danger">*</span></Label><Input id="dateEffective" type="date" name="dateEffective" bsSize="sm" value={formFicha.dateEffective} onChange={handleFichaChange} invalid={!!formErrors.dateEffective} disabled={isSaving}/><FormFeedback>{formErrors.dateEffective}</FormFeedback></FormGroup></Col>
                        <Col md={3} sm={6}><FormGroup><Label htmlFor="endDate" className="fw-bold">Fin Vigencia (Opc.)</Label><Input id="endDate" type="date" name="endDate" bsSize="sm" value={formFicha.endDate} onChange={handleFichaChange} invalid={!!formErrors.endDate} disabled={isSaving} min={formFicha.dateEffective || undefined}/><FormFeedback>{formErrors.endDate}</FormFeedback></FormGroup></Col>
                        <Col md={4} lg={3} sm={6}><FormGroup><Label htmlFor="quantityBase" className="fw-bold">Cant. Base <span className="text-danger">*</span></Label><Input id="quantityBase" type="number" name="quantityBase" bsSize="sm" min="0.001" step="any" value={formFicha.quantityBase} onChange={handleFichaChange} invalid={!!formErrors.quantityBase} disabled={isSaving} placeholder="Ej: 1.0"/><FormFeedback>{formErrors.quantityBase}</FormFeedback></FormGroup></Col>
                        <Col md={4} lg={3} sm={6}><FormGroup><Label htmlFor="unitOfMeasure" className="fw-bold">Unidad (Cant. Base) <span className="text-danger">*</span></Label><Input id="unitOfMeasure" type="select" name="unitOfMeasure" bsSize="sm" value={formFicha.unitOfMeasure} onChange={handleFichaChange} invalid={!!formErrors.unitOfMeasure} disabled={isSaving}><option value="">Seleccione...</option>{unitOfMeasures.map(u=>(<option key={u.value} value={u.value}>{u.label}</option>))}</Input><FormFeedback>{formErrors.unitOfMeasure}</FormFeedback></FormGroup></Col>
                        <Col md={4} lg={3} sm={12} className="d-flex align-items-md-end pb-md-1"><FormGroup switch className="mt-2 mt-md-0"><Input type="switch" name="status" checked={formFicha.status} onChange={e => handleFichaChange({ target: { name: 'status', value: e.target.checked, type: 'switch' }})} disabled={isSaving} /><Label check>Ficha Activa</Label></FormGroup></Col>
                    </Row>
                </section>
                <section className="ficha-tecnica-card">
                    <Row className="align-items-center mb-3"><Col><h4 className="mb-0 section-title">Ingredientes</h4></Col><Col className="text-end"><Button color="success" outline size="sm" onClick={addIngrediente} disabled={isSaving}><Plus size={16}/> Añadir Ing.</Button></Col></Row>
                    {(formErrors.ingredientes) && <Alert color="warning" className="py-1 px-2 x-small mb-2"><small>{formErrors.ingredientes}</small></Alert>}
                    {formIngredientes.map((ing, index) => (
                        <Row key={ing.key} className="g-2 align-items-center dynamic-item-row">
                            <Col sm={12} md={5}><FormGroup className="mb-2 mb-md-0">{index === 0 && <Label className="small visually-hidden-focusable">Insumo <span className="text-danger">*</span></Label>}<Select inputId={`ing-select-${ing.key}`} options={supplyOptions} value={ing.selectedSupplyOption} onChange={opt => handleIngredienteChange(index, 'selectedSupplyOption', opt)} placeholder="Seleccione insumo..." isClearable isDisabled={isSaving || supplyOptions.length === 0} styles={getSelectStyles(!!formErrors[`ingrediente_${index}_idSupply`])} noOptionsMessage={()=>supplyOptions.length === 0 ? 'No hay insumos activos' : 'No hay más opciones'} menuPlacement="auto"/>{formErrors[`ingrediente_${index}_idSupply`] && (<div className="invalid-feedback d-block x-small mt-1">{formErrors[`ingrediente_${index}_idSupply`]}</div>)}</FormGroup></Col>
                            <Col sm={4} md={2}><FormGroup className="mb-2 mb-md-0">{index === 0 && <Label className="small visually-hidden-focusable">Cantidad <span className="text-danger">*</span></Label>}<Input type="number" bsSize="sm" min="0.001" step="any" name="quantity" value={ing.quantity} onChange={e => handleIngredienteChange(index, e.target.name, e.target.value)} invalid={!!formErrors[`ingrediente_${index}_quantity`]} disabled={isSaving} placeholder="Cant."/>{formErrors[`ingrediente_${index}_quantity`] && (<FormFeedback className="x-small">{formErrors[`ingrediente_${index}_quantity`]}</FormFeedback>)}</FormGroup></Col>
                            <Col sm={5} md={3}><FormGroup className="mb-2 mb-md-0">{index === 0 && <Label className="small visually-hidden-focusable">Unidad <span className="text-danger">*</span></Label>}<Input type="select" bsSize="sm" name="unitOfMeasure" value={ing.unitOfMeasure} onChange={e => handleIngredienteChange(index, e.target.name, e.target.value)} invalid={!!formErrors[`ingrediente_${index}_unitOfMeasure`]} disabled={isSaving}><option value="">Unidad...</option>{unitOfMeasures.map(u=>(<option key={u.value} value={u.value}>{u.label}</option>))}</Input>{formErrors[`ingrediente_${index}_unitOfMeasure`] && (<FormFeedback className="x-small">{formErrors[`ingrediente_${index}_unitOfMeasure`]}</FormFeedback>)}</FormGroup></Col>
                            <Col sm={3} md={2} className="text-end align-self-md-start"><Button color="danger" outline size="sm" onClick={() => requestRemoveItemConfirmation('ingrediente', index, ing.key)} disabled={isSaving || (formIngredientes.length <= 1 && formFicha.status)} title={formIngredientes.length <= 1 && formFicha.status ? "Ficha activa requiere ingrediente" : "Eliminar"} className="w-100"><Trash2 size={16}/> <span className="d-md-none ms-1">Elim.</span></Button></Col>
                        </Row>
                    ))}
                </section>
                <section className="ficha-tecnica-card">
                    <Row className="align-items-center mb-3"><Col><h4 className="mb-0 section-title">Pasos de Elaboración (Opcional)</h4></Col><Col className="text-end"><Button color="info" outline size="sm" onClick={addProceso} disabled={isSaving}><Plus size={16}/> Añadir Paso</Button></Col></Row>
                    {formErrors.procesos && <Alert color="warning" className="py-1 px-2 x-small mb-2"><small>{formErrors.procesos}</small></Alert>}
                    {formProcesos.map((proc, index) => (
                        <Row key={proc.key} className="g-2 align-items-start dynamic-item-row">
                            <Col xs="auto" className="d-flex align-items-center pt-md-2 pe-2"><Input type="number" bsSize="sm" name="processOrder" style={{width:"70px"}} value={proc.processOrder} onChange={e=>handleProcesoChange(index,e)} invalid={!!formErrors[`proceso_${index}_processOrder`]} disabled={isSaving} min="1" title="Orden"/><FormFeedback className="x-small d-block ms-1 text-start">{formErrors[`proceso_${index}_processOrder`]}</FormFeedback></Col>
                            <Col xs><FormGroup className="mb-2 mb-md-0">{index === 0 && <Label className="small visually-hidden-focusable">Nombre Paso <span className="text-danger">*</span></Label>}<Input type="text" bsSize="sm" name="processNameOverride" value={proc.processNameOverride} onChange={e=>handleProcesoChange(index,e)} invalid={!!formErrors[`proceso_${index}_processNameOverride`]} disabled={isSaving} placeholder="Ej: Mezclar secos"/><FormFeedback className="x-small">{formErrors[`proceso_${index}_processNameOverride`]}</FormFeedback></FormGroup></Col>
                            <Col xs={12} md={5}><FormGroup className="mb-2 mb-md-0">{index === 0 && <Label className="small visually-hidden-focusable">Descripción</Label>}<Input type="textarea" bsSize="sm" rows="1" name="processDescriptionOverride" value={proc.processDescriptionOverride} onChange={e=>handleProcesoChange(index,e)} invalid={!!formErrors[`proceso_${index}_processDescriptionOverride`]} disabled={isSaving} placeholder="Describa el paso..." style={{minHeight:'31px',resize:'vertical'}}/><FormFeedback className="x-small">{formErrors[`proceso_${index}_processDescriptionOverride`]}</FormFeedback></FormGroup></Col>
                            <Col xs={12} md="auto" className="text-end align-self-md-start"><Button color="danger" outline size="sm" onClick={() => requestRemoveItemConfirmation('proceso', index, proc.key)} disabled={isSaving} title="Eliminar Paso" className="w-100"><Trash2 size={16}/> <span className="d-md-none ms-1">Elim.</span></Button></Col>
                        </Row>
                    ))}
                </section>
                <div className="d-flex justify-content-end mt-4 mb-5 ficha-tecnica-actions">
                    <Button color="secondary" outline onClick={handleCancel} disabled={isSaving} className="me-2"><X size={18}/> Cancelar</Button>
                    <Button color={isEditing ? "primary" : "success"} type="submit" disabled={isSaving || isLoadingPageData || (isEditing && isLoadingFichaData && !isDataInitialized)}>{isSaving ? <Spinner size="sm"/> : (isEditing ? <Edit size={18}/> : <Save size={18}/>)} {isEditing ? "Actualizar" : "Guardar"}</Button>
                </div>
            </Form>
            <ConfirmationModalComponent isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title} onConfirm={() => confirmActionRef.current && confirmActionRef.current()} confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor} isConfirming={isConfirmActionLoading}>{confirmModalProps.message}</ConfirmationModalComponent>
        </Container>
    );
};
export default FichaTecnica;