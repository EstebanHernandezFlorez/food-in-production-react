// src/components/Empleado/Empleados.jsx (Asegúrate que la ruta es correcta)
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; // Asegúrate que esta ruta es correcta
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Import ---
import empleadoService from '../../services/empleadoService'; // *** AJUSTADO ***

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination'; // Asumiendo que existe
// import FondoForm from "../../../assets/login.jpg"; // Puedes añadir una imagen si quieres

// --- Confirmation Modal Component (sin cambios) ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
             <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : (confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? (<><Spinner size="sm" className="me-1"/> Procesando...</>) : (confirmText)}
            </Button>
        </ModalFooter>
    </Modal>
);

// --- Detail Modal Component (ya lo tenías, sin cambios estructurales) ---
const DetailModal = ({ isOpen, toggle, title, item }) => (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg"> {/* Ajustado a 'lg' para más espacio */}
         <ModalHeader toggle={toggle}>
            <div className="d-flex align-items-center">
                <Eye size={20} className="me-2 text-info" />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>
            {item ? (
                <div className="employee-details">
                     {/* Usamos Row y Col para mejor formato */}
                     <Row className="g-2 mb-2"> {/* g-2 = gap */}
                        <Col sm={4} className="fw-bold">ID:</Col><Col sm={8}>{item.idEmployee}</Col>
                        <Col sm={4} className="fw-bold">Nombre Completo:</Col><Col sm={8}>{item.fullName}</Col>
                        <Col sm={4} className="fw-bold">Tipo Documento:</Col><Col sm={8}>{item.typeDocument}</Col>
                        <Col sm={4} className="fw-bold">Documento:</Col><Col sm={8}>{item.document}</Col>
                        <Col sm={4} className="fw-bold">Celular:</Col><Col sm={8}>{item.cellPhone}</Col>
                        <Col sm={4} className="fw-bold">Email:</Col><Col sm={8}>{item.email}</Col>
                        <Col sm={4} className="fw-bold">Fecha Ingreso:</Col><Col sm={8}>{item.dateOfEntry ? new Date(item.dateOfEntry).toLocaleDateString() : '-'}</Col> {/* Formatear fecha */}
                        <Col sm={4} className="fw-bold">Dirección:</Col><Col sm={8}>{item.Address}</Col>
                        <Col sm={4} className="fw-bold">Tipo Contrato:</Col><Col sm={8}>{item.contractType}</Col>
                        <Col sm={4} className="fw-bold">Contacto Emerg.:</Col><Col sm={8}>{item.emergencyContact}</Col>
                        <Col sm={4} className="fw-bold">Nombre Familiar:</Col><Col sm={8}>{item.nameFamilyMember}</Col>
                        <Col sm={4} className="fw-bold">Parentesco:</Col><Col sm={8}>{item.Relationship}</Col>
                        <Col sm={4} className="fw-bold">Tipo Sangre:</Col><Col sm={8}>{item.BloodType}</Col>
                        <Col sm={4} className="fw-bold">No. Seg. Social:</Col><Col sm={8}>{item.socialSecurityNumber}</Col>
                        <Col sm={4} className="fw-bold">Estado:</Col><Col sm={8}>{item.status ? <span className="badge bg-success">Activo</span> : <span className="badge bg-secondary">Inactivo</span>}</Col>
                    </Row>
                </div>
            ) : (
                <p className="text-center text-muted">No hay detalles para mostrar.</p>
            )}
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle}>Cerrar</Button>
        </ModalFooter>
    </Modal>
);


// --- Constants ---
// *** AJUSTADO: Estado inicial para Empleado ***
const getInitialFormState = () => ({
    idEmployee: '',
    fullName: '',
    typeDocument: '',
    document: '',
    cellPhone: '',
    email: '',
    dateOfEntry: '', // Asegurarse que el input type="date" maneja bien '' o formato YYYY-MM-DD
    emergencyContact: '',
    Relationship: '',
    nameFamilyMember: '',
    BloodType: '',
    socialSecurityNumber: '',
    Address: '',
    contractType: '',
    status: true,
});

// *** AJUSTADO: Errores iniciales para Empleado ***
const getInitialFormErrors = () => ({
    fullName: false,
    typeDocument: false,
    document: false,
    cellPhone: false,
    email: false,
    dateOfEntry: false,
    emergencyContact: false,
    Relationship: false,
    nameFamilyMember: false,
    BloodType: false,
    socialSecurityNumber: false,
    Address: false,
    contractType: false,
});

const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null,
};

// *** AJUSTADO: Tipos de documento específicos si son diferentes ***
const TIPOS_DOCUMENTOS_EMPLEADO = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" },
    { value: "PEP", label: "Permiso Especial de Permanencia" },
];

const ITEMS_PER_PAGE = 5;

