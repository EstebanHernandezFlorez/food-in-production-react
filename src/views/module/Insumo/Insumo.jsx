// src/views/module/Insumos/Insumos.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../assets/css/App.css";
import { Container, Spinner } from 'reactstrap';
import { AlertTriangle, CheckCircle, XCircle, Edit, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Servicios ---
import supplyService from '../../services/supplyService';

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination';
import { ConfirmationModal } from '../../General/ConfirmationModal';

// --- Subcomponentes de Insumos ---
import InsumosPageHeader from './InsumosPageHeader';
import InsumosTable from './InsumosTable';
import InsumoFormModal from './InsumoFormModal';

// --- Constantes ---
const INITIAL_FORM_STATE = {
    idSupply: '',        // Para identificar el insumo al editar, coincide con el PK del modelo
    supplyName: '',      // Coincide con el modelo
    description: '',     // Coincide con el modelo
    unitOfMeasure: '', // Coincide con el modelo
    status: true,        // Coincide con el modelo
};

const INITIAL_FORM_ERRORS = {
    supplyName: false,
    description: false, // Aunque no sea obligatorio, puede tener errores (ej. longitud)
    unitOfMeasure: false,
    general: '',
};

const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null,
};

const ITEMS_PER_PAGE = 7;

const Insumos = () => {
    // --- State ---
    const [data, setData] = useState([]); // Contendrá objetos con idSupply, supplyName, etc.
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [isSavingForm, setIsSavingForm] = useState(false);

    const confirmActionRef = useRef(null);

    // --- Opciones Unidad de Medida ---
    const unitOfMeasures = useMemo(() => [
        { value: 'kg', label: 'Kilogramos' }, { value: 'g', label: 'Gramos' }, // ... más unidades
        { value: 'L', label: 'Litros' }, { value: 'mL', label: 'Mililitros' },
        { value: 'unidad', label: 'Unidad(es)' }, { value: 'docena', label: 'Docena(s)' },
        // Añade todas las unidades que necesites
    ], []);
    const unitOfMeasureMap = useMemo(() => {
        const map = {};
        unitOfMeasures.forEach(unit => { map[unit.value] = unit.label; });
        return map;
    }, [unitOfMeasures]);

    const getUnitLabel = useCallback((value) => {
        return unitOfMeasureMap[value] || value || '-';
    }, [unitOfMeasureMap]);

    // --- Lógica de Filtrado y Paginación ---
    const filteredData = useMemo(() => {
        const currentData = Array.isArray(data) ? data : [];
        if (!tableSearchText) return currentData;
        const search = tableSearchText.toLowerCase();
        return currentData.filter(item =>
            (item?.supplyName?.toLowerCase() ?? '').includes(search) ||
            (item?.description?.toLowerCase() ?? '').includes(search) ||
            (item?.unitOfMeasure?.toLowerCase() ?? '').includes(search) ||
            (getUnitLabel(item?.unitOfMeasure)?.toLowerCase() ?? '').includes(search) ||
            (String(item?.idSupply ?? '').toLowerCase()).includes(search) // Filtrar por idSupply
        );
    }, [data, tableSearchText, getUnitLabel]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages)), [currentPage, totalPages]);

    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        try {
            const responseData = await supplyService.getAllSupplies();
            // No se necesita mapeo si el servicio ya devuelve los campos con los nombres correctos del modelo
            setData(Array.isArray(responseData) ? responseData : []);
        } catch (error) {
            toast.error("Error al cargar insumos.");
            setData([]);
        } finally {
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Form Helper Functions ---
    const resetForm = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
        setFormErrors(INITIAL_FORM_ERRORS);
    }, []);
    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    const validateForm = useCallback(() => {
        const errors = { supplyName: false, description: false, unitOfMeasure: false, general: '' };
        let isValid = true;
        const trimmedName = String(form.supplyName ?? '').trim();
        const trimmedDescription = String(form.description ?? '').trim();

        // Validación para supplyName (coincide con backend)
        if (!trimmedName) {
            errors.supplyName = true; isValid = false; errors.general = "El nombre del insumo es requerido.";
        } else if (trimmedName.length < 2 || trimmedName.length > 100) {
            errors.supplyName = true; isValid = false; errors.general = "El nombre del insumo debe tener entre 2 y 100 caracteres.";
        }
        // else if (!/^[a-zA-Z0-9\sÁÉÍÓÚáéíóúñÑüÜ.,'\-()&]+$/.test(trimmedName)) {
        //     errors.supplyName = true; isValid = false; errors.general = "El nombre contiene caracteres no válidos.";
        // } // Puedes añadir una regex si la del backend es muy estricta y quieres validación previa

        // Validación para description (solo longitud si se ingresa, ya que no es obligatoria)
        if (trimmedDescription.length > 500) {
             errors.description = true; isValid = false; errors.general = (errors.general ? errors.general + " " : "") + "La descripción no puede exceder los 500 caracteres.";
        }

        // Validación para unitOfMeasure
        if (!form.unitOfMeasure) {
            errors.unitOfMeasure = true; isValid = false; errors.general = (errors.general ? errors.general + " " : "") + "La unidad de medida es requerida.";
        }

        setFormErrors(errors);
        if (!isValid) {
            toast.error(errors.general.split(". ").join(".\n") || "Revise los campos marcados.");
        }
        return isValid;
    }, [form]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value; // Para el campo 'status' si lo añades como checkbox/switch
        setForm(prev => ({ ...prev, [name]: val }));
        if (formErrors[name] || formErrors.general) {
            setFormErrors(prevErr => ({ ...prevErr, [name]: false, general: '' }));
        }
    }, [formErrors]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value);
        setCurrentPage(1);
    }, []);

    const handlePageChange = useCallback((pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]);

    // --- Modal Toggles ---
    const toggleMainModal = useCallback(() => {
        const closing = modalOpen;
        setModalOpen(prev => !prev);
        if (closing) { resetForm(); }
    }, [modalOpen, resetForm]);

    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return;
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);
    
    // --- FUNCIONES DE EJECUCIÓN DE ACCIONES ---
    const executeChangeStatus = useCallback(async (details) => {
        if (!details || !details.idSupply) { toast.error("Error interno al cambiar estado."); toggleConfirmModal(); return; }
        const { idSupply, status: currentStatus, supplyName } = details; // Usar supplyName consistentemente
        const newStatus = !currentStatus;
        const actionText = newStatus ? "activado" : "desactivado";
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${currentStatus ? 'Desactivando' : 'Activando'} insumo...`);
        try {
            await supplyService.changeSupplyStatus(idSupply, newStatus);
            setData(prevData => prevData.map(item => item.idSupply === idSupply ? { ...item, status: newStatus } : item));
            toast.success(`Insumo "${supplyName || ''}" ${actionText}.`, { id: toastId });
            toggleConfirmModal();
        } catch (error) {
            const errorMsg = error.message || "Error desconocido al cambiar estado.";
            toast.error(errorMsg, { id: toastId });
            toggleConfirmModal();
        } finally { setIsConfirmActionLoading(false); }
    }, [toggleConfirmModal]);

    const executeDelete = useCallback(async (insumoToDelete) => {
        if (!insumoToDelete || !insumoToDelete.idSupply) { toast.error("Error interno al eliminar."); toggleConfirmModal(); return; }
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`Eliminando insumo...`);
        try {
            await supplyService.deleteSupply(insumoToDelete.idSupply);
            toast.success(`Insumo "${insumoToDelete.supplyName || ''}" eliminado.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            
            const updatedData = data.filter(item => item.idSupply !== insumoToDelete.idSupply);
            setData(updatedData);

            const newFilteredData = updatedData.filter(item =>
                (item?.supplyName?.toLowerCase() ?? '').includes(tableSearchText.toLowerCase()) ||
                (item?.description?.toLowerCase() ?? '').includes(tableSearchText.toLowerCase()) ||
                (item?.unitOfMeasure?.toLowerCase() ?? '').includes(tableSearchText.toLowerCase()) ||
                (getUnitLabel(item?.unitOfMeasure)?.toLowerCase() ?? '').includes(tableSearchText.toLowerCase()) ||
                (String(item?.idSupply ?? '').toLowerCase()).includes(tableSearchText.toLowerCase())
            );
            const newTotalItemsAfterDelete = newFilteredData.length;
            const newTotalPages = Math.ceil(newTotalItemsAfterDelete / ITEMS_PER_PAGE) || 1;

            if (currentPage > newTotalPages) {
                setCurrentPage(newTotalPages);
            } else if (currentItems.length === 1 && currentPage > 1 && newTotalItemsAfterDelete >=0) {
                 setCurrentPage(prev => Math.max(1, prev -1));
            } else if (newTotalItemsAfterDelete === 0) {
                 setCurrentPage(1);
            }
            toggleConfirmModal();
        } catch (error) {
            // Usar el mensaje de error específico del backend si está disponible
            const backendErrorMessage = error.message || (error.errors && error.errors[0]?.msg);
            const displayError = backendErrorMessage || "Error desconocido al eliminar.";
            toast.error(displayError, { id: toastId, icon: <XCircle className="text-danger" />, duration: 6000 });
            toggleConfirmModal();
        } finally { setIsConfirmActionLoading(false); }
    }, [data, toggleConfirmModal, currentPage, tableSearchText, getUnitLabel, currentItems.length]);

    // --- PREPARACIÓN DE CONFIRMACIÓN Y SOLICITUDES ---
    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
            if (actionFn) { actionFn(detailsToPass); }
            else { toast.error("Error interno: acción no definida."); toggleConfirmModal(); }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]);

    const requestChangeStatusConfirmation = useCallback((insumo) => {
        if (!insumo || !insumo.idSupply) return;
        const { idSupply, status: currentStatus, supplyName } = insumo; // Usar supplyName
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";
        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: <p>¿<strong>{actionText}</strong> el insumo <strong>{supplyName || 'seleccionado'}</strong>? <br /> Estado será: <strong>{futureStatusText}</strong>.</p>,
            confirmText: `Sí, ${actionText}`, confirmColor,
            itemDetails: { idSupply, currentStatus, supplyName }
        });
    }, [prepareConfirmation, executeChangeStatus]);

    const requestDeleteConfirmation = useCallback((insumo) => {
         if (!insumo || !insumo.idSupply) return;
        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: (<><p>¿Eliminar <strong>{insumo.supplyName || 'este insumo'}</strong>?</p><p><strong className="text-danger">¡Acción irreversible!</strong></p></>), // Usar supplyName
            confirmText: "Eliminar Definitivamente", confirmColor: "danger",
            itemDetails: { ...insumo }
        });
    }, [prepareConfirmation, executeDelete]);

    // --- CRUD Operation: handleSubmit (para crear/editar) ---
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return; // Validación frontend primero
        setIsSavingForm(true);
        const actionText = isEditing ? 'Actualizando' : 'Agregando';
        const toastId = toast.loading(`${actionText} insumo...`);
        try {
            const dataToSend = {
                supplyName: form.supplyName.trim(),
                description: form.description.trim() || null, // Enviar null si está vacío
                unitOfMeasure: form.unitOfMeasure,
                // 'status' se envía solo si se está editando y se quiere cambiar, o se usa el defaultValue al crear.
                // Si tu API de update espera 'status', añádelo:
                // status: form.status 
            };

            if (isEditing) {
                if (!form.idSupply) throw new Error("ID no encontrado para actualizar.");
                // Si la API de update espera el status:
                // await supplyService.updateSupply(form.idSupply, { ...dataToSend, status: form.status });
                await supplyService.updateSupply(form.idSupply, dataToSend);
            } else {
                // 'status' se toma de INITIAL_FORM_STATE (true por defecto) o el defaultValue del modelo al crear
                await supplyService.createSupply({ ...dataToSend, status: form.status });
            }

            toast.success(`Insumo ${isEditing ? 'actualizado' : 'agregado'}!`, { id: toastId });
            toggleMainModal();
            await fetchData(false);
            setCurrentPage(1); 
        } catch (error) {
            console.error("Error en handleSubmit:", error);
            let backendErrors = { ...INITIAL_FORM_ERRORS }; // Empezar con errores reseteados
            let generalErrorMessage = `Error al ${actionText.toLowerCase()} el insumo.`;

            if (error && error.errors && Array.isArray(error.errors)) {
                let specificErrorMessages = [];
                error.errors.forEach(err => {
                    if (err.path && err.msg) {
                        // El path del backend (ej. 'supplyName') ya coincide con las claves de formErrors
                        backendErrors[err.path] = true; 
                        specificErrorMessages.push(err.msg);
                    }
                });
                if (specificErrorMessages.length > 0) {
                    // Tomar el primer mensaje específico para el general del alert si es más descriptivo
                    backendErrors.general = specificErrorMessages[0]; 
                    // Para el toast, podríamos unir todos o mostrar el primero
                    generalErrorMessage = specificErrorMessages.join(" \n");
                } else if (error.message) { // Si no hay array 'errors' pero sí un 'message'
                    backendErrors.general = error.message;
                    generalErrorMessage = error.message;
                } else {
                    backendErrors.general = "Error desconocido desde el backend.";
                    generalErrorMessage = backendErrors.general;
                }
            } else if (error && error.message) {
                backendErrors.general = error.message;
                generalErrorMessage = error.message;
            } else {
                backendErrors.general = "Ocurrió un error inesperado.";
                generalErrorMessage = backendErrors.general;
            }
            
            setFormErrors(backendErrors);
            toast.error(<div><strong>Error:</strong><br/>{generalErrorMessage.replace(/\n/g, "<br/>")}</div>, { id: toastId, duration: 6000 });

        } finally {
            setIsSavingForm(false);
        }
    }, [form, isEditing, validateForm, toggleMainModal, fetchData]);

    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm();
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm]);

    const openEditModal = useCallback((insumo) => {
        setForm({ // Mapear los campos del insumo (que vienen con nombres del modelo) al estado del form
            idSupply: insumo.idSupply || '',
            supplyName: insumo.supplyName || '',
            description: insumo.description || '',
            unitOfMeasure: insumo.unitOfMeasure || '',
            status: insumo.status !== undefined ? insumo.status : true,
        });
        setIsEditing(true); 
        clearFormErrors();
        setModalOpen(true);
    }, [clearFormErrors]);

     useEffect(() => {
         if (!isLoading && currentPage > totalPages && totalPages > 0) {
             setCurrentPage(totalPages);
         }
     }, [isLoading, currentPage, totalPages]);

    // --- Render Logic Variables ---
    const modalTitle = isEditing ? `Editar Insumo (${form.supplyName || form.idSupply})` : "Agregar Nuevo Insumo";
    const submitButtonText = isSavingForm
        ? <><Spinner size="sm" className="me-1" /> Guardando...</>
        : (isEditing ? <><Edit size={18} className="me-1"/> Actualizar</> : <><Plus size={18} className="me-1"/> Guardar</>);
    const canSubmitForm = !isSavingForm;

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
            
            <InsumosPageHeader
                tableSearchText={tableSearchText}
                handleTableSearch={handleTableSearch}
                openAddModal={openAddModal}
                isLoading={isLoading}
                dataLength={data.length}
            />

            <InsumosTable
                isLoading={isLoading}
                currentItems={currentItems}
                dataLength={data.length}
                tableSearchText={tableSearchText}
                getUnitLabel={getUnitLabel}
                requestChangeStatusConfirmation={requestChangeStatusConfirmation}
                openEditModal={openEditModal} // Pasa la función correcta
                requestDeleteConfirmation={requestDeleteConfirmation}
                isConfirmActionLoading={isConfirmActionLoading}
            />

            {totalPages > 1 && !isLoading && currentItems.length > 0 && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            <InsumoFormModal
                modalOpen={modalOpen}
                toggleMainModal={toggleMainModal}
                isEditing={isEditing}
                modalTitle={modalTitle}
                form={form} // form ya usa supplyName, description, etc.
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                formErrors={formErrors} // formErrors ya usa supplyName, description, etc.
                unitOfMeasures={unitOfMeasures}
                isSavingForm={isSavingForm}
                submitButtonText={submitButtonText}
                canSubmitForm={canSubmitForm}
            />
            
            <ConfirmationModal
                isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title}
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()}
                confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor}
                isConfirming={isConfirmActionLoading}
            >
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default Insumos;