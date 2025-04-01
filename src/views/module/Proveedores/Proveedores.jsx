import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
    Table,
    Button,
    Container,
    Row,
    Col,
    Form,
    FormGroup,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import { FaTrashAlt } from "react-icons/fa";
import { PlusOutlined } from "@ant-design/icons";
import FondoForm from "../../../assets/login.jpg";
import { FiEdit } from "react-icons/fi";
import "../../../App.css";
import proveedorService from '../../services/proveedorSevice';
import toast, { Toaster } from 'react-hot-toast'; // Import react-hot-toast

const Proveedores = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState({
        idProvider: "",
        documentType: "",
        document: "",
        cellPhone: "",
        company: "",
        status: true,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // REMOVE this state
    const itemsPerPage = 10;

    // States for validation
    const [formErrors, setFormErrors] = useState({
        documentType: false,
        document: false,
        cellPhone: false,
        company: false,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const proveedores = await proveedorService.getAllProveedores();
            setData(proveedores);
        } catch (error) {
            toast.error("Failed to load providers.");
        }
    };

    const handleCancel = () => {
        setModalOpen(false);
        setSelectedProveedor(null);
        setForm({  //Reset the form values on cancel
            idProvider: "",
            documentType: "",
            document: "",
            cellPhone: "",
            company: "",
            status: true,
        })
    };

    // REMOVE handleOk, openDeleteModal, and handleDeleteModalClose functions

    const handleTableSearch = (e) => {
        setTableSearchText(e.target.value.toLowerCase());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const validateForm = () => {
        const errors = {
            documentType: !form.documentType,
            document: !form.document,
            cellPhone: !form.cellPhone,
            company: !form.company,
        };
        setFormErrors(errors);
        return !Object.values(errors).includes(true);
    };

    const tiposDocumentos = [
        { value: "CC", label: "Cédula de Ciudadanía" },
        { value: "CE", label: "Cédula de Extranjería" },
        { value: "PA", label: "Pasaporte" },
        { value: "PEP", label: "Permiso Especial de Permanencia" },
    ];

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            const proveedorExistente = data.find(
                (registro) => registro.document === form.document
            );

            if (proveedorExistente) {
                toast.error(
                    "A provider with this document already exists. Please use a different document."
                );
                return;
            }

            const newProvider = {
                ...form,
            };

            const createdProvider = await proveedorService.createProveedor(newProvider);
            setData((prevData) => [...prevData, createdProvider]);
            setForm({
                idProvider: "",
                documentType: "",
                document: "",
                cellPhone: "",
                company: "",
                status: true,
            });
            setShowForm(false);
            toast.success("Provider added successfully!");
        } catch (error) {
            toast.error("Failed to add provider.");
        }
    };

    const editar = async () => {
        if (!validateForm()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const proveedorExistente = data.find(
            (registro) =>
                registro.document === form.document &&
                registro.idProvider !== form.idProvider
        );

        if (proveedorExistente) {
            toast.error(
                "A provider with this document already exists. Please use a different document."
            );
            return;
        }

        try {
            const updatedProvider = await proveedorService.updateProveedor(
                form.idProvider,
                form
            );
            setData((prevData) =>
                prevData.map((item) =>
                    item.idProvider === form.idProvider ? { ...form } : item //This line is better than your implementation
                )
            );
            setIsEditing(false);
            setModalOpen(false);
            fetchData(); //Consider deleting this line
            toast.success("Provider updated successfully!");
        } catch (error) {
            toast.error("Failed to update provider.");
        }
    };

    const cambiarEstado = async (idProvider, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await proveedorService.changeStateProveedor(idProvider, newStatus);

            setData((prevData) =>
                prevData.map((proveedor) =>
                    proveedor.idProvider === idProvider
                        ? { ...proveedor, status: newStatus }
                        : proveedor
                )
            );
            toast.success("Provider status updated!");
        } catch (error) {
            toast.error("Failed to update provider status.");
        }

    };

    const filteredData = data.filter(
        (item) =>
            item.company.toLowerCase().includes(tableSearchText) ||
            item.document.toString().includes(tableSearchText)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    // New confirmDelete function
    const confirmDelete = (proveedor) => {
      toast((t) => (
          <div>
              <p>¿Desea eliminar al proveedor <strong>{proveedor.company}</strong>?</p>
              <div>
                  <Button
                      color="danger"
                      onClick={async () => {
                          try {
                              // Check if the provider is associated with any register purchases
                              const isAssociated = await proveedorService.isProviderAssociatedWithPurchases(proveedor.idProvider);

                              if (isAssociated) {
                                  toast.error('No se puede eliminar el proveedor porque está asociado a registros de compras.');
                                  toast.dismiss(t.id);
                                  return; // Prevent the delete operation
                              }

                              console.log("Deleting provider with ID:", proveedor.idProvider);
                              await proveedorService.deleteProveedor(proveedor.idProvider);
                              const updatedData = data.filter(prov => prov.idProvider !== proveedor.idProvider);
                              setData(updatedData);
                              toast.success('Proveedor eliminado exitosamente');
                          } catch (error) {
                              console.error("Error deleting provider:", error);
                              toast.error('Error al eliminar el proveedor');
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

    return (
        <Container>
            <Toaster position="top-right" />
            <br />
            {!showForm && (
                <>
                    <h2>Lista de Proveedores</h2>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Input
                            type="text"
                            placeholder="Buscar proveedor"
                            value={tableSearchText}
                            onChange={handleTableSearch}
                            style={{ width: "50%" }}
                        />
                        <Button
                            style={{ backgroundColor: "#228b22", color: "black" }}
                            onClick={() => {
                                setForm({
                                    idProvider: "",
                                    documentType: "",
                                    document: "",
                                    cellPhone: "",
                                    company: "",
                                    status: true,
                                });
                                setIsEditing(false);
                                setShowForm(true);
                            }}
                        >
                            Agregar Proveedor
                            <PlusOutlined
                                style={{ fontSize: "16px", color: "black", padding: "5px" }}
                            />
                        </Button>
                    </div>
                    <Table className="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo documento</th>
                                <th>Documento</th>
                                <th>Telefono</th>
                                <th>Empresa</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.idProvider}>
                                        <td>{item.idProvider}</td>
                                        <td>{item.documentType}</td>
                                        <td>{item.document}</td>
                                        <td>{item.cellPhone}</td>
                                        <td>{item.company}</td>
                                        <td>
                                            <Button
                                                color={item.status ? "success" : "secondary"}
                                                onClick={() => cambiarEstado(item.idProvider, item.status)}
                                                className=" btn-sm"
                                            >
                                                {item.status ? "Activo" : "Inactivo"}
                                            </Button>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Button
                                                    color="dark"
                                                    onClick={() => {
                                                        setForm(item);
                                                        setIsEditing(true);
                                                        setModalOpen(true);
                                                    }}
                                                    className="me-2 "
                                                    style={{ padding: "0.25rem 0.5rem" }}
                                                >
                                                    <FiEdit style={{ fontSize: "0.75rem" }} />
                                                </Button>
                                                <Button
                                                    color="danger"
                                                    onClick={() => confirmDelete(item)} // Call confirmDelete
                                                    className="btn-sm"
                                                    style={{ padding: "0.25rem 0.5rem" }}
                                                >
                                                    <FaTrashAlt style={{ fontSize: "0.75rem" }} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        No hay datos disponibles
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                    <ul className="pagination">
                        {pageNumbers.map((number) => (
                            <li
                                key={number}
                                className={`page-item ${
                                    currentPage === number ? "active" : ""
                                }`}
                            >
                                <Button
                                    className="page-link"
                                    onClick={() => handlePageChange(number)}
                                >
                                    {number}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {showForm && (
                <div className="container">
                    <h1 className="text-start left-2">Crear Proveedores</h1>
                    <br />
                    <Row>
                        <Col md={8}>
                            <Form>
                                <Row className="justify-content-center">
                                    <Col md={12}>
                                        <FormGroup>
                                            <label style={{ fontSize: "15px", padding: "5px" }}>
                                                Nombre Empresa
                                            </label>
                                            <Input
                                                type="text"
                                                name="company"
                                                value={form.company}
                                                onChange={handleChange}
                                                placeholder="Nombre de la empresa"
                                                className={`form-control ${
                                                    formErrors.company ? "is-invalid" : ""
                                                }`}
                                                style={{ border: "2px solid black", width: "100%" }}
                                            />
                                            {formErrors.company && (
                                                <div className="invalid-feedback">
                                                    Este campo es obligatorio.
                                                </div>
                                            )}
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row className="justify-content-center">
                                    <Col md={6}>
                                        <FormGroup>
                                            <label style={{ fontSize: "15px", padding: "5px" }}>
                                                Tipo Documento
                                            </label>
                                            <Input
                                                type="select"
                                                name="documentType"
                                                value={form.documentType}
                                                onChange={handleChange}
                                                className={`form-control ${
                                                    formErrors.documentType ? "is-invalid" : ""
                                                }`}
                                            >
                                                <option value="">Seleccione un tipo de documento</option>
                                                {tiposDocumentos.map((tipo) => (
                                                    <option key={tipo.value} value={tipo.value}>
                                                        {tipo.label}
                                                    </option>
                                                ))}
                                            </Input>
                                            {formErrors.documentType && (
                                                <div className="invalid-feedback">
                                                    Este campo es obligatorio.
                                                </div>
                                            )}
                                        </FormGroup>
                                    </Col>

                                    <Col md={6}>
                                        <FormGroup>
                                            <label style={{ fontSize: "15px", padding: "5px" }}>
                                                Documento
                                            </label>
                                            <Input
                                                type="number"
                                                name="document"
                                                value={form.document}
                                                onChange={handleChange}
                                                placeholder="Número de documento"
                                                className={`form-control ${
                                                    formErrors.document ? "is-invalid" : ""
                                                }`}
                                                style={{ border: "2px solid black", width: "100%" }}
                                            />
                                            {formErrors.document && (
                                                <div className="invalid-feedback">
                                                    Este campo es obligatorio.
                                                </div>
                                            )}
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row className="justify-content-center">
                                    <Col md={12}>
                                        <FormGroup>
                                            <label style={{ fontSize: "15px", padding: "5px" }}>
                                                Teléfono
                                            </label>
                                            <Input
                                                type="number"
                                                name="cellPhone"
                                                value={form.cellPhone}
                                                onChange={handleChange}
                                                placeholder="Número de contacto"
                                                className={`form-control ${
                                                    formErrors.cellPhone ? "is-invalid" : ""
                                                }`}
                                                style={{ border: "2px solid black", width: "100%" }}
                                            />
                                            {formErrors.cellPhone && (
                                                <div className="invalid-feedback">
                                                    Este campo es obligatorio.
                                                </div>
                                            )}
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row className="justify-content-center mt-3">
                                    <Col md={12} className="d-flex justify-content-end">
                                        <Button style={{ background: "#2e8322" }} onClick={handleSubmit}>
                                            {isEditing ? "Actualizar" : "Agregar"}
                                        </Button>
                                        <Button
                                            style={{ background: "#6d0f0f" }}
                                            onClick={() => {
                                                setShowForm(false);
                                                setIsEditing(false);
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Col>

                        <Col md={4} className="d-flex align-items-center justify-content-center">
                            <img
                                src={FondoForm}
                                alt="Descripción de la Imagen"
                                style={{
                                    width: "100%",
                                    height: "60vh",
                                    objectFit: "cover",
                                }}
                            />
                        </Col>
                    </Row>
                </div>
            )}

            {/* Modal de edición */}
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                    Editar Proveedor
                </ModalHeader>
                <ModalBody>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <label style={{ fontSize: "15px", padding: "5px" }}>
                                    Tipo de Documento
                                </label>
                                <Input
                                    type="select"
                                    name="documentType"
                                    value={form.documentType}
                                    onChange={handleChange}
                                    className={`form-control ${
                                        formErrors.documentType ? "is-invalid" : ""
                                    }`}
                                >
                                    <option value="">Seleccione un tipo de documento</option>
                                    {tiposDocumentos.map((tipo) => (
                                        <option key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </option>
                                    ))}
                                </Input>
                                {formErrors.documentType && (
                                    <div className="invalid-feedback">
                                        Este campo es obligatorio.
                                    </div>
                                )}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <label style={{ fontSize: "15px", padding: "5px" }}>
                                    Documento
                                </label>
                                <Input
                                    type="number"
                                    name="document"
                                    value={form.document}
                                    onChange={handleChange}
                                    placeholder="Número de documento"
                                    className={`form-control ${
                                        formErrors.document ? "is-invalid" : ""
                                    }`}
                                />
                                {formErrors.document && (
                                    <div className="invalid-feedback">
                                        Este campo es obligatorio.
                                    </div>
                                )}
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <label style={{ fontSize: "15px", padding: "5px" }}>
                                    Telefono
                                </label>
                                <Input
                                    type="number"
                                    name="cellPhone"
                                    value={form.cellPhone}
                                    onChange={handleChange}
                                    placeholder="Número de contacto de emergencia"
                                    className={`form-control ${
                                        formErrors.cellPhone ? "is-invalid" : ""
                                    }`}
                                />
                                {formErrors.cellPhone && (
                                    <div className="invalid-feedback">
                                        Este campo es obligatorio.
                                    </div>
                                )}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <label style={{ fontSize: "15px", padding: "5px" }}>
                                    Empresa
                                </label>
                                <Input
                                    type="text"
                                    name="company"
                                    value={form.company}
                                    onChange={handleChange}
                                    placeholder="Número de Empresa"
                                    className={`form-control ${
                                        formErrors.company ? "is-invalid" : ""
                                    }`}
                                />
                                {formErrors.company && (
                                    <div className="invalid-feedback">
                                        Este campo es obligatorio.
                                    </div>
                                )}
                            </FormGroup>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={editar}>
                        Update
                    </Button>
                    <Button color="danger" onClick={handleCancel}>
                        Cancelar
                    </Button>
                </ModalFooter>
            </Modal>
        </Container>
    );
};

export default Proveedores;