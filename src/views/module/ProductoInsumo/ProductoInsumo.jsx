// src/views/module/ProductoInsumo/ProductoInsumo.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css";
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, InputGroup, InputGroupText, Alert
} from "reactstrap";
import { 
    Trash2, Edit, Plus, AlertTriangle, ListChecks, FileText, 
    Package, Loader, Settings2, DollarSign, CheckCircle, XCircle 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import productService from "../../services/productService";
import CustomPagination from "../../General/CustomPagination";
import { ActiveOrdersContext } from "../OrdenProduccion/ActiveOrdersContext";

// Helper para formatear moneda
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
};

// Componente de Modal de Confirmación (Genérico)
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static">
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
            <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? <Spinner size="sm" /> : confirmText}
            </Button>
        </ModalFooter>
    </Modal>
);

const INITIAL_FORM_STATE = { idProduct: "", productName: "", minStock: 0, maxStock: 0, currentStock: 0, status: true, sellingPrice: 0 };
const ITEMS_PER_PAGE = 5;

const ProductoInsumo = () => {
    // --- ESTADOS ---
    const [data, setData] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [tableSearchText, setTableSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    
    // Modales de Formulario (Crear/Editar)
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingForm, setIsSavingForm] = useState(false);

    // Modal de Ajuste de Inventario
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [productToAdjust, setProductToAdjust] = useState(null);
    const [adjustmentForm, setAdjustmentForm] = useState({ quantity: '', type: 'entrada', reason: '' });
    const [isAdjustingStock, setIsAdjustingStock] = useState(false);

    // Modal de Confirmación (Eliminar/Estado)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmProps, setConfirmProps] = useState({ title: "", message: "", color: "primary", action: null });

    const navigate = useNavigate();
    // Tomamos órdenes activas para calcular porciones que están "en producción"
    const { activeOrders } = useContext(ActiveOrdersContext) || {};
    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoadingData(true);
        try {
            const response = await productService.getAllProducts();
            setData(Array.isArray(response) ? response : []);
        } catch (error) {
            toast.error("Error al cargar productos.");
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Helpers para extraer valores de 'details' con varios nombres posibles
    const extractNumericField = (detail, candidates) => {
        if (!detail) return null;
        for (const key of candidates) {
            if (detail.hasOwnProperty(key) && detail[key] !== null && detail[key] !== undefined && detail[key] !== '') {
                const val = detail[key];
                const n = Number(val);
                if (!isNaN(n)) return n;
                return val;
            }
        }
        // fallback: buscar la primera propiedad numérica
        for (const k of Object.keys(detail)) {
            const v = detail[k];
            const n = Number(v);
            if (!isNaN(n)) return n;
        }
        return null;
    };

    const getNeededFromDetail = (detail) => {
        const candidates = ['needed','quantityNeeded','required','need','neededQty','requiredQuantity','quantityRequired','neededQuantity','quantity','requiredQty'];
        const v = extractNumericField(detail, candidates);
        return v !== null ? v : null;
    };

    const getAvailableFromDetail = (detail) => {
        const candidates = ['available','quantityAvailable','stock','availableQuantity','quantityAvailable','qtyAvailable','stockAvailable'];
        const v = extractNumericField(detail, candidates);
        return v !== null ? v : null;
    };

    const FINAL_STATUSES = useMemo(() => new Set(['COMPLETED', 'ALL_STEPS_COMPLETED', 'CANCELLED']), []);

    // Map de porciones en producción: sólo contamos órdenes que están efectivamente en proceso
    const enProduccionMap = useMemo(() => {
        if (!activeOrders) return {};
        // Depuración: mostrar resumen de órdenes activas al calcular el mapa
        try { console.debug('enProduccionMap: activeOrders snapshot', Object.values(activeOrders).map(o => ({ id: o.id, status: o.localOrderStatus, initialAmount: o.formOrder?.initialAmount, finalQuantity: o.formOrder?.finalQuantityProduct, idProduct: o.formOrder?.idProduct }))); } catch(e) {}
        const map = {};
        Object.values(activeOrders).forEach(order => {
            const form = order?.formOrder;
            if (!form) return;
            const pid = form.idProduct;
            if (!pid) return;
            const status = String(order?.localOrderStatus || '').toUpperCase();
            // Contar únicamente órdenes iniciadas (en proceso)
            if (status !== 'IN_PROGRESS') return;
            const portions = Number(form.initialAmount) || 0; // porciones previstas al iniciar
            if (!portions) return;
            map[pid] = (map[pid] || 0) + portions;
        });
        return map;
    }, [activeOrders]);

    // Cuando una orden pasa a COMPLETED o cambia su `finalQuantityProduct`, refrescamos productos
    const prevActiveOrdersRef = useRef({});
    useEffect(() => {
        const prev = prevActiveOrdersRef.current || {};
        let needRefresh = false;
        try { console.debug('prevActiveOrders keys', Object.keys(prev).length, 'current keys', Object.keys(activeOrders || {}).length); } catch(e) {}
        Object.keys(activeOrders || {}).forEach(id => {
            const prevOrder = prev[id];
            const curOrder = activeOrders[id];
            const prevStatus = String(prevOrder?.localOrderStatus || '').toUpperCase();
            const curStatus = String(curOrder?.localOrderStatus || '').toUpperCase();
            // Si pasó de un estado NO final a un estado final -> refrescar
            if (!FINAL_STATUSES.has(prevStatus) && FINAL_STATUSES.has(curStatus)) {
                needRefresh = true; // orden finalizó o llegó a 'procesos finalizados' -> el stock puede haber cambiado
            }
            const prevFinal = prevOrder?.formOrder?.finalQuantityProduct;
            const curFinal = curOrder?.formOrder?.finalQuantityProduct;
            if (FINAL_STATUSES.has(curStatus) && prevFinal !== curFinal) {
                needRefresh = true; // cantidad final modificada -> refrescar stock
            }
        });
        try { if (needRefresh) console.debug('ProductoInsumo: needRefresh=true debido a cambio en activeOrders'); } catch(e) {}
        // También detectar órdenes que fueron removidas (pasaron a COMPLETED y el provider las eliminó)
        Object.keys(prev).forEach(id => { if (!activeOrders || !activeOrders[id]) { const was = prev[id]; if (was && !FINAL_STATUSES.has(String(was.localOrderStatus).toUpperCase())) { needRefresh = true; } } });
        if (needRefresh) fetchData(false);
        prevActiveOrdersRef.current = activeOrders || {};
    }, [activeOrders, fetchData]);

    

    // --- LÓGICA DE FORMULARIO (CREAR/EDITAR) ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.productName.length < 3) return toast.error("Nombre demasiado corto");
        
        setIsSavingForm(true);
        const toastId = toast.loading("Guardando...");
        try {
            if (isEditing) {
                await productService.updateProduct(form.idProduct, form);
                toast.success("Producto actualizado", { id: toastId });
            } else {
                await productService.createProduct(form);
                toast.success("Producto creado", { id: toastId });
            }
            setModalOpen(false);
            fetchData(false);
        } catch (error) {
            toast.error("Error al procesar", { id: toastId });
        } finally {
            setIsSavingForm(false);
        }
    };

    // --- LÓGICA DE AJUSTE DE INVENTARIO ---
    const openAdjustModal = (product) => {
        setProductToAdjust(product);
        setAdjustmentForm({ quantity: '', type: 'entrada', reason: '' });
        setAdjustModalOpen(true);
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const { quantity, type, reason } = adjustmentForm;
        if (!quantity || quantity <= 0) return toast.error("Cantidad inválida");

        setIsAdjustingStock(true);
        const toastId = toast.loading("Aplicando ajuste...");
        
        // El signo depende del tipo de ajuste
        const factor = (type === 'consumo' || type === 'merma') ? -1 : 1;
        const finalQuantity = Number(quantity) * factor;

        try {
            await productService.adjustStock(productToAdjust.idProduct, {
                quantity: finalQuantity,
                reason: `${type.toUpperCase()}: ${reason}`
            });
            toast.success("Inventario ajustado correctamente", { id: toastId });
            setAdjustModalOpen(false);
            fetchData(false);
        } catch (error) {
            toast.error("Error al ajustar stock", { id: toastId });
        } finally {
            setIsAdjustingStock(false);
        }
    };

    // --- ACCIONES (ESTADO Y ELIMINAR) ---
    const toggleStatus = (product) => {
        setConfirmProps({
            title: "Cambiar Estado",
            message: `¿Desea ${product.status ? 'desactivar' : 'activar'} el producto ${product.productName}?`,
            color: product.status ? "warning" : "success",
            action: async () => {
                await productService.changeStateProduct(product.idProduct, !product.status);
                fetchData(false);
            }
        });
        setConfirmModalOpen(true);
    };

    const deleteProduct = (product) => {
        setConfirmProps({
            title: "Eliminar Producto",
            message: `¿Está seguro de eliminar ${product.productName}? Esta acción es irreversible.`,
            color: "danger",
            action: async () => {
                await productService.deleteProduct(product.idProduct);
                fetchData(false);
            }
        });
        setConfirmModalOpen(true);
    };

    // --- FILTRADO Y PAGINACIÓN ---
    const filteredData = useMemo(() => {
        return data.filter(item => 
            item.productName?.toLowerCase().includes(tableSearchText.toLowerCase()) || 
            String(item.idProduct).includes(tableSearchText)
        ).sort((a, b) => b.idProduct - a.idProduct);
    }, [data, tableSearchText]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const currentItems = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" />
            <h2 className="mb-4 fw-bold">Gestión de Productos e Insumos</h2>

            {/* BARRA SUPERIOR */}
            <Row className="mb-3 align-items-center">
                <Col md={5}>
                    <Input 
                        placeholder="Buscar por nombre o ID..." 
                        value={tableSearchText} 
                        onChange={(e) => { setTableSearchText(e.target.value); setCurrentPage(1); }} 
                    />
                </Col>
                <Col className="text-end">
                    <Button color="success" onClick={() => { setForm(INITIAL_FORM_STATE); setIsEditing(false); setModalOpen(true); }}>
                        <Plus size={18} className="me-1" /> Nuevo Producto
                    </Button>
                </Col>
            </Row>

            {/* TABLA PRINCIPAL */}
            <div className="table-responsive shadow-sm bg-white rounded">
                <Table hover striped className="align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th className="ps-3">ID</th>
                            <th>Nombre</th>
                            <th className="text-center">Precio</th>
                            <th className="text-center">Stock Actual</th>
                            <th className="text-center">En Producción</th>
                            <th className="text-center">Total Final</th>
                            <th className="text-center">Min/Max</th>
                            <th className="text-center">Estado</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingData ? (
                            <tr><td colSpan="9" className="text-center py-5"><Spinner color="primary" /></td></tr>
                        ) : currentItems.map((item) => {
                            const stockActual = Number(item.currentStock ?? 0);
                            const enProduccionFromOrders = Number(enProduccionMap[item.idProduct] ?? 0);
                            const enProduccionBackend = Number(item.stockInProduction ?? 0);
                            // Preferir el valor calculado desde órdenes activas cuando exista, si no usar el backend
                            const enProduccion = enProduccionFromOrders > 0 ? enProduccionFromOrders : enProduccionBackend;
                            const totalFinal = stockActual + (enProduccion || 0);

                            return (
                                <tr key={item.idProduct}>
                                    <td className="ps-3">{item.idProduct}</td>
                                    <td className="fw-bold text-dark">{item.productName}</td>
                                    <td className="text-center text-success fw-bold">{formatCurrency(item.sellingPrice)}</td>
                                    
                                    {/* STOCK ACTUAL: Inventario Real */}
                                    <td className="text-center bg-light fw-bold text-primary">
                                        <Package size={14} className="me-1" />
                                        {stockActual}
                                    </td>

                                    {/* EN PRODUCCIÓN */}
                                    <td className="text-center">
                                        {enProduccion > 0 ? (
                                            <span className="text-warning fw-bold">
                                                <Loader size={14} className="me-1 lucide-spin" /> {enProduccion}
                                            </span>
                                        ) : (
                                            <span className="text-muted fw-bold">0</span>
                                        )}
                                    </td>

                                    {/* TOTAL FINAL: Calculado */}
                                    <td className="text-center fw-bold bg-primary bg-opacity-10 text-primary">
                                        <ListChecks size={16} className="me-1" />
                                        {totalFinal}
                                    </td>

                                    <td className="text-center small text-muted">
                                        {item.minStock} / {item.maxStock}
                                    </td>

                                    <td className="text-center">
                                        <Button 
                                            size="sm" 
                                            color={item.status ? "success" : "secondary"} 
                                            outline 
                                            className="rounded-pill"
                                            onClick={() => toggleStatus(item)}
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>

                                    <td className="text-center pe-3">
                                        <div className="d-flex gap-1 justify-content-center">
                                            {/* AJUSTE DE INVENTARIO (NUEVO) */}
                                            <Button size="sm" color="info" outline title="Ajuste de Inventario" onClick={() => openAdjustModal(item)}>
                                                <Settings2 size={16} />
                                            </Button>
                                            
                                            <Button size="sm" color="primary" outline title="Fichas Técnicas" onClick={() => navigate(`/home/producto/${item.idProduct}/fichas`)}>
                                                <FileText size={16} />
                                            </Button>
                                            
                                            <Button size="sm" color="warning" outline title="Editar" onClick={() => { setForm(item); setIsEditing(true); setModalOpen(true); }}>
                                                <Edit size={16} />
                                            </Button>

                                            <Button size="sm" color="danger" outline title="Eliminar" onClick={() => deleteProduct(item)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>

            {/* PAGINACIÓN */}
            {!isLoadingData && totalPages > 1 && (
                <div className="mt-3">
                    <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* MODAL CREAR / EDITAR */}
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered>
                <ModalHeader toggle={() => setModalOpen(false)}>
                    {isEditing ? <Edit size={20} className="me-2"/> : <Plus size={20} className="me-2"/>}
                    {isEditing ? "Editar Producto" : "Nuevo Producto"}
                </ModalHeader>
                <Form onSubmit={handleSubmit}>
                    <ModalBody>
                        <FormGroup>
                            <Label className="fw-bold">Nombre del Producto/Insumo</Label>
                            <Input name="productName" value={form.productName} onChange={handleInputChange} required />
                        </FormGroup>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label className="fw-bold">Stock Mínimo</Label>
                                    <Input type="number" name="minStock" value={form.minStock} onChange={handleInputChange} />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label className="fw-bold">Stock Máximo</Label>
                                    <Input type="number" name="maxStock" value={form.maxStock} onChange={handleInputChange} />
                                </FormGroup>
                            </Col>
                        </Row>
                        {isEditing && (
                            <FormGroup>
                                <Label className="fw-bold text-muted">Precio Sugerido (Ficha Técnica)</Label>
                                <InputGroup>
                                    <InputGroupText><DollarSign size={16}/></InputGroupText>
                                    <Input value={formatCurrency(form.sellingPrice)} disabled />
                                </InputGroup>
                            </FormGroup>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" outline onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button color="primary" type="submit" disabled={isSavingForm}>
                            {isSavingForm ? <Spinner size="sm" /> : "Guardar Producto"}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* MODAL AJUSTE DE INVENTARIO */}
            <Modal isOpen={adjustModalOpen} toggle={() => !isAdjustingStock && setAdjustModalOpen(false)} centered>
                <ModalHeader>Ajuste Manual de Inventario</ModalHeader>
                <Form onSubmit={handleAdjustSubmit}>
                    <ModalBody>
                        <div className="mb-3 p-3 bg-light rounded border">
                            <h6 className="mb-1 text-muted">Producto:</h6>
                            <p className="mb-0 fw-bold fs-5">{productToAdjust?.productName}</p>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between">
                                <span>Stock Actual Real:</span>
                                <strong className="text-primary">{productToAdjust?.currentStock} unidades</strong>
                            </div>
                        </div>

                        <FormGroup>
                            <Label className="fw-bold">Tipo de Ajuste</Label>
                            <Input type="select" value={adjustmentForm.type} 
                                onChange={(e) => setAdjustmentForm({...adjustmentForm, type: e.target.value})}>
                                <option value="entrada">Entrada (+) - Compra / Devolución</option>
                                <option value="consumo">Consumo (-) - Uso interno</option>
                                <option value="merma">Merma (-) - Desperdicio / Daño</option>
                                <option value="correccion">Corrección (+/-) - Ajuste de conteo</option>
                            </Input>
                        </FormGroup>

                        <FormGroup>
                            <Label className="fw-bold">Cantidad</Label>
                            <Input type="number" min="0.01" step="any" required 
                                value={adjustmentForm.quantity}
                                onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity: e.target.value})} 
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label className="fw-bold">Motivo del Ajuste</Label>
                            <Input type="textarea" placeholder="Explique por qué realiza este cambio..." required
                                value={adjustmentForm.reason}
                                onChange={(e) => setAdjustmentForm({...adjustmentForm, reason: e.target.value})} 
                            />
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" outline onClick={() => setAdjustModalOpen(false)} disabled={isAdjustingStock}>Cancelar</Button>
                        <Button color="primary" type="submit" disabled={isAdjustingStock}>
                            {isAdjustingStock ? <Spinner size="sm" /> : "Aplicar Ajuste"}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* MODAL CONFIRMACIÓN (ESTADO/ELIMINAR) */}
            <ConfirmationModal 
                isOpen={confirmModalOpen} 
                toggle={() => setConfirmModalOpen(false)}
                title={confirmProps.title}
                confirmColor={confirmProps.color}
                onConfirm={async () => {
                    try {
                        await confirmProps.action();
                        toast.success("Operación exitosa");
                    } catch (e) {
                        toast.error("No se pudo realizar la acción");
                    } finally {
                        setConfirmModalOpen(false);
                    }
                }}
            >
                {confirmProps.message}
            </ConfirmationModal>
        </Container>
    );
};

export default ProductoInsumo;