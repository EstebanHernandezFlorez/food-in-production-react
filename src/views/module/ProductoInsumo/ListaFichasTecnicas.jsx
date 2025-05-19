import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Componentes UI de Reactstrap
import {
    Container, Table, Button,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert,
    Row, Col
} from 'reactstrap';

// Iconos de lucide-react
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'; // Plus se mantiene por si lo usas

// Servicios y toasts
import fichaTecnicaService from '../../services/fichaTecnicaService';
import productoInsumoService from '../../services/productoInsumoService';
import toast, { Toaster } from "react-hot-toast";

// --- Reusable Confirmation Modal Component ---
const ConfirmationModal = ({
    isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar",
    confirmColor = "primary", isConfirming = false,
}) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
            <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : (confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>
            {children}
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>
                Cancelar
            </Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? (
                    <><Spinner size="sm" className="me-1" /> Procesando...</>
                ) : (
                    confirmText
                )}
            </Button>
        </ModalFooter>
    </Modal>
);


// --- Main Component ---
const ListaFichasTecnicas = () => {
    const [fichas, setFichas] = useState([]);
    const { idProduct } = useParams();
    const navigate = useNavigate();

    const [productName, setProductName] = useState('');
    const [isLoadingProduct, setIsLoadingProduct] = useState(true);

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({
        title: "",
        message: null,
        confirmText: "Confirmar",
        confirmColor: "primary",
        itemDetails: null,
    });
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const confirmActionRef = useRef(null);


    // --- CARGAR NOMBRE DEL PRODUCTO ---
    useEffect(() => {
        let isMounted = true;
        const fetchProductDetails = async () => {
            if (!idProduct) {
                if (isMounted) setIsLoadingProduct(false);
                return;
            }
            if (isMounted) setIsLoadingProduct(true);
            try {
                const productData = await productoInsumoService.getProductById(idProduct);
                if (isMounted) {
                    if (productData && (productData.productName || productData.name)) {
                        setProductName(productData.productName || productData.name);
                    } else {
                        setProductName(`ID: ${idProduct}`);
                        console.warn("No se encontró nombre para el producto ID:", idProduct, "Respuesta:", productData);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error al cargar detalles del producto:", error);
                    toast.error("Error al cargar el nombre del producto.");
                    setProductName(`ID: ${idProduct}`);
                }
            } finally {
                if (isMounted) setIsLoadingProduct(false);
            }
        };

        fetchProductDetails();
        return () => { isMounted = false; };
    }, [idProduct]);


    const cargarFichas = useCallback(async (showToast = false) => {
        try {
            if (!idProduct) {
                console.error('ID de producto no proporcionado para cargar fichas.');
                toast.error("No se pudo identificar el producto para cargar sus fichas.");
                setFichas([]);
                return;
            }
            const data = await fichaTecnicaService.getSpecSheetsByProduct(idProduct);
            // console.log("Datos de fichas recibidos (deberían incluir endDate):", data); // Para depurar

            if (Array.isArray(data)) {
                setFichas(data);
                if (showToast) {
                    if (data.length > 0) {
                        toast.success(`Se encontraron ${data.length} fichas técnicas.`);
                    } else {
                        toast.info("No hay fichas técnicas registradas para este producto.");
                    }
                } else if (data.length === 0) {
                    toast.info("No hay fichas técnicas registradas para este producto.");
                }
            } else {
                console.error('La respuesta del servicio de fichas no es un array:', data);
                toast.error("Error en el formato de datos recibido del servidor.");
                setFichas([]);
            }
        } catch (error) {
            console.error("Error detallado al cargar fichas:", error);
            toast.error(error.response?.data?.message || "Error al cargar las fichas técnicas.");
            setFichas([]);
        }
    }, [idProduct]);

    useEffect(() => {
        if (idProduct) {
            cargarFichas();
        }
    }, [cargarFichas, idProduct]);

    const handleChangeStatus = useCallback(async (idSpecsheet, currentStatus) => {
        const toastId = toast.loading("Actualizando estado de la ficha...");
        try {
            await fichaTecnicaService.changeStateSpecSheet(idSpecsheet, !currentStatus);
            // El mensaje ya puede ser genérico, ya que el backend maneja endDate
            toast.success("Estado actualizado correctamente.", { id: toastId });
            await cargarFichas(false); // Recargar para obtener la ficha actualizada con endDate
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al actualizar el estado.", { id: toastId });
        }
    }, [cargarFichas]);

    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return;
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps({ title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null });
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
            if (actionFn) {
                actionFn(detailsToPass);
            } else {
                 toast.error("Error interno al ejecutar la acción confirmada.");
                 toggleConfirmModal();
            }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]);

    const requestDeleteConfirmation = useCallback((ficha) => {
        if (!ficha || !ficha.idSpecsheet) return;
        const productoIdentificador = productName || `ID: ${idProduct}`;
        prepareConfirmation(executeDeleteFicha, {
            title: "Confirmar Eliminación de Ficha",
            message: (
                <>
                    <p>¿Está seguro que desea eliminar permanentemente la ficha técnica con ID <strong>{ficha.idSpecsheet}</strong>?</p>
                    <p>Esta ficha está asociada al producto: <strong>{productoIdentificador}</strong>.</p>
                    <p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p>
                </>
            ),
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: { idSpecsheet: ficha.idSpecsheet, idProduct: ficha.idProduct }
        });
    }, [prepareConfirmation, idProduct, productName]);

    const executeDeleteFicha = useCallback(async (details) => {
        if (!details || !details.idSpecsheet) {
            toast.error("Error interno: No se pudieron obtener los detalles para eliminar la ficha.");
            toggleConfirmModal();
            return;
        }
        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Eliminando ficha técnica...');
        try {
            await fichaTecnicaService.deleteSpecSheet(details.idSpecsheet);
            toast.success(`Ficha técnica ID ${details.idSpecsheet} eliminada correctamente.`, {
                id: toastId,
                icon: <CheckCircle className="text-success" />
            });
            toggleConfirmModal();
            await cargarFichas(true);
        } catch (error) {
            console.error("Error al eliminar ficha técnica:", error);
            toast.error(error.response?.data?.message || "Error al eliminar la ficha técnica.", {
                id: toastId,
                icon: <XCircle className="text-danger" />,
                duration: 5000
            });
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, cargarFichas]);

    const handleNavigateToEdit = (idSpecsheet) => {
        navigate(`/home/ficha-tecnica/editar/${idSpecsheet}`);
    };


    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500 }}/>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h2 className="mb-0">
                        Fichas Técnicas del Producto {isLoadingProduct ? <Spinner size="sm"/> : (productName || `ID: ${idProduct}`)}
                    </h2>
                </Col>
                <Col xs="auto" className="text-end">
                    <Button color="secondary" outline size="sm" onClick={() => navigate('/home/produccion/producto_insumo')}>
                        <XCircle size={18} className="me-1"/>
                        Volver a Productos
                    </Button>
                </Col>
            </Row>

            {/* Spinner de carga general si se está cargando el producto o si no hay idProduct y aún no hay fichas ni nombre */}
            {isLoadingProduct && <div className="text-center p-5"><Spinner/> Cargando datos del producto...</div>}
            {!isLoadingProduct && !idProduct && fichas.length === 0 && !productName && (
                 <div className="text-center p-4">
                     <Alert color="info">No se ha especificado un producto para mostrar sus fichas técnicas.</Alert>
                 </div>
            )}

            {/* Mostrar la tabla solo si la carga del producto ha terminado Y tenemos un idProduct */}
            {!isLoadingProduct && idProduct && (
                <div className="table-responsive shadow-sm custom-table-container mb-3">
                    <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                        <thead>
                            <tr>
                                <th scope="col" style={{width: '10%'}}>ID Ficha</th>
                                <th scope="col" style={{width: '15%'}}>Fecha Creación</th>
                                <th scope="col" style={{width: '10%'}}>Peso Base</th> {/* Ajustado width */}
                                <th scope="col" style={{width: '15%'}}>Unidad Medida</th> {/* Ajustado width */}
                                <th scope="col" className="text-center" style={{width: '10%'}}>Estado</th>
                                <th scope="col" className="text-center" style={{width: '15%'}}>Fecha de Inactivo</th> {/* NUEVA COLUMNA */}
                                <th scope="col" className="text-center" style={{width: '15%'}}>Acciones</th> {/* Ajustado width */}
                            </tr>
                        </thead>
                        <tbody>
                            {fichas.length > 0 ? (
                                fichas.map((ficha) => (
                                    <tr key={ficha.idSpecsheet} style={{ verticalAlign: 'middle' }}>
                                        <th scope="row">{ficha.idSpecsheet}</th>
                                        <td>{ficha.startDate ? new Date(ficha.startDate).toLocaleDateString() : '-'}</td>
                                        <td>{ficha.quantity}</td>
                                        <td>{ficha.measurementUnit || '-'}</td>
                                        <td className="text-center">
                                            <Button
                                                size="sm"
                                                className={`status-button ${ficha.status ? 'status-active' : 'status-inactive'}`}
                                                onClick={() => handleChangeStatus(ficha.idSpecsheet, ficha.status)}
                                                disabled={isConfirmActionLoading}
                                                title={ficha.status ? "Clic para Desactivar" : "Clic para Activar"}
                                            >
                                                {ficha.status ? "Activa" : "Inactiva"}
                                            </Button>
                                        </td>
                                        <td className="text-center">
                                            {ficha.endDate ? new Date(ficha.endDate).toLocaleDateString() : (ficha.status === false ? '...' : '-')}
                                        </td>
                                        <td className="text-center">
                                            <div className="d-inline-flex gap-1 action-cell-content">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleNavigateToEdit(ficha.idSpecsheet)}
                                                    title="Editar Ficha"
                                                    className="action-button action-edit"
                                                    disabled={isConfirmActionLoading}
                                                >
                                                    <Edit size={18} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => requestDeleteConfirmation(ficha)}
                                                    title="Eliminar Ficha"
                                                    className="action-button action-delete"
                                                    disabled={isConfirmActionLoading}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center fst-italic p-4"> {/* colSpan ajustado a 7 */}
                                        No hay fichas técnicas registradas para este producto.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModalOpen}
                toggle={toggleConfirmModal}
                title={confirmModalProps.title}
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()}
                confirmText={confirmModalProps.confirmText}
                confirmColor={confirmModalProps.confirmColor}
                isConfirming={isConfirmActionLoading}
            >
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default ListaFichasTecnicas;