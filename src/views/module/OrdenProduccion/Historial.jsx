import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../assets/css/App.css"; 
import {
    Table, Button, Container, Row, Col, Input, Spinner,
    Modal, ModalHeader, ModalBody, ModalFooter, Badge, ListGroup, ListGroupItem,
    Alert
} from 'reactstrap';
import { 
    Eye, Plus, Search, CheckCircle, XCircle, Package, Calendar, User, Hash, 
    Clock, Timer, MessageSquare, AlertCircle, FileDown, Trash2 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CustomPagination from '../../General/CustomPagination';
import { ActiveOrdersContext } from './ActiveOrdersContext';
import productionOrderService from '../../services/productionOrderService';

const ITEMS_PER_PAGE = 10;
const STEPS_PER_PAGE_MODAL = 5;

const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(date);
    } catch (e) {
        return '-';
    }
};

const DetailItem = ({ icon, label, value }) => (
    <Col md={4} className="mb-2">
        <div className="d-flex">
            {React.cloneElement(icon, { size: 16, className: "me-2 text-muted flex-shrink-0 mt-1" })}
            <div>
                <strong className="d-block small text-muted">{label}</strong>
                <span className="fw-semibold">{value || '-'}</span>
            </div>
        </div>
    </Col>
);

const calculateDuration = (start, end) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) return null;
    let diff = (endDate.getTime() - startDate.getTime()) / 1000;
    const days = Math.floor(diff / (24 * 3600));
    diff -= days * 24 * 3600;
    const hours = Math.floor(diff / 3600);
    diff -= hours * 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = Math.floor(diff % 60);
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds >= 0) result += `${seconds}s`;
    return result.trim() || '0s';
};

const getOrderStatusBadgeInfo = (status) => {
    switch (status?.toUpperCase()) {
        case 'PENDING': return { text: 'Pendiente', color: 'secondary', icon: <Clock size={14} /> };
        case 'SETUP': return { text: 'Configuración', color: 'info', icon: <CheckCircle size={14} /> };
        case 'SETUP_COMPLETED': return { text: 'Configurada', color: 'info', icon: <CheckCircle size={14} /> };
        case 'IN_PROGRESS': return { text: 'En Proceso', color: 'warning', icon: <Spinner size="sm" /> };
        case 'ALL_STEPS_COMPLETED': return { text: 'Pasos Finalizados', color: 'primary', icon: <CheckCircle size={14} /> };
        case 'COMPLETED': return { text: 'Completada', color: 'success', icon: <CheckCircle size={14} /> };
        case 'CANCELLED': return { text: 'Cancelada', color: 'danger', icon: <XCircle size={14} /> };
        default: return { text: status || 'N/A', color: 'light', icon: null };
    }
};

