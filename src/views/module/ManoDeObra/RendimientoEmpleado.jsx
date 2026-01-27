import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import {
    Container, Row, Col, Button, Label, Spinner,
    Table, Collapse, Badge, Card, CardBody
} from 'reactstrap';
import "react-datepicker/dist/react-datepicker.css";
import {
    Search, User as UserIcon, Package, Calendar, TrendingUp, ChevronDown, 
    ChevronUp, Clock, Scale, DollarSign, Activity, Zap, Weight, Layers, AlertTriangle
} from 'lucide-react';
import Select from 'react-select';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import toast, { Toaster } from 'react-hot-toast';
import DatePicker from 'react-datepicker';

// --- Servicios ---
import empleadoService from '../../services/empleadoService';
import productoService from '../../services/productService';
import productionOrderService from '../../services/productionOrderService';
import specSheetService from '../../services/specSheetService';
import monthlyExpenseService from '../../services/MonthlyOverallExpenseService';

dayjs.extend(duration);

// --- HELPERS DE FORMATEO (Lógica funcional preservada) ---
const formatCOP = (value) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(value || 0));
};

const formatWeight = (value, unit = 'g') => {
    if (!value || value <= 0) return `0 ${unit}`;
    const numValue = parseFloat(value);
    let grams = numValue;
    if (unit?.toLowerCase() === 'kg') grams = numValue * 1000;
    else if (unit?.toLowerCase() === 'lb') grams = numValue * 453.592;
    if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
    return `${Math.round(grams)} g`;
};

const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
};

