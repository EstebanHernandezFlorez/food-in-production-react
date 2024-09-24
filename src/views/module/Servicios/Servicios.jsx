import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, ModalFooter, FormGroup, Input } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const data = [
  { id: 1, Nombre: "Decoraciones", Estado: "Activo" }
];

class Servicios extends React.Component {
  state = {
    data: data,
    filteredData: data,
    form: {
      id: '',
      Nombre: '',
      Estado: 'Activo',
    },
    modalInsertar: false,
    modalEditar: false,
    modalEliminar: false,
    selectedService: null,
    searchText: '',
    snackbarOpen: false,
    snackbarMessage: '',
    snackbarSeverity: 'success',
    currentPage: 1,
    itemsPerPage: 7
  };

  handleChange = e => {
    this.setState({
      form: {
        ...this.state.form,
        [e.target.name]: e.target.value,
      }
    });
  }

  handleSearch = e => {
    const searchText = e.target.value.toLowerCase();
    this.setState({
      searchText,
      filteredData: this.state.data.filter(item =>
        item.Nombre.toLowerCase().includes(searchText)
      )
    });
  }

  mostrarModalInsertar = () => {
    this.setState({ modalInsertar: true });
  }

  ocultarModalInsertar = () => {
    this.setState({ modalInsertar: false });
  }

  mostrarModalEditar = (registro) => {
    this.setState({ modalEditar: true, form: registro });
  }

  ocultarModalEditar = () => {
    this.setState({ modalEditar: false });
  }

  mostrarModalEliminar = (servicio) => {
    this.setState({ modalEliminar: true, selectedService: servicio });
  }

  ocultarModalEliminar = () => {
    this.setState({ modalEliminar: false, selectedService: null });
  }

  validarFormulario = () => {
    const { Nombre } = this.state.form;
    if (!Nombre.trim()) {
      this.setState({ 
        snackbarMessage: 'Todos los campos son obligatorios.', 
        snackbarSeverity: 'error',
        snackbarOpen: true 
      });
      return false;
    }
    return true;
  }

  insertar = () => {
    if (!this.validarFormulario()) return;

    const { data, form } = this.state;
    const tipoDocumentoExistente = data.find(servicio => servicio.Nombre.toLowerCase() === form.Nombre.toLowerCase());

    if (tipoDocumentoExistente) {
      this.setState({ 
        snackbarMessage: 'El servicio ya existe.', 
        snackbarSeverity: 'error',
        snackbarOpen: true 
      });
    } else {
      const valorNuevo = { ...form, id: data.length + 1 };
      const lista = [...data, valorNuevo];
      this.setState({ 
        data: lista, 
        filteredData: lista, 
        modalInsertar: false, 
        snackbarMessage: 'Servicio agregado con éxito.', 
        snackbarSeverity: 'success',
        snackbarOpen: true 
      });
    }
  }

  editar = (dato) => {
    if (!this.validarFormulario()) return;

    const { data } = this.state;
    const tipoDocumentoExistente = data.find(servicio => servicio.Nombre.toLowerCase() === dato.Nombre.toLowerCase() && servicio.id !== dato.id);

    if (tipoDocumentoExistente) {
      this.setState({ 
        snackbarMessage: 'No se puede editar. Otro servicio con el mismo nombre ya existe.', 
        snackbarSeverity: 'error',
        snackbarOpen: true 
      });
    } else {
      const lista = data.map(servicio => servicio.id === dato.id ? dato : servicio);
      this.setState({ 
        data: lista, 
        filteredData: lista, 
        modalEditar: false, 
        snackbarMessage: 'Servicio editado con éxito.', 
        snackbarSeverity: 'success',
        snackbarOpen: true 
      });
    }
  }

  eliminar = () => {
    const { data, selectedService } = this.state;
    const lista = data.filter(servicio => servicio.id !== selectedService.id);
    this.setState({ 
      data: lista, 
      filteredData: lista, 
      modalEliminar: false,
      snackbarMessage: 'Servicio eliminado con éxito.', 
      snackbarSeverity: 'success',
      snackbarOpen: true 
    });
  }

