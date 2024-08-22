import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, ModalFooter, FormGroup, Input } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';
import { Link } from 'react-router-dom'; // Asegúrate de importar Link

const data = [
  {id:1, Nombre: "Carolina Guzman", Document:16514416, FechaIni:"15-07-2020", NumeroSS:61515371, Direccion:"cl 76 j 12b 55", TipoContrato:"doble tiempo"},
  {id:2, Nombre: "Andra Torres", Document:18761919, FechaIni:"01-02-2023", NumeroSS:12345678, Direccion:"Av. El Dorado 92-45", TipoContrato:"tiempo completo"},
  {id:3, Nombre: "Natalia Muriel", Document:1016177143, FechaIni:"15-03-2022", NumeroSS:23456789, Direccion:"Cra 15 #76-30", TipoContrato:"tiempo completo"},
  {id:4, Nombre: "Luis Pérez", Document:12345678, FechaIni:"10-11-2021", NumeroSS:34567890, Direccion:"Cl 10 #15-20", TipoContrato:"medio tiempo"},
  {id:5, Nombre: "María Gómez", Document:23456789, FechaIni:"20-09-2020", NumeroSS:45678901, Direccion:"Cra 7 #22-12", TipoContrato:"tiempo completo"},
  {id:6, Nombre: "Pedro Martínez", Document:34567890, FechaIni:"05-06-2021", NumeroSS:56789012, Direccion:"Cl 80 #14-05", TipoContrato:"tiempo completo"},
  {id:7, Nombre: "Laura Fernández", Document:45678901, FechaIni:"12-04-2023", NumeroSS:67890123, Direccion:"Av. 68 #10-20", TipoContrato:"medio tiempo"},
  {id:8, Nombre: "Carlos Rodríguez", Document:56789012, FechaIni:"01-01-2020", NumeroSS:78901234, Direccion:"Cra 50 #30-40", TipoContrato:"tiempo completo"}
]

class Empleados extends React.Component {
  state = {
    data: data,
    filteredData: data,
    form: {
      id:'',
      Nombre:'',
      Document: '',
      FechaIni: '',
      NumeroSS: '',
      Direccion: '',
      TipoContrato:'',
      Estado: false // Añadido el campo Estado
    },
    modalInsertar: false,
    modalEditar: false,
    searchText: '',
    currentPage: 1,
    itemsPerPage: 7,
    snackbarOpen: false,
    snackbarMessage: '',
    snackbarSeverity: 'success',
  };

  handleChange = e => {
    const { name, value } = e.target;
    this.setState({
      form: {
        ...this.state.form,
        [name]: value,
      }
    });
  }

  handleSearch = e => {
    const searchText = e.target.value.toLowerCase();
    this.setState({
      searchText,
      filteredData: this.state.data.filter(item =>
        item.Nombre.toLowerCase().includes(searchText) ||
        item.Document.toString().includes(searchText) ||
        item.FechaIni.toLowerCase().includes(searchText) ||
        item.NumeroSS.toLowerCase().includes(searchText)
      )
    });
  }

  mostrarModalEditar = (registro) => {
    this.setState({ modalEditar: true, form: registro });
  }

  ocultarModalEditar = () => {
    this.setState({ modalEditar: false });
  }

  openSnackbar = (message, severity) => {
    this.setState({
      snackbarOpen: true,
      snackbarMessage: message,
      snackbarSeverity: severity
    });
  }

  closeSnackbar = () => {
    this.setState({ snackbarOpen: false });
  }

  editar = () => {
    try {
      const { Nombre, Document, FechaIni, NumeroSS, Direccion, TipoContrato } = this.state.form;

      const regex = /^[A-Za-z][A-Za-z0-9\s]*$/;
      if (Nombre && !regex.test(Nombre)) {
        this.openSnackbar("El nombre del empleado no puede comenzar con un número ni contener caracteres especiales.", 'warning');
        return;
      }

      if (!Nombre && !Document && !FechaIni && !NumeroSS && !Direccion && !TipoContrato) {
        this.openSnackbar("Por favor, ingrese al menos un campo para editar.", 'warning');
        return;
      }

      const empleadoExistente = this.state.data.find(
        (registro) => Document &&
        registro.Document.toString() === Document.toString() &&
        registro.id !== this.state.form.id
      );

      if (empleadoExistente) {
        this.openSnackbar("Ya existe un empleado con el mismo documento. Por favor, ingresa un documento diferente.", 'error');
        return;
      }

      const lista = this.state.data.map((registro) =>
        registro.id === this.state.form.id ? { ...registro, ...this.state.form } : registro
      );

      this.setState({ data: lista, filteredData: lista, modalEditar: false });
      this.openSnackbar("Empleado editado exitosamente", 'success');
    } catch (error) {
      this.openSnackbar(`Error al editar el empleado: ${error.message}`, 'error');
    }
  }

  eliminar = (dato) => {
    const opcion = window.confirm(`¿Realmente desea eliminar el registro ${dato.id}?`);
    if (opcion) {
      const lista = this.state.data.filter(registro => registro.id !== dato.id);
      this.setState({
        data: lista,
        filteredData: lista
      });
      this.openSnackbar("Empleado eliminado exitosamente", 'success');
    }
  }

