import React, { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaTrashAlt } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { PlusOutlined } from "@ant-design/icons";
import toast, { Toaster } from "react-hot-toast";
import "../../../assets/css/App.css";

const Insumos = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(getInitialFormState());
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    
    const [formErrors, setFormErrors] = useState({});
    const itemsPerPage = 10;

    const measurementUnits = [ // Lista de opciones para el desplegable
        { value: 'kg', label: 'Kilogramos (kg)' },
        { value: 'g', label: 'Gramos (g)' },
        { value: 'mg', label: 'Miligramos (mg)' },
        { value: 'lb', label: 'Libras (lb)' },
        { value: 'oz', label: 'Onzas (oz)' },
        { value: 'L', label: 'Litros (L)' },
        { value: 'mL', label: 'Mililitros (mL)' },
        { value: 'gal', label: 'Galones (gal)' },
        { value: 'm', label: 'Metros (m)' },
        { value: 'cm', label: 'Centímetros (cm)' },
        { value: 'mm', label: 'Milímetros (mm)' },
        { value: 'unidad', label: 'Unidad(es)' },
        { value: 'docena', label: 'Docena(s)' },
        { value: 'gramos', label: 'Gramos (gramos)' },
        { value: 'kilogramos', label: 'Kilogramos (kilogramos)' },
        { value: 'miligramos', label: 'Miligramos (miligramos)' },
        { value: 'libras', label: 'Libras (libras)' },
        { value: 'onzas', label: 'Onzas (onzas)' },
        { value: 'litros', label: 'Litros (litros)' },
        { value: 'mililitros', label: 'Mililitros (mililitros)' },
        { value: 'galones', label: 'Galones (galones)' },
        { value: 'metros', label: 'Metros (metros)' },
        { value: 'centimetros', label: 'Centímetros (centimetros)' },
        { value: 'milimetros', label: 'Milímetros (milimetros)' },
        { value: 'unidades', label: 'Unidades (unidades)' },
        { value: 'docenas', label: 'Docenas (docenas)' },
        // Agrega más unidades aquí si es necesario
    ];

    useEffect(() => {
        fetchData();
    }, []);

    function getInitialFormState() {
        return {
            idSupplier: '',
            supplierName: '',
            measurementUnit: '',
            status: true
        };
    }

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:3000/supplier');
            setData(response.data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error('No se pudo conectar con el servidor');
        }
    };

    const handleTableSearch = (e) => {
        setTableSearchText(e.target.value.toLowerCase());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        setFormErrors({ ...formErrors, [name]: '' }); // Clear individual error on change
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const validateForm = () => {  // Frontend validation
        const errors = {};
        let isValid = true;

        if (!form.supplierName?.trim()) {
            errors.supplierName = "El nombre del insumo es requerido.";
            isValid = false;
        } else if (form.supplierName.length < 3) {
            errors.supplierName = "El nombre del insumo debe tener al menos 3 caracteres";
            isValid = false;
        } else if (!/^[a-zA-Z0-9\s]+$/.test(form.supplierName)) {
            errors.supplierName = "El nombre solo puede contener letras, números y espacios";
            isValid = false;
        }

        if (!form.measurementUnit) { // Validamos si se seleccionó una opción
            errors.measurementUnit = "La unidad de medida es requerida.";
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;  // Stop if frontend validation fails
        }

        try {
            const supplierData = { ...form };
            let response;
            let url = 'http://localhost:3000/supplier';
            let method = 'post';

            if (isEditing) {
                if (!form.idSupplier) {
                    toast.error("ID de insumo no válido para la actualización.");
                    return;
                }
                url = `http://localhost:3000/supplier/${form.idSupplier}`;
                method = 'put';
            }

            const config = {
                method: method,
                url: url,
                data: supplierData
            };

            response = await axios(config);

            toast.success(isEditing ? "Insumo actualizado exitosamente" : "Insumo agregado exitosamente");
            fetchData();
            resetForm();
            setShowForm(false);
            setIsEditing(false);

        } catch (error) {
            console.error("Error en la solicitud:", error);
            if (error.response && error.response.data && error.response.data.errors) {
                // Backend validation errors
                const backendErrors = {};
                error.response.data.errors.forEach(err => {
                    backendErrors[err.path] = err.msg;
                });
                setFormErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
            } else if (error.response) {
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

    const confirmStatusChange = (idSupplier) => {
        toast((t) => (
            <div>
                <p>¿Desea cambiar el estado del insumo?</p>
                <div>
                    <Button color="primary" onClick={() => {
                        handleStatusChange(idSupplier);
                        toast.dismiss(t.id);
                    }}>
                        Cambiar
                    </Button>
                    <Button color="secondary" onClick={() => toast.dismiss(t.id)}>Cancelar</Button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const confirmDelete = (supplier) => {
        toast((t) => (
            <div>
                <p>¿Desea eliminar el insumo?</p>
                <div>
                    <Button
                        color="primary"
                        onClick={async () => {
                            try {
                                await axios.delete(`http://localhost:3000/supplier/${supplier.idSupplier}`);
                                const updatedData = data.filter(sup => sup.idSupplier !== supplier.idSupplier);
                                setData(updatedData);
                                toast.success('Insumo eliminado exitosamente');
                            } catch (error) {
                                console.error("Error deleting supplier:", error);
                                toast.error('Error al eliminar el insumo');
                            }
                            toast.dismiss(t.id);
                        }}
                    >
                        Eliminar
                    </Button>
                    <Button color="secondary" onClick={() => toast.dismiss(t.id)}>
                        Cancelar
                    </Button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleStatusChange = async (idSupplier) => {
        try {
            const supplier = data.find(sup => sup.idSupplier === idSupplier);
            if (!supplier) {
                toast.error("Insumo no encontrado");
                return;
            }

            const updatedStatus = !supplier.status;
            await axios.patch(`http://localhost:3000/supplier/${idSupplier}`, { status: updatedStatus });

            const updatedData = data.map(sup =>
                sup.idSupplier === idSupplier ? { ...sup, status: updatedStatus } : sup
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

    

    const startEditing = (item) => {
        setForm(item);
        setIsEditing(true);
        setShowForm(true);
    };

    const toggleFormModal = () => {
        setShowForm(!showForm);
        setIsEditing(false);
        resetForm();
    };

    return (
        <Container>
            <Toaster position="top-center" />
            <br />

            <>
                <h2>Lista de insumos</h2>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <Input
                        type="text"
                        placeholder="Buscar insumos"
                        value={tableSearchText}
                        onChange={handleTableSearch}
                        style={{ width: '50%' }}
                    />
                    <Button style={{ backgroundColor: '#228b22', color: 'black' }} onClick={toggleFormModal}>
                        Agregar insumo
                        <PlusOutlined style={{ fontSize: '16px', color: 'black', padding: '5px' }} />
                    </Button>
                </div>

                <Table
                    className="table table-borderless table-hover"
                    style={{ borderRadius: "10px", overflow: "hidden" }}
                >
                    <thead style={{ backgroundColor: '#f2f2f2' }}>
                        <tr>
                            <th className="text-center">ID</th>
                            <th>Nombre</th>
                            <th>Unidad de medida</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idSupplier} style={{ borderBottom: '1px solid #e9ecef' }}>
                                    <td className="text-center">{item.idSupplier}</td>
                                    <td>{item.supplierName}</td>
                                    <td>{item.measurementUnit}</td>
                                    <td>
                                        <Button
                                            color={item.status ? "success" : "secondary"}
                                            onClick={() => confirmStatusChange(item.idSupplier)}
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
                        <li key={number} className={`page-item ${currentPage === number ? "active" : ""}`}>
                            <Button className="page-link" onClick={() => handlePageChange(number)}>
                                {number}
                            </Button>
                        </li>
                    ))}
                </ul>
            </>

            {/* Form Modal */}
            <Modal isOpen={showForm} toggle={toggleFormModal}>
                <ModalHeader toggle={toggleFormModal}>
                    {isEditing ? 'Editar Insumo' : 'Agregar Insumo'}
                </ModalHeader>
                <ModalBody>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <label style={{ fontSize: "15px", padding: "5px" }}>
                                    Nombre
                                </label>
                                <Input
                                    type="text"
                                    name="supplierName"
                                    value={form.supplierName}
                                    onChange={handleChange}
                                    placeholder="Nombre del insumo"
                                    style={{ border: "1px solid black" }}
                                    className={formErrors.supplierName ? "is-invalid" : ""}
                                />
                                {formErrors.supplierName && (
                                    <div className="invalid-feedback text-center">
                                        {formErrors.supplierName}
                                    </div>
                                )}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <label style={{ fontSize: "15px", padding: "5px" }}>
                                    Unidad de Medida
                                </label>
                                <Input // Cambiado de Input de texto a Select
                                    type="select"
                                    name="measurementUnit"
                                    value={form.measurementUnit}
                                    onChange={handleChange}
                                    style={{ border: "1px solid black" }}
                                    className={formErrors.measurementUnit ? "is-invalid" : ""}
                                >
                                    <option value="">Seleccione una unidad</option> {/*  <-- Opción por defecto */}
                                    {measurementUnits.map(unit => (
                                        <option key={unit.value} value={unit.value}>
                                            {unit.label}
                                        </option>
                                    ))}
                                </Input>
                                {formErrors.measurementUnit && (
                                    <div className="invalid-feedback text-center">
                                        {formErrors.measurementUnit}
                                    </div>
                                )}
                            </FormGroup>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <Button style={{ background: "#2e8322", marginRight: "10px" }} onClick={handleSubmit}>
                        {isEditing ? "Actualizar" : "Guardar"}
                    </Button>
                    <Button style={{ background: "#6d0f0f" }} onClick={toggleFormModal}>
                        Cancelar
                    </Button>
                </ModalFooter>
            </Modal>

            <Toaster position="top-center" reverseOrder={false} />

            {/* Modal de detalle */}
            <Modal
                isOpen={detailModalOpen}
                toggle={toggleDetailModal}
                style={{ maxWidth: "40%", marginTop: "10px", marginBottom: "3px" }}
            >
              {/* ... (resto del código) ... */}
            </Modal>
        </Container>
    );
};

export default Insumos;