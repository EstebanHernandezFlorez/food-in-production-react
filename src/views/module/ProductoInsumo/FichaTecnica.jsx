import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, FormGroup, Input, Label } from "reactstrap";
import toast, { Toaster } from "react-hot-toast";
import productoInsumoService from "../../services/productoInsumoService";
import fichaTecnicaService from "../../services/fichaTecnicaService";
import { PlusOutlined } from "@ant-design/icons";
import { FaTrashAlt } from "react-icons/fa";

const FichaTecnica = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [form, setForm] = useState({
        idProduct: '',
        startDate: '',
        status: true,
        measurementUnit: '',
        quantity: '',
    });

    const measurementUnits = [
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
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productosData = await productoInsumoService.getAllProducts();
                console.log('Productos cargados:', productosData);
                setProductos(productosData);
            } catch (error) {
                console.error("Error específico al cargar datos:", error);
                toast.error(`Error al cargar datos: ${error.message}`);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const validateForm = () => {
        if (!form.idProduct) {
            toast.error("Debe seleccionar un producto");
            return false;
        }
        if (!form.startDate) {
            toast.error("Debe seleccionar una fecha");
            return false;
        }
        if (!form.measurementUnit) {
            toast.error("Debe seleccionar una unidad de medida");
            return false;
        }
        if (!form.quantity || isNaN(parseFloat(form.quantity)) || parseFloat(form.quantity) <= 0) {
            toast.error("Debe ingresar una cantidad válida (número mayor a 0)");
            return false;
        }

        // Validación de ingredientes
        if (insumos.length === 0) {
            toast.error("Debe agregar al menos un ingrediente");
            return false;
        }

        // Validación de datos de ingredientes
        const ingredienteInvalido = insumos.some(insumo => 
            !insumo.nombre.trim() || 
            !insumo.cantidad || 
            !insumo.unidadMedida
        );
        
        if (ingredienteInvalido) {
            toast.error("Todos los campos de los ingredientes son obligatorios");
            return false;
        }

        // Validación de procesos
        if (procesos.length === 0) {
            toast.error("Debe agregar al menos un proceso");
            return false;
        }

        // Validación de datos de procesos
        const procesoInvalido = procesos.some(proceso => 
            !proceso.nombre.trim() || 
            !proceso.descripcion.trim()
        );
        
        if (procesoInvalido) {
            toast.error("Todos los campos de los procesos son obligatorios");
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        try {
            if (!validateForm()) {
                return;
            }

            const fichaData = {
                idProduct: parseInt(form.idProduct, 10),
                startDate: form.startDate,
                status: form.status,
                measurementUnit: form.measurementUnit,
                quantity: parseFloat(form.quantity),
            };

            await fichaTecnicaService.createSpecSheet(fichaData);
            
            // Mostrar mensaje de éxito más específico
            toast.success("Ficha técnica creada exitosamente", {
                duration: 4000,
                position: "top-center",
                icon: '✅',
            });
            
            navigate('/producto_insumo');
        } catch (error) {
            console.error("Error detallado:", error);
            const errorMessage = error.response?.data?.message || error.message || "Error al guardar la ficha técnica";
            toast.error(errorMessage);
        }
    };

    const [insumos, setInsumos] = useState([{ 
        nombre: '', 
        cantidad: '', 
        unidadMedida: '' 
    }]);

    const handleInsumoChange = (index, field, value) => {
        const newInsumos = [...insumos];
        newInsumos[index][field] = value;
        setInsumos(newInsumos);
    };

    const addInsumo = () => {
        setInsumos([...insumos, { nombre: '', cantidad: '', unidadMedida: '' }]);
    };

    const removeInsumo = (index) => {
        const newInsumos = insumos.filter((_, i) => i !== index);
        setInsumos(newInsumos);
    };

    const [procesos, setProcesos] = useState([{
        numero: 1,
        nombre: '',
        descripcion: ''
    }]);

    const handleProcesoChange = (index, field, value) => {
        const newProcesos = [...procesos];
        newProcesos[index][field] = value;
        setProcesos(newProcesos);
    };

    const addProceso = () => {
        setProcesos([
            ...procesos,
            {
                numero: procesos.length + 1,
                nombre: '',
                descripcion: ''
            }
        ]);
    };

    const removeProceso = (index) => {
        const newProcesos = procesos.filter((_, i) => i !== index);
        // Actualizar la numeración
        newProcesos.forEach((proceso, i) => {
            proceso.numero = i + 1;
        });
        setProcesos(newProcesos);
    };

    return (
        <Container>
            <Toaster position="top-center" />
            <h2>Ficha Técnica</h2>
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label for="idProduct">Productos</Label>
                        <Input
                            type="select"
                            name="idProduct"
                            id="idProduct"
                            value={form.idProduct}
                            onChange={handleChange}
                        >
                            <option value="">Seleccione un producto</option>
                            {productos.map((producto) => (
                                <option key={producto.idProduct} value={producto.idProduct}>
                                    {producto.productName}
                                </option>
                            ))}
                        </Input>
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={4}>
                    <FormGroup>
                        <Label for="startDate">Fecha de Creación</Label>
                        <Input
                            type="date"
                            name="startDate"
                            id="startDate"
                            value={form.startDate}
                            onChange={handleChange}
                            style={{ width: '200px' }}
                        />
                    </FormGroup>
                </Col>
                
                <Col md={2}>
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
                <Col md={2}>
                    <FormGroup>
                        <Label for="measurementUnit">Unidad de Medida</Label>
                        <Input
                            type="select"
                            name="measurementUnit"
                            id="measurementUnit"
                            value={form.measurementUnit}
                            onChange={handleChange}
                        >
                            <option value="">Seleccione una unidad</option>
                            {measurementUnits.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                </option>
                            ))}
                        </Input>
                    </FormGroup>
                </Col>
            </Row>
            {/* Nueva sección de Insumos y Procesos */}
            <Row className="mt-4">
                <Col md={12}>
                    <h3 style={{ 
                        borderBottom: '2px solid #007bff', 
                        paddingBottom: '10px',
                        marginBottom: '20px'
                    }}>
                        Ingredientes
                    </h3>
                    {insumos.map((insumo, index) => (
                        <Row key={index} className="mb-3 align-items-center">
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Ingrediente</Label>
                                    <Input
                                        type="text"
                                        value={insumo.nombre}
                                        onChange={(e) => handleInsumoChange(index, 'nombre', e.target.value)}
                                        placeholder="Nombre del insumo"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label>Cantidad</Label>
                                    <Input
                                        type="number"
                                        value={insumo.cantidad}
                                        onChange={(e) => handleInsumoChange(index, 'cantidad', e.target.value)}
                                        placeholder="Cantidad"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Unidad de Medida</Label>
                                    <Input
                                        type="select"
                                        value={insumo.unidadMedida}
                                        onChange={(e) => handleInsumoChange(index, 'unidadMedida', e.target.value)}
                                    >
                                        <option value="">Seleccione una unidad</option>
                                        {measurementUnits.map(unit => (
                                            <option key={unit.value} value={unit.value}>
                                                {unit.label}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md={1} className="d-flex justify-content-center">
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '10px',
                                    alignItems: 'flex-end',
                                    height: '100%',
                                    paddingBottom: '1rem' 
                                }}>
                                    <Button 
                                        color="danger" 
                                        onClick={() => removeInsumo(index)}
                                    >
                                        <FaTrashAlt size={16} />
                                    </Button>
                                    {index === insumos.length - 1 && (
                                        <Button 
                                            color="success" 
                                            onClick={addInsumo}
                                        >
                                            <PlusOutlined style={{ fontSize: '16px' }} />
                                        </Button>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    ))}
                </Col>
            </Row>
            <Row className="mt-4">
                <Col md={12}>
                    <h3 style={{ 
                        borderBottom: '2px solid #007bff', 
                        paddingBottom: '10px',
                        marginBottom: '20px'
                    }}>
                        Procesos
                    </h3>
                    {procesos.map((proceso, index) => (
                        <Row key={index} className="mb-3 align-items-center">
                            <Col md={1}>
                                <div className="text-center">
                                    <h5>{proceso.numero}</h5>
                                </div>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Nombre Proceso</Label>
                                    <Input
                                        type="text"
                                        value={proceso.nombre}
                                        onChange={(e) => handleProcesoChange(index, 'nombre', e.target.value)}
                                        placeholder="Nombre del proceso"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Descripción</Label>
                                    <Input
                                        type="textarea"
                                        value={proceso.descripcion}
                                        onChange={(e) => handleProcesoChange(index, 'descripcion', e.target.value)}
                                        placeholder="Descripción del proceso"
                                        style={{ 
                                            minHeight: '38px',
                                            maxHeight: '200px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={1} className="d-flex justify-content-center">
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '10px',
                                    alignItems: 'flex-end',
                                    height: '100%',
                                    paddingBottom: '1rem' 
                                }}>
                                    <Button 
                                        color="danger" 
                                        onClick={() => removeProceso(index)}
                                    >
                                        <FaTrashAlt size={16} />
                                    </Button>
                                    {index === procesos.length - 1 && (
                                        <Button 
                                            color="success" 
                                            onClick={addProceso}
                                        >
                                            <PlusOutlined style={{ fontSize: '16px' }} />
                                        </Button>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    ))}
                </Col>
            </Row>
            <Button color="primary" onClick={handleSubmit}>
                Guardar
            </Button>
            <Button
                color="secondary"
                onClick={() => navigate("/producto_insumo")}
                style={{ marginLeft: "10px" }}
            >
                Cancelar
            </Button>
        </Container>
    );
};

export default FichaTecnica;