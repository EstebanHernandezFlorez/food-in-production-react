import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css";
import {
  Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert, FormFeedback,
} from "reactstrap";
import {
  Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, ListChecks, FileText, Package,
  PackagePlus,
  ChefHat // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import productService from "../../services/productService";
import CustomPagination from "../../General/CustomPagination";


const ConfirmationModal = ({
  isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar",
  confirmColor = "primary", isConfirming = false,
}) => (
  <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
    <ModalHeader toggle={!isConfirming ? toggle : undefined}>
      <div className="d-flex align-items-center">
        <AlertTriangle size={24} className={`text-${confirmColor === "danger" ? "danger" : confirmColor === "warning" ? "warning" : "primary"} me-2`}/>
        <span className="fw-bold">{title}</span>
      </div>
    </ModalHeader>
    <ModalBody>{children}</ModalBody>
    <ModalFooter>
      <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
      <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
        {isConfirming ? (<><Spinner size="sm" className="me-1" /> Procesando...</>) : (confirmText)}
      </Button>
    </ModalFooter>
  </Modal>
);

// --- Constants ---
const LOG_PREFIX = "[ProductoInsumo]";
const INITIAL_FORM_STATE = { idProduct: "", productName: "", minStock: "", maxStock: "", currentStock: 0, status: true };
const INITIAL_FORM_ERRORS = { productName: false, minStock: false, maxStock: false, currentStock: false, general: "" };
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null };
const ITEMS_PER_PAGE = 5;

