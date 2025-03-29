import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, FormGroup, Input, Modal, ModalHeader, ModalBody, Label } from 'reactstrap';
import { FaEye } from 'react-icons/fa';
import { PlusCircleOutlined, SelectOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import FondoIcono from '../../../assets/logoFIP.png';
import { useNavigate } from 'react-router-dom';
import ConceptSpentService from "../../services/conceptoGasto";
import toast, { Toaster } from 'react-hot-toast';

const initialFormState = {
    name: '',
    description: '',
    isBimonthly: false,
    status: true
};

const TablaGastos = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(initialFormState);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const itemsPerPage = 7;

    const [formErrors, setFormErrors] = useState({
        name: '',
        description: ''
    });

    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const concepts = await ConceptSpentService.getAllConceptSpents();
            setData(concepts);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar los datos");
        }
    };

    const handleClick = () => {
        navigate('/mano_de_obra');
    };

    const handleRendimientoEmp = () => {
        navigate('/rendimiento-empleado');
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setForm({ ...item });
        } else {
            setIsEditing(false);
            setForm(initialFormState);
        }
        setFormErrors({ name: '', description: '' });
        setApiError(null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setForm(initialFormState); // Reset the form
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const inputValue = type === 'checkbox' ? checked : value;
        setForm(prevForm => ({
            ...prevForm,
            [name]: inputValue
        }));
        setFormErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
        setApiError(null);
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = 'El nombre es obligatorio';
            isValid = false;
        }

        if (!form.description.trim()) {
            newErrors.description = 'La descripción es obligatoria';
            isValid = false;
        }

        setFormErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Por favor, ingrese todos los campos correctamente");
            return;
        }

        try {
            if (isEditing) {
                await ConceptSpentService.updateConceptSpent(form.idExpenseType, form);
                toast.success("Concepto de gasto actualizado exitosamente");
            } else {
                await ConceptSpentService.createConceptSpent(form);
                toast.success("Concepto de gasto creado exitosamente");
            }

            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error("Error creating/updating concept:", error);
            setApiError(error.response?.data?.message || "Error al guardar el concepto de gasto");
            toast.error(error.response?.data?.message || "Error al guardar el concepto de gasto");
        }
    };

    const cambiarEstado = async (idExpenseType) => {
        const conceptToUpdate = data.find(item => item.idExpenseType === idExpenseType);
        if (!conceptToUpdate) {
            toast.error("Concepto de gasto no encontrado.");
            return;
        }

        try {
            await ConceptSpentService.updateConceptSpent(idExpenseType, { status: !conceptToUpdate.status });

            setData(prevData =>
                prevData.map(item =>
                    item.idExpenseType === idExpenseType ? { ...item, status: !item.status } : item
                )
            );

            toast.success("Estado del tipo de gasto actualizado exitosamente");
        } catch (error) {
            console.error("Error updating concept status:", error);
            toast.error(error.response?.data?.message || "Error al cambiar el estado del gasto");
        }
    };

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(tableSearchText.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const pageNumbers = Array.from({ length: Math.ceil(filteredData.length / itemsPerPage) }, (_, i) => i + 1);

    return (
        <Container>
            <Toaster />
            <br />
            {!showForm && (
                <>
                    <div className="d-flex align-items-center mb-3">
                        <img
                            src={FondoIcono}
                            alt="Descripción de la Imagen"
                            style={{
                                width: '5%',
                                height: '10vh',
                                objectFit: 'cover',
                                marginRight: '20px',
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: 0 }}>Administrar Lista</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Button
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '0',
                                }}
                                onClick={handleRendimientoEmp}
                            >
                                <TeamOutlined style={{ fontSize: '34px', color: 'black' }} />
                            </Button>
                            <span style={{ fontSize: '14px', color: 'black', marginTop: '5px' }}>Empleados</span>
                        </div>
                    </div>
                    <br />
                    <h5>Gastos generales del restaurante</h5>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Input
                            type="text" placeholder="Buscar gasto" value={tableSearchText} onChange={e => setTableSearchText(e.target.value)}
                            style={{ width: '50%' }}
                        />
                        <div className="d-flex">
                            <Button
                                style={{ backgroundColor: '#228b22', color: 'black', marginRight: '10px' }}
                                onClick={handleClick}
                            >
                                Tabla de gastos mensuales
                                <SelectOutlined style={{ fontSize: '16px', color: 'black', paddingLeft: '5px' }} />
                            </Button>
                            <Button
                                style={{ backgroundColor: '#228b22', color: 'black' }}
                                onClick={() => handleOpenModal()}
                            >
                                Crear gasto
                                <PlusCircleOutlined style={{ fontSize: '16px', color: 'black', paddingLeft: '5px' }} />
                            </Button>
                        </div>
                    </div>
                    <Table className="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>ID</th>
                                <th style={{ textAlign: 'center' }}>Nombre del Gasto</th>
                                <th style={{ textAlign: 'center' }}>Descripción</th>
                                <th style={{ textAlign: 'center' }}>Bimestral</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? currentItems.map(item => (
                                <tr key={item.idExpenseType}>
                                    <td style={{ textAlign: 'center' }}>{item.idExpenseType}</td>
                                    <td style={{ textAlign: 'center' }}>{item.name}</td>
                                    <td style={{ textAlign: 'center' }}>{item.description}</td>
                                    <td style={{ textAlign: 'center' }}>{item.isBimonthly ? 'Sí' : 'No'}</td>
                                    <td>
                                        <Button
                                            color={item.status ? "success" : "secondary"}
                                            onClick={() => cambiarEstado(item.idExpenseType)}
                                            className="btn-sm"
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Button
                                                color="dark"
                                                onClick={() => handleOpenModal(item)}
                                                className="me-2 "
                                                style={{ padding: '0.25rem 0.5rem' }}
                                            >
                                                <EditOutlined style={{ fontSize: '0.75rem' }} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center">No hay registros disponibles</td>
                                </tr>
                            )}
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
                </>
            )}

            <Modal isOpen={modalOpen} toggle={handleCloseModal}>
                <ModalHeader toggle={handleCloseModal}>{isEditing ? 'Editar Gasto' : 'Crear Gasto'}</ModalHeader>
                <ModalBody>
                    {apiError && <div className="alert alert-danger">{apiError}</div>}
                    <form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label for="name">Nombre del Gasto</Label>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="Nombre del Gasto"
                                value={form.name}
                                onChange={handleChange}
                                invalid={!!formErrors.name}
                            />
                            {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                        </FormGroup>
                        <FormGroup>
                            <Label for="description">Descripción</Label>
                            <Input
                                type="textarea"
                                name="description"
                                id="description"
                                placeholder="Descripción"
                                value={form.description}
                                onChange={handleChange}
                                invalid={!!formErrors.description}
                            />
                            {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                        </FormGroup>
                        <FormGroup check>
                            <Label htmlFor="isBimonthly" check>
                                <Input
                                    type="checkbox"
                                    name="isBimonthly"
                                    id = "isBimonthly"
                                    checked={form.isBimonthly}
                                    onChange={handleChange}
                                />
                                Es Bimestral
                            </Label>
                        </FormGroup>

                        <Button type="submit" color="primary">
                            {isEditing ? 'Actualizar' : 'Crear'}
                        </Button>
                        <Button color="secondary" onClick={handleCloseModal} style={{ marginLeft: '10px' }}>
                            Cancelar
                        </Button>
                    </form>
                </ModalBody>
            </Modal>
        </Container>
    );
};

export default TablaGastos;