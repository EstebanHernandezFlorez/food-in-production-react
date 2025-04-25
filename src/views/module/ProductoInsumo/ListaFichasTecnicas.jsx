import React, { useState, useEffect } from 'react';
import { Container, Table, Button } from 'reactstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FiEdit } from "react-icons/fi";
import fichaTecnicaService from '../../services/fichaTecnicaService';

import toast, { Toaster } from "react-hot-toast";

const ListaFichasTecnicas = () => {
    const [fichas, setFichas] = useState([]);
    const { idProduct } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const cargarFichas = async () => {
            try {
                if (!idProduct) {
                    console.error('No hay idProduct');
                    return;
                }
                console.log('Intentando cargar fichas para el producto:', idProduct);
                const data = await fichaTecnicaService.getSpecSheetsByProduct(idProduct);
                console.log('Datos recibidos del servicio:', data);

                if (Array.isArray(data)) {
                    if (data.length > 0) {
                        setFichas(data);
                        toast.success(`Se encontraron ${data.length} fichas técnicas`);
                    } else {
                        setFichas([]);
                        
                        toast.info("No hay fichas técnicas para este producto");
                    }
                } else {
                    console.error('La respuesta no es un array:', data);
                    toast.error("Error en el formato de datos");
                }
            } catch (error) {
                console.error("Error detallado:", error);
                console.error("Mensaje de error:", error.message);
                console.error("Respuesta del servidor:", error.response?.data);
                toast.error(error.response?.data?.message || "Error al cargar las fichas técnicas");
            }
        };
        
        cargarFichas();
    }, [idProduct]);

    const handleChangeStatus = async (idSpecsheet, currentStatus) => {
        try {
            await fichaTecnicaService.changeStatus(idSpecsheet, !currentStatus);
            await cargarFichas(); // Recargar las fichas después de cambiar el estado
            toast.success("Estado actualizado correctamente");
        } catch (error) {
            toast.error("Error al actualizar el estado");
        }
    };

    return (
        <Container>
            <Toaster position="top-center" />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Fichas Técnicas</h2>
                <Button color="secondary" onClick={() => navigate('/producto_insumo')}>
                    Volver
                </Button>
            </div>
            <Table className="table table-borderless table-hover" style={{ borderRadius: "10px", overflow: "hidden" }}>
                <thead style={{ backgroundColor: '#f2f2f2' }}>
                    <tr>
                        <th>Fecha de Creación</th>
                        <th>Cantidad</th>
                        <th>Unidad de Medida</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {fichas.length > 0 ? (
                        fichas.map((ficha) => (
                            <tr key={ficha.idSpecsheet}>
                                <td>{new Date(ficha.startDate).toLocaleDateString()}</td>
                                <td>{ficha.quantity}</td>
                                <td>{ficha.measurementUnit}</td>
                                <td>
                                    <Button
                                        color={ficha.status ? "success" : "secondary"}
                                        onClick={() => handleChangeStatus(ficha.idSpecsheet, ficha.status)}
                                        size="sm"
                                    >
                                        {ficha.status ? "Activo" : "Inactivo"}
                                    </Button>
                                </td>
                                <td>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        onClick={() => navigate(`/ficha-tecnica/editar/${ficha.idSpecsheet}`)}
                                    >
                                        <FiEdit />
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center">No hay fichas técnicas disponibles</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
};

export default ListaFichasTecnicas;
