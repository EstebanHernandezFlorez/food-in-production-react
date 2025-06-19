// RUTA: src/views/Dashboard/EmployeePerformanceDashboard.jsx
// VERSIÓN DEFINITIVA CON RENTABILIDAD REAL Y CÁLCULOS CORREGIDOS

import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import {
    Container, Row, Col, Button, FormGroup, Label, Alert, Spinner,
    Card, CardHeader, CardBody, Table, Collapse, Tooltip as ReactstrapTooltip
} from 'reactstrap';
import "react-datepicker/dist/react-datepicker.css";
import {
    Filter, Search, User as UserIcon, Package, Calendar, TrendingUp, ChevronDown, ChevronUp, Clock, Scale, TrendingDown, DollarSign
} from 'lucide-react';
import Select from 'react-select';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrencyCOP } from "../../../utils/formatting";
import "../../../assets/css/App.css";
import DatePicker from 'react-datepicker';

// --- Servicios ---
import empleadoService from '../../services/empleadoService';
import productoService from '../../services/productService';
import productionOrderService from '../../services/productionOrderService';
import specSheetService from '../../services/specSheetService';
import monthlyExpenseService from '../../services/MonthlyOverallExpenseService';

dayjs.extend(duration);

// --- HELPER: Formatear duración ---
const formatDuration = (minutes) => {
    if (isNaN(minutes) || minutes === 0) return "0m";
    const sign = minutes < 0 ? "-" : "";
    const dur = dayjs.duration(Math.abs(minutes), 'minutes');
    const hours = Math.floor(dur.asHours());
    const mins = Math.floor(dur.asMinutes()) % 60;
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (mins > 0) result += `${mins}m`;
    return sign + (result.trim() || '0s');
};

