import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, ModalFooter, FormGroup, Input } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const data = [
  {id:1, Nombre: "Carolina Guzman", Document:16514416, Cargo: "Aux Cocina", Empresa: "Colanta"},
  {id:2, Nombre: "Andra Torres", Document:18761919, Cargo: "Aux Cocina", Empresa: "Colanta"},
  {id:3, Nombre: "Natalia Muriel", Document:1016177143, Cargo: "Jefe Cocina", Empresa: "Colanta"},
  {id:4, Nombre: "Luis Pérez", Document:12345678, Cargo: "Aux Administrativo", Empresa: "Colanta"},
  {id:5, Nombre: "María Gómez", Document:23456789, Cargo: "Jefe Administrativo", Empresa: "Colanta"},
  {id:6, Nombre: "Pedro Martínez", Document:34567890, Cargo: "Aux Producción", Empresa: "Colanta"},
  {id:7, Nombre: "Laura Fernández", Document:45678901, Cargo: "Aux Producción", Empresa: "Colanta"},
  {id:8, Nombre: "Carlos Rodríguez", Document:56789012, Cargo: "Jefe Producción", Empresa: "Colanta"}
];

class Empleados extends React.Component {
  state = { 
    data: data,
    filteredData: data,
    form: {
      id:'',
      Nombre:'',
      Document: '',
      Cargo: '',
      Empresa: ''
    },
    modalInsertar: false,
    modalEditar: false,
    searchText: '',
    currentPage: 1,
    itemsPerPage: 7
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
        item.Cargo.toLowerCase().includes(searchText) ||
        item.Empresa.toLowerCase().includes(searchText)
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
    try {
      const { Nombre, Document, Cargo, Empresa } = this.state.form;
  
      if (Nombre.trim() === '' || Document.trim() === '' || Cargo.trim() === '' || Empresa.trim() === '') {
        alert("Por favor, ingrese todos los campos");
        return;
      }
  
      // Convertir Document a string para la comparación
      const documentStr = Document.toString();
      const empleadoExistente = this.state.data.find(registro => registro.Document.toString() === documentStr);
      if (empleadoExistente) {
        throw new Error("El empleado ya existe. Por favor, ingrese un documento de empleado diferente.");
      }
  
      const nuevoEmpleado = { ...this.state.form, id: this.state.data.length + 1 };
      const lista = [...this.state.data, nuevoEmpleado];
      this.setState({ 
        data: lista, 
        filteredData: lista, // Asegúrate de actualizar filteredData también
        modalInsertar: false 
      });
      alert("Empleado agregado exitosamente");
      this.clearForm(); // Limpiar formulario después de insertar
    } catch (error) {
      alert(`Error al insertar el empleado: ${error.message}`);
    }
  }

  editar = () => {
    try {
      const { Nombre, Document, Cargo, Empresa } = this.state.form;

      if (Nombre.trim() === '' || Document.trim() === '' || Cargo.trim() === '' || Empresa.trim() === '') {
        alert("Por favor, ingrese todos los campos");
        return;
      }

      // Convertir Document a string para la comparación
      const documentStr = Document.toString();
      const empleadoExistente = this.state.data.find(registro => 
        registro.Document.toString() === documentStr && 
        registro.id !== this.state.form.id
      );
      if (empleadoExistente) {
        throw new Error("No puedes editar el empleado con el mismo documento. Por favor, ingresa un documento diferente.");
      }

      const lista = this.state.data.map((registro) => 
        registro.id === this.state.form.id ? this.state.form : registro
      );
      this.setState({ 
        data: lista, 
        filteredData: lista, // Asegúrate de actualizar filteredData también
        modalEditar: false 
      });
      alert("Empleado editado exitosamente");
      this.clearForm(); // Limpiar formulario después de editar
    } catch (error) {
      alert(`Error al editar el empleado: ${error.message}`);
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
    }
  }

  cambiarEstado = (id) => {
    const lista = this.state.data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });

    this.setState({ data: lista });
  }

  handlePageChange = (pageNumber) => {
    this.setState({ 
      currentPage: pageNumber,
      form: { id: '', Nombre: '', Document: '', Cargo: '', Empresa: '' } // Limpiar formulario al cambiar de página
    });
  }

  clearForm = () => {
    this.setState({ form: { id: '', Nombre: '', Document: '', Cargo: '', Empresa: '' } });
  }

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
              placeholder="Buscar empleado"
              value={this.state.searchText}
              onChange={this.handleSearch}
              style={{ width: '300px' }}
            />
            <Button color="success" onClick={this.mostrarModalInsertar}>Agregar empleado</Button>
          </div>
          
          <Table className="table table-bordered">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nombre Completo</th>
                <th>Documento</th>
                <th>Cargo</th>
                <th>Empresa</th>
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
                  <td>{elemento.Cargo}</td>
                  <td>{elemento.Empresa}</td>
                  <td>{elemento.Estado ? "Activo" : "Inactivo"}</td> 
                  <td>
                    <Button color="primary" onClick={() => this.mostrarModalEditar(elemento)}><FaEdit /></Button>{' '}
                    <Button color="danger" onClick={() => this.eliminar(elemento)}><FaTrashAlt /></Button>{' '}
                    <Button 
                      color={elemento.Estado ? "success" : "secondary"} 
                      onClick={(e) => { e.stopPropagation(); this.cambiarEstado(elemento.id); }}
                      size="sm"
                      className="mr-1" // Asegura que el botón tenga el mismo margen
                      style={{ padding: '0.375rem 0.75rem' }} // Ajusta el tamaño del botón
                    >
                      {elemento.Estado ? "On" : "Off"}
                    </Button> 
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Paginador */}
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
              <label>Documento:</label>
              <input className="form-control" name="Document" type="number" onChange={this.handleChange} />
            </FormGroup>

            <FormGroup>
              <label>Cargo: </label>
              <input className="form-control" name="Cargo" type="text" onChange={this.handleChange} />
            </FormGroup>

            <FormGroup>
              <label>Empresa: </label>
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
              <h3>Editar un registro</h3>
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
              <label>Documento:</label>
              <input className="form-control" name="Document" type="number" onChange={this.handleChange} value={this.state.form.Document} />
            </FormGroup>

            <FormGroup>
              <label>Cargo: </label>
              <input className="form-control" name="Cargo" type="text" onChange={this.handleChange} value={this.state.form.Cargo} />
            </FormGroup>

            <FormGroup>
              <label>Empresa: </label>
              <input className="form-control" name="Empresa" type="text" onChange={this.handleChange} value={this.state.form.Empresa} />
            </FormGroup>
            <ModalFooter>
              <Button color="primary" onClick={this.editar}>Editar</Button>
              <Button color="danger" onClick={this.ocultarModalEditar}>Cancelar</Button>
            </ModalFooter>
          </ModalBody>
        </Modal>
      </>
    );
  }
}

export default Empleados;
