import React, { useState, useCallback } from 'react';
import {
    Container, Row, Col, Button, FormGroup, Alert, Spinner,
    Modal, ModalHeader, ModalBody, ModalFooter, Card, CardHeader, CardBody, Table, Input, InputGroup
} from 'reactstrap';
import DatePicker from 'react-datepicker';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, ResponsiveContainer,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import MonthlyOverallExpenseService from '../../services/MonthlyOverallExpenseService';

// Colors for charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ExpenseDashboardByDate = () => {
    const navigate = useNavigate();
    
    // Date state
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalMessage, setModalMessage] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showResults, setShowResults] = useState(false);
    
    // Data state
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [chartData, setChartData] = useState({
        byTypeAmount: [],
        byTime: [],
        byTypePercentage: [],
        totalInRange: 0
    });

    // Helper function to format dates for display
    const formatDateKey = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
    };

    // --- Data Fetching and Processing Logic ---
    const processData = useCallback((allExpenses) => {
        setError(null); // Clear previous errors
        setFilteredExpenses([]);
        setChartData({ byTypeAmount: [], byTime: [], byTypePercentage: [], totalInRange: 0 });
        setShowResults(false); // Hide results initially for new search

        if (!startDate || !endDate) {
            setModalMessage("Por favor, seleccione las fechas de inicio y fin.");
            setIsModalVisible(true);
            return;
        }
        if (startDate > endDate) {
            setModalMessage("La fecha de inicio no puede ser posterior a la fecha de fin.");
            setIsModalVisible(true);
            return;
        }

        // --- 1. Filter by Date Range ---
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Normalize start date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Normalize end date to include the whole day

        // *** CRITICAL: Adjust 'expense.registrationDate' if your date field is named differently ***
        const filtered = allExpenses.filter(exp => {
            try {
                const expenseDate = new Date(exp.registrationDate);
                // Basic check if date is valid before comparison
                if (isNaN(expenseDate.getTime())) {
                    console.warn(`Invalid date found for expense ID ${exp.idOverallMonth || 'N/A'}:`, exp.registrationDate);
                    return false;
                }
                return expenseDate >= start && expenseDate <= end;
            } catch (e) {
                console.error("Error parsing date:", exp.registrationDate, e);
                return false; // Exclude if date parsing fails
            }
        });

        // --- Additional filter by search term if provided ---
        const searchFiltered = searchTerm 
            ? filtered.filter(exp => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    (exp.description && exp.description.toLowerCase().includes(searchLower)) || 
                    (exp.expenseType?.expenseTypeName && exp.expenseType.expenseTypeName.toLowerCase().includes(searchLower))
                );
            }) 
            : filtered;

        setFilteredExpenses(searchFiltered);

        if (searchFiltered.length === 0) {
            setModalMessage("No se encontraron gastos para los criterios seleccionados.");
            setIsModalVisible(true);
            // Keep showResults false
            return; // Stop processing if no data
        }

        // --- 2. Aggregate Data for Charts ---
        let totalInRange = 0;
        const aggregationByType = {};
        const aggregationByTime = {};

        searchFiltered.forEach(exp => {
            // *** Adjust 'exp.totalAmount' if amount field is different ***
            const amount = Number(exp.totalAmount) || 0;
            totalInRange += amount;

            // Aggregate by Type (for Money and Percentage charts)
            // *** Adjust 'exp.expenseType.expenseTypeName' if type field is different ***
            const typeName = exp.expenseType?.expenseTypeName || 'Sin Tipo';
            aggregationByType[typeName] = (aggregationByType[typeName] || 0) + amount;

            // Aggregate by Time (Date)
            // *** Adjust 'exp.registrationDate' if date field is different ***
            const dateKey = formatDateKey(exp.registrationDate);
            if(dateKey) { // Ensure dateKey is valid
                aggregationByTime[dateKey] = (aggregationByTime[dateKey] || 0) + amount;
            }
        });

        // --- 3. Format Data for Recharts ---
        const chartByTypeAmount = Object.entries(aggregationByType).map(([name, value]) => ({ name, value }));
        const chartByTime = Object.entries(aggregationByTime)
                                .map(([date, total]) => ({ date, total }))
                                .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
        const chartByTypePercentage = chartByTypeAmount.map(item => ({
            name: item.name,
            value: totalInRange > 0 ? parseFloat(((item.value / totalInRange) * 100).toFixed(2)) : 0,
        }));

        setChartData({
            byTypeAmount: chartByTypeAmount,
            byTime: chartByTime,
            byTypePercentage: chartByTypePercentage,
            totalInRange: totalInRange,
        });

        setShowResults(true); // Show results area now

    }, [startDate, endDate, searchTerm]); // Added searchTerm as dependency

    const handleSearch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setShowResults(false); // Hide previous results

        if (!startDate || !endDate) {
            setModalMessage("Por favor, seleccione las fechas de inicio y fin.");
            setIsModalVisible(true);
            setIsLoading(false);
            return;
        }
        if (startDate > endDate) {
            setModalMessage("La fecha de inicio no puede ser posterior a la fecha de fin.");
            setIsModalVisible(true);
            setIsLoading(false);
            return;
        }

        try {
            const allExpenses = await MonthlyOverallExpenseService.getAllMonthlyOverallExpenses();
            console.log("Raw data from service:", allExpenses);
            processData(allExpenses); // Process the fetched data
        } catch (err) {
            console.error("Error fetching monthly expenses:", err);
            setError(err.message || "Error al cargar los datos. Verifique la conexión.");
            setFilteredExpenses([]);
            setChartData({ byTypeAmount: [], byTime: [], byTypePercentage: [], totalInRange: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, processData]); // Include processData in dependencies

    const handleOk = () => setIsModalVisible(false);
    const handleCancel = () => setIsModalVisible(false);
    const handleBack = () => navigate(-1);

    // --- Render Functions ---
    const renderCharts = () => (
        <Col md={4} className="graphs-column">
            {/* Chart 1: Dinero (Amount by Type) */}
            <Card className="mb-3">
                <CardHeader>Gastos por Tipo (Monto)</CardHeader>
                <CardBody>
                    {chartData.byTypeAmount.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData.byTypeAmount} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                {/* <Legend /> */}
                                <Bar dataKey="value" fill="#8884d8">
                                    {chartData.byTypeAmount.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-muted">No hay datos para mostrar.</p>}
                </CardBody>
            </Card>

            {/* Chart 2: Tiempo (Amount over Time) */}
            <Card className="mb-3">
                <CardHeader>Gastos a lo largo del Tiempo</CardHeader>
                <CardBody>
                    {chartData.byTime.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            {/* Use LineChart for trends, BarChart for discrete daily totals */}
                            <LineChart data={chartData.byTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                <Legend />
                                <Line type="monotone" dataKey="total" stroke="#82ca9d" activeDot={{ r: 8 }} name="Gasto Diario"/>
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-muted">No hay datos para mostrar.</p>}
                </CardBody>
            </Card>

            {/* Chart 3: Porcentajes (Percentage by Type) */}
            <Card>
                <CardHeader>Distribución Porcentual por Tipo</CardHeader>
                <CardBody>
                    {chartData.byTypePercentage.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={chartData.byTypePercentage}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${percent.toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {chartData.byTypePercentage.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                                {/* <Legend /> */} {/* Legend might be redundant with labels */}
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-muted">No hay datos para mostrar.</p>}
                </CardBody>
            </Card>
        </Col>
    );

    const renderTable = () => (
        <Col md={8} className="results-column">
            <Card>
                <CardHeader>
                    Detalle de Gastos ({formatDateKey(startDate)} - {formatDateKey(endDate)})
                    <span className='float-end'>Total: <strong>${chartData.totalInRange.toFixed(2)}</strong></span>
                </CardHeader>
                <CardBody>
                    {filteredExpenses.length > 0 ? (
                        <div style={{maxHeight: '700px', overflowY: 'auto'}}> {/* Add scroll for long tables */}
                            <Table hover responsive size="sm">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo Gasto</th>
                                        <th>Descripción</th>
                                        <th>Monto</th>
                                        {/* Add other relevant columns */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses
                                        // Optional: sort by date within the table as well
                                        .sort((a, b) => new Date(a.registrationDate) - new Date(b.registrationDate))
                                        .map((expense, index) => (
                                        <tr key={expense.idOverallMonth || index}>
                                            {/* *** Adjust property access *** */}
                                            <td>{expense.registrationDate ? new Date(expense.registrationDate).toLocaleDateString() : 'N/A'}</td>
                                            <td>{expense.expenseType?.expenseTypeName || 'N/A'}</td>
                                            <td>{expense.description || '-'}</td>
                                            <td>${(Number(expense.totalAmount) || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        // This case should ideally be handled by the initial check/modal
                        <p className="text-center text-muted">No hay registros detallados para este rango.</p>
                    )}
                </CardBody>
            </Card>
        </Col>
    );

    return (
        <Container fluid className="p-4">
            <Row className="mb-3 align-items-center">
                <Col md="auto">
                    <h2>Dashboard de Gastos por Fecha</h2>
                </Col>
                <Col md="auto" className="ms-md-auto">
                    <Button color="secondary" onClick={handleBack}>Volver</Button>
                </Col>
            </Row>

            {/* --- Filters --- */}
            <Row className="mb-4 p-3 bg-light border rounded align-items-end">
                <Col md={3}>
                    <FormGroup>
                        <label htmlFor="startDate">Desde:</label>
                        <DatePicker
                            id="startDate"
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="form-control form-control-sm" // Use sm for consistency
                            placeholderText="Fecha de inicio"
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                        />
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <label htmlFor="endDate">Hasta:</label>
                        <DatePicker
                            id="endDate"
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="form-control form-control-sm"
                            placeholderText="Fecha de fin"
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate} // Prevent end date before start date
                        />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <FormGroup>
                        <label htmlFor="searchTerm">Buscar:</label>
                        <InputGroup size="sm">
                            <Input
                                id="searchTerm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar en descripción o tipo..."
                            />
                        </InputGroup>
                    </FormGroup>
                </Col>
                <Col md={2}>
                    <Button color="primary" onClick={handleSearch} disabled={isLoading} className="w-100">
                        {isLoading ? <Spinner size="sm" /> : 'Buscar'}
                    </Button>
                </Col>
            </Row>

            {/* --- Loading / Error --- */}
            {isLoading && (
                <div className="text-center p-5">
                    <Spinner color="primary">Cargando...</Spinner>
                    <p>Consultando gastos...</p>
                </div>
            )}
            {error && !isLoading && <Alert color="danger">Error: {error}</Alert>}

            {/* --- Results Area --- */}
            {!isLoading && !error && showResults && (
                <Row className="results-graphs-container">
                    {renderTable()}
                    {renderCharts()}
                </Row>
            )}
            {!isLoading && !error && !showResults && (
                // Optional: Show a placeholder message if nothing has been searched yet
                <Alert color="info">
                    Seleccione un rango de fechas y {searchTerm ? 'criterios de búsqueda ' : ''}haga clic en Buscar para ver los datos.
                </Alert>
            )}

            {/* --- Modal --- */}
            <Modal isOpen={isModalVisible} toggle={handleCancel} centered>
                <ModalHeader toggle={handleCancel}>Información</ModalHeader>
                <ModalBody>{modalMessage}</ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleOk}>Aceptar</Button>
                </ModalFooter>
            </Modal>
        </Container>
    );
};

export default ExpenseDashboardByDate;