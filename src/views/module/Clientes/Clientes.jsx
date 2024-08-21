import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, ModalFooter, FormGroup, Input } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importar íconos de react-icons



const data = [
  {id:1, Nombre: "Angie Lopez", Distintivo:16514416, Categoria_Cliente: "...", Celular: "3105981162",Correo:"angi@gmail.com",Dirección:"calle 45#54-67"},
  {id:2, Nombre: "Isabella Ramos", Distintivo:18761919, Categoria_Cliente: "...", Celular: "3223001452",Correo:"isa@gmail.com",Dirección:"calle 23#53-87"},
  {id:3, Nombre: "Cristian Medina", Distintivo:1016177143, Categoria_Cliente: " ...", Celular: "30589741263",Correo:"criss@gmail.com",Dirección:"calle 55#78-86"}
];


class Clientes extends React.Component {

  
  state = { 
    data: data,
    filteredData: data,
    form: {
      id:'',
      Nombre:'',
      Distintivo: '',
      Categoria_Cliente: '',
      Celular: '',
      Correo: '',
      Dirección: ''
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
        item.Nombre.toLowerCase().includes(searchText) ||
        item.Distintivo.toString().includes(searchText) ||
        item.Categoria_Cliente.toLowerCase().includes(searchText) ||
        item.Celular.toLowerCase().includes(searchText)||
        item.Correo.toLowerCase().includes(searchText)||
        item.Dirección.toLowerCase().includes(searchText)

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
        lista[contador].Distintivo = dato.Distintivo;
        lista[contador].Categoria_Cliente = dato.Categoria_Cliente;
        lista[contador].Correo = dato.Correo;
        lista[contador].Dirección = dato.Dirección;

      }
      contador++;
    });
    this.setState({ data: lista, filteredData: lista, modalEditar: false });
  }

  eliminar = (dato) => {
    var opcion = window.confirm("¿Realmente desea eliminar el cliente? " + dato.id);
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
              placeholder="Buscar cliente"
              value={this.state.searchText}
              onChange={this.handleSearch}
              style={{ width: '300px' }}
            />
            <Button color="success" onClick={this.mostrarModalInsertar}>Agregar cliente</Button>
          </div>
          
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {this.state.filteredData.map((elemento) => (
                <tr key={elemento.id}>
                  <td>{elemento.id}</td>
                  <td>{elemento.Nombre}</td>
                  <td>{elemento.Distintivo}</td>
                  <td>{elemento.Categoria_Cliente}</td>
                  <td>{elemento.Celular}</td>
                  <td>{elemento.Correo }</td>
                  <td>{elemento.Dirección }</td>

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
              <h3>Insertar registro</h3>
            </div>
          </ModalHeader>

          <ModalBody>
            <FormGroup>
              <label>Id:</label>
              <input className="form-control" readOnly type="text" value={this.state.data.length + 1} />
            </FormGroup>

            <FormGroup>
              <label>Nombre Completo:</label>
              <input className="form-control" name="Nombre" type="text" onChange={this.handleChange} />
            </FormGroup>

            <FormGroup>
              <label>Distintivo:</label>
              <input className="form-control" name="Document" type="number" onChange={this.handleChange} />
            </FormGroup>

            <FormGroup>
              <label>Categoria Cliente: </label>
              <input className="form-control" name="Cargo" type="text" onChange={this.handleChange} />
            </FormGroup>

            <FormGroup>
              <label>Celular: </label>
              <input className="form-control" name="Empresa" type="text" onChange={this.handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Correo: </label>
              <input className="form-control" name="Empresa" type="text" onChange={this.handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Dirección: </label>
              <input className="form-control" name="Empresa" type="text" onChange={this.handleChange} />
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
              <h3>Agregar Cliente</h3>
            </div>
          </ModalHeader>

          <ModalBody>
            <FormGroup>
              <label>Id:</label>
              <input className="form-control" readOnly type="text" value={this.state.form.id} />
            </FormGroup>

            <FormGroup>
              <label>Nombre Completo:</label>
              <input className="form-control" name="Nombre" type="text" onChange={this.handleChange} value={this.state.form.Nombre} />
            </FormGroup>

            <FormGroup>
              <label>Distintivo:</label>
              <input className="form-control" name="Document" type="number" onChange={this.handleChange} value={this.state.form.Document} />
            </FormGroup>

            <FormGroup>
              <label>Categoria Cliente: </label>
              <input className="form-control" name="Cargo" type="text" onChange={this.handleChange} value={this.state.form.Cargo} />
            </FormGroup>

            <FormGroup>
              <label>Celular: </label>
              <input className="form-control" name="Empresa" type="text" onChange={this.handleChange} value={this.state.form.Empresa} />
            </FormGroup>
            <FormGroup>
              <label>Correo: </label>
              <input className="form-control" name="Empresa" type="text" onChange={this.handleChange} value={this.state.form.Empresa} />
            </FormGroup>
            <FormGroup>
              <label>Dirección: </label>
              <input className="form-control" name="Empresa" type="text" onChange={this.handleChange} value={this.state.form.Empresa} />
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



export default Clientes;