  cambiarEstado = (id) => {
    const lista = this.state.data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = registro.Estado === "Activo" ? "Inactivo" : "Activo";
      }
      return registro;
    });

    this.setState({ 
      data: lista, 
      filteredData: lista,
      snackbarMessage: 'Estado del servicio actualizado exitosamente.', 
      snackbarSeverity: 'info',
      snackbarOpen: true 
    });
  }

  handlePageChange = (pageNumber) => {
    this.setState({ currentPage: pageNumber });
  }

  closeSnackbar = () => {
    this.setState({ snackbarOpen: false });
  }

  render() {
    const { currentPage, itemsPerPage, filteredData, selectedService } = this.state;
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
          <br />
          <h2 className="text-right">Lista de Servicios Adicionales</h2>
          <br />
          <br />
          <br />

          <div className="d-flex justify-content-between align-items-center mb-3 mx-auto" style={{ maxWidth: '900px' }}>
            <Input
              type="text"
              placeholder="Buscar servicio adicional"
              value={this.state.searchText}
              onChange={this.handleSearch}
              style={{ width: '200px'}}
              
            />
            <Button style={{ background: '#2e8322' }} onClick={this.mostrarModalInsertar}>Agregar Servicio </Button>
          </div>
      <br />

          {/*  tabla  limitar ancho */}
          <div className="table-responsive mx-auto" style={{ maxWidth: '700px' }}>
            <Table className="table table-bordered text-center">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((elemento) => (
                  <tr key={elemento.id} style={{ backgroundColor: elemento.Estado === "Inactivo" ? "#e9ecef" : "white" }}>
                    <td>{elemento.id}</td>
                    <td>{elemento.Nombre}</td>
                    <td>
                      <Button
                        color={elemento.Estado === "Activo" ? "success" : "secondary"}
                        onClick={(e) => { e.stopPropagation(); this.cambiarEstado(elemento.id); }}
                        size="sm"
                        className="mr-1"
                        style={{ backgroundColor: elemento.Estado === "Activo" ? "#2e8322" : "#8d0f0f", color: "white", padding: '0.375rem 0.75rem' }}
                      >
                        {elemento.Estado === "Activo" ? "Activo" : "Inactivo"}
                      </Button>{' '}
                      <Button style={{ background: '#1a1918' }} onClick={() => this.mostrarModalEditar(elemento)}><FaEdit /></Button>{' '}
                      <Button style={{ background: '#8d0f0f' }} onClick={() => this.mostrarModalEliminar(elemento)}><FaTrashAlt /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="d-flex justify-content-center">
            {pageNumbers.map(number => (
              <Button
                key={number}
                color="info"
                onClick={() => this.handlePageChange(number)}
                className="mx-1"
              >
                {number}
              </Button>
            ))}
          </div>
        </Container>

        {/* Modales */}
        <Modal isOpen={this.state.modalInsertar}>
          <ModalHeader style={{ background: '#6d0f0f' }}>
            <div>
              <h3 className="text-white">Agregar servicio</h3>
            </div>
          </ModalHeader>

          <ModalBody>
            <FormGroup>
              <label><b>Nombre:</b></label>
              <input
                className="form-control"
                name="Nombre"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Nombre}
                style={{ border: '2px solid #000000' }}
              />
            </FormGroup>

            <ModalFooter>
              <Button style={{ background: '#2e8322' }} onClick={this.insertar}>Agregar</Button>
              <Button style={{ background: '#6d0f0f' }} onClick={this.ocultarModalInsertar}>Cancelar</Button>
            </ModalFooter>
          </ModalBody>
        </Modal>

        <Modal isOpen={this.state.modalEditar}>
          <ModalHeader style={{ background: '#6d0f0f' }}>
            <div>
              <h3 className="text-white">Editar servicio adicional</h3>
            </div>
          </ModalHeader >

          <ModalBody>
            <FormGroup>
              <label><b>Nombre:</b></label>
              <input
                className="form-control"
                name="Nombre"
                type="text"
                style={{ border: '2px solid #000000' }}
                onChange={this.handleChange}
                value={this.state.form.Nombre}
              />
            </FormGroup>

            <ModalFooter>
              <Button style={{ background: '#2e8322' }} onClick={() => this.editar(this.state.form)}>Editar</Button>
              <Button style={{ background: '#6d0f0f' }} onClick={this.ocultarModalEditar}>Cancelar</Button>
            </ModalFooter>
          </ModalBody>
        </Modal>

        <Modal isOpen={this.state.modalEliminar}>
          <ModalHeader style={{ background: '#6d0f0f' }}>
            <div>
              <h3 className="text-white">Eliminar servicio adicional</h3>
            </div>
          </ModalHeader>

          <ModalBody>
            ¿Está seguro que desea eliminar el servicio "{selectedService?.Nombre}"?
          </ModalBody>

          <ModalFooter>
            <Button style={{ background: '#8d0f0f' }} onClick={this.eliminar}>Eliminar</Button>
            <Button style={{ background: '#2e8322' }} onClick={this.ocultarModalEliminar}>Cancelar</Button>
          </ModalFooter>
        </Modal>

        <Snackbar
          open={this.state.snackbarOpen}
          autoHideDuration={6000}
          onClose={this.closeSnackbar}
        >
          <Alert
            onClose={this.closeSnackbar}
            severity={this.state.snackbarSeverity}
          >
            {this.state.snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    )
  }
}

export default Servicios;