// --- Main Component ---
const Empleados = () => { // *** AJUSTADO: Nombre del componente ***
    // --- State ---
    const [data, setData] = useState([]);
    const [form, setForm] = useState(getInitialFormState()); // Usa la función
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState(getInitialFormErrors()); // Usa la función
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false); // Estado para modal de detalles
    const [selectedItemForDetail, setSelectedItemForDetail] = useState(null); // Estado para item de detalles

    // --- Refs ---
    const confirmActionRef = useRef(null);

    // --- Data Fetching ---
    // *** AJUSTADO: Usa empleadoService y textos de Empleado ***
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        console.log("[FETCH] Fetching employees..."); // Log actualizado
        try {
            // Usa el servicio de empleado
            const empleados = await empleadoService.getAllEmpleados();
            setData(empleados || []);
        } catch (error) {
            console.error("[FETCH ERROR] Failed to load employees:", error); // Log actualizado
            toast.error("Error al cargar empleados. Verifique la conexión.", { icon: <XCircle className="text-danger" /> }); // Mensaje actualizado
            setData([]);
        } finally {
             if (showLoadingSpinner) setIsLoading(false);
             console.log("[FETCH] Fetching finished.");
        }
    }, []); // Sin dependencias necesarias aquí

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Form Helper Functions ---
    const resetForm = useCallback(() => { setForm(getInitialFormState()); }, []);
    const clearFormErrors = useCallback(() => { setFormErrors(getInitialFormErrors()); }, []);

    // *** AJUSTADO: Validación para Empleado ***
    const validateForm = useCallback(() => {
        const errors = getInitialFormErrors(); // Reinicia errores
        let isValid = true;

        // Convertir a string y hacer trim de forma segura donde aplique
        const fullName = String(form.fullName ?? '').trim();
        const document = String(form.document ?? '').trim();                                
        const cellPhone = String(form.cellPhone ?? '').trim();
        const email = String(form.email ?? '').trim();
        const emergencyContact = String(form.emergencyContact ?? '').trim();
        const relationship = String(form.Relationship ?? '').trim();
        const nameFamilyMember = String(form.nameFamilyMember ?? '').trim();
        const bloodType = String(form.BloodType ?? '').trim();
        const socialSecurityNumber = String(form.socialSecurityNumber ?? '').trim();
        const address = String(form.Address ?? '').trim();
        const contractType = String(form.contractType ?? '').trim();

        // Campos requeridos (Ajusta según tus necesidades)
        if (!fullName) { errors.fullName = true; isValid = false; }
        if (!form.typeDocument) { errors.typeDocument = true; isValid = false; }
        if (!document) { errors.document = true; isValid = false; }
        if (!cellPhone) { errors.cellPhone = true; isValid = false; }
        if (!email) { errors.email = true; isValid = false; }
        if (!form.dateOfEntry) { errors.dateOfEntry = true; isValid = false; } // Fecha es requerida
        if (!emergencyContact) { errors.emergencyContact = true; isValid = false; }
        if (!relationship) { errors.Relationship = true; isValid = false; }
        if (!nameFamilyMember) { errors.nameFamilyMember = true; isValid = false; }
        if (!bloodType) { errors.BloodType = true; isValid = false; }
        if (!socialSecurityNumber) { errors.socialSecurityNumber = true; isValid = false; }
        if (!address) { errors.Address = true; isValid = false; }
        if (!contractType) { errors.contractType = true; isValid = false; }

        // Validaciones específicas de formato (si el campo no está vacío)
        if (document && !/^[a-zA-Z0-9]+$/.test(document)) { // Permitir letras y números para pasaporte, etc. Ajusta si es necesario.
             errors.document = true; isValid = false;
             toast.error("El documento solo puede contener letras y números.", { duration: 3000, icon: <XCircle size={16} /> });
        }
        if (cellPhone && !/^\d{7,15}$/.test(cellPhone)) {
             errors.cellPhone = true; isValid = false;
             toast.error("El celular debe contener entre 7 y 15 dígitos numéricos.", { duration: 3000, icon: <XCircle size={16} /> });
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = true; isValid = false;
            toast.error("El formato del correo electrónico no es válido.", { duration: 3000, icon: <XCircle size={16} /> });
        }
         if (emergencyContact && !/^\d{7,15}$/.test(emergencyContact)) {
             errors.emergencyContact = true; isValid = false;
             toast.error("El teléfono de emergencia debe contener entre 7 y 15 dígitos.", { duration: 3000, icon: <XCircle size={16} /> });
        }

        setFormErrors(errors);
        if (!isValid && !toast.isActive('formValidationError')) { // Evita toasts duplicados rápidos
             toast.error("Por favor, corrija los campos marcados en rojo.", { id: 'formValidationError', duration: 4000, icon: <XCircle className="text-danger" /> });
        }
        return isValid;
    }, [form]);

    // --- Event Handlers ---
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
        // Limpia el error específico al cambiar el campo
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: false }));
        }
    }, [formErrors]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1);
    }, []);

    // --- Modal Toggles ---
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

    // Toggle para el modal de detalles
    const toggleDetailModal = useCallback(() => {
        const closing = detailModalOpen;
        setDetailModalOpen(prev => !prev);
        if (closing) {
            setSelectedItemForDetail(null); // Limpia el item seleccionado al cerrar
        }
    }, [detailModalOpen]);

    // --- Effect to Reset Confirmation Modal State ---
     useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            // console.log("[EFFECT] Resetting confirmation modal props and ref.");
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);


    // --- Confirmation Preparation (Igual que en Proveedores, lógica genérica) ---
    const prepareConfirmation = useCallback((actionFn, props) => {
        console.log(`[PREPARE CONFIRM] Setting up confirmation for: ${props.title}`, props.itemDetails);
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
            if (actionFn) {
                actionFn(detailsToPass);
            } else {
                 console.error("[CONFIRM ACTION] actionFn is null or undefined in ref execution.");
                 toast.error("Error interno al intentar ejecutar la acción confirmada.", { icon: <XCircle className="text-danger" /> });
                 toggleConfirmModal();
            }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]); // Dependencia necesaria

    // --- CRUD Operations ---

    // *** AJUSTADO: ADD Empleado ***
    const handleSubmit = useCallback(async () => {
        console.log("[ADD EMP] Attempting submit:", form); // Log actualizado
        if (!validateForm()) {
            // El toast de error ya se muestra dentro de validateForm si es inválido
            return;
        }

        // Verifica duplicado por documento (asegura conversión a string)
        const documentToCompare = String(form.document || '').trim().toLowerCase();
        const empleadoExistente = data.some(
            (registro) => registro.document != null && String(registro.document).trim().toLowerCase() === documentToCompare
        );

        if (empleadoExistente) {
            toast.error("Ya existe un empleado con este número de documento.", { duration: 4000, icon: <XCircle className="text-danger" /> });
            setFormErrors(prev => ({ ...prev, document: true }));
            return;
        }

        const toastId = toast.loading('Agregando empleado...'); // Mensaje actualizado
        try {
            // Quita idEmployee antes de enviar, asegúrate que status sea boolean
            const { idEmployee, ...newEmployeeData } = form;
            const employeeToSend = { ...newEmployeeData, status: typeof form.status === 'boolean' ? form.status : true }; // Asegura boolean
            console.log("[ADD EMP] Calling service createEmpleado with:", employeeToSend); // Log actualizado
            await empleadoService.createEmpleado(employeeToSend); // Usa servicio de empleado

            toast.success("Empleado agregado exitosamente!", { id: toastId, icon: <CheckCircle className="text-success" /> }); // Mensaje actualizado
            toggleMainModal();
            await fetchData(false);
            setCurrentPage(1);

        } catch (error) {
            console.error("[ADD EMP ERROR]", error); // Log actualizado
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al agregar empleado: ${errorMsg}`, { id: toastId, duration: 5000, icon: <XCircle className="text-danger" /> }); // Mensaje actualizado
        }
    }, [form, data, validateForm, toggleMainModal, fetchData]);

    // *** AJUSTADO: Request EDIT Empleado ***
    const requestEditConfirmation = useCallback(() => {
        console.log("[EDIT EMP REQ] Requesting confirmation for:", form); // Log actualizado
        if (!validateForm()) {
           return;
        }

        // Verifica duplicado por documento (excluyendo el actual)
        const currentDocument = String(form.document || '').trim().toLowerCase();
        const currentId = form.idEmployee; // Usa idEmployee

        // Asegúrate que currentId no sea una cadena vacía antes de comparar
        if (!currentId) {
            console.error("[EDIT EMP REQ ERROR] idEmployee missing in form state.");
            toast.error("Error interno: No se puede identificar el empleado actual.", { icon: <XCircle className="text-danger" /> });
            return;
        }


        const empleadoExistente = data.some(
           (registro) =>
               registro.document != null &&
               String(registro.document).trim().toLowerCase() === currentDocument &&
               String(registro.idEmployee) !== String(currentId) // Compara como strings por si acaso
        );

        if (empleadoExistente) {
           toast.error("Ya existe otro empleado con este número de documento.", { duration: 4000, icon: <XCircle className="text-danger" /> });
           setFormErrors(prev => ({ ...prev, document: true }));
           return;
        }

        // Prepara la confirmación
        prepareConfirmation(executeEdit, {
            title: "Confirmar Actualización",
            // Usa fullName para el mensaje
            message: <p>¿Está seguro que desea guardar los cambios para <strong>{form.fullName || 'este empleado'}</strong>?</p>,
            confirmText: "Confirmar Cambios",
            confirmColor: "primary",
            itemDetails: { ...form } // Pasa los datos actuales del formulario
        });
    }, [form, data, validateForm, prepareConfirmation]);

    // *** AJUSTADO: Execute EDIT Empleado ***
    const executeEdit = useCallback(async (employeeToUpdate) => {
        console.log("[EDIT EMP EXEC] Attempting execution with received data:", employeeToUpdate); // Log

        // Valida el argumento recibido
        if (!employeeToUpdate || !employeeToUpdate.idEmployee) {
             console.error("[EDIT EMP EXEC ERROR] Missing employee data in received argument.", employeeToUpdate); // Log
             toast.error("Error interno: Datos para actualizar no encontrados.", { icon: <XCircle className="text-danger" /> });
             toggleConfirmModal();
             return;
        }

        const idEmployee = employeeToUpdate.idEmployee; // Obtiene ID del argumento
        console.log("[EDIT EMP EXEC] Executing edit for ID:", idEmployee); // Log
        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Actualizando empleado...'); // Mensaje

        try {
            // Asegúrate de enviar el objeto completo o solo los campos permitidos según tu API
            // Aquí enviamos todo excepto el ID (asumiendo que la API maneja qué actualizar)
            const { idEmployee: _, ...updateData } = employeeToUpdate; // Quita idEmployee del objeto a enviar si es necesario por tu API
            // Opcional: Podrías querer formatear/limpiar 'updateData' aquí antes de enviarlo
            console.log("[EDIT EMP EXEC] Calling service updateEmpleado with ID:", idEmployee, "Data:", updateData); // Log
            await empleadoService.updateEmpleado(idEmployee, updateData); // Usa servicio de empleado

            toast.success("Empleado actualizado exitosamente!", { id: toastId, icon: <CheckCircle className="text-success" /> }); // Mensaje
            toggleConfirmModal();
            toggleMainModal();
            await fetchData(false);

        } catch (error) {
            console.error("[EDIT EMP EXEC ERROR]", error); // Log
             if (error.response) { console.error("Server Response:", error.response.data); } // Log detallado del error del servidor
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al actualizar empleado: ${errorMsg}`, { id: toastId, duration: 5000, icon: <XCircle className="text-danger" /> }); // Mensaje
            // No cerramos el modal principal aquí, solo el de confirmación
            toggleConfirmModal();
        } finally {
             setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, toggleMainModal, fetchData]); // Dependencias

    // *** AJUSTADO: Request CHANGE STATUS Empleado ***
    const requestChangeStatusConfirmation = useCallback((idEmployee, currentStatus, employeeName) => { // Usa idEmployee, employeeName
        if (!idEmployee) {
            console.error("[STATUS EMP REQ ERROR] Invalid idEmployee:", idEmployee); // Log
            return;
        }
        console.log(`[STATUS EMP REQ] Requesting change for ID: ${idEmployee}, Current: ${currentStatus}`); // Log
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";

        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            // Mensaje usa employeeName
            message: ( <p>¿Está seguro que desea <strong>{actionText}</strong> al empleado <strong>{employeeName || 'seleccionado'}</strong>? <br /> Su nuevo estado será: <strong>{futureStatusText}</strong>.</p> ),
            confirmText: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: confirmColor,
            // Pasa idEmployee y employeeName
            itemDetails: { idEmployee, currentStatus, employeeName }
        });
    }, [prepareConfirmation]); // Dependencia

    // *** AJUSTADO: Execute CHANGE STATUS Empleado ***
    const executeChangeStatus = useCallback(async (details) => {
        console.log("[STATUS EMP EXEC] Attempting execution with received details:", details); // Log

        // Valida el argumento 'details'
        if (!details || !details.idEmployee) { // Usa idEmployee
            console.error("[STATUS EMP EXEC ERROR] Missing details or idEmployee in received argument.", details); // Log
            toast.error("Error interno: No se pudieron obtener los detalles para cambiar el estado.", { duration: 5000, icon: <XCircle className="text-danger" /> });
            toggleConfirmModal();
            return;
        }

        // Usa idEmployee, employeeName del argumento
        const { idEmployee, currentStatus, employeeName } = details;
        const newStatus = !currentStatus;
        const actionText = currentStatus ? "desactivar" : "activar";
        console.log(`[STATUS EMP EXEC] Executing for ID: ${idEmployee} to New Status: ${newStatus}`); // Log

        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo empleado...`); // Mensaje

        try {
            console.log("[STATUS EMP EXEC] Calling service changeStateEmpleado with ID:", idEmployee, "New Status:", newStatus); // Log
            await empleadoService.changeStateEmpleado(idEmployee, newStatus); // Usa servicio de empleado

            // Mensaje usa employeeName
            toast.success(`Empleado ${employeeName || ''} ${actionText === 'activar' ? 'activado' : 'desactivado'} correctamente.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            toggleConfirmModal();
            await fetchData(false);

        } catch (error) {
            console.error("[STATUS EMP EXEC ERROR]", error); // Log
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al ${actionText} empleado: ${errorMsg}`, { id: toastId, duration: 5000, icon: <XCircle className="text-danger" /> }); // Mensaje
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false);
            console.log("[STATUS EMP EXEC] Execution finished."); // Log
        }
    }, [toggleConfirmModal, fetchData]); // Dependencias

    // *** AJUSTADO: Request DELETE Empleado ***
    const requestDeleteConfirmation = useCallback(async (employee) => { // Recibe 'employee'
        if (!employee || !employee.idEmployee) { // Valida employee y idEmployee
            console.error("[DELETE EMP REQ ERROR] Invalid employee data received:", employee); // Log
            return;
        }
        console.log("[DELETE EMP REQ] Requesting confirmation for employee:", JSON.stringify(employee)); // Log

        // --- OPCIONAL: Bloque de verificación de asociación ---
        // Descomenta y adapta si tienes un endpoint en tu servicio `empleadoService`
        /*
        const checkToastId = toast.loading('Verificando asociaciones...');
        try {
             console.log("[DELETE EMP REQ] Calling isEmployeeAssociated for ID:", employee.idEmployee); // Log
             const isAssociated = await empleadoService.isEmployeeAssociated(employee.idEmployee); // LLAMA A TU SERVICIO
             toast.dismiss(checkToastId);

             if (isAssociated) {
                 console.warn(`[DELETE EMP REQ] Deletion blocked for ${employee.fullName} (ID: ${employee.idEmployee}) due to associations.`); // Log
                 // Mensaje usa fullName
                 toast.error(`"${employee.fullName}" no se puede eliminar. Está asociado a otros registros (ej. ventas, logs).`, {
                     duration: 6000, icon: <XCircle className="text-danger" />
                 });
                 return; // Detiene si está asociado
             }
             console.log("[DELETE EMP REQ] No associations found. Proceeding with confirmation setup."); // Log

        } catch (error) {
            toast.dismiss(checkToastId);
            console.error("[DELETE EMP REQ ERROR] Failed during association check:", error); // Log
            const errorMsg = error.response?.data?.message || error.message || "Error al verificar asociación";
            toast.error(`Error verificando asociaciones: ${errorMsg}`, { icon: <XCircle className="text-danger" />, duration: 5000 });
            return; // Detiene si la verificación falla
        }
        */
        // --- FIN OPCIONAL ---

        // Prepara la confirmación
        prepareConfirmation(executeDelete, {
             title: "Confirmar Eliminación",
             message: ( // Mensaje usa fullName
                 <>
                     <p>¿Está seguro que desea eliminar permanentemente al empleado <strong>{employee.fullName || 'seleccionado'}</strong>?</p>
                     <p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p>
                 </>
             ),
             confirmText: "Eliminar Definitivamente",
             confirmColor: "danger",
             itemDetails: { ...employee } // Pasa copia de los detalles del empleado
         });
    }, [prepareConfirmation]); // Dependencia

    // *** AJUSTADO: Execute DELETE Empleado ***
    const executeDelete = useCallback(async (employeeToDelete) => { // Recibe 'employeeToDelete'
        console.log("[DELETE EMP EXEC] Attempting execution with received data:", JSON.stringify(employeeToDelete)); // Log

        // Valida el argumento recibido
        if (!employeeToDelete || !employeeToDelete.idEmployee) { // Usa idEmployee
             console.error("[DELETE EMP EXEC ERROR] Missing employee data in received argument.", employeeToDelete); // Log
             toast.error("Error interno: Datos para eliminar no encontrados.", { icon: <XCircle className="text-danger" /> });
             toggleConfirmModal();
             return;
        }
        console.log("[DELETE EMP EXEC] Executing delete for employee ID:", employeeToDelete.idEmployee); // Log

        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Eliminando empleado...'); // Mensaje

        try {
            console.log("[DELETE EMP EXEC] Calling service deleteEmpleado with ID:", employeeToDelete.idEmployee); // Log
            await empleadoService.deleteEmpleado(employeeToDelete.idEmployee); // Usa servicio de empleado

            // Mensaje usa fullName
            toast.success(`Empleado "${employeeToDelete.fullName}" eliminado correctamente.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            toggleConfirmModal();
            await fetchData(false); // Refresca datos

            // Ajuste de paginación (opcional, puede causar re-renders si no se hace con cuidado)
            // Es más simple recalcular en el useMemo y ajustar con useEffect como ya está
            // const newTotalPages = Math.ceil((totalItems - 1) / ITEMS_PER_PAGE); // totalItems viene de useMemo
            // if (currentPage > newTotalPages && newTotalPages > 0) {
            //     setCurrentPage(newTotalPages);
            // }

        } catch (error) {
            console.error("[DELETE EMP EXEC ERROR] API call failed:", error); // Log
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al eliminar empleado: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 }); // Mensaje
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toggleConfirmModal, fetchData /* , currentPage, totalItems */ ]); // Quitar currentPage y totalItems si no se hace el ajuste manual de página aquí


    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm();
        clearFormErrors();
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    // *** AJUSTADO: openEditModal para Empleado ***
    const openEditModal = useCallback((employee) => {
        // Mapea TODOS los campos del empleado al estado del formulario
        // Convierte a String si es necesario (ej. ID, documento, celular)
        // Maneja fechas correctamente para el input type="date" (YYYY-MM-DD)
        const entryDate = employee.dateOfEntry ? new Date(employee.dateOfEntry).toISOString().split('T')[0] : '';

        setForm({
            idEmployee: String(employee.idEmployee ?? ''),
            fullName: employee.fullName || '',
            typeDocument: employee.typeDocument || '',
            document: String(employee.document ?? ''),
            cellPhone: String(employee.cellPhone ?? ''),
            email: employee.email || '',
            dateOfEntry: entryDate,
            emergencyContact: String(employee.emergencyContact ?? ''),
            Relationship: employee.Relationship || '',
            nameFamilyMember: employee.nameFamilyMember || '',
            BloodType: employee.BloodType || '',
            socialSecurityNumber: String(employee.socialSecurityNumber ?? ''),
            Address: employee.Address || '',
            contractType: employee.contractType || '',
            status: employee.status !== undefined ? employee.status : true,
        });
        setIsEditing(true);
        clearFormErrors(); // Limpia errores anteriores
        setModalOpen(true);
    }, [clearFormErrors]);

    // Abre el modal de detalles
    const openDetailModal = useCallback((employee) => {
        setSelectedItemForDetail(employee); // Guarda el empleado seleccionado
        setDetailModalOpen(true); // Abre el modal
    }, []);


    // --- Filtering and Pagination Logic ---
    // *** AJUSTADO: Filtrar por campos de Empleado ***
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        return data.filter(
            (item) =>
                (item?.fullName?.toLowerCase() ?? '').includes(tableSearchText) ||
                (String(item?.document ?? '').toLowerCase()).includes(tableSearchText) ||
                (item?.email?.toLowerCase() ?? '').includes(tableSearchText) // Añadido email a la búsqueda
        );
    }, [data, tableSearchText]); // Dependencias

    // Lógica de paginación (sin cambios)
    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, validCurrentPage]);

    // Ajusta página si es inválida (sin cambios)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
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
                    className: 'react-hot-toast',
                    style: { maxWidth: '600px', padding: '12px 16px', textAlign: 'center', zIndex: 9999 },
                    success: { duration: 3000 }, // Iconos se definen por llamada
                    error: { duration: 5000 }
                }}
             />

            {/* Header and Actions - *** AJUSTADO: Textos Empleado *** */}
            <h2 className="mb-4">Gestión de Empleados</h2>
            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input
                        type="text"
                        bsSize="sm"
                        placeholder="Buscar por nombre, documento, email..." // Placeholder actualizado
                        value={tableSearchText}
                        onChange={handleTableSearch}
                        style={{ borderRadius: '0.25rem' }}
                        aria-label="Buscar empleados"
                    />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                     {/* Botón Agregar Empleado */}
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add-employee">
                        <Plus size={18} className="me-1" /> Agregar Empleado
                    </Button>
                </Col>
            </Row>

            {/* Data Table - *** AJUSTADO: Columnas y datos Empleado *** */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            {/* Columnas de Empleado */}
                            <th scope="col">ID</th>
                            <th scope="col">Nombre Completo</th>
                            <th scope="col">Tipo Doc.</th>
                            <th scope="col">Documento</th>
                            <th scope="col">Celular</th>
                            <th scope="col">Email</th>
                            <th scope="col" className="text-center">Estado</th>
                            <th scope="col" className="text-center" style={{ minWidth: '130px' }}>Acciones</th> {/* Ancho mínimo para 3 botones */}
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading ? (
                            <tr><td colSpan="8" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr> // Ajusta colSpan
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idEmployee} style={{ verticalAlign: 'middle' }}> {/* Key usa idEmployee */}
                                    {/* Datos del empleado */}
                                    <th scope="row">{item.idEmployee}</th>
                                    <td>{item.fullName || '-'}</td>
                                    <td>{item.typeDocument || '-'}</td>
                                    <td>{item.document || '-'}</td>
                                    <td>{item.cellPhone || '-'}</td>
                                    <td>{item.email || '-'}</td>
                                    <td className="text-center">
                                        {/* Botón de estado llama con idEmployee y fullName */}
                                        <Button
                                            size="sm"
                                            className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`}
                                            onClick={() => requestChangeStatusConfirmation(item.idEmployee, item.status, item.fullName)}
                                            disabled={!item.idEmployee || isConfirmActionLoading}
                                            title={item.status ? "Clic para Desactivar" : "Clic para Activar"}
                                            aria-label={`Cambiar estado de ${item.fullName}. Estado actual: ${item.status ? 'Activo' : 'Inactivo'}`}
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        {/* Acciones usan idEmployee y item completo */}
                                        <div className="d-inline-flex gap-1 action-cell-content" role="group" aria-label={`Acciones para ${item.fullName}`}>
                                             {/* Botón Ver Detalles */}
                                            <Button
                                                disabled={!item.idEmployee || isConfirmActionLoading}
                                                size="sm"
                                                color="info" // Color distintivo para ver
                                                onClick={() => openDetailModal(item)}
                                                title="Ver Detalles"
                                                className="action-button action-view"
                                                aria-label={`Ver detalles de ${item.fullName}`}
                                            >
                                                <Eye size={18} /> {/* Tamaño ajustado */}
                                            </Button>
                                            {/* Botón Editar */}
                                            <Button
                                                disabled={!item.idEmployee || isConfirmActionLoading}
                                                size="sm"
                                                onClick={() => openEditModal(item)}
                                                title="Editar"
                                                className="action-button action-edit" // Mismo color que antes
                                                aria-label={`Editar ${item.fullName}`}
                                            >
                                                <Edit size={18} /> {/* Tamaño ajustado */}
                                            </Button>
                                            {/* Botón Eliminar */}
                                            <Button
                                                disabled={!item.idEmployee || isConfirmActionLoading}
                                                size="sm"
                                                onClick={() => requestDeleteConfirmation(item)}
                                                title="Eliminar"
                                                className="action-button action-delete" // Mismo color que antes
                                                aria-label={`Eliminar ${item.fullName}`}
                                             >
                                                 <Trash2 size={18} /> {/* Tamaño ajustado */}
                                             </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         ) : (
                            <tr><td colSpan="8" className="text-center fst-italic p-4"> {/* Ajusta colSpan */}
                                {tableSearchText
                                    ? 'No se encontraron empleados que coincidan con la búsqueda.'
                                    : (data.length === 0 ? 'Aún no hay empleados registrados.' : 'No hay resultados para mostrar en esta página.')
                                }
                                {!tableSearchText && data.length === 0 && !isLoading && (
                                    <span className="d-block mt-2">
                                        <Button size="sm" color="link" onClick={openAddModal}>Agregar el primer empleado</Button>
                                    </span>
                                 )}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

             {/* Paginator */}
             { totalPages > 1 && !isLoading && (
                <CustomPagination
                    currentPage={validCurrentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
             )}

            {/* Add/Edit Modal - *** AJUSTADO: Campos Empleado *** */}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="xl" backdrop="static" keyboard={false} aria-labelledby="employeeModalTitle">
                <ModalHeader toggle={toggleMainModal} id="employeeModalTitle">
                     {/* Título Empleado */}
                     {isEditing ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
                </ModalHeader>
                <ModalBody>
                     <Form id="employeeForm" noValidate onSubmit={(e) => e.preventDefault()}>
                         <Row className="g-3"> {/* g-3 para un poco más de espacio entre campos */}
                            {/* Fila 1 */}
                            <Col md={6} lg={4}>
                                <FormGroup>
                                    <Label for="modalFullName" className="form-label fw-bold">Nombre Completo <span className="text-danger">*</span></Label>
                                    <Input id="modalFullName" bsSize="sm" type="text" name="fullName" value={form.fullName} onChange={handleChange} invalid={formErrors.fullName} required />
                                    {formErrors.fullName && <div className="invalid-feedback d-block">El nombre completo es obligatorio.</div>}
                                </FormGroup>
                            </Col>
                            <Col md={6} lg={4}>
                                <FormGroup>
                                    <Label for="modalTypeDocument" className="form-label fw-bold">Tipo Documento <span className="text-danger">*</span></Label>
                                    <Input id="modalTypeDocument" bsSize="sm" type="select" name="typeDocument" value={form.typeDocument} onChange={handleChange} invalid={formErrors.typeDocument} required>
                                        <option value="" disabled>Seleccione...</option>
                                        {TIPOS_DOCUMENTOS_EMPLEADO.map((tipo) => (<option key={tipo.value} value={tipo.value}>{tipo.label}</option>))}
                                    </Input>
                                    {formErrors.typeDocument && <div className="invalid-feedback d-block">Seleccione un tipo de documento.</div>}
                                </FormGroup>
                            </Col>
                            <Col md={6} lg={4}>
                                <FormGroup>
                                    <Label for="modalDocument" className="form-label fw-bold">Documento <span className="text-danger">*</span></Label>
                                    <Input id="modalDocument" bsSize="sm" type="text" name="document" value={form.document} onChange={handleChange} invalid={formErrors.document} required />
                                    {formErrors.document && <div className="invalid-feedback d-block">El documento es obligatorio y debe ser alfanumérico.</div>}
                                </FormGroup>
                            </Col>

                             {/* Fila 2 */}
                             <Col md={6} lg={4}>
                                <FormGroup>
                                    <Label for="modalCellPhone" className="form-label fw-bold">Celular <span className="text-danger">*</span></Label>
                                    <Input id="modalCellPhone" bsSize="sm" type="tel" inputMode="tel" name="cellPhone" value={form.cellPhone} onChange={handleChange} invalid={formErrors.cellPhone} required />
                                    {formErrors.cellPhone && <div className="invalid-feedback d-block">Ingrese un celular válido (7-15 dígitos).</div>}
                                </FormGroup>
                            </Col>
                             <Col md={6} lg={4}>
                                <FormGroup>
                                    <Label for="modalEmail" className="form-label fw-bold">Correo Electrónico <span className="text-danger">*</span></Label>
                                    <Input id="modalEmail" bsSize="sm" type="email" name="email" value={form.email} onChange={handleChange} invalid={formErrors.email} required />
                                    {formErrors.email && <div className="invalid-feedback d-block">Ingrese un correo electrónico válido.</div>}
                                </FormGroup>
                            </Col>
                            <Col md={6} lg={4}>
                                <FormGroup>
                                    <Label for="modalDateOfEntry" className="form-label fw-bold">Fecha Ingreso <span className="text-danger">*</span></Label>
                                    <Input id="modalDateOfEntry" bsSize="sm" type="date" name="dateOfEntry" value={form.dateOfEntry} onChange={handleChange} invalid={formErrors.dateOfEntry} required />
                                    {formErrors.dateOfEntry && <div className="invalid-feedback d-block">La fecha de ingreso es obligatoria.</div>}
                                </FormGroup>
                            </Col>

                             {/* Fila 3 */}
                             <Col md={8}> {/* Dirección más ancha */}
                                <FormGroup>
                                    <Label for="modalAddress" className="form-label fw-bold">Dirección <span className="text-danger">*</span></Label>
                                    <Input id="modalAddress" bsSize="sm" type="text" name="Address" value={form.Address} onChange={handleChange} invalid={formErrors.Address} required />
                                    {formErrors.Address && <div className="invalid-feedback d-block">La dirección es obligatoria.</div>}
                                </FormGroup>
                            </Col>
                             <Col md={4}>
                                <FormGroup>
                                    <Label for="modalContractType" className="form-label fw-bold">Tipo Contrato <span className="text-danger">*</span></Label>
                                    <Input id="modalContractType" bsSize="sm" type="text" name="contractType" value={form.contractType} onChange={handleChange} invalid={formErrors.contractType} required />
                                    {formErrors.contractType && <div className="invalid-feedback d-block">El tipo de contrato es obligatorio.</div>}
                                </FormGroup>
                            </Col>

                             {/* Fila 4 */}
                             <Col md={4}>
                                <FormGroup>
                                    <Label for="modalBloodType" className="form-label fw-bold">Tipo Sangre <span className="text-danger">*</span></Label>
                                    <Input id="modalBloodType" bsSize="sm" type="text" name="BloodType" value={form.BloodType} onChange={handleChange} invalid={formErrors.BloodType} required />
                                    {formErrors.BloodType && <div className="invalid-feedback d-block">El tipo de sangre es obligatorio.</div>}
                                </FormGroup>
                            </Col>
                             <Col md={4}>
                                <FormGroup>
                                    <Label for="modalSocialSecurityNumber" className="form-label fw-bold">No. Seg. Social <span className="text-danger">*</span></Label>
                                    <Input id="modalSocialSecurityNumber" bsSize="sm" type="text" name="socialSecurityNumber" value={form.socialSecurityNumber} onChange={handleChange} invalid={formErrors.socialSecurityNumber} required />
                                    {formErrors.socialSecurityNumber && <div className="invalid-feedback d-block">El número de seguridad social es obligatorio.</div>}
                                </FormGroup>
                            </Col>
                             <Col md={4}> {/* Espacio libre o campo adicional */} </Col>

                            {/* Fila 5 - Contacto Emergencia */}
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="modalEmergencyContact" className="form-label fw-bold">Tel. Emergencia <span className="text-danger">*</span></Label>
                                    <Input id="modalEmergencyContact" bsSize="sm" type="tel" inputMode="tel" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} invalid={formErrors.emergencyContact} required />
                                    {formErrors.emergencyContact && <div className="invalid-feedback d-block">El teléfono de emergencia es obligatorio (7-15 dígitos).</div>}
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="modalNameFamilyMember" className="form-label fw-bold">Nombre Familiar <span className="text-danger">*</span></Label>
                                    <Input id="modalNameFamilyMember" bsSize="sm" type="text" name="nameFamilyMember" value={form.nameFamilyMember} onChange={handleChange} invalid={formErrors.nameFamilyMember} required />
                                    {formErrors.nameFamilyMember && <div className="invalid-feedback d-block">El nombre del familiar es obligatorio.</div>}
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label for="modalRelationship" className="form-label fw-bold">Parentesco <span className="text-danger">*</span></Label>
                                    <Input id="modalRelationship" bsSize="sm" type="text" name="Relationship" value={form.Relationship} onChange={handleChange} invalid={formErrors.Relationship} required />
                                    {formErrors.Relationship && <div className="invalid-feedback d-block">El parentesco es obligatorio.</div>}
                                </FormGroup>
                            </Col>

                            {/* Puedes añadir la imagen decorativa aquí si quieres, similar a Proveedores */}
                            {/*
                            <Col md={5} lg={4} className="d-none d-md-flex align-items-center justify-content-center mt-4 mt-md-0">
                                <img src={FondoForm} alt="Ilustración decorativa" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: '0.375rem' }}/>
                            </Col>
                            */}
                        </Row>
                    </Form>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={toggleMainModal}>Cancelar</Button>
                    {/* Botones Agregar/Guardar Empleado */}
                    <Button type="button" color="primary" onClick={isEditing ? requestEditConfirmation : handleSubmit}>
                        {isEditing ? <><Edit size={18} className="me-1"/> Guardar Cambios</> : <><Plus size={18} className="me-1"/> Agregar Empleado</>}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Confirmation Modal */}
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

            {/* Detail Modal */}
            <DetailModal
                isOpen={detailModalOpen}
                toggle={toggleDetailModal}
                title="Detalles del Empleado" // Título
                item={selectedItemForDetail} // Item a mostrar
            />

        </Container>
    );
};

export default Empleados; // *** AJUSTADO: Exporta Empleados ***