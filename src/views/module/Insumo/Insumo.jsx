// src/views/module/Insumos/Insumos.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../assets/css/App.css"; // Ajusta la ruta si es necesario
import { Container, Spinner } from 'reactstrap';
import { CheckCircle, Edit, Plus, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Servicios ---
import supplyService from '../../services/supplyService'; // Ajusta la ruta si es necesario

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination'; // Ajusta la ruta si es necesario
import { ConfirmationModal } from '../../General/ConfirmationModal'; // Ajusta la ruta si es necesario

// --- Subcomponentes de Insumos ---
import InsumosPageHeader from './InsumosPageHeader';
import InsumosTable from './InsumosTable';
import InsumoFormModal from './InsumoFormModal';

// --- Constantes ---
const INITIAL_FORM_STATE = {
    idSupply: '',
    supplyName: '',
    description: '',
    unitOfMeasure: '',
    status: true,
};

const INITIAL_FORM_ERRORS = {
    supplyName: '',
    description: '',
    unitOfMeasure: '',
    general: '',
};

const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null,
};

const ITEMS_PER_PAGE = 5;

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
    const unitOfMeasures = useMemo(() => [
        { value: 'KG', label: 'Kilogramos (KG)' },
        { value: 'GR', label: 'Gramos (GR)' },
        { value: 'L', label: 'Litros (L)' },
        { value: 'ML', label: 'Mililitros (ML)' },
        { value: 'UNIDAD', label: 'Unidad(es)' },
        { value: 'DOCENA', label: 'Docena(s)' },
    ], []);

    const unitOfMeasureMap = useMemo(() => {
        const map = {};
        unitOfMeasures.forEach(unit => { map[unit.value] = unit.label; });
        return map;
    }, [unitOfMeasures]);

    const getUnitLabel = useCallback((value) => {
        return unitOfMeasureMap[value] || value || '-';
    }, [unitOfMeasureMap]);

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        try {
            const responseData = await supplyService.getAllSupplies();
            const dataArray = Array.isArray(responseData) ? responseData : [];
            
            // <-- ¡AQUÍ ESTÁ LA SOLUCIÓN!
            // Ordenamos el array por idSupply de forma ascendente
            const sortedData = dataArray.sort((a, b) => a.idSupply - b.idSupply);
            setData(sortedData); // Guardamos los datos ya ordenados en el estado

        } catch (error) {
            console.error("Error al cargar insumos:", error);
            toast.error(`Error al cargar insumos: ${error.message || 'Error desconocido'}`);
            setData([]);
        } finally {
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Lógica de Filtrado y Paginación ---
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        const search = tableSearchText.toLowerCase();
        return data.filter(item =>
            (item?.supplyName?.toLowerCase() ?? '').includes(search) ||
            (item?.description?.toLowerCase() ?? '').includes(search) ||
            (getUnitLabel(item?.unitOfMeasure)?.toLowerCase() ?? '').includes(search) ||
            (String(item?.idSupply ?? '').toLowerCase()).includes(search)
        );
    }, [data, tableSearchText, getUnitLabel]);

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    // --- Form Helper Functions ---
    const resetForm = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
        setFormErrors(INITIAL_FORM_ERRORS);
    }, []);

    const validateForm = useCallback(() => {
        const errors = { ...INITIAL_FORM_ERRORS };
        let isValid = true;
        const trimmedName = String(form.supplyName ?? '').trim();
        const trimmedDescription = String(form.description ?? '').trim();

        if (!trimmedName) {
            errors.supplyName = "El nombre del insumo es requerido.";
            isValid = false;
        } else if (trimmedName.length < 2 || trimmedName.length > 30) {
            errors.supplyName = "El nombre debe tener entre 2 y 30 caracteres.";
            isValid = false;
        }

        if (trimmedDescription.length > 250) {
            errors.description = "La descripción no puede exceder los 250 caracteres.";
            isValid = false;
        }

        if (!form.unitOfMeasure) {
            errors.unitOfMeasure = "La unidad de medida es requerida.";
            isValid = false;
        }
        
        setFormErrors(errors);

        if (!isValid) {
            const errorMessages = [errors.supplyName, errors.description, errors.unitOfMeasure].filter(Boolean);
            toast.error(errorMessages.join('\n'));
        }

        return isValid;
    }, [form]);
    
    // --- Handlers ---
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (formErrors[name]) {
            setFormErrors(prevErr => ({ ...prevErr, [name]: '' }));
        }
    }, [formErrors]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value);
        setCurrentPage(1);
    }, []);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(pageNumber);
    }, []);

    const toggleMainModal = useCallback(() => {
        if (modalOpen) resetForm();
        setModalOpen(prev => !prev);
    }, [modalOpen, resetForm]);

    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return;
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    // --- Modal Actions ---
    const executeChangeStatus = useCallback(async (details) => {
        const { idSupply, status, supplyName } = details;
        const newStatus = !status;
        const actionText = newStatus ? "activado" : "desactivado";
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${status ? 'Desactivando' : 'Activando'} "${supplyName}"...`);
        try {
            await supplyService.changeSupplyStatus(idSupply, newStatus);
            toast.success(`Insumo "${supplyName}" ${actionText}.`, { id: toastId });
            fetchData(false); // Recargar datos sin spinner principal
        } catch (error) {
            toast.error(error.message || "Error al cambiar estado.", { id: toastId });
        } finally {
            setIsConfirmActionLoading(false);
            toggleConfirmModal();
        }
    }, [fetchData, toggleConfirmModal]);

    const executeDelete = useCallback(async (insumo) => {
        const { idSupply, supplyName } = insumo;
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`Eliminando "${supplyName}"...`);
        try {
            await supplyService.deleteSupply(idSupply);
            toast.success(`Insumo "${supplyName}" eliminado.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            fetchData(false);
        } catch (error) {
            toast.error(error.message || "Error al eliminar.", { id: toastId, icon: <XCircle className="text-danger" /> });
        } finally {
            setIsConfirmActionLoading(false);
            toggleConfirmModal();
        }
    }, [fetchData, toggleConfirmModal]);

    const prepareConfirmation = useCallback((actionFn, props) => {
        confirmActionRef.current = () => actionFn(props.itemDetails);
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [setConfirmModalOpen]);

    const requestChangeStatusConfirmation = useCallback((insumo) => {
        const actionText = insumo.status ? "desactivar" : "activar";
        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: <p>¿Seguro que desea <strong>{actionText}</strong> el insumo <strong>{insumo.supplyName}</strong>?</p>,
            confirmText: `Sí, ${actionText}`,
            confirmColor: insumo.status ? "warning" : "success",
            itemDetails: insumo
        });
    }, [prepareConfirmation, executeChangeStatus]);

    const requestDeleteConfirmation = useCallback((insumo) => {
        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: <><p>¿Está seguro de eliminar <strong>{insumo.supplyName}</strong>?</p><p className="text-danger fw-bold">Esta acción no se puede deshacer.</p></>,
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: insumo
        });
    }, [prepareConfirmation, executeDelete]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;
        setIsSavingForm(true);
        const actionText = isEditing ? 'actualizado' : 'agregado';
        const toastId = toast.loading(`${isEditing ? 'Actualizando' : 'Agregando'} insumo...`);
        try {
            const dataToSend = {
                supplyName: form.supplyName.trim(),
                description: form.description.trim() || null,
                unitOfMeasure: form.unitOfMeasure,
                status: form.status,
            };

            if (isEditing) {
                await supplyService.updateSupply(form.idSupply, dataToSend);
            } else {
                await supplyService.createSupply(dataToSend);
            }
            toast.success(`Insumo ${actionText} correctamente.`, { id: toastId });
            toggleMainModal();
            fetchData(false);
        } catch (error) {
            toast.error(error.message || `Error al ${isEditing ? 'actualizar' : 'agregar'}.`, { id: toastId });
        } finally {
            setIsSavingForm(false);
        }
    }, [form, isEditing, validateForm, toggleMainModal, fetchData]);

    // --- Modal Opening ---
    const openAddModal = useCallback(() => {
        resetForm();
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm]);

    const openEditModal = useCallback((insumo) => {
        setForm({
            idSupply: insumo.idSupply,
            supplyName: insumo.supplyName || '',
            description: insumo.description || '',
            unitOfMeasure: insumo.unitOfMeasure || '',
            status: insumo.status,
        });
        setIsEditing(true);
        setFormErrors(INITIAL_FORM_ERRORS);
        setModalOpen(true);
    }, []);

    useEffect(() => {
        if (!isLoading && validCurrentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [isLoading, totalPages, validCurrentPage]);

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
                dataLength={filteredData.length}
                tableSearchText={tableSearchText}
                getUnitLabel={getUnitLabel}
                requestChangeStatusConfirmation={requestChangeStatusConfirmation}
                openEditModal={openEditModal}
                requestDeleteConfirmation={requestDeleteConfirmation}
                isConfirmActionLoading={isConfirmActionLoading}
            />

            {totalPages > 1 && !isLoading && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            <InsumoFormModal
                modalOpen={modalOpen}
                toggleMainModal={toggleMainModal}
                isEditing={isEditing}
                modalTitle={isEditing ? `Editar Insumo` : "Agregar Nuevo Insumo"}
                form={form}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                formErrors={formErrors}
                unitOfMeasures={unitOfMeasures}
                isSavingForm={isSavingForm}
                submitButtonText={isSavingForm ? "Guardando..." : (isEditing ? "Actualizar" : "Guardar")}
                canSubmitForm={!isSavingForm}
            />
            
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

export default Insumos;