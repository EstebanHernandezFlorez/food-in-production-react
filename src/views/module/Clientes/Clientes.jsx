import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; 
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
} from "reactstrap";

import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import clientesService from '../../services/clientesService'; 
import CustomPagination from '../../General/CustomPagination'; 
import FondoForm from "../../../assets/login.jpg"; 

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

const INITIAL_FORM_STATE = {
    id: "", 
    NombreCompleto: "",
    Distintivo: "",
    CategoriaCliente: "", 
    Celular: "",
    Correo: "",
    Direccion: "",
    Estado: "Activo", 
};


const INITIAL_FORM_ERRORS = {
    NombreCompleto: false,
    Distintivo: false,
    CategoriaCliente: false,
    Celular: false, 
    Correo: false, 
    Direccion: false, 
};

const INITIAL_CONFIRM_PROPS = {
    title: "",
    message: null,
    confirmText: "Confirmar",
    confirmColor: "primary",
    itemDetails: null,
};


const CATEGORIAS_CLIENTE = [
    { value: "Familiar", label: "Familiar" },
    { value: "Empresarial", label: "Empresarial" },
    { value: "Preferencial", label: "Preferencial" },
    { value: "Nuevo", label: "Nuevo" },
];

const ITEMS_PER_PAGE = 5; 


const Clientes = () => {

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

   
    const confirmActionRef = useRef(null); 

    
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        console.log("[FETCH] Fetching clients...");
        try {
            
            const clientes = await clientesService.getAllClientes();
            setData(clientes || []);
            console.log("[FETCH] Clients loaded:", clientes);
        } catch (error) {
            console.error("[FETCH ERROR] Failed to load clients:", error);
            toast.error("Error al cargar clientes. Verifique la conexión.");
            setData([]); 
        } finally {
             if (showLoadingSpinner) setIsLoading(false);
             console.log("[FETCH] Fetching finished.");
        }
    }, []); 

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const resetForm = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
    }, []);

    const clearFormErrors = useCallback(() => {
        setFormErrors(INITIAL_FORM_ERRORS);
    }, []);

   
 
const validateForm = useCallback(() => {
    const nombreCompletoString = String(form.NombreCompleto ?? '').trim();
    const distintivoString = String(form.Distintivo ?? '').trim();
    const celularString = String(form.Celular ?? '').trim();
    const correoString = String(form.Correo ?? '').trim();
    const direccionString = String(form.Direccion ?? '').trim();
    const hasNumbers = /\d/; 

    const errors = {
        NombreCompleto: !nombreCompletoString || nombreCompletoString.length < 5 || hasNumbers.test(nombreCompletoString),
        Distintivo: !distintivoString,        
        CategoriaCliente: !form.CategoriaCliente, 
        Celular: !/^\d{10,12}$/.test(celularString),
        Correo: correoString && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoString), 
        Direccion: false, 
    };

    setFormErrors(errors);
    return !Object.values(errors).some(error => error === true); 

}, [form]);


