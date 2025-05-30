// src/views/module/OrdenProduccion/Historial.jsx (o ProductionOrderList.jsx)
import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../assets/css/App.css"; // Ajusta la ruta
import {
    Table, Button, Container, Row, Col, Input, Spinner, Card, CardHeader, CardBody, Alert, Badge
} from 'reactstrap';
import { Eye, Edit, PlusCircle, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CustomPagination from '../../General/CustomPagination'; // Ajusta la ruta
import { ActiveOrdersContext } from './ActiveOrdersContext'; // Correcto si está en la misma carpeta
import productionOrderService from '../../services/productionOrderService'; // Servicio para cargar órdenes

const ITEMS_PER_PAGE = 10;

const ProductionOrderList = () => {
    const [ordersData, setOrdersData] = useState([]);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const { activeOrders, addOrFocusOrder } = useContext(ActiveOrdersContext); // Usar addOrFocusOrder

    const fetchOrdersData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        try {
            const response = await productionOrderService.getAllProductionOrders(); // Usar el servicio
            // El backend devuelve objetos con idProductionOrder, dateTimeCreation, Product (objeto), status
            setOrdersData(Array.isArray(response) ? response : []);
        } catch (error) {
            toast.error("Error al cargar las órdenes de producción.");
            console.error("Error fetching orders:", error.response?.data || error);
            setOrdersData([]);
        } finally {
            if (showLoadingSpinner) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrdersData();
    }, [fetchOrdersData]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1);
    }, []);

    const filteredOrdersData = useMemo(() => {
        if (!tableSearchText) return ordersData;
        return ordersData.filter(order =>
            (order.idProductionOrder?.toString().toLowerCase() ?? '').includes(tableSearchText) ||
            (order.Product?.productName?.toLowerCase() ?? '').includes(tableSearchText) ||
            (order.status?.toLowerCase() ?? '').includes(tableSearchText)
        );
    }, [ordersData, tableSearchText]);

    const totalItems = useMemo(() => filteredOrdersData.length, [filteredOrdersData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    const currentOrdersOnPage = useMemo(() => { // Renombrado para claridad
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredOrdersData.slice(startIndex, endIndex);
    }, [filteredOrdersData, validCurrentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(pageNumber);
    }, []);

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '-';
        try {
            return new Date(dateTimeString).toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch (e) { return dateTimeString; }
    };

    const handleViewOrEditOrder = (orderId) => {
        addOrFocusOrder(orderId.toString(), false); // Asegurar que orderId sea string y no sea nueva
        navigate(`/home/produccion/ordenes/${orderId}`); // Navegar a la vista de detalle/edición
    };

    const handleCreateNewOrder = () => {
        addOrFocusOrder(null, true); // Indica que es una nueva orden
        navigate('/home/produccion/ordenes/crear'); // Navegar a la ruta de creación
    };

    const getOrderStatusBadgeInfo = (statusBackend) => {
        // Mapeo de estados del backend a colores y texto para la UI
        switch (statusBackend?.toUpperCase()) {
            case 'PENDING': return { text: 'Pendiente', color: 'secondary' };
            case 'SETUP_COMPLETED': return { text: 'Lista p/ Iniciar', color: 'info' };
            case 'IN_PROGRESS': return { text: 'En Proceso', color: 'warning' };
            case 'ALL_STEPS_COMPLETED': return { text: 'Pasos Completos', color: 'primary' };
            case 'COMPLETED': return { text: 'Completada', color: 'success' };
            case 'CANCELLED': return { text: 'Cancelada', color: 'danger' };
            default: return { text: statusBackend || 'N/A', color: 'light' };
        }
    };

    return (
        <Container fluid className="p-lg-4 p-md-3 p-2 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            <Card className="shadow-sm">
                <CardHeader className="d-flex justify-content-between align-items-center bg-light py-2">
                    <h4 className="mb-0 h5 text-primary">Listado de Órdenes de Producción</h4>
                    <Button color="success" size="sm" onClick={handleCreateNewOrder}>
                        <PlusCircle size={16} className="me-1" /> Nueva Orden
                    </Button>
                </CardHeader>
                <CardBody>
                    <Row className="mb-3">
                        <Col md={6} lg={4}>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text"><Search size={16} /></span>
                                <Input
                                    type="text"
                                    placeholder="Buscar por ID, Producto, Estado..."
                                    value={tableSearchText} onChange={handleTableSearch}
                                    aria-label="Buscar órdenes de producción"
                                />
                            </div>
                        </Col>
                    </Row>

                    <div className="table-responsive mb-0">
                        <Table hover striped size="sm" className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col" className="text-center" style={{ width: '10%' }}>ID Orden</th>
                                    <th scope="col" style={{ width: '20%' }}>Fecha Creación</th>
                                    <th scope="col" style={{ width: '25%' }}>Producto</th>
                                    <th scope="col" className="text-center" style={{ width: '15%' }}>Cantidad</th>
                                    <th scope="col" className="text-center" style={{ width: '15%' }}>Estado</th>
                                    <th scope="col" className="text-center" style={{ width: '15%' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="6" className="text-center p-5"><Spinner color="primary" /> <span className="ms-2">Cargando órdenes...</span></td></tr>
                                ) : currentOrdersOnPage.length > 0 ? (
                                    currentOrdersOnPage.map((order) => {
                                        const statusInfo = getOrderStatusBadgeInfo(order.status);
                                        const isOrderActiveInContext = !!activeOrders[order.idProductionOrder?.toString()];
                                        return (
                                            <tr key={order.idProductionOrder} className={isOrderActiveInContext ? 'table-info fw-bold' : ''} style={{ verticalAlign: 'middle' }}>
                                                <th scope="row" className="text-center">{order.idProductionOrder || '-'}</th>
                                                <td>{formatDateTime(order.dateTimeCreation) || '-'}</td>
                                                <td>{order.Product?.productName || 'N/A'}</td>
                                                <td className="text-center">{order.initialAmount || '-'}</td>
                                                <td className="text-center">
                                                    <Badge color={statusInfo.color} pill>
                                                        {statusInfo.text}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        size="sm"
                                                        color="primary"
                                                        outline
                                                        onClick={() => handleViewOrEditOrder(order.idProductionOrder)}
                                                        title="Ver / Gestionar Orden"
                                                        className="me-1"
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                    {/* Podrías añadir un botón de "Editar Rápido" o "Cancelar Orden" aquí si fuera necesario */}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="6" className="text-center fst-italic p-4">
                                        {tableSearchText ? "No se encontraron órdenes con los criterios de búsqueda." : "No hay órdenes de producción registradas."}
                                    </td></tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    { !isLoading && totalItems > 0 && totalPages > 1 && (
                        <div className="mt-3">
                            <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                        </div>
                    )}
                </CardBody>
            </Card>
        </Container>
    );
};

export default ProductionOrderList;