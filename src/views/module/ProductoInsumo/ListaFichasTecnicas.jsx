// src/views/module/ProductoInsumo/ListaFichasTecnicas.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container, Table, Button,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert,
    Row, Col, Card, CardBody, CardTitle, ListGroup, ListGroupItem
} from 'reactstrap';
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Info, Eye } from 'lucide-react';
import specSheetService from '../../services/specSheetService';
import productService from '../../services/productService';
import toast, { Toaster } from "react-hot-toast";

// --- Reusable Confirmation Modal ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}><div className="d-flex align-items-center"><AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : 'primary'} me-2`} /><span className="fw-bold">{title}</span></div></ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter><Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button><Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>{isConfirming ? <Spinner size="sm" /> : confirmText}</Button></ModalFooter>
    </Modal>
);

// --- Detail Modal Component para Ficha Técnica ---
const FichaDetailModal = ({ isOpen, toggle, ficha }) => {
    if (!ficha) return null;
    // Asegurarse que los arrays existen antes de mapear
    const supplies = ficha.specSheetSupplies || ficha.SpecSheetSupplies || [];
    const processes = ficha.specSheetProcesses || ficha.SpecSheetProcesses || [];

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="xl" scrollable> {/* XL para más espacio */}
            <ModalHeader toggle={toggle}>
                <div className="d-flex align-items-center">
                    <Eye size={24} className="me-2 text-info" />
                    <span className="fw-bold">Detalles de Ficha Técnica ID: {ficha.idSpecSheet}</span>
                </div>
            </ModalHeader>
            <ModalBody>
                <Row>
                    <Col md={5}>
                        <Card className="mb-3 shadow-sm">
                            <CardBody>
                                <CardTitle tag="h5" className="text-primary border-bottom pb-2 mb-3">Información General</CardTitle>
                                <ListGroup flush>
                                    <ListGroupItem><strong>Producto:</strong> {ficha.Product?.productName || ficha.product?.productName || `ID ${ficha.idProduct}`}</ListGroupItem>
                                    <ListGroupItem><strong>Fecha Efectiva:</strong> {ficha.dateEffective ? new Date(ficha.dateEffective).toLocaleDateString() : '-'}</ListGroupItem>
                                    <ListGroupItem><strong>Fin Vigencia:</strong> {ficha.endDate ? new Date(ficha.endDate).toLocaleDateString() : 'N/A'}</ListGroupItem>
                                    <ListGroupItem><strong>Cant. Base:</strong> {ficha.quantityBase} {ficha.unitOfMeasure || ficha.Product?.unitOfMeasure}</ListGroupItem>
                                    <ListGroupItem><strong>Estado:</strong> <span className={`badge bg-${ficha.status ? 'success' : 'secondary'}`}>{ficha.status ? "Activa" : "Inactiva"}</span></ListGroupItem>
                                    {ficha.versionName && <ListGroupItem><strong>Versión:</strong> {ficha.versionName}</ListGroupItem>}
                                    {ficha.description && <ListGroupItem><strong>Descripción:</strong> {ficha.description}</ListGroupItem>}
                                </ListGroup>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md={7}>
                        <Card className="mb-3 shadow-sm">
                            <CardBody>
                                <CardTitle tag="h5" className="text-success border-bottom pb-2 mb-3">Insumos / Ingredientes</CardTitle>
                                {supplies.length > 0 ? (
                                    <ListGroup flush>
                                        {supplies.map((supplyItem, index) => (
                                            <ListGroupItem key={supplyItem.idSpecSheetSupply || `supply-${index}`}>
                                                <strong>{supplyItem.Supply?.supplyName || supplyItem.supply?.supplyName || `Insumo ID ${supplyItem.idSupply}`}:</strong> {supplyItem.quantity} {supplyItem.unitOfMeasure}
                                                {supplyItem.notes && <div className="text-muted x-small ps-2">- {supplyItem.notes}</div>}
                                            </ListGroupItem>
                                        ))}
                                    </ListGroup>
                                ) : (
                                    <p className="text-muted fst-italic">No hay insumos asociados a esta ficha.</p>
                                )}
                            </CardBody>
                        </Card>
                        <Card className="shadow-sm">
                            <CardBody>
                                <CardTitle tag="h5" className="text-info border-bottom pb-2 mb-3">Pasos de Elaboración</CardTitle>
                                {processes.length > 0 ? (
                                    <ListGroup flush>
                                        {processes.sort((a,b) => (a.processOrder || 0) - (b.processOrder || 0)).map((processItem, index) => (
                                            <ListGroupItem key={processItem.idSpecSheetProcess || `proc-${index}`}>
                                                <strong>Paso {processItem.processOrder || (index + 1)}: {processItem.processNameOverride || processItem.MasterProcess?.processName || 'Nombre no especificado'}</strong>
                                                {processItem.processDescriptionOverride && <div className="text-muted small ps-2">{processItem.processDescriptionOverride}</div>}
                                                {processItem.estimatedTimeMinutes && <div className="text-muted x-small ps-2">Tiempo Estimado: {processItem.estimatedTimeMinutes} min.</div>}
                                            </ListGroupItem>
                                        ))}
                                    </ListGroup>
                                ) : (
                                    <p className="text-muted fst-italic">No hay procesos definidos para esta ficha.</p>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={toggle}>Cerrar</Button>
            </ModalFooter>
        </Modal>
    );
};

const ListaFichasTecnicas = () => {
    const [fichas, setFichas] = useState([]);
    const { idProduct } = useParams();
    const navigate = useNavigate();
    const [productName, setProductName] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({});
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const confirmActionRef = useRef(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedFichaForDetail, setSelectedFichaForDetail] = useState(null);

    const handleNavigateToProductList = useCallback(() => navigate('/home/produccion/producto-insumo'), [navigate]);
    const handleNavigateToEditFicha = useCallback((idSpecSheet) => { if (idSpecSheet) navigate(`/home/fichas-tecnicas/editar/${idSpecSheet}`); else toast.error("ID de ficha inválido."); }, [navigate]);
    const handleNavigateToCrearFicha = useCallback(() => navigate(`/home/fichas-tecnicas/crear`), [navigate]);

    const cargarFichasYProducto = useCallback(async (showToastOnLoad = false) => {
        if (!idProduct) {
            setIsLoadingData(false); setFichas([]); setProductName(''); return;
        }
        setIsLoadingData(true);
        try {
            const [productDetails, fichasDataResponse] = await Promise.all([
                productService.getProductById(idProduct),
                specSheetService.getSpecSheetsByProductId(idProduct)
            ]);
            setProductName(productDetails?.productName || productDetails?.name || `Producto ID: ${idProduct}`);
            
            // Asumiendo que el backend devuelve un array directamente, o un objeto con una propiedad 'data' o el nombre del modelo
            const fichasArray = Array.isArray(fichasDataResponse) ? fichasDataResponse : 
                                (fichasDataResponse?.data || fichasDataResponse?.specSheets || fichasDataResponse?.fichas || []);
            
            console.log('ListaFichasTecnicas - cargarFichasYProducto: Fichas recibidas del backend:', fichasDataResponse);
            console.log('ListaFichasTecnicas - cargarFichasYProducto: Fichas procesadas (fichasArray):', fichasArray);

            setFichas(fichasArray);
            if (showToastOnLoad && fichasArray.length > 0) toast.success(`Se encontraron ${fichasArray.length} fichas.`);
            else if (fichasArray.length === 0 && !showToastOnLoad) toast("No hay fichas para este producto.", { icon: <Info/> });

        } catch (error) {
            const msg = error.response?.data?.message || error.message || "Error al cargar.";
            toast.error(msg); setFichas([]);
            if(idProduct) setProductName(`Producto ID: ${idProduct}`);
        } finally { setIsLoadingData(false); }
    }, [idProduct]);

    useEffect(() => { cargarFichasYProducto(); }, [idProduct, cargarFichasYProducto]);

    const toggleConfirmModal = useCallback(() => { if (isConfirmActionLoading) return; setConfirmModalOpen(p => !p); }, [isConfirmActionLoading]);
    useEffect(() => { if (!confirmModalOpen && !isConfirmActionLoading) { setConfirmModalProps({}); confirmActionRef.current = null; } }, [confirmModalOpen, isConfirmActionLoading]);
    const prepareConfirmation = useCallback((actionFn, props) => { confirmActionRef.current = () => actionFn(props.itemDetails); setConfirmModalProps(props); setConfirmModalOpen(true); }, [toggleConfirmModal]);
    
    const toggleDetailModal = useCallback(() => { setDetailModalOpen(p => !p); if (detailModalOpen) setSelectedFichaForDetail(null); }, [detailModalOpen]);
    const handleViewDetails = useCallback(async (idSpecSheet) => {
        if (!idSpecSheet) { toast.error("ID de ficha inválido."); return; }
        const toastId = toast.loading("Cargando detalles...");
        try {
            const fichaCompleta = await specSheetService.getSpecSheetById(idSpecSheet); // Fetchea la ficha completa
            if (fichaCompleta) {
                setSelectedFichaForDetail(fichaCompleta);
                setDetailModalOpen(true);
            } else {
                toast.error("No se pudieron cargar los detalles de la ficha.");
            }
        } catch (error) {
            toast.error(`Error al cargar detalles: ${error.response?.data?.message || error.message}`);
        } finally {
            toast.dismiss(toastId);
        }
    }, []);


    const executeChangeStatus = useCallback(async (details) => {
        if (!details || details.idSpecSheet === undefined || typeof details.newStatus !== 'boolean') { toast.error("Detalles inválidos."); setIsConfirmActionLoading(false); if (confirmModalOpen) toggleConfirmModal(); return; }
        const { idSpecSheet, newStatus } = details;
        setIsConfirmActionLoading(true);
        const toastId = toast.loading("Actualizando estado...");
        try {
            await specSheetService.changeSpecSheetStatus(idSpecSheet, newStatus);
            toast.success("Estado actualizado.", { id: toastId });
            await cargarFichasYProducto(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al actualizar.", { id: toastId });
        } finally { setIsConfirmActionLoading(false); if (confirmModalOpen) toggleConfirmModal(); }
    }, [cargarFichasYProducto, toggleConfirmModal, confirmModalOpen]);

    const requestChangeStatusConfirmation = useCallback((ficha) => {
        if (!ficha || ficha.idSpecSheet === undefined) { toast.error("ID de ficha inválido."); return; }
        const newStatus = !ficha.status; const actionText = newStatus ? "activar" : "desactivar";
        let msgBody = <p>¿{actionText} ficha ID <strong>{ficha.idSpecSheet}</strong> para "{productName || `Producto ID ${idProduct}`}"?</p>;
        if (newStatus === true) {
            const otraActiva = (Array.isArray(fichas) ? fichas : []).find(f => f.idProduct === ficha.idProduct && f.status === true && f.idSpecSheet !== ficha.idSpecSheet);
            if (otraActiva) msgBody = <>{msgBody}<Alert color="warning" className="mt-2 small py-1 px-2"><AlertTriangle size={16}/> Al activar, la ficha ID: {otraActiva.idSpecSheet} se desactivará.</Alert></>;
        }
        prepareConfirmation(executeChangeStatus, { title: `Confirmar ${newStatus ? 'Activación' : 'Desactivación'}`, message: msgBody, confirmText: `Sí, ${actionText}`, confirmColor: newStatus ? "success" : "warning", itemDetails: { idSpecSheet: ficha.idSpecSheet, newStatus } });
    }, [prepareConfirmation, productName, idProduct, fichas, executeChangeStatus]);

    const executeDeleteFicha = useCallback(async (details) => {
        if (!details || !details.idSpecSheet) { toast.error("ID inválido."); setIsConfirmActionLoading(false); if (confirmModalOpen) toggleConfirmModal(); return; }
        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Eliminando...');
        try {
            await specSheetService.deleteSpecSheet(details.idSpecSheet);
            toast.success(`Ficha ID ${details.idSpecSheet} eliminada.`, { id: toastId });
            await cargarFichasYProducto(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al eliminar.", { id: toastId });
        } finally { setIsConfirmActionLoading(false); if (confirmModalOpen) toggleConfirmModal(); }
    }, [cargarFichasYProducto, toggleConfirmModal, confirmModalOpen]);

    const requestDeleteConfirmation = useCallback((ficha) => {
        if (!ficha || !ficha.idSpecSheet) { toast.error("ID de ficha inválido."); return; }
        prepareConfirmation(executeDeleteFicha, { title: "Confirmar Eliminación", message: <><p>¿Eliminar ficha ID <strong>{ficha.idSpecSheet}</strong> del producto "{productName || `ID ${idProduct}`}"?</p>{ficha.status && <Alert color="warning" className="small py-1 px-2"><AlertTriangle size={16}/>Ficha activa.</Alert>}<p className="mt-2 text-danger"><strong>¡Acción irreversible!</strong></p></>, confirmText: "Sí, Eliminar", confirmColor: "danger", itemDetails: { idSpecSheet: ficha.idSpecSheet } });
    }, [prepareConfirmation, productName, idProduct, executeDeleteFicha]);

    const renderContent = () => {
        if (isLoadingData && idProduct) return (<div className="text-center p-5"><Spinner/><p>Cargando fichas...</p></div>);
        if (!idProduct) return (<div className="text-center p-4"><Alert color="info">Seleccione un producto desde la <Button color="link" className="p-0 alert-link align-baseline" onClick={handleNavigateToProductList}>lista de productos</Button> para ver sus fichas.</Alert></div>);
        if (!isLoadingData && (!fichas || fichas.length === 0)) return (<div className="text-center p-4"><Alert color="light" className="text-muted">No hay fichas para este producto.<span className="d-block mt-2">Puede <Button color="link" size="sm" className="p-0 align-baseline" onClick={handleNavigateToCrearFicha}>crear la primera</Button>.</span></Alert></div>);
        return (
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                <Table hover responsive size="sm" className="mb-0 custom-table align-middle">
                    <thead className="table-light"><tr><th>ID</th><th>Fecha Efectiva</th><th>Cant. Base</th><th>Unidad</th><th className="text-center">Estado</th><th className="text-center">Fin Vigencia</th><th className="text-center" style={{width:'220px'}}>Acciones</th></tr></thead>
                    <tbody>
                        {(Array.isArray(fichas) ? fichas : []).map(ficha => (
                            <tr key={ficha.idSpecSheet}>
                                <td>{ficha.idSpecSheet}</td>
                                <td>{ficha.dateEffective ? new Date(ficha.dateEffective).toLocaleDateString() : '-'}</td>
                                <td>{ficha.quantityBase}</td>
                                <td>{ficha.unitOfMeasure || ficha.Product?.unitOfMeasure || '-'}</td>
                                <td className="text-center"><Button size="sm" className={`status-button ${ficha.status ? 'status-active' : 'status-inactive'}`} onClick={() => requestChangeStatusConfirmation(ficha)} disabled={isConfirmActionLoading}>{ficha.status ? "Activa" : "Inactiva"}</Button></td>
                                <td className="text-center">{ficha.endDate ? new Date(ficha.endDate).toLocaleDateString() : (ficha.status === false ? 'N/A' : '-')}</td>
                                <td className="text-center">
                                    <div className="d-inline-flex flex-wrap gap-1 justify-content-center">
                                        <Button size="sm" color="info" outline onClick={() => handleViewDetails(ficha.idSpecSheet)} title="Ver Detalles" className="action-button" disabled={isConfirmActionLoading}><Eye size={16}/></Button>
                                        <Button size="sm" color="warning" outline onClick={() => handleNavigateToEditFicha(ficha.idSpecSheet)} title="Editar Ficha" className="action-button" disabled={isConfirmActionLoading}><Edit size={16}/></Button>
                                        <Button size="sm" color="danger" outline onClick={() => requestDeleteConfirmation(ficha)} title="Eliminar Ficha" className="action-button" disabled={isConfirmActionLoading || ficha.status}><Trash2 size={16}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    return (
        <Container fluid className="p-3 p-md-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500, error: { duration: 5000 } }}/>
            <Row className="mb-3 align-items-center page-header">
                <Col><h2 className="mb-0 page-title">{idProduct ? (isLoadingData && !productName ? <Spinner size="sm"/> : `Fichas: ${productName || `ID ${idProduct}`}`) : "Fichas Técnicas"}</h2></Col>
                <Col xs="auto" className="text-end d-flex gap-2">
                    {idProduct && (<Button color="success" size="sm" onClick={handleNavigateToCrearFicha} disabled={isConfirmActionLoading || isLoadingData}><Plus size={18}/> Crear Ficha</Button>)}
                    <Button color="secondary" outline size="sm" onClick={handleNavigateToProductList}><ArrowLeft size={18}/> Volver a Productos</Button>
                </Col>
            </Row>
            {renderContent()}
            <ConfirmationModal isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title} onConfirm={() => confirmActionRef.current && confirmActionRef.current()} confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor} isConfirming={isConfirmActionLoading}>{confirmModalProps.message}</ConfirmationModal>
            {selectedFichaForDetail && <FichaDetailModal isOpen={detailModalOpen} toggle={toggleDetailModal} ficha={selectedFichaForDetail}/>}
        </Container>
    );
};
export default ListaFichasTecnicas;