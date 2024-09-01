import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';

const initialData = [
  { id: 1, nombreInsumo: "Harina", cantidad: 50, tipoGramaje: "kg", proveedor: "Proveedor A" },
  { id: 2, nombreInsumo: "Azúcar", cantidad: 100, tipoGramaje: "kg", proveedor: "Proveedor B" },
];

const Insumos = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({ id: '', nombreInsumo: '', cantidad: '', tipoGramaje: '', proveedor: '', Estado: true });
  const [isEditing, setIsEditing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const handleSearch = (e) => setSearchText(e.target.value.toLowerCase());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({ ...prevForm, [name]: value }));
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => setSnackbarOpen(false);

  const handleSubmit = () => {
    const { nombreInsumo, cantidad, tipoGramaje, proveedor } = form;
    if (!nombreInsumo || !cantidad || !tipoGramaje || !proveedor) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const insumoExistente = data.find(registro => registro.nombreInsumo.toLowerCase() === nombreInsumo.toLowerCase());
    if (insumoExistente) {
      openSnackbar("El insumo ya existe. Por favor, ingrese un nombre diferente.", 'error');
      return;
    }

    const nuevoInsumo = { ...form, id: data.length ? Math.max(...data.map(ins => ins.id)) + 1 : 1 };
    setData([...data, nuevoInsumo]);

    setForm({ id: '', nombreInsumo: '', cantidad: '', tipoGramaje: '', proveedor: '', Estado: true });
    openSnackbar("Insumo agregado exitosamente", 'success');
  };

  const editar = () => {
    const { nombreInsumo, cantidad, tipoGramaje, proveedor } = form;
    if (!nombreInsumo || !cantidad || !tipoGramaje || !proveedor) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const insumoExistente = data.find(
      (registro) => registro.nombreInsumo.toLowerCase() === nombreInsumo.toLowerCase() && registro.id !== form.id
    );
    if (insumoExistente) {
      openSnackbar("Ya existe un insumo con el mismo nombre. Por favor, ingresa un nombre diferente.", 'error');
      return;
    }

    const updatedData = data.map((registro) => registro.id === form.id ? { ...form } : registro);
    setData(updatedData);
    setIsEditing(false);
    openSnackbar("Insumo editado exitosamente", 'success');
  };

  const eliminar = (dato) => {
    if (window.confirm(`¿Realmente desea eliminar el insumo ${dato.id}?`)) {
      const updatedData = data.filter(registro => registro.id !== dato.id);
      setData(updatedData);
      openSnackbar("Insumo eliminado exitosamente", 'success');
    }
  };

  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) registro.Estado = !registro.Estado;
      return registro;
    });
    setData(updatedData);
    openSnackbar("Estado del insumo actualizado exitosamente", 'success');
  };

  const filteredData = data.filter(item =>
    item.nombreInsumo.toLowerCase().includes(searchText) ||
    item.cantidad.toString().includes(searchText) ||
    item.tipoGramaje.toLowerCase().includes(searchText) ||
    item.proveedor.toLowerCase().includes(searchText)
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
      <h2>Lista de Insumos</h2>
      <br />
      <Row>
        <Col md={8}>
          <Input type="text" placeholder="Buscar insumo" value={searchText} onChange={handleSearch} style={{ width: '50%' }} />
        </Col>
        <Col md={4}>
          <Button color="success" onClick={() => { setForm({ id: '', nombreInsumo: '', cantidad: '', tipoGramaje: '', proveedor: '', Estado: true }); setIsEditing(false); }}>
            Limpiar
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Table className="table table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Nombre Insumo</th>
                <th>Cantidad</th>
                <th>Tipo Gramaje</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.nombreInsumo}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.tipoGramaje}</td>
                    <td>{item.proveedor}</td>
                    <td>
                      <Button color={item.Estado ? "success" : "danger"} size="sm" onClick={() => cambiarEstado(item.id)}>
                        {item.Estado ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td>
                      <Button color="primary" size="sm" onClick={() => { setForm(item); setIsEditing(true); }}><FaEdit /></Button>{' '}
                      <Button color="danger" size="sm" onClick={() => eliminar(item)}><FaTrashAlt /></Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">No se encontraron insumos</td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="pagination justify-content-center">
            {pageNumbers.map((number) => (
              <Button key={number} color="link" className={`page-link ${currentPage === number ? "active" : ""}`} onClick={() => handlePageChange(number)}>
                {number}
              </Button>
            ))}
          </div>
        </Col>
        <Col md={4}>
          <h4>{isEditing ? "Editar Insumo" : "Agregar Insumo"}</h4>
          <FormGroup>
            <Input type="text" name="nombreInsumo" placeholder="Nombre del Insumo" value={form.nombreInsumo} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Input type="number" name="cantidad" placeholder="Cantidad" value={form.cantidad} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Input type="text" name="tipoGramaje" placeholder="Tipo de Gramaje" value={form.tipoGramaje} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Input type="text" name="proveedor" placeholder="Proveedor" value={form.proveedor} onChange={handleChange} />
          </FormGroup>
          <Button color="primary" onClick={isEditing ? editar : handleSubmit}>
            {isEditing ? "Actualizar" : "Agregar"}
          </Button>{' '}
          <Button color="secondary" onClick={() => { setForm({ id: '', nombreInsumo: '', cantidad: '', tipoGramaje: '', proveedor: '', Estado: true }); setIsEditing(false); }}>
            Cancelar
          </Button>
        </Col>
      </Row>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Insumos;