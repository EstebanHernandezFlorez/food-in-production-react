import { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import axios from 'axios';

// const initialData = [
//   { id: 1, NombreCompleto: "Juan Pérez", Distintivo: "7867", CategoriaCliente: "regular", Celular: "3123456789", Correo: "juan.perez@example.com", Direccion: "Cl 76 j 12b 55", Estado: true },
//   { id: 2, NombreCompleto: "Ana Torres", Distintivo: "7576", CategoriaCliente: "familiar", Celular: "3109876543", Correo: "ana.torres@example.com", Direccion: "Av. El Dorado 92-45", Estado: true },
// ];

const Clientes = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectCustomer, setSelectCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    id: '',
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Celular: '',
    Correo: '',
    Direccion: '',
    Estado: true
  });
  const [filteredCustomers, setFiltersCustomers] = useState(customers);
  const [searchTerm, setSearchTerm] = useState('');
  // useEffect(() => {
  //   fetch('http://localhost:3000/customers')
  //     .then(response => response.json())
  //     .then(data => setClientes(data))
  //     .catch(error => console.error('Error al obtener clientes:', error));
  // }, []);

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData({
  //     ...formData,
  //     [name]: value
  //   });
  // };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   fetch('http://localhost:3000/customers', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(formData),
  //   })
  //     .then(response => response.json())
  //     .then(data => {
  //       console.log('Cliente agregado:', data);
  //     })
  //     .catch(error => console.error('Error al agregar cliente:', error));
  // };

  const [data, setData] = useState([]);
  const [form, setForm] = useState({
    id: '',
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Celular: '',
    Correo: '',
    Direccion: '',
    Estado: true
  });
  const [errors, setErrors] = useState({
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Celular: '',
    Correo: '',
    Direccion: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const itemsPerPage = 7;

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  useEffect(() => {
    fetchData();
  });

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/customers');
      console.log(response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'NombreCompleto':
        return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value) ? '' : 'Nombre Completo solo debe contener letras y espacios.';
      case 'Distintivo':
        return /^\d+$/.test(value) ? '' : 'Distintivo solo debe contener números.';
      case 'CategoriaCliente':
        return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value) ? '' : 'Categoría Cliente solo debe contener letras y espacios.';
      case 'Celular':
        return /^\d{10}$/.test(value) ? '' : 'Celular debe tener exactamente 10 dígitos.';
      case 'Correo':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Correo electrónico inválido.';
      case 'Direccion':
        return value.trim() !== '' ? '' : 'Dirección es requerida.';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: validateField(name, value)
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const showAlert = (message, icon) => {
    Swal.fire({
      title: message,
      icon: icon,
      confirmButtonColor: '#3085d6',
    });
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(form).forEach(key => {
      if (key !== 'id' && key !== 'Estado') {
        const error = validateField(key, form[key]);
        newErrors[key] = error;
        if (error) isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert("Por favor, corrija los errores en el formulario.", 'error');
      return;
    }

    const { Distintivo } = form;
    const clienteExistente = data.find(registro => registro.Distintivo == Distintivo);
    if (clienteExistente) {
      showAlert("El cliente ya existe. Por favor, ingrese un distintivo diferente.", 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Desea agregar este cliente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const nuevoCliente = {
        ...form,
        id: data.length ? Math.max(...data.map(cli => cli.id)) + 1 : 1
      };
      await axios.post('http://localhost:3000/customers', nuevoCliente);

      setData([...data, nuevoCliente]);

      setForm({
        id: '',
        NombreCompleto: '',
        Distintivo: '',
        CategoriaCliente: '',
        Celular: '',
        Correo: '',
        Direccion: '',
        Estado: true
      });
      setShowForm(false);
      showAlert("Cliente agregado exitosamente", 'success');
    }
  };

  const editar = async () => {
    if (!validateForm()) {
      showAlert("Por favor, corrija los errores en el formulario.", 'error');
      return;
    }

    const { Distintivo, _id } = form;
    const clienteExistente = data.find(
      (registro) => registro.Distintivo === Distintivo && registro._id !== _id
    );
    if (clienteExistente) {
      showAlert("Ya existe un cliente con el mismo distintivo. Por favor, ingresa un distintivo diferente.", 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Desea editar este cliente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, editar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await axios.put(`http://localhost:3000/customers/${_id}`, form);
      const updatedData = data.map((registro) =>
        registro._id === _id ? { ...form } : registro
      );
      setData(updatedData);
      setIsEditing(false);
      setModalOpen(false);
      showAlert("Cliente editado exitosamente", 'success');
    }
  };

  const handleDelete = async (dato) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: (`¿Desea eliminar el cliente "${dato.NombreCompleto}"?`),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const updatedData = data.filter(registro => registro._id !== dato._id);
      await axios.delete(`http://localhost:3000/customers/${dato._id}`);
      setData(updatedData)
      showAlert("Cliente eliminado exitosamente", 'success');
    }
  };

  const cambiarEstado = async (id) => {
    const cliente = data.find(c => c._id === id);
    const nuevoEstado = { ...cliente, Estado: !cliente.Estado };

    const result = await Swal.fire({
      title: "¿Desea cambiar el estado del cliente?",
      text: (`El cliente "${cliente.NombreCompleto}" pasará de ${cliente.Estado ? 'Activo' : 'Inactivo'} a ${nuevoEstado ? 'Activo' : 'Inactivo'}`),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:3000/customers/${id}`, nuevoEstado);
        const updatedData = data.map((registro) => {
          if (registro._id === id) {
            return { ...registro, Estado: nuevoEstado };
          }
          return registro;
        });
        setData(updatedData);
        showAlert(`Estado del cliente actualizado`, 'success');
      } catch (error) {
        console.error('Error al cambiar el estado del cliente:', error);
        showAlert('Error al cambiar el estado del cliente', error);
      }
    }
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
    <Container>
      <br />
      {!showForm && (
        <>
          <h2>Lista de Clientes</h2>
          <br />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar cliente"
              value={searchText}
              onChange={handleSearch}
              style={{ width: '20%' }}
            />

            <Button style={{ background: '#2e8329' }} onClick={() => { setForm({ id: '', NombreCompleto: '', Distintivo: '', CategoriaCliente: '', Celular: '', Correo: '', Direccion: '', Estado: true }); setIsEditing(false); setShowForm(true); }}>
              Agregar Cliente
            </Button>
          </div>

          <Table striped bordered hover responsive>
            <thead className="text-center">
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Distintivo</th>
                <th>Categoría</th>
                <th>Celular</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {currentItems.length > 0 ? (
                currentItems.map((dato) => (
                  <tr key={dato._id}>
                    <td>{dato.id}</td>
                    <td>{dato.NombreCompleto}</td>
                    <td>{dato.Distintivo}</td>
                    <td>{dato.CategoriaCliente}</td>
                    <td>{dato.Celular}</td>
                    <td>{dato.Correo}</td>
                    <td>{dato.Direccion}</td>
                    <td>
                      <Button
                        style={{
                          backgroundColor: dato.Estado ? '#2e8322' : '#8d0f0f',
                          borderColor: dato.Estado ? '#2e8322' : '#8d0f0f',
                          color: '#fff'
                        }}
                        onClick={() => cambiarEstado(dato._id)}
                      >
                        {dato.Estado ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td>
                      <Button style={{ background: '#1a1918', marginRight: '5px' }} onClick={() => { setForm(dato); setIsEditing(true); setModalOpen(true); }}>
                        <FaEdit />
                      </Button>
                      <Button style={{ background: '#8d0f0f' }} onClick={() => handleDelete(dato)}>
                        <FaTrashAlt />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No hay datos disponibles.</td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                {pageNumbers.map((number) => (
                  <li
                    key={number}
                    className={`page-item ${number === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(number)}
                  >
                    <span className="page-link">{number}</span>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}

      {showForm && (
        <Row>
          <Col md={12}>
            <h2>{isEditing ? 'Editar Cliente' : 'Agregar Cliente'}</h2>

            <br />
            <FormGroup>
              <Row>
                <Col md={6}>
                  <label><b>Nombre Completo</b></label>
                  <br />
                  <Input
                    type="text"
                    name="NombreCompleto"
                    value={form.NombreCompleto}
                    onChange={handleChange}
                    placeholder="Nombre Completo"
                    invalid={!!errors.NombreCompleto}
                  />
                  {errors.NombreCompleto && <span className="text-danger">{errors.NombreCompleto}</span>}
                </Col>
                <Col md={6}>
                  <label><b>Distintivo</b></label>
                  <br />
                  <Input
                    type="text"
                    name="Distintivo"
                    value={form.Distintivo}
                    onChange={handleChange}
                    placeholder="Distintivo"
                    invalid={!!errors.Distintivo}
                  />
                  {errors.Distintivo && <span className="text-danger">{errors.Distintivo}</span>}
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <br />
                  <label><b>Categoria cliente</b></label>
                  <Input
                    type="select"
                    name="CategoriaCliente"
                    value={form.CategoriaCliente}
                    onChange={handleChange}
                    placeholder="Categoría Cliente"
                    invalid={!!errors.CategoriaCliente}
                  >
                  <option value="VIP">VIP</option>
                  <option value="Frecuente">Frecuente</option>
                  <option value="Regular">Regular</option>
                  <option value="Nuevo">Nuevo</option>
                  
                </Input>
                  {errors.CategoriaCliente && <span className="text-danger">{errors.CategoriaCliente}</span>}
                </Col>
                <Col md={6}>
                  <br />
                  <label><b>Celular</b></label>
                  <br />
                  <Input
                    type="text"
                    name="Celular"
                    value={form.Celular}
                    onChange={handleChange}
                    placeholder="Celular"
                    invalid={!!errors.Celular}
                  />
                  {errors.Celular && <span className="text-danger">{errors.Celular}</span>}
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <br />
                  <label><b>Email</b></label>
                  <br />
                  <Input
                    type="email"
                    name="Correo"
                    value={form.Correo}
                    onChange={handleChange}
                    placeholder="Correo"
                    invalid={!!errors.Correo}
                  />
                  {errors.Correo && <span className="text-danger">{errors.Correo}</span>}
                </Col>
                <Col md={6}>
                  <br />
                  <label><b>Dirección</b></label>
                  <br />
                  <Input
                    type="text"
                    name="Direccion"
                    value={form.Direccion}
                    onChange={handleChange}
                    placeholder="Dirección"
                    invalid={!!errors.Direccion}
                  />
                  {errors.Direccion && <span className="text-danger">{errors.Direccion}</span>}
                </Col>
              </Row>
              <br />
              <div className="d-flex justify-content-start">
                <Button style={{ background: '#2e8329', marginRight: '10px' }} onClick={handleSubmit}>
                  Guardar
                </Button>
                <Button style={{ background: '#6d0f0f' }} onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </FormGroup>
          </Col>
        </Row>
      )}

      {/* Modal para edición del cliente */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader style={{ background: '#6d0f0f' }} toggle={() => setModalOpen(!modalOpen)}>
          <h3 className="text-white"> Editar cliente</h3>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <label ><b>Nombre Completo:</b></label>
            <br />
            <Input
              style={{ border: '2px solid #000000' }}
              type="text"
              name="NombreCompleto"
              value={form.NombreCompleto}
              onChange={handleChange}
              placeholder="Nombre Completo"
              invalid={!!errors.NombreCompleto}
            />
            {errors.NombreCompleto && <span className="text-danger">{errors.NombreCompleto}</span>}
            <br />
            <label ><b>Distintivo:</b></label>
            <br />
            <Input
              style={{ border: '2px solid #000000' }}
              type="text"
              name="Distintivo"
              value={form.Distintivo}
              onChange={handleChange}
              placeholder="Distintivo"
              invalid={!!errors.Distintivo}
            />
            {errors.Distintivo && <span className="text-danger">{errors.Distintivo}</span>}
            <br />
            <label ><b>Categoria cliente:</b></label>
            <br />
            <Input
              style={{ border: '2px solid #000000' }}
              type="select"
              name="CategoriaCliente"
              value={form.CategoriaCliente}
              onChange={handleChange}
              placeholder="Categoría Cliente"
              invalid={!!errors.CategoriaCliente}
            >
                  <option value="VIP">VIP</option>
                  <option value="Frecuente">Frecuente</option>
                  <option value="Regular">Regular</option>
                  <option value="Nuevo">Nuevo</option>
                </Input>
            {errors.CategoriaCliente && <span className="text-danger">{errors.CategoriaCliente}</span>}
            <br />
            <label ><b>Celular:</b></label>
            <br />
            <Input
              style={{ border: '2px solid #000000' }}
              type="text"
              name="Celular"
              value={form.Celular}
              onChange={handleChange}
              placeholder="Celular"
              invalid={!!errors.Celular}
            />
            {errors.Celular && <span className="text-danger">{errors.Celular}</span>}
            <br />
            <label ><b>Correo:</b></label>
            <br />
            <Input
              style={{ border: '2px solid #000000' }}
              type="email"
              name="Correo"
              value={form.Correo}
              onChange={handleChange}
              placeholder="Correo"
              invalid={!!errors.Correo}
            />
            {errors.Correo && <span className="text-danger">{errors.Correo}</span>}
            <br />
            <label ><b>Dirección:</b></label>
            <br />
            <Input
              style={{ border: '2px solid #000000' }}
              type="text"
              name="Direccion"
              value={form.Direccion}
              onChange={handleChange}
              placeholder="Dirección"
              invalid={!!errors.Direccion}
            />
            {errors.Direccion && <span className="text-danger">{errors.Direccion}</span>}
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button style={{ background: '#2e8329' }} onClick={editar}>Guardar </Button>{' '}
          <Button style={{ background: '#6d0f0f' }} onClick={() => setModalOpen(!modalOpen)}>Cancelar</Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

Clientes.propTypes = {
  data: PropTypes.array,
};

export default Clientes;