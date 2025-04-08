import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, FormGroup, Input, Label } from "reactstrap";
import toast, { Toaster } from "react-hot-toast";

const FichaTecnica = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        idSpecsheet: '',
        idProduct: '',
        startDate: '',
        endDate: '',
        status: true,
        measurementUnit: '',
        quantity: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async () => {
        try {
            // Aquí puedes implementar la lógica para enviar los datos al backend
            console.log("Datos enviados:", form);
            toast.success("Ficha técnica guardada exitosamente");
            navigate('/productos'); // Redirige de vuelta a la lista de productos
        } catch (error) {
            console.error("Error al guardar la ficha técnica:", error);
            toast.error("Error al guardar la ficha técnica");
        }
    };

    return (
        <Container>
            <Toaster position="top-center" />
            <h2>Agregar Ficha Técnica</h2>
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label for="idSpecsheet">ID de Ficha Técnica</Label>
                        <Input
                            type="text"
                            name="idSpecsheet"
                            id="idSpecsheet"
                            value={form.idSpecsheet}
                            onChange={handleChange}
                            placeholder="ID de la ficha técnica"
                        />
                    </FormGroup>
                </Col>
                <Col md={6}>
                    <FormGroup>
                        <Label for="idProduct">ID del Producto</Label>
                        <Input
                            type="text"
                            name="idProduct"
                            id="idProduct"
                            value={form.idProduct}
                            onChange={handleChange}
                            placeholder="ID del producto"
                        />
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label for="startDate">Fecha de Inicio</Label>
                        <Input
                            type="date"
                            name="startDate"
                            id="startDate"
                            value={form.startDate}
                            onChange={handleChange}
                        />
                    </FormGroup>
                </Col>
                <Col md={6}>
                    <FormGroup>
                        <Label for="endDate">Fecha de Fin</Label>
                        <Input
                            type="date"
                            name="endDate"
                            id="endDate"
                            value={form.endDate}
                            onChange={handleChange}
                        />
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label for="measurementUnit">Unidad de Medida</Label>
                        <Input
                            type="text"
                            name="measurementUnit"
                            id="measurementUnit"
                            value={form.measurementUnit}
                            onChange={handleChange}
                            placeholder="Unidad de medida"
                        />
                    </FormGroup>
                </Col>
                <Col md={6}>
                    <FormGroup>
                        <Label for="quantity">Cantidad</Label>
                        <Input
                            type="text"
                            name="quantity"
                            id="quantity"
                            value={form.quantity}
                            onChange={handleChange}
                            placeholder="Cantidad"
                        />
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label for="status">Estado</Label>
                        <Input
                            type="select"
                            name="status"
                            id="status"
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value === "true" })}
                        >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                        </Input>
                    </FormGroup>
                </Col>
            </Row>
            <Button color="primary" onClick={handleSubmit}>
                Guardar
            </Button>
            <Button color="secondary" onClick={() => navigate('/productos')} style={{ marginLeft: '10px' }}>
                Cancelar
            </Button>
        </Container>
    );
};

export default FichaTecnica;