// --- Componente de Fila de Análisis por Orden ---
const OrderAnalysisRow = ({ order }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);

    const quantityEfficiency = order.initialAmount > 0 ? (order.finalAmount / order.initialAmount) * 100 : 0;
    
    return (
        <Fragment>
            <tr className="order-row" onClick={() => setIsOpen(!isOpen)}>
                <td>
                    <strong>{order.productName}</strong>
                    <br />
                    <small className="text-muted">Orden #{order.orderId}</small>
                </td>
                <td className="text-center align-middle">{order.initialAmount}<small className="text-muted"> uds.</small></td>
                <td className="text-center align-middle">{order.finalAmount}<small className="text-muted"> uds.</small></td>
                <td className="text-center align-middle">
                    <div className="performance-bar-container" id={`perf-bar-${order.orderId}`}>
                        <div className="performance-bar" style={{ width: `${Math.min(quantityEfficiency, 100)}%`, background: quantityEfficiency >= 95 ? '#28a745' : quantityEfficiency >= 85 ? '#ffc107' : '#dc3545' }}></div>
                    </div>
                    <ReactstrapTooltip placement="top" isOpen={tooltipOpen} target={`perf-bar-${order.orderId}`} toggle={() => setTooltipOpen(!tooltipOpen)}>
                        Rendimiento de Material: {quantityEfficiency.toFixed(1)}% ({order.finalAmount} de {order.initialAmount} uds.)
                    </ReactstrapTooltip>
                </td>
                <td className="text-center align-middle">{formatDuration(order.realTime)}</td>
                <td className={`text-center fw-bold align-middle ${order.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {order.profit >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} {formatCurrencyCOP(order.profit)}
                </td>
                <td className="text-center align-middle">
                    <Button color="link" size="sm" className="p-0 text-secondary">{isOpen ? <ChevronUp/> : <ChevronDown/>}</Button>
                </td>
            </tr>
            <tr>
                <td colSpan="7" className="p-0 border-0">
                    <Collapse isOpen={isOpen}>
                        <div className="breakdown-section">
                            <Row className="g-0">
                                <Col md={4} className="p-3 border-end">
                                    <h6 className="breakdown-title">Desglose de Costos y Rentabilidad</h6>
                                    <div className="d-flex justify-content-between"><span>+ Ingresos Venta:</span><strong className="text-success">{formatCurrencyCOP(order.realRevenue)}</strong></div>
                                    <div className="d-flex justify-content-between"><span>- Costo Materiales:</span><strong className="text-danger">{formatCurrencyCOP(order.materialCost)}</strong></div>
                                    <div className="d-flex justify-content-between"><span>- Costo Mano de Obra:</span><strong className="text-danger">{formatCurrencyCOP(order.laborCost)}</strong></div>
                                    <hr/>
                                    <div className="d-flex justify-content-between fw-bold"><span>= Rentabilidad Neta:</span><strong className={order.profit >= 0 ? 'text-success' : 'text-danger'}>{formatCurrencyCOP(order.profit)}</strong></div>
                                </Col>
                                <Col md={4} className="p-3 border-end">
                                    <h6 className="breakdown-title">Ajustes de la Orden</h6>
                                    <div className="d-flex justify-content-between"><span>Ajuste Merma:</span><strong className={order.quantityVarianceCost > 0 ? 'text-danger' : 'text-success'}>{formatCurrencyCOP(order.quantityVarianceCost)}</strong></div>
                                    <div className="d-flex justify-content-between"><span>Ajuste Tiempo:</span><strong className={order.timeVarianceCost > 0 ? 'text-danger' : 'text-success'}>{formatCurrencyCOP(order.timeVarianceCost)}</strong></div>
                                     <hr/>
                                    <div className="d-flex justify-content-between fw-bold"><span>Ajuste Total:</span><strong className={order.totalVarianceCost > 0 ? 'text-danger' : 'text-success'}>{formatCurrencyCOP(order.totalVarianceCost)}</strong></div>
                                </Col>
                                <Col md={4} className="p-3">
                                     <h6 className="breakdown-title">Participación de Empleados</h6>
                                    {order.employees.length > 0 ? (
                                        <Table borderless size="sm" className="mb-0">
                                            <tbody>{order.employees.map(emp => (
                                                <tr key={emp.employeeId}>
                                                    <td><UserIcon size={14} className="me-2"/>{emp.employeeName}</td>
                                                    <td className="text-end">{formatDuration(emp.totalTime)}</td>
                                                </tr>
                                            ))}</tbody>
                                        </Table>
                                    ) : <p className="text-muted small">No hay empleados asignados.</p>}
                                </Col>
                            </Row>
                        </div>
                    </Collapse>
                </td>
            </tr>
        </Fragment>
    );
};

// --- Componente Principal del Dashboard ---
const EmployeePerformanceDashboard = () => {
    // Estados
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ month: new Date(), product: null, employee: null });
    const [allProducts, setAllProducts] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [analysisData, setAnalysisData] = useState([]);

    // Carga inicial
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [productsRes, employeesRes] = await Promise.all([
                    productoService.getAllProducts({ status: true }),
                    empleadoService.getAllEmpleados({ status: true }),
                ]);
                setAllProducts(productsRes.map(p => ({ value: p.idProduct, label: p.productName })));
                setAllEmployees(employeesRes.map(e => ({ value: e.idEmployee, label: e.fullName })));
            } catch (err) { toast.error("Error al cargar filtros."); } 
            finally { setIsLoading(false); }
        };
        fetchInitialData();
    }, []);

    // Búsqueda y procesamiento
    const handleSearch = useCallback(async () => {
        setIsSearching(true); setError(null); setAnalysisData([]);
        try {
            const year = dayjs(filters.month).year();
            const month = dayjs(filters.month).month() + 1;

            const totalExpenseData = await monthlyExpenseService.getTotalExpenseByMonth(year, month);
            const totalMonthlyExpense = totalExpenseData.totalExpense || 0;
            const productiveEmployeesCount = allEmployees.length || 1;
            const totalMinutesWorkedInMonth = productiveEmployeesCount * 8 * 60 * 22;
            const costPerMinute = totalMinutesWorkedInMonth > 0 ? totalMonthlyExpense / totalMinutesWorkedInMonth : 0;
            
            const [specSheets, orders] = await Promise.all([
                specSheetService.getAllSpecSheetsWithCosts(),
                productionOrderService.getAllProductionOrders({ 
                    status: 'COMPLETED',
                    finalized_after: dayjs(filters.month).startOf('month').toISOString(),
                    finalized_before: dayjs(filters.month).endOf('month').toISOString(),
                    ...(filters.product && { idProduct: filters.product.value }),
                    ...(filters.employee && { idEmployee: filters.employee.value }),
                })
            ]);
            
            if (orders.length === 0) {
                toast.success("No se encontraron órdenes completadas para los filtros.");
                setIsSearching(false);
                return;
            }
            
            const specSheetMap = new Map(specSheets.map(s => [s.idSpecSheet, s]));

            const data = orders.map(order => {
                const specSheet = specSheetMap.get(order.idSpecSheet);
                if (!specSheet) return null;
                
                // ✅ --- CORRECCIÓN DE CÁLCULO DE TIEMPO Y RENTABILIDAD ---
                const realTime = dayjs(order.endDate).diff(dayjs(order.startDate), 'minute', true) || 0;
                const estimatedTime = (specSheet.specSheetProcesses || []).reduce((sum, p) => sum + (p.estimatedTimeMinutes || 0), 0);
                const initialAmount = parseInt(order.initialAmount) || 0;
                const finalAmount = parseInt(order.finalQuantityProduct) || 0;
                
                // Costos
                const materialCostPerUnit = parseFloat(specSheet.costPerUnit) || 0;
                const totalMaterialCost = parseFloat(specSheet.totalCost) || 0;
                const laborCost = realTime * costPerMinute;
                const totalRealCost = totalMaterialCost + laborCost;
                
                // Varianzas (Ajustes)
                const quantityVarianceCost = (initialAmount - finalAmount) * materialCostPerUnit;
                const timeVarianceCost = (realTime - estimatedTime) * costPerMinute;
                
                // Rentabilidad
                const revenuePerUnit = parseFloat(specSheet.product?.sellingPrice) || 0; // Necesitas el precio de venta en el producto
                const realRevenue = finalAmount * revenuePerUnit;
                const profit = realRevenue - totalRealCost;

                const employees = (order.productionOrderDetails || []).reduce((acc, step) => {
                    const empId = step.employeeAssigned?.idEmployee;
                    if (!empId) return acc;
                    if (!acc[empId]) acc[empId] = { employeeId: empId, employeeName: step.employeeAssigned.fullName, totalTime: 0 };
                    const stepDuration = dayjs(step.endDate).diff(dayjs(step.startDate), 'minute', true) || 0;
                    acc[empId].totalTime += stepDuration;
                    return acc;
                }, {});

                return {
                    orderId: order.idProductionOrder,
                    productName: order.productNameSnapshot,
                    initialAmount,
                    finalAmount,
                    realTime,
                    estimatedTime,
                    quantityVarianceCost,
                    timeVarianceCost,
                    totalVarianceCost: quantityVarianceCost + timeVarianceCost,
                    realRevenue,
                    materialCost: totalMaterialCost,
                    laborCost,
                    profit,
                    employees: Object.values(employees)
                };
            }).filter(Boolean);
            setAnalysisData(data);
        } catch (err) {
            setError("Error al calcular el rendimiento.");
            toast.error(err.message || "Error desconocido.");
        } finally {
            setIsSearching(false);
        }
    }, [filters, allEmployees]);

    const kpiData = useMemo(() => {
        if (analysisData.length === 0) return { totalProfit: 0, totalOrders: 0, totalVariance: 0 };
        const totalProfit = analysisData.reduce((sum, order) => sum + order.profit, 0);
        const totalVariance = analysisData.reduce((sum, order) => sum + order.totalVarianceCost, 0);
        return { totalProfit, totalOrders: analysisData.length, totalVariance };
    }, [analysisData]);
    
    return (
        <React.Fragment>
            <style>{`
                .dashboard-card { background: #fff; border: 1px solid #e9ecef; border-radius: 0.5rem; }
                .kpi-card { text-align: center; padding: 1.5rem; }
                .kpi-icon { margin-bottom: 0.5rem; }
                .kpi-value { font-size: 2rem; font-weight: 700; }
                .kpi-label { font-size: 0.9rem; color: #6c757d; }
                .order-row { cursor: pointer; transition: background-color 0.2s; }
                .order-row:hover { background-color: #f8f9fa; }
                .performance-bar-container { background-color: #e9ecef; border-radius: 10px; height: 10px; width: 100px; margin: auto; overflow: hidden; }
                .performance-bar { height: 100%; border-radius: 10px; transition: width 0.5s; }
                .breakdown-section { background-color: #fafbfe; }
                .breakdown-title { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1rem; }
            `}</style>
            <Container fluid className="p-4 main-content">
                <Toaster />
                <h2 className="mb-4">Análisis de Rentabilidad por Orden</h2>

                <Card className="mb-4 shadow-sm dashboard-card">
                    <CardBody>
                        {isLoading ? <div className="text-center"><Spinner/></div> :
                        <Row className="g-3 align-items-end">
                            <Col md={4}><FormGroup><Label className="small fw-bold"><Calendar/> Mes de Análisis</Label><DatePicker selected={filters.month} onChange={date => setFilters(f => ({...f, month: date}))} dateFormat="MM/yyyy" showMonthYearPicker className="form-control"/></FormGroup></Col>
                            <Col md={3}><FormGroup><Label className="small fw-bold"><UserIcon/> Empleado</Label><Select options={allEmployees} value={filters.employee} onChange={val => setFilters(f => ({...f, employee: val}))} placeholder="Todos..." isClearable/></FormGroup></Col>
                            <Col md={3}><FormGroup><Label className="small fw-bold"><Package/> Producto</Label><Select options={allProducts} value={filters.product} onChange={val => setFilters(f => ({...f, product: val}))} placeholder="Todos..." isClearable/></FormGroup></Col>
                            <Col md={2} className="d-flex justify-content-end"><Button color="primary" onClick={handleSearch} disabled={isSearching}>{isSearching ? <Spinner size="sm"/> : <Search/>}</Button></Col>
                        </Row>
                        }
                    </CardBody>
                </Card>

                {isSearching && <div className="text-center p-5"><Spinner/></div>}
                {error && <Alert color="danger">{error}</Alert>}

                {!isSearching && analysisData.length > 0 && (
                    <>
                        <Row className="g-4 mb-4">
                            <Col md={4}><Card className="dashboard-card kpi-card"><DollarSign size={32} className={`kpi-icon ${kpiData.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}/><div className="kpi-value">{formatCurrencyCOP(kpiData.totalProfit)}</div><div className="kpi-label">Rentabilidad Neta Total</div></Card></Col>
                            <Col md={4}><Card className="dashboard-card kpi-card"><Package size={32} className="kpi-icon text-info"/><div className="kpi-value">{kpiData.totalOrders}</div><div className="kpi-label">Órdenes Analizadas</div></Card></Col>
                            <Col md={4}><Card className="dashboard-card kpi-card"><Scale size={32} className={`kpi-icon ${kpiData.totalVariance > 0 ? 'text-danger' : 'text-success'}`}/><div className="kpi-value">{formatCurrencyCOP(kpiData.totalVariance)}</div><div className="kpi-label">Ajuste Total (Sobrecosto)</div></Card></Col>
                        </Row>

                        <Card className="shadow-sm dashboard-card">
                            <CardHeader className="bg-white border-0 pt-3"><TrendingUp/> Resultados de Órdenes de Producción</CardHeader>
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Producto (Orden)</th>
                                            <th className="text-center">Cant. Inicial</th>
                                            <th className="text-center">Cant. Final</th>
                                            <th className="text-center">Rendimiento Material</th>
                                            <th className="text-center">Tiempo Real</th>
                                            <th className="text-center">Rentabilidad</th>
                                            <th className="text-center">Desglose</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysisData.map(order => <OrderAnalysisRow key={order.orderId} order={order} />)}
                                    </tbody>
                                </Table>
                            </div>
                        </Card>
                    </>
                )}
            </Container>
        </React.Fragment>
    );
};

export default EmployeePerformanceDashboard;