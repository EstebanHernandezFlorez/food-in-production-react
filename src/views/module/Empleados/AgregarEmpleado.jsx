// AgregarEmpleado.jsx
import React from 'react';
import { Button, FormGroup, Input, Row, Col } from 'reactstrap';

const AgregarEmpleado = ({ form, setForm, setData, setAlert, setShowForm, openSnackbar }) => {
  const handleChange = e => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    const { Nombre, Document, FechaIni, NumeroSS, Direccion, TipoContrato } = form;

    if (Nombre.trim() === '' || Document.trim() === '' || FechaIni.trim() === '' || NumeroSS.trim() === '' || Direccion.trim() === '' || TipoContrato.trim() === '') {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const empleadoExistente = data.find(registro => registro.Document.toString() === Document.toString());
    if (empleadoExistente) {
      openSnackbar("El empleado ya existe. Por favor, ingrese un documento de empleado diferente.", 'danger');
      return;
    }

    const nuevoEmpleado = {
      id: Date.now(),
      Nombre,
      Document,
      FechaIni,
      NumeroSS,
      Direccion,
      TipoContrato,
      Estado: true
    };

    setData(prevData => [...prevData, nuevoEmpleado]);
    setForm({
      id: '',
      Nombre: '',
      Document: '',
      FechaIni: '',
      NumeroSS: '',
      Direccion: '',
      TipoContrato: '',
      Estado: true
    });
    setShowForm(false);
    openSnackbar("Empleado agregado exitosamente", 'success');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Row form>
        <Col md={4}>
          <FormGroup>
            <label>Nombre Completo:</label>
            <Input
              name="Nombre"
              type="text"
              value={form.Nombre}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Documento:</label>
            <Input
              name="Document"
              type="text"
              value={form.Document}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Fecha Inicio:</label>
            <Input
              name="FechaIni"
              type="date"
              value={form.FechaIni}
              onChange={handleChange}
              required
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
              value={form.NumeroSS}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Dirección:</label>
            <Input
              name="Direccion"
              type="text"
              value={form.Direccion}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <label>Tipo Contrato:</label>
            <Input
              name="TipoContrato"
              type="text"
              value={form.TipoContrato}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </Col>
      </Row>
      <div className="d-flex justify-content-end mt-3">
        <Button color="success" type="submit" className="me-3">Agregar</Button>{' '}
        <Button color="danger" onClick={() => setShowForm(false)}>Cancelar</Button>
      </div>
    </form>
  );
};

export default AgregarEmpleado;
