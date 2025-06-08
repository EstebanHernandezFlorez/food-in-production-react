import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import "bootstrap/dist/css/bootstrap.min.css";
import {
    Table, Button, Container, Row, Col, Input,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
    Card, CardBody, CardText, CardTitle
} from "reactstrap";
import { Eye, List, Plus, Trash2, AlertTriangle, ArrowUp, ArrowDown, Package } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components & Services ---
import CustomPagination from '../../General/CustomPagination';
import { formatCurrencyCOP } from "../../../utils/formatting";
import purchaseService from '../../services/registroCompraService';

// --- Styles ---
import "../../../assets/css/App.css";

// --- Constantes y Componentes Modales ---
const ITEMS_PER_PAGE = 8;
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null };

// --- COMPONENTE MODAL DE DETALLES ACTUALIZADO ---
const PurchaseDetailsModal = ({ isOpen, toggle, purchase }) => {
    if (!purchase) return null;

    // --- INICIO DE LA NUEVA LÓGICA DE CÁLCULO DE TOTALES POR INSUMO ---
    const insumoSummary = useMemo(() => {
        if (!purchase.details || !Array.isArray(purchase.details)) {
            return { items: {}, grandTotalValue: 0 };
        }
        const summary = purchase.details.reduce((acc, detail) => {
            const id = detail.idSupply;
            const name = detail.supply?.supplyName || `Insumo ID: ${id}`;
            const unit = detail.supply?.unitOfMeasure || 'U.';
            const quantity = Number(detail.quantity) || 0;
            const subtotal = Number(detail.subtotal) || 0;
            if (!acc.items[id]) {
                acc.items[id] = { name, unit, totalQuantity: 0, totalValue: 0 };
            }
            acc.items[id].totalQuantity += quantity;
            acc.items[id].totalValue += subtotal;
            acc.grandTotalValue += subtotal;
            return acc;
        }, { items: {}, grandTotalValue: 0 });
        return summary;
    }, [purchase.details]);
    // --- FIN DE LA NUEVA LÓGICA DE CÁLCULO DE TOTALES POR INSUMO ---

    const getInsumoName = (detail) => detail.supply?.supplyName || `ID Insumo: ${detail.idSupply || 'N/A'}`;
    const getUnitPrice = (detail) => Number(detail.unitPrice) || 0;
    const getQuantity = (detail) => Number(detail.quantity) || 0;
    const getSubtotal = (detail) => Number(detail.subtotal) || (getQuantity(detail) * getUnitPrice(detail));
    const getUnitOfMeasure = (detail) => detail.supply?.unitOfMeasure || '';
    const getLastPrice = (detail) => detail.supply?.lastPrice || 0;
    const priceHasChanged = (detail) => { const currentPrice = getUnitPrice(detail); const lastPrice = getLastPrice(detail); return lastPrice > 0 && currentPrice !== lastPrice; };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static" scrollable>
            <ModalHeader toggle={toggle} className="bg-light">
                <div className="d-flex align-items-center"> <List size={20} className="me-2" /> <span>Detalles de Compra #{purchase.idRegisterPurchase}</span> </div>
            </ModalHeader>
            <ModalBody className="p-4">
                <Row className="mb-4 g-3">
                    <Col md={6}><strong>Proveedor:</strong><br />{purchase.provider?.company || 'N/A'}</Col>
                    <Col md={3}><strong>Fecha:</strong><br />{purchase.purchaseDate ? dayjs(purchase.purchaseDate).format('DD/MM/YYYY') : 'N/A'}</Col>
                    <Col md={3}><strong>Categoría:</strong><br />{purchase.category || 'N/A'}</Col>
                    {purchase.invoiceNumber && <Col md={6}><strong>Factura Nº:</strong><br />{purchase.invoiceNumber}</Col>}
                </Row>
                <h5 className="mb-3">Desglose de Compras Individuales</h5>
                {Array.isArray(purchase.details) && purchase.details.length > 0 ? (
                    <Row className="g-3"> {purchase.details.map((detail, index) => {
                        const unitPrice = getUnitPrice(detail); const lastKnownPrice = getLastPrice(detail); const priceChanged = priceHasChanged(detail); const priceIncreased = unitPrice > lastKnownPrice;
                        return (
                            <Col md={6} key={detail.idPurchaseDetail || `detail-${index}`}>
                                <Card className="h-100 shadow-sm">
                                    <CardBody>
                                        <CardTitle tag="h6" className="d-flex align-items-center"> <Package size={18} className="me-2 text-primary" /> {getInsumoName(detail)} </CardTitle> <hr className="my-2" />
                                        <CardText tag="div" className="small">
                                            <Row> <Col xs={6}><strong>Cantidad:</strong></Col> <Col xs={6} className="text-end fw-bold">{getQuantity(detail)} {getUnitOfMeasure(detail)}</Col> </Row>
                                            <Row className="mt-1"> <Col xs={6}><strong>Precio Unitario:</strong></Col> <Col xs={6} className="text-end fw-bold">{formatCurrencyCOP(unitPrice)}</Col> </Row>
                                            {priceChanged && (<Row className="mt-1"> <Col xs={6} className="text-muted">Precio Anterior:</Col> <Col xs={6} className={`text-end fw-bold text-${priceIncreased ? 'danger' : 'success'}`}> {formatCurrencyCOP(lastKnownPrice)} {priceIncreased ? <ArrowUp size={14} className="ms-1" /> : <ArrowDown size={14} className="ms-1" />} </Col> </Row>)}
                                        </CardText>
                                    </CardBody>
                                    <div className="card-footer bg-light text-end"> <strong className="me-2">Subtotal de esta compra:</strong> <span className="fs-5 fw-bold text-dark">{formatCurrencyCOP(getSubtotal(detail))}</span> </div>
                                </Card>
                            </Col>
                        );
                    })} </Row>
                ) : <p className="fst-italic">No hay detalles de insumos disponibles.</p>}

                {/* --- INICIO DE LA NUEVA SECCIÓN DE RESUMEN --- */}
                {Object.keys(insumoSummary.items).length > 0 && (
                    <>
                        <hr className="my-4" />
                        <h5 className="mb-3">Resumen Total de Insumos</h5>
                        <Card className="shadow-sm">
                            <CardBody>
                                {Object.values(insumoSummary.items).map(item => (
                                    <div key={item.name} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                        <div>
                                            <strong className="d-block">{item.name}</strong>
                                            <span className="text-muted small">Cantidad Total Acumulada</span>
                                        </div>
                                        <div className="text-end">
                                            <strong className="d-block fs-5">{item.totalQuantity.toFixed(2)} {item.unit}</strong>
                                            <span className="text-muted small">{formatCurrencyCOP(item.totalValue)}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardBody>
                        </Card>
                    </>
                )}
                {/* --- FIN DE LA NUEVA SECCIÓN DE RESUMEN --- */}

            </ModalBody>
            <ModalFooter className="d-flex justify-content-between align-items-center">
                <div> <strong className="me-2">Total General de la Orden:</strong> <span className="fs-4 fw-bolder text-success">{formatCurrencyCOP(Number(purchase.totalAmount) || 0)}</span> </div>
                <Button color="secondary" outline onClick={toggle}>Cerrar</Button>
            </ModalFooter>
        </Modal>
    );
};
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => ( <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}> <ModalHeader toggle={!isConfirming ? toggle : undefined}> <div className="d-flex align-items-center"> <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : 'primary'} me-2`} /> <span className="fw-bold">{title}</span> </div> </ModalHeader> <ModalBody>{children}</ModalBody> <ModalFooter> <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button> <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}> {isConfirming ? (<><Spinner size="sm"/> Procesando...</>) : confirmText} </Button> </ModalFooter> </Modal> );

// --- Componente Principal: GestionComprasPage (sin cambios en su lógica interna) ---
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
    const fetchCompras = useCallback(async (showLoading = true) => { if (showLoading) setIsLoadingTable(true); try { const data = await purchaseService.getAllRegisterPurchasesWithDetails(); setCompras(Array.isArray(data) ? data : []); } catch (error) { toast.error("Error al cargar las compras registradas."); setCompras([]); } finally { if (showLoading) setIsLoadingTable(false); } }, []);
    useEffect(() => { fetchCompras(); }, [fetchCompras]);
    const toggleDetailsModal = useCallback(() => { setDetailsModalOpen(prev => !prev); if (detailsModalOpen) setSelectedPurchaseForDetails(null); }, [detailsModalOpen]);
    const toggleConfirmModal = useCallback(() => { if (isConfirmActionLoading) return; setConfirmModalOpen(prev => !prev); }, [isConfirmActionLoading]);
    useEffect(() => { if (!confirmModalOpen && !isConfirmActionLoading) { setConfirmModalProps(INITIAL_CONFIRM_PROPS); confirmActionRef.current = null; } }, [confirmModalOpen, isConfirmActionLoading]);
    const prepareConfirmation = useCallback((actionFn, props) => { setConfirmModalProps({ ...INITIAL_CONFIRM_PROPS, ...props }); confirmActionRef.current = actionFn; setConfirmModalOpen(true); }, []);
    const executeDelete = useCallback(async (compraToDelete) => { setIsConfirmActionLoading(true); const toastId = toast.loading(`Eliminando compra #${compraToDelete.idRegisterPurchase}...`); try { await purchaseService.deleteRegisterPurchase(compraToDelete.idRegisterPurchase); toast.success(`Compra #${compraToDelete.idRegisterPurchase} eliminada.`, { id: toastId }); toggleConfirmModal(); fetchCompras(false); } catch (error) { const errorMsg = error.response?.data?.message || error.message || 'Error desconocido al eliminar.'; toast.error(`Error al eliminar: ${errorMsg}`, { id: toastId, duration: 5000 }); } finally { setIsConfirmActionLoading(false); } }, [toggleConfirmModal, fetchCompras]);
    const requestDeleteConfirmation = useCallback((compra) => { prepareConfirmation( () => executeDelete(compra), { title: "Confirmar Eliminación", message: ( <> <p>¿Está seguro que desea eliminar el registro de compra con ID <strong>#{compra.idRegisterPurchase}</strong>?</p> <p className="text-muted small">Proveedor: {compra.provider?.company || 'N/A'}<br/>Fecha: {dayjs(compra.purchaseDate).format('DD/MM/YYYY')}</p> <p className="text-danger fw-bold">Esta acción no se puede deshacer.</p> </> ), confirmText: "Eliminar", confirmColor: "danger" } ); }, [prepareConfirmation, executeDelete]);
    const handleTableSearch = useCallback((e) => { setTableSearchText(e.target.value); setCurrentPage(1); }, []);
    const handleShowDetails = useCallback((purchase) => { setSelectedPurchaseForDetails(purchase); toggleDetailsModal(); }, [toggleDetailsModal]);
    const handleNavigateToRegister = useCallback(() => { navigate('/home/compras/registrar'); }, [navigate]);
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
    useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); else if (currentPage < 1 && totalPages > 0) setCurrentPage(1); }, [totalPages, currentPage]);
    const currentItems = useMemo(() => { const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages)); const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE; return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE); }, [filteredData, currentPage, totalPages]);
    const handlePageChange = useCallback((pageNumber) => { setCurrentPage(pageNumber); }, []);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            <h2 className="mb-4">Gestión de Compras Registradas</h2>
            <Row className="mb-3 align-items-center">
                <Col md={6} lg={4}>
                    <Input bsSize="sm" type="text" placeholder="Buscar ID, Proveedor, Fecha..." value={tableSearchText} onChange={handleTableSearch} aria-label="Buscar compras" />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={handleNavigateToRegister} className="button-add">
                        <Plus size={18} className="me-1" /> Registrar Nueva Compra
                    </Button>
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                <Table hover striped size="sm" className="mb-0 custom-table align-middle" aria-live="polite">
                    <thead className="table-light">
                        <tr>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>ID</th>
                            <th scope="col" style={{ width: '30%' }}>Proveedor</th>
                            <th scope="col" style={{ width: '15%' }}>Fecha</th>
                            <th scope="col" style={{ width: '15%' }}>Categoría</th>
                            <th scope="col" className="text-end" style={{ width: '15%' }}>Monto Total</th>
                            <th scope="col" className="text-center" style={{ width: '15%' }}>Acciones</th>
                        </tr>
                    </thead>
                     <tbody>
                        {isLoadingTable ? (
                            <tr><td colSpan="6" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((compra) => (
                                <tr key={compra.idRegisterPurchase}>
                                    <th scope="row" className="text-center">{compra.idRegisterPurchase}</th>
                                    <td>{compra.provider?.company || <span className="text-muted fst-italic">N/A</span>}</td>
                                    <td>{compra.purchaseDate ? dayjs(compra.purchaseDate).format('DD/MM/YYYY') : '-'}</td>
                                    <td>{compra.category || <span className="text-muted fst-italic">N/A</span>}</td>
                                    <td className="text-end fw-bold">{formatCurrencyCOP(Number(compra.totalAmount) || 0)}</td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            <Button color="info" outline size="sm" onClick={() => handleShowDetails(compra)} title="Ver Detalles" className="action-button"><Eye size={18} /></Button>
                                            <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(compra)} title="Eliminar Registro" disabled={isConfirmActionLoading} className="action-button"><Trash2 size={18} /></Button>
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