// src/components/Performance/EmployeePerformanceDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Row, Col, Button, FormGroup, Label, Alert, Spinner,
    Card, CardHeader, CardBody, Table, Input
} from 'reactstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Filter, Search, Clock, DollarSign, Percent, User as UserIcon, BarChart as BarChartIcon } from 'lucide-react';
import Select from 'react-select';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import {
    BarChart, Bar, ResponsiveContainer, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList
} from 'recharts';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// --- Servicios ---
import empleadoService from '../../services/empleadoService';
// Asumiendo que tienes un servicio para obtener los datos de rendimiento
// import performanceService from '../../services/performanceService'; // DEBES CREAR ESTE SERVICIO
import productoInsumoService from '../../services/productService';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrencyCOP } from "../../../utils/formatting";
import '../../../assets/css/EmployeePerformanceDashboard.css'; // Asegúrate de tener este CSS para estilos adicionales

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#0088FE', '#AF19FF', '#FF4560', '#30C9E8'];


const EmployeePerformanceDashboard = () => {
    const navigate = useNavigate();

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [allEmployees, setAllEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rawPerformanceData, setRawPerformanceData] = useState([]);
    const [groupedPerformanceData, setGroupedPerformanceData] = useState({});
    const [chartSummaryData, setChartSummaryData] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);

    const fetchFilterOptions = useCallback(async () => {
        setIsLoading(true);
        try {
            const [productsRes, employeesRes] = await Promise.all([
                productoInsumoService.getAllProducts(),
                empleadoService.getAllEmpleados()
            ]);

            if (Array.isArray(productsRes)) {
                setAllProducts(productsRes.map(p => ({ value: p.idProduct, label: p.nameProduct || `Producto ID ${p.idProduct}` })));
            }
            if (Array.isArray(employeesRes)) {
                setAllEmployees(employeesRes.map(e => ({ value: e.idEmployee, label: `${e.name} ${e.lastName || ''}`.trim() })));
            }
        } catch (err) {
            console.error("Error fetching filter options:", err);
            toast.error("Error al cargar opciones para filtros.");
        } finally {
            setIsLoading(false); // Solo se desactiva después de que ambas promesas se resuelvan
        }
    }, []);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    const processAndGroupData = useCallback((data) => {
        if (!data || data.length === 0) {
            setGroupedPerformanceData({});
            setChartSummaryData([]);
            return;
        }
        const grouped = data.reduce((acc, item) => {
            const key = item.employeeName || `Empleado ID ${item.employeeId}`;
            if (!acc[key]) {
                acc[key] = {
                    employeeId: item.employeeId,
                    employeeName: item.employeeName || `Empleado ID ${item.employeeId}`,
                    records: [],
                    totalTimeSpent: 0,
                    totalCostSaved: 0,
                    efficiencyScores: [],
                    recordCount: 0
                };
            }
            acc[key].records.push(item);
            acc[key].totalTimeSpent += (Number(item.timeSpent) || 0);
            acc[key].totalCostSaved += (Number(item.costSaved) || 0);
            if (typeof item.efficiencyPercentage === 'number' && !isNaN(item.efficiencyPercentage)) {
                acc[key].efficiencyScores.push(item.efficiencyPercentage);
            }
            acc[key].recordCount++;
            return acc;
        }, {});
        setGroupedPerformanceData(grouped);

        const summary = Object.values(grouped).map(empGroup => {
            const avgEfficiency = empGroup.efficiencyScores.length > 0
                ? empGroup.efficiencyScores.reduce((a, b) => a + b, 0) / empGroup.efficiencyScores.length
                : 0;
            return {
                name: empGroup.employeeName,
                totalTimeSpent: empGroup.totalTimeSpent,
                totalCostSaved: empGroup.totalCostSaved,
                averageEfficiency: parseFloat(avgEfficiency.toFixed(2))
            };
        });
        setChartSummaryData(summary);
    }, []);

    const handleFetchPerformanceData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setShowResults(false);
        setRawPerformanceData([]);
        setGroupedPerformanceData({});
        setChartSummaryData([]);
        setExpandedRow(null);

        const filters = {};
        if (startDate) filters.startDate = dayjs(startDate).format('YYYY-MM-DD');
        if (endDate) filters.endDate = dayjs(endDate).format('YYYY-MM-DD');
        if (selectedProduct) filters.productId = selectedProduct.value;
        if (selectedEmployee) filters.employeeId = selectedEmployee.value;

        console.log("Fetching performance data with filters:", filters);

        try {
            // --- INICIO SIMULACIÓN (REEMPLAZAR CUANDO TENGAS EL BACKEND Y performanceService) ---
            // const dataFromService = await performanceService.getEmployeePerformanceData(filters);
            // if (!Array.isArray(dataFromService)) {
            //     throw new Error("La respuesta del servicio de rendimiento no es un array.");
            // }
            // let filteredBackendData = dataFromService;
            // --- FIN LLAMADA REAL (REEMPLAZAR SIMULACIÓN) ---


            // --- SIMULACIÓN DE DATOS (COMENTAR O ELIMINAR CUANDO EL BACKEND ESTÉ LISTO) ---
            await new Promise(resolve => setTimeout(resolve, 1000));
            let simulatedData = [
                { id: 1, employeeId: 1, employeeName: 'Ana Pérez', productId: 1, productName: 'Pollo Entero', date: '2023-10-26', initialWeight: 10, finalWeight: 8.5, initialPortions: 1, finalPortions: 4, timeSpent: 30, costSaved: 5000, efficiencyPercentage: 85 },
                { id: 2, employeeId: 2, employeeName: 'Luis Meza', productId: 2, productName: 'Lomo Fino', date: '2023-10-26', initialWeight: 5, finalWeight: 4.8, initialPortions: 1, finalPortions: 10, timeSpent: 20, costSaved: 2500, efficiencyPercentage: 96 },
                { id: 3, employeeId: 1, employeeName: 'Ana Pérez', productId: 2, productName: 'Lomo Fino', date: '2023-10-27', initialWeight: 6, finalWeight: 5.5, initialPortions: 1, finalPortions: 12, timeSpent: 25, costSaved: 3000, efficiencyPercentage: 91.67 },
                { id: 4, employeeId: 3, employeeName: 'Carlos Ruiz', productId: 1, productName: 'Pollo Entero', date: '2023-10-28', initialWeight: 12, finalWeight: 10.2, initialPortions: 1, finalPortions: 5, timeSpent: 35, costSaved: 6000, efficiencyPercentage: 85 },
                { id: 5, employeeId: 2, employeeName: 'Luis Meza', productId: 1, productName: 'Pollo Entero', date: '2023-10-29', initialWeight: 8, finalWeight: 7.0, initialPortions: 1, finalPortions: 3, timeSpent: 28, costSaved: 4000, efficiencyPercentage: 87.5 },
                 // Más datos para Ana Pérez
                { id: 6, employeeId: 1, employeeName: 'Ana Pérez', productId: 1, productName: 'Pollo Entero', date: '2023-10-30', initialWeight: 9, finalWeight: 7.8, initialPortions: 1, finalPortions: 3, timeSpent: 28, costSaved: 4500, efficiencyPercentage: 86.67 },
                { id: 7, employeeId: 1, employeeName: 'Ana Pérez', productId: 3, productName: 'Pescado Blanco', date: '2023-10-30', initialWeight: 7, finalWeight: 6.5, initialPortions: 1, finalPortions: 5, timeSpent: 22, costSaved: 1500, efficiencyPercentage: 92.86 },
            ];

            let filteredBackendData = simulatedData;
            // Si el backend ya filtra, estas líneas no serían necesarias aquí.
            // Si el backend devuelve todo y filtras en frontend (no ideal para grandes datasets):
            if (filters.startDate) {
                filteredBackendData = filteredBackendData.filter(d => dayjs(d.date).isSameOrAfter(dayjs(filters.startDate), 'day'));
            }
            if (filters.endDate) {
                filteredBackendData = filteredBackendData.filter(d => dayjs(d.date).isSameOrBefore(dayjs(filters.endDate), 'day'));
            }
            if (filters.productId) {
                filteredBackendData = filteredBackendData.filter(d => d.productId === filters.productId);
            }
            if (filters.employeeId) {
                filteredBackendData = filteredBackendData.filter(d => d.employeeId === filters.employeeId);
            }
            // --- FIN SIMULACIÓN ---

            setRawPerformanceData(filteredBackendData);
            processAndGroupData(filteredBackendData);

            if (filteredBackendData.length === 0) {
                toast.info("No se encontraron datos de rendimiento para los filtros seleccionados.");
            }
            setShowResults(true);

        } catch (err) {
            console.error("Error fetching performance data:", err);
            const errorMsg = err.response?.data?.message || err.message || "Error al cargar datos.";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, selectedProduct, selectedEmployee, processAndGroupData]);

    const toggleRow = (employeeId, itemId) => { const currentKey = `${employeeId}-${itemId}`; setExpandedRow(expandedRow === currentKey ? null : currentKey); };
    const handleBack = () => navigate(-1);
    const handleClearFilters = () => { setStartDate(null); setEndDate(null); setSelectedProduct(null); setSelectedEmployee(null); setShowResults(false); setRawPerformanceData([]); setGroupedPerformanceData({}); setChartSummaryData([]); setError(null); setExpandedRow(null); };

    const renderSummaryCharts = () => (
        <Col lg={4} md={12} className="mb-4 mb-lg-0">
            <h4 className="mb-3 text-muted">Resumen por Empleado</h4>
            <Card className="mb-3 shadow-sm">
                <CardHeader style={{backgroundColor: 'var(--dashboard-accent-color, #9e3535)', color: 'var(--dashboard-accent-text-color, #FFF)'}}>
                    <Clock size={18} className="me-2" /> Tiempo Total Invertido (min)
                </CardHeader>
                <CardBody>
                    {chartSummaryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartSummaryData} layout="vertical" margin={{ top: 5, right: 40, left: 80, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }}/>
                                <Tooltip formatter={(value) => `${value} min`} />
                                <Bar dataKey="totalTimeSpent" fill={CHART_COLORS[0]} barSize={20}>
                                   <LabelList dataKey="totalTimeSpent" position="right" formatter={(value) => `${value}`} style={{ fill: '#333', fontSize: '0.8em' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-muted p-3">Sin datos para graficar.</p>}
                </CardBody>
            </Card>

            <Card className="mb-3 shadow-sm">
                <CardHeader style={{backgroundColor: 'var(--dashboard-accent-color, #9e3535)', color: 'var(--dashboard-accent-text-color, #FFF)'}}>
                    <DollarSign size={18} className="me-2" /> Ahorro/Costo Total
                </CardHeader>
                <CardBody>
                    {chartSummaryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartSummaryData} layout="vertical" margin={{ top: 5, right: 50, left: 80, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }}/>
                                <Tooltip formatter={(value) => `${formatCurrencyCOP(value)}`} />
                                <Bar dataKey="totalCostSaved" barSize={20}>
                                    {chartSummaryData.map((entry, index) => (
                                        <Cell key={`cell-cost-${index}`} fill={entry.totalCostSaved >= 0 ? CHART_COLORS[1] : CHART_COLORS[3]} />
                                    ))}
                                     <LabelList dataKey="totalCostSaved" position="right" formatter={(value) => formatCurrencyCOP(value,0)} style={{ fill: '#333', fontSize: '0.8em' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-muted p-3">Sin datos para graficar.</p>}
                </CardBody>
            </Card>

            <Card className="shadow-sm">
                <CardHeader style={{backgroundColor: 'var(--dashboard-accent-color, #9e3535)', color: 'var(--dashboard-accent-text-color, #FFF)'}}>
                    <Percent size={18} className="me-2" /> Eficiencia Promedio (%)
                </CardHeader>
                <CardBody>
                     {chartSummaryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <ComposedChart layout="vertical" data={chartSummaryData} margin={{ top: 5, right: 40, left: 80, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 'dataMax + 10']} tickFormatter={(tick) => `${tick}%`}/>
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }}/>
                                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                                <Bar dataKey="averageEfficiency" barSize={20} fill={CHART_COLORS[2]}>
                                    <LabelList dataKey="averageEfficiency" position="right" formatter={(value) => `${value}%`} style={{ fill: '#333', fontSize: '0.8em' }} />
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-muted p-3">Sin datos para graficar.</p>}
                </CardBody>
            </Card>
        </Col>
    );

    return (
        <Container fluid className="p-4 employee-performance-dashboard">
            <Toaster position="top-center" />
            <Row className="mb-3 align-items-center">
                <Col><h2 style={{color: 'var(--dashboard-text-color, #5C4033)'}}><BarChartIcon size={28} className="me-2" style={{color: 'var(--dashboard-accent-color, #9e3535)'}} />Rendimiento de Empleados</h2></Col>
                <Col md="auto"><Button color="secondary" outline onClick={handleBack}>Volver</Button></Col>
            </Row>

            <div className="filters-section mb-4 p-3">
                 <Row className="g-3 align-items-end">
                        <Col md={3} sm={6} xs={12}>
                            <FormGroup>
                                <Label for="startDate" className="fw-bold small">Desde:</Label>
                                <DatePicker id="startDate" selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="dd/MM/yyyy" className="form-control form-control-sm" placeholderText="Fecha de inicio" selectsStart startDate={startDate} endDate={endDate} isClearable autoComplete="off" />
                            </FormGroup>
                        </Col>
                        <Col md={3} sm={6} xs={12}>
                            <FormGroup>
                                <Label for="endDate" className="fw-bold small">Hasta:</Label>
                                <DatePicker id="endDate" selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="dd/MM/yyyy" className="form-control form-control-sm" placeholderText="Fecha de fin" selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} isClearable autoComplete="off" />
                            </FormGroup>
                        </Col>
                        <Col md={3} sm={6} xs={12}>
                            <FormGroup>
                                <Label for="employeeFilter" className="fw-bold small">Empleado:</Label>
                                <Select
                                    id="employeeFilter"
                                    options={allEmployees}
                                    value={selectedEmployee}
                                    onChange={setSelectedEmployee}
                                    placeholder="Todos los empleados..."
                                    isClearable
                                    isSearchable
                                    classNamePrefix="react-select-sm"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3} sm={6} xs={12}>
                            <FormGroup>
                                <Label for="productFilter" className="fw-bold small">Producto/Insumo:</Label>
                                <Select
                                    id="productFilter"
                                    options={allProducts}
                                    value={selectedProduct}
                                    onChange={setSelectedProduct}
                                    placeholder="Todos los productos..."
                                    isClearable
                                    isSearchable
                                    classNamePrefix="react-select-sm"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={12} className="d-flex justify-content-md-end mt-3 gap-2">
                            <Button color="outline-secondary" size="sm" onClick={handleClearFilters} style={{minWidth: '100px'}}>
                                Limpiar
                            </Button>
                            <Button color="primary" onClick={handleFetchPerformanceData} disabled={isLoading} className="btn-sm" style={{minWidth: '100px'}}>
                                {isLoading ? <Spinner size="sm" /> : <><Search size={16} className="me-1" /> Buscar</>}
                            </Button>
                        </Col>
                    </Row>
            </div>

            {isLoading && (<div className="text-center p-5"><Spinner color="primary" style={{ width: '3rem', height: '3rem' }}>Cargando...</Spinner><p className="mt-2">Consultando datos...</p></div>)}
            {error && !isLoading && <Alert color="danger" className="text-center">Error: {error}</Alert>}

            {showResults && !isLoading && !error && (
                <Row>
                    <Col lg={Object.keys(groupedPerformanceData).length > 0 && chartSummaryData.length > 0 ? 8 : 12} md={12} className="mb-4 mb-lg-0">
                        {Object.keys(groupedPerformanceData).length > 0 ? (
                            Object.entries(groupedPerformanceData).map(([employeeKey, empData]) => (
                                <Card key={employeeKey} className="mb-4 shadow-sm employee-performance-card">
                                    <CardHeader className="d-flex align-items-center justify-content-between" style={{backgroundColor: 'var(--dashboard-accent-color, #9e3535)', color: 'var(--dashboard-accent-text-color, #FFF)'}}>
                                        <div>
                                            <UserIcon size={20} className="me-2"/>
                                            <span className="fw-bold">{empData.employeeName}</span>
                                        </div>
                                        <span className="badge bg-light text-dark rounded-pill">{empData.recordCount} registro(s)</span>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        {empData.records.length > 0 ? (
                                            <div className="table-responsive">
                                                <Table hover striped className="performance-table mb-0" size="sm">
                                                    <thead>
                                                        <tr>
                                                            <th style={{width: '50px'}}></th><th>Fecha</th><th>Producto/Insumo</th>
                                                            <th className="text-end">P. Ini.</th><th className="text-end">P. Fin.</th>
                                                            <th className="text-end">Porc. Ini.</th><th className="text-end">Porc. Fin.</th>
                                                            <th className="text-center" style={{width: '120px'}}>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {empData.records.map((item) => (
                                                            <React.Fragment key={`${empData.employeeId}-${item.id}`}> {/* Clave más única */}
                                                                <tr>
                                                                    <td className="text-center"><Button color="link" size="sm" className="p-1" onClick={() => toggleRow(empData.employeeId, item.id)} title={expandedRow === `${empData.employeeId}-${item.id}` ? "Ocultar" : "Ver Rendimiento"}><ChevronDown size={18} className={expandedRow === `${empData.employeeId}-${item.id}` ? 'rotated-chevron' : ''} /></Button></td>
                                                                    <td>{dayjs(item.date).format('DD/MM/YYYY')}</td>
                                                                    <td>{item.productName}</td>
                                                                    <td className="text-end">{item.initialWeight?.toFixed(2)}</td>
                                                                    <td className="text-end">{item.finalWeight?.toFixed(2)}</td>
                                                                    <td className="text-end">{item.initialPortions}</td>
                                                                    <td className="text-end">{item.finalPortions}</td>
                                                                    <td className="text-center"><Button style={{backgroundColor: 'var(--dashboard-accent-color, #9e3535)', color: 'var(--dashboard-accent-text-color, #FFF)'}} outline={false} size="sm" onClick={() => toggleRow(empData.employeeId, item.id)}>Rendimiento</Button></td>
                                                                </tr>
                                                                {expandedRow === `${empData.employeeId}-${item.id}` && (
                                                                    <tr className="expanded-row">
                                                                        <td colSpan="8" className="p-0">
                                                                            <div className="p-3">
                                                                                <Card className="shadow-inner" outline style={{borderColor: 'var(--dashboard-accent-color, #9e3535)'}}>
                                                                                    <CardHeader className="py-2 px-3" style={{backgroundColor: 'var(--dashboard-accent-color, #9e3535)', color: 'var(--dashboard-accent-text-color, #FFF)'}}>
                                                                                        <h6 className="mb-0">Detalle: {item.productName} ({dayjs(item.date).format('DD/MM/YYYY')})</h6>
                                                                                    </CardHeader>
                                                                                    <CardBody className="p-3">
                                                                                        <Row>
                                                                                            <Col md={4} className="mb-3 mb-md-0"><div className="d-flex align-items-center mb-1"><Clock size={18} className="me-2" style={{color: 'var(--dashboard-accent-color, #9e3535)'}} /><strong style={{color: 'var(--dashboard-text-color, #5C4033)'}}>Tiempo:</strong></div><p className="ms-4 ps-1 mb-0" style={{color: 'var(--dashboard-text-color, #5C4033)'}}>{item.timeSpent || 0} min</p></Col>
                                                                                            <Col md={4} className="mb-3 mb-md-0"><div className="d-flex align-items-center mb-1"><DollarSign size={18} className="me-2" style={{color: 'var(--dashboard-accent-color, #9e3535)'}} /><strong style={{color: 'var(--dashboard-text-color, #5C4033)'}}>Ahorro/Costo:</strong></div><p className={`ms-4 ps-1 mb-0 fw-bold ${item.costSaved >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrencyCOP(item.costSaved || 0)}</p></Col>
                                                                                            <Col md={4}><div className="d-flex align-items-center mb-1"><Percent size={18} className="me-2" style={{color: 'var(--dashboard-accent-color, #9e3535)'}} /><strong style={{color: 'var(--dashboard-text-color, #5C4033)'}}>Eficiencia (%):</strong></div><p className="ms-4 ps-1 mb-0" style={{color: 'var(--dashboard-text-color, #5C4033)'}}>{item.efficiencyPercentage?.toFixed(2) || 0}%</p></Col>
                                                                                        </Row>
                                                                                    </CardBody>
                                                                                </Card>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        ) : ( <Alert color="light" className="text-center fst-italic m-3 py-4">No hay registros de rendimiento para este empleado con los filtros aplicados.</Alert> )}
                                    </CardBody>
                                </Card>
                            ))
                        ) : (
                            <Alert color="info" className="text-center fst-italic m-3 py-4">No se encontraron datos de rendimiento para los filtros aplicados.</Alert>
                        )}
                    </Col>
                    {Object.keys(groupedPerformanceData).length > 0 && chartSummaryData.length > 0 && renderSummaryCharts()}
                </Row>
            )}
             {!isLoading && !showResults && (
                 <Alert color="secondary" className="text-center py-4 mt-4">
                    <Filter size={20} className="me-2" />
                    Seleccione los filtros y haga clic en "Buscar" para ver los datos de rendimiento.
                </Alert>
            )}
        </Container>
    );
};

export default EmployeePerformanceDashboard;