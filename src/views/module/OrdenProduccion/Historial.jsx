import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../assets/css/App.css";
import {
    Table, Button, Container, Row, Col, Input, Spinner
} from 'reactstrap';
// Importamos los iconos necesarios de lucide-react
import { Eye, Edit } from 'lucide-react'; // Iconos para Ver y Editar
import toast, { Toaster } from 'react-hot-toast';

import CustomPagination from '../../General/CustomPagination';

const API_BASE_URL_ORDERS = 'http://localhost:3000/production-orders'; // ***** CAMBIA ESTA URL *****
const LOG_PREFIX_ORDERS = "[ProductionOrders]";
const ITEMS_PER_PAGE = 10;

const ProductionOrderList = () => {
    const [ordersData, setOrdersData] = useState([]);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchOrdersData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        try {
            const response = await axios.get(API_BASE_URL_ORDERS);
            setOrdersData(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error("Error al cargar las órdenes de producción.");
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
            (String(order?.id ?? '').toLowerCase()).includes(tableSearchText) ||
            (order?.Producto?.toLowerCase() ?? '').includes(tableSearchText) ||
            (order?.Estado?.toLowerCase() ?? '').includes(tableSearchText)
            // Los campos ocultos no se incluyen en la búsqueda general de la tabla
        );
    }, [ordersData, tableSearchText]);

    const totalItems = useMemo(() => filteredOrdersData.length, [filteredOrdersData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    const currentOrders = useMemo(() => {
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
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]);

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '-';
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch (e) { return dateTimeString; }
    };

    // --- Funciones para los botones de acción (implementa su lógica) ---
    const handleViewOrder = (orderId) => {
        // Lógica para ver los detalles de la orden (ej: abrir un modal, navegar a otra página)
        console.log("Ver detalles de la orden ID:", orderId);
        // Ejemplo: navigate(`/production-orders/details/${orderId}`);
        // O: setSelectedOrder(order); setViewModalOpen(true);
        toast.info(`FUNCIONALIDAD VER: Orden ID ${orderId} (implementar)`);
    };

    const handleEditOrder = (orderId) => {
        // Lógica para editar la orden (ej: abrir un modal con el formulario de edición, navegar a otra página)
        console.log("Editar orden ID:", orderId);
        // Ejemplo: navigate(`/production-orders/edit/${orderId}`);
        // O: setSelectedOrder(order); setEditModalOpen(true);
        toast.info(`FUNCIONALIDAD EDITAR: Orden ID ${orderId} (implementar)`);
    };

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            <h2 className="mb-4">Listado de Órdenes de Producción</h2>

            <Row className="mb-3 align-items-center">
                <Col md={6} lg={4}>
                    <Input
                        type="text" bsSize="sm"
                        placeholder="Buscar por ID, Producto, Estado..."
                        value={tableSearchText} onChange={handleTableSearch}
                        style={{ borderRadius: '0.25rem' }}
                        aria-label="Buscar órdenes de producción"
                    />
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                    <thead>
                        <tr>
                            {/* ***** CABECERAS ACTUALIZADAS ***** */}
                            <th scope="col" className="text-center" style={{ width: '10%' }}>ID</th>
                            <th scope="col" style={{ width: '25%' }}>Fecha y Hora Inicio</th>
                            <th scope="col" style={{ width: '25%' }}>Producto</th>
                            <th scope="col" style={{ width: '15%' }}>Proceso</th>
                            <th scope="col" className="text-center" style={{ width: '20%' }}>Estado</th>
                            <th scope="col" className="text-center" style={{ width: '15%' }}>Acciones</th> {/* Antes Observaciones */}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                            // Ajustar colSpan al nuevo número de columnas visibles (5)
                        ) : currentOrders.length > 0 ? (
                            currentOrders.map((order) => (
                                <tr key={order.id} style={{ verticalAlign: 'middle' }}>
                                    {/* ***** CELDAS DE DATOS ACTUALIZADAS ***** */}
                                    <th scope="row" className="text-center">{order.id || '-'}</th>
                                    <td>{formatDateTime(order.HorayFechaInicial) || '-'}</td>
                                    <td>{order.Producto || '-'}</td>
                                    {/* Campos CantidadInicial, CantidadFinal, PesoInicial, PesoFinal, Observaciones eliminados de la visualización directa */}
                                    <td className="text-center">
                                        <span className={`badge ${
                                            order.Estado === 'Completada' ? 'bg-success' :
                                            order.Estado === 'Cancelada' ? 'bg-danger' :
                                            'bg-secondary'
                                        }`}>
                                            {order.Estado || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        {/* ***** ACCIONES CON ICONOS ***** */}
                                        <div className="d-inline-flex gap-1 action-cell-content" role="group">
                                            <Button
                                                size="sm"
                                                color="info" // O el color que prefieras para "Ver"
                                                outline
                                                onClick={() => handleViewOrder(order.id)} // Llama a la función de ver
                                                title="Ver Detalles de la Orden"
                                                className="action-button"
                                                aria-label={`Ver detalles de la orden ${order.id}`}
                                            >
                                                <Eye size={18} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="secondary" // O el color que prefieras para "Editar"
                                                outline
                                                onClick={() => handleEditOrder(order.id)} // Llama a la función de editar
                                                title="Editar Orden"
                                                className="action-button"
                                                aria-label={`Editar la orden ${order.id}`}
                                            >
                                                <Edit size={18} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center fst-italic p-4">
                                {tableSearchText ? "No se encontraron órdenes de producción." : "No hay órdenes de producción."}
                            </td></tr>
                             // Ajustar colSpan al nuevo número de columnas visibles (5)
                        )}
                    </tbody>
                </Table>
            </div>

            { totalPages > 1 && !isLoading && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
        </Container>
    );
};

export default ProductionOrderList;