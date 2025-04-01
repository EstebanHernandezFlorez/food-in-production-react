import React, { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaTrashAlt, FaEye } from 'react-icons/fa';
import { FiEdit } from "react-icons/fi";
import { PlusOutlined } from '@ant-design/icons';
import toast, { Toaster } from 'react-hot-toast';
import '../../../App.css';

const Empleados = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(getInitialFormState());
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [formErrors, setFormErrors] = useState({});
    const itemsPerPage = 10;

    const tiposDocumento = [
        { value: "CC", label: "Cédula de Ciudadanía" },
        { value: "CE", label: "Cédula de Extranjería" },
        { value: "PA", label: "Pasaporte" },
        { value: "PEP", label: "Permiso Especial de Permanencia" },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    function getInitialFormState() {
        return {
            idEmployee: '',
            fullName: '',
            typeDocument: '',
            document: '',
            cellPhone: '',
            email: '',
            dateOfEntry: '',
            emergencyContact: '',
            Relationship: '',
            nameFamilyMember: '',
            BloodType: '',
            socialSecurityNumber: '',
            Address: '',
            contractType: '',
            status: true
        };
    }

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:3000/employee');
            setData(response.data);
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error('No se pudo conectar con el servidor');
        }
    };

    const handleTableSearch = (e) => {
        setTableSearchText(e.target.value.toLowerCase());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        setFormErrors({ ...formErrors, [name]: false });
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;
        const requiredFields = ['fullName', 'typeDocument', 'document', 'cellPhone', 'email', 'dateOfEntry', 'emergencyContact', 'Relationship', 'nameFamilyMember', 'BloodType', 'socialSecurityNumber', 'Address', 'contractType'];

        requiredFields.forEach(field => {
            // Check if the field exists and is a string before attempting to trim
            if (typeof form[field] === 'string' && !form[field]?.trim()) {
                errors[field] = true;
                isValid = false;
            } else if (typeof form[field] !== 'string' && !form[field]) {
                // Handle cases where the field might be a number or other type
                errors[field] = true;
                isValid = false;
            }
        });

        setFormErrors(errors);

        if (!isValid) {
            toast.warn("Por favor, ingrese todos los campos obligatorios");
        }
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const employeeExists = data.some(emp => emp.document?.toString() === form.document?.toString() && emp.idEmployee !== form.idEmployee);

            if (employeeExists) {
                toast.error("El empleado ya existe. Ingrese un documento diferente.");
                return;
            }

            const employeeData = { ...form };
            let response;

            if (isEditing) {
                if (!form.idEmployee) {
                    toast.error("ID de empleado no válido para la actualización.");
                    return; // Sale de la función si el ID no es válido
                }

                // Convierte idEmployee a número y verifica que sea válido
                const idEmployee = parseInt(form.idEmployee, 10);
                if (isNaN(idEmployee) || idEmployee <= 0) {
                    toast.error("ID de empleado no válido. Debe ser un número entero positivo.");
                    return;
                }

                try {
                    response = await axios.put(`http://localhost:3000/employee/${idEmployee}`, employeeData);
                } catch (updateError) {
                    console.error("Error al actualizar el empleado:", updateError);
                    toast.error(`Error al actualizar: ${updateError.message}`);

                    if (updateError.response) {
                        // El servidor respondió con un código de error
                        console.error("Detalles del error del servidor:", updateError.response.data);
                        toast.error(`Error del servidor: ${JSON.stringify(updateError.response.data)}`);
                    }
                    return; // Sale de la función si hay un error en la actualización
                }

            } else {
                response = await axios.post('http://localhost:3000/employee', employeeData);
            }


            toast.success(isEditing ? "Empleado actualizado exitosamente" : "Empleado agregado exitosamente");

            fetchData();
            resetForm();
            setShowForm(false);
            setIsEditing(false);
        } catch (error) {
            console.error("Error en la solicitud:", error);

            if (error.response) {
                toast.error(`Error del servidor: ${JSON.stringify(error.response.data)}`);
            } else {
                toast.error("Error de conexión. Verifica la conexión con el servidor.");
            }
        }
    };

    const resetForm = () => {
        setForm(getInitialFormState());
        setFormErrors({});
    };

    const confirmStatusChange = (idEmployee) => {
        toast((t) => (
            <div>
                <p>¿Desea cambiar el estado del usuario?</p>
                <div>
                    <Button color="primary" onClick={() => {
                        handleStatusChange(idEmployee);
                        toast.dismiss(t.id);
                    }}>
                        Cambiar
                    </Button>
                    <Button color="secondary" onClick={() => toast.dismiss(t.id)}>Cancelar</Button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const confirmDelete = (employee) => {
        toast((t) => (
            <div>
                <p>¿Desea eliminar el empleado?</p>
                <div>
                    <Button
                        color="primary"
                        onClick={async () => {
                            try {
                                await axios.delete(`http://localhost:3000/employee/${employee.idEmployee}`);
                                const updatedData = data.filter(emp => emp.idEmployee !== employee.idEmployee);
                                setData(updatedData);
                                toast.success('Empleado eliminado exitosamente');
                            } catch (error) {
                                console.error("Error deleting employee:", error);
                                toast.error('Error al eliminar el empleado');
                            }
                            toast.dismiss(t.id);
                        }}
                    >
                        Eliminar
                    </Button>
                    <Button
                        color="secondary"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleStatusChange = async (idEmployee) => {
        try {
            const employee = data.find(emp => emp.idEmployee === idEmployee);
            if (!employee) {
                toast.error("Empleado no encontrado");
                return;
            }

            const updatedStatus = !employee.status;
            await axios.patch(`http://localhost:3000/employee/${idEmployee}`, { status: updatedStatus });

            const updatedData = data.map(emp =>
                emp.idEmployee === idEmployee ? { ...emp, status: updatedStatus } : emp
            );
            setData(updatedData);

            toast.success(`Estado actualizado a ${updatedStatus ? 'Activo' : 'Inactivo'}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Error al actualizar estado");
        }
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(value =>
            value && value.toString().toLowerCase().includes(tableSearchText)
        )
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const pageNumbers = [...Array(Math.ceil(filteredData.length / itemsPerPage)).keys()].map(i => i + 1);

    const toggleDetailModal = () => setDetailModalOpen(!detailModalOpen);

    const viewDetails = (item) => {
        setSelectedItem(item);
        toggleDetailModal();
    };

    const startEditing = (item) => {
        setForm(item);
        setIsEditing(true);
        setShowForm(true);
    };

    return (
        <Container>
            <Toaster position="top-center" />
            <br />

            {!showForm && (
                <>
                    <h2>Lista de empleados</h2>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Input
                            type="text"
                            placeholder="Buscar empleados"
                            value={tableSearchText}
                            onChange={handleTableSearch}
                            style={{ width: '50%' }}
                        />
                        <Button style={{ backgroundColor: '#228b22', color: 'black' }} onClick={() => {
                            resetForm();
                            setIsEditing(false);
                            setShowForm(true);
                        }}>
                            Agregar empleado
                            <PlusOutlined style={{ fontSize: '16px', color: 'black', padding: '5px' }} />
                        </Button>
                    </div>

                    <Table className="table table-borderless table-hover" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                        <thead style={{ backgroundColor: '#f2f2f2' }}>
                            <tr>
                                <th className="text-center">ID</th>
                                <th>Nombre</th>
                                <th>Documento</th>
                                <th className="text-center">Fecha de Ingreso</th>
                                <th className="text-center">Dirección</th>
                                <th className="text-center">Tipo de Contrato</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.idEmployee} style={{ borderBottom: '1px solid #e9ecef' }}>
                                        <td className="text-center">{item.idEmployee}</td>
                                        <td>{item.fullName}</td>
                                        <td>{item.document}</td>
                                        <td className="text-center">{item.dateOfEntry}</td>
                                        <td className="text-center">{item.Address}</td>
                                        <td className="text-center">{item.contractType}</td>
                                        <td>
                                            <Button
                                                color={item.status ? "success" : "secondary"}
                                                onClick={() => confirmStatusChange(item.idEmployee)}
                                                className="btn-sm"
                                                style={{ padding: '0.25rem 0.5rem' }}
                                            >
                                                {item.status ? "Activo" : "Inactivo"}
                                            </Button>
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-between align-items-center w-100">
                                                <Button
                                                    color="dark"
                                                    onClick={() => startEditing(item)}
                                                    className="btn-sm"
                                                    style={{ padding: '0.25rem 0.5rem' }}
                                                >
                                                    <FiEdit style={{ fontSize: '0.75rem' }} />
                                                </Button>

                                                <Button
                                                    color="danger"
                                                    onClick={() => confirmDelete(item)}
                                                    className="btn-sm"
                                                    style={{ padding: '0.15rem 0.5rem' }}
                                                >
                                                    <FaTrashAlt style={{ fontSize: '0.75rem' }} />
                                                </Button>

                                                <Button
                                                    onClick={() => viewDetails(item)}
                                                    className="btn-sm"
                                                    style={{
                                                        backgroundColor: '#F5C300',
                                                        border: 'none',
                                                        padding: '0.45rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 'auto'
                                                    }}
                                                >
                                                    <FaEye style={{ color: 'black', fontSize: '0.75rem', top: '5px' }} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="13" className="text-center">No hay datos disponibles</td>
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

            {showForm && (
                <div>
                    <div className="d-flex justify-content-center align-items-center ">
                        <h2 className="text-end">{isEditing ? 'Editar Empleado' : 'Agregar Empleado'}</h2>
                    </div>
                    <br />

                  <Row>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Nombre Completo</label>
                              <Input
                                  type="text"
                                  name="fullName"
                                  value={form.fullName}
                                  onChange={handleChange}
                                  placeholder="Nombre del Empleado"
                                  style={{ border: '1px solid black' }}
                                  className={formErrors.fullName ? 'is-invalid' : ''}
                              />
                              {formErrors.fullName && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Tipo Documento</label>
                              <Input
                                  type="select"
                                  name="typeDocument"
                                  value={form.typeDocument}
                                  onChange={handleChange}
                                  className={formErrors.typeDocument ? 'is-invalid' : ''}
                                  style={{ border: '1px solid black' }}
                              >
                                  <option value="">Seleccione un tipo de documento</option>
                                  {tiposDocumento.map((tipo) => (
                                      <option key={tipo.value} value={tipo.value}>
                                          {tipo.label}
                                      </option>
                                  ))}
                              </Input>
                              {formErrors.typeDocument && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Documento</label>
                              <Input
                                  type="text"
                                  name="document"
                                  value={form.document}
                                  onChange={handleChange}
                                  placeholder="Número de Documento"
                                  className={formErrors.document ? 'is-invalid' : ''}
                                  style={{ border: '1px solid black' }}
                              />
                              {formErrors.document && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                  </Row>

                  <Row>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Celular</label>
                              <Input
                                  type="number"
                                  name="cellPhone"
                                  value={form.cellPhone}
                                  onChange={handleChange}
                                  placeholder="celular del Empleado"
                                  style={{ border: '1px solid black' }}
                                  className={formErrors.cellPhone ? 'is-invalid' : ''}
                              />
                              {formErrors.cellPhone && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Correo</label>
                              <Input
                                  type="email"
                                  name="email"
                                  value={form.email}
                                  onChange={handleChange}
                                  placeholder="email del Empleado"
                                  style={{ border: '1px solid black' }}
                                  className={formErrors.email ? 'is-invalid' : ''}
                              />
                              {formErrors.email && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Dirección</label>
                              <Input
                                  type="text"
                                  name="Address"
                                  value={form.Address}
                                  onChange={handleChange}
                                  placeholder="Dirección"
                                  style={{ border: '1px solid black' }}
                                  className={formErrors.Address ? 'is-invalid' : ''}
                              />
                              {formErrors.Address && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                  </Row>

                  <Row>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Contacto de Emergencia</label>
                              <Input
                                  type="text"
                                  name="emergencyContact"
                                  value={form.emergencyContact}
                                  onChange={handleChange}
                                  placeholder="Número de Contacto de Emergencia"
                                  className={formErrors.emergencyContact ? 'is-invalid' : ''}
                                  style={{ border: '1px solid black' }}
                              />
                              {formErrors.emergencyContact && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Nombre Familiar</label>
                              <Input
                                  type="text"
                                  name="nameFamilyMember"
                                  value={form.nameFamilyMember}
                                  onChange={handleChange}
                                  placeholder="Nombre del Familiar"
                                  style={{ border: '1px solid black' }}
                                  className={formErrors.nameFamilyMember ? 'is-invalid' : ''}
                              />
                              {formErrors.nameFamilyMember && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Parentesco</label>
                              <Input
                                  type="text"
                                  name="Relationship"
                                  value={form.Relationship}
                                  onChange={handleChange}
                                  placeholder="Parentesco"
                                  style={{ border: '1px solid black' }}
                                  className={formErrors.Relationship ? 'is-invalid' : ''}
                              />
                              {formErrors.Relationship && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                  </Row>

                  <Row>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Grupo Sanguíneo</label>
                              <Input
                                  type="text"
                                  name="BloodType"
                                  value={form.BloodType}
                                  onChange={handleChange}
                                  placeholder="Grupo Sanguíneo"
                                  className={formErrors.BloodType ? 'is-invalid' : ''}
                                  style={{ border: '1px solid black' }}
                              />
                              {formErrors.BloodType && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Número de Seguridad Social</label>
                              <Input
                                  type="text"
                                  name="socialSecurityNumber"
                                  value={form.socialSecurityNumber}
                                  onChange={handleChange}
                                  placeholder="Número de Seguridad Social"
                                  style={{ border: '1px solid black' }}
                                  className={formErrors.socialSecurityNumber ? 'is-invalid' : ''}
                              />
                              {formErrors.socialSecurityNumber && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Fecha de Ingreso</label>
                              <Input
                                  type="date"
                                  name="dateOfEntry"
                                  value={form.dateOfEntry}
                                  onChange={handleChange}
                                  className={formErrors.dateOfEntry ? 'is-invalid' : ''}
                                  style={{ border: '1px solid black' }}
                              />
                              {formErrors.dateOfEntry && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                  </Row>

                  <Row>
                      <Col md={4}>
                          <FormGroup>
                              <label style={{ fontSize: '15px', padding: '5px' }}>Tipo de Contrato</label>
                              <Input
                                  type="text"
                                  name="contractType"
                                  value={form.contractType}
                                  onChange={handleChange}
                                  placeholder="Tipo de Contrato"
                                  style={{ border: '1px solid black' }}
                                  className={formErrors.contractType ? 'is-invalid' : ''}
                              />
                              {formErrors.contractType && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                          </FormGroup>
                      </Col>
                      <Col md={4}>
                      </Col>
                      <Col md={4}>
                      </Col>
                  </Row>


                  <div className="d-flex justify-content-center ">
                      <Button style={{ background: '#2e8322', marginRight: '10px' }} onClick={handleSubmit}>
                          {isEditing ? 'Actualizar' : 'Guardar'}
                      </Button>

                      <Button style={{ background: '#6d0f0f' }} onClick={() => { setShowForm(false); setIsEditing(false); }}>
                          Cancelar
                      </Button>
                  </div>
              </div>
            )}

            <Toaster
                position="top-center"
                reverseOrder={false}
            />

            {/* Modal de detalle */}
            <Modal isOpen={detailModalOpen} toggle={toggleDetailModal} style={{ maxWidth: '40%', marginTop: '10px', marginBottom: '3px' }}>
                <ModalHeader toggle={toggleDetailModal} style={{ color: '#8C1616' }}>
                    Detalles del Empleado
                </ModalHeader>
                <ModalBody style={{ overflowY: 'auto', maxHeight: 'calc(120vh - 120px)' }}>
                    {selectedItem && (
                        <div style={{ padding: '10px' }}>
                            <p><strong>Nombre:</strong> {selectedItem.fullName}</p>
                            <p><strong>Documento:</strong> {selectedItem.document}</p>
                            <p><strong>Fecha de Ingreso:</strong> {selectedItem.dateOfEntry}</p>
                            <p><strong>Celular:</strong> {selectedItem.cellPhone}</p>
                            <p><strong>Email:</strong> {selectedItem.email}</p>
                            <p><strong>Contacto de Emergencia:</strong> {selectedItem.emergencyContact}</p>
                            <p><strong>Parentesco:</strong> {selectedItem.Relationship}</p>
                            <p><strong>Nombre del Familiar:</strong> {selectedItem.nameFamilyMember}</p>
                            <p><strong>Grupo Sanguíneo:</strong> {selectedItem.BloodType}</p>
                            <p><strong>Número de Seguro Social:</strong> {selectedItem.socialSecurityNumber}</p>
                            <p><strong>Dirección:</strong> {selectedItem.Address}</p>
                            <p><strong>Tipo de Contrato:</strong> {selectedItem.contractType}</p>
                            <p><strong>Estado:</strong> {selectedItem.status ? 'Activo' : 'Inactivo'}</p>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter style={{ display: 'flex', justifyContent: 'flex-end', padding: 0 }}>
                    <Button style={{ background: '#6d0f0f' }} onClick={toggleDetailModal}>Cerrar</Button>
                </ModalFooter>
            </Modal>
        </Container>
    );
};

export default Empleados;