import React, { Component } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

// Datos de ejemplo
const data = [
  { name: 'Jan', uv: 4000, pv: 2400, amt: 2400, purchases: 2000 },
  { name: 'Feb', uv: 3000, pv: 1398, amt: 2210, purchases: 1500 },
  { name: 'Mar', uv: 2000, pv: 9800, amt: 2290, purchases: 1700 },
  { name: 'Apr', uv: 2780, pv: 3908, amt: 2000, purchases: 1900 },
  { name: 'May', uv: 1890, pv: 4800, amt: 2181, purchases: 2100 },
  { name: 'Jun', uv: 2390, pv: 3800, amt: 2500, purchases: 2300 },
  { name: 'Jul', uv: 3490, pv: 4300, amt: 2100, purchases: 2500 },
];

export default class Dashboard extends Component {
  state = {
    selectedCategory: 'Financiero',
    selectedYear: '2024',
    selectedMonth: 'January',
  };

  handleCategoryChange = (e) => {
    this.setState({ selectedCategory: e.target.value });
  };

  handleYearChange = (e) => {
    this.setState({ selectedYear: e.target.value });
  };

  handleMonthChange = (e) => {
    this.setState({ selectedMonth: e.target.value });
  };

  getPurchaseStats = () => {
    const { selectedMonth } = this.state;
    const filteredData = data.filter(item => item.name === selectedMonth);

    const maxPurchase = Math.max(...data.map(item => item.purchases));
    const minPurchase = Math.min(...data.map(item => item.purchases));
    const monthPurchase = filteredData.length ? filteredData[0].purchases : 0;

    return {
      maxPurchase,
      minPurchase,
      monthPurchase,
    };
  };

  getContent = () => {
    const { selectedCategory } = this.state;
    const { maxPurchase, minPurchase, monthPurchase } = this.getPurchaseStats();

    switch (selectedCategory) {
      case 'Proveedor':
        return (
          <>
            <div style={boxStyle}>
              <h3>Mayor compra al año</h3>
              <p>${maxPurchase}</p>
            </div>
            <div style={boxStyle}>
              <h3>Menor compra en el mes</h3>
              <p>${minPurchase}</p>
            </div>
            <div style={boxStyle}>
              <h3>Compra en el mes seleccionado</h3>
              <p>${monthPurchase}</p>
            </div>
          </>
        );
      case 'Eficiencia del empleado':
        // Puedes agregar contenido específico para esta categoría aquí
        return <div style={boxStyle}><h3>Datos de eficiencia del empleado</h3></div>;
      case 'Ventas totales del periodo':
        // Puedes agregar contenido específico para esta categoría aquí
        return <div style={boxStyle}><h3>Datos de ventas totales</h3></div>;
      case 'Financiero':
      default:
        // Puedes agregar contenido específico para esta categoría aquí
        return <div style={boxStyle}><h3>Datos financieros</h3></div>;
    }
  };

  render() {
    const { selectedCategory, selectedYear, selectedMonth } = this.state;

    return (
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <div style={{ flex: 6, marginRight: '10px' }}>
          {/* Botones grandes */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-around'}}>
            {['Financiero', 'Eficiencia del empleado', 'Proveedor', 'Ventas totales del periodo'].map(category => (
                <button
                key={category}
                style={{
                    padding: '15px 30px',
                    fontSize: '16px',
                    backgroundColor: selectedCategory === category ? '#8C1616' : '#f0f0f0',
                    color: selectedCategory === category ? '#fff' : '#000',
                    border: '2px solid black',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    margin: '0 30px', // Ajusta el margen aquí
                }}
                value={category}
                onClick={this.handleCategoryChange}
                >
                {category}
                </button>
            ))}
            </div>


          {/* Selectores */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={selectedYear}
                onChange={this.handleYearChange}
                style={selectStyle}
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                {/* Añade más opciones según necesites */}
              </select>

              <select
                value={selectedMonth}
                onChange={this.handleMonthChange}
                style={selectStyle}
              >
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                {/* Añade más opciones según necesites */}
              </select>

              <select
                style={selectStyle}
              >
                <option value={selectedCategory}>{selectedCategory}</option>
                {/* Podrías agregar más opciones dependiendo del campo seleccionado */}
              </select>
            </div>
          </div>

          {/* Gráficas */}
          <div style={{ margin: '20px 0' }}>
            <h2>Bar Chart</h2>
            <BarChart width={600} height={300} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="uv" fill="#8884d8" />
              <Bar dataKey="pv" fill="#82ca9d" />
            </BarChart>
          </div>

          <div style={{ margin: '20px 0' }}>
            <h2>Line Chart</h2>
            <LineChart width={600} height={300} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="uv" stroke="#8884d8" />
              <Line type="monotone" dataKey="pv" stroke="#82ca9d" />
            </LineChart>
          </div>
        </div>

        {/* Contenedores pequeños */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {this.getContent()}
        </div>
      </div>
    );
  }
}

// Estilos adicionales para los selectores y contenedores
const selectStyle = {
  padding: '10px',
  fontSize: '14px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  width: '150px',
};

const boxStyle = {
  padding: '10px',
  backgroundColor: '#f0f0f0',
  borderRadius: '5px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  textAlign: 'center',
  marginBottom: '10px'
};
