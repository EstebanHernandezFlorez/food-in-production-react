import { useState } from "react";
import { Table, Button, Container, Row, Col, FormGroup, Input } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';

const initialData = [
  { id: 1, Nombre: "Boda Juan y María", Distintivo: "7867", Evento: "Boda", Fechahora: "2024-09-01T18:00", Cantidadmesas: "15", Nropersonas: "150", Abono: "500", Totalpag: "1500", Restante: "1000" },
  { id: 2, Nombre: "Fiesta de Empresa", Distintivo: "7576", Evento: "Corporativo", Fechahora: "2024-09-15T20:00", Cantidadmesas: "20", Nropersonas: "200", Abono: "700", Totalpag: "2000", Restante: "1300" },
];

const Reserva = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    Nombre: '',
    Distintivo: '',
    Evento: '',
    Fechahora: '',
    Cantidadmesas: '',
    Nropersonas: '',
    CategoriaCliente: '',
    Correo: '',
    Celular: '',
    Direccion: '',
    DuracionEvento: '',
    ServiciosAdicionales: '',
    Observaciones: '',
    MontoDecoracion: '',
    Abono: '',
    Totalpag: '',
    Restante: '',
    FormaPago: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [searchText, setSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const validateForm = () => {
    let errors = {};
    if (!form.Nombre) errors.Nombre = 'El nombre es obligatorio';
    if (!form.Distintivo) errors.Distintivo = 'El distintivo es obligatorio';
    if (!form.Evento) errors.Evento = 'El evento es obligatorio';
    if (!form.Fechahora) errors.Fechahora = 'La fecha y hora son obligatorias';
    if (!form.Cantidadmesas) errors.Cantidadmesas = 'La cantidad de mesas es obligatoria';
    if (!form.Nropersonas) errors.Nropersonas = 'El número de personas es obligatorio';
    if (!form.CategoriaCliente) errors.CategoriaCliente = 'La categoria del cliente es obligatoria';
    if (!form.Correo) errors.Correo = 'El correo es obligatorio';
    if (!form.Celular) errors.Celular = 'El número de celular es obligatorio';
    if (!form.Direccion) errors.Direccion = 'La dirección es obligatoria';
    if (!form.DuracionEvento) errors.DuracionEvento = 'La duración del evento es obligatorio';
    if (!form.ServiciosAdicionales) errors.ServiciosAdicionales = 'El servicio adicional es obligatorio';
    if (!form.Observaciones) errors.Observaciones = 'Las observacionnes son obligatorias';
    if (!form.MontoDecoracion) errors.MontoDecoracion = 'El monto de la decoracion es obligatoria';
    if (!form.Abono) errors.Abono = 'El abono es obligatorio';
    if (!form.Totalpag) errors.Totalpag = 'El total a pagar es obligatorio';
    if (!form.Restante) errors.Restante = 'El restante es obligatorio';
    if (!form.FormaPago) errors.FormaPago = 'La forma de pago es obligatoria';


    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, complete todos los campos obligatorios", 'warning');
      return;
    }

    if (isEditing) {
      // Actualiza la reserva existente
      setData(data.map(item => (item.id === form.id ? form : item)));
      openSnackbar("Reserva actualizada exitosamente", 'success');
    } else {
      // Crea una nueva reserva
      const nuevaReserva = { ...form, id: data.length ? Math.max(...data.map(res => res.id)) + 1 : 1 };
      setData([...data, nuevaReserva]);
      openSnackbar("Reserva agregada exitosamente", 'success');
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Está seguro de que desea eliminar esta reserva?")) {
      setData(data.filter(item => item.id !== id));
      openSnackbar("Reserva eliminada exitosamente", 'success');
    }
  };

  const resetForm = () => {
    setForm({
      id: '',
      Nombre: '',
      Distintivo: '',
      Evento: '',
      Fechahora: '',
      Cantidadmesas: '',
      Nropersonas: '',
      CategoriaCliente: '',
      Correo: '',
      Celular: '',
      Direccion: '',
      DuracionEvento: '',
      ServiciosAdicionales: '',
      Observaciones: '',
      MontoDecoracion: '',
      Abono: '',
      Totalpag: '',
      Restante: '',
      FormaPago: ''
    });
    setFormErrors({});
    setIsEditing(false);
  };

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  const filteredData = data.filter(item =>
    item.Nombre.toLowerCase().includes(searchText) ||
    item.Distintivo.toLowerCase().includes(searchText) ||
    item.Evento.toLowerCase().includes(searchText)
  );

  return (
    <Container fluid>
      <Row>
        <Col md={8}>
          <h2>Lista de Reservas</h2>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchText}
              onChange={handleSearch}
              style={{ width: '300px' }}
            />
            <Button color="primary" onClick={() => {
              resetForm();
              setShowForm(true);
            }}>
              Agregar Reserva
            </Button>
          </div>
          <Table striped>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Distintivo</th>
                <th>Evento</th>
                <th>Fecha y Hora</th>
                <th>Cantidad de Mesas</th>
                <th>Número de Personas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.Nombre}</td>
                  <td>{item.Distintivo}</td>
                  <td>{item.Evento}</td>
                  <td>{item.Fechahora}</td>
                  <td>{item.Cantidadmesas}</td>
                  <td>{item.Nropersonas}</td>
                  <td>
                    <Button color="warning" onClick={() => {
                      setForm(item);
                      setIsEditing(true);
                      setShowForm(true);
                    }}>
                      <FaEdit />
                    </Button>{' '}
                    <Button color="danger" onClick={() => handleDelete(item.id)}>
                      <FaTrashAlt />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>

        {showForm && (
          <Col md={4}>
            <h2>{isEditing ? 'Editar Reserva' : 'Agregar Reserva'}</h2>

            {/* Formulario con todos los campos */}
            <FormGroup>
              <label>Nombre</label>
              <Input
                type="text"
                name="Nombre"
                value={form.Nombre}
                onChange={handleChange}
                invalid={!!formErrors.Nombre}
              />
              {formErrors.Nombre && <div className="text-danger">{formErrors.Nombre}</div>}
            </FormGroup>

            <FormGroup>
              <label>Distintivo</label>
              <Input
                type="text"
                name="Distintivo"
                value={form.Distintivo}
                onChange={handleChange}
                invalid={!!formErrors.Distintivo}
              />
              {formErrors.Distintivo && <div className="text-danger">{formErrors.Distintivo}</div>}
            </FormGroup>

            <FormGroup>
              <label>Evento</label>
              <Input
                type="text"
                name="Evento"
                value={form.Evento}
                onChange={handleChange}
                invalid={!!formErrors.Evento}
              />
              {formErrors.Evento && <div className="text-danger">{formErrors.Evento}</div>}
            </FormGroup>

            <FormGroup>
              <label>Fecha y Hora</label>
              <Input
                type="datetime-local"
                name="Fechahora"
                value={form.Fechahora}
                onChange={handleChange}
                invalid={!!formErrors.Fechahora}
              />
              {formErrors.Fechahora && <div className="text-danger">{formErrors.Fechahora}</div>}
            </FormGroup>

            <FormGroup>
              <label>Cantidad de Mesas</label>
              <Input
                type="number"
                name="Cantidadmesas"
                value={form.Cantidadmesas}
                onChange={handleChange}
                invalid={!!formErrors.Cantidadmesas}
              />
              {formErrors.Cantidadmesas && <div className="text-danger">{formErrors.Cantidadmesas}</div>}
            </FormGroup>

            <FormGroup>
              <label>Número de Personas</label>
              <Input
                type="number"
                name="Nropersonas"
                value={form.Nropersonas}
                onChange={handleChange}
                invalid={!!formErrors.Nropersonas}
              />
              {formErrors.Nropersonas && <div className="text-danger">{formErrors.Nropersonas}</div>}
            </FormGroup>

            <FormGroup>
              <label>Correo</label>
              <Input
                type="email"
                name="Correo"
                value={form.Correo}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Celular</label>
              <Input
                type="tel"
                name="Celular"
                value={form.Celular}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Dirección</label>
              <Input
                type="text"
                name="Direccion"
                value={form.Direccion}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Duración del Evento</label>
              <Input
                type="text"
                name="DuracionEvento"
                value={form.DuracionEvento}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Servicios Adicionales</label>
              <Input
                type="textarea"
                name="ServiciosAdicionales"
                value={form.ServiciosAdicionales}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Observaciones</label>
              <Input
                type="textarea"
                name="Observaciones"
                value={form.Observaciones}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Monto de Decoración</label>
              <Input
                type="number"
                name="MontoDecoracion"
                value={form.MontoDecoracion}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Abono</label>
              <Input
                type="number"
                name="Abono"
                value={form.Abono}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Total a Pagar</label>
              <Input
                type="number"
                name="Totalpag"
                value={form.Totalpag}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Restante</label>
              <Input
                type="number"
                name="Restante"
                value={form.Restante}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Forma de Pago</label>
              <Input
                type="text"
                name="FormaPago"
                value={form.FormaPago}
                onChange={handleChange}
              />
            </FormGroup>

            <Button color="primary" onClick={handleSubmit}>
              {isEditing ? 'Guardar Cambios' : 'Agregar'}
            </Button>{' '}
            <Button color="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </Col>
        )}
      </Row>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Reserva;