const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (name === "NombreCompleto") {

        processedValue = value.replace(/[0-9]/g, '');
    }


    setForm((prevForm) => ({ ...prevForm, [name]: processedValue })); // Usamos el valor procesado
    
    if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: false }));
    }
}, [formErrors]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1); 
    }, []);


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
        if (isConfirmActionLoading) return; 
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

   
     useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

  
    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
            if (actionFn) {
                actionFn(detailsToPass); 
            } else {
                 console.error("[CONFIRM ACTION] actionFn is null or undefined in ref execution.");
                 toast.error("Error interno al intentar ejecutar la acción confirmada.");
                 toggleConfirmModal();
            }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]); 

    

    // ADD CLIENT (Submit Handler)
    const handleSubmit = useCallback(async () => {
        console.log("[ADD CLIENT] Attempting submit:", form);
        if (!validateForm()) {
            toast.error("Por favor, complete los campos requeridos correctamente.", { duration: 4000 });
            return;
        }

        const correoExistente = data.some(c => c.Correo && c.Correo.toLowerCase() === String(form.Correo ?? '').trim().toLowerCase());
        if (correoExistente) {
            toast.error("Ya existe un cliente con este correo electrónico.", { duration: 4000 });
            setFormErrors(prev => ({ ...prev, Correo: true }));
            return;
        }
        const celularAValidar = String(form.Celular ?? '').trim();

        const celularExistente = data.some(c => c.Celular === celularAValidar);
        if (celularExistente) {
            toast.error("Ya existe un cliente con este número de celular.", { duration: 4000 });
            setFormErrors(prev => ({ ...prev, Celular: true }));
            return;
        }


        const toastId = toast.loading('Agregando cliente...');
        try {
              const { id, ...clientData } = form;

            const payload = {
                NombreCompleto: clientData.NombreCompleto,
                Distintivo: clientData.Distintivo,
                CategoriaCliente: clientData.CategoriaCliente,
                Celular: clientData.Celular,
                Estado: clientData.Estado,
            };

            // Se añaden los campos opcionales SÓLO si tienen valor, para evitar enviar "".
            if (clientData.Correo) {
                payload.Correo = clientData.Correo;
            }
            if (clientData.Direccion) {
                payload.Direccion = clientData.Direccion;
            }
            
            console.log("[ADD CLIENT] Calling service with:", payload);
            await clientesService.createCliente(payload);
            toast.success("Cliente agregado exitosamente!", { id: toastId });
            toggleMainModal(); 
            await fetchData(false); 
            setCurrentPage(1); 

        } catch (error) {
            console.error("[ADD CLIENT ERROR]", error);
              let errorMsg = "Error desconocido.";
            if (error.response && error.response.data) {
                // Ideal si el backend envía un { message: '...' }
                errorMsg = error.response.data.message || JSON.stringify(error.response.data);
            } else {
                // Para errores de red u otros
                errorMsg = error.message;
            }
            toast.error(`Error al agregar: ${errorMsg}`, { id: toastId, duration: 6000 });
        }
    }, [form, data, validateForm, toggleMainModal, fetchData]); 

    // EDIT CLIENT (Request Confirmation)
    const requestEditConfirmation = useCallback(() => {
        console.log("[EDIT CLIENT REQ] Requesting confirmation for:", form);
        if (!validateForm()) {
           toast.error("Por favor, complete los campos requeridos correctamente.", { duration: 4000 });
           return;
        }

        const currentId = form.id;
        const celularAValidar = String(form.Celular ?? '').trim();

        // Validar que el celular no pertenezca a OTRO cliente
       const celularExistente = data.some(c => 
    String(c.id) !== currentId && c.Celular === celularAValidar
);
        if (celularExistente) {
           toast.error("Este número de celular ya está registrado por otro cliente.", { duration: 4000 });
           setFormErrors(prev => ({ ...prev, Celular: true }));
           return;
        }

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
            itemDetails: { ...form } 
        });
    }, [form, data, validateForm, prepareConfirmation]); 

    // EDIT CLIENT (Execute Action)
    const executeEdit = useCallback(async (clientToUpdate) => {
        console.log("[EDIT CLIENT EXEC] Attempting execution with received data:", clientToUpdate);

    
        if (!clientToUpdate || !clientToUpdate.id) {
             console.error("[EDIT CLIENT EXEC ERROR] Missing client data or ID in received argument.", clientToUpdate);
             toast.error("Error interno: Datos para actualizar no encontrados.");
             toggleConfirmModal(); 
             return;
        }

        setIsConfirmActionLoading(true); 
        const toastId = toast.loading('Actualizando cliente...');

        try {
                   const payload = {
                NombreCompleto: clientToUpdate.NombreCompleto,
                Distintivo: clientToUpdate.Distintivo,
                CategoriaCliente: clientToUpdate.CategoriaCliente,
                Celular: clientToUpdate.Celular,
                Estado: clientToUpdate.Estado,
            };

            // Se añaden los campos opcionales SÓLO si tienen valor.
            if (clientToUpdate.Correo) {
                payload.Correo = clientToUpdate.Correo;
            }
            if (clientToUpdate.Direccion) {
                payload.Direccion = clientToUpdate.Direccion;
            }
            
            console.log("[EDIT CLIENT EXEC] Calling service with ID:", clientToUpdate.id, "Data:", payload);
            await clientesService.updateCliente(clientToUpdate.id, payload); 

            toast.success("Cliente actualizado exitosamente!", { id: toastId });
            toggleConfirmModal(); 
            toggleMainModal();    
            await fetchData(false); 
        } catch (error) {
            console.error("[EDIT CLIENT EXEC ERROR]", error);
                 let errorMsg = "Error desconocido.";
            if (error.response && error.response.data) {
                errorMsg = error.response.data.message || JSON.stringify(error.response.data);
            } else {
                errorMsg = error.message;
            }
            toast.error(`Error al actualizar: ${errorMsg}`, { id: toastId, duration: 6000 });
            toggleConfirmModal(); 
        } finally {
             setIsConfirmActionLoading(false); 
        }
    }, [toggleConfirmModal, toggleMainModal, fetchData]);

    // CHANGE STATUS (Request Confirmation)
    const requestChangeStatusConfirmation = useCallback((idCliente, currentStatus, nombreCliente) => {
        if (!idCliente) {
            console.error("[STATUS CLIENT REQ ERROR] Invalid client ID:", idCliente);
            return;
        }
        console.log(`[STATUS CLIENT REQ] Requesting change for ID: ${idCliente}, Current Status: ${currentStatus}`);
        
        const isCurrentlyActive = currentStatus === "Activo";
        const actionText = isCurrentlyActive ? "desactivar" : "activar";
        const futureStatusText = isCurrentlyActive ? "Inactivo" : "Activo";
        const confirmColor = isCurrentlyActive ? "warning" : "success"; 
        const IconComponent = isCurrentlyActive ? UserX : UserCheck; 

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
            itemDetails: { idCliente, currentStatus, nombreCliente, futureStatusText } 
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
        const newStatusFrontend = futureStatusText;
        const actionText = currentStatus === "Activo" ? "desactivar" : "activar";

        console.log(`[STATUS CLIENT EXEC] Executing for ID: ${idCliente} to New Status: ${newStatusFrontend}`);
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo cliente...`);

        try {
            console.log("[STATUS CLIENT EXEC] Calling service changeStateCliente with ID:", idCliente, "New Status:", newStatusFrontend);
            await clientesService.changeStateCliente(idCliente, newStatusFrontend); 
            toast.success(`Cliente ${nombreCliente || ''} ${actionText === 'activar' ? 'activado' : 'desactivado'} correctamente.`, { id: toastId });
            toggleConfirmModal(); 
            await fetchData(false); 

        } catch (error) {
            console.error("[STATUS CLIENT EXEC ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al ${actionText}: ${errorMsg}`, { id: toastId, duration: 5000 });
            toggleConfirmModal(); 
        } finally {
            setIsConfirmActionLoading(false);
            console.log("[STATUS CLIENT EXEC] Execution finished.");
        }
    }, [toggleConfirmModal, fetchData]); 

   
    const requestDeleteConfirmation = useCallback(async (cliente) => {
        if (!cliente || !cliente.id) {
            console.error("[DELETE CLIENT REQ ERROR] Invalid client data received:", cliente);
            return;
        }
        console.log("[DELETE CLIENT REQ] Requesting confirmation for client:", JSON.stringify(cliente));


       

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
            itemDetails: { ...cliente } 
        });

    }, [prepareConfirmation]);

    // DELETE CLIENT 
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
            await clientesService.deleteCliente(clienteToDelete.id); 

            toast.success(`Cliente "${clienteToDelete.NombreCompleto}" eliminado correctamente.`, {
                id: toastId, icon: <CheckCircle className="text-success" />
            });
            toggleConfirmModal(); 
            await fetchData(false); 

        } catch (error) {
            console.error("[DELETE CLIENT EXEC ERROR] API call failed:", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al eliminar: ${errorMsg}`, {
                id: toastId, icon: <XCircle className="text-danger" />, duration: 5000
            });
            toggleConfirmModal(); 
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, fetchData]); 

    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm();
        clearFormErrors();
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((cliente) => {
       
        setForm({
            id: String(cliente.id || ""),
            NombreCompleto: cliente.NombreCompleto || "",
            Distintivo: cliente.Distintivo || "",
            CategoriaCliente: cliente.CategoriaCliente || "",
            Celular: String(cliente.Celular ?? ""), 
            Correo: cliente.Correo || "",
            Direccion: cliente.Direccion || "",
            Estado: cliente.Estado || "Activo", 
        });
        setIsEditing(true);
        clearFormErrors(); 
        setModalOpen(true);
    }, [clearFormErrors]);


   
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        return data.filter(
            (item) =>
                (item?.NombreCompleto?.toLowerCase() ?? '').includes(tableSearchText) ||
                (item?.Distintivo?.toLowerCase() ?? '').includes(tableSearchText) ||
                (item?.CategoriaCliente?.toLowerCase() ?? '').includes(tableSearchText) ||
                (String(item?.Celular ?? '').toLowerCase()).includes(tableSearchText) || 
                (item?.Correo?.toLowerCase() ?? '').includes(tableSearchText) 
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
  
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return Array.isArray(filteredData) ? filteredData.slice(startIndex, endIndex) : [];
    }, [filteredData, validCurrentPage]);

    
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    
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

          
            <h2 className="mb-5">Gestión de Clientes</h2>
          <Row className="mb-4 align-items-center justify-content-between">
    
    <Col md="auto">
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
                <Col md="auto" className="mt-2 mt-md-0">
                    {/* Add Button */}
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add">
                        <Plus size={20} className="me-1" /> Agregar Cliente
                    </Button>
                </Col>
            </Row>

            {/* Data Table */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            
                            <th scope="col">Nombre Completo</th>
                            <th scope="col">Distintivo</th>
                            <th scope="col">Categoría</th>
                            <th scope="col">Celular</th>
                            <th scope="col">Correo</th>
                            <th scope="col">Dirección</th>
                            <th scope="col" className="text-center">Estado</th>
                            <th scope="col" className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading ? (
                            <tr><td colSpan="8" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.id} style={{ verticalAlign: 'middle', backgroundColor: item.Estado === "Inactivo" ? "#f8f9fa" : undefined }}>
                                    <td>{item.NombreCompleto || '-'}</td>
                                    <td>{item.Distintivo || '-'}</td>
                                    <td>{item.CategoriaCliente || '-'}</td>
                                    <td>{item.Celular || '-'}</td>
                                    <td>{item.Correo || '-'}</td>
                                    <td>{item.Direccion || '-'}</td> 
                                    <td className="text-center">
                                        
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
                                        {/* Action Buttons  */}
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
                            
                            <tr><td colSpan="8" className="text-center fst-italic p-4">
                                {tableSearchText ? "No se encontraron clientes que coincidan con la búsqueda." : "No hay clientes registrados."}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

             {/* Paginator  */}
             { totalPages > 1 && !isLoading && (
                <CustomPagination
                    currentPage={validCurrentPage} 
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
                       
                         <Row>
                            
                            <Col md={12}> 
                                <Row className="g-3"> 

                                     {/* --- Fila 1: Nombre Completo --- */}
                                     <Col md={12}>
                                        <FormGroup>
                                            <Label for="modalNombreCompleto" className="form-label fw-bold">Nombre Completo <span className="text-danger">*</span></Label>
                                                        <Input 
                                                            id="modalNombreCompleto" 
                                                            type="text" 
                                                            name="NombreCompleto" 

                                                            value={form.NombreCompleto} 
                                                            onChange={handleChange} 
                                                            invalid={formErrors.NombreCompleto} 
                                                            required 
                                                            aria-required="true" 
                                                            aria-describedby="nombreError"
                                                        />
                                                        {formErrors.NombreCompleto && (
                                                            <div id="nombreError" className="invalid-feedback d-block">
                                                                El nombre es obligatorio, debe tener al menos 5 caracteres y no puede contener números.
                                                            </div>
                                                        )}
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
                                            <Label for="modalCelular" className="form-label fw-bold">Celular</Label> 
                                            <Input id="modalCelular" 
                                            type="tel"
                                            inputMode="tel" 
                                            maxLength="12" 
                                            pattern="[0-9]{10,12}" 
                                            name="Celular" 
                                            value={form.Celular} 
                                            onChange={handleChange} 
                                            invalid={formErrors.Celular} 
                                            aria-describedby="celularError"/>
                                            {formErrors.Celular && <div id="celularError" 
                                            className="invalid-feedback d-block">El celular es obligatorio y debe tener entre 10 y 12 dígitos.</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalCorreo" className="form-label fw-bold">Correo Electrónico</Label> 
                                            <Input id="modalCorreo" type="email" inputMode="email" name="Correo" value={form.Correo} onChange={handleChange} invalid={formErrors.Correo} aria-describedby="correoError"/>
                                            {formErrors.Correo && <div id="correoError" className="invalid-feedback d-block">Ingrese una dirección de correo electrónico válida.</div>}
                                        </FormGroup>
                                    </Col>

                                    {/* --- Fila 4: Dirección --- */}
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label for="modalDireccion" className="form-label fw-bold">Dirección</Label> 
                                            <Input id="modalDireccion" type="text" name="Direccion" value={form.Direccion} onChange={handleChange} invalid={formErrors.Direccion} />
                                           
                                        </FormGroup>
                                    </Col>

                                </Row> 
                            </Col> 

                        </Row> 
                    </Form>
                </ModalBody>
                <ModalFooter>
                    
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

export default Clientes;