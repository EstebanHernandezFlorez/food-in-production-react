import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';
import { Select } from 'antd';



const initialData = [
  {id: 1,HorayFechaInicial: "07:05 am 04/09/2024", HorayFechaFinal: "08:00 am 05/09/2024", Producto: "Carne de hamburguesa", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 2,HorayFechaInicial: "08:05 am 04/09/2024", HorayFechaFinal: "09:00 am 05/09/2024", Producto: "Guacamole", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 3,HorayFechaInicial: "07:05 am 06/09/2024", HorayFechaFinal: "08:00 am 06/09/2024", Producto: "Postre", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 4,HorayFechaInicial: "07:05 am 07/09/2024", HorayFechaFinal: "08:00 am 07/09/2024", Producto: "Cañon", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 5,HorayFechaInicial: "07:05 am 08/09/2024", HorayFechaFinal: "08:00 am 09/09/2024", Producto: "Postre", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 6,HorayFechaInicial: "07:05 am 10/09/2024", HorayFechaFinal: "08:00 am 10/09/2024", Producto: "Arroz", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
];

const OrdendeProduccion = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    HorayFechaInicial:'',
    HorayFechaFinal:'',
    Producto:'',
    CantidadInicial:'',
    CantidadFinal:'',
    Estado:'',
    HorayFechadeEstado:'',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableSearchText, setTableSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false); // Estado para el modal de edición
  const itemsPerPage = 7;

  // States for validation
  const [formErrors, setFormErrors] = useState({
    TipoDocumento:false,
    Documento: false,
    Celular:false,
    NombreCompleto: false,
    Correo:false,
    Rol: false,
    Contraseña: false,
    Confirmarcontraseña: false
  });

  const handleTableSearch = (e) => {
    setTableSearchText(e.target.value.toLowerCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]:   value
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  const validateForm = () => {
    const errors = {
      HorayFechaInicial:!form.HorayFechaInicial,
      HorayFechaFinal: !form.HorayFechaFinal,
      Producto: !form.Producto,
      CantidadInicial: !form.CantidadInicial,
      CantidadFinal: !form.CantidadFinal,
      Estado: !form.Estado,
      HorayFechadeEstado: !form.HorayFechadeEstado,
     
    };
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };
  
  const handleSubmit = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const {HorayFechaInicial,HorayFechaFinal,Producto,CantidadInicial,CantidadFinal,Estado,HorayFechadeEstado} = form;
  
    // const usuarioExistente = data.find(registro => registro.Documento.toString() === Documento.toString());
    // if (usuarioExistente) {
    //   openSnackbar("El usuario ya existe. Por favor, ingrese un documento de usuario diferente.", 'error');
    //   return;
    // }
  
    const nuevaorden = {
      ...form,
      id: data.length ? Math.max(...data.map(user => user.id)) + 1 : 1
    };
  
    setData([...data, nuevaorden]);
    setForm({
      id: '',
      HorayFechaInicial:'',
      HorayFechaFinal:'',
      Producto:'',
      CantidadInicial:'',
      CantidadFinal:'',
      Estado:'',
      HorayFechadeEstado:'',
    });
    setShowForm(false);
    openSnackbar("orden agregada exitosamente", 'success');
  };

  const editar = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }
  
    const usuarioExistente = data.find(
      (registro) => registro.Documento.toString() === form.Documento.toString() &&
      registro.id !== form.id
    );
  
    if (usuarioExistente) {
      openSnackbar("Ya existe un usuario con el mismo documento. Por favor, ingresa un documento diferente.", 'error');
      return;
    }
  
    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );
  
    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false); // Cierra el modal después de actualizar
    openSnackbar("Usuario editado exitosamente", 'success');
  };

  const eliminar = (dato) => {
    if (window.confirm(`¿Realmente desea eliminar el registro ${dato.id}?`)) {
      const updatedData = data.filter(registro => registro.id !== dato.id);
      setData(updatedData);
      openSnackbar("Usuarioq eliminado exitosamente", 'success');
    }
  };

  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });
  
    setData(updatedData);
    openSnackbar("Estado del usuario actualizado exitosamente", 'success');
  };
  

  const filteredData = data.filter(item =>
    item.HorayFechaInicial.toLowerCase().includes(tableSearchText) ||
    item.HorayFechaFinal.toString().includes(tableSearchText) ||
    item.Producto.toLowerCase().includes(tableSearchText) ||
    item.CantidadInicial.toString().includes(tableSearchText)||
    item.CantidadFinal.toString().includes(tableSearchText)||
    item.Estado.toString().includes(tableSearchText)||
    item.HorayFechadeEstado.toString().includes(tableSearchText)
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
      {/* Mostrar la sección de búsqueda y el botón solo si no se está mostrando el formulario */}
      {!showForm && (
        <>
          <h2 className="mb-5 text-center">Ordenes de producciòn</h2>
          <div className="d-flex justify-content-between align-items-center mb-5">
            <Input
              type="text"
              placeholder="Buscar orden de producciòn en la tabla"
              value={tableSearchText}
              onChange={handleTableSearch}
              style={{ width: '50%' }}
            />
            
         
            <Button color="success" onClick={() => { setForm({ 
              id: '',
              HorayFechaInicial:'',
              HorayFechaFinal:'',
              Producto:'',
              CantidadInicial:'',
              CantidadFinal:'',
              Estado:'',
              HorayFechadeEstado:'',
              Estado: true }); setIsEditing(false); setShowForm(true); }}>
              Crear orden de producciòn
            </Button>
          </div>
          <Table className="table table-sm table-hover">
            <thead>
              <tr>
                <th>Id</th>
                <th>Hora y Fecha Inicio</th>
                <th>Hora y Fecha Final</th>
                <th>Producto</th>
                <th>Cantidad Inicial</th>
                <th>Cantidad Final</th>
                <th>Estado</th>
                <th>Hora y Fecha de Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.HorayFechaInicial}</td>
                    <td>{item.HorayFechaFinal}</td>
                    <td>{item.Producto}</td>
                    <td>{item.CantidadInicial}</td>
                    <td>{item.CantidadFinal}</td>
                    <td>{item.Estado}</td>
                    <td>{item.HorayFechadeEstado}</td>
                    
                    <td>
                      <div className="d-flex align-items-center">
                        <Button color="info" onClick={() => { setForm(item); setIsEditing(true); setModalOpen(true); }} className="me-2 btn-sm">
                          <FaEdit />
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </Table>

          <ul className="pagination">
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <Button className="page-link" onClick={() => handlePageChange(number)}>
              {number}
            </Button>
          </li>
        ))}
      </ul>


        </>
      )}

      {/* Formulario de inserción */}
      {showForm && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-star" >{isEditing ? 'Editar usuario' : 'Agregar usuario'}</h2>
           
          </div>     
          <br />
          <Row>
          <Col md={4}>
           <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>
                Tipo Documento
              </label>
              <Input
              type="select"  // Cambiado a "select"
              name="TipoDocumento"
              value={form.TipoDocumento}
              onChange={handleChange}
                className={`form-control ${formErrors.TipoDocumento ? 'is-invalid' : ''}`}
                 >
             <option value="">Seleccione un tipo de documento</option> 
                {tiposDocumento.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
             {tipo.label}
            </option>
              ))}
            </Input>
          {formErrors.TipoDocumento && <div className="invalid-feedback">Este campo es obligatorio.</div>}
          </FormGroup>
          </Col>

            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Documento</label>
                <Input
                  type="text"
                  name="Documento"
                  value={form.Documento}
                  onChange={handleChange}
                  placeholder="Número de documento"
                  className={`form-control ${formErrors.Documento ? 'is-invalid' : ''}`}
                />
                {formErrors.Documento && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Celular</label>
                <Input
                  type="number"
                  name="Celular"
                  value={(form.Celular)}
                  onChange={handleChange}
                  placeholder="Celular"
                  className={`form-control ${formErrors.Celular ? 'is-invalid' : ''}`}
                />
                {formErrors.Celular && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Nombre Completo</label>
                <Input
                  type="text"
                  name="NombreCompleto"
                  value={form.NombreCompleto}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  className={`form-control ${formErrors.NombreCompleto ? 'is-invalid' : ''}`}
                />
                {formErrors.NombreCompleto && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Correo</label>
                <Input
                  type="email"
                  name="Correo"
                  value={form.Correo}
                  onChange={handleChange}
                  placeholder="Número de Correo"
                  className={`form-control ${formErrors.Correo ? 'is-invalid' : ''}`}
                />
                {formErrors.Correo && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
  <FormGroup>
    <label style={{ fontSize: '15px', padding: '5px' }}>
      Rol
    </label>
    <Input
      type="select"  // Cambiado a "select"
      name="Rol"
      value={form.Rol}
      onChange={handleChange}
      className={`form-control ${formErrors.Rol ? 'is-invalid' : ''}`}
    >
      <option value="">Seleccione un rol</option> 
      {roles.map((role) => (
        <option key={role.id_role} value={role.id_role}>
          {role.name}
        </option>
      ))}
    </Input>
    {formErrors.Rol && <div className="invalid-feedback">Este campo es obligatorio.</div>}
  </FormGroup>
</Col>

<Col md={4}>
  <FormGroup>
    <label style={{ fontSize: '15px', padding: '5px' }}>Contraseña</label>
    <Input
      type="password"  // Cambiado a "password"
      name="Contraseña"
      value={form.Contraseña}
      onChange={handleChange}
      placeholder="Contraseña"
      className={`form-control ${formErrors.Contraseña ? 'is-invalid' : ''}`}
    />
    {formErrors.Contraseña && <div className="invalid-feedback">{formErrors.Contraseña}</div>}
  </FormGroup>
</Col>
<Col md={4}>
  <FormGroup>
    <label style={{ fontSize: '15px', padding: '5px' }}>Confirmar contraseña</label>
    <Input
      type="password"  // Cambiado a "password"
      name="Confirmarcontraseña"
      value={form.Confirmarcontraseña}
      onChange={handleChange}
      placeholder="Confirmar contraseña"
      className={`form-control ${formErrors.Confirmarcontraseña ? 'is-invalid' : ''}`}
    />
    {formErrors.Confirmarcontraseña && <div className="invalid-feedback">{formErrors.Confirmarcontraseña}</div>}
  </FormGroup>
</Col>

          </Row>
          <div className="d-flex justify-content-star mt-3">
            <Button style={{background:'#2e8322'}} onClick={handleSubmit}>
              {isEditing ? 'Actualizar' : 'Agregar'}
            </Button>
            
            <Button style={{background:'#6d0f0f'}} onClick={() => { setShowForm(false); setIsEditing(false); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
    <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
  <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
    Editar Usuario
  </ModalHeader>
  <ModalBody>
    <Row>
      <Col md={4}>
        <FormGroup>
          <label>Tipo Documento</label>
          <Input
            type="text"
            name="TipoDocumento"
            readOnly
            value={form.TipoDocumento}
            placeholder="Tipo Documento del usuario"
            className={`form-control ${formErrors.TipoDocumento ? 'is-invalid' : ''}`}
          />
          {formErrors.TipoDocumento && <div className="invalid-feedback">Este campo es obligatorio.</div>}
        </FormGroup>
      </Col>
      <Col md={4}>
        <FormGroup>
          <label>Documento</label>
          <Input
            type="text"
            name="Documento"
            readOnly
            value={form.Documento}
            placeholder="Número de documento"
            className={`form-control ${formErrors.Documento ? 'is-invalid' : ''}`}
          />
          {formErrors.Documento && <div className="invalid-feedback">Este campo es obligatorio.</div>}
        </FormGroup>
      </Col>
      <Col md={4}>
        <FormGroup>
          <label>Celular</label>
          <Input
            type="text"  // Corrige el typo "te" a "text"
            name="Celular"
            value={form.Celular}
            onChange={handleChange}
            placeholder="Número de contacto"
            className={`form-control ${formErrors.Celular ? 'is-invalid' : ''}`}
          />
          {formErrors.Celular && <div className="invalid-feedback">Este campo es obligatorio.</div>}
        </FormGroup>
      </Col>
    </Row>
    <Row>
      <Col md={4}>
        <FormGroup>
          <label style={{fontSize: '15px', padding: '5px'}}>Nombre Completo</label>
          <Input
            type="text"
            name="NombreCompleto"
            value={form.NombreCompleto}
            onChange={handleChange}
            placeholder="Nombre Completo"
            className={`form-control ${formErrors.NombreCompleto ? 'is-invalid' : ''}`}
          />
          {formErrors.NombreCompleto && <div className="invalid-feedback">Este campo es obligatorio.</div>}
        </FormGroup>
      </Col>
      <Col md={4}>
        <FormGroup>
          <label style={{fontSize: '15px', padding: '5px'}}>Correo</label>
          <Input
            type="email"  // Cambiado a "email" para validación automática del formato
            name="Correo"
            value={form.Correo}
            onChange={handleChange}
            placeholder="Correo Electrónico"
            className={`form-control ${formErrors.Correo ? 'is-invalid' : ''}`}
          />
          {formErrors.Correo && <div className="invalid-feedback">Este campo es obligatorio.</div>}
        </FormGroup>
      </Col>
      <Col md={4}>
        <FormGroup>
          <label style={{fontSize: '15px', padding: '5px'}}>Rol</label>
          <Input
            type="text"
            name="Rol"
            value={form.Rol}
            readOnly
            placeholder="Rol del usuario"
            className={`form-control ${formErrors.Rol ? 'is-invalid' : ''}`}
          />
          {formErrors.Rol && <div className="invalid-feedback">Este campo es obligatorio.</div>}
        </FormGroup>
      </Col>
    </Row>
  </ModalBody>
  <ModalFooter>
    <Button color="danger" onClick={() => setModalOpen(false)}>
      Cancelar
    </Button>
    <Button color="primary" onClick={editar}>
      Actualizar
    </Button>
  </ModalFooter>
</Modal>


      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OrdendeProduccion;