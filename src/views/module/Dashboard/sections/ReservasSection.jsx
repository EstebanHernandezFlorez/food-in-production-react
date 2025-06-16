// RUTA: src/views/Dashboard/sections/ReservasSection.jsx

import React, { useCallback, useMemo } from 'react';
import { Calendar, Users, Award, Star, UserCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Importaciones de servicios
import { useDashboardSection } from '../hooks/useDashboardSection';
import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { formatNumber } from '../utils/formatters';
import reservasService from '../../../services/reservasService';
import clientesService from '../../../services/clientesService';

const ReservasSection = ({ selectedYear, selectedMonth }) => {
  const fetchReservasData = useCallback(async () => {
    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(selectedMonth);

    const [allReservations, allClientes] = await Promise.all([
      reservasService.getAllReservations(),
      clientesService.getAllClientes(),
    ]);

    // --- Filtrar reservas del mes y año seleccionados ---
    const reservasMesActual = allReservations.filter(res => {
        const resDate = new Date(res.dateTime);
        return resDate.getFullYear() === yearNum && (resDate.getMonth() + 1) === monthNum;
    });

    // --- KPI 1: Total de Reservas en el Mes ---
    const totalReservasMes = reservasMesActual.length;

    // --- KPI 2: Promedio de Personas por Reserva ---
    const totalPersonasMes = reservasMesActual.reduce((sum, res) => sum + (Number(res.numberPeople) || 0), 0);
    const promedioPersonasPorReserva = totalReservasMes > 0 ? totalPersonasMes / totalReservasMes : 0;

    // --- KPI 3 y Tabla: Clientes Destacados con Reservas ---
    const clienteReservasCount = allReservations.reduce((acc, res) => {
      // Usamos el ID del cliente que viene en la reserva
      const customerId = res.idCustomers;
      if (customerId) {
        acc[customerId] = (acc[customerId] || 0) + 1;
      }
      return acc;
    }, {});
    
    const clientesDestacados = allClientes
      .filter(cliente => cliente.Distintivo && clienteReservasCount[cliente.id] > 0)
      .map(cliente => ({
        clienteNombre: cliente.NombreCompleto,
        distintivo: cliente.Distintivo,
        numReservas: clienteReservasCount[cliente.id] || 0,
      }))
      .sort((a, b) => b.numReservas - a.numReservas)
      .slice(0, 10);
    
    const clientesVipConReservas = clientesDestacados.filter(c => c.distintivo?.toLowerCase() === 'vip').length;

    // --- KPI 4: Próxima Reserva Importante ---
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Ignorar la hora para la comparación
    const proximasReservas = allReservations
      .filter(res => {
          const resDate = new Date(res.dateTime);
          // Filtrar reservas que son hoy o en el futuro y no están 'anulada' o 'terminada'
          return resDate >= hoy && !['anulada', 'terminada'].includes(res.status?.toLowerCase());
      })
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)); // Ordenar por fecha más cercana

    let proximaReservaImportante = "Ninguna Próxima";
    if (proximasReservas.length > 0) {
        const proxima = proximasReservas[0];
        const fechaProxima = new Date(proxima.dateTime);
        const opcionesFecha = { weekday: 'long', month: 'long', day: 'numeric' };
        proximaReservaImportante = fechaProxima.toLocaleDateString('es-ES', opcionesFecha);
    }
    
    // --- Gráfico: Reservas y Personas por Día ---
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const reservasPorDiaData = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `Día ${i + 1}`,
      'Nº Reservas': 0,
      'Nº Personas': 0,
    }));

    reservasMesActual.forEach(res => {
        const dayOfMonth = new Date(res.dateTime).getDate();
        if (reservasPorDiaData[dayOfMonth - 1]) {
            reservasPorDiaData[dayOfMonth - 1]['Nº Reservas']++;
            reservasPorDiaData[dayOfMonth - 1]['Nº Personas'] += Number(res.numberPeople) || 0;
        }
    });

    return {
      totalReservasMes,
      promedioPersonasPorReserva,
      clientesVipConReservas,
      proximaReservaImportante,
      reservasPorDiaData,
      clientesDestacados,
    };
  }, [selectedYear, selectedMonth]);

  const { data: reservasData, isLoading, error } = useDashboardSection(fetchReservasData, [selectedYear, selectedMonth]);

  if (isLoading) return <div className="loading-state-finance"><Calendar size={32} className="lucide-spin" /><p>Cargando Reservas...</p></div>;
  if (error || !reservasData) return <div className="error-state-finance">{error || "No hay datos disponibles para reservas."}</div>;
  
  return (
    <div className="animate-fadeIn">
      <div className="kpi-grid-finance">
        <StatCard title="Reservas Este Mes" value={formatNumber(reservasData.totalReservasMes)} icon={Calendar} />
        <StatCard title="Prom. Personas/Reserva" value={reservasData.promedioPersonasPorReserva.toFixed(1)} icon={Users}/>
        <StatCard title="Clientes VIP con Reservas" value={formatNumber(reservasData.clientesVipConReservas)} icon={Award}/>
        <StatCard title="Próxima Reserva" value={reservasData.proximaReservaImportante} icon={Star}/>
      </div>

      <div className="charts-section-finance" style={{gap: '1.5rem'}}>
        <div className="content-card-finance">
          <h3 className="card-title-main">Reservas y Personas por Día del Mes</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reservasData.reservasPorDiaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize: 11}} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" allowDecimals={false} label={{ value: 'Nº Personas', angle: -90, position: 'insideLeft' }}/>
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" allowDecimals={false} label={{ value: 'Nº Reservas', angle: -90, position: 'insideRight' }}/>
                <Tooltip formatter={(value, name) => [formatNumber(value), name]}/>
                <Legend />
                <Bar yAxisId="left" dataKey="Nº Personas" fill="#8884d8" name="Total Personas" />
                <Bar yAxisId="right" dataKey="Nº Reservas" fill="#82ca9d" name="Total Reservas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="content-card-finance">
          <h3 className="card-title-main">Top Clientes con Reservas</h3>
          {reservasData.clientesDestacados.length > 0 ? (
            <div className="table-responsive">
              <table className="dashboard-table-finance">
                <thead><tr><th>Cliente</th><th>Distintivo</th><th>Total Reservas</th></tr></thead>
                <tbody>
                  {reservasData.clientesDestacados.map((cliente, index) => (
                    <tr key={index}>
                      <td>{cliente.clienteNombre}</td>
                      <td><span className={`badge-distintivo ${cliente.distintivo?.toLowerCase()}`}>{cliente.distintivo || 'N/A'}</span></td>
                      <td style={{textAlign: 'center'}}>{formatNumber(cliente.numReservas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <ChartPlaceholder text="No hay clientes destacados con reservas." icon={UserCheck}/>}
        </div>
      </div>
    </div>
  );
};

export default ReservasSection;