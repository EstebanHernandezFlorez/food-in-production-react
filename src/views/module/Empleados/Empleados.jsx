import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Input, Row, Col } from 'reactstrap';
import AgregarEmpleado from './AgregarEmpleado';
import EditarEmpleado from './EditarEmpleado';
import EliminarEmpleado from './EliminarEmpleado';
import CambiarEstadoEmpleado from './CambiarEstadoEmpleado';
import { Snackbar, Alert } from '@mui/material';

const initialData = [
  // Tu array de datos iniciales (si es necesario)
];

const Empleados = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    Nombre: '',
    Document: '',
    FechaIni: '',
    NumeroSS: '',
    Direccion: '',
    TipoContrato: '',
    Estado: true
  });
  const [alert, setAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [searchTextTable, setSearchTextTable] = useState('');
  const [searchTextForm, setSearchTextForm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchTable = e => {
    setSearchTextTable(e.target.value.toLowerCase());
  };

  const handleSearchForm = e => {
    setSearchTextForm(e.target.value.toLowerCase());
  };

  const filteredData = data.filter(item =>
    item.Nombre.toLowerCase().includes(searchTextTable) ||
    item.Document.toString().includes(searchTextTable) ||
    item.FechaIni.toLowerCase().includes(searchTextTable) ||
    item.NumeroSS.toString().includes(searchTextTable)
  );

  const filteredFormData = data.filter(item =>
    item.Nombre.toLowerCase().includes(searchTextForm) ||
    item.Document.toString().includes(searchTextForm) ||
    item.FechaIni.toLowerCase().includes(searchTextForm) ||
    item.NumeroSS.toString().includes(searchTextForm)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mt-3">
        <Button color="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Agregar Empleado'}
        </Button>
        {showForm && (
          <div className="d-flex align-items-center">
            <Input
              type="text"
              placeholder="Buscar en el formulario..."
              value={searchTextForm}
              onChange={handleSearchForm}
              className="me-3"
            />
          </div>
        )}
      </div>
      {showForm ? (
        <AgregarEmpleado
          form={form}
          setForm={setForm}
          setData={setData}
          setAlert={setAlert}
          setShowForm={setShowForm}
          openSnackbar={openSnackbar}
        />
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <Input
              type="text"
              placeholder="Buscar en la tabla..."
              value={searchTextTable}
              onChange={handleSearchTable}
            />
          </div>
          <Table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Documento</th>
                <th>Fecha Inicio</th>
                <th>Numero SS</th>
                <th>Dirección</th>
                <th>Tipo Contrato</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(empleado => (
                <tr key={empleado.id}>
                  <td>{empleado.id}</td>
                  <td>{empleado.Nombre}</td>
                  <td>{empleado.Document}</td>
                  <td>{empleado.FechaIni}</td>
                  <td>{empleado.NumeroSS}</td>
                  <td>{empleado.Direccion}</td>
                  <td>{empleado.TipoContrato}</td>
                  <td>{empleado.Estado ? "Activo" : "Inactivo"}</td>
                  <td>
                    <Button color="primary" onClick={() => {
                      setForm(empleado);
                      setModalEditar(true);
                    }}>Editar</Button>{' '}
                    <EliminarEmpleado 
                      empleado={empleado}
                      setData={setData}
                      openSnackbar={openSnackbar}
                    />{' '}
                    <CambiarEstadoEmpleado 
                      empleado={empleado}
                      setData={setData}
                      openSnackbar={openSnackbar}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                {pageNumbers.map(number => (
                  <li key={number} className="page-item">
                    <Button 
                      className="page-link" 
                      onClick={() => setCurrentPage(number)}
                    >
                      {number}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          {/* Modal Editar */}
          <EditarEmpleado
            modalEditar={modalEditar}
            setModalEditar={setModalEditar}
            form={form}
            setForm={setForm}
            data={data}
            setData={setData}
            openSnackbar={openSnackbar}
          />
          {/* Snackbar para alertas */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={closeSnackbar}
          >
            <Alert 
              onClose={closeSnackbar} 
              severity={snackbarSeverity} 
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </Container>
  );
};

export default Empleados;