const HistorialProduccion = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [detailModalPage, setDetailModalPage] = useState(1);
    const [showCleanupAlert, setShowCleanupAlert] = useState(false);
    
    const { addOrFocusOrder } = useContext(ActiveOrdersContext);
    const navigate = useNavigate();

    const fetchOrdersData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        try {
            const response = await productionOrderService.getAllProductionOrders();
            let ordersData = [];
            if (Array.isArray(response)) {
                ordersData = response;
            } else if (response && Array.isArray(response.rows)) {
                ordersData = response.rows;
            } else {
                console.warn("La respuesta del servicio no tiene un formato reconocible. Respuesta:", response);
            }
            const sortedOrders = ordersData.sort((a, b) => new Date(b.dateTimeCreation || b.createdAt) - new Date(a.dateTimeCreation || a.createdAt));
            setAllOrders(sortedOrders);

            if (sortedOrders.length > 0) {
                const oldestOrder = sortedOrders[sortedOrders.length - 1];
                const oldestDate = new Date(oldestOrder.dateTimeCreation || oldestOrder.createdAt);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                if (oldestDate < oneWeekAgo) {
                    setShowCleanupAlert(true);
                } else {
                    setShowCleanupAlert(false);
                }
            }
        } catch (error) {
            toast.error("Error al cargar el historial de órdenes.");
            console.error("Error fetching orders:", error.response?.data || error);
            setAllOrders([]);
        } finally {
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrdersData();
    }, [fetchOrdersData]);

    const filteredOrdersData = useMemo(() => {
        let filtered = [...allOrders];
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(order => order.status?.toUpperCase() === statusFilter);
        }
        const searchTerm = tableSearchText.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(order => {
                const statusInfo = getOrderStatusBadgeInfo(order.status);
                const hasMatchingEmployee = order.productionOrderDetails?.some(detail =>
                    detail.employeeAssigned?.fullName?.toLowerCase().includes(searchTerm)
                );
                return (
                    order.idProductionOrder?.toString().toLowerCase().includes(searchTerm) ||
                    (order.productNameSnapshot?.toLowerCase() ?? '').includes(searchTerm) ||
                    (order.Product?.productName?.toLowerCase() ?? '').includes(searchTerm) ||
                    (statusInfo.text.toLowerCase()).includes(searchTerm) ||
                    hasMatchingEmployee
                );
            });
        }
        return filtered;
    }, [allOrders, tableSearchText, statusFilter]);
    
    const handleDownloadExcel = useCallback(() => {
        if (filteredOrdersData.length === 0) {
            toast.error("No hay datos para exportar.");
            return;
        }
        const toastId = toast.loading("Generando archivo Excel...");

        const dataToExport = filteredOrdersData.map(order => ({
            'ID Orden': order.idProductionOrder,
            'Producto': order.productNameSnapshot || order.Product?.productName || 'N/A',
            'Cantidad Inicial': order.initialAmount,
            'Cantidad Final': order.finalQuantityProduct,
            'Estado': getOrderStatusBadgeInfo(order.status).text,
            'Fecha Creación': formatDateTime(order.dateTimeCreation || order.createdAt),
            'Fecha Finalización': formatDateTime(order.dateTimeCompleted),
            'Registrado por': order.employeeRegistered?.fullName || 'N/A',
            'Observaciones': order.observations,
            // ---> AÑADIDO MOTIVO DE CANCELACIÓN EN EXCEL <---
            'Motivo Cancelación': order.status === 'CANCELLED' ? order.cancellationReason : 'N/A',
        }));

        try {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "HistorialProduccion");
            XLSX.writeFile(workbook, "Historial_Produccion.xlsx");
            toast.success("¡Excel generado exitosamente!", { id: toastId });
        } catch (error) {
            console.error("Error al generar Excel:", error);
            toast.error("Error al generar el archivo Excel.", { id: toastId });
        }
    }, [filteredOrdersData]);
    
    const handleCreateNewOrder = () => {
        addOrFocusOrder(null, true, { navigateIfNeeded: false }); 
        navigate('/home/produccion/orden-produccion');
    };
    
    const handleTableSearch = (e) => setTableSearchText(e.target.value);
    useEffect(() => { setCurrentPage(1); }, [tableSearchText, statusFilter]);
    const totalItems = filteredOrdersData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
    const currentOrdersOnPage = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredOrdersData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredOrdersData, validCurrentPage]);
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
    
    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setDetailModalPage(1);
        setViewModalOpen(true);
    };
    const toggleViewModal = () => setViewModalOpen(prev => !prev);
    useEffect(() => {
        if (!viewModalOpen) {
            setSelectedOrder(null);
            setDetailModalPage(1);
        }
    }, [viewModalOpen]);

    const paginatedSteps = useMemo(() => {
        if (!selectedOrder || !selectedOrder.productionOrderDetails || selectedOrder.productionOrderDetails.length === 0) {
            return { items: [], totalPages: 0 };
        }
        const allSteps = selectedOrder.productionOrderDetails.sort((a, b) => a.processOrder - b.processOrder);
        const totalPages = Math.ceil(allSteps.length / STEPS_PER_PAGE_MODAL);
        const startIndex = (detailModalPage - 1) * STEPS_PER_PAGE_MODAL;
        const currentItems = allSteps.slice(startIndex, startIndex + STEPS_PER_PAGE_MODAL);
        return { items: currentItems, totalPages: totalPages };
    }, [selectedOrder, detailModalPage]);

    const handleDetailModalPageChange = useCallback((page) => {
        setDetailModalPage(page);
    }, []);

    return (
        <>
            {/* ---> ESTILOS CORREGIDOS <--- */}
            <style>
                {`
                    .filter-controls { display: flex; gap: 0.5rem; flex-wrap: wrap; }
                    .filter-button { background-color: transparent; border: 1px solid #dee2e6; color: #495057; padding: 0.375rem 0.85rem; font-size: 0.875rem; font-weight: 500; border-radius: 50px; cursor: pointer; transition: all 0.2s ease-in-out; position: relative; overflow: hidden; }
                    .filter-button:hover { background-color: #e9ecef; color: #0d6efd; }
                    .filter-button.active { background-color: #0d6efd; color: white; border-color: #0d6efd; font-weight: 600; box-shadow: 0 2px 5px rgba(13, 110, 253, 0.3); }
                    .action-button.action-view { background-color: transparent; border: none; color: #212529; padding: 0.25rem 0.5rem; transition: color 0.2s ease-in-out; }
                    .action-button.action-view:hover { color: #0d6efd; background-color: #e9ecef; }
                `}
            </style>
        
            <Container fluid className="p-4 main-content">
                <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
                <h2 className="mb-4 text-center">Historial de Órdenes de Producción</h2>
                
                {showCleanupAlert && (
                    <Alert color="info" className="d-flex align-items-center mb-3">
                        <AlertCircle size={20} className="me-2 flex-shrink-0" />
                        <div>
                            Hay registros con más de una semana de antigüedad. Considere <strong>exportar a Excel</strong> y limpiar el historial para mejorar el rendimiento.
                        </div>
                    </Alert>
                )}

                <Row className="mb-3 align-items-center">
                    <Col md={5} lg={4}>
                        <Input type="text" bsSize="sm" placeholder="Buscar por ID, producto, empleado..." value={tableSearchText} onChange={handleTableSearch} />
                    </Col>
                    <Col md={7} lg={8} className="d-flex justify-content-between justify-content-md-end mt-2 mt-md-0">
                        <div className="filter-controls">
                            <button className={`filter-button ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => setStatusFilter('ALL')}>Todas</button>
                            <button className={`filter-button ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`} onClick={() => setStatusFilter('IN_PROGRESS')}>En Proceso</button>
                            <button className={`filter-button ${statusFilter === 'COMPLETED' ? 'active' : ''}`} onClick={() => setStatusFilter('COMPLETED')}>Completadas</button>
                            <button className={`filter-button ${statusFilter === 'CANCELLED' ? 'active' : ''}`} onClick={() => setStatusFilter('CANCELLED')}>Canceladas</button>
                        </div>
                        <div className="d-flex gap-2 ms-3">
                            <Button color="primary" outline size="sm" onClick={handleDownloadExcel} disabled={isLoading || filteredOrdersData.length === 0}>
                                <FileDown size={18} className="me-1" /> Exportar
                            </Button>
                            <Button color="success" size="sm" onClick={handleCreateNewOrder}>
                                <Plus size={18} className="me-1" /> Nueva Orden
                            </Button>
                        </div>
                    </Col>
                </Row>
                
                <div className="table-responsive shadow-sm custom-table-container mb-3">
                    <Table hover size="sm" className="mb-0 custom-table">
                        <thead>
                            <tr>
                                <th scope="col" className="text-center" style={{width: '8%'}}>ID</th>
                                <th scope="col" style={{width: '18%'}}>Fecha Creación</th>
                                <th scope="col">Producto</th>
                                <th scope="col" className="text-center" style={{width: '10%'}}>Cantidad</th>
                                <th scope="col" className="text-center" style={{width: '15%'}}>Estado</th>
                                <th scope="col" className="text-center" style={{width: '10%'}}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center p-5"><Spinner color="primary" /> Cargando historial...</td></tr>
                            ) : currentOrdersOnPage.length > 0 ? (
                                currentOrdersOnPage.map((order) => {
                                    const statusInfo = getOrderStatusBadgeInfo(order.status);
                                    return (
                                        <tr key={order.idProductionOrder} style={{ verticalAlign: 'middle' }}>
                                            <th scope="row" className="text-center fw-bold">{order.idProductionOrder}</th>
                                            <td>{formatDateTime(order.dateTimeCreation || order.createdAt)}</td>
                                            <td>{order.productNameSnapshot || order.Product?.productName || 'N/A'}</td>
                                            <td className="text-center">{order.initialAmount || '-'}</td>
                                            <td className="text-center">
                                                <Badge color={statusInfo.color} pill className="d-inline-flex align-items-center gap-1 p-2">{statusInfo.icon} {statusInfo.text}</Badge>
                                            </td>
                                            <td className="text-center">
                                                <Button size="sm" onClick={() => handleViewOrder(order)} title="Ver Detalles" className="action-button action-view">
                                                    <Eye size={20} />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="6" className="text-center fst-italic p-4">{tableSearchText ? "No se encontraron órdenes." : "No hay órdenes registradas."}</td></tr>
                            )}
                        </tbody>
                    </Table>
                </div>
                
                {totalPages > 1 && !isLoading && (
                    <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}

                <Modal isOpen={viewModalOpen} toggle={toggleViewModal} centered size="lg" backdrop="static">
                    <ModalHeader toggle={toggleViewModal}>
                        Detalles de la Orden de Producción #{selectedOrder?.idProductionOrder}
                    </ModalHeader>
                    <ModalBody>
                        {selectedOrder ? (
                            <>
                                <Row className="mb-3 border-bottom pb-3">
                                    <DetailItem icon={<Package />} label="Producto" value={selectedOrder.productNameSnapshot || selectedOrder.Product?.productName ||'N/A'} />
                                    <DetailItem icon={<Calendar />} label="Fecha Creación" value={formatDateTime(selectedOrder.dateTimeCreation || selectedOrder.createdAt)} />
                                    <DetailItem icon={<Hash />} label="Cantidad Inicial" value={selectedOrder.initialAmount} />
                                </Row>
                                
                                {/* ---> MOTIVO DE CANCELACIÓN CORREGIDO EN EL MODAL <--- */}
                                {selectedOrder.status === 'CANCELLED' && (
                                    <Alert color="danger" className="mb-3">
                                        <h6 className="alert-heading d-flex align-items-center"><XCircle size={20} className="me-2"/>Orden Cancelada</h6>
                                        <p className="mb-0"><strong>Motivo:</strong> {selectedOrder.cancellationReason || 'No se especificó un motivo.'}</p>
                                    </Alert>
                                )}

                                <h6 className="mb-3">Registro de Pasos y Empleados</h6>
                                {paginatedSteps.items && paginatedSteps.items.length > 0 ? (
                                    <>
                                        <ListGroup flush>
                                            {paginatedSteps.items.map(detail => {
                                                const duration = calculateDuration(detail.startDate, detail.endDate);
                                                return (
                                                    <ListGroupItem key={detail.idProductionOrderDetail} className="px-0 py-2">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div className="fw-bold">Paso {detail.processOrder}: {detail.processNameSnapshot}</div>
                                                            <Badge color={getOrderStatusBadgeInfo(detail.status).color} pill>{getOrderStatusBadgeInfo(detail.status).text}</Badge>
                                                        </div>
                                                        <div className="d-flex flex-column flex-sm-row justify-content-between mt-1 small">
                                                            <div className="d-flex align-items-center text-muted">
                                                                <User size={14} className="me-2" />
                                                                <span>Empleado: <strong>{detail.employeeAssigned?.fullName || 'No Asignado'}</strong></span>
                                                            </div>
                                                            {duration && (
                                                                <div className="d-flex align-items-center text-muted mt-1 mt-sm-0">
                                                                    <Timer size={14} className="me-2" />
                                                                    <span>Duración: <strong>{duration}</strong></span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ListGroupItem>
                                                );
                                            })}
                                        </ListGroup>
                                        
                                        {paginatedSteps.totalPages > 1 && (
                                            <CustomPagination
                                                currentPage={detailModalPage}
                                                totalPages={paginatedSteps.totalPages}
                                                onPageChange={handleDetailModalPageChange}
                                                size="sm"
                                                className="mt-3 justify-content-center"
                                            />
                                        )}
                                    </>
                                ) : (
                                    <Alert color="secondary" className="text-center">Esta orden no tiene pasos detallados registrados.</Alert>
                                )}
                            </>
                        ) : (
                            <div className="text-center p-4"><Spinner /></div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" outline onClick={toggleViewModal}>Cerrar</Button>
                    </ModalFooter>
                </Modal>
            </Container>
        </>
    );
};

export default HistorialProduccion;