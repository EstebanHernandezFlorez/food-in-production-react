import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import "bootstrap/dist/css/bootstrap.min.css";
import {
    Table, Button, Container, Row, Col, Input,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
    Card, CardBody, CardText, CardTitle, CardHeader
} from "reactstrap";
// Iconos actualizados
import { Eye, List, Plus, Trash2, AlertTriangle, ArrowUp, ArrowDown, Package, Warehouse, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components & Services ---
import CustomPagination from '../../General/CustomPagination';
import { formatCurrencyCOP } from "../../../utils/formatting";
import purchaseService from '../../services/registroCompraService';
import supplyService from '../../services/supplyService';

// --- Styles ---
import "../../../assets/css/App.css";

// --- Constantes ---
const ITEMS_PER_PAGE = 8;
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary" };

// ===================================================================
// ===                INICIO DE COMPONENTES MODALES                ===
// ===================================================================

const PurchaseDetailsModal = ({ isOpen, toggle, purchase }) => {
    if (!purchase) return null;

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
                                    <div className="card-footer bg-light text-end"> <strong className="me-2">Subtotal:</strong> <span className="fs-5 fw-bold text-dark">{formatCurrencyCOP(getSubtotal(detail))}</span> </div>
                                </Card>
                            </Col>
                        );
                    })} </Row>
                ) : <p className="fst-italic">No hay detalles de insumos disponibles.</p>}
                
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
            </ModalBody>
            <ModalFooter className="d-flex justify-content-between align-items-center">
                <div> <strong className="me-2">Total General de la Orden:</strong> <span className="fs-4 fw-bolder text-success">{formatCurrencyCOP(Number(purchase.totalAmount) || 0)}</span> </div>
                <Button color="secondary" outline onClick={toggle}>Cerrar</Button>
            </ModalFooter>
        </Modal>
    );
};