// --- Main Component ---
const ProductoInsumo = () => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tableSearchText, setTableSearchText] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
  const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({ quantity: '', reason: '', type: 'entrada' });
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  
  const navigate = useNavigate();
  const confirmActionRef = useRef(null);
  
  const fetchData = useCallback(async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) setIsLoadingData(true);
      try {
        const response = await productService.getAllProducts();
        const fetchedData = Array.isArray(response) ? response : response?.data || [];
        setData(fetchedData);
      } catch (error) {
        toast.error("Error al cargar productos/insumos.");
        setData([]);
      } finally {
        if (showLoadingSpinner) setIsLoadingData(false);
      }
  }, []);

  useEffect(() => {
      fetchData();
  }, [fetchData]);

  const handleNavigateToProductFichas = (productId) => {
      if (!productId) {
          toast.error("No se pudo obtener el ID del producto.");
          return;
      }
      navigate(`/home/producto/${productId}/fichas`);
  };

  const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);
  const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);
  
  const validateForm = useCallback(() => {
      let errors = { ...INITIAL_FORM_ERRORS };
      let isValid = true;
      errors.general = "";
    
      const trimmedName = String(form.productName ?? "").trim();
      if (!trimmedName || trimmedName.length < 3 || !/^[a-zA-Z0-9\sñÑáéíóúÁÉÍÓÚüÜ]+$/.test(trimmedName)) {
          errors.productName = true;
          isValid = false;
      }
    
      const minStock = form.minStock !== "" ? Number(form.minStock) : null;
      const maxStock = form.maxStock !== "" ? Number(form.maxStock) : null;
      const currentStock = form.currentStock !== "" ? Number(form.currentStock) : null;
  
      if (!isEditing && (currentStock === null || isNaN(currentStock) || currentStock < 0)) {
          errors.currentStock = true;
          isValid = false;
      }
    
      if (minStock !== null && (isNaN(minStock) || minStock < 0)) {
          errors.minStock = true;
          isValid = false;
      }
      if (maxStock !== null && (isNaN(maxStock) || maxStock < 0)) {
          errors.maxStock = true;
          isValid = false;
      }
    
      if (minStock !== null && maxStock !== null && maxStock > 0 && minStock > maxStock) {
          errors.minStock = true;
          errors.maxStock = true;
          errors.general = "El stock máximo no puede ser menor que el mínimo.";
          isValid = false;
      }
    
      setFormErrors(errors);
      return isValid;
  }, [form, isEditing]);

  const handleChange = useCallback((e) => {
      const { name, value, type } = e.target;
      const val = type === 'number' && value === '' ? '' : value;
      setForm((prev) => ({ ...prev, [name]: val }));
      if (formErrors[name] || formErrors.general) {
          setFormErrors((prevErr) => ({ ...prevErr, [name]: false, general: "" }));
      }
  }, [formErrors]);

  const handleTableSearch = useCallback((e) => {
      setTableSearchText(e.target.value.toLowerCase());
      setCurrentPage(1);
  }, []);

  const toggleMainModal = useCallback(() => {
      const closing = modalOpen;
      setModalOpen((prev) => !prev);
      if (closing) {
          resetForm();
          clearFormErrors();
          setIsEditing(false);
      }
  }, [modalOpen, resetForm, clearFormErrors]);

  const toggleConfirmModal = useCallback(() => {
      if (isConfirmActionLoading) return;
      setConfirmModalOpen((prev) => !prev);
  }, [isConfirmActionLoading]);

  useEffect(() => {
      if (!confirmModalOpen && !isConfirmActionLoading) {
          setConfirmModalProps(INITIAL_CONFIRM_PROPS);
          confirmActionRef.current = null;
      }
  }, [confirmModalOpen, isConfirmActionLoading]);
  
  const prepareConfirmation = useCallback((actionFn, props) => {
      const detailsToPass = props.itemDetails;
      confirmActionRef.current = () => actionFn ? actionFn(detailsToPass) : toggleConfirmModal();
      setConfirmModalProps(props);
      setConfirmModalOpen(true);
  }, [toggleConfirmModal]);

  const handleSubmit = useCallback(async () => {
      if (!validateForm()) {
          toast.error(formErrors.general || "Revise los campos marcados.");
          return;
      }
      setIsSavingForm(true);
      const actionText = isEditing ? "Actualizando" : "Agregando";
      const toastId = toast.loading(`${actionText} producto/insumo...`);
      
      const dataToSend = {
          ...form,
          productName: form.productName.trim(),
          minStock: form.minStock === '' ? 0 : Number(form.minStock),
          maxStock: form.maxStock === '' ? 0 : Number(form.maxStock),
          currentStock: form.currentStock === '' ? 0 : Number(form.currentStock),
      };
      
      if (isEditing) {
          delete dataToSend.currentStock;
          delete dataToSend.idProduct;
      } else {
          delete dataToSend.idProduct;
      }

      try {
          if (isEditing) {
              if (!form.idProduct) throw new Error("ID no válido para actualizar.");
              await productService.updateProduct(form.idProduct, dataToSend);
          } else {
              await productService.createProduct(dataToSend);
          }
          toast.success(`Producto/Insumo ${isEditing ? "actualizado" : "agregado"}!`, { id: toastId });
          toggleMainModal();
          await fetchData(false);
          setCurrentPage(1);
      } catch (error) {
          const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Error desconocido";
          setFormErrors((prev) => ({ ...prev, general: `Error: ${errorMsg}` }));
          toast.error(`Error al ${actionText.toLowerCase()}: ${errorMsg}`, { id: toastId, duration: 5000 });
      } finally {
          setIsSavingForm(false);
      }
  }, [form, isEditing, validateForm, toggleMainModal, fetchData, formErrors.general]);

  const requestChangeStatusConfirmation = useCallback((product) => {
    if (!product || !product.idProduct) return;
    const { idProduct, status: currentStatus, productName } = product;
    const actionText = currentStatus ? "desactivar" : "activar";
    const futureStatusText = currentStatus ? "Inactivo" : "Activo";
    const confirmColor = currentStatus ? "warning" : "success";
    prepareConfirmation(executeChangeStatus, {
      title: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      message: ( <p> ¿<strong>{actionText}</strong> el producto/insumo{" "} <strong>{productName || "seleccionado"}</strong>? <br /> Estado será: <strong>{futureStatusText}</strong>. </p> ),
      confirmText: `Sí, ${actionText}`,
      confirmColor,
      itemDetails: { idProduct, currentStatus, productName },
    });
  }, [prepareConfirmation]);
  
  const executeChangeStatus = useCallback(async (details) => {
    if (!details || !details.idProduct) {
        toast.error("Error interno: Detalles del producto no encontrados.");
        toggleConfirmModal();
        return;
      }
      const { idProduct, currentStatus, productName } = details;
      const newStatus = !currentStatus;
      const actionText = newStatus ? "activado" : "desactivado";
      setIsConfirmActionLoading(true);
      const toastId = toast.loading( `${currentStatus ? "Desactivando" : "Activando"} "${productName || ""}"...` );
      try {
        await productService.changeStateProduct(idProduct, newStatus);
        await fetchData(false);
        toast.success(`Producto/Insumo "${productName || ""}" ${actionText}.`, { id: toastId });
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || "Error desconocido.";
        toast.error(`Error al ${currentStatus ? "desactivar" : "activar"}: ${errorMsg}`,{ id: toastId });
      } finally {
        toggleConfirmModal();
        setIsConfirmActionLoading(false);
      }
  }, [toggleConfirmModal, fetchData]);

  const requestDeleteConfirmation = useCallback((product) => {
    if (!product || !product.idProduct) return;
      prepareConfirmation(executeDelete, {
        title: "Confirmar Eliminación",
        message: ( <> <p>¿Eliminar permanentemente <strong>{product.productName || "este producto/insumo"}</strong>?</p> <p><strong className="text-danger">¡Acción irreversible!</strong></p> </> ),
        confirmText: "Eliminar Definitivamente",
        confirmColor: "danger",
        itemDetails: { idProduct: product.idProduct, productName: product.productName },
      });
  }, [prepareConfirmation]);

  const executeDelete = useCallback(async (productToDelete) => {
    if (!productToDelete || !productToDelete.idProduct) {
        toast.error("Error interno.");
        toggleConfirmModal();
        return;
      }
      setIsConfirmActionLoading(true);
      const toastId = toast.loading(`Eliminando "${productToDelete.productName || ""}"...`);
      try {
        await productService.deleteProduct(productToDelete.idProduct);
        toast.success(`Producto/Insumo "${productToDelete.productName || ""}" eliminado.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
        await fetchData(false);
      } catch (error) {
        let rawErrorMessage = error.response?.data?.message || "Error desconocido.";
        let displayErrorMessage = `Error al eliminar: ${rawErrorMessage}`;
        let toastIcon = <XCircle className="text-danger" />;
        let toastDuration = 3500;
        const lowerCaseError = rawErrorMessage.toLowerCase();
        if (lowerCaseError.includes('foreign key constraint fails')) {
          displayErrorMessage = `El producto "${productToDelete.productName || ""}" no se puede eliminar porque está en uso. Considere desactivarlo.`;
          toastIcon = <AlertTriangle className="text-warning" />;
          toastDuration = 8000;
        }
        toast.error(displayErrorMessage, { id: toastId, icon: toastIcon, duration: toastDuration });
      } finally {
        toggleConfirmModal();
        setIsConfirmActionLoading(false);
      }
  }, [toggleConfirmModal, fetchData]);
  
  const openAddModal = useCallback(() => {
    resetForm();
    clearFormErrors();
    setIsEditing(false);
    setModalOpen(true);
  }, [resetForm, clearFormErrors]);

  const openEditModal = useCallback((item) => {
    setForm({
        idProduct: item.idProduct || "",
        productName: item.productName || "",
        minStock: item.minStock ?? '',
        maxStock: item.maxStock ?? '',
        status: item.status !== undefined ? item.status : true,
    });
    setIsEditing(true);
    clearFormErrors();
    setModalOpen(true);
  }, [clearFormErrors]);

  const openAdjustModal = useCallback((product) => {
    setProductToAdjust(product);
    setAdjustmentForm({ quantity: '', reason: '', type: 'entrada' });
    setAdjustModalOpen(true);
  }, []);

  const toggleAdjustModal = useCallback(() => {
      if (isAdjustingStock) return;
      setAdjustModalOpen(prev => !prev);
      if (!adjustModalOpen) {
        setProductToAdjust(null);
      }
  }, [isAdjustingStock, adjustModalOpen]);

  const handleAdjustmentChange = useCallback((e) => {
      const { name, value } = e.target;
      setAdjustmentForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAdjustStockSubmit = useCallback(async () => {
    if (!productToAdjust || !adjustmentForm.quantity || !adjustmentForm.reason.trim()) {
        toast.error("La cantidad y el motivo son requeridos.");
        return;
    }
    if (Number(adjustmentForm.quantity) <= 0) {
        toast.error("La cantidad debe ser un número positivo.");
        return;
    }
    setIsAdjustingStock(true);
    const toastId = toast.loading("Ajustando stock...");
    try {
        await productService.adjustStock(productToAdjust.idProduct, {
            quantity: Number(adjustmentForm.quantity),
            type: adjustmentForm.type,
            reason: adjustmentForm.reason.trim(),
        });
        toast.success(`Stock de "${productToAdjust.productName}" ajustado.`, { id: toastId });
        await fetchData(false); 
        toggleAdjustModal();
    } catch (error) {
        const errorMsg = error.response?.data?.message || "Error al ajustar el stock.";
        toast.error(errorMsg, { id: toastId, duration: 4000 });
    } finally {
        setIsAdjustingStock(false);
    }
  }, [productToAdjust, adjustmentForm, fetchData, toggleAdjustModal]);

  const filteredData = useMemo(() => {
    const baseData = !tableSearchText
      ? [...data]
      : data.filter(
          (item) =>
            (item?.productName?.toLowerCase() ?? "").includes(tableSearchText) ||
            String(item?.idProduct ?? "").toLowerCase().includes(tableSearchText)
        );
    return baseData.sort((a, b) => (a.idProduct || 0) - (b.idProduct || 0));
  }, [data, tableSearchText]);

  const totalItems = useMemo(() => filteredData.length, [filteredData]);
  const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
  const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

  const currentItems = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, validCurrentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);
  
  const getStockIndicatorClass = (item) => {
    const { currentStock, minStock, maxStock } = item;
    if (currentStock == null) return '';
    if (minStock > 0 && currentStock <= minStock) return 'text-danger fw-bold';
    if (maxStock > 0 && currentStock >= maxStock) return 'text-warning fw-bold';
    return 'text-success';
  };

  const modalTitle = isEditing ? `Editar Producto/Insumo` : "Agregar Producto/Insumo";
  const submitButtonText = isSavingForm ? (<><Spinner size="sm" className="me-1" /> Guardando...</>) : isEditing ? (<><Edit size={18} className="me-1" /> Actualizar</>) : (<><Plus size={18} className="me-1" /> Guardar</>);
  const canSubmitForm = !isSavingForm;

  return (
    <Container fluid className="p-4 main-content">
      <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
      <h2 className="mb-4">Gestión de Productos e Insumos</h2>

      <Row className="mb-3 align-items-center">
        <Col md={5} lg={4}>
          <Input type="text" bsSize="sm" placeholder="Buscar por nombre o ID..." value={tableSearchText} onChange={handleTableSearch} disabled={isLoadingData && data.length === 0} />
        </Col>
        <Col md={7} lg={8} className="text-md-end mt-2 mt-md-0">
          <Button color="success" size="sm" onClick={openAddModal} className="me-2 button-add"> <Plus size={18} className="me-1" /> Agregar Producto/Insumo </Button>
          <Button color="primary" size="sm" onClick={() => navigate("/home/fichas-tecnicas/crear")} className="button-add-ficha"> <FileText size={18} className="me-1" /> Crear Ficha Técnica </Button>
        </Col>
      </Row>

      <div className="table-responsive shadow-sm custom-table-container mb-3">
        <Table hover striped size="sm" className="mb-0 custom-table align-middle">
          <thead className="table-light">
            <tr>
              <th scope="col" className="text-center" style={{ width: "5%" }}>ID</th>
              <th scope="col" style={{ width: "20%" }}>Nombre Producto/Insumo</th>
              <th scope="col" className="text-center" style={{ width: "10%" }}>Stock Insumos</th>
              <th scope="col" className="text-center" style={{ width: "10%" }}>Stock Venta</th>
              <th scope="col" className="text-center" style={{ width: "10%" }}>Stock Mín.</th>
              <th scope="col" className="text-center" style={{ width: "10%" }}>Stock Máx.</th>
              <th scope="col" className="text-center" style={{ width: "10%" }}>Estado</th>
              <th scope="col" className="text-center" style={{ width: "25%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingData && data.length === 0 ? (
              <tr><td colSpan="8" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.idProduct}>
                  <th scope="row" className="text-center">{item.idProduct}</th>
                  <td>{item.productName || "-"}</td>
                  <td className={`text-center ${getStockIndicatorClass(item)}`}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Package size={16} className="me-2" />
                      <span>{item.currentStock ?? 0}</span>
                    </div>
                  </td>
                  <td className="text-center fw-bold text-primary">
                    <div className="d-flex align-items-center justify-content-center">
                        <ChefHat size={16} className="me-2" />
                        <span>{item.stockForSale ?? 0}</span>
                    </div>
                  </td>
                  <td className="text-center">{item.minStock ?? 'N/A'}</td>
                  <td className="text-center">{item.maxStock ?? 'N/A'}</td>
                  <td className="text-center">
                    <Button size="sm" className={`status-button ${item.status ? "status-active" : "status-inactive"}`} onClick={() => requestChangeStatusConfirmation(item)} disabled={isConfirmActionLoading} title={item.status ? "Activo (Clic para Desactivar)" : "Inactivo (Clic para Activar)"}>
                      {item.status ? "Activo" : "Inactivo"}
                    </Button>
                  </td>
                  <td className="text-center">
                    <div className="d-inline-flex gap-1 action-cell-content">
                      <Button size="sm" color="success" outline onClick={() => openAdjustModal(item)} title="Ajustar Stock de Insumos" className="action-button action-adjust" disabled={isConfirmActionLoading}>
                        <PackagePlus size={18} />
                      </Button>
                      <Button size="sm" color="info" outline onClick={() => handleNavigateToProductFichas(item.idProduct)} title="Ver Fichas Técnicas" className="action-button action-view">
                        <ListChecks size={18} />
                      </Button>
                      <Button size="sm" color="secondary" outline onClick={() => openEditModal(item)} title="Editar" className="action-button action-edit" disabled={isConfirmActionLoading}>
                        <Edit size={18} />
                      </Button>
                      <Button size="sm" color="danger" outline onClick={() => requestDeleteConfirmation(item)} title="Eliminar" className="action-button action-delete" disabled={isConfirmActionLoading}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="text-center fst-italic p-4">{tableSearchText ? `No se encontraron coincidencias para "${tableSearchText}".` : "No hay productos/insumos registrados."}</td></tr>
            )}
            {isLoadingData && data.length > 0 && (
              <tr><td colSpan="8" className="text-center p-2"><Spinner size="sm" color="secondary" /> Actualizando...</td></tr>
            )}
          </tbody>
        </Table>
      </div>

      {totalPages > 1 && !isLoadingData && (
        <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange}/>
      )}

      <Modal isOpen={modalOpen} toggle={!isSavingForm ? toggleMainModal : undefined} centered size="md" backdrop="static" keyboard={!isSavingForm} aria-labelledby="productoInsumoModalTitle">
          <ModalHeader toggle={!isSavingForm ? toggleMainModal : undefined} id="productoInsumoModalTitle">
            <div className="d-flex align-items-center"> {isEditing ? <Edit size={20} className="me-2" /> : <Plus size={20} className="me-2" />} {modalTitle} </div>
          </ModalHeader>
          <ModalBody>
              {formErrors.general && ( <Alert color="danger" fade={false} className="d-flex align-items-center py-2 mb-3"> <AlertTriangle size={18} className="me-2" /> {formErrors.general} </Alert> )}
              <Form id="productoInsumoForm" noValidate onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                  <FormGroup>
                      <Label for="modalProductName" className="form-label fw-bold">Nombre Producto/Insumo <span className="text-danger">*</span></Label>
                      <Input id="modalProductName" type="text" name="productName" value={form.productName} onChange={handleChange} invalid={formErrors.productName} required disabled={isSavingForm} placeholder="Ej: Harina de Trigo Superior" />
                      <FormFeedback>El nombre es requerido (mín. 3 caracteres, solo letras/números/espacios/ñ/acentos).</FormFeedback>
                  </FormGroup>

                  {!isEditing && (
                      <FormGroup>
                          <Label for="modalCurrentStock" className="form-label fw-bold">Stock Inicial de Insumos <span className="text-danger">*</span></Label>
                          <Input id="modalCurrentStock" type="number" name="currentStock" value={form.currentStock} onChange={handleChange} invalid={formErrors.currentStock} disabled={isSavingForm} placeholder="Ej: 50" min="0" required />
                          <FormFeedback>El stock inicial de insumos es requerido y debe ser un número positivo (o cero).</FormFeedback>
                      </FormGroup>
                  )}

                  <Row>
                      <Col md={6}>
                          <FormGroup>
                              <Label for="modalMinStock" className="form-label fw-bold">Stock Mínimo</Label>
                              <Input id="modalMinStock" type="number" name="minStock" value={form.minStock} onChange={handleChange} invalid={formErrors.minStock} disabled={isSavingForm} placeholder="Ej: 10" min="0" />
                              <FormFeedback>Debe ser un número positivo.</FormFeedback>
                          </FormGroup>
                      </Col>
                      <Col md={6}>
                          <FormGroup>
                              <Label for="modalMaxStock" className="form-label fw-bold">Stock Máximo</Label>
                              <Input id="modalMaxStock" type="number" name="maxStock" value={form.maxStock} onChange={handleChange} invalid={formErrors.maxStock} disabled={isSavingForm} placeholder="Ej: 100" min="0" />
                              <FormFeedback>Debe ser un número positivo y mayor o igual al mínimo.</FormFeedback>
                          </FormGroup>
                      </Col>
                  </Row>
              </Form>
          </ModalBody>
          <ModalFooter className="border-top pt-3">
              <Button color="secondary" outline onClick={toggleMainModal} disabled={isSavingForm}>Cancelar</Button>
              <Button type="submit" form="productoInsumoForm" color="primary" disabled={!canSubmitForm}>{submitButtonText}</Button>
          </ModalFooter>
      </Modal>
      
      <ConfirmationModal
        isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title}
        onConfirm={() => confirmActionRef.current && confirmActionRef.current()}
        confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor}
        isConfirming={isConfirmActionLoading}
      >
        {confirmModalProps.message}
      </ConfirmationModal>

      <Modal isOpen={adjustModalOpen} toggle={toggleAdjustModal} centered backdrop="static" keyboard={!isAdjustingStock}>
          <ModalHeader toggle={!isAdjustingStock ? toggleAdjustModal : undefined}>
              <div className="d-flex align-items-center">
                  <PackagePlus size={24} className="text-success me-2"/>
                  <span className="fw-bold">Ajustar Stock de Insumos de "{productToAdjust?.productName}"</span>
              </div>
          </ModalHeader>
          <ModalBody>
              <p>Stock Actual de Insumos: <strong className="fs-5">{productToAdjust?.currentStock ?? 'N/A'}</strong></p>
              <Form id="adjustStockForm" onSubmit={(e) => { e.preventDefault(); handleAdjustStockSubmit(); }}>
                  <FormGroup>
                      <Label for="adjustmentType" className="fw-bold">Tipo de Ajuste</Label>
                      <Input id="adjustmentType" name="type" type="select" value={adjustmentForm.type} onChange={handleAdjustmentChange} disabled={isAdjustingStock}>
                          <option value="entrada">Entrada (Añadir a stock)</option>
                          <option value="salida">Salida (Quitar de stock)</option>
                      </Input>
                  </FormGroup>
                  <FormGroup>
                      <Label for="adjustmentQuantity" className="fw-bold">Cantidad <span className="text-danger">*</span></Label>
                      <Input id="adjustmentQuantity" type="number" name="quantity" placeholder="Ej: 25" min="0.01" step="any" value={adjustmentForm.quantity} onChange={handleAdjustmentChange} required disabled={isAdjustingStock} />
                  </FormGroup>
                   <FormGroup>
                      <Label for="adjustmentReason" className="fw-bold">Motivo del ajuste <span className="text-danger">*</span></Label>
                      <Input id="adjustmentReason" type="textarea" name="reason" placeholder="Ej: Compra a proveedor X, Merma por producto dañado, etc." value={adjustmentForm.reason} onChange={handleAdjustmentChange} required disabled={isAdjustingStock} />
                  </FormGroup>
              </Form>
          </ModalBody>
          <ModalFooter>
              <Button color="secondary" outline onClick={toggleAdjustModal} disabled={isAdjustingStock}>Cancelar</Button>
              <Button color="success" type="submit" form="adjustStockForm" disabled={isAdjustingStock}>
                  {isAdjustingStock ? (<><Spinner size="sm" className="me-1" /> Procesando...</>) : "Confirmar Ajuste"}
              </Button>
          </ModalFooter>
      </Modal>
    </Container>
  );
};

export default ProductoInsumo;