// src/components/Compras/GestionComprasPage.jsx (o donde prefieras)
import React, { useState, useEffect, useCallback } from 'react';
import {
    Form as ReactstrapForm, Button as ReactstrapButton, message, Row, Col, DatePicker, Typography, ConfigProvider, Select as AntdSelect, Spin
} from 'antd'; // Mantén imports de Antd que PUEDAN necesitarse temporalmente o en subcomponentes
import dayjs from 'dayjs';

// Imports de Reactstrap y otros necesarios
import 'bootstrap/dist/css/bootstrap.min.css';
import "../../../App.css"; // Asegúrate que la ruta a tus estilos sea correcta
import {
    Table, Button, Container, Input, Spinner, Label, FormGroup,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import { Eye, Plus, List, Trash2, Edit } from 'lucide-react'; // Íconos
import toast, { Toaster } from 'react-hot-toast';

// --- Service Imports ---
import registerPurchaseService from '../../services/registroCompraService';
import insumoService from '../../services/insumoService';
import providerService from '../../services/proveedorSevice';
import CustomPagination from '../../General/CustomPagination'; // Tu componente de paginación

// --- Componente Modal Detalles (Reutilizado de ListaComprasPage) ---
const PurchaseDetailsModal = ({ isOpen, toggle, purchase }) => {
    // ... (código del modal de detalles sin cambios, asegúrate que use Reactstrap si es necesario)
    if (!purchase) return null;
    const totalCalculado = purchase.purchaseDetails?.reduce((sum, item) => sum + (item.subtotal || 0), 0) ?? purchase.totalAmount ?? 0;

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static">
            <ModalHeader toggle={toggle}>
                <List size={20} className="me-2"/> Detalles de la Compra #{purchase.idRegisterPurchase}
            </ModalHeader>
            <ModalBody>
                <Row className="mb-3">
                    <Col md={6}><strong>Proveedor:</strong> {purchase.provider?.company || 'N/A'}</Col>
                    <Col md={6}><strong>Fecha:</strong> {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'N/A'}</Col>
                </Row>
                <h6>Insumos Incluidos:</h6>
                {purchase.purchaseDetails && purchase.purchaseDetails.length > 0 ? (
                    <Table bordered hover size="sm" responsive>
                        <thead /* style={{ backgroundColor: '#006400', color: 'white' }} */ className="table-dark">
                            <tr>
                                <th>Insumo</th>
                                <th className="text-end">Cantidad</th>
                                <th className="text-end">Precio Unit.</th>
                                <th className="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchase.purchaseDetails.map((detail, index) => (
                                <tr key={detail.idPurchaseDetail || index}>
                                    <td>{detail.insumo?.name || detail.insumo?.supplierName || `ID: ${detail.idInsumo}`}</td> {/* Intentar buscar nombre */}
                                    <td className="text-end">{detail.quantity}</td>
                                    <td className="text-end">${(detail.unitPrice || 0).toFixed(2)}</td>
                                    <td className="text-end">${(detail.subtotal || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3" className="text-end fw-bold">Total Compra:</td>
                                <td className="text-end fw-bold">${totalCalculado.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </Table>
                ) : (
                    <p>No hay detalles de insumos disponibles para esta compra.</p>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={toggle}>Cerrar</Button>
            </ModalFooter>
        </Modal>
    );
};

// --- Componente Principal ---
const GestionComprasPage = () => {

    // --- Estados para la Tabla Principal ---
    const [compras, setCompras] = useState([]);
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [tableSearchText, setTableSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // --- Estados para el Modal de Detalles de Compra ---
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPurchaseForDetails, setSelectedPurchaseForDetails] = useState(null);

    // --- Estados para el Modal del Formulario de Registro ---
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Para futuro 'editar compra'
    const [formData, setFormData] = useState({ // Estado para los datos del NUEVO registro
        idProvider: '',
        purchaseDate: dayjs().format('YYYY-MM-DD'), // Fecha actual por defecto YYYY-MM-DD
        details: [], // Array para los insumos de la nueva compra
    });
    const [formErrors, setFormErrors] = useState({}); // Para errores de validación del formulario
    const [providers, setProviders] = useState([]); // Lista de proveedores para el select
    const [insumos, setInsumos] = useState([]); // Lista de insumos para el select de detalles
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [loadingInsumos, setLoadingInsumos] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    // --- Colores ---
    const vinotintoColor = '#800020';
    const verdeOscuroColor = '#006400';
    // const verdeBrillanteColor = '#32CD32';

    // --- Fetch Data para la Tabla Principal ---
    const fetchCompras = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoadingTable(true);
        console.log("[FETCH Compras] Fetching purchases list...");
        try {
            const purchasesData = await registerPurchaseService.getAllRegisterPurchases();
            console.log("[FETCH Compras] Data:", purchasesData);
            setCompras(Array.isArray(purchasesData) ? purchasesData : []);
            if (!Array.isArray(purchasesData)) {
                 console.error("Purchase data is not an array:", purchasesData);
                 toast.error('Error: La respuesta del listado de compras no es válida.');
            }
        } catch (error) {
            console.error("[FETCH Compras ERROR]", error);
            toast.error("Error al cargar el listado de compras.");
            setCompras([]);
        } finally {
             if (showLoading) setIsLoadingTable(false);
        }
    }, []);

    useEffect(() => {
        fetchCompras(); // Carga inicial de la tabla
    }, [fetchCompras]);

    // --- Fetch Data para los Selects del Modal ---
    const fetchModalData = async () => {
        setLoadingProviders(true);
        setLoadingInsumos(true);
        let success = true;
        try {
            console.log("Fetching providers and insumos for modal...");
            const [providersData, insumosData] = await Promise.all([
                providerService.getAllProveedores(),
                insumoService.getAllInsumos()
            ]);

            console.log("Fetched Providers for modal:", providersData);
            console.log("Fetched Insumos for modal:", insumosData);

            setProviders(Array.isArray(providersData) ? providersData : []);
            setInsumos(Array.isArray(insumosData) ? insumosData : []);

            if (!Array.isArray(providersData)) {
                 console.error("Providers data is not an array:", providersData);
                 toast.error('Error al cargar proveedores para el formulario.');
                 success = false;
            }
            if (!Array.isArray(insumosData)) {
                 console.error("Insumos data is not an array:", insumosData);
                 toast.error('Error al cargar insumos para el formulario.');
                 success = false;
            }
        } catch (error) {
            console.error('Error fetching modal data:', error);
            toast.error('Error al cargar datos para el formulario.');
            setProviders([]);
            setInsumos([]);
            success = false;
        } finally {
            setLoadingProviders(false);
            setLoadingInsumos(false);
        }
        return success; // Indica si la carga fue exitosa
    };

    // --- Manejadores de Modales ---
    const toggleDetailsModal = () => setDetailsModalOpen(!detailsModalOpen);
    const handleShowDetails = (purchase) => {
        console.log("Showing details for:", purchase);
        setSelectedPurchaseForDetails(purchase);
        toggleDetailsModal();
    };

    const toggleFormModal = async () => {
        if (!formModalOpen) { // Si se está ABRIENDO el modal
            setIsEditing(false); // Por ahora solo modo 'Agregar'
            resetFormData();    // Limpia el formulario
            clearFormErrors();
            const dataLoaded = await fetchModalData(); // Carga datos para selects
            if (dataLoaded) {
                 setFormModalOpen(true); // Abre el modal SOLO si los datos cargaron bien
            } else {
                toast.error("No se pudo abrir el formulario. Intente de nuevo.")
            }
        } else { // Si se está CERRANDO
            setFormModalOpen(false);
        }
    };

    // --- Manejo del Formulario del Modal ---
    const resetFormData = () => {
        setFormData({
            idProvider: '',
            purchaseDate: dayjs().format('YYYY-MM-DD'),
            details: [],
        });
    };
    const clearFormErrors = () => setFormErrors({});

    // Handler genérico para inputs simples del formulario modal
    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpia error específico si existía
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- Manejo de Detalles (Insumos) dentro del Formulario Modal ---
    const handleAddDetailRow = () => {
        setFormData(prev => ({
            ...prev,
            details: [
                ...prev.details,
                // Nueva fila vacía, ajusta campos según necesites
                { key: Date.now(), idInsumo: '', quantity: 1, unitPrice: 0, subtotal: 0 }
            ]
        }));
    };

    const handleRemoveDetailRow = (keyToRemove) => {
        setFormData(prev => ({
            ...prev,
            details: prev.details.filter(detail => detail.key !== keyToRemove)
        }));
    };

    // Handler para cambios en una fila de detalle específica
    const handleDetailChange = (index, field, value) => {
        setFormData(prev => {
            const newDetails = [...prev.details];
            const currentDetail = { ...newDetails[index] };
            currentDetail[field] = value;

            // Recalcular subtotal si cambia cantidad o precio
            if (field === 'quantity' || field === 'unitPrice') {
                currentDetail.subtotal = (currentDetail.quantity || 0) * (currentDetail.unitPrice || 0);
            }

             // Si cambia el insumo, podrías querer resetear el precio o buscar uno por defecto
             if (field === 'idInsumo') {
                // Opcional: buscar precio por defecto para este insumo
                // currentDetail.unitPrice = getDefaultPrice(value);
                // currentDetail.subtotal = (currentDetail.quantity || 0) * (currentDetail.unitPrice || 0);
            }


            newDetails[index] = currentDetail;
            return { ...prev, details: newDetails };
        });
         // Limpiar error general de detalles si existe
        if (formErrors.details) {
             setFormErrors(prev => ({ ...prev, details: null }));
         }
    };

    // --- Validación del Formulario Modal ---
    const validateForm = () => {
        const errors = {};
        let isValid = true;

        if (!formData.idProvider) {
            errors.idProvider = "Seleccione un proveedor.";
            isValid = false;
        }
        if (!formData.purchaseDate) {
            errors.purchaseDate = "Seleccione una fecha.";
            isValid = false;
        } else if (!dayjs(formData.purchaseDate, 'YYYY-MM-DD', true).isValid()) {
            errors.purchaseDate = "Fecha inválida.";
            isValid = false;
        }

        if (!formData.details || formData.details.length === 0) {
            errors.details = "Debe agregar al menos un insumo.";
            isValid = false;
        } else {
            formData.details.forEach((detail, index) => {
                if (!detail.idInsumo) {
                    errors[`detail_${index}_idInsumo`] = "Seleccione insumo"; isValid = false;
                }
                if (!detail.quantity || detail.quantity <= 0) {
                    errors[`detail_${index}_quantity`] = "Cant. > 0"; isValid = false;
                }
                if (detail.unitPrice === undefined || detail.unitPrice === null || detail.unitPrice < 0) {
                    errors[`detail_${index}_unitPrice`] = "Precio >= 0"; isValid = false;
                }
            });
            if (!isValid && !errors.details) {
                 errors.details = "Revise los detalles, hay campos inválidos.";
            }
        }

        setFormErrors(errors);
        console.log("Validation Errors:", errors);
        return isValid;
    };

    // --- Submit del Formulario Modal ---
    const handleFormSubmit = async (event) => {
       event.preventDefault(); // Prevenir submit HTML si se usa <form>
        console.log("Attempting Submit. Form Data:", formData);
        if (!validateForm()) {
            toast.error("Por favor, corrija los errores en el formulario.");
            return;
        }

        setLoadingSubmit(true);
        try {
            const purchaseData = {
                idProvider: formData.idProvider,
                purchaseDate: formData.purchaseDate, // Ya está en YYYY-MM-DD
                totalAmount: formData.details.reduce((acc, detail) => acc + (detail.subtotal || 0), 0),
                // Mapea details quitando la 'key' temporal si la usaste
                purchaseDetails: formData.details.map(({ key, ...rest }) => ({
                    idInsumo: rest.idInsumo,
                    quantity: Number(rest.quantity), // Asegurar que sean números
                    unitPrice: Number(rest.unitPrice),
                    subtotal: Number(rest.subtotal),
                })),
            };

            console.log("Submitting purchase data:", purchaseData);
            await registerPurchaseService.createRegisterPurchase(purchaseData);

            toast.success('Compra registrada con éxito!');
            setFormModalOpen(false); // Cierra el modal
            await fetchCompras(false); // Recarga la tabla principal sin spinner completo
            // Opcional: ir a la última página si quieres ver el nuevo registro
             // const newTotalItems = compras.length + 1;
            // const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
            // handlePageChange(newTotalPages);

        } catch (error) {
            console.error('Error saving purchase:', error);
            const errorMsg = error.response?.data?.message || 'Error al guardar la compra';
            toast.error(`Error: ${errorMsg}`);
        } finally {
            setLoadingSubmit(false);
        }
    };


    // --- Búsqueda y Paginación para la Tabla Principal ---
    const handleTableSearch = (e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1);
    };

    const filteredData = compras.filter(
        (compra) =>
            (compra.provider?.company?.toLowerCase() ?? '').includes(tableSearchText) ||
            (String(compra.idRegisterPurchase ?? '').toLowerCase()).includes(tableSearchText) ||
            (compra.purchaseDate ? new Date(compra.purchaseDate).toLocaleDateString() : '').includes(tableSearchText)
    );

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1)); // Asegurar que la página actual sea válida
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredData.slice(startIndex, endIndex);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(pageNumber);
    }, []);

     // Ajustar currentPage si después de filtrar/eliminar queda en una página inválida
     useEffect(() => {
         const newTotalPages = Math.ceil(filteredData.length / itemsPerPage);
         const validTotalPages = Math.max(1, newTotalPages); // Al menos 1 página
         if (currentPage > validTotalPages) {
             setCurrentPage(validTotalPages);
         }
     }, [filteredData.length, itemsPerPage, currentPage]);


    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
             <Toaster position="top-center" toastOptions={{ className: 'react-hot-toast', style: { maxWidth: '500px' } }} />

            {/* Encabezado y Botón Agregar */}
            <Row className="mb-3 align-items-center">
                <Col xs={12} md={6}>
                    <h2 className="mb-md-0" style={{ color: vinotintoColor }}>Gestión de Compras</h2>
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
                     <Row className="g-2 justify-content-end">
                        <Col xs={12} sm="auto">
                             <Input
                                type="text" bsSize="sm" placeholder="Buscar por ID, Proveedor, Fecha..."
                                value={tableSearchText} onChange={handleTableSearch}
                                style={{ borderRadius: '0.25rem', maxWidth: '300px' }}
                             />
                        </Col>
                         <Col xs={12} sm="auto">
                            <Button
                                style={{ backgroundColor: verdeOscuroColor, borderColor: verdeOscuroColor, color: '#fff' }}
                                size="sm"
                                onClick={toggleFormModal} // Abre el modal del formulario
                                className="w-100 w-sm-auto"
                            >
                                <Plus size={18} className="me-1" /> Registrar Compra
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* Tabla de Compras */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table">
                     <thead className="table-dark" /* style={{ backgroundColor: verdeOscuroColor, color: 'white' }} */ >
                        <tr>
                            <th>ID</th>
                            <th>Proveedor</th>
                            <th>Fecha</th>
                            <th className="text-end">Monto Total</th>
                            {/*<th>Estado</th>*/}
                            <th className="text-center">Detalles</th>
                            {/* <th className="text-center">Acciones</th> */}
                        </tr>
                    </thead>
                    <tbody>
                         {isLoadingTable ? (
                            <tr><td colSpan="5" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((compra) => (
                                <tr key={compra.idRegisterPurchase} style={{ verticalAlign: 'middle' }}>
                                    <td>{compra.idRegisterPurchase}</td>
                                    <td>{compra.provider?.company || 'N/A'}</td>
                                    <td>{compra.purchaseDate ? new Date(compra.purchaseDate).toLocaleDateString() : '-'}</td>
                                    <td className="text-end">${(compra.totalAmount || 0).toFixed(2)}</td>
                                    <td className="text-center">
                                        <Button
                                            color="info"
                                            size="sm"
                                            outline
                                            onClick={() => handleShowDetails(compra)}
                                            title="Ver Detalles"
                                            // Deshabilitar si no hay detalles o si la info no está completa en la tabla
                                            disabled={!compra.purchaseDetails || compra.purchaseDetails.length === 0}
                                        >
                                            <Eye size={16} /> {/* Ver Más */}
                                        </Button>
                                    </td>
                                    {/* Acciones (Editar/Eliminar Compra - Implementar si es necesario)
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            <Button size="sm" title="Editar" className="action-button action-edit"><Edit size={16} /></Button>
                                            <Button size="sm" title="Eliminar" className="action-button action-delete"><Trash2 size={16} /></Button>
                                        </div>
                                    </td>
                                    */}
                                </tr>
                            ))
                         ) : (
                            <tr><td colSpan="5" className="text-center fst-italic p-4">
                                {tableSearchText
                                    ? 'No se encontraron compras que coincidan.'
                                    : (compras.length === 0 ? 'Aún no hay compras registradas.' : 'No hay resultados para mostrar.')
                                }
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

             {/* Paginador */}
             { totalPages > 1 && !isLoadingTable && (
                <CustomPagination
                    currentPage={validCurrentPage} // Usa la página validada
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
             )}

             {/* --- Modal para el Formulario de Registro --- */}
             <Modal isOpen={formModalOpen} toggle={toggleFormModal} centered size="xl" backdrop="static" keyboard={false}>
                 <ModalHeader toggle={toggleFormModal}>
                     {isEditing ? 'Editar Compra' : 'Registrar Nueva Compra'}
                 </ModalHeader>
                 {/* Usamos Reactstrap Form aquí */}
                 <ReactstrapForm onSubmit={handleFormSubmit}>
                     <ModalBody>
                         {(loadingProviders || loadingInsumos) && <div className="text-center mb-3"><Spinner>Cargando datos...</Spinner></div>}

                         {/* Fila para Proveedor y Fecha */}
                         <Row className="g-3 mb-3">
                             <Col md={6}>
                                 <FormGroup>
                                     <Label for="idProvider" className="fw-bold">Proveedor <span className="text-danger">*</span></Label>
                                     <Input
                                         id="idProvider"
                                         type="select"
                                         name="idProvider"
                                         value={formData.idProvider}
                                         onChange={handleFormInputChange}
                                         disabled={loadingProviders || providers.length === 0}
                                         invalid={!!formErrors.idProvider}
                                     >
                                         <option value="">Seleccione...</option>
                                         {/* Mapeo proveedores */}
                                         {providers.map(p => (
                                             <option key={p.idProvider} value={p.idProvider}>{p.company}</option>
                                         ))}
                                     </Input>
                                     {formErrors.idProvider && <div className="invalid-feedback d-block">{formErrors.idProvider}</div>}
                                     {!loadingProviders && providers.length === 0 && <small className="text-muted">No hay proveedores disponibles.</small>}
                                 </FormGroup>
                             </Col>
                             <Col md={6}>
                                 <FormGroup>
                                     <Label for="purchaseDate" className="fw-bold">Fecha Compra <span className="text-danger">*</span></Label>
                                     <Input
                                         id="purchaseDate"
                                         type="date"
                                         name="purchaseDate"
                                         value={formData.purchaseDate}
                                         onChange={handleFormInputChange}
                                         max={dayjs().format('YYYY-MM-DD')} // No permitir fechas futuras
                                         invalid={!!formErrors.purchaseDate}
                                     />
                                       {formErrors.purchaseDate && <div className="invalid-feedback d-block">{formErrors.purchaseDate}</div>}
                                 </FormGroup>
                             </Col>
                         </Row>

                         <hr />

                         {/* Sección de Detalles (Insumos) */}
                         <h5 className="mb-3">Detalles de Insumos</h5>
                          {formErrors.details && <div className="alert alert-danger py-1 px-2 mb-2" role="alert" style={{fontSize: '0.85rem'}}>{formErrors.details}</div>}

                         {/* Tabla para agregar/editar detalles */}
                         <Table bordered size="sm" responsive className="mb-3">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '40%' }}>Insumo <span className="text-danger">*</span></th>
                                    <th style={{ width: '15%' }} className="text-end">Cantidad <span className="text-danger">*</span></th>
                                    <th style={{ width: '20%' }} className="text-end">Precio Unit. ($) <span className="text-danger">*</span></th>
                                    <th style={{ width: '20%' }} className="text-end">Subtotal ($)</th>
                                    <th style={{ width: '5%' }}></th> {/* Acción */}
                                </tr>
                            </thead>
                            <tbody>
                                {formData.details.map((detail, index) => (
                                    <tr key={detail.key}>
                                        {/* Select Insumo */}
                                        <td>
                                            <Input
                                                bsSize="sm"
                                                type="select"
                                                name="idInsumo"
                                                value={detail.idInsumo}
                                                onChange={(e) => handleDetailChange(index, 'idInsumo', e.target.value)}
                                                disabled={loadingInsumos || insumos.length === 0}
                                                invalid={!!formErrors[`detail_${index}_idInsumo`]}
                                            >
                                                 <option value="">Seleccione...</option>
                                                 {/* Mapeo insumos (usa idSupplier y supplierName según tu servicio) */}
                                                 {insumos.map(i => (
                                                     <option key={i.idSupplier} value={i.idSupplier}>{i.supplierName}</option>
                                                 ))}
                                            </Input>
                                             {formErrors[`detail_${index}_idInsumo`] && <div className="invalid-feedback d-block" style={{fontSize: '0.75rem'}}>{formErrors[`detail_${index}_idInsumo`]}</div>}
                                        </td>
                                        {/* Input Cantidad */}
                                        <td>
                                            <Input
                                                bsSize="sm"
                                                type="number"
                                                name="quantity"
                                                min="1" // O 0.01 si permites decimales
                                                step="1" // O 0.01
                                                value={detail.quantity}
                                                onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                                                className="text-end"
                                                invalid={!!formErrors[`detail_${index}_quantity`]}
                                            />
                                             {formErrors[`detail_${index}_quantity`] && <div className="invalid-feedback d-block" style={{fontSize: '0.75rem'}}>{formErrors[`detail_${index}_quantity`]}</div>}
                                        </td>
                                        {/* Input Precio Unitario */}
                                        <td>
                                            <Input
                                                bsSize="sm"
                                                type="number"
                                                name="unitPrice"
                                                min="0"
                                                step="0.01" // Para centavos
                                                value={detail.unitPrice}
                                                onChange={(e) => handleDetailChange(index, 'unitPrice', e.target.value)}
                                                className="text-end"
                                                invalid={!!formErrors[`detail_${index}_unitPrice`]}
                                            />
                                             {formErrors[`detail_${index}_unitPrice`] && <div className="invalid-feedback d-block" style={{fontSize: '0.75rem'}}>{formErrors[`detail_${index}_unitPrice`]}</div>}
                                        </td>
                                        {/* Subtotal (calculado) */}
                                        <td className="text-end align-middle">
                                            ${(detail.subtotal || 0).toFixed(2)}
                                        </td>
                                        {/* Botón Eliminar Fila */}
                                        <td className="text-center align-middle">
                                            <Button
                                                color="danger"
                                                size="sm"
                                                outline
                                                onClick={() => handleRemoveDetailRow(detail.key)}
                                                title="Eliminar fila"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                         </Table>

                         {/* Botón para agregar nueva fila de detalle */}
                         <Button
                            color="success"
                            outline
                            size="sm"
                            onClick={handleAddDetailRow}
                            disabled={loadingInsumos || insumos.length === 0}
                            className="mb-3"
                         >
                             <Plus size={16} className="me-1" /> Agregar Insumo
                         </Button>
                         {!loadingInsumos && insumos.length === 0 && <small className="text-muted d-block mb-3">No hay insumos disponibles para agregar.</small>}

                        {/* Total General (opcional mostrarlo aquí) */}
                         <div className="text-end fw-bold fs-5">
                             Total Compra: ${formData.details.reduce((acc, d) => acc + (d.subtotal || 0), 0).toFixed(2)}
                         </div>

                     </ModalBody>
                     <ModalFooter>
                         <Button color="secondary" outline onClick={toggleFormModal} disabled={loadingSubmit}>Cancelar</Button>
                         <Button color="primary" type="submit" disabled={loadingSubmit || loadingProviders || loadingInsumos}>
                             {loadingSubmit ? <><Spinner size="sm" className="me-1"/> Guardando...</> : (isEditing ? 'Actualizar Compra' : 'Guardar Compra')}
                         </Button>
                     </ModalFooter>
                 </ReactstrapForm>
             </Modal>

            {/* Modal de Detalles (sin cambios) */}
            <PurchaseDetailsModal
                isOpen={detailsModalOpen}
                toggle={toggleDetailsModal}
                purchase={selectedPurchaseForDetails}
            />

        </Container>
    );
};

export default GestionComprasPage;