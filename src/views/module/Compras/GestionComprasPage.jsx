import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import "bootstrap/dist/css/bootstrap.min.css";
import {
    Table, Button, Container, Row, Col, Input,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from "reactstrap";
import { Eye, List, Plus, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components ---
import CustomPagination from '../../General/CustomPagination'; // Verifica la ruta
import { formatCurrencyCOP } from "../../../utils/formatting"; // Verifica la ruta

// --- Services ---
import registroCompraService from '../../services/registroCompraService'; // Verifica la ruta

// --- Styles ---
import "../../../App.css"; // Verifica la ruta

// --- Constants ---
const ITEMS_PER_PAGE = 8;
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null };

// --- PurchaseDetailsModal Component ---
const PurchaseDetailsModal = ({ isOpen, toggle, purchase }) => {
    if (!purchase) return null;

    // Asegúrate que el cálculo sea correcto o adapta según tu estructura de 'details'
    const totalCalculado = useMemo(() => {
        if (!Array.isArray(purchase.details)) return 0;
        return purchase.details.reduce((sum, detail) => sum + (Number(detail.subtotal) || 0), 0);
        // O si no tienes subtotal y necesitas calcularlo:
        // return purchase.details.reduce((sum, detail) => sum + ( (Number(detail.quantity) || 0) * (Number(detail.unitPrice) || 0) ), 0);
    }, [purchase]);

    const getInsumoName = (detail) => {
        // Adapta 'detail.insumo?.supplierName' si la propiedad tiene otro nombre
        return detail.insumo?.nombreInsumo || detail.insumo?.supplierName || `ID Insumo: ${detail.idSupplier}` || 'Desconocido';
    }
    const getUnitPrice = (detail) => Number(detail.unitPrice) || 0;
    const getQuantity = (detail) => Number(detail.quantity) || 0;
    const getSubtotal = (detail) => Number(detail.subtotal) || (getQuantity(detail) * getUnitPrice(detail)) || 0; // Calcula si no existe

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static" scrollable>
            <ModalHeader toggle={toggle}><List size={20} className="me-2" /> Detalles Compra #{purchase.idRegisterPurchase}</ModalHeader>
            <ModalBody>
                <Row className="mb-3 g-3">
                    <Col md={6}><strong>Proveedor:</strong> {purchase.provider?.company || 'N/A'}</Col>
                    <Col md={6}><strong>Fecha:</strong> {purchase.purchaseDate ? dayjs(purchase.purchaseDate).format('DD/MM/YYYY') : 'N/A'}</Col>
                </Row>
                <hr />
                <h6>Insumos Incluidos:</h6>
                {Array.isArray(purchase.details) && purchase.details.length > 0 ? (
                    <div className="table-responsive">
                        <Table bordered hover size="sm">
                            <thead className="table-light"><tr><th>Insumo</th><th className="text-end">Cant.</th><th className="text-end">Precio U.</th><th className="text-end">Subtotal</th></tr></thead>
                            <tbody>
                                {purchase.details.map((detail, index) => (
                                    // Asegúrate que 'detail.idPurchaseDetail' sea único o usa index como fallback
                                    <tr key={detail.idPurchaseDetail || `detail-${index}-${detail.idSupplier}`}>
                                        <td>{getInsumoName(detail)}</td>
                                        <td className="text-end">{getQuantity(detail)}</td>
                                        <td className="text-end">{formatCurrencyCOP(getUnitPrice(detail))}</td>
                                        <td className="text-end">{formatCurrencyCOP(getSubtotal(detail))}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="table-light"><td colSpan="3" className="text-end fw-bold">Total Compra:</td>
                                    {/* Usa el total calculado o el que viene de la API si es confiable */}
                                    <td className="text-end fw-bold">{formatCurrencyCOP(purchase.totalAmount ?? totalCalculado)}</td>
                                </tr>
                            </tfoot>
                        </Table>
                    </div>
                ) : <p className="fst-italic">No hay detalles de insumos disponibles.</p>}
            </ModalBody>
            <ModalFooter><Button color="secondary" outline onClick={toggle}>Cerrar</Button></ModalFooter>
        </Modal>
    );
};

// --- ConfirmationModal Component ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
     <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
             <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : 'primary'} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? (<><Spinner size="sm"/> Procesando...</>) : confirmText}
            </Button>
        </ModalFooter>
    </Modal>
);

