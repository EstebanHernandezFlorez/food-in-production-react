// RUTA: src/views/Dashboard/sections/ProduccionSection.jsx

import React, { useCallback } from 'react';
import { Factory, CheckCircle, Users, TrendingUp, Cpu, PieChart as PieChartIcon, Target } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell,
    PieChart,
    Pie,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    LabelList, // <-- ¡NUEVA IMPORTACIÓN para las etiquetas en las barras!
} from 'recharts';

import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { useDashboardSection } from '../hooks/useDashboardSection';
import { formatNumber, getRandomColor } from '../utils/formatters';
import productionOrderService from '../../../services/productionOrderService';
import empleadoService from '../../../services/empleadoService';

const ProduccionSection = ({ selectedYear, selectedMonth }) => {
    const fetchData = useCallback(async () => {
        const yearNum = parseInt(selectedYear);
        const monthNum = parseInt(selectedMonth);

        const [allOrders, allEmployees] = await Promise.all([
            productionOrderService.getAllProductionOrders({ limit: 1000 }),
            empleadoService.getAllEmpleados(),
        ]);
        
        const activeStatuses = ['IN_PROGRESS', 'SETUP', 'SETUP_COMPLETED', 'PAUSED', 'ALL_STEPS_COMPLETED'];
        const completedStatus = 'COMPLETED';
        
        const getWeekNumber = (d) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
            var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
            return weekNo;
        };
        const currentWeek = getWeekNumber(new Date());

        const ordersInMonth = allOrders.filter(o => {
            const date = new Date(o.createdAt || o.creationDate);
            return date.getFullYear() === yearNum && (date.getMonth() + 1) === monthNum;
        });

        const ordenesActivas = allOrders.filter(o => activeStatuses.includes(o.status)).length;
        const ordenesCompletadasMes = ordersInMonth.filter(o => o.status === completedStatus).length;
        
        const ordersInWeek = ordersInMonth.filter(o => getWeekNumber(new Date(o.createdAt || o.creationDate)) === currentWeek);
        const produccionMaxSemana = ordersInWeek.length > 0 ? Math.max(...ordersInWeek.map(o => Number(o.finalQuantityProduct) || 0)) : 0;
        
        const produccionPorProducto = ordersInMonth
            .filter(o => o.status === completedStatus)
            .reduce((acc, order) => {
                const name = order.productNameSnapshot || 'Producto Desconocido';
                acc[name] = (acc[name] || 0) + (Number(order.finalQuantityProduct) || 0);
                return acc;
            }, {});
        
        const productosChartData = Object.entries(produccionPorProducto)
            .map(([name, count], index) => ({ 
                name, 
                'Unidades Producidas': count,
                // ✅ Asignamos un color vivo y predecible a cada barra
                fill: `hsl(${200 + index * 25}, 80%, 60%)` 
            }))
            .sort((a, b) => b['Unidades Producidas'] - a['Unidades Producidas'])
            .slice(0, 10);
            
        const employeePerformance = allEmployees.map(employee => {
            const assignedSteps = allOrders.flatMap(order => 
                (order.productionOrderDetails || []).filter(step => step.employeeAssigned?.idEmployee === employee.idEmployee && step.status === 'COMPLETED')
            );
            const totalOrders = new Set(assignedSteps.map(step => step.idProductionOrder)).size;
            const totalStepsCompleted = assignedSteps.length;
            const totalTime = assignedSteps.reduce((sum, step) => {
                if (step.startDate && step.endDate) {
                    const timeDiff = (new Date(step.endDate) - new Date(step.startDate)) / (1000 * 60 * 60);
                    return sum + timeDiff;
                }
                return sum;
            }, 0);
            const efficiencyScore = totalTime > 0 ? (totalStepsCompleted / totalTime) : 0;
            return { subject: employee.fullName, A: totalOrders, B: totalStepsCompleted, C: parseFloat(efficiencyScore.toFixed(2)), fullMark: 5 };
        }).filter(emp => emp.A > 0);
        
        const statusCounts = allOrders.reduce((acc, order) => {
            const status = order.status || 'DESCONOCIDO';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        
        const statusChartData = Object.entries(statusCounts)
          .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, fill: getRandomColor() }));

        return {
            ordenesActivas,
            ordenesCompletadasMes,
            produccionMaxSemana,
            empleadosActivos: allEmployees.filter(e => e.status).length,
            productosChartData,
            employeePerformance,
            statusChartData,
        };
    }, [selectedYear, selectedMonth]);

    const { data, isLoading, error } = useDashboardSection(fetchData, [selectedYear, selectedMonth]);

    const {
        ordenesActivas = 0,
        ordenesCompletadasMes = 0,
        produccionMaxSemana = 0,
        empleadosActivos = 0,
        productosChartData = [],
        employeePerformance = [],
        statusChartData = [],
    } = data || {};

    if (isLoading) return <div className="loading-state-finance"><Factory size={32} className="lucide-spin" /><p>Cargando Datos de Producción...</p></div>;
    if (error) return <div className="error-state-finance">{error?.message || "No se pudieron cargar los datos de producción."}</div>;

    return (
        <div className="animate-fadeIn">
            <div className="kpi-grid-finance">
                <StatCard title="Órdenes Activas" value={formatNumber(ordenesActivas)} icon={Cpu} />
                <StatCard title="Completadas (Mes)" value={formatNumber(ordenesCompletadasMes)} icon={CheckCircle}/>
                <StatCard title="Empleados en Producción" value={formatNumber(empleadosActivos)} icon={Users} info="Total de empleados activos" />
                <StatCard title="Producción Máx. (Semana)" value={`${formatNumber(produccionMaxSemana)} uds.`} icon={TrendingUp} info="Lote más grande de la semana"/>
            </div>

            <div className="charts-section-finance" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem'}}>
                
                {/* ✅ --- GRÁFICO CON ESTILO "BAR RACE" ACTUALIZADO --- */}
                <div className="content-card-finance">
                    <h3 className="card-title-main">Productos Más Producidos (Mes Actual)</h3>
                    {productosChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={productosChartData} layout="vertical" margin={{ top: 5, right: 50, left: 100, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2}/>
                                <XAxis type="number" hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false}
                                    width={90}
                                    tick={{fontSize: 12, fill: '#333'}}
                                />
                                <Tooltip 
                                    cursor={{fill: 'rgba(230, 230, 230, 0.5)'}}
                                    formatter={(value) => [formatNumber(value), "Unidades"]}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Bar dataKey="Unidades Producidas" radius={[0, 5, 5, 0]} animationDuration={800}>
                                    {productosChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList 
                                        dataKey="Unidades Producidas" 
                                        position="right" 
                                        formatter={(value) => formatNumber(value)}
                                        style={{ fill: '#333', fontWeight: 'bold' }} 
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <ChartPlaceholder text="No hay productos completados este mes." icon={Factory}/>}
                </div>

                <div className="content-card-finance">
                    <h3 className="card-title-main">Estado General de Órdenes</h3>
                    {statusChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                                    {statusChartData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.fill} />))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <ChartPlaceholder text="No hay órdenes de producción." icon={PieChartIcon} />}
                </div>
            </div>

            <div className="content-card-finance" style={{ marginTop: '1.5rem' }}>
                <h3 className="card-title-main">Rendimiento por Empleado (Histórico)</h3>
                {employeePerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={employeePerformance}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{fontSize: 12}} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
                            <Tooltip />
                            <Legend />
                            <Radar name="Órdenes" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Radar name="Pasos" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                            <Radar name="Eficiencia (Pasos/hr)" dataKey="C" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : <ChartPlaceholder text="No hay datos de rendimiento de empleados." icon={Target}/>}
            </div>
        </div>
    );
};

export default ProduccionSection;