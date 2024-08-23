import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, ModalFooter, FormGroup, Input, Toast, ToastBody, ToastHeader } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const data = [
  { id: 1, Nombre: "Angie Lopez", Distintivo: 16514416, Categoria_Cliente: "Familiar", Celular: "3105981162", Correo: "angi@gmail.com", Dirección: "calle 45#54-67", Estado: true },
  { id: 2, Nombre: "Isabella Ramos", Distintivo: 18761919, Categoria_Cliente: "Empresario", Celular: "3223001452", Correo: "isa@gmail.com", Dirección: "calle 23#53-87", Estado: true },
  { id: 3, Nombre: "Cristian Medina", Distintivo: 1016177143, Categoria_Cliente: "Frecuente", Celular: "30589741263", Correo: "criss@gmail.com", Dirección: "calle 55#78-86", Estado: true }
];

class Clientes extends React.Component {
  state = {
    data: data,
    filteredData: data,
    form: {
      id: '',
      Nombre: '',
      Distintivo: '',
      Categoria_Cliente: '',
      Celular: '',
      Correo: '',
      Dirección: '',
      Estado: true
    },
    modalInsertar: false,
    modalEditar: false,
    searchText: '',
    currentPage: 1,
    itemsPerPage: 7,
    alert: {
      visible: false,
      message: '',
      type: ''
    }
  };

  handleChange = e => {
    const { name, value } = e.target;
    this.setState({
      form: {
        ...this.state.form,
        [name]: value,
      }
    });
  };

  handleSwitchChange = e => {
    this.setState({
      form: {
        ...this.state.form,
        Estado: e.target.checked
      }
    });
  };

  handleSearch = e => {
    const searchText = e.target.value.toLowerCase();
    this.setState({
      searchText,
      filteredData: this.state.data.filter(item =>
        item.Nombre.toLowerCase().includes(searchText) ||
        item.Distintivo.toString().includes(searchText) ||
        item.Categoria_Cliente.toLowerCase().includes(searchText) ||
        item.Celular.toLowerCase().includes(searchText) ||
        item.Correo.toLowerCase().includes(searchText) ||
        item.Dirección.toLowerCase().includes(searchText)
      )
    });
  };

  mostrarModalInsertar = () => {
    this.setState({ modalInsertar: true, form: { ...this.state.form, id: this.state.data.length + 1 } });
  };

  ocultarModalInsertar = () => {
    this.setState({ modalInsertar: false });
  };

  mostrarModalEditar = (registro) => {
    this.setState({ modalEditar: true, form: registro });
  };

  ocultarModalEditar = () => {
    this.setState({ modalEditar: false });
  };

  mostrarAlerta = (message, type) => {
    this.setState({ alert: { visible: true, message, type } });
    setTimeout(() => this.setState({ alert: { visible: false, message: '', type: '' } }), 3000);
  };

  verificarDuplicado = (dato) => {
    return this.state.data.some(cliente =>
      cliente.Distintivo === dato.Distintivo || cliente.Correo === dato.Correo
    );
  };

  validarCampos = (form) => {
    return Object.values(form).every(value => value !== '');
  };

  insertar = () => {
    const { form } = this.state;

    if (!this.validarCampos(form)) {
      this.mostrarAlerta('Todos los campos deben ser llenados.', 'danger');
      return;
    }

    if (this.verificarDuplicado(form)) {
      this.mostrarAlerta('Cliente duplicado, no se puede agregar.', 'danger');
    } else {
      const valorNuevo = { ...form };
      valorNuevo.id = this.state.data.length + 1;
      const lista = [...this.state.data, valorNuevo];
      this.setState({ data: lista, filteredData: lista, modalInsertar: false });
      this.mostrarAlerta('Cliente agregado con éxito.', 'success');
    }
  };

  editar = (dato) => {
    const { form } = this.state;

    if (!this.validarCampos(form)) {
      this.mostrarAlerta('Todos los campos deben ser llenados.', 'danger');
      return;
    }

    if (this.verificarDuplicado(dato)) {
      this.mostrarAlerta('Cliente duplicado, no se puede modificar.', 'danger');
    } else {
      const lista = this.state.data.map(registro => registro.id === dato.id ? dato : registro);
      this.setState({ data: lista, filteredData: lista, modalEditar: false });
      this.mostrarAlerta('Cliente editado con éxito.', 'success');
    }
  };

  eliminar = (dato) => {
    const opcion = window.confirm("¿Realmente desea eliminar el cliente? ");
    if (opcion) {
      const lista = this.state.data.filter(registro => registro.id !== dato.id);
      this.setState({ data: lista, filteredData: lista });
      this.mostrarAlerta('Cliente eliminado con éxito.', 'success');
    }
  };

