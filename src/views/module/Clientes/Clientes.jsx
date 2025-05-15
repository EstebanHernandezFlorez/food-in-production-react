import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; // Asegúrate que la ruta es correcta
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
} from "reactstrap";
// Usaremos los mismos iconos que en Proveedores para consistencia
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Import ---
import clientesService from '../../services/clientesService'; // Asegúrate que la ruta es correcta

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination'; // Asume que está en la misma carpeta que el de Proveedores
import FondoForm from "../../../assets/login.jpg"; // Reutiliza la imagen o cambia si tienes una específica para clientes

// --- Confirmation Modal Component (igual que en Proveedores) ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
             <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : (confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>
            {children}
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>
                Cancelar
            </Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? (
                    <><Spinner size="sm" className="me-1"/> Procesando...</>
                ) : (
                    confirmText
                )}
            </Button>
        </ModalFooter>
    </Modal>
);

// --- Constants ---
// Estado inicial adaptado para Clientes
const INITIAL_FORM_STATE = {
    id: "", // Usaremos 'id' como en el código original de Clientes
    NombreCompleto: "",
    Distintivo: "",
    CategoriaCliente: "", // Campo específico de Clientes
    Celular: "",
    Correo: "",
    Direccion: "",
    Estado: "Activo", // Mantén 'Activo'/'Inactivo' como en el código original de Clientes
};

// Errores iniciales adaptados para Clientes
const INITIAL_FORM_ERRORS = {
    NombreCompleto: false,
    Distintivo: false,
    CategoriaCliente: false,
    Celular: false, // Opcional?
    Correo: false, // Opcional?
    Direccion: false, // Opcional?
};

const INITIAL_CONFIRM_PROPS = {
    title: "",
    message: null,
    confirmText: "Confirmar",
    confirmColor: "primary",
    itemDetails: null,
};

// Opciones para el select de Categoría Cliente
const CATEGORIAS_CLIENTE = [
    { value: "Familiar", label: "Familiar" },
    { value: "Empresarial", label: "Empresarial" },
    { value: "Preferencial", label: "Preferencial" },
    { value: "Nuevo", label: "Nuevo" },
];

const ITEMS_PER_PAGE = 5; // Puedes ajustar esto