  cambiarEstado = (id) => {
    const lista = this.state.data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });

    this.setState({ data: lista, filteredData: lista });
    this.openSnackbar("Estado del empleado actualizado exitosamente", 'success');
  }

  handlePageChange = (pageNumber) => {
    this.setState({
      currentPage: pageNumber,
      form: { id: '', Nombre: '', Document: '', FechaIni: '', NumeroSS: '', Direccion: '', TipoContrato: '', Estado: false } // Limpiar formulario al cambiar de página
    });
  }

  clearForm = () => {
    this.setState({ form: { id: '', Nombre: '', Document: '', FechaIni: '', NumeroSS: '', Direccion: '', TipoContrato: '', Estado: false } });
  }

  insertar = () => {
    // Implementa la lógica para insertar un nuevo empleado
    // Por ejemplo, validación y luego actualización del estado
    // Después de insertar, cerrar el modal
    this.openSnackbar("Empleado agregado exitosamente", 'success');
    this.setState({ modalInsertar: false });
  }

  ocultarModalInsertar = () => {
    this.setState({ modalInsertar: false });
  }

  render() {
    const { currentPage, itemsPerPage, filteredData, snackbarOpen, snackbarMessage, snackbarSeverity } = this.state;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const pageNumbers = [];

    for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
      pageNumbers.push(i);
    }

    return (
      <>
        <Container>
          <br />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar empleado"
              value={this.state.searchText}
              onChange={this.handleSearch}
              style={{ width: '300px' }}
            />
            <Link to="/agregar-empleado">
              <Button color="success">Agregar empleado</Button>
            </Link>
          </div>
          
          <Table className="table table-bordered">
            <thead>
              <tr>
                <th>Id</th>
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
              {currentItems.map((elemento) => (
                <tr key={elemento.id}>
                  <td>{elemento.id}</td>
                  <td>{elemento.Nombre}</td>
                  <td>{elemento.Document}</td>
                  <td>{elemento.FechaIni}</td>
                  <td>{elemento.NumeroSS}</td>
                  <td>{elemento.Direccion}</td>
                  <td>{elemento.TipoContrato}</td>
                  <td>{elemento.Estado ? "Activo" : "Inactivo"}</td> 
                  <td>
                    <Button color="primary" onClick={() => this.mostrarModalEditar(elemento)}><FaEdit /></Button>{' '}
                    <Button color="danger" onClick={() => this.eliminar(elemento)}><FaTrashAlt /></Button>{' '}
                    <Button 
                      color={elemento.Estado ? "warning" : "success"} 
                      onClick={() => this.cambiarEstado(elemento.id)}
                    >
                      {elemento.Estado ? "Desactivar" : "Activar"}
                    </Button>
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
                      onClick={() => this.handlePageChange(number)}
                    >
                      {number}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Modal Insertar */}
          <Modal isOpen={this.state.modalInsertar}>
            <ModalHeader>Agregar Empleado</ModalHeader>
            <ModalBody>
              <FormGroup>
                <label>Nombre Completo:</label>
                <Input 
                  name="Nombre" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.Nombre} 
                />
              </FormGroup>
              <FormGroup>
                <label>Documento:</label>
                <Input 
                  name="Document" 
                  type="number" 
                  onChange={this.handleChange} 
                  value={this.state.form.Document} 
                />
              </FormGroup>
              <FormGroup>
                <label>Fecha Inicio:</label>
                <Input 
                  name="FechaIni" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.FechaIni} 
                />
              </FormGroup>
              <FormGroup>
                <label>Numero SS:</label>
                <Input 
                  name="NumeroSS" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.NumeroSS} 
                />
              </FormGroup>
              <FormGroup>
                <label>Dirección:</label>
                <Input 
                  name="Direccion" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.Direccion} 
                />
              </FormGroup>
              <FormGroup>
                <label>Tipo Contrato:</label>
                <Input 
                  name="TipoContrato" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.TipoContrato} 
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onClick={this.insertar}>Insertar</Button>{' '}
              <Button color="secondary" onClick={this.ocultarModalInsertar}>Cancelar</Button>
            </ModalFooter>
          </Modal>

          {/* Modal Editar */}
          <Modal isOpen={this.state.modalEditar}>
            <ModalHeader>Editar Empleado</ModalHeader>
            <ModalBody>
              <FormGroup>
                <label>Nombre Completo:</label>
                <Input 
                  name="Nombre" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.Nombre} 
                />
              </FormGroup>
              <FormGroup>
                <label>Documento:</label>
                <Input 
                  name="Document" 
                  type="number" 
                  onChange={this.handleChange} 
                  value={this.state.form.Document} 
                />
              </FormGroup>
              <FormGroup>
                <label>Fecha Inicio:</label>
                <Input 
                  name="FechaIni" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.FechaIni} 
                />
              </FormGroup>
              <FormGroup>
                <label>Numero SS:</label>
                <Input 
                  name="NumeroSS" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.NumeroSS} 
                />
              </FormGroup>
              <FormGroup>
                <label>Dirección:</label>
                <Input 
                  name="Direccion" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.Direccion} 
                />
              </FormGroup>
              <FormGroup>
                <label>Tipo Contrato:</label>
                <Input 
                  name="TipoContrato" 
                  type="text" 
                  onChange={this.handleChange} 
                  value={this.state.form.TipoContrato} 
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onClick={this.editar}>Guardar</Button>{' '}
              <Button color="secondary" onClick={this.ocultarModalEditar}>Cancelar</Button>
            </ModalFooter>
          </Modal>
          
          {/* Snackbar para alertas */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={this.closeSnackbar}
          >
            <Alert 
              onClose={this.closeSnackbar} 
              severity={snackbarSeverity} 
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Container>
      </>
    );
  }
}

export default Empleados;
