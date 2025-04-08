import React, { useState, useEffect } from "react";
import productService  from "../../services/productoInsumoService"; // Importa el service
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaTrashAlt } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { PlusOutlined } from "@ant-design/icons";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom"; // Importa useNavigate
import "../../../App.css";

const Productos = () => { // Cambiado el nombre del componente
    const [data, setData] = useState([]);
    const [form, setForm] = useState(getInitialFormState());
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const navigate = useNavigate(); // Inicializa el hook de navegación

    const [formErrors, setFormErrors] = useState({});
    const itemsPerPage = 10;


    useEffect(() => {
        fetchData();
    }, []);

    function getInitialFormState() {
        return {
            idProduct: '', // Cambiado
            productName: '', // Cambiado
            status: true
        };
    }

    const fetchData = async () => {
        try {
            const fetchedData = await productService.getAllProducts(); // Usamos el service
            setData(fetchedData);
        } catch (error) {
            console.error("Error fetching products:", error);
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

        if (!form.productName?.trim()) { // Cambiado
            errors.productName = "El nombre del producto es requerido."; // Cambiado
            isValid = false;
        } else if (form.productName.length < 3) { // Cambiado
            errors.productName = "El nombre del producto debe tener al menos 3 caracteres"; // Cambiado
            isValid = false;
        } else if (!/^[a-zA-Z0-9\s]+$/.test(form.productName)) { // Cambiado
            errors.productName = "El nombre solo puede contener letras, números y espacios"; // Cambiado
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
            const productData = { ...form };
            let response;
            let method;
            let url;

            if (isEditing) {
                if (!form.idProduct) {
                    toast.error("ID de producto no válido para la actualización.");
                    return;
                }
                method = 'put';
                url = `http://localhost:3000/product/${form.idProduct}`; // Usamos el ID del producto
                response = await productService.updateProduct(form.idProduct, productData);
            } else {
                method = 'post';
                url = 'http://localhost:3000/product';  // Usamos la ruta correcta
                response = await productService.createProduct(productData);
            }

            toast.success(isEditing ? "Producto actualizado exitosamente" : "Producto agregado exitosamente");
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

    const confirmStatusChange = (idProduct) => { // Cambiado
        toast((t) => (
            <div>
                <p>¿Desea cambiar el estado del producto?</p>  // Cambiado
                <div>
                    <Button color="primary" onClick={() => {
                        handleStatusChange(idProduct);
                        toast.dismiss(t.id);
                    }}>
                        Cambiar
                    </Button>
                    <Button color="secondary" onClick={() => toast.dismiss(t.id)}>Cancelar</Button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const confirmDelete = (product) => { // Cambiado
        toast((t) => (
            <div>
                <p>¿Desea eliminar el producto?</p>  // Cambiado
                <div>
                    <Button
                        color="primary"
                        onClick={async () => {
                            try {
                                await productService.deleteProduct(product.idProduct); // Usamos el service
                                const updatedData = data.filter(prod => prod.idProduct !== product.idProduct); // Cambiado
                                setData(updatedData);
                                toast.success('Producto eliminado exitosamente'); // Cambiado
                            } catch (error) {
                                console.error("Error deleting product:", error); // Cambiado
                                toast.error('Error al eliminar el producto'); // Cambiado
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

    
const handleStatusChange = async (idProduct) => { // Cambiado
        try {
            const product = data.find(prod => prod.idProduct === idProduct); // Cambiado
            if (!product) {
                toast.error("Producto no encontrado"); // Cambiado
                return;
            }

            const updatedStatus = !product.status;
            await productService.changeStateProduct(idProduct, updatedStatus); // Usamos el service

            const updatedData = data.map(prod => // Cambiado
                prod.idProduct === idProduct ? { ...prod, status: updatedStatus } : prod
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
                <h2>Lista de Productos</h2> {/* Cambiado */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <Input
                        type="text"
                        placeholder="Buscar productos" // Cambiado
                        value={tableSearchText}
                        onChange={handleTableSearch}
                        style={{ width: '50%' }}
                    />
                    <div>
                        <Button
                            style={{ backgroundColor: '#228b22', color: 'black', marginRight: '10px' }}
                            onClick={toggleFormModal}
                        >
                            Agregar producto
                            <PlusOutlined style={{ fontSize: '16px', color: 'black', padding: '5px' }} />
                        </Button>
                        <Button
                            style={{ backgroundColor: '#007bff', color: 'white' }}
                            onClick={() => navigate('/ficha-tecnica')} // Redirige al formulario de ficha técnica
                        >
                            Agregar ficha técnica
                        </Button>
                    </div>
                </div>

                <Table
                    className="table table-borderless table-hover"
                    style={{ borderRadius: "10px", overflow: "hidden" }}
                >
                    <thead style={{ backgroundColor: '#f2f2f2' }}>
                        <tr>
                            <th className="text-center">ID</th>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idProduct} style={{ borderBottom: '1px solid #e9ecef' }}> {/* Cambiado */}
                                    <td className="text-center">{item.idProduct}</td> {/* Cambiado */}
                                    <td>{item.productName}</td> {/* Cambiado */}
                                    <td>
                                        <Button
                                            color={item.status ? "success" : "secondary"}
                                            onClick={() => confirmStatusChange(item.idProduct)}
                                            className="btn-sm"
                                            style={{ padding: '0.25rem 0.5rem' }}
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">  {/* Agregado: Botones en el centro */}
                                        <Button
                                            color="primary" // Puedes ajustar el color
                                            className="btn-sm me-2"  // Agregado "me-2" para espacio
                                            onClick={() => {
                                                // Implementa la lógica para "Ver Detalles"
                                                console.log("Ver Detalles:", item.idProduct);
                                            }}
                                        >
                                            Ver Detalles
                                        </Button>

                                        <Button
                                            color="dark"
                                            className="btn-sm me-2" // Agregado "me-2" para espacio
                                            onClick={() => startEditing(item)}
                                        >
                                            <FiEdit style={{ fontSize: '0.75rem' }} />
                                        </Button>

                                        <Button
                                            color="danger"
                                            onClick={() => confirmDelete(item)}
                                            className="btn-sm"
                                        >
                                            <FaTrashAlt style={{ fontSize: '0.75rem' }} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center">No hay datos disponibles</td>  {/* Cambiado: Ajusta el colSpan */}
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
                    {isEditing ? 'Editar Producto' : 'Agregar Producto'} {/* Cambiado */}
                </ModalHeader>
                <ModalBody>
                    <Row>
                        <Col md={12}> {/* Usamos 12 para que ocupe todo el ancho */}
                            <FormGroup>
                                <label style={{ fontSize: "15px", padding: "5px" }}>
                                    Nombre del Producto
                                </label>
                                <Input
                                    type="text"
                                    name="productName" // Cambiado
                                    value={form.productName} // Cambiado
                                    onChange={handleChange}
                                    placeholder="Nombre del producto" // Cambiado
                                    style={{ border: "1px solid black" }}
                                    className={formErrors.productName ? "is-invalid" : ""} // Cambiado
                                />
                                {formErrors.productName && (  // Cambiado
                                    <div className="invalid-feedback text-center">
                                        {formErrors.productName} // Cambiado
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

            {/* Modal de detalle (Mantén este modal si lo necesitas) */}
            <Modal
                isOpen={detailModalOpen}
                toggle={toggleDetailModal}
                style={{ maxWidth: "40%", marginTop: "10px", marginBottom: "3px" }}
            >
                {/* Contenido del modal de detalle aquí */}
            </Modal>
        </Container>
    );
};

export default Productos; // Cambiado
