// src/views/module/Insumos/Insumos.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../assets/css/App.css"; // Ajusta la ruta si es necesario
import { Container, Spinner } from 'reactstrap';
import { AlertTriangle, CheckCircle, XCircle, Edit, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Servicios ---
import supplyService from '../../services/supplyService'; // Ajusta la ruta si es necesario

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination'; // Ajusta la ruta si es necesario
import { ConfirmationModal } from '../../General/ConfirmationModal'; // Ajusta la ruta si es necesario

// --- Subcomponentes de Insumos ---
import InsumosPageHeader from './InsumosPageHeader'; // Asumiendo que están en una carpeta 'components'
import InsumosTable from './InsumosTable';
import InsumoFormModal from './InsumoFormModal';

// --- Constantes ---
const INITIAL_FORM_STATE = {
    idSupply: '',
    supplyName: '',
    description: '',
    unitOfMeasure: '', // Corregido: Coincide con el modelo y la lógica del backend
    status: true,
};

const INITIAL_FORM_ERRORS = {
    supplyName: false,
    description: false,
    unitOfMeasure: false, // Corregido
    general: '',
};

const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null,
};

const ITEMS_PER_PAGE = 7;

const Insumos = () => {
    // --- State ---
    const [data, setData] = useState([]);
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
    // Renombrado 'measurementUnits' a 'unitOfMeasures' por consistencia
    const unitOfMeasures = useMemo(() => [
        { value: 'KG', label: 'Kilogramos (KG)' }, // Usar valores que coincidan con el backend (ej. KG, L, UNIDAD)
        { value: 'GR', label: 'Gramos (GR)' },
        { value: 'L', label: 'Litros (L)' },
        { value: 'ML', label: 'Mililitros (ML)' },
        { value: 'UNIDAD', label: 'Unidad(es)' },
        { value: 'DOCENA', label: 'Docena(s)' },
        // Añade todas las unidades que necesites, asegurándote que los 'value' coincidan con lo que espera/guarda el backend
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
            (item?.unitOfMeasure?.toLowerCase() ?? '').includes(search) || // Corregido
            (getUnitLabel(item?.unitOfMeasure)?.toLowerCase() ?? '').includes(search) || // Corregido
            (String(item?.idSupply ?? '').toLowerCase()).includes(search)
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
            // Asumimos que getAllSupplies devuelve objetos con: idSupply, supplyName, description, unitOfMeasure, status
            const responseData = await supplyService.getAllSupplies();
            setData(Array.isArray(responseData) ? responseData : []);
        } catch (error) {
            console.error("Error al cargar insumos:", error);
            toast.error(`Error al cargar insumos: ${error.message || 'Error desconocido'}`);
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
    }, [INITIAL_FORM_STATE, INITIAL_FORM_ERRORS]); // Asegurar dependencias correctas

    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), [INITIAL_FORM_ERRORS]);

    const validateForm = useCallback(() => {
        const errors = { ...INITIAL_FORM_ERRORS }; // Copiar para no mutar
        let isValid = true;
        const trimmedName = String(form.supplyName ?? '').trim();
        const trimmedDescription = String(form.description ?? '').trim();

        if (!trimmedName) {
            errors.supplyName = true; isValid = false; errors.general = "El nombre del insumo es requerido.";
        }if  (!trimmedName) {
            errors.supplyName = "El nombre del insumo es requerido.";
        } else if (trimmedName.length < 2 || trimmedName.length > 30) {
            // Aquí está la validación de longitud que coincide con tu backend
            errors.supplyName = "El nombre del insumo debe tener entre 2 y 30 caracteres.";
        }

        if (trimmedDescription.length > 250) {
             errors.description = true; isValid = false; errors.general = (errors.general ? errors.general + " " : "") + "La descripción no puede exceder los 250 caracteres.";
        }

        if (!form.unitOfMeasure) { // Corregido
            errors.unitOfMeasure = true; isValid = false; errors.general = (errors.general ? errors.general + " " : "") + "La unidad de medida es requerida.";
        }

        setFormErrors(errors);
        if (!isValid && errors.general) { // Solo mostrar toast si hay un mensaje general
            toast.error(errors.general.split(". ").join(".\n"));
        }
        return isValid;
    }, [form, INITIAL_FORM_ERRORS]); // Asegurar dependencias correctas

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setForm(prev => ({ ...prev, [name]: val }));
        if (formErrors[name] || formErrors.general) { // Limpiar errores al escribir
            setFormErrors(prevErr => ({ ...prevErr, [name]: false, general: '' }));
        }
    }, [formErrors]); // Asegurar dependencias correctas

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
        if (closing) { resetForm(); } // Resetear solo si se estaba cerrando
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
    }, [confirmModalOpen, isConfirmActionLoading, INITIAL_CONFIRM_PROPS]);
    
    // --- FUNCIONES DE EJECUCIÓN DE ACCIONES ---
    const executeChangeStatus = useCallback(async (details) => {
        if (!details || !details.idSupply) { toast.error("Error interno al cambiar estado."); toggleConfirmModal(); return; }
        const { idSupply, status: currentStatus, supplyName } = details;
        const newStatus = !currentStatus;
        const actionText = newStatus ? "activado" : "desactivado";
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${currentStatus ? 'Desactivando' : 'Activando'} insumo "${supplyName || ''}"...`);
        try {
            await supplyService.changeSupplyStatus(idSupply, newStatus);
            // Actualizar localmente para reflejar el cambio inmediatamente
            setData(prevData => prevData.map(item => item.idSupply === idSupply ? { ...item, status: newStatus } : item));
            toast.success(`Insumo "${supplyName || ''}" ${actionText}.`, { id: toastId });
        } catch (error) {
            const errorMsg = error.message || "Error desconocido al cambiar estado.";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsConfirmActionLoading(false);
            toggleConfirmModal(); // Cerrar modal independientemente del resultado
        }
    }, [toggleConfirmModal, setData]); // Añadido setData

    const executeDelete = useCallback(async (insumoToDelete) => {
        if (!insumoToDelete || !insumoToDelete.idSupply) { toast.error("Error interno al eliminar."); toggleConfirmModal(); return; }
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`Eliminando insumo "${insumoToDelete.supplyName || ''}"...`);
        try {
            await supplyService.deleteSupply(insumoToDelete.idSupply);
            toast.success(`Insumo "${insumoToDelete.supplyName || ''}" eliminado.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            
            // Actualizar datos locales y paginación
            setData(prevData => prevData.filter(item => item.idSupply !== insumoToDelete.idSupply));
            // La lógica de ajuste de página se puede simplificar o manejar con un useEffect que dependa de 'data' o 'filteredData.length'
            // Para simplificar, podemos refetchear o confiar en que el estado se actualice bien.
            // Por ahora, la lógica de ajuste de página que tenías:
            // Esto puede ser complejo, considera llamar a fetchData(false) o manejarlo de forma más robusta.
            // Una solución simple es, si después de eliminar la página actual queda vacía y no es la primera, ir a la anterior.
            if (currentItems.length === 1 && validCurrentPage > 1 && filteredData.length -1 < ((validCurrentPage -1) * ITEMS_PER_PAGE +1) ) {
                 setCurrentPage(prev => Math.max(1, prev -1));
            }

        } catch (error) {
            const backendErrorMessage = error.message || (error.response?.data?.message) || (error.response?.data?.errors && error.response.data.errors[0]?.msg);
            const displayError = backendErrorMessage || "Error desconocido al eliminar.";
            toast.error(displayError, { id: toastId, icon: <XCircle className="text-danger" />, duration: 6000 });
        } finally {
            setIsConfirmActionLoading(false);
            toggleConfirmModal();
        }
    }, [toggleConfirmModal, setData, currentItems.length, validCurrentPage, filteredData.length]); // Dependencias actualizadas

    // --- PREPARACIÓN DE CONFIRMACIÓN Y SOLICITUDES ---
    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails; // Asegurar que itemDetails se pasa correctamente
        confirmActionRef.current = () => {
            if (actionFn) { actionFn(detailsToPass); } // Pasar detailsToPass a la acción
            else { toast.error("Error interno: acción no definida."); toggleConfirmModal(); }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]); // Solo toggleConfirmModal como dependencia

    const requestChangeStatusConfirmation = useCallback((insumo) => {
        if (!insumo || insumo.idSupply === undefined) return; // Comprobar idSupply
        const { idSupply, status: currentStatus, supplyName } = insumo;
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";
        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: <p>¿<strong>{actionText}</strong> el insumo <strong>{supplyName || 'seleccionado'}</strong>? <br /> Estado será: <strong>{futureStatusText}</strong>.</p>,
            confirmText: `Sí, ${actionText}`, confirmColor,
            itemDetails: { idSupply, status: currentStatus, supplyName } // Pasar el objeto completo o lo necesario
        });
    }, [prepareConfirmation, executeChangeStatus]);

    // --- AÑADIDA LA FUNCIÓN requestDeleteConfirmation ---
    const requestDeleteConfirmation = useCallback((insumo) => {
        if (!insumo || insumo.idSupply === undefined) {
            toast.error("No se puede eliminar un insumo no especificado.");
            return;
        }
        prepareConfirmation(
            executeDelete,
            {
                title: "Confirmar Eliminación",
                message: (
                    <>
                        <p>¿Está seguro que desea eliminar el insumo <strong>{insumo.supplyName || `ID: ${insumo.idSupply}`}</strong>?</p>
                        <p className="text-danger fw-bold">Esta acción no se puede deshacer.</p>
                    </>
                ),
                confirmText: "Eliminar Definitivamente",
                confirmColor: "danger",
                itemDetails: { ...insumo } // Pasar el insumo completo
            }
        );
    }, [prepareConfirmation, executeDelete]);
    // --- FIN DE LA FUNCIÓN AÑADIDA ---

    // --- SUBMIT (Agregar/Editar) - CORREGIDO Y CONSISTENTE ---
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;
        setIsSavingForm(true);
        const actionText = isEditing ? 'Actualizando' : 'Agregando';
        const toastId = toast.loading(`${actionText} insumo...`);
        try {
            const dataToSend = {
                supplyName: form.supplyName.trim(),
                description: form.description.trim() || null,
                unitOfMeasure: form.unitOfMeasure, // Corregido
                // El backend se encarga del status por defecto al crear,
                // y lo enviamos explícitamente al actualizar.
            };

            if (isEditing) {
                if (form.idSupply === null || form.idSupply === undefined || form.idSupply === '') {
                    throw new Error("ID del insumo no encontrado para la actualización.");
                }
                // Incluir el estado actual del formulario para la actualización
                await supplyService.updateSupply(form.idSupply, { ...dataToSend, status: form.status });
            } else {
                // Para la creación, el 'status' se toma del INITIAL_FORM_STATE si no se cambia,
                // o el backend puede tener un defaultValue. Enviamos el estado del formulario.
                await supplyService.createSupply({ ...dataToSend, status: form.status });
            }

            toast.success(`Insumo ${isEditing ? 'actualizado' : 'agregado'}!`, { id: toastId });
            toggleMainModal(); // Cierra el modal y resetea el formulario
            await fetchData(false); // Recargar datos sin el spinner principal
            setCurrentPage(1); // Opcional: ir a la primera página después de agregar/editar
        } catch (error) {
            console.error("Error en handleSubmit:", error);
            let backendErrors = { ...INITIAL_FORM_ERRORS };
            let generalErrorMessage = `Error al ${actionText.toLowerCase()} el insumo.`;

            const errData = error.response?.data;
            if (errData) {
                if (errData.errors && Array.isArray(errData.errors)) { // Errores de express-validator
                    let specificMessages = [];
                    errData.errors.forEach(e => {
                        if (e.path && INITIAL_FORM_ERRORS.hasOwnProperty(e.path)) backendErrors[e.path] = true;
                        specificMessages.push(e.msg);
                    });
                    generalErrorMessage = specificMessages.join(" \n") || generalErrorMessage;
                    if (specificMessages.length > 0) backendErrors.general = specificMessages[0]; // Mostrar el primer error específico
                } else if (errData.message) { // Otros errores del backend con un campo 'message'
                    generalErrorMessage = errData.message;
                    backendErrors.general = errData.message;
                }
            } else if (error.message) { // Errores de red u otros errores de JS
                generalErrorMessage = error.message;
                backendErrors.general = error.message;
            }
            
            setFormErrors(backendErrors);
            toast.error(<div><strong>Error:</strong><br/>{generalErrorMessage.replace(/\n/g, "<br/>")}</div>, { id: toastId, duration: 6000 });
        } finally {
            setIsSavingForm(false);
        }
    }, [form, isEditing, validateForm, toggleMainModal, fetchData, INITIAL_FORM_ERRORS, setData, setCurrentPage]); // Dependencias actualizadas
    // --- FIN DE SUBMIT ---

    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm(); // Llama a setForm(INITIAL_FORM_STATE) y setFormErrors(INITIAL_FORM_ERRORS)
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm]);

    const openEditModal = useCallback((insumo) => {
        // Mapear los campos del insumo que vienen del backend al estado del form
        setForm({
            idSupply: insumo.idSupply || '',
            supplyName: insumo.supplyName || '',
            description: insumo.description || '',
            unitOfMeasure: insumo.unitOfMeasure || '', // Corregido
            status: insumo.status !== undefined ? insumo.status : true,
        });
        setIsEditing(true); 
        clearFormErrors(); // Limpiar errores de validaciones anteriores
        setModalOpen(true);
    }, [clearFormErrors]);

     useEffect(() => {
         // Ajustar página actual si se queda fuera de rango después de eliminar o filtrar
         if (!isLoading && data.length > 0 && validCurrentPage > totalPages) {
             setCurrentPage(totalPages);
         } else if (!isLoading && data.length === 0 && currentPage !==1) {
            setCurrentPage(1); // Si no hay datos, ir a la página 1
         }
     }, [isLoading, data, totalPages, validCurrentPage, currentPage]); // Dependencias actualizadas

    // --- Render Logic Variables ---
    const modalTitle = isEditing ? `Editar Insumo (${form.supplyName || form.idSupply || ''})` : "Agregar Nuevo Insumo";
    const submitButtonText = isSavingForm
        ? <><Spinner size="sm" className="me-1" /> Guardando...</>
        : (isEditing ? <><Edit size={18} className="me-1"/> Actualizar</> : <><Plus size={18} className="me-1"/> Guardar</>);
    const canSubmitForm = !isSavingForm;

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500, style: { maxWidth: 600 } }} />
            
            <InsumosPageHeader
                tableSearchText={tableSearchText}
                handleTableSearch={handleTableSearch}
                openAddModal={openAddModal}
                isLoading={isLoading}
                dataLength={data.length} // Pasar data.length para deshabilitar búsqueda si no hay datos
            />

            <InsumosTable
                isLoading={isLoading}
                currentItems={currentItems}
                dataLength={filteredData.length} // Pasar filteredData.length para el mensaje de "no hay insumos"
                tableSearchText={tableSearchText}
                getUnitLabel={getUnitLabel}
                requestChangeStatusConfirmation={requestChangeStatusConfirmation}
                openEditModal={openEditModal}
                requestDeleteConfirmation={requestDeleteConfirmation} // Prop añadida
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
                form={form}
                handleChange={handleChange}
                handleSubmit={handleSubmit} // Se pasa la función corregida
                formErrors={formErrors}
                unitOfMeasures={unitOfMeasures} // Corregido el nombre de la prop
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