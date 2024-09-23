import React, { useState } from 'react';
import { Container, FormGroup, Input, Button, Table, Row, Col, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { IoSearchOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

const RendimientoEmpleado = () => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [searchText, setSearchText] = useState(''); // For "Buscar insumo"
    const [searchEmpleado, setSearchEmpleado] = useState(''); // For "Buscar empleado"
    const [showResults, setShowResults] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const navigate = useNavigate();
  
    // Sample data for the charts and table
    const data = [
        { name: 'Enero', porcentaje: 40, gramos: 200, dinero: 300 },
        { name: 'Febrero', porcentaje: 30, gramos: 150, dinero: 250 },
        { name: 'Marzo', porcentaje: 50, gramos: 250, dinero: 400 },
        { name: 'Abril', porcentaje: 60, gramos: 300, dinero: 500 }
    ];
  
    // Example table data with employee and insumo IDs
    const tableData = [
        {
            empleadoId: 1,
            insumoId: 1,
            pesoInicial: 500,
            pesoFinal: 450,
            porcionesIniciales: 100,
            porcionesFinales: 80,
            ajustamiento: 20,
            porcentaje: ((100 - (80 / 100 * 100)).toFixed(2)),
            dinero: (20 * 5) 
        },
        {
            empleadoId: 2,
            insumoId: 2,
            pesoInicial: 600,
            pesoFinal: 580,
            porcionesIniciales: 120,
            porcionesFinales: 100,
            ajustamiento: 20,
            porcentaje: ((100 - (100 / 120 * 100)).toFixed(2)),
            dinero: (20 * 5) 
        }
    ];

    const handleClick = () => {
        navigate('/mano_de_obra');
    };
  
    // Filtra los datos por empleado e insumo
    const filteredData = tableData.filter(row => {
        const inDateRange = startDate && endDate ? 
            (new Date(row.fecha) >= startDate && new Date(row.fecha) <= endDate) :
            true;
        // Removed insumo and empleado matching since data is static
        return inDateRange;
    });
  
    const groupedData = filteredData.reduce((acc, row) => {
        const empleado = `Empleado ${row.empleadoId}`; // Placeholder for empleado name
        if (!acc[empleado]) {
            acc[empleado] = [];
        }
        acc[empleado].push({
            ...row,
            insumo: `Insumo ${row.insumoId}` // Placeholder for insumo name
        });
        return acc;
    }, {});
  
    const handleSearch = () => {
        // Verifica si se ha ingresado al menos un criterio de búsqueda
        if (!searchText && !searchEmpleado) {
            setModalMessage("Por favor, ingrese al menos un criterio de búsqueda (insumo o empleado).");
            setIsModalVisible(true);
            setShowResults(false);
            return;
        }
  
        // Verifica si hay resultados después del filtrado
        if (filteredData.length === 0) {
            setModalMessage("No se encontraron resultados con los criterios de búsqueda.");
            setIsModalVisible(true);
            setShowResults(false);
        } else {
            setShowResults(true);
        }
    };
  
    const handleOk = () => {
        setIsModalVisible(false);
    };
  
    const handleCancel = () => {
        setIsModalVisible(false);
    };
  
    const handleBack = () => {
        navigate(-1); // Redirecciona a la página anterior
    };
  
    return (
        <Container>
            <h2>Rendimiento de Empleados</h2>
            <Row className="mb-3">
                <Col md={3}>
                    <label htmlFor="startDate">Desde:</label>
                    <FormGroup>
                        <DatePicker
                            id="startDate"
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="form-control form-control-sm date-picker"
                            placeholderText="Fecha de inicio"
                        />
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <label htmlFor="endDate">Hasta:</label>
                    <FormGroup>
                        <DatePicker
                            id="endDate"
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="form-control form-control-sm date-picker"
                            placeholderText="Fecha de fin"
                        />
                    </FormGroup>
                </Col>
  
                <Col md={6} className="d-flex align-items-center">
                    <FormGroup className="me-2"> 
                        <label>Buscar insumo:</label>
                        <Input
                            type="text"
                            placeholder="Buscar insumo"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="form-control form-control-sm"
                        />
                    </FormGroup>
                    <FormGroup className="me-2"> 
                        <label>Buscar Empleado:</label>
                        <Input
                            type="text"
                            placeholder="Buscar empleado"
                            value={searchEmpleado}
                            onChange={(e) => setSearchEmpleado(e.target.value)}
                            className="form-control form-control-sm"
                        />
                    </FormGroup>
                    <Button
                        onClick={handleSearch}
                        className="btn-icon"
                        style={{
                            backgroundColor: '#8C1616',
                            boxShadow: 'none',
                            border: '1px solid transparent',
                        }}
                    >
                        <IoSearchOutline style={{ color: 'white' }} />
                    </Button>
                </Col>
            </Row>
  
            <Row className="results-graphs-container">
                <Col md={8} className="results-column">
                    {showResults && Object.keys(groupedData).map((empleado, index) => (
                        <div key={index} className="mt-4">
                            <h3>Datos de {empleado}</h3>
                            <Table className="table table-sm table-hover">
                                <thead>
                                    <tr>
                                        <th>Insumo</th>
                                        <th>Peso Inicial</th>
                                        <th>Peso Final</th>
                                        <th>Porciones Iniciales</th>
                                        <th>Porciones Finales</th>
                                        <th>Ajustamiento (gramos)</th>
                                        <th>Porcentaje</th>
                                        <th>Dinero</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedData[empleado].map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            <td>{row.insumo}</td>
                                            <td>{row.pesoInicial}</td>
                                            <td>{row.pesoFinal}</td>
                                            <td>{row.porcionesIniciales}</td>
                                            <td>{row.porcionesFinales}</td>
                                            <td>{row.ajustamiento}g</td>
                                            <td>{row.porcentaje}%</td>
                                            <td>${row.dinero}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ))}
                </Col>
  
          <Col md={4} className="graphs-column">
            <h4>Gastos en Porcentajes</h4>
            <BarChart width={300} height={200} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="porcentaje" fill="#8884d8" />
            </BarChart>
  
            <h4>Gastos en Gramos</h4>
            <BarChart width={300} height={200} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="gramos" fill="#82ca9d" />
            </BarChart>
  
            <h4>Gastos en Dinero</h4>
            <BarChart width={300} height={200} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="dinero" fill="#ff7300" />
            </BarChart>
          </Col>
        </Row>
  
        {/* Modal de confirmación */}
        <Modal
          isOpen={isModalVisible}
          toggle={handleCancel}
          className="modal-dialog-centered"
        >
          <ModalHeader toggle={handleCancel}>Confirmación</ModalHeader>
          <ModalBody>
            <p>{modalMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={handleOk}>Sí</Button>
            <Button color="secondary" onClick={handleCancel}>No</Button>
            <Button color="secondary" onClick={handleBack}>Volver</Button>
          </ModalFooter>
        </Modal>
        <Button onClick={handleClick}>
          Volver
        </Button>
      </Container>
    );
};
  
export default RendimientoEmpleado;