// --- Componente Principal: GestionComprasPage ---
const GestionComprasPage = () => {
    const [compras, setCompras] = useState([]);
    const [isLoadingTable, setIsLoadingTable] = useState(true); // Inicia cargando
    const [tableSearchText, setTableSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPurchaseForDetails, setSelectedPurchaseForDetails] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const confirmActionRef = useRef(null);
    const navigate = useNavigate();

    // --- Data Fetching ---
    const fetchCompras = useCallback(async (showLoading = true) => {
        if (showLoading) {
            console.log("[fetchCompras] Setting isLoadingTable to true");
            setIsLoadingTable(true);
        }
        try {
            console.log("[fetchCompras] Calling service getRegisterPurchases...");
            // Asegúrate que esta función exista y devuelva un array de compras
            const data = await registroCompraService.getAllRegisterPurchasesWithDetails();
            console.log("[fetchCompras] Service call successful, received data:", data);
            setCompras(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching compras:", error);
            toast.error("Error al cargar las compras registradas.");
            setCompras([]); // Resetear a array vacío en caso de error
        } finally {
            // ASEGURA QUE SIEMPRE SE DESACTIVE LA CARGA
            if (showLoading) {
                 console.log("[fetchCompras] Setting isLoadingTable to false in finally block");
                setIsLoadingTable(false);
            }
        }
    }, []); // Sin dependencias si no las necesita

    // Llamar a fetchCompras al montar el componente
    useEffect(() => {
        fetchCompras();
    }, [fetchCompras]);

    // --- Modal Toggles ---
    const toggleDetailsModal = useCallback(() => {
        setDetailsModalOpen(prev => !prev);
        if (detailsModalOpen) setSelectedPurchaseForDetails(null); // Limpiar al cerrar
    }, [detailsModalOpen]);

    const toggleConfirmModal = useCallback(() => {
        // No cerrar si está cargando la acción
        if (isConfirmActionLoading) return;
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    // Resetear props del modal de confirmación cuando se cierra
    useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    // --- Confirmation Logic ---
    const prepareConfirmation = useCallback((actionFn, props) => {
        setConfirmModalProps({ ...INITIAL_CONFIRM_PROPS, ...props });
        confirmActionRef.current = actionFn;
        setConfirmModalOpen(true);
    }, []);

    const requestDeleteConfirmation = useCallback((compra) => {
        prepareConfirmation(
            () => executeDelete(compra), // La acción a ejecutar al confirmar
            {
                title: "Confirmar Eliminación",
                message: (
                    <>
                        <p>¿Está seguro que desea eliminar el registro de compra con ID <strong>#{compra.idRegisterPurchase}</strong>?</p>
                        <p className="text-muted small">Proveedor: {compra.provider?.company || 'N/A'}<br/>Fecha: {dayjs(compra.purchaseDate).format('DD/MM/YYYY')}</p>
                        <p className="text-danger fw-bold">Esta acción no se puede deshacer.</p>
                    </>
                ),
                confirmText: "Eliminar",
                confirmColor: "danger"
            }
        );
    }, [prepareConfirmation]); // executeDelete no necesita estar aquí, se pasa como función

    // --- Delete Logic ---
    const executeDelete = useCallback(async (compraToDelete) => {
        setIsConfirmActionLoading(true); // Inicia carga de acción
        const toastId = toast.loading(`Eliminando compra #${compraToDelete.idRegisterPurchase}...`);
        try {
            // Asegúrate que esta función exista en tu servicio
            await registroCompraService.deleteRegisterPurchase(compraToDelete.idRegisterPurchase);
            toast.success(`Compra #${compraToDelete.idRegisterPurchase} eliminada.`, { id: toastId, icon: <CheckCircle /> });
            toggleConfirmModal(); // Cierra el modal
            fetchCompras(false); // Recarga la tabla sin mostrar el spinner principal
        } catch (error) {
            console.error("Error deleting purchase:", error);
            const errorMsg = error.response?.data?.message || error.message || 'Error desconocido al eliminar.';
            toast.error(`Error al eliminar: ${errorMsg}`, { id: toastId, icon: <XCircle />, duration: 5000 });
            // Mantenemos el modal abierto en caso de error para que el usuario vea el mensaje
        } finally {
            setIsConfirmActionLoading(false); // Detiene carga de acción SIEMPRE
        }
    }, [toggleConfirmModal, fetchCompras]); // Depende de estas funciones

    // --- Event Handlers ---
    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value); // No es necesario toLowerCase aquí si lo haces en useMemo
        setCurrentPage(1); // Resetear a página 1 al buscar
    }, []);

    const handleShowDetails = useCallback((purchase) => {
        setSelectedPurchaseForDetails(purchase);
        toggleDetailsModal();
    }, [toggleDetailsModal]);

    const handleNavigateToRegister = useCallback(() => {
        navigate('/home/registrar-compra'); // Ajusta la ruta si es diferente
    }, [navigate]);

    // --- Filtering and Pagination Logic ---
        // --- Filtering and Pagination Logic ---
        const filteredData = useMemo(() => {
            if (!Array.isArray(compras)) return [];
    
            // 1. Crear una copia y ordenar por ID descendente PRIMERO
            const sortedCompras = [...compras].sort((a, b) => {
                // Asegurarse de que ambos IDs son números para la resta
                const idA = Number(a.idRegisterPurchase) || 0;
                const idB = Number(b.idRegisterPurchase) || 0;
                return idB - idA; // Orden descendente (mayor ID primero)
            });
    
            // 2. Luego, aplicar el filtro si existe texto de búsqueda
            const lowerSearchText = tableSearchText.trim().toLowerCase();
            if (!lowerSearchText) {
                return sortedCompras; // Devuelve la lista completa ordenada
            }
    
            return sortedCompras.filter(c =>
                (c.provider?.company?.toLowerCase() || '').includes(lowerSearchText) ||
                (String(c.idRegisterPurchase || '').toLowerCase()).includes(lowerSearchText) ||
                (c.purchaseDate ? dayjs(c.purchaseDate).format('DD/MM/YYYY') : '').includes(lowerSearchText)
            );
        }, [compras, tableSearchText]); // Las dependencias siguen siendo las mismas

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);

    // Ajustar página actual si los filtros cambian y la página actual queda fuera de rango
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        } else if (currentPage < 1 && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const currentItems = useMemo(() => {
        // Asegura que currentPage sea válido antes de calcular startIndex
        const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
        const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, currentPage, totalPages]);

    const handlePageChange = useCallback((pageNumber) => {
         setCurrentPage(pageNumber);
    }, []);

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            <h2 className="mb-4">Gestión de Compras Registradas</h2>
            <Row className="mb-3 align-items-center">
                <Col md={6} lg={4}>
                    <Input bsSize="sm" type="text" placeholder="Buscar por ID, Proveedor, Fecha..." value={tableSearchText} onChange={handleTableSearch} aria-label="Buscar compras" />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={handleNavigateToRegister} className="button-add">
                        <Plus size={18} className="me-1" /> Registrar Nueva Compra
                    </Button>
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                    <thead className="table-dark">
                        <tr><th scope="col">ID</th><th scope="col">Proveedor</th><th scope="col">Fecha</th><th scope="col" className="text-end">Monto Total</th><th scope="col" className="text-center">Acciones</th></tr>
                    </thead>
                     <tbody>
                        {isLoadingTable ? (
                            <tr><td colSpan="5" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((compra) => (
                                <tr key={compra.idRegisterPurchase} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{compra.idRegisterPurchase}</th>
                                    <td>{compra.provider?.company || <span className="text-muted fst-italic">N/A</span>}</td>
                                    <td>{compra.purchaseDate ? dayjs(compra.purchaseDate).format('DD/MM/YYYY') : '-'}</td>
                                    <td className="text-end">{formatCurrencyCOP(compra.totalAmount)}</td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            <Button color="info" outline size="sm" onClick={() => handleShowDetails(compra)} title="Ver Detalles"><Eye size={16} /></Button>
                                            <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(compra)} title="Eliminar Registro" disabled={isConfirmActionLoading}><Trash2 size={16} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan="5" className="text-center fst-italic p-4">
                                {tableSearchText ? 'No se encontraron resultados para su búsqueda.' : 'No hay compras registradas.'}
                                {!isLoadingTable && compras.length === 0 && !tableSearchText && (
                                    <span className="d-block mt-2">Aún no hay compras. <Button size="sm" color="link" onClick={handleNavigateToRegister} className="p-0 align-baseline">Registrar la primera</Button></span>
                                )}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {!isLoadingTable && totalPages > 1 && (
                <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            {/* Modals */}
            <PurchaseDetailsModal isOpen={detailsModalOpen} toggle={toggleDetailsModal} purchase={selectedPurchaseForDetails} />
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

export default GestionComprasPage;