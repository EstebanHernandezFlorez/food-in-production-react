// src/components/Compras/GestionComprasPage.jsx
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
import CustomPagination from '../../General/CustomPagination'; // Ajusta la ruta si es necesario
import { formatCurrencyCOP } from "../../../utils/formatting"; // Ajusta la ruta si es necesario

// --- Services ---
import purchaseService from '../../services/registroCompraService';

// --- Styles ---
import "../../../assets/css/App.css"; // Ajusta la ruta si es necesario

// --- Constants ---
const ITEMS_PER_PAGE = 8;
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null };

// --- PurchaseDetailsModal Component ---
const PurchaseDetailsModal = ({ isOpen, toggle, purchase }) => {
    if (!purchase) return null;

    const getInsumoName = (detail) => {
        // Asume que el insumo viene en detail.supply
        // y que el insumo tiene .name o .supplyName y .idSupply
        return detail.supply?.name || detail.supply?.supplyName || `ID Insumo: ${detail.idSupply || 'N/A'}` || 'Desconocido';
    }
    const getUnitPrice = (detail) => Number(detail.unitPrice) || 0;
    const getQuantity = (detail) => Number(detail.quantity) || 0;
    
    // El subtotal del detalle DEBE venir calculado del backend en detail.subtotal
    // El fallback es solo por si acaso, pero no debería ser necesario si el backend funciona bien.
    const getSubtotal = (detail) => {
        const backendSubtotal = Number(detail.subtotal);
        if (!isNaN(backendSubtotal)) {
            return backendSubtotal;
        }
        // Fallback si detail.subtotal no está o no es un número
        console.warn(`Subtotal del detalle (ID: ${detail.idPurchaseDetail}) no encontrado o no es numérico, calculando en frontend.`);
        return getQuantity(detail) * getUnitPrice(detail);
    };

    const getUnitOfMeasure = (detail) => {
        return detail.supply?.unitOfMeasure || detail.supply?.unitOfMeasure || ''; // unitOfMeasure es el campo que definimos en el modelo Supply
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static" scrollable>
            <ModalHeader toggle={toggle}><List size={20} className="me-2" /> Detalles Compra #{purchase.idRegisterPurchase}</ModalHeader>
            <ModalBody>
                <Row className="mb-3 g-3">
                    <Col md={6}><strong>Proveedor:</strong> {purchase.provider?.company || 'N/A'}</Col>
                    <Col md={6}><strong>Fecha:</strong> {purchase.purchaseDate ? dayjs(purchase.purchaseDate).format('DD/MM/YYYY') : 'N/A'}</Col>
                    <Col md={12}><strong>Categoría:</strong> {purchase.category || 'N/A'}</Col>
                </Row>
                <hr />
                <h6>Insumos Incluidos:</h6>
                {Array.isArray(purchase.details) && purchase.details.length > 0 ? (
                    <div className="table-responsive">
                        <Table bordered hover size="sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Insumo</th>
                                    <th className="text-end">Cant.</th>
                                    <th className="text-center">U.M.</th>
                                    <th className="text-end">Precio U.</th>
                                    <th className="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchase.details.map((detail, index) => (
                                    <tr key={detail.idPurchaseDetail || `detail-${index}-${detail.idSupply}`}>
                                        <td>{getInsumoName(detail)}</td>
                                        <td className="text-end">{getQuantity(detail)}</td>
                                        <td className="text-center">{getUnitOfMeasure(detail)}</td>
                                        <td className="text-end">{formatCurrencyCOP(getUnitPrice(detail))}</td>
                                        <td className="text-end">{formatCurrencyCOP(getSubtotal(detail))}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="table-light">
                                    <td colSpan="4" className="text-end fw-bold">Subtotal Compra:</td>
                                    <td className="text-end fw-bold">{formatCurrencyCOP(Number(purchase.subtotalAmount) || 0)}</td>
                                </tr>
                                {/* Aquí irían impuestos y descuentos si los tuvieras a nivel de cabecera */}
                                <tr className="table-light">
                                    <td colSpan="4" className="text-end fw-bold">Total Compra:</td>
                                    <td className="text-end fw-bold">{formatCurrencyCOP(Number(purchase.totalAmount) || 0)}</td>
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
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [tableSearchText, setTableSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPurchaseForDetails, setSelectedPurchaseForDetails] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const confirmActionRef = useRef(null);
    const navigate = useNavigate();

    const fetchCompras = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoadingTable(true);
        try {
            const data = await purchaseService.getAllRegisterPurchasesWithDetails();
            // console.log("Datos recibidos de getAllRegisterPurchasesWithDetails:", data); // DEBUG
            setCompras(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching compras:", error);
            toast.error("Error al cargar las compras registradas.");
            setCompras([]);
        } finally {
            if (showLoading) setIsLoadingTable(false);
        }
    }, []);

    useEffect(() => {
        fetchCompras();
    }, [fetchCompras]);

    const toggleDetailsModal = useCallback(() => {
        setDetailsModalOpen(prev => !prev);
        if (detailsModalOpen) setSelectedPurchaseForDetails(null);
    }, [detailsModalOpen]);

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
        setConfirmModalProps({ ...INITIAL_CONFIRM_PROPS, ...props });
        confirmActionRef.current = actionFn;
        setConfirmModalOpen(true);
    }, []);

    const requestDeleteConfirmation = useCallback((compra) => {
        prepareConfirmation(
            () => executeDelete(compra),
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
    }, [prepareConfirmation]);

    const executeDelete = useCallback(async (compraToDelete) => {
        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`Eliminando compra #${compraToDelete.idRegisterPurchase}...`);
        try {
            await purchaseService.deleteRegisterPurchase(compraToDelete.idRegisterPurchase);
            toast.success(`Compra #${compraToDelete.idRegisterPurchase} eliminada.`, { id: toastId, icon: <CheckCircle /> });
            toggleConfirmModal();
            fetchCompras(false);
        } catch (error) {
            console.error("Error deleting purchase:", error);
            const errorMsg = error.message || 'Error desconocido al eliminar.';
            toast.error(`Error al eliminar: ${errorMsg}`, { id: toastId, icon: <XCircle />, duration: 5000 });
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, fetchCompras]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value);
        setCurrentPage(1);
    }, []);

    const handleShowDetails = useCallback((purchase) => {
        // console.log("Mostrando detalles para la compra:", purchase); // DEBUG
        setSelectedPurchaseForDetails(purchase);
        toggleDetailsModal();
    }, [toggleDetailsModal]);

    const handleNavigateToRegister = useCallback(() => {
        navigate('/home/compras/registrar');
    }, [navigate]);

    const filteredData = useMemo(() => {
        if (!Array.isArray(compras)) return [];
        const sortedCompras = [...compras].sort((a, b) => (Number(a.idRegisterPurchase) || 0) - (Number(b.idRegisterPurchase) || 0));
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedCompras;
        return sortedCompras.filter(c =>
            (c.provider?.company?.toLowerCase() || '').includes(lowerSearchText) ||
            (String(c.idRegisterPurchase || '').toLowerCase()).includes(lowerSearchText) ||
            (c.purchaseDate ? dayjs(c.purchaseDate).format('DD/MM/YYYY') : '').includes(lowerSearchText) ||
            (c.category?.toLowerCase() || '').includes(lowerSearchText)
        );
    }, [compras, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
        else if (currentPage < 1 && totalPages > 0) setCurrentPage(1);
    }, [totalPages, currentPage]);

    const currentItems = useMemo(() => {
        const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
        const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, currentPage, totalPages]);

    const handlePageChange = useCallback((pageNumber) => {
         setCurrentPage(pageNumber);
    }, []);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            <h2 className="mb-4">Gestión de Compras Registradas</h2>
            <Row className="mb-3 align-items-center">
                <Col md={6} lg={4}>
                    <Input bsSize="sm" type="text" placeholder="Buscar ID, Proveedor, Fecha, Categoría..." value={tableSearchText} onChange={handleTableSearch} aria-label="Buscar compras" />
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
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Proveedor</th>
                            <th scope="col">Fecha</th>
                            <th scope="col">Categoría</th>
                            <th scope="col" className="text-end">Monto Total</th>
                            <th scope="col" className="text-center">Acciones</th>
                        </tr>
                    </thead>
                     <tbody>
                        {isLoadingTable ? (
                            <tr><td colSpan="6" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((compra) => (
                                <tr key={compra.idRegisterPurchase} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{compra.idRegisterPurchase}</th>
                                    <td>{compra.provider?.company || <span className="text-muted fst-italic">N/A</span>}</td>
                                    <td>{compra.purchaseDate ? dayjs(compra.purchaseDate).format('DD/MM/YYYY') : '-'}</td>
                                    <td>{compra.category || <span className="text-muted fst-italic">N/A</span>}</td>
                                    {/* Asegurarse que compra.totalAmount tenga un valor numérico */}
                                    <td className="text-end">{formatCurrencyCOP(Number(compra.totalAmount) || 0)}</td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            <Button color="info" outline size="sm" onClick={() => handleShowDetails(compra)} title="Ver Detalles"><Eye size={16} /></Button>
                                            <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(compra)} title="Eliminar Registro" disabled={isConfirmActionLoading}><Trash2 size={16} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan="6" className="text-center fst-italic p-4">
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