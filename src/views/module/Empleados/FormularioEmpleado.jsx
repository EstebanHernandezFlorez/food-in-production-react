import React, { useState } from 'react';
import { Container, Row, Col, FormGroup, Input, Button, Alert } from 'reactstrap';
import { useNavigate } from 'react-router-dom';

const FormularioEmpleado = () => {
  const [form, setForm] = useState({
    Nombre: '',
    Document: '',
    FechaIni: '',
    NumeroSS: '',
    Direccion: '',
    TipoContrato: '',
  });

  const [alert, setAlert] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const { Nombre, Document, FechaIni, NumeroSS, Direccion, TipoContrato } = form;

      if (Nombre.trim() === '' || Document.trim() === '' || FechaIni.trim() === '' || NumeroSS.trim() === '' || Direccion.trim() === '' || TipoContrato.trim() === '') {
        setAlert({ type: 'warning', message: "Por favor, ingrese todos los campos" });
        return;
      }

      // Verifica si el empleado ya existe (esto debe ser reemplazado por una llamada a la API real)
      const empleadoExistente = filteredData.find(registro => registro.Document.toString() === Document.toString());
      if (empleadoExistente) {
        setAlert({ type: 'error', message: "El empleado ya existe. Por favor, ingrese un documento de empleado diferente." });
        return;
      }

      const nuevoEmpleado = await response.json();
      setFilteredData([...filteredData, nuevoEmpleado]);
      setForm({
        Nombre: '',
        Document: '',
        FechaIni: '',
        NumeroSS: '',
        Direccion: '',
        TipoContrato: '',
      });
      setAlert({ type: 'success', message: "Empleado agregado exitosamente" });
    } catch (error) {
      setAlert({ type: 'error', message: `Error al insertar el empleado: ${error.message}` });
    }
  };

  const handleSearch = e => {
    const searchText = e.target.value.toLowerCase();
    setSearchText(searchText);
    setFilteredData(filteredData.filter(item =>
      item.Nombre.toLowerCase().includes(searchText) ||
      item.Document.toString().includes(searchText) ||
      item.FechaIni.toLowerCase().includes(searchText) ||
      item.NumeroSS.toLowerCase().includes(searchText)
    ));
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Input
          type="text"
          placeholder="Buscar empleado"
          value={searchText}
          onChange={handleSearch}
          style={{ width: '100%' }}
        />
      </div>

      <h2>Agregar Empleado</h2>
      {alert && <Alert color={alert.type}>{alert.message}</Alert>}
      <Row form>
        <Col md={4}>
          <FormGroup>
            <label>Nombre Completo:</label>
            <Input
              name="Nombre"
              type="text"
              onChange={handleChange}
              value={form.Nombre}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Documento:</label>
            <Input
              name="Document"
              type="text"
              onChange={handleChange}
              value={form.Document}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Tipo de Documento:</label>
            <Input
              name="TipoDocumento"
              type="text"
              onChange={handleChange}
              value={form.TipoDocumento}
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={4}>
          <FormGroup>
            <label>Celular:</label>
            <Input
              name="Celular"
              type="text"
              onChange={handleChange}
              value={form.Celular}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Correo:</label>
            <Input
              name="Correo"
              type="email"
              onChange={handleChange}
              value={form.Correo}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Fecha Inicio:</label>
            <Input
              name="FechaIni"
              type="date"
              onChange={handleChange}
              value={form.FechaIni}
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={4}>
          <FormGroup>
            <label>Numero SS:</label>
            <Input
              name="NumeroSS"
              type="text"
              onChange={handleChange}
              value={form.NumeroSS}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Contacto de Emergencia:</label>
            <Input
              name="ContactoEmergencia"
              type="text"
              onChange={handleChange}
              value={form.ContactoEmergencia}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Parentesco:</label>
            <Input
              name="Parentesco"
              type="text"
              onChange={handleChange}
              value={form.Parentesco}
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={4}>
          <FormGroup>
            <label>Nombre del Familiar:</label>
            <Input
              name="NombreFamiliar"
              type="text"
              onChange={handleChange}
              value={form.NombreFamiliar}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Grupo Sanguíneo:</label>
            <Input
              name="GrupoSanguineo"
              type="text"
              onChange={handleChange}
              value={form.GrupoSanguineo}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Numero de Seguridad Social:</label>
            <Input
              name="NumeroSeguridadSocial"
              type="text"
              onChange={handleChange}
              value={form.NumeroSeguridadSocial}
            />
          </FormGroup>
        </Col>
      </Row>
      <Row form>
        <Col md={4}>
          <FormGroup>
            <label>Dirección:</label>
            <Input
              name="Direccion"
              type="text"
              onChange={handleChange}
              value={form.Direccion}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Tipo Contrato:</label>
            <Input
              name="TipoContrato"
              type="text"
              onChange={handleChange}
              value={form.TipoContrato}
            />
          </FormGroup>
        </Col>
      </Row>
      <Button color="primary" onClick={handleSubmit}>Insertar</Button>{' '}
      <Button color="secondary" onClick={() => navigate('/Empleados')}>Cancelar</Button>
    </Container>
  );
};

export default FormularioEmpleado;
