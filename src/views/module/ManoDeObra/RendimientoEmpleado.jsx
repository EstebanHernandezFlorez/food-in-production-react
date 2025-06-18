// RUTA: src/views/Dashboard/EmployeePerformanceDashboard.jsx
// VERSIÓN AVANZADA CON CÁLCULO DE MANO DE OBRA Y RENDIMIENTOS

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import {
    Container, Row, Col, Button, FormGroup, Label, Alert, Spinner,
    Card, CardHeader, CardBody, Table, Collapse, Input
} from 'reactstrap';
import "react-datepicker/dist/react-datepicker.css";
import { 
    Filter, Search, User as UserIcon, Package, ChevronDown, ChevronUp, Clock, Percent, DollarSign, Calendar, Target, TrendingUp
} from 'lucide-react';
import Select from 'react-select';
import dayjs from 'dayjs';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrencyCOP } from "../../../utils/formatting";
import "../../../assets/css/App.css";
import DatePicker from 'react-datepicker';

// --- Servicios ---
import empleadoService from '../../services/empleadoService';
import productoService from '../../services/productService';
import productionOrderService from '../../services/productionOrderService';
import specSheetService from '../../services/specSheetService';
import monthlyExpenseService from '../../services/MonthlyOverallExpenseService'; // <--- SERVICIO DE GASTOS

