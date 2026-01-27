import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../assets/css/App.css"; 
import {
    Table, Button, Container, Row, Col, Input, Spinner,
    Modal, ModalHeader, ModalBody, ModalFooter, Badge, ListGroup, ListGroupItem,
    Alert
} from 'reactstrap';
import { 
    Eye, Plus, FileDown, CheckCircle, XCircle, Package, Calendar, User, Hash, 
    Clock, Timer, AlertCircle, Scale, ChevronRight, ArrowRight, Gauge
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CustomPagination from '../../General/CustomPagination';
import { ActiveOrdersContext } from './ActiveOrdersContext';
import productionOrderService from '../../services/productionOrderService';

// =================================================================================
// CONSTANTES Y HELPERS (Fuera del componente para evitar re-creación)
// =================================================================================

const ITEMS_PER_PAGE = 5;
const STEPS_PER_PAGE_MODAL = 5;

const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    } catch (e) {
        return '-';
    }
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

// =================================================================================
// SUB-COMPONENTES DE UI (Para un render más limpio en el componente principal)
// =================================================================================

const HistorialTable = ({ orders, onShowDetails }) => (
    <div className="table-responsive shadow-sm custom-table-container mb-3">
        <Table hover size="sm" className="mb-0 custom-table">
            <thead>
                <tr>
                    <th scope="col" style={{width: '20%'}}>Fecha Creación</th>
                    <th scope="col">Producto</th>
                    <th scope="col" className="text-center" style={{width: '15%'}}>Cantidad</th>
                    <th scope="col" className="text-center" style={{width: '20%'}}>Estado</th>
                    <th scope="col" className="text-center" style={{width: '10%'}}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((order) => {
                    const statusInfo = getOrderStatusBadgeInfo(order.status);
                    return (
                        <tr key={order.idProductionOrder} style={{ verticalAlign: 'middle' }}>
                            <td>{formatDateTime(order.dateTimeCreation || order.createdAt)}</td>
                            <td>{order.productNameSnapshot || order.Product?.productName || 'N/A'}</td>
                            <td className="text-center">{order.initialAmount || '-'}</td>
                            <td className="text-center">
                                <Badge color={statusInfo.color} pill className="d-inline-flex align-items-center gap-1 p-2">{statusInfo.icon} {statusInfo.text}</Badge>
                            </td>
                            <td className="text-center">
                                <Button size="sm" onClick={() => onShowDetails(order)} title="Ver Detalles" className="action-button action-view">
                                    <Eye size={20} />
                                </Button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    </div>
);

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

const DetalleOrdenModal = ({ isOpen, toggle, order, currentPage, totalPages, onPageChange }) => {
    // Helper para determinar la fecha de fin (si no existe dateTimeCompleted, usamos updatedAt cuando está completada)
    const endDateTime = order?.status === 'COMPLETED' ? (order.dateTimeCompleted || order.updatedAt) : null;

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static"  scrollable={true}>
            <ModalHeader toggle={toggle} className="bg-light">
                <div className="d-flex align-items-center">
                    <Gauge size={20} className="me-2 text-primary" />
                    <span>Análisis Detallado: Orden de Producción #{order?.idProductionOrder}</span>
                </div>
            </ModalHeader>
            <ModalBody className="p-4">
                {!order ? (
                    <div className="text-center p-4"><Spinner color="primary" /></div>
                ) : (
                    <>
                        {/* SECCIÓN 1: INFORMACIÓN GENERAL Y TIEMPOS */}
                        <div className="mb-4">
                            <h6 className="text-uppercase text-muted fw-bold small border-bottom pb-2 mb-3">Cronología de la Orden</h6>
                            <Row>
                                <DetailItem icon={<Package />} label="Producto" value={order.productNameSnapshot || order.Product?.productName} />
                                <DetailItem icon={<Clock />} label="Inicio (Creación)" value={formatDateTime(order.dateTimeCreation || order.createdAt)} />
                                <DetailItem icon={<CheckCircle />} label="Finalización" value={order.status === 'COMPLETED' ? formatDateTime(endDateTime) : 'En curso / Cancelada'} />
                            </Row>
                        </div>

                        {/* SECCIÓN 2: MÉTRICAS DE RENDIMIENTO (COMPARATIVA REAL) */}
                        <div className="mb-4 bg-light p-3 rounded border">
                            <h6 className="text-uppercase text-muted fw-bold small mb-3">Rendimiento y Producción Real</h6>
                            <Row className="g-3">
                                {/* Comparativa de Porciones */}
                                <Col md={6}>
                                    <div className="p-2 bg-white border rounded">
                                        <div className="small text-muted mb-1"><Hash size={14} className="me-1"/> Porciones (Unidades)</div>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="text-center flex-grow-1">
                                                <small className="d-block text-muted">Inicial</small>
                                                <span className="fw-bold fs-5">{order.initialAmount}</span>
                                            </div>
                                            <ArrowRight size={18} className="text-muted mx-2" />
                                            <div className="text-center flex-grow-1 text-primary">
                                                <small className="d-block text-muted">Final Real</small>
                                                <span className="fw-bold fs-5">{order.finalQuantityProduct || '--'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                
                                {/* Comparativa de Pesos */}
                                <Col md={6}>
                                    <div className="p-2 bg-white border rounded">
                                        <div className="small text-muted mb-1"><Scale size={14} className="me-1"/> Peso Total</div>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="text-center flex-grow-1">
                                                <small className="d-block text-muted">Entrada ({order.inputInitialWeightUnit})</small>
                                                <span className="fw-bold fs-5">{order.inputInitialWeight || '--'}</span>
                                            </div>
                                            <ArrowRight size={18} className="text-muted mx-2" />
                                            <div className="text-center flex-grow-1 text-success">
                                                <small className="d-block text-muted">Salida ({order.finishedProductWeightUnit || order.inputInitialWeightUnit})</small>
                                                <span className="fw-bold fs-5">{order.finishedProductWeight || '--'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {order.status === 'CANCELLED' && (
                            <Alert color="danger" className="mb-4 py-2">
                                <div className="d-flex align-items-center small">
                                    <XCircle size={18} className="me-2" />
                                    <strong>Motivo de Cancelación:</strong> <span className="ms-1">{order.cancellationReason || 'No especificado'}</span>
                                </div>
                            </Alert>
                        )}

                        {/* SECCIÓN 3: REGISTRO DE PASOS Y TIEMPOS POR EMPLEADO */}
                        <h6 className="text-uppercase text-muted fw-bold small border-bottom pb-2 mb-3">Detalle de Ejecución por Paso</h6>
                        {order.paginatedSteps && order.paginatedSteps.length > 0 ? (
                            <>
                                <div className="timeline-container">
                                    {order.paginatedSteps.map(detail => (
                                        <div key={detail.idProductionOrderDetail} className="mb-3 p-3 border rounded position-relative bg-white shadow-sm">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <Badge color="dark" className="me-2">Paso {detail.processOrder}</Badge>
                                                    <span className="fw-bold">{detail.processNameSnapshot}</span>
                                                </div>
                                                <Badge color={getOrderStatusBadgeInfo(detail.status).color} pill>
                                                    {getOrderStatusBadgeInfo(detail.status).text}
                                                </Badge>
                                            </div>

                                            <Row className="small">
                                                <Col sm={6}>
                                                    <div className="d-flex align-items-center text-secondary mb-1">
                                                        <User size={14} className="me-2" />
                                                        <span>Responsable: <strong className="text-dark">{detail.employeeAssigned?.fullName || 'No Registrado'}</strong></span>
                                                    </div>
                                                </Col>
                                                <Col sm={6} className="text-sm-end">
                                                    {detail.startDate && detail.endDate ? (
                                                        <div className="d-flex align-items-center justify-content-sm-end text-primary fw-bold">
                                                            <Timer size={14} className="me-1" />
                                                            <span>Duración Real: {calculateDuration(detail.startDate, detail.endDate)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted italic small">Tiempo no registrado</span>
                                                    )}
                                                </Col>
                                            </Row>
                                            
                                            {/* Línea de tiempo interna del paso */}
                                            {detail.startDate && (
                                                <div className="mt-2 pt-2 border-top x-small text-muted d-flex gap-3">
                                                    <span>Inició: {formatDateTime(detail.startDate)}</span>
                                                    {detail.endDate && <span>Terminó: {formatDateTime(detail.endDate)}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {totalPages > 1 && (
                                    <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} size="sm" className="mt-3 justify-content-center" />
                                )}
                            </>
                        ) : (
                            <Alert color="secondary" className="text-center small">No hay registro detallado de pasos para esta orden.</Alert>
                        )}
                    </>
                )}
            </ModalBody>
            <ModalFooter className="bg-light">
                <Button color="secondary" outline onClick={toggle} size="sm">Cerrar Detalle</Button>
            </ModalFooter>
        </Modal>
    );
};

// =================================================================================
// COMPONENTE PRINCIPAL
// =================================================================================

const HistorialProduccion = () => {
    // --- Estados ---
    const [allOrders, setAllOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tableSearchText, setTableSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Estados del Modal
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailModalPage, setDetailModalPage] = useState(1);
    
    const { addOrFocusOrder } = useContext(ActiveOrdersContext);
    const navigate = useNavigate();

    // --- Carga de Datos ---
    const fetchOrdersData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        try {
            const response = await productionOrderService.getAllProductionOrders();
            const ordersData = Array.isArray(response) ? response : (response?.rows || []);
            const sortedOrders = ordersData.sort((a, b) => new Date(b.dateTimeCreation || b.createdAt) - new Date(a.dateTimeCreation || a.createdAt));
            setAllOrders(sortedOrders);
        } catch (error) {
            toast.error("Error al cargar el historial de órdenes.");
            console.error("Error fetching orders:", error.response?.data || error);
        } finally {
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrdersData();
    }, [fetchOrdersData]);

    // --- Lógica de Filtrado y Búsqueda ---
    const filteredOrdersData = useMemo(() => {
        let filtered = allOrders;
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
    
    // --- Lógica de Paginación ---
    useEffect(() => { setCurrentPage(1); }, [tableSearchText, statusFilter]);
    const totalPages = Math.ceil(filteredOrdersData.length / ITEMS_PER_PAGE) || 1;
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

    const currentOrdersOnPage = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredOrdersData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredOrdersData, validCurrentPage]);

    // --- Lógica Paginación del Modal ---
    const paginatedStepsForModal = useMemo(() => {
        if (!selectedOrder?.productionOrderDetails) return { items: [], totalPages: 0 };
        const allSteps = selectedOrder.productionOrderDetails.sort((a, b) => a.processOrder - b.processOrder);
        const totalPages = Math.ceil(allSteps.length / STEPS_PER_PAGE_MODAL);
        const startIndex = (detailModalPage - 1) * STEPS_PER_PAGE_MODAL;
        return {
            items: allSteps.slice(startIndex, startIndex + STEPS_PER_PAGE_MODAL),
            totalPages: totalPages
        };
    }, [selectedOrder, detailModalPage]);

    // --- Handlers ---
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
    
    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setDetailModalPage(1);
        setViewModalOpen(true);
    };

    const toggleViewModal = () => {
        setViewModalOpen(prev => !prev);
        if (viewModalOpen) {
            setSelectedOrder(null);
        }
    };
    
    // <-- CAMBIO APLICADO: Lógica de exportación implementada -->
    const handleDownloadExcel = useCallback(() => {
        if (filteredOrdersData.length === 0) {
            toast.error("No hay datos para exportar.");
            return;
        }

        try {
            const dataForExcel = filteredOrdersData.map(order => ({
                'ID Orden': order.idProductionOrder,
                'Producto': order.productNameSnapshot || order.Product?.productName || 'N/A',
                'Cantidad Inicial': order.initialAmount,
                'Estado': getOrderStatusBadgeInfo(order.status).text,
                'Fecha Creación': formatDateTime(order.dateTimeCreation || order.createdAt),
                'Fecha Finalización': formatDateTime(order.dateTimeCompleted),
                'Motivo Cancelación': order.status === 'CANCELLED' ? (order.cancellationReason || 'No especificado') : '',
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'HistorialProduccion');

            // Ajustar anchos de columna (opcional, pero mejora la legibilidad)
            worksheet['!cols'] = [
                { wch: 10 }, // ID Orden
                { wch: 30 }, // Producto
                { wch: 15 }, // Cantidad Inicial
                { wch: 15 }, // Estado
                { wch: 20 }, // Fecha Creación
                { wch: 20 }, // Fecha Finalización
                { wch: 40 }, // Motivo Cancelación
            ];

            const today = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(workbook, `Historial_Produccion_${today}.xlsx`);

            toast.success("Exportación a Excel exitosa.");
        } catch (error) {
            toast.error("Ocurrió un error al generar el archivo Excel.");
            console.error("Excel export error:", error);
        }

    }, [filteredOrdersData]);
    
    const handleCreateNewOrder = () => {
        addOrFocusOrder(null, true, { navigateIfNeeded: false }); 
        navigate('/home/produccion/orden-produccion');
    };
    
    return (
        <>
            {/* <-- CAMBIO APLICADO: Estilo para el botón de ver (color negro) --> */}
            <style>
                {`.filter-button { border: 1px solid #dee2e6; color: #495057; font-size: 0.875rem; border-radius: 50px; transition: all 0.2s; }
                  .filter-button.active { background-color: #0d6efd; color: white; border-color: #0d6efd; box-shadow: 0 2px 5px rgba(13, 110, 253, 0.3); }
                  
                  .action-button { background-color: transparent; border: none; padding: 0.25rem 0.5rem; }
                  .action-button.action-view { color: #212529; }
                  .action-button.action-view:hover { color: #0d6efd; background-color: #e9ecef; } 
                  .x-small { font-size: 0.75rem; }
                  .fs-5 { font-size: 1.1rem !important; }
                  .timeline-container { border-left: 2px solid #e9ecef; padding-left: 15px; margin-left: 10px; }
                  .timeline-container > div::before {
                        content: '';
                        position: absolute;
                        left: -21px;
                        top: 20px;
                        width: 10px;
                        height: 10px;
                        background-color: #0d6efd;
                        border-radius: 50%;
                    }`
                  }
            </style>
        
            <Container fluid className="p-4 main-content">
                <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
                <h2 className="mb-4 text-center">Historial de Órdenes de Producción</h2>

                <Row className="mb-3 align-items-center">
                    <Col md={5} lg={4}>
                        <Input type="text" bsSize="sm" placeholder="Buscar por ID, producto, empleado..." value={tableSearchText} onChange={(e) => setTableSearchText(e.target.value)} />
                    </Col>
                    <Col md={7} lg={8} className="d-flex justify-content-between justify-content-md-end mt-2 mt-md-0">
                        <div className="d-flex gap-2 flex-wrap">
                            <button className={`filter-button p-2 ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => setStatusFilter('ALL')}>Todas</button>
                            <button className={`filter-button p-2 ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`} onClick={() => setStatusFilter('IN_PROGRESS')}>En Proceso</button>
                            <button className={`filter-button p-2 ${statusFilter === 'COMPLETED' ? 'active' : ''}`} onClick={() => setStatusFilter('COMPLETED')}>Completadas</button>
                            <button className={`filter-button p-2 ${statusFilter === 'CANCELLED' ? 'active' : ''}`} onClick={() => setStatusFilter('CANCELLED')}>Canceladas</button>
                        </div>
                        <div className="d-flex gap-2 ms-3">
                            <Button color="primary" outline size="sm" onClick={handleDownloadExcel} disabled={isLoading || filteredOrdersData.length === 0}><FileDown size={18} className="me-1" /> Exportar</Button>
                            <Button color="success" size="sm" onClick={handleCreateNewOrder}><Plus size={18} className="me-1" /> Nueva Orden</Button>
                        </div>
                    </Col>
                </Row>
                
                {isLoading ? (
                    <div className="text-center p-5"><Spinner color="primary" /> Cargando historial...</div>
                ) : currentOrdersOnPage.length > 0 ? (
                    <HistorialTable orders={currentOrdersOnPage} onShowDetails={handleViewOrder} />
                ) : (
                    <div className="text-center fst-italic p-4 border rounded bg-light">{tableSearchText ? "No se encontraron órdenes que coincidan con la búsqueda." : "No hay órdenes registradas."}</div>
                )}
                
                {totalPages > 1 && !isLoading && (
                    <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}

                <DetalleOrdenModal
                    isOpen={viewModalOpen}
                    toggle={toggleViewModal}
                    order={selectedOrder ? { ...selectedOrder, paginatedSteps: paginatedStepsForModal.items } : null}
                    currentPage={detailModalPage}
                    totalPages={paginatedStepsForModal.totalPages}
                    onPageChange={setDetailModalPage}
                />
            </Container>
        </>
    );
};

export default HistorialProduccion;