// --- COMPONENTE DE FILA DE ANÁLISIS ---
const OrderAnalysisRow = ({ order }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const yieldPercentage = order.estimated.quantity > 0 
        ? (order.real.quantity / order.estimated.quantity) * 100 : 0;

    const weightLossPercentage = order.real.initialWeight > 0
        ? ((order.real.initialWeight - order.real.finalWeight) / order.real.initialWeight) * 100 : 0;

    return (
        <Fragment>
            <tr 
                className="order-row" 
                onClick={() => setIsOpen(!isOpen)} 
                style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
            >
                <td className="ps-3 py-3">
                    <div className="fw-bold text-dark">{order.productName}</div>
                    <div className="d-flex align-items-center gap-2 small mt-1">
                        <Badge color="primary" className="bg-opacity-10 text-primary border-0">
                            #{order.orderNumber}
                        </Badge>
                        <span className="text-muted">|</span>
                        <span className="text-muted d-flex align-items-center">
                            <UserIcon size={12} className="me-1"/>
                            {order.employeeSummary}
                        </span>
                    </div>
                </td>
                <td className="text-center">{order.estimated.quantity}</td>
                <td className="text-center fw-bold text-primary">{order.real.quantity}</td>
                <td className="text-center text-muted small">{formatWeight(order.real.initialWeight, order.real.initialWeightUnit)}</td>
                <td className="text-center text-muted small">{formatWeight(order.real.finalWeight, order.real.finalWeightUnit)}</td>
                <td className="text-center">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                        <div className="progress" style={{ height: '5px', width: '50px', backgroundColor: '#eee' }}>
                            <div 
                                className={`progress-bar ${yieldPercentage >= 95 ? 'bg-success' : 'bg-warning'}`} 
                                style={{ width: `${Math.min(yieldPercentage, 100)}%` }}
                            />
                        </div>
                        <span className="small fw-bold">{yieldPercentage.toFixed(0)}%</span>
                    </div>
                </td>
                <td className="text-center fw-bold">{formatDuration(order.real.time)}</td>
                <td className={`text-end pe-3 fw-bold ${order.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCOP(order.profit)}
                </td>
                <td className="text-center">
                    {isOpen ? <ChevronUp size={16} className="text-primary"/> : <ChevronDown size={16} className="text-muted"/>}
                </td>
            </tr>
            <tr>
                <td colSpan="9" className="p-0 border-0">
                    <Collapse isOpen={isOpen}>
                        <div className="p-4" style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }}>
                            <Row className="g-4">
                                {/* SECCIÓN DE COSTOS (Explicación: Producción, Materiales, Mano Obra) */}
                                <Col lg={4}>
                                    <div className="p-3 bg-white border rounded shadow-sm h-100">
                                        <h6 className="fw-bold mb-3 text-muted small d-flex align-items-center gap-2">
                                            <DollarSign size={16} className="text-success"/>
                                            ANÁLISIS DE COSTOS
                                        </h6>
                                        <div className="d-flex justify-content-between py-2 border-bottom small">
                                            <span>Valor Producción (Venta):</span>
                                            <span className="fw-bold text-success">{formatCOP(order.real.revenue)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between py-2 border-bottom small">
                                            <span>Materiales (Ficha T.):</span>
                                            <span className="text-danger">-{formatCOP(order.estimated.materialCost)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between py-2 border-bottom small">
                                            <span>Mano de Obra (Tiempo):</span>
                                            <span className="text-danger">-{formatCOP(order.real.laborCost)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between pt-3">
                                            <span className="fw-bold">Margen Operativo:</span>
                                            <span className={`h6 mb-0 fw-bold ${order.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCOP(order.profit)}
                                            </span>
                                        </div>
                                    </div>
                                </Col>

                                {/* SECCIÓN DE EFICIENCIA (Estimados visibles) */}
                                <Col lg={8}>
                                    <div className="p-3 bg-white border rounded shadow-sm h-100">
                                        <h6 className="fw-bold mb-3 text-muted small d-flex align-items-center gap-2">
                                            <Zap size={16} className="text-warning"/>
                                            EFICIENCIA VS FICHA TÉCNICA
                                        </h6>
                                        <Table borderless size="sm" className="mb-0">
                                            <thead>
                                                <tr className="text-muted small border-bottom">
                                                    <th>CONCEPTO</th>
                                                    <th className="text-center">ESTIMADO</th>
                                                    <th className="text-center">REAL</th>
                                                    <th className="text-end">VARIANZA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="small">
                                                    <td className="py-2">Tiempo de Proceso</td>
                                                    <td className="text-center">
                                                        <Badge color="secondary" className="px-2">{formatDuration(order.estimated.time)}</Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge color="warning" className="text-dark">{formatDuration(order.real.time)}</Badge>
                                                    </td>
                                                    <td className={`text-end fw-bold ${order.variances.time.value <= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {order.variances.time.value > 0 ? '+' : ''}{formatDuration(order.variances.time.value)}
                                                    </td>
                                                </tr>
                                                <tr className="small">
                                                    <td className="py-2">Cantidad Producida</td>
                                                    <td className="text-center">
                                                        <Badge color="secondary" className="px-2">{order.estimated.quantity} uds</Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge color="info">{order.real.quantity} uds</Badge>
                                                    </td>
                                                    <td className={`text-end fw-bold ${order.variances.quantity.value >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {order.variances.quantity.value > 0 ? '+' : ''}{order.variances.quantity.value} uds
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        
                                        {/* OPTIMIZACIÓN DE ESPACIO PESOS */}
                                        <div className="mt-3 p-2 border-top small d-flex justify-content-between align-items-center">
                                            <span><strong>Peso Inicial:</strong> {formatWeight(order.real.initialWeight, order.real.initialWeightUnit)}</span>
                                            <span><strong>Peso Final:</strong> {formatWeight(order.real.finalWeight, order.real.finalWeightUnit)}</span>
                                            <span className="text-muted">Merma: <span className="text-danger">{weightLossPercentage.toFixed(1)}%</span></span>
                                        </div>

                                        {/* PARTICIPACIÓN EN PROCESO (Detalle de empleados por paso) */}
                                        {order.stepsDetail && order.stepsDetail.length > 0 && (
                                            <div className="mt-3 pt-2 border-top">
                                                <div className="small fw-bold text-muted mb-2 text-uppercase"><Layers size={14}/> Participación:</div>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {order.stepsDetail.map((step, idx) => (
                                                        step.stepName && (
                                                            <Badge key={idx} color="light" className="text-dark border fw-normal px-2 py-1">
                                                                <span className="fw-bold text-primary">{step.employeeName}:</span> {step.stepName}
                                                            </Badge>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {order.variances.totalCost !== 0 && (
                                            <div className={`mt-3 p-2 rounded small d-flex justify-content-between align-items-center ${order.variances.totalCost > 0 ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                                                <span className="fw-bold">{order.variances.totalCost > 0 ? 'Sobre-costo' : 'Ahorro por Eficiencia'}:</span>
                                                <span className="fw-bold">{formatCOP(Math.abs(order.variances.totalCost))}</span>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Collapse>
                </td>
            </tr>
        </Fragment>
    );
};

// --- DASHBOARD PRINCIPAL ---
const EmployeePerformanceDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [filters, setFilters] = useState({ date: new Date(), product: null, employee: null });
    const [allProducts, setAllProducts] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [analysisData, setAnalysisData] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [p, e] = await Promise.all([
                    productoService.getAllProducts(),
                    empleadoService.getAllEmpleados()
                ]);
                setAllProducts(p.map(x => ({ value: x.idProduct, label: x.productName })));
                setAllEmployees(e.map(x => ({ value: x.idEmployee, label: x.fullName })));
            } catch (err) { toast.error("Error al cargar filtros"); }
            finally { setIsLoading(false); }
        };
        fetchInitialData();
    }, []);

    const handleSearch = useCallback(async () => {
        setIsSearching(true);
        try {
            // Usar format('YYYY-MM-DD') para evitar problemas de zona horaria (UTC vs Local)
            const dateStr = dayjs(filters.date).format('YYYY-MM-DD');

            const year = dayjs(filters.date).year();
            const month = dayjs(filters.date).month() + 1;

            const expenseData = await monthlyExpenseService.getTotalExpenseByMonth(year, month);
            const totalMonthlyExpense = expenseData?.totalExpense || 0;
            const minutesInMonth = allEmployees.length * 22 * 8 * 60;
            const costPerMinute = minutesInMonth > 0 ? totalMonthlyExpense / minutesInMonth : 0;

            const [specSheets, orders] = await Promise.all([
                specSheetService.getAllSpecSheetsWithCosts(),
                productionOrderService.getAllProductionOrders({
                    status: 'COMPLETED',
                    idProduct: filters.product?.value,
                    idEmployee: filters.employee?.value,
                    // CAMBIO AQUÍ: Enviamos la fecha limpia en formato YYYY-MM-DD
                    startDate: dateStr, 
                    endDate: dateStr
                })
            ]);
            const specSheetMap = new Map(specSheets.map(s => [s.idSpecSheet, s]));

            const calculatedData = orders.map(order => {
                const sheet = specSheetMap.get(order.idSpecSheet);
                if (!sheet) return null;

                const steps = order.productionOrderDetails || [];
                
                // --- LÓGICA DE EMPLEADOS ---
                // Intentamos traer nombres de varias fuentes comunes en la respuesta del API
                const uniqueEmployees = [...new Set(steps.map(s => 
                    s.Employee?.fullName || s.employeeName || (s.idEmployee ? `ID: ${s.idEmployee}` : 'S/A')
                ))];

                let employeeSummary = "";
                if (uniqueEmployees.length === 1) {
                    employeeSummary = `${uniqueEmployees[0]} (Orden Completa)`;
                } else if (uniqueEmployees.length > 1) {
                    employeeSummary = `${uniqueEmployees.length} empleados en proceso`;
                } else {
                    employeeSummary = "Sin asignar";
                }

                const stepsDetail = steps.map(s => ({
                    stepName: s.stepName || s.ProductionProcess?.processName || "Paso",
                    employeeName: s.Employee?.fullName || s.employeeName || "S/A"
                }));

                const realTimeMinutes = steps.reduce((acc, step) => {
                    if (step.startDate && step.endDate) {
                        return acc + dayjs(step.endDate).diff(dayjs(step.startDate), 'minute');
                    }
                    return acc;
                }, 0);

                const estimatedTimeMinutes = steps.reduce((acc, step) => acc + (parseFloat(step.estimatedTimeMinutes) || 0), 0);

                const realQty = parseFloat(order.finalQuantityProduct || 0);
                const estQty = parseFloat(order.initialAmount || 0);
                
                // Cálculo de costos (Lógica funcional original)
                const portions = parseFloat(sheet.portions || 1);
                const unitCostMaterial = portions > 0 ? parseFloat(sheet.totalCost || 0) / portions : 0;
                
                const totalLaborCost = realTimeMinutes * costPerMinute;
                const totalMaterialCost = estQty * unitCostMaterial;
                const totalRevenue = realQty * (parseFloat(sheet.product?.sellingPrice || 0));

                return {
                    orderId: order.idProductionOrder,
                    orderNumber: order.orderNumber || order.idProductionOrder,
                    productName: order.productNameSnapshot || 'Sin nombre',
                    employeeSummary,
                    stepsDetail,
                    profit: totalRevenue - totalLaborCost - totalMaterialCost,
                    estimated: { quantity: estQty, time: estimatedTimeMinutes, materialCost: totalMaterialCost },
                    real: { 
                        quantity: realQty, time: realTimeMinutes, laborCost: totalLaborCost, revenue: totalRevenue,
                        initialWeight: parseFloat(order.inputInitialWeight || 0), initialWeightUnit: order.inputInitialWeightUnit || 'g',
                        finalWeight: parseFloat(order.finishedProductWeight || 0), finalWeightUnit: order.finishedProductWeightUnit || 'g'
                    },
                    variances: {
                        quantity: { value: realQty - estQty },
                        time: { value: realTimeMinutes - estimatedTimeMinutes },
                        totalCost: ((realTimeMinutes - estimatedTimeMinutes) * costPerMinute) + ((estQty - realQty) * unitCostMaterial)
                    }
                };
            }).filter(d => d !== null);

            setAnalysisData(calculatedData);
            if (calculatedData.length === 0) toast.error("No se hallaron órdenes para este día.");
        } catch (err) { toast.error("Error al procesar el análisis"); }
        finally { setIsSearching(false); }
    }, [filters, allEmployees]);

    const kpis = useMemo(() => {
        return analysisData.reduce((acc, curr) => ({
            profit: acc.profit + curr.profit,
            orders: acc.orders + 1,
            variance: acc.variance + curr.variances.totalCost
        }), { profit: 0, orders: 0, variance: 0 });
    }, [analysisData]);

    return (
        <Container fluid className="p-4 min-vh-100"> {/* Fondo blanco limpio */}
            <Toaster position="top-right" />
            
            <div className="mb-4">
                <h2 className="fw-bold d-flex align-items-center gap-2">
                    <Activity className="text-primary" size={32}/>
                    Rendimiento de Producción
                </h2>
                <p className="text-muted mb-0">Gestión de eficiencia operativa por jornada de trabajo</p>
            </div>

            {/* FILTROS (Diseño limpio) */}
            <Card className="mb-4 border shadow-sm">
                <CardBody className="p-3">
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Label className="small fw-bold text-muted text-uppercase mb-2">Fecha de Producción</Label>
                            <DatePicker 
                                selected={filters.date} 
                                onChange={d => setFilters({...filters, date: d})} 
                                dateFormat="dd/MM/yyyy" 
                                className="form-control"
                            />
                        </Col>
                        <Col md={4}>
                            <Label className="small fw-bold text-muted text-uppercase mb-2">Empleado</Label>
                            <Select options={allEmployees} isClearable onChange={v => setFilters({...filters, employee: v})} placeholder="Todos los empleados" />
                        </Col>
                        <Col md={4}>
                            <Label className="small fw-bold text-muted text-uppercase mb-2">Producto</Label>
                            <Select options={allProducts} isClearable onChange={v => setFilters({...filters, product: v})} placeholder="Todos los productos" />
                        </Col>
                        <Col md={1}>
                            <Button color="primary" className="w-100" onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <Spinner size="sm"/> : <Search size={20}/>}
                            </Button>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* KPIs */}
            {analysisData.length > 0 && (
                <>
                    <Row className="mb-4 g-3">
                        <Col md={4}>
                            <Card className="border shadow-sm">
                                <CardBody className="text-center p-4">
                                    <TrendingUp size={32} className={kpis.profit >= 0 ? 'text-success' : 'text-danger'}/>
                                    <h6 className="text-muted small fw-bold text-uppercase mt-2">Utilidad Neta del Día</h6>
                                    <div className={`h2 fw-bold mb-0 ${kpis.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCOP(kpis.profit)}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border shadow-sm">
                                <CardBody className="text-center p-4">
                                    <Package size={32} className="text-info"/>
                                    <h6 className="text-muted small fw-bold text-uppercase mt-2">Órdenes Finalizadas</h6>
                                    <div className="h2 fw-bold text-info mb-0">{kpis.orders}</div>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border shadow-sm">
                                <CardBody className="text-center p-4">
                                    <Scale size={32} className={kpis.variance > 0 ? 'text-danger' : 'text-success'}/>
                                    <h6 className="text-muted small fw-bold text-uppercase mt-2">Varianza de Costos</h6>
                                    <div className={`h2 fw-bold mb-0 ${kpis.variance > 0 ? 'text-danger' : 'text-success'}`}>
                                        {formatCOP(kpis.variance)}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* TABLA PRINCIPAL (Sin cabecera oscura) */}
                    <div className="bg-white border rounded shadow-sm">
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="bg-light">
                                <tr className="small text-muted text-uppercase">
                                    <th className="py-3 ps-3">Producto / Orden</th>
                                    <th className="text-center">Iniciado</th>
                                    <th className="text-center">Terminado</th>
                                    <th className="text-center">P. Inicial</th>
                                    <th className="text-center">P. Final</th>
                                    <th className="text-center">Rendimiento</th>
                                    <th className="text-center">Tiempo</th>
                                    <th className="text-end pe-3">Utilidad</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysisData.map(order => <OrderAnalysisRow key={order.orderId} order={order} />)}
                            </tbody>
                        </Table>
                    </div>
                </>
            )}

            {analysisData.length === 0 && !isSearching && (
                <div className="text-center py-5 bg-white border rounded">
                    <Search size={48} className="text-muted mb-3 opacity-25"/>
                    <h5 className="text-muted">No hay datos para mostrar</h5>
                    <p className="small text-muted">Ajuste los filtros de búsqueda para visualizar el rendimiento</p>
                </div>
            )}
        </Container>
    );
};

export default EmployeePerformanceDashboard;