// --- Main Component ---
const Clientes = () => {
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

    // --- Refs ---
    const confirmActionRef = useRef(null); // Almacena la función a ejecutar en confirmación

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        console.log("[FETCH] Fetching clients...");
        try {
            // Usa el servicio de clientes y espera el formato frontend
            const clientes = await clientesService.getAllClientes();
            setData(clientes || []);
            console.log("[FETCH] Clients loaded:", clientes);
        } catch (error) {
            console.error("[FETCH ERROR] Failed to load clients:", error);
            toast.error("Error al cargar clientes. Verifique la conexión.");
            setData([]); // Asegura que data es un array incluso en error
        } finally {
             if (showLoadingSpinner) setIsLoading(false);
             console.log("[FETCH] Fetching finished.");
        }
    }, []); // No tiene dependencias externas que cambien

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Form Helper Functions ---
    const resetForm = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
    }, []);

    const clearFormErrors = useCallback(() => {
        setFormErrors(INITIAL_FORM_ERRORS);
    }, []);

    // Validación adaptada para Clientes
    const validateForm = useCallback(() => {
        // 1. Asegurar que los valores sean strings antes de trim/validar (manejar null/undefined)
        const nombreCompletoString = String(form.NombreCompleto ?? '').trim();
        const distintivoString = String(form.Distintivo ?? '').trim();
        const celularString = String(form.Celular ?? '').trim();
        const correoString = String(form.Correo ?? '').trim();
        const direccionString = String(form.Direccion ?? '').trim(); // Aunque opcional, validar si se ingresa

        // 2. Realizar las validaciones
        const errors = {
            NombreCompleto: !nombreCompletoString, // Requerido
            Distintivo: !distintivoString,         // Requerido
            CategoriaCliente: !form.CategoriaCliente, // Requerido (Select)
            // Validaciones opcionales pero con formato correcto si se ingresan
            Celular: celularString && !/^\d{10}$/.test(celularString), // 10 dígitos si no está vacío
            Correo: correoString && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoString), // Formato email si no está vacío
            Direccion: false, // No marcamos error si está vacío, ya que es opcional
        };

        setFormErrors(errors);
        // Devuelve true si NO hay errores en los campos REQUERIDOS y
        // si los campos opcionales INGRESADOS tienen formato válido.
        return !errors.NombreCompleto && !errors.Distintivo && !errors.CategoriaCliente &&
               !errors.Celular && !errors.Correo;

    }, [form]);

    // --- Event Handlers ---
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
        // Limpia el error específico del campo al cambiarlo
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: false }));
        }
    }, [formErrors]); // Depende de formErrors para poder limpiarlo

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1); // Reset page on new search
    }, []);

    // --- Modal Toggles (igual que Proveedores) ---
    const toggleMainModal = useCallback(() => {
        const closing = modalOpen;
        setModalOpen(prev => !prev);
        if (closing) {
            resetForm();
            clearFormErrors();
            setIsEditing(false);
        }
    }, [modalOpen, resetForm, clearFormErrors]);

    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return; // No permitir cerrar si está procesando
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    // --- Effect to Reset Confirmation Modal State When Closed (igual que Proveedores) ---
     useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    // --- Confirmation Preparation (igual que Proveedores) ---
    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
            if (actionFn) {
                actionFn(detailsToPass); // Pasa los detalles a la función de ejecución
            } else {
                 console.error("[CONFIRM ACTION] actionFn is null or undefined in ref execution.");
                 toast.error("Error interno al intentar ejecutar la acción confirmada.");
                 toggleConfirmModal();
            }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]); // Incluye toggleConfirmModal por si se usa en el error

    // --- CRUD Operations (adaptadas para Clientes) ---

    // ADD CLIENT (Submit Handler)
    const handleSubmit = useCallback(async () => {
        console.log("[ADD CLIENT] Attempting submit:", form);
        if (!validateForm()) {
            toast.error("Por favor, complete los campos requeridos correctamente.", { duration: 4000 });
            return;
        }

        // Opcional: Añadir validación de duplicados si es necesario (ej. por Correo o Celular si son únicos)
        // const correoExistente = data.some(c => c.Correo && c.Correo.toLowerCase() === String(form.Correo ?? '').trim().toLowerCase());
        // if (correoExistente) {
        //     toast.error("Ya existe un cliente con este correo electrónico.", { duration: 4000 });
        //     setFormErrors(prev => ({ ...prev, Correo: true }));
        //     return;
        // }

        const toastId = toast.loading('Agregando cliente...');
        try {
            // El servicio espera el objeto con formato frontend ('Activo'/'Inactivo')
            // Aseguramos que se cree como 'Activo' y excluimos el 'id'
            const { id, ...newClientData } = form;
            const clientToSend = { ...newClientData, Estado: 'Activo' }; // Forzar estado Activo al crear

            console.log("[ADD CLIENT] Calling service with:", clientToSend);
            await clientesService.createCliente(clientToSend); // Llama al servicio de clientes

            toast.success("Cliente agregado exitosamente!", { id: toastId });
            toggleMainModal(); // Cierra modal principal
            await fetchData(false); // Recarga datos sin spinner de pantalla completa
            setCurrentPage(1); // Vuelve a la primera página

        } catch (error) {
            console.error("[ADD CLIENT ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al agregar: ${errorMsg}`, { id: toastId, duration: 5000 });
        }
    }, [form, data, validateForm, toggleMainModal, fetchData]); // Añadir 'data' si se hace validación de duplicados

    // EDIT CLIENT (Request Confirmation)
    const requestEditConfirmation = useCallback(() => {
        console.log("[EDIT CLIENT REQ] Requesting confirmation for:", form);
        if (!validateForm()) {
           toast.error("Por favor, complete los campos requeridos correctamente.", { duration: 4000 });
           return;
        }

        // Opcional: Validar duplicados excluyendo el cliente actual si es necesario
        // const currentId = form.id;
        // const correoExistente = data.some(c =>
        //     c.id !== currentId &&
        //     c.Correo &&
        //     c.Correo.toLowerCase() === String(form.Correo ?? '').trim().toLowerCase()
        // );
        // if (correoExistente) {
        //    toast.error("Ya existe otro cliente con este correo electrónico.", { duration: 4000 });
        //    setFormErrors(prev => ({ ...prev, Correo: true }));
        //    return;
        // }

        if (!form.id) {
            console.error("[EDIT CLIENT REQ ERROR] Client ID (id) missing.");
            toast.error("Error interno: No se puede identificar el cliente a editar.");
            return;
        }

        // Prepara la confirmación pasando la función de ejecución y los datos del formulario
        prepareConfirmation(executeEdit, {
            title: "Confirmar Actualización",
            message: <p>¿Está seguro que desea guardar los cambios para <strong>{form.NombreCompleto || 'este cliente'}</strong>?</p>,
            confirmText: "Confirmar Cambios",
            confirmColor: "primary",
            itemDetails: { ...form } // Pasa una copia de los datos actuales del formulario
        });
    }, [form, data, validateForm, prepareConfirmation]); // Añadir 'data' si se valida duplicidad

    // EDIT CLIENT (Execute Action)
    const executeEdit = useCallback(async (clientToUpdate) => {
        console.log("[EDIT CLIENT EXEC] Attempting execution with received data:", clientToUpdate);

        // Valida el argumento recibido, no el estado
        if (!clientToUpdate || !clientToUpdate.id) {
             console.error("[EDIT CLIENT EXEC ERROR] Missing client data or ID in received argument.", clientToUpdate);
             toast.error("Error interno: Datos para actualizar no encontrados.");
             toggleConfirmModal(); // Cierra modal de confirmación
             return;
        }

        setIsConfirmActionLoading(true); // Inicia el estado de carga para la confirmación
        const toastId = toast.loading('Actualizando cliente...');

        try {
            // El servicio de clientes espera el ID y el objeto con formato frontend
            console.log("[EDIT CLIENT EXEC] Calling service with ID:", clientToUpdate.id, "Data:", clientToUpdate);
            await clientesService.updateCliente(clientToUpdate.id, clientToUpdate); // Llama al servicio de clientes

            toast.success("Cliente actualizado exitosamente!", { id: toastId });
            toggleConfirmModal(); // Cierra modal de confirmación
            toggleMainModal();    // Cierra modal de formulario principal
            await fetchData(false); // Recarga datos

        } catch (error) {
            console.error("[EDIT CLIENT EXEC ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al actualizar: ${errorMsg}`, { id: toastId, duration: 5000 });
            toggleConfirmModal(); // Cierra modal de confirmación en caso de error
        } finally {
             setIsConfirmActionLoading(false); // Finaliza el estado de carga
        }
    }, [toggleConfirmModal, toggleMainModal, fetchData]); // No depende de confirmModalProps

    // CHANGE STATUS (Request Confirmation)
    const requestChangeStatusConfirmation = useCallback((idCliente, currentStatus, nombreCliente) => {
        if (!idCliente) {
            console.error("[STATUS CLIENT REQ ERROR] Invalid client ID:", idCliente);
            return;
        }
        console.log(`[STATUS CLIENT REQ] Requesting change for ID: ${idCliente}, Current Status: ${currentStatus}`);
        // Determina la acción y el color basado en el estado actual ('Activo'/'Inactivo')
        const isCurrentlyActive = currentStatus === "Activo";
        const actionText = isCurrentlyActive ? "desactivar" : "activar";
        const futureStatusText = isCurrentlyActive ? "Inactivo" : "Activo";
        const confirmColor = isCurrentlyActive ? "warning" : "success"; // warning para desactivar, success para activar
        const IconComponent = isCurrentlyActive ? UserX : UserCheck; // Íconos apropiados

        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: (
                <p>¿Está seguro que desea <strong>{actionText}</strong> al cliente <strong>{nombreCliente || 'seleccionado'}</strong>? <br /> Su nuevo estado será: <strong>{futureStatusText}</strong>.</p>
            ),
            confirmText: (
                <>
                  <IconComponent size={16} className="me-1" />
                  {`Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`}
                </>
            ),
            confirmColor: confirmColor,
            itemDetails: { idCliente, currentStatus, nombreCliente, futureStatusText } // Pasa los detalles necesarios
        });
    }, [prepareConfirmation]);

    // CHANGE STATUS (Execute Action)
    const executeChangeStatus = useCallback(async (details) => {
        console.log("[STATUS CLIENT EXEC] Attempting execution with received details:", details);

        if (!details || !details.idCliente) {
            console.error("[STATUS CLIENT EXEC ERROR] Missing details or client ID in received argument.", details);
            toast.error("Error interno: No se pudieron obtener los detalles para cambiar el estado.", { duration: 5000 });
            toggleConfirmModal();
            return;
        }

        const { idCliente, currentStatus, nombreCliente, futureStatusText } = details;
        // El servicio espera el nuevo estado en formato frontend ('Activo' o 'Inactivo')
        const newStatusFrontend = futureStatusText;
        const actionText = currentStatus === "Activo" ? "desactivar" : "activar";

        console.log(`[STATUS CLIENT EXEC] Executing for ID: ${idCliente} to New Status: ${newStatusFrontend}`);
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo cliente...`);

        try {
            console.log("[STATUS CLIENT EXEC] Calling service changeStateCliente with ID:", idCliente, "New Status:", newStatusFrontend);
            await clientesService.changeStateCliente(idCliente, newStatusFrontend); // Llama al servicio de clientes

            toast.success(`Cliente ${nombreCliente || ''} ${actionText === 'activar' ? 'activado' : 'desactivado'} correctamente.`, { id: toastId });
            toggleConfirmModal(); // Cierra modal de confirmación
            await fetchData(false); // Recarga datos

        } catch (error) {
            console.error("[STATUS CLIENT EXEC ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al ${actionText}: ${errorMsg}`, { id: toastId, duration: 5000 });
            toggleConfirmModal(); // Cierra modal de confirmación en error
        } finally {
            setIsConfirmActionLoading(false);
            console.log("[STATUS CLIENT EXEC] Execution finished.");
        }
    }, [toggleConfirmModal, fetchData]); // No depende de confirmModalProps

    // DELETE CLIENT (Request Confirmation)
    const requestDeleteConfirmation = useCallback(async (cliente) => {
        if (!cliente || !cliente.id) {
            console.error("[DELETE CLIENT REQ ERROR] Invalid client data received:", cliente);
            return;
        }
        console.log("[DELETE CLIENT REQ] Requesting confirmation for client:", JSON.stringify(cliente));

        // **Importante:** A diferencia de Proveedores, el código original de Clientes no verifica asociaciones antes de eliminar.
        // Mantenemos ese comportamiento a menos que se requiera añadir la verificación.
        // Si se necesitara, aquí iría la llamada a un `clientesService.isClienteAssociated...`

        console.log("[DELETE CLIENT REQ] Proceeding with confirmation setup.");
        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: (
                <>
                    <p>¿Está seguro que desea eliminar permanentemente al cliente <strong>{cliente.NombreCompleto || 'seleccionado'}</strong>?</p>
                    <p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p>
                </>
            ),
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: { ...cliente } // Pasa una copia de los detalles del cliente
        });

    }, [prepareConfirmation]);

    // DELETE CLIENT (Execute Action)
    const executeDelete = useCallback(async (clienteToDelete) => {
        console.log("[DELETE CLIENT EXEC] Attempting execution with received data:", JSON.stringify(clienteToDelete));

        if (!clienteToDelete || !clienteToDelete.id) {
             console.error("[DELETE CLIENT EXEC ERROR] Missing client data or ID in received argument.", clienteToDelete);
             toast.error("Error interno: Datos para eliminar no encontrados.");
             toggleConfirmModal();
             return;
        }
        console.log("[DELETE CLIENT EXEC] Executing delete for client:", JSON.stringify(clienteToDelete));

        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Eliminando cliente...');

        try {
            console.log("[DELETE CLIENT EXEC] Calling service deleteCliente with ID:", clienteToDelete.id);
            await clientesService.deleteCliente(clienteToDelete.id); // Llama al servicio de clientes

            toast.success(`Cliente "${clienteToDelete.NombreCompleto}" eliminado correctamente.`, {
                id: toastId, icon: <CheckCircle className="text-success" />
            });
            toggleConfirmModal(); // Cierra modal de confirmación
            await fetchData(false); // Refresca datos

        } catch (error) {
            console.error("[DELETE CLIENT EXEC ERROR] API call failed:", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al eliminar: ${errorMsg}`, {
                id: toastId, icon: <XCircle className="text-danger" />, duration: 5000
            });
            toggleConfirmModal(); // Cierra modal de confirmación en error
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, fetchData]); // No depende de confirmModalProps

    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm();
        clearFormErrors();
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((cliente) => {
        // Carga los datos del cliente en el formulario, asegurando que los opcionales sean string vacío si son null/undefined
        setForm({
            id: String(cliente.id || ""),
            NombreCompleto: cliente.NombreCompleto || "",
            Distintivo: cliente.Distintivo || "",
            CategoriaCliente: cliente.CategoriaCliente || "",
            Celular: String(cliente.Celular ?? ""), // Convertir a string o vacío
            Correo: cliente.Correo || "",
            Direccion: cliente.Direccion || "",
            Estado: cliente.Estado || "Activo", // Default a Activo si no viene
        });
        setIsEditing(true);
        clearFormErrors(); // Limpia errores de validaciones anteriores
        setModalOpen(true);
    }, [clearFormErrors]);


    // --- Filtering and Pagination Logic (igual que Proveedores) ---
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        return data.filter(
            (item) =>
                (item?.NombreCompleto?.toLowerCase() ?? '').includes(tableSearchText) ||
                (item?.Distintivo?.toLowerCase() ?? '').includes(tableSearchText) ||
                (item?.CategoriaCliente?.toLowerCase() ?? '').includes(tableSearchText) ||
                (String(item?.Celular ?? '').toLowerCase()).includes(tableSearchText) || // Busca también por celular
                (item?.Correo?.toLowerCase() ?? '').includes(tableSearchText) // Busca también por correo
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
    // Asegura que currentPage sea válido
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    // Calcula los items para la página actual
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        // Asegúrate que filteredData es un array antes de slice
        return Array.isArray(filteredData) ? filteredData.slice(startIndex, endIndex) : [];
    }, [filteredData, validCurrentPage]);

    // Ajusta la página actual si se elimina el último ítem de la última página
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
        // Si estamos en página 1 y se vacía, nos quedamos en 1
        else if (totalPages === 0 && currentPage !== 1) {
             setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const handlePageChange = useCallback((pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]);

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
             <Toaster
                position="top-center"
                toastOptions={{
                    success: { duration: 3000 },
                    error: { duration: 5000 },
                    style: { background: '#363636', color: '#fff' }
                }}
             />

            {/* Header and Actions */}
            <h2 className="mb-4">Gestión de Clientes</h2>
            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    {/* Search Input igual que Proveedores */}
                    <Input
                        type="text"
                        bsSize="sm"
                        placeholder="Buscar por nombre, distintivo, categoría, celular o correo..."
                        value={tableSearchText}
                        onChange={handleTableSearch}
                        style={{ borderRadius: '0.25rem' }}
                        aria-label="Buscar clientes"
                    />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    {/* Add Button igual que Proveedores */}
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add">
                        <Plus size={18} className="me-1" /> Agregar Cliente
                    </Button>
                </Col>
            </Row>

            {/* Data Table */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 {/* Table con estilo de Proveedores */}
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            {/* Columnas adaptadas para Clientes */}
                            <th scope="col">ID</th>
                            <th scope="col">Nombre Completo</th>
                            <th scope="col">Distintivo</th>
                            <th scope="col">Categoría</th>
                            <th scope="col">Celular</th>
                            <th scope="col">Correo</th>
                            {/* <th scope="col">Dirección</th> Podrías añadirla si es relevante en la tabla */}
                            <th scope="col" className="text-center">Estado</th>
                            <th scope="col" className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading ? (
                            <tr><td colSpan="8" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : currentItems.length > 0 ? (
                            // Mapea los 'currentItems' que ya están paginados y filtrados
                            currentItems.map((item) => (
                                <tr key={item.id} style={{ verticalAlign: 'middle', backgroundColor: item.Estado === "Inactivo" ? "#f8f9fa" : undefined }}>
                                    <th scope="row">{item.id}</th>
                                    <td>{item.NombreCompleto || '-'}</td>
                                    <td>{item.Distintivo || '-'}</td>
                                    <td>{item.CategoriaCliente || '-'}</td>
                                    <td>{item.Celular || '-'}</td>
                                    <td>{item.Correo || '-'}</td>
                                    {/* <td>{item.Direccion || '-'}</td> */}
                                    <td className="text-center">
                                        {/* Status Button como en Proveedores, adaptado a 'Activo'/'Inactivo' */}
                                        <Button
                                            size="sm"
                                            className={`status-button ${item.Estado === 'Activo' ? 'status-active' : 'status-inactive'}`}
                                            onClick={() => requestChangeStatusConfirmation(item.id, item.Estado, item.NombreCompleto)}
                                            disabled={!item.id || isLoading || isConfirmActionLoading} // Deshabilita si está cargando o procesando una confirmación
                                            title={item.Estado === 'Activo' ? "Clic para Desactivar" : "Clic para Activar"}
                                            aria-label={`Cambiar estado de ${item.NombreCompleto}. Estado actual: ${item.Estado}`}
                                        >
                                            {item.Estado === 'Activo' ? <><UserCheck size={14} className="me-1"/>Activo</> : <><UserX size={14} className="me-1"/>Inactivo</>}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        {/* Action Buttons como en Proveedores */}
                                        <div className="d-inline-flex gap-1 action-cell-content" role="group" aria-label={`Acciones para ${item.NombreCompleto}`}>
                                            <Button
                                                disabled={!item.id || isLoading || isConfirmActionLoading}
                                                size="sm"
                                                onClick={() => openEditModal(item)}
                                                title="Editar"
                                                className="action-button action-edit"
                                                aria-label={`Editar ${item.NombreCompleto}`}
                                            >
                                                <Edit size={20} />
                                            </Button>
                                            <Button
                                                disabled={!item.id || isLoading || isConfirmActionLoading}
                                                size="sm"
                                                onClick={() => requestDeleteConfirmation(item)}
                                                title="Eliminar"
                                                className="action-button action-delete"
                                                aria-label={`Eliminar ${item.NombreCompleto}`}
                                             >
                                                 <Trash2 size={20} />
                                             </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         ) : (
                            // Mensaje si no hay datos (después de filtrar o si la tabla está vacía)
                            <tr><td colSpan="8" className="text-center fst-italic p-4">
                                {tableSearchText ? "No se encontraron clientes que coincidan con la búsqueda." : "No hay clientes registrados."}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

             {/* Paginator como en Proveedores */}
             { totalPages > 1 && !isLoading && (
                <CustomPagination
                    currentPage={validCurrentPage} // Usa la página validada
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
             )}

             {/* Add/Edit Modal (Sin Imagen) */}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="lg" backdrop="static" keyboard={!modalOpen || isConfirmActionLoading} aria-labelledby="clientModalTitle">
                <ModalHeader toggle={!isConfirmActionLoading ? toggleMainModal : undefined} id="clientModalTitle"  >
                     {isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
                </ModalHeader>
                <ModalBody>
                     <Form id="clientForm" noValidate onSubmit={(e) => e.preventDefault()}>
                         {/* La Row principal ahora solo contiene la columna de campos */}
                         <Row>
                            {/* Columna ÚNICA para campos, ocupando todo el ancho */}
                            <Col md={12}> {/* Cambiado de md={7} lg={8} a md={12} */}
                                <Row className="g-3"> {/* g-3 añade espacio entre columnas */}

                                     {/* --- Fila 1: Nombre Completo --- */}
                                     <Col md={12}>
                                        <FormGroup>
                                            <Label for="modalNombreCompleto" className="form-label fw-bold">Nombre Completo <span className="text-danger">*</span></Label>
                                            <Input id="modalNombreCompleto" type="text" name="NombreCompleto" value={form.NombreCompleto} onChange={handleChange} invalid={formErrors.NombreCompleto} required aria-required="true" aria-describedby="nombreError"/>
                                            {formErrors.NombreCompleto && <div id="nombreError" className="invalid-feedback d-block">El nombre completo es obligatorio.</div>}
                                        </FormGroup>
                                    </Col>

                                     {/* --- Fila 2: Distintivo y Categoría --- */}
                                     <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalDistintivo" className="form-label fw-bold">Distintivo <span className="text-danger">*</span></Label>
                                            <Input id="modalDistintivo" type="text" name="Distintivo" value={form.Distintivo} onChange={handleChange} invalid={formErrors.Distintivo} required aria-required="true" aria-describedby="distintivoError"/>
                                            {formErrors.Distintivo && <div id="distintivoError" className="invalid-feedback d-block">El distintivo es obligatorio.</div>}
                                        </FormGroup>
                                    </Col>
                                     <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalCategoriaCliente" className="form-label fw-bold">Categoría Cliente <span className="text-danger">*</span></Label>
                                            <Input id="modalCategoriaCliente" type="select" name="CategoriaCliente" value={form.CategoriaCliente} onChange={handleChange} invalid={formErrors.CategoriaCliente} required aria-required="true" aria-describedby="categoriaError">
                                                <option value="" disabled>Seleccione...</option>
                                                {CATEGORIAS_CLIENTE.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                                            </Input>
                                            {formErrors.CategoriaCliente && <div id="categoriaError" className="invalid-feedback d-block">Seleccione una categoría.</div>}
                                        </FormGroup>
                                    </Col>

                                    {/* --- Fila 3: Celular y Correo --- */}
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalCelular" className="form-label fw-bold">Celular</Label> {/* Opcional */}
                                            <Input id="modalCelular" type="tel" inputMode="tel" pattern="[0-9]{10}" name="Celular" value={form.Celular} onChange={handleChange} invalid={formErrors.Celular} aria-describedby="celularError"/>
                                            {formErrors.Celular && <div id="celularError" className="invalid-feedback d-block">Ingrese un número de celular válido (10 dígitos numéricos).</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalCorreo" className="form-label fw-bold">Correo Electrónico</Label> {/* Opcional */}
                                            <Input id="modalCorreo" type="email" inputMode="email" name="Correo" value={form.Correo} onChange={handleChange} invalid={formErrors.Correo} aria-describedby="correoError"/>
                                            {formErrors.Correo && <div id="correoError" className="invalid-feedback d-block">Ingrese una dirección de correo electrónico válida.</div>}
                                        </FormGroup>
                                    </Col>

                                    {/* --- Fila 4: Dirección --- */}
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label for="modalDireccion" className="form-label fw-bold">Dirección</Label> {/* Opcional */}
                                            <Input id="modalDireccion" type="text" name="Direccion" value={form.Direccion} onChange={handleChange} invalid={formErrors.Direccion} />
                                            {/* No se muestra error de formato específico aquí */}
                                        </FormGroup>
                                    </Col>

                                </Row> {/* Fin de Row g-3 */}
                            </Col> {/* Fin de Col md={12} */}

                        </Row> {/* Fin de Row principal */}
                    </Form>
                </ModalBody>
                <ModalFooter>
                    {/* Botones (sin cambios) */}
                     <Button color="secondary" outline onClick={toggleMainModal} disabled={isConfirmActionLoading}>Cancelar</Button>
                    <Button
                        type="button"
                        color="primary"
                        onClick={isEditing ? requestEditConfirmation : handleSubmit}
                        disabled={isConfirmActionLoading}
                    >
                        {isEditing ? <><Edit size={18} className="me-1"/> Guardar Cambios</> : <><Plus size={18} className="me-1"/> Agregar Cliente</>}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Confirmation Modal (igual que Proveedores) */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                toggle={toggleConfirmModal}
                title={confirmModalProps.title}
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()} // Ejecuta la acción guardada en el ref
                confirmText={confirmModalProps.confirmText}
                confirmColor={confirmModalProps.confirmColor}
                isConfirming={isConfirmActionLoading} // Pasa el estado de carga
            >
                {/* El contenido (mensaje) se establece en confirmModalProps */}
                {confirmModalProps.message}
            </ConfirmationModal>

        </Container>
    );
};

export default Clientes;