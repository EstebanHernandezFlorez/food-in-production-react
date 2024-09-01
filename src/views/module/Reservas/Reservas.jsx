import  { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types'; 
import { Table, Button, Input, Row, Col, FormGroup, Alert } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { IoSearchOutline } from 'react-icons/io5';

const Reservas = ({ eliminar, cambiarEstado }) => {
  // Usa useMemo para memorizar el initialFormState y evitar su recreación en cada renderizado
  const initialFormState = useMemo(() => ({
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Correo: '',
    Celular: '',
    Estado: '',
    Direccion: '',
    NroPersonas: '',
    CantidadMesas: '',
    TipoEvento: '',
    DuracionEvento: '',
    FechaHora: '',
    ServiciosAdicionales: '',
    Observaciones: '',
    MontoDecoracion: '',
    TotalPagar: '',
    Abono: '',
    Restante: '',
    FormaPago: '',
  }), []);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [tableSearchText, setTableSearchText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Usa useCallback para memoizar resetForm y evitar que se cree una nueva función en cada renderizado
  const resetForm = useCallback(() => {
    setFormErrors({});
    setForm(initialFormState);
    setIsEditing(false);
  }, [initialFormState]);

  useEffect(() => {
    if (!showForm) {
      resetForm();
    }
  }, [showForm, resetForm]);

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validarFormulario = () => {
    const errors = {};
    const requiredFields = Object.keys(initialFormState);

    requiredFields.forEach((field) => {
      if (!form[field]) {
        errors[field] = 'Este campo es requerido';
      }
    });

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      if (isEditing) {
        // Lógica para editar la reserva
      } else {
        // Lógica para crear nueva reserva
      }
      setShowForm(false);
    }
  };

  const handleTableSearch = (e) => {
    setTableSearchText(e.target.value);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // const filteredItems = reservas.filter((item) =>
  //   Object.values(item).some((value) =>
  //     String(value).toLowerCase().includes(tableSearchText.toLowerCase())
  //   )
  // );
  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Correo, Celular, Direccion, NroPersonas, CantidadMesas, TipoEvento, DuracionEvento, FechaHora, ServiciosAdicionales, Observaciones, MontoDecoracion, TotalPagar, Abono, Restante, FormaPago } = form;

    if (!NombreCompleto || !Distintivo || !CategoriaCliente || !Correo || !Celular || !Direccion || !NroPersonas || !CantidadMesas || !TipoEvento || !DuracionEvento || !FechaHora || !ServiciosAdicionales || !Observaciones || !MontoDecoracion || !TotalPagar || !Abono || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const reservaExistente = data.find(registro => registro.Distintivo.toString() === Distintivo.toString());
    if (reservaExistente) {
      openSnackbar("La reserva ya existe. Por favor, ingrese un distintivo diferente.", 'error');
      return;
    }

    const nuevaReserva = {
      ...form,
      id: data.length ? Math.max(...data.map(res => res.id)) + 1 : 1
    };

    setData([...data, nuevaReserva]);

    setForm({
      id: '',
      NombreCompleto: '',
      Distintivo: '',
      CategoriaCliente: '',
      Correo: '',
      Celular: '',
      Estado: 'Activo',
      Direccion: '',
      NroPersonas: '',
      CantidadMesas: '',
      TipoEvento: '',
      DuracionEvento: '',
      FechaHora: '',
      ServiciosAdicionales: '',
      Observaciones: '',
      MontoDecoracion: '',
      TotalPagar: '',
      Abono: '',
      Restante: '',
      FormaPago: ''
    });
    setShowForm(false);
    openSnackbar("Reserva agregada exitosamente", 'success');
  };

  const editar = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Correo, Celular, Direccion, NroPersonas, CantidadMesas, TipoEvento, DuracionEvento, FechaHora, ServiciosAdicionales, Observaciones, MontoDecoracion, TotalPagar, Abono, Restante, FormaPago } = form;

    if (!NombreCompleto || !Distintivo || !CategoriaCliente || !Correo || !Celular || !Direccion || !NroPersonas || !CantidadMesas || !TipoEvento || !DuracionEvento || !FechaHora || !ServiciosAdicionales || !Observaciones || !MontoDecoracion || !TotalPagar || !Abono || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const reservaExistente = data.find(
      (registro) => registro.Distintivo.toString() === Distintivo.toString() &&
      registro.id !== form.id
    );
    if (reservaExistente) {
      openSnackbar("Ya existe una reserva con el mismo distintivo. Por favor, ingresa un distintivo diferente.", 'error');
      return;
    }

    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );

    setData(updatedData);
    setIsEditing(false);
    setShowForm(false);
    openSnackbar("Reserva editada exitosamente", 'success');
  };


  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = registro.Estado === 'Activo' ? 'Inactivo' : 'Activo';
      }
      return registro;
    });

    setData(updatedData);
    openSnackbar("Estado de la reserva actualizado exitosamente", 'success');
  };



  const filteredData = data.filter(item =>
    item.NombreCompleto.toLowerCase().includes(searchText) ||
    item.Distintivo.toLowerCase().includes(searchText) ||
    item.CategoriaCliente.toLowerCase().includes(searchText) ||
    item.Celular.toString().includes(searchText) ||
    item.Correo.toLowerCase().includes(searchText) ||
    item.Direccion.toLowerCase().includes(searchText)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div>
      {!showForm && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="search-bar">
              <IoSearchOutline className="search-icon" />
              <Input
                type="text"
                className="search-input"
                placeholder="Buscar..."
                value={tableSearchText}
                onChange={handleTableSearch}
              />
            </div>
            <Button color="primary" onClick={toggleForm}>
              Crear Nueva Reserva
            </Button>
          </div>
          <Table responsive striped>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Distintivo</th>
                <th>Categoría Cliente</th>
                <th>Correo</th>
                <th>Celular</th>
                <th>Estado</th>
                <th>Dirección</th>
                <th>Nro. Personas</th>
                <th>Cantidad Mesas</th>
                <th>Tipo Evento</th>
                <th>Duración Evento</th>
                <th>Fecha/Hora</th>
                <th>Servicios Adicionales</th>
                <th>Observaciones</th>
                <th>Monto Decoración</th>
                <th>Total a Pagar</th>
                <th>Abono</th>
                <th>Restante</th>
                <th>Forma de Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.NombreCompleto}</td>
                  <td>{item.Distintivo}</td>
                  <td>{item.CategoriaCliente}</td>
                  <td>{item.Correo}</td>
                  <td>{item.Celular}</td>
                  <td>{item.Estado}</td>
                  <td>{item.Direccion}</td>
                  <td>{item.NroPersonas}</td>
                  <td>{item.CantidadMesas}</td>
                  <td>{item.TipoEvento}</td>
                  <td>{item.DuracionEvento}</td>
                  <td>{item.FechaHora}</td>
                  <td>{item.ServiciosAdicionales}</td>
                  <td>{item.Observaciones}</td>
                  <td>{item.MontoDecoracion}</td>
                  <td>{item.TotalPagar}</td>
                  <td>{item.Abono}</td>
                  <td>{item.Restante}</td>
                  <td>{item.FormaPago}</td>
                  <td>
                    <Button
                      color="success"
                      className="me-2"
                      onClick={() => {
                        setIsEditing(true);
                        setShowForm(true);
                        setForm(item);
                      }}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      color="danger"
                      className="me-2"
                      onClick={() => eliminar(item)}
                    >
                      <FaTrashAlt />
                    </Button>
                    <Button
                      color={item.Estado === 'Confirmada' ? 'warning' : 'primary'}
                      onClick={() => cambiarEstado(item.id)}
                    >
                      {item.Estado === 'Confirmada' ? 'Cancelar' : 'Confirmar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <nav>
            <ul className="pagination">
              {pageNumbers.map((number) => (
                <li key={number} className="page-item">
                  <button
                    onClick={() => handlePageChange(number)}
                    className="page-link"
                  >
                    {number}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
      {showForm && (
        <>
          <h2>{isEditing ? 'Editar Reserva' : 'Crear Nueva Reserva'}</h2>
          <Row>
            <Col md={6}>
              {Object.keys(initialFormState).slice(0, 9).map((key) => (
                <FormGroup key={key}>
                  <label>{key}</label>
                  <Input
                    type={key === 'Correo' ? 'email' : 'text'}
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                  />
                  {formErrors[key] && <Alert color="danger">{formErrors[key]}</Alert>}
                </FormGroup>
              ))}
            </Col>
            <Col md={6}>
              {Object.keys(initialFormState).slice(9).map((key) => (
                <FormGroup key={key}>
                  <label>{key}</label>
                  <Input
                    type={key === 'FechaHora' ? 'datetime-local' : 'text'}
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                  />
                  {formErrors[key] && <Alert color="danger">{formErrors[key]}</Alert>}
                </FormGroup>
              ))}
              <Button color="primary" onClick={validarFormulario}>
                {isEditing ? 'Actualizar' : 'Crear'}
              </Button>
              <Button color="secondary" onClick={toggleForm}>
                Cancelar
              </Button>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

// Definición de PropTypes
Reservas.propTypes = {
  reservas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      NombreCompleto: PropTypes.string.isRequired,
      Distintivo: PropTypes.string.isRequired,
      CategoriaCliente: PropTypes.string.isRequired,
      Correo: PropTypes.string.isRequired,
      Celular: PropTypes.string.isRequired,
      Estado: PropTypes.string.isRequired,
      Direccion: PropTypes.string.isRequired,
      NroPersonas: PropTypes.string.isRequired,
      CantidadMesas: PropTypes.string.isRequired,
      TipoEvento: PropTypes.string.isRequired,
      DuracionEvento: PropTypes.string.isRequired,
      FechaHora: PropTypes.string.isRequired,
      ServiciosAdicionales: PropTypes.string,
      Observaciones: PropTypes.string,
      MontoDecoracion: PropTypes.string.isRequired,
      TotalPagar: PropTypes.string.isRequired,
      Abono: PropTypes.string.isRequired,
      Restante: PropTypes.string.isRequired,
      FormaPago: PropTypes.string.isRequired,
    })
  ).isRequired,
  eliminar: PropTypes.func.isRequired,
  cambiarEstado: PropTypes.func.isRequired,
};

export default Reservas;