  cambiarEstado = (id) => {
    const lista = this.state.data.map(registro => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });
    this.setState({ data: lista, filteredData: lista });
  };

  handlePageChange = (pageNumber) => {
    this.setState({ 
      currentPage: pageNumber
    });
  };

  render() {
    const { currentPage, itemsPerPage, filteredData } = this.state;
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
              placeholder="Buscar cliente"
              value={this.state.searchText}
              onChange={this.handleSearch}
              style={{ width: '300px' }}
            />
            <Button color="success" onClick={this.mostrarModalInsertar}>Agregar cliente</Button>
          </div>

          {this.state.alert.visible && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              zIndex: 1051 // Asegura que el toast aparezca sobre el modal
            }}>
              <Toast className={`bg-${this.state.alert.type} text-white`}>
                <ToastHeader icon={this.state.alert.type}>
                  {this.state.alert.type === 'success' ? 'Éxito' : 'Error'}
                </ToastHeader>
                <ToastBody>
                  {this.state.alert.message}
                </ToastBody>
              </Toast>
            </div>
          )}

          <Table className="table table-bordered">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nombre Completo</th>
                <th>Distintivo</th>
                <th>Categoria Cliente</th>
                <th>Celular</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((elemento) => (
                <tr key={elemento.id}>
                  <td>{elemento.id}</td>
                  <td>{elemento.Nombre}</td>
                  <td>{elemento.Distintivo}</td>
                  <td>{elemento.Categoria_Cliente}</td>
                  <td>{elemento.Celular}</td>
                  <td>{elemento.Correo}</td>
                  <td>{elemento.Dirección}</td>
                  <td>
                    <Button
                      color={elemento.Estado ? "success" : "secondary"}
                      onClick={() => this.cambiarEstado(elemento.id)}
                      size="sm"
                      className="mr-1"
                      style={{ width: "90px" }}>
                      {elemento.Estado ? "Activo" : "Inactivo"}
                    </Button>
                  </td>
                  <td>
                    <Button color="primary" onClick={() => this.mostrarModalEditar(elemento)}><FaEdit /></Button>{" "}
                    <Button color="danger" onClick={() => this.eliminar(elemento)}><FaTrashAlt /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                {pageNumbers.map(number => (
                  <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                    <a onClick={() => this.handlePageChange(number)} className="page-link">
                      {number}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

        </Container>

        <Modal isOpen={this.state.modalInsertar}>
          <ModalHeader>
            <div>
              <h3>Agregar Cliente</h3>
            </div>
          </ModalHeader>

          <ModalBody>

            <FormGroup>
              <label>Nombre Completo:</label>
              <Input
                className="form-control"
                name="Nombre"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Nombre}
              />
            </FormGroup>

            <FormGroup>
              <label>Distintivo:</label>
              <Input
                className="form-control"
                name="Distintivo"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Distintivo}
              />
            </FormGroup>

            <FormGroup>
              <label>Categoria Cliente:</label>
              <Input
                className="form-control"
                name="Categoria_Cliente"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Categoria_Cliente}
              />
            </FormGroup>

            <FormGroup>
              <label>Celular:</label>
              <Input
                className="form-control"
                name="Celular"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Celular}
              />
            </FormGroup>

            <FormGroup>
              <label>Correo:</label>
              <Input
                className="form-control"
                name="Correo"
                type="email"
                onChange={this.handleChange}
                value={this.state.form.Correo}
              />
            </FormGroup>

            <FormGroup>
              <label>Dirección:</label>
              <Input
                className="form-control"
                name="Dirección"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Dirección}
              />
            </FormGroup>

            <FormGroup>
              <label>Estado:</label>
              <Input
                type="checkbox"
                name="Estado"
                checked={this.state.form.Estado}
                onChange={this.handleSwitchChange}
              />
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <Button color="primary" onClick={() => this.insertar()}>Agregar</Button>
            <Button color="danger" onClick={() => this.ocultarModalInsertar()}>Cancelar</Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={this.state.modalEditar}>
          <ModalHeader>
            <div>
              <h3>Editar Cliente</h3>
            </div>
          </ModalHeader>

          <ModalBody>
        
            <FormGroup>
              <label>Nombre Completo:</label>
              <Input
                className="form-control"
                name="Nombre"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Nombre}
              />
            </FormGroup>

            <FormGroup>
              <label>Distintivo:</label>
              <Input
                className="form-control"
                name="Distintivo"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Distintivo}
              />
            </FormGroup>

            <FormGroup>
              <label>Categoria Cliente:</label>
              <Input
                className="form-control"
                name="Categoria_Cliente"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Categoria_Cliente}
              />
            </FormGroup>

            <FormGroup>
              <label>Celular:</label>
              <Input
                className="form-control"
                name="Celular"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Celular}
              />
            </FormGroup>

            <FormGroup>
              <label>Correo:</label>
              <Input
                className="form-control"
                name="Correo"
                type="email"
                onChange={this.handleChange}
                value={this.state.form.Correo}
              />
            </FormGroup>

            <FormGroup>
              <label>Dirección:</label>
              <Input
                className="form-control"
                name="Dirección"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.Dirección}
              />
            </FormGroup>

            <FormGroup>
              <label>Estado:</label>
              <Input
                type="checkbox"
                name="Estado"
                checked={this.state.form.Estado}
                onChange={this.handleSwitchChange}
              />
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <Button color="primary" onClick={() => this.editar(this.state.form)}>Editar</Button>
            <Button color="danger" onClick={() => this.ocultarModalEditar()}>Cancelar</Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default Clientes;