const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => ( <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}> <ModalHeader toggle={!isConfirming ? toggle : undefined}> <div className="d-flex align-items-center"> <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : 'primary'} me-2`} /> <span className="fw-bold">{title}</span> </div> </ModalHeader> <ModalBody>{children}</ModalBody> <ModalFooter> <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button> <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}> {isConfirming ? (<><Spinner size="sm"/> Procesando...</>) : confirmText} </Button> </ModalFooter> </Modal> );

const SupplyStockModal = ({ isOpen, toggle, supplies, isLoading }) => {
    const formatStockQuantity = (quantity, unit) => {
        const numQuantity = Number(quantity);
        if (isNaN(numQuantity)) return { displayValue: '0', displayUnit: unit };
        const unitLower = unit.toLowerCase();
        if (unitLower === 'g' || unitLower === 'gramos') {
            if (numQuantity >= 1000) {
                return { displayValue: (numQuantity / 1000).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 3 }), displayUnit: 'kg' };
            }
        }
        if (unitLower === 'ml' || unitLower === 'mililitros') {
            if (numQuantity >= 1000) {
                return { displayValue: (numQuantity / 1000).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 3 }), displayUnit: 'L' };
            }
        }
        return { displayValue: numQuantity.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 }), displayUnit: unit };
    };

    const getStockCardClass = (stock) => {
        const numStock = Number(stock);
        if (numStock <= 0) return 'border-danger border-2';
        return 'shadow-sm';
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered scrollable backdrop="static">
            <ModalHeader toggle={toggle} className="bg-light">
                <div className="d-flex align-items-center">
                    <Warehouse size={24} className="me-3 text-primary" />
                    <span className="fs-5 fw-bold">Inventario de Insumos</span>
                </div>
            </ModalHeader>
            <ModalBody className="p-4">
                {isLoading ? (
                    <div className="text-center p-5"><Spinner /><h4>Cargando inventario...</h4></div>
                ) : (
                    <Row className="g-3">
                        {supplies.length > 0 ? supplies.map(supply => {
                            const { displayValue, displayUnit } = formatStockQuantity(supply.stock, supply.unitOfMeasure);
                            return (
                                <Col md={4} lg={3} key={supply.idSupply}>
                                    <Card className={`h-100 text-center ${getStockCardClass(supply.stock)}`}>
                                        <CardBody className="d-flex flex-column justify-content-center p-3">
                                            <CardTitle tag="h6" className="fw-normal mb-3">{supply.supplyName}</CardTitle>
                                            <div>
                                                <span className="display-6 fw-bold">{displayValue}</span>
                                                <span className="ms-2 text-muted">{displayUnit}</span>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            );
                        }) : (
                            <Col>
                                <p className="text-center fst-italic p-5">No se encontraron insumos en el inventario.</p>
                            </Col>
                        )}
                    </Row>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={toggle}><X size={18} className="me-1"/>Cerrar</Button>
            </ModalFooter>
        </Modal>
    );
};

// ===================================================================
// ===           INICIO DEL COMPONENTE PRINCIPAL                   ===
// ===================================================================
const GestionComprasPage = () => {
    // Estados para la tabla de compras
    const [compras, setCompras] = useState([]);
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [tableSearchText, setTableSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    
    // Estados para los modales
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPurchaseForDetails, setSelectedPurchaseForDetails] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const confirmActionRef = useRef(null);
    const navigate = useNavigate();

    // Estados para el modal de stock
    const [suppliesStock, setSuppliesStock] = useState([]);
    const [isLoadingStock, setIsLoadingStock] = useState(true);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);

    // Lógica para obtener datos
    const fetchCompras = useCallback(async (showLoading = true) => { 
        if (showLoading) setIsLoadingTable(true); 
        try { 
            const data = await purchaseService.getAllRegisterPurchasesWithDetails(); 
            setCompras(Array.isArray(data) ? data : []); 
        } catch (error) { 
            toast.error("Error al cargar las compras registradas."); 
            setCompras([]); 
        } finally { 
            if (showLoading) setIsLoadingTable(false); 
        } 
    }, []);

    const fetchSuppliesStock = useCallback(async () => {
        setIsLoadingStock(true);
        try {
            const data = await supplyService.getAllSupplies({ status: true });
            const sortedData = Array.isArray(data) ? data.sort((a, b) => a.supplyName.localeCompare(b.supplyName)) : [];
            setSuppliesStock(sortedData);
        } catch (error) {
            toast.error("No se pudo cargar el inventario de insumos.");
            setSuppliesStock([]);
        } finally {
            setIsLoadingStock(false);
        }
    }, []);
    
    useEffect(() => {
        fetchCompras();
        fetchSuppliesStock();
    }, [fetchCompras, fetchSuppliesStock]);

    // Manejadores de eventos y lógica de la UI
    const toggleStockModal = () => setIsStockModalOpen(prev => !prev);
    const toggleDetailsModal = useCallback(() => { setDetailsModalOpen(prev => !prev); if (detailsModalOpen) setSelectedPurchaseForDetails(null); }, [detailsModalOpen]);
    const toggleConfirmModal = useCallback(() => { if (isConfirmActionLoading) return; setConfirmModalOpen(prev => !prev); }, [isConfirmActionLoading]);
    useEffect(() => { if (!confirmModalOpen && !isConfirmActionLoading) { setConfirmModalProps(INITIAL_CONFIRM_PROPS); confirmActionRef.current = null; } }, [confirmModalOpen, isConfirmActionLoading]);
    const prepareConfirmation = useCallback((actionFn, props) => { setConfirmModalProps({ ...INITIAL_CONFIRM_PROPS, ...props }); confirmActionRef.current = actionFn; setConfirmModalOpen(true); }, []);
    const executeDelete = useCallback(async (compraToDelete) => { setIsConfirmActionLoading(true); const toastId = toast.loading(`Eliminando compra #${compraToDelete.idRegisterPurchase}...`); try { await purchaseService.deleteRegisterPurchase(compraToDelete.idRegisterPurchase); toast.success(`Compra #${compraToDelete.idRegisterPurchase} eliminada.`, { id: toastId }); toggleConfirmModal(); fetchCompras(false); } catch (error) { const errorMsg = error.response?.data?.message || error.message || 'Error desconocido al eliminar.'; toast.error(`Error al eliminar: ${errorMsg}`, { id: toastId, duration: 5000 }); } finally { setIsConfirmActionLoading(false); } }, [toggleConfirmModal, fetchCompras]);
    const requestDeleteConfirmation = useCallback((compra) => { prepareConfirmation( () => executeDelete(compra), { title: "Confirmar Eliminación", message: ( <> <p>¿Está seguro que desea eliminar el registro de compra con ID <strong>#{compra.idRegisterPurchase}</strong>?</p> <p className="text-muted small">Proveedor: {compra.provider?.company || 'N/A'}<br/>Fecha: {dayjs(compra.purchaseDate).format('DD/MM/YYYY')}</p> <p className="text-danger fw-bold">Esta acción no se puede deshacer.</p> </> ), confirmText: "Eliminar", confirmColor: "danger" } ); }, [prepareConfirmation, executeDelete]);
    const handleTableSearch = useCallback((e) => { setTableSearchText(e.target.value); setCurrentPage(1); }, []);
    const handleShowDetails = useCallback((purchase) => { setSelectedPurchaseForDetails(purchase); toggleDetailsModal(); }, [toggleDetailsModal]);
    const handleNavigateToRegister = useCallback(() => { navigate('/home/compras/registrar'); }, [navigate]);
    
    // Lógica de filtrado y paginación
    const filteredData = useMemo(() => {
        if (!Array.isArray(compras)) return [];
        const sortedCompras = [...compras].sort((a, b) => (Number(b.idRegisterPurchase) || 0) - (Number(a.idRegisterPurchase) || 0));
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

    // Renderizado del componente
    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            
            <Row className="mb-4">
                <Col>
                    <h2 className="mb-0">Gestión de Compras</h2>
                </Col>
                <Col xs="auto" className="d-flex justify-content-end align-items-center gap-2">
                    <Button color="primary" outline size="sm" onClick={toggleStockModal}>
                        <Warehouse size={16} className="me-2" /> 
                        Ver Inventario
                    </Button>
                    <Button color="success" size="sm" onClick={handleNavigateToRegister}>
                        <Plus size={18} className="me-1" /> 
                        Registrar Compra
                    </Button>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h5 className="mb-0">Historial de Compras</h5>
                    <div style={{minWidth: '250px'}}>
                        <Input bsSize="sm" type="text" placeholder="Buscar ID, Proveedor..." value={tableSearchText} onChange={handleTableSearch} />
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="table-responsive">
                        <Table hover striped size="sm" className="mb-0 custom-table align-middle">
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
                                    <tr><td colSpan="6" className="text-center p-5"><Spinner /> Cargando compras...</td></tr>
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
                                                    <Button color="info" outline size="sm" onClick={() => handleShowDetails(compra)} title="Ver Detalles"><Eye size={16} /></Button>
                                                    <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(compra)} title="Eliminar Registro" disabled={isConfirmActionLoading}><Trash2 size={16} /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="text-center fst-italic p-4">
                                        {tableSearchText ? 'No se encontraron resultados.' : 'No hay compras registradas.'}
                                    </td></tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
                {!isLoadingTable && totalPages > 1 && (
                    <CardFooter>
                         <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    </CardFooter>
                )}
            </Card>

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
            <SupplyStockModal 
                isOpen={isStockModalOpen}
                toggle={toggleStockModal}
                supplies={suppliesStock}
                isLoading={isLoadingStock}
            />
        </Container>
    );
};

export default GestionComprasPage;