import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, ModalFooter, FormGroup, Input } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importar íconos de react-icons



const data = [
  {id:1, Nombre: "Decoraciones"}
];


class Servicios extends React.Component {

  
  state = { 
    data: data,
    filteredData: data,
    form: {
      id:'',
      Nombre:'',
    },
    modalInsertar: false,
    modalEditar: false,
    searchText: ''
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

  insertar = () => {
    var valorNuevo = { ...this.state.form };
    valorNuevo.id = this.state.data.length + 1;
    var lista = this.state.data;
    lista.push(valorNuevo);
    this.setState({ data: lista, filteredData: lista, modalInsertar: false });
  }

  editar = (dato) => {
    var contador = 0;
    var lista = this.state.data;
    lista.map((registro) => {
      if (dato.id === registro.id) {
        lista[contador].Nombre = dato.Nombre;

      }
      contador++;
    });
    this.setState({ data: lista, filteredData: lista, modalEditar: false });
  }

  eliminar = (dato) => {
    var opcion = window.confirm("¿Realmente desea eliminar el servicio adicional? " + dato.id);
    if (opcion) {
      var contador = 0;
      var lista = this.state.data;
      lista.map((registro) => {
        if (registro.id === dato.id) {
          lista.splice(contador, 1);
        }
        contador++;
      });
      this.setState({ data: lista, filteredData: lista });
    }
  }

  render() {
    return (
      <>
        <Container>
          <br />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar servicio adicional"
              value={this.state.searchText}
              onChange={this.handleSearch}
              style={{ width: '300px' }}
            />
            <Button color="success" onClick={this.mostrarModalInsertar}>Agregar servicio adicional</Button>
          </div>
          
          <Table className="table table-bordered">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {this.state.filteredData.map((elemento) => (
                <tr key={elemento.id}>
                  <td>{elemento.id}</td>
                  <td>{elemento.Nombre}</td>
                  <td>
                    <Button color="primary" onClick={() => this.mostrarModalEditar(elemento)}><FaEdit /></Button>{' '}
                    <Button color="danger" onClick={() => this.eliminar(elemento)}><FaTrashAlt /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Container>

        <Modal isOpen={this.state.modalInsertar}>
          <ModalHeader>
            <div>
              <h3>Insertar servicio adicional</h3>
            </div>
          </ModalHeader>

          <ModalBody>
            <FormGroup>
              <label>Id:</label>
              <input className="form-control" readOnly type="text" value={this.state.data.length + 1} />
            </FormGroup>

            <FormGroup>
              <label>Nombre:</label>
              <input className="form-control" name="Nombre" type="text" onChange={this.handleChange} />
            </FormGroup>

            <ModalFooter>
              <Button color="primary" onClick={this.insertar}>Insertar</Button>
              <Button color="danger" onClick={this.ocultarModalInsertar}>Cancelar</Button>
            </ModalFooter>
          </ModalBody>
        </Modal>

        <Modal isOpen={this.state.modalEditar}>
          <ModalHeader>
            <div>
              <h3>Agregar servicio adicional</h3>
            </div>
          </ModalHeader>

          <ModalBody>
            <FormGroup>
              <label>Id:</label>
              <input className="form-control" readOnly type="text" value={this.state.form.id} />
            </FormGroup>

            <FormGroup>
              <label>Nombre:</label>
              <input className="form-control" name="Nombre" type="text" onChange={this.handleChange} value={this.state.form.Nombre} />
            </FormGroup>

            <ModalFooter>
              <Button color="primary" onClick={() => this.editar(this.state.form)}>Editar</Button>
              <Button color="danger" onClick={this.ocultarModalEditar}>Cancelar</Button>
            </ModalFooter>
          </ModalBody>
        </Modal>

      </>
    )
  }
}



export default Servicios;