// --- Componente de Fila Detallada (ACTUALIZADO) ---
const PerformanceRow = ({ item, costPerMinute }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Cálculos de Rendimiento
    const efficiencyPercentage = item.initialPortions > 0 ? (item.finalPortions / item.initialPortions) * 100 : 0;
    const totalTimeSpentMinutes = item.steps.reduce((total, step) => total + step.durationMinutes, 0);
    const estimatedTotalTime = item.specSheet.specSheetProcesses.reduce((total, p) => total + (p.estimatedTimeMinutes || 0), 0);
    const timeEfficiencyPercentage = estimatedTotalTime > 0 && totalTimeSpentMinutes > 0 ? (estimatedTotalTime / totalTimeSpentMinutes) * 100 : 0;

    // Cálculos de Costos
    const materialCost = item.specSheet.costPerUnit > 0 ? item.finalPortions * item.specSheet.costPerUnit : 0;
    const laborCost = totalTimeSpentMinutes * costPerMinute;
    const totalProductionCost = materialCost + laborCost;

    return (
        <Fragment>
            <tr style={{ cursor: 'pointer', backgroundColor: isOpen ? '#f0f3ff' : 'transparent' }} onClick={() => setIsOpen(!isOpen)}>
                <td><UserIcon size={14} className="me-2 text-muted" />{item.employeeName}</td>
                <td><Package size={14} className="me-2 text-muted" />{item.productName}</td>
                <td className="text-center">{efficiencyPercentage.toFixed(1)}%</td>
                <td className="text-center">{timeEfficiencyPercentage.toFixed(1)}%</td>
                <td className="text-center fw-bold">{formatCurrencyCOP(laborCost)}</td>
                <td className="text-center fw-bold text-primary">{formatCurrencyCOP(totalProductionCost)}</td>
                <td className="text-center">
                    <Button color="link" size="sm" className="p-0 text-decoration-none fw-bold">
                        Detalles {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                </td>
            </tr>
            <tr>
                <td colSpan="7" className="p-0 border-0">
                    <Collapse isOpen={isOpen}>
                        <div className="p-3 bg-light-subtle">
                            <h6 className="mb-3">Desglose de la Orden: {item.productName} (Empleado: {item.employeeName})</h6>
                             <Row className="g-3 text-center mb-3">
                                <Col><Card body><div><DollarSign size={16} className="me-1 text-success"/><strong>Costo Materiales</strong></div><p className="mb-0 fs-5">{formatCurrencyCOP(materialCost)}</p></Card></Col>
                                <Col><Card body><div><DollarSign size={16} className="me-1 text-info"/><strong>Costo Mano de Obra</strong></div><p className="mb-0 fs-5">{formatCurrencyCOP(laborCost)}</p></Card></Col>
                                <Col><Card body><div><Clock size={16} className="me-1 text-primary"/><strong>Tiempo Real</strong></div><p className="mb-0 fs-5">{totalTimeSpentMinutes.toFixed(1)} min</p></Card></Col>
                                <Col><Card body><div><Target size={16} className="me-1 text-secondary"/><strong>Tiempo Estimado</strong></div><p className="mb-0 fs-5">{estimatedTotalTime.toFixed(1)} min</p></Card></Col>
                                <Col><Card body><div><TrendingUp size={16} className="me-1 text-danger"/><strong>Costo Total Real</strong></div><p className="mb-0 fs-5 fw-bold">{formatCurrencyCOP(totalProductionCost)}</p></Card></Col>
                             </Row>
                            <h6 className="mb-2">Pasos Realizados:</h6>
                            <Table size="sm" bordered>
                                <thead className="table-dark"><tr><th>Paso</th><th className="text-end">Tiempo (min)</th></tr></thead>
                                <tbody>
                                    {item.steps.length > 0 ? item.steps.map(step => (
                                        <tr key={step.id}><td>{step.name}</td><td className="text-end">{step.durationMinutes.toFixed(2)}</td></tr>
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
    const [selectedMonth, setSelectedMonth] = useState(new Date()); // Usamos un Date object para el mes/año
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    
    // Datos para los Select
    const [allProducts, setAllProducts] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);

    // Resultados
    const [performanceData, setPerformanceData] = useState([]);
    const [costPerMinute, setCostPerMinute] = useState(0); // <-- Costo por minuto calculado
    const [specSheetCostMap, setSpecSheetCostMap] = useState(new Map());

    useEffect(() => {
        const fetchFilterOptions = async () => {
            setIsLoading(true);
            try {
                const [productsRes, employeesRes] = await Promise.all([
                    productoService.getAllProducts({ status: true }),
                    empleadoService.getAllEmpleados({ status: true })
                ]);
                setAllProducts((productsRes || []).map(p => ({ value: p.idProduct, label: p.productName })));
                setAllEmployees((employeesRes || []).map(e => ({ value: e.idEmployee, label: e.fullName })));
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
        if (!selectedMonth) {
            toast.error("Debe seleccionar un mes y año para la búsqueda.");
            return;
        }
        setIsSearching(true);
        setError(null);
        setPerformanceData([]);
        setCostPerMinute(0);

        try {
            const year = dayjs(selectedMonth).year();
            const month = dayjs(selectedMonth).month() + 1; // dayjs es 0-11

            // 1. Obtener los gastos totales de mano de obra para el mes
            // Asumimos que tienes una categoría de gasto para 'Mano de Obra' con un ID (ej. ID=1)
            const laborExpensesData = await monthlyExpenseService.getTotalExpenseByTypeAndMonth(year, month, 1);
            const totalLaborExpense = laborExpensesData.totalExpense || 0;
            
            // Asumimos un total de horas trabajadas al mes por empleado de producción.
            // Esto es una simplificación. Lo ideal es tener un registro de horas real.
            const productiveEmployees = allEmployees.length; // O un subconjunto de ellos
            const totalMinutesWorkedInMonth = productiveEmployees * 8 * 60 * 22; // 8h/dia, 22 dias/mes

            const calculatedCostPerMinute = totalMinutesWorkedInMonth > 0 ? totalLaborExpense / totalMinutesWorkedInMonth : 0;
            setCostPerMinute(calculatedCostPerMinute);

            if (calculatedCostPerMinute === 0) {
                toast("No se encontraron gastos de mano de obra para el mes seleccionado, los costos de MO serán 0.", { icon: '⚠️' });
            }

            // 2. Cargar las fichas con sus costos de materiales
            const specSheetsWithCostsRes = await specSheetService.getAllSpecSheetsWithCosts();
            const newSpecSheetMap = new Map(specSheetsWithCostsRes.map(s => [s.idSpecSheet, s]));
            setSpecSheetCostMap(newSpecSheetMap);

            // 3. Obtener las órdenes de producción completadas en ese mes/año
            const backendFilters = { 
                status: 'COMPLETED',
                // Filtramos por el mes y año de finalización de la orden
                finalized_after: dayjs(selectedMonth).startOf('month').toISOString(),
                finalized_before: dayjs(selectedMonth).endOf('month').toISOString(),
            };
            if (selectedProduct) backendFilters.idProduct = selectedProduct.value;

            const orders = await productionOrderService.getAllProductionOrders(backendFilters);

            if (!orders || orders.length === 0) {
                toast("No se encontraron órdenes completadas para el período y filtros seleccionados.", { icon: 'ℹ️' });
                setIsSearching(false);
                return;
            }

            // 4. Procesar los datos
            const processedData = orders.flatMap(order => {
                if (!order.productionOrderDetails || !order.idSpecSheet) return [];
                const specSheetForOrder = newSpecSheetMap.get(order.idSpecSheet);
                if (!specSheetForOrder) return [];

                const stepsByEmployee = order.productionOrderDetails.reduce((acc, step) => {
                    const empId = step.employeeAssigned?.idEmployee;
                    if (empId) {
                        if (!acc[empId]) {
                            acc[empId] = { employeeName: step.employeeAssigned.fullName, employeeId: empId, steps: [] };
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
                    initialPortions: parseInt(order.initialAmount || 0),
                    finalPortions: parseInt(order.finalQuantityProduct || 0),
                    specSheet: specSheetForOrder,
                    ...empData
                }));
            }).filter(Boolean);
            
            let finalData = selectedEmployee ? processedData.filter(record => record.employeeId === selectedEmployee.value) : processedData;
            if (finalData.length === 0) toast("No se encontraron registros para la combinación de filtros.", { icon: 'ℹ️' });
            setPerformanceData(finalData);

        } catch (err) {
            const msg = "Error al calcular el rendimiento: " + (err.message || "Error desconocido");
            setError(msg); toast.error(msg);
        } finally {
            setIsSearching(false);
        }
    }, [selectedMonth, selectedProduct, selectedEmployee, allEmployees]);
    
    const handleClearFilters = () => {
        setSelectedMonth(new Date()); setSelectedProduct(null); setSelectedEmployee(null);
        setPerformanceData([]); setError(null); setCostPerMinute(0);
    };

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" />
            <h2 className="mb-4 text-center">Dashboard de Mano de Obra y Rendimiento</h2>
            
            <Card className="mb-4 shadow-sm">
                <CardHeader className="bg-light d-flex align-items-center"><Filter size={18} className="me-2" /> Filtros de Búsqueda</CardHeader>
                <CardBody>
                    {isLoading ? <div className="text-center"><Spinner /> <p>Cargando filtros...</p></div> :
                        <Row className="g-3 align-items-end">
                            <Col md={3}><FormGroup><Label for="monthPicker" className="small fw-bold"><Calendar size={14} className="me-1"/>Mes y Año</Label><DatePicker id="monthPicker" selected={selectedMonth} onChange={date => setSelectedMonth(date)} dateFormat="MM/yyyy" showMonthYearPicker className="form-control" autoComplete="off" /></FormGroup></Col>
                            <Col md={3}><FormGroup><Label for="employeeFilter" className="small fw-bold"><UserIcon size={14} className="me-1"/>Empleado</Label><Select id="employeeFilter" options={allEmployees} value={selectedEmployee} onChange={setSelectedEmployee} placeholder="Todos..." isClearable isSearchable isDisabled={isLoading} /></FormGroup></Col>
                            <Col md={3}><FormGroup><Label for="productFilter" className="small fw-bold"><Package size={14} className="me-1"/>Producto</Label><Select id="productFilter" options={allProducts} value={selectedProduct} onChange={setSelectedProduct} placeholder="Todos..." isClearable isSearchable isDisabled={isLoading} /></FormGroup></Col>
                            <Col md={3} className="d-flex justify-content-end gap-2">
                                <Button color="secondary" outline onClick={handleClearFilters}>Limpiar</Button>
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
                    <CardHeader>
                        <Row className="align-items-center">
                            <Col>Resultados de Rendimiento</Col>
                            <Col xs="auto" className="text-end">
                                <small className="text-muted">Costo MO/min:</small>
                                <strong className="ms-2">{formatCurrencyCOP(costPerMinute)}</strong>
                            </Col>
                        </Row>
                    </CardHeader>
                    <div className="table-responsive">
                        <Table hover striped size="sm" className="mb-0">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Producto</th>
                                    <th className="text-center">Rendimiento (Cant. %)</th>
                                    <th className="text-center">Rendimiento (Tiempo %)</th>
                                    <th className="text-center">Costo MO</th>
                                    <th className="text-center">Costo Total</th>
                                    <th className="text-center">Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performanceData.map(item => <PerformanceRow item={item} key={item.id} costPerMinute={costPerMinute} />)}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}

            {!isSearching && performanceData.length === 0 && !error && (
                <Alert color="secondary" className="text-center py-4 mt-4">
                    <Filter size={20} className="me-2" />
                    Seleccione un mes y filtros opcionales para ver los datos de rendimiento.
                </Alert>
            )}
        </Container>
    );
};

export default EmployeePerformanceDashboard;