// src/views/module/Dashboard/ReservasSection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar, Users, BarChart2, PieChart as LucidePieChart, Award } from 'lucide-react';
import StatCardFinance from './StatCardFinance';
import ChartPlaceholder from './ChartPlaceholder';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

import reservasService from '../../services/reservasService'; // Ajusta ruta!
import clientesService from '../../services/clientesService'; // Ajusta ruta!

const ReservasSection = ({ selectedYear, selectedMonth }) => {
  const [reservasData, setReservasData] = useState({
    reservasMesActualPorDia: [], // [{ day: 1, count: 5 }, { day: 2, count: 8 }, ...]
    comparacionMeses: [], // [{ month: 'Ene', count: 50 }, { month: 'Feb', count: 60 }, ...]
    clientesDistintivosConMultiplesReservas: [], // [{ clienteNombre: 'Cliente VIP', distintivo: 'VIP', numReservas: 5 }, ...]
    totalReservasMes: 0,
    promedioPersonasPorReserva: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatNumber = (value) => value != null ? Number(value).toLocaleString('es-CO') : '0';

  const availableMonths = useMemo(() => [ // Necesario para nombres de meses
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' }
  ], []);


  useEffect(() => {
    const fetchReservasData = async () => {
      setIsLoading(true);
      setError(null);
      console.log(`[ReservasSection] Fetching data for ${selectedYear}-${selectedMonth}`);
      try {
        const allReservationsResult = await reservasService.getAllReservations().catch(err => { console.error("Error all reservations:", err); return []; });
        const allClientesResult = await clientesService.getAllClientes().catch(err => { console.error("Error all clientes:", err); return []; });

        const allReservations = Array.isArray(allReservationsResult) ? allReservationsResult : [];
        const allClientes = Array.isArray(allClientesResult) ? allClientesResult : [];

        // 1. Gráfica de reservas del último mes por día
        const yearNum = parseInt(selectedYear);
        const monthNum = parseInt(selectedMonth);
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        const reservasMesActualPorDia = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, count: 0 }));

        allReservations.forEach(res => {
          const resDate = new Date(res.dateTime);
          if (resDate.getFullYear() === yearNum && (resDate.getMonth() + 1) === monthNum) {
            const dayOfMonth = resDate.getDate();
            const targetDay = reservasMesActualPorDia.find(d => d.day === dayOfMonth);
            if (targetDay) {
              targetDay.count++;
            }
          }
        });
        const totalReservasMes = reservasMesActualPorDia.reduce((sum, day) => sum + day.count, 0);
        const totalPersonasMes = allReservations
            .filter(res => {
                const resDate = new Date(res.dateTime);
                return resDate.getFullYear() === yearNum && (resDate.getMonth() + 1) === monthNum;
            })
            .reduce((sum, res) => sum + (Number(res.numberPeople) || 0), 0);


        // 2. Comparación de reservas en diferentes meses (últimos 6 meses incluyendo el actual)
        const comparacionMeses = [];
        for (let i = 0; i < 6; i++) {
          let loopMonth = monthNum - i;
          let loopYear = yearNum;
          if (loopMonth <= 0) {
            loopMonth += 12;
            loopYear -= 1;
          }
          const count = allReservations.filter(res => {
            const resDate = new Date(res.dateTime);
            return resDate.getFullYear() === loopYear && (resDate.getMonth() + 1) === loopMonth;
          }).length;
          comparacionMeses.unshift({ month: availableMonths.find(m => m.value === loopMonth)?.label || '??', count });
        }

        // 3. Clientes con distintivos que han reservado varias veces (ej: > 2 veces en total)
        const clienteReservasCount = {};
        allReservations.forEach(res => {
          clienteReservasCount[res.idCustomers] = (clienteReservasCount[res.idCustomers] || 0) + 1;
        });

        const clientesDistintivosConMultiplesReservas = allClientes
          .filter(cliente => cliente.Distintivo && clienteReservasCount[cliente.id] > 1) // Cliente tiene distintivo y más de 1 reserva
          .map(cliente => ({
            clienteNombre: cliente.NombreCompleto,
            distintivo: cliente.Distintivo,
            numReservas: clienteReservasCount[cliente.id]
          }))
          .sort((a, b) => b.numReservas - a.numReservas) // Ordenar por más reservas
          .slice(0, 10); // Tomar top 10 por ejemplo

        setReservasData({
          reservasMesActualPorDia,
          comparacionMeses,
          clientesDistintivosConMultiplesReservas,
          totalReservasMes,
          promedioPersonasPorReserva: totalReservasMes > 0 ? totalPersonasMes / totalReservasMes : 0,
        });

      } catch (err) {
        console.error("Critical error fetching reservas data:", err);
        setError(err.message || "Error al cargar datos de reservas.");
      } finally {
        setIsLoading(false);
      }
    };
    if (selectedYear && selectedMonth) {
        fetchReservasData();
    }
  }, [selectedYear, selectedMonth, availableMonths]);

  if (isLoading) {
    return (
      <div className="flup-content-loading-state">
        <Clock size={32} className="animate-spin-slow" />
        <p>Cargando Reservas...</p>
      </div>
    );
  }

  if (error || !reservasData) {
    return <div className="flup-content-error-state">{error || "No hay datos disponibles para reservas."}</div>;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flup-kpi-grid">
        <StatCardFinance title="Reservas Este Mes" value={formatNumber(reservasData.totalReservasMes)} icon={Calendar} />
        <StatCardFinance title="Prom. Personas/Reserva" value={reservasData.promedioPersonasPorReserva.toFixed(1)} icon={Users}/>
        {/* Aquí podrías añadir más KPIs, por ejemplo, % de ocupación si tuvieras ese dato */}
        <StatCardFinance title="Clientes VIP con Reservas" value={formatNumber(reservasData.clientesDistintivosConMultiplesReservas.filter(c => c.distintivo?.toLowerCase() === 'vip').length)} icon={Award}/>
        <StatCardFinance title="Próxima Reserva Importante" value={"Mañana - Boda X"} icon={Calendar}/>

      </div>
      <div className="flup-charts-section">
        <div className="flup-chart-container">
          <h3 className="chart-title">Reservas por Día (Mes Actual: {availableMonths.find(m=>m.value === parseInt(selectedMonth))?.label} {selectedYear})</h3>
          {reservasData.reservasMesActualPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reservasData.reservasMesActualPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: "Día del Mes", position: "insideBottom", offset: -5, fontSize: 12 }} tick={{fontSize: 11}}/>
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Nº Reservas" fill="#8884d8" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartPlaceholder text="No hay datos de reservas para este mes." />}
        </div>
        <div className="flup-chart-container">
          <h3 className="chart-title">Comparativo Reservas Mensuales (Últimos 6 Meses)</h3>
          {reservasData.comparacionMeses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reservasData.comparacionMeses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 11}} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Nº Reservas" fill="#82ca9d" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartPlaceholder text="No hay datos para comparar reservas." />}
        </div>
      </div>
      <div className="flup-content-card mt-4"> {/* Usando una clase de card general */}
        <h3 className="card-title-main">Clientes con Múltiples Reservas y Distintivo (Top 10)</h3>
        {reservasData.clientesDistintivosConMultiplesReservas.length > 0 ? (
          <div className="table-responsive">
            <table className="dashboard-table-finance"> {/* Necesitarás estilos para esta tabla */}
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Distintivo</th>
                  <th>Nº Reservas</th>
                </tr>
              </thead>
              <tbody>
                {reservasData.clientesDistintivosConMultiplesReservas.map((cliente, index) => (
                  <tr key={index}>
                    <td>{cliente.clienteNombre}</td>
                    <td><span className={`badge-distintivo ${cliente.distintivo?.toLowerCase()}`}>{cliente.distintivo || 'N/A'}</span></td>
                    <td style={{textAlign: 'center'}}>{cliente.numReservas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-center p-3">No hay clientes destacados con múltiples reservas para mostrar.</p>
        )}
      </div>
    </div>
  );
};

export default ReservasSection;