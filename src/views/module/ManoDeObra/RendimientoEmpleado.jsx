// RUTA: src/views/Dashboard/EmployeePerformanceDashboard.jsx

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import {
    Container, Row, Col, Button, FormGroup, Label, Alert, Spinner,
    Card, CardHeader, CardBody, Table, Collapse
} from 'reactstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { 
    Filter, Search, User as UserIcon, Package, ChevronDown, ChevronUp, Clock, Percent, DollarSign 
} from 'lucide-react';
import Select from 'react-select';
import dayjs from 'dayjs';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrencyCOP } from "../../../utils/formatting"; // Asegúrate que esta ruta es correcta
import "../../../assets/css/App.css"; // Estilos personalizados

// --- Servicios ---
import empleadoService from '../../services/empleadoService';
import productoService from '../../services/productService'; // Asumo que existe y trae los productos
import productionOrderService from '../../services/productionOrderService';
import specSheetService from '../../services/specSheetService';
import registerPurchaseService from '../../services/registroCompraService';

// --- Componente de Fila Detallada ---
const PerformanceRow = ({ item, purchaseCosts }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calcula el costo de producción para esta orden específica
    const calculateProductionCost = () => {
        if (!item.specSheet || !item.specSheet.specSheetSupplies) return 0;
        
        return item.specSheet.specSheetSupplies.reduce((totalCost, supply) => {
            const unitPrice = purchaseCosts.get(supply.idPurchaseDetail);
            if (unitPrice !== undefined) {
                return totalCost + (parseFloat(supply.quantity) * unitPrice);
            }
            return totalCost;
        }, 0);
    };

    const productionCost = calculateProductionCost();
    const efficiencyPercentage = item.initialWeight > 0 ? (item.finalWeight / item.initialWeight) * 100 : 0;
    const totalTimeSpentMinutes = item.steps.reduce((total, step) => total + step.durationMinutes, 0);

    return (
        <Fragment>
            <tr style={{ cursor: 'pointer', backgroundColor: isOpen ? '#f8f9fa' : 'transparent' }} onClick={() => setIsOpen(!isOpen)}>
                <td><UserIcon size={14} className="me-2 text-muted" />{item.employeeName}</td>
                <td><Package size={14} className="me-2 text-muted" />{item.productName}</td>
                <td className="text-center">{item.initialWeight.toFixed(2)} kg</td>
                <td className="text-center">{item.finalWeight.toFixed(2)} kg</td>
                <td className="text-center">{item.initialPortions}</td>
                <td className="text-center">{item.finalPortions}</td>
                <td className="text-center">
                    <Button color="link" size="sm" className="p-0 text-decoration-none fw-bold">
                        Rendimiento {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                </td>
            </tr>
            <tr>
                <td colSpan="7" className="p-0 border-0">
                    <Collapse isOpen={isOpen}>
                        <div className="p-3 bg-light">
                            <h6 className="mb-3">Desglose de Rendimiento</h6>
                            <Row className="g-3 text-center mb-3">
                                <Col md={4}><Card body><div className="fw-bold"><Percent size={16} className="me-1 text-success"/>Rendimiento</div><p className="mb-0 fs-5">{efficiencyPercentage.toFixed(1)}%</p></Card></Col>
                                <Col md={4}><Card body><div className="fw-bold"><Clock size={16} className="me-1 text-info"/>Tiempo Total</div><p className="mb-0 fs-5">{totalTimeSpentMinutes.toFixed(1)} min</p></Card></Col>
                                <Col md={4}><Card body><div className="fw-bold"><DollarSign size={16} className="me-1 text-warning"/>Costo Estimado</div><p className="mb-0 fs-5">{formatCurrencyCOP(productionCost)}</p></Card></Col>
                            </Row>
                            <h6 className="mb-2">Pasos Realizados:</h6>
                            <Table size="sm" bordered>
                                <thead className="table-dark"><tr><th>Paso</th><th className="text-end">Tiempo (min)</th></tr></thead>
                                <tbody>
                                    {item.steps.length > 0 ? item.steps.map(step => (
                                        <tr key={step.id}>
                                            <td>{step.name}</td>
                                            <td className="text-end">{step.durationMinutes.toFixed(2)}</td>
                                        </tr>
                                    )) : <tr><td colSpan="2">No se registraron pasos para este empleado en esta orden.</td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </Collapse>
                </td>
            </tr>
        </Fragment>
    );
};


// --- Componente Principal del Dashboard ---
const EmployeePerformanceDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    
    // Filtros
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    
    // Opciones para Selects
    const [allProducts, setAllProducts] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    
    // Datos procesados
    const [performanceData, setPerformanceData] = useState([]);
    const [purchaseCosts, setPurchaseCosts] = useState(new Map());

    // Carga inicial de opciones de filtros
    useEffect(() => {
        const fetchFilterOptions = async () => {
            setIsLoading(true);
            try {
                const [productsRes, employeesRes, purchasesRes] = await Promise.all([
                    productoService.getAllProducts({ status: true }),
                    empleadoService.getAllEmpleados({ status: true }),
                    registerPurchaseService.getAllRegisterPurchasesWithDetails()
                ]);

                setAllProducts((productsRes || []).map(p => ({ value: p.idProduct, label: p.productName })));
                setAllEmployees((employeesRes || []).map(e => ({ value: e.idEmployee, label: e.fullName })));
                
                // Pre-procesar costos de insumos para tenerlos listos
                const costsMap = new Map();
                (purchasesRes || []).forEach(p => (p.purchaseDetails || []).forEach(d => {
                    if (d.idPurchaseDetail) costsMap.set(d.idPurchaseDetail, parseFloat(d.unitPrice));
                }));
                setPurchaseCosts(costsMap);

            } catch (err) {
                toast.error("Error al cargar opciones para filtros.");
                setError("No se pudieron cargar las opciones de filtro.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchFilterOptions();
    }, []);

    const handleSearch = useCallback(async () => {
        if (!startDate && !endDate && !selectedProduct && !selectedEmployee) {
            toast.error("Debe seleccionar al menos un filtro para la búsqueda.");
            return;
        }
        setIsSearching(true);
        setError(null);
        setPerformanceData([]);

        try {
            const backendFilters = { status: 'COMPLETED' }; // Solo órdenes completadas tienen datos de rendimiento
            if (startDate) backendFilters.startDate = dayjs(startDate).startOf('day').toISOString();
            if (endDate) backendFilters.endDate = dayjs(endDate).endOf('day').toISOString();
            if (selectedProduct) backendFilters.idProduct = selectedProduct.value;

            const [orders, specSheets] = await Promise.all([
                productionOrderService.getAllProductionOrders(backendFilters),
                specSheetService.getAllSpecSheets()
            ]);

            if (!orders || orders.length === 0) {
                toast("No se encontraron órdenes de producción para los filtros seleccionados.", { icon: 'ℹ️' });
                return;
            }

            // Procesar y agrupar los datos
            const processedData = orders.flatMap(order => {
                if (!order.productionOrderDetails || order.productionOrderDetails.length === 0) return [];
                
                const specSheetForOrder = specSheets.find(s => s.idSpecSheet === order.idSpecSheet);

                // Agrupar pasos por empleado
                const stepsByEmployee = order.productionOrderDetails.reduce((acc, step) => {
                    const empId = step.employeeAssigned?.idEmployee;
                    if (empId) {
                        if (!acc[empId]) {
                            acc[empId] = {
                                employeeName: step.employeeAssigned.fullName,
                                employeeId: empId,
                                steps: []
                            };
                        }
                        acc[empId].steps.push({
                            id: step.idProductionOrderDetail,
                            name: step.processNameSnapshot,
                            durationMinutes: step.startDate && step.endDate ? dayjs(step.endDate).diff(dayjs(step.startDate), 'minute', true) : 0
                        });
                    }
                    return acc;
                }, {});

                return Object.values(stepsByEmployee).map(empData => ({
                    id: `${order.idProductionOrder}-${empData.employeeId}`,
                    productName: order.productNameSnapshot,
                    initialWeight: parseFloat(order.inputInitialWeight || 0),
                    finalWeight: parseFloat(order.finishedProductWeight || 0),
                    initialPortions: order.initialAmount || 'N/A',
                    finalPortions: order.finalQuantityProduct || 'N/A',
                    specSheet: specSheetForOrder,
                    ...empData
                }));
            });
            
            // Filtrar por empleado si se seleccionó
            let finalData = selectedEmployee 
                ? processedData.filter(record => record.employeeId === selectedEmployee.value) 
                : processedData;
            
            if(finalData.length === 0) {
                toast("No se encontraron registros para el empleado seleccionado en este rango.", { icon: 'ℹ️' });
            }

            setPerformanceData(finalData);

        } catch (err) {
            const msg = "Error al calcular el rendimiento: " + (err.message || "Error desconocido");
            setError(msg);
            toast.error(msg);
        } finally {
            setIsSearching(false);
        }
    }, [startDate, endDate, selectedProduct, selectedEmployee]);

    const handleClearFilters = () => {
        setStartDate(null); setEndDate(null); setSelectedProduct(null); setSelectedEmployee(null);
        setPerformanceData([]);
        setError(null);
    };

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" />
            <h2 className="mb-4 text-center">Dashboard de Rendimiento por Empleado</h2>
            
            <Card className="mb-4 shadow-sm">
                <CardHeader className="bg-light d-flex align-items-center"><Filter size={18} className="me-2" /> Filtros de Búsqueda</CardHeader>
                <CardBody>
                    {isLoading ? <div className="text-center"><Spinner /> <p>Cargando filtros...</p></div> :
                        <Row className="g-3 align-items-end">
                            <Col md={3} sm={6}><FormGroup><Label for="startDate" className="small fw-bold">Desde (Fecha Creación OP):</Label><DatePicker id="startDate" selected={startDate} onChange={setStartDate} dateFormat="dd/MM/yyyy" className="form-control" placeholderText="Fecha de inicio" isClearable autoComplete="off" /></FormGroup></Col>
                            <Col md={3} sm={6}><FormGroup><Label for="endDate" className="small fw-bold">Hasta (Fecha Creación OP):</Label><DatePicker id="endDate" selected={endDate} onChange={setEndDate} dateFormat="dd/MM/yyyy" className="form-control" placeholderText="Fecha de fin" minDate={startDate} isClearable autoComplete="off" /></FormGroup></Col>
                            <Col md={3} sm={6}><FormGroup><Label for="employeeFilter" className="small fw-bold">Empleado</Label><Select id="employeeFilter" options={allEmployees} value={selectedEmployee} onChange={setSelectedEmployee} placeholder="Todos..." isClearable isSearchable isDisabled={isLoading} /></FormGroup></Col>
                            <Col md={3} sm={6}><FormGroup><Label for="productFilter" className="small fw-bold">Producto</Label><Select id="productFilter" options={allProducts} value={selectedProduct} onChange={setSelectedProduct} placeholder="Todos..." isClearable isSearchable isDisabled={isLoading} /></FormGroup></Col>
                            <Col md={12} className="d-flex justify-content-end gap-2 mt-3">
                                <Button color="secondary" outline onClick={handleClearFilters}>Limpiar Filtros</Button>
                                <Button color="primary" onClick={handleSearch} disabled={isSearching}>{isSearching ? <Spinner size="sm" /> : <><Search size={16} className="me-1" /> Buscar</>}</Button>
                            </Col>
                        </Row>
                    }
                </CardBody>
            </Card>

            {isSearching && <div className="text-center p-5"><Spinner /> <p className="mt-2">Calculando rendimiento...</p></div>}
            {error && !isSearching && <Alert color="danger" className="text-center">Error: {error}</Alert>}
            
            {performanceData.length > 0 && !isSearching && (
                <Card className="shadow-sm">
                    <CardHeader>Resultados de Rendimiento</CardHeader>
                    <div className="table-responsive">
                        <Table hover striped size="sm" className="mb-0">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Producto</th>
                                    <th className="text-center">Peso Inicial</th>
                                    <th className="text-center">Peso Final</th>
                                    <th className="text-center">Porc. Inicial</th>
                                    <th className="text-center">Porc. Final</th>
                                    <th className="text-center">Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performanceData.map(item => <PerformanceRow item={item} purchaseCosts={purchaseCosts} key={item.id} />)}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}

            {!isSearching && performanceData.length === 0 && (
                <Alert color="secondary" className="text-center py-4 mt-4">
                    <Filter size={20} className="me-2" />
                    Seleccione filtros y haga clic en "Buscar" para ver los datos de rendimiento.
                </Alert>
            )}
        </Container>
    );
};

export default EmployeePerformanceDashboard;