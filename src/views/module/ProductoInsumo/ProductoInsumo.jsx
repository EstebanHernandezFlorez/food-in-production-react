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
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert, Badge, FormFeedback,
  } from "reactstrap";
  import {
    Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, ListChecks, FileText,
  } from "lucide-react";
  import toast, { Toaster } from "react-hot-toast";
  import { useNavigate, useLocation } from "react-router-dom";

  import productService from "../../services/productService";
  // fichaTecnicaService ya no se usa aquí si la lista de fichas se maneja en otra página
  // import fichaTecnicaService from "../../services/fichaTecnicaService";
  import CustomPagination from "../../General/CustomPagination";
 

  // --- Confirmation Modal Component (sin cambios) ---
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
  const INITIAL_FORM_STATE = { idProduct: "", productName: "", status: true };
  const INITIAL_FORM_ERRORS = { productName: false, general: "" };
  const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null };
  const ITEMS_PER_PAGE = 7;

  // --- Main Component ---
  const ProductoInsumo = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false); // Este es el modal para agregar/editar Producto/Insumo, se mantiene
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false); // Modal de confirmación para acciones, se mantiene
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [isSavingForm, setIsSavingForm] = useState(false);

    // --- ESTADOS DEL MODAL DE FICHAS ELIMINADOS ---
    // const [fichasTecnicas, setFichasTecnicas] = useState([]);
    // const [showFichasModal, setShowFichasModal] = useState(false);
    // const [selectedProductForFichas, setSelectedProductForFichas] = useState(null);
    // const [isLoadingFichas, setIsLoadingFichas] = useState(false);
    // --- FIN ESTADOS ELIMINADOS ---

    const navigate = useNavigate();
    const location = useLocation(); // Se mantiene si se usa para otra cosa o por si se reintroduce lógica con state
    const confirmActionRef = useRef(null);
    // const processedNavigationState = useRef(false); // Este era para el modal automático, probablemente ya no se necesite

    const fetchData = useCallback(async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) setIsLoadingData(true);
      console.log(`${LOG_PREFIX} [FETCH] Fetching productos/insumos...`);
      try {
        const response = await productService.getAllProducts();
        const fetchedData = Array.isArray(response) ? response : response?.data || [];
        setData(fetchedData);
        console.log(`${LOG_PREFIX} [FETCH] Data received:`, fetchedData);
      } catch (error) {
        console.error(`${LOG_PREFIX} [FETCH ERROR]`, error);
        toast.error("Error al cargar productos/insumos.");
        setData([]);
      } finally {
        if (showLoadingSpinner) setIsLoadingData(false);
      }
    }, []);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    // --- FUNCIÓN PARA NAVEGAR A LA PÁGINA DE LISTA DE FICHAS ---
    const handleNavigateToProductFichas = (productId) => {
        if (!productId) {
            console.error("ID de producto no proporcionado para ver fichas.");
            toast.error("No se pudo obtener el ID del producto.");
            return;
        }
        navigate(`/home/producto/${productId}/fichas`);
    };
    // --- FIN FUNCIÓN DE NAVEGACIÓN ---

    const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);
    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    const validateForm = useCallback(() => {
      const errors = { ...INITIAL_FORM_ERRORS };
      let isValid = true;
      errors.general = "";
      const trimmedName = String(form.productName ?? "").trim();
      if (!trimmedName) {
        errors.productName = true;
        isValid = false;
      } else if (trimmedName.length < 3) {
        errors.productName = true;
        isValid = false;
      } else if (!/^[a-zA-Z0-9\sñÑáéíóúÁÉÍÓÚüÜ]+$/.test(trimmedName)) {
          errors.productName = true;
          isValid = false;
      }
      setFormErrors(errors);
      return isValid;
    }, [form]);

    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
          setFormErrors((prevErr) => ({
            ...prevErr,
            [name]: false,
            general: "",
          }));
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

    // --- toggleFichasModal ELIMINADO ---
    // const toggleFichasModal = useCallback(() => { /* ... */ }, [showFichasModal]);
    // --- FIN toggleFichasModal ELIMINADO ---


    useEffect(() => {
      if (!confirmModalOpen && !isConfirmActionLoading) {
        setConfirmModalProps(INITIAL_CONFIRM_PROPS);
        confirmActionRef.current = null;
      }
    }, [confirmModalOpen, isConfirmActionLoading]);

    const prepareConfirmation = useCallback((actionFn, props) => {
      const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
          if (actionFn) {
            actionFn(detailsToPass);
          } else {
            toast.error("Error interno al ejecutar la acción.");
            toggleConfirmModal(); // Esta llamada a toggleConfirmModal es para el modal de confirmación, no el de fichas
          }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]); // toggleConfirmModal aquí es para el modal de confirmación

    const handleSubmit = useCallback(async () => {
      if (!validateForm()) {
        toast.error(formErrors.general || "Revise los campos marcados.");
        return;
      }
      setIsSavingForm(true);
      const actionText = isEditing ? "Actualizando" : "Agregando";
      const toastId = toast.loading(`${actionText} producto/insumo...`);
      const dataToSend = { ...form, productName: form.productName.trim() };
      if (!isEditing) {
        delete dataToSend.idProduct;
      }
      try {
        if (isEditing) {
          if (!form.idProduct) throw new Error("ID no válido para actualizar.");
          await productService.updateProduct(form.idProduct, dataToSend);
        } else {
          await productService.createProduct(dataToSend);
        }
        toast.success(
          `Producto/Insumo ${isEditing ? "actualizado" : "agregado"}!`,
          { id: toastId }
        );
        toggleMainModal();
        await fetchData(false);
        setCurrentPage(1);
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || error.message || "Error desconocido";
        setFormErrors((prev) => ({ ...prev, general: `Error: ${errorMsg}` }));
        toast.error(`Error al ${actionText.toLowerCase()}: ${errorMsg}`, {
          id: toastId,
          duration: 5000,
        });
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
          toggleConfirmModal(); // Para el modal de confirmación
          return;
        }
        const { idProduct, currentStatus, productName } = details;
        const newStatus = !currentStatus;
        const actionText = newStatus ? "activado" : "desactivado";

        setIsConfirmActionLoading(true);
        const toastId = toast.loading( `${currentStatus ? "Desactivando" : "Activando"} "${productName || ""}"...` );
        try {
          await productService.changeStateProduct(idProduct, newStatus);
          setData((prevData) =>
            prevData.map((item) =>
              item.idProduct === idProduct ? { ...item, status: newStatus } : item
            )
          );
          toast.success(`Producto/Insumo "${productName || ""}" ${actionText}.`, { id: toastId });
          toggleConfirmModal(); // Para el modal de confirmación
        } catch (error) {
          const errorMsg = error.response?.data?.message || error.message || "Error desconocido.";
          toast.error(`Error al ${currentStatus ? "desactivar" : "activar"}: ${errorMsg}`,{ id: toastId });
          toggleConfirmModal(); // Para el modal de confirmación
        } finally {
          setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal]); // toggleConfirmModal aquí es para el modal de confirmación

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
          toggleConfirmModal();
          setData((prevData) => prevData.filter((item) => item.idProduct !== productToDelete.idProduct));
        } catch (error) {
          // --- INICIO DE CAMBIOS PARA DEBUG Y MEJOR DETECCIÓN ---
          console.error("Error completo al eliminar:", error); // Log para ver el objeto de error completo
          
          let rawErrorMessage = "Error desconocido.";
          if (error.response && error.response.data && error.response.data.message) {
            rawErrorMessage = error.response.data.message;
          } else if (error.message) {
            rawErrorMessage = error.message;
          }
          
          console.log("Mensaje de error crudo detectado:", rawErrorMessage); // Log para ver el mensaje que se procesará

          let displayErrorMessage = `Error al eliminar: ${rawErrorMessage}`;
          let toastIcon = <XCircle className="text-danger" />;
          let toastDuration = 3500;

          const lowerCaseError = rawErrorMessage.toLowerCase(); // Convertir a minúsculas para comparación insensible

          if (lowerCaseError.includes('foreign key constraint fails') && 
              (lowerCaseError.includes('specsheets') || lowerCaseError.includes('specsheets_ibfk_1'))) {
            
            displayErrorMessage = `El producto "${productToDelete.productName || ""}" no puede ser eliminado porque está referenciado en una o más fichas técnicas. Por favor, elimine o desasocie primero las fichas técnicas correspondientes, o desactive el producto en lugar de eliminarlo.`;
            toastIcon = <AlertTriangle className="text-warning" />;
            toastDuration = 8000;
          }
          
          toast.error(displayErrorMessage, { 
            id: toastId, 
            icon: toastIcon,
            duration: toastDuration
          });
          // --- FIN DE CAMBIOS PARA DEBUG Y MEJOR DETECCIÓN ---
          
          toggleConfirmModal();
        } finally {
          setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal]);

    // --- verFichasTecnicas (la que abría el modal) ELIMINADA ---
    // const verFichasTecnicas = useCallback(async (idProduct, productName) => { /* ... */ }, [toggleFichasModal]);
    // --- FIN verFichasTecnicas ELIMINADA ---

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
          status: item.status !== undefined ? item.status : true,
        });
        setIsEditing(true);
        clearFormErrors();
        setModalOpen(true);
    }, [clearFormErrors]);

    // --- EFECTO PARA MANEJAR NAVEGACIÓN DESDE FICHA TÉCNICA ELIMINADO O AJUSTADO ---
    // Este useEffect era para abrir el modal automáticamente.
    // Si ya no se pasa `state` desde FichaTecnica.js para abrir el modal, este efecto no es necesario.
    // Si se conserva, asegurarse que no llame a `verFichasTecnicas` (la función eliminada) o `toggleFichasModal`.
    /*
    useEffect(() => {
      const navState = location.state;
      if (navState?.openFichasForProductId && data.length > 0 && !processedNavigationState.current) {
        // Lógica para abrir modal eliminada
        // navigate(location.pathname, { replace: true, state: null }); // Limpiar estado si aún se pasa
      }
      if (!navState?.openFichasForProductId && processedNavigationState.current) {
          processedNavigationState.current = false;
      }
    }, [location.state, data, navigate]); // Quitar `verFichasTecnicas` de las dependencias
    */
    // --- FIN EFECTO ---

    const filteredData = useMemo(() => {
      if (!tableSearchText) return data;
      return data.filter(
        (item) =>
          (item?.productName?.toLowerCase() ?? "").includes(tableSearchText) ||
          String(item?.idProduct ?? "").toLowerCase().includes(tableSearchText)
      );
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
      const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
      setCurrentPage(newPage);
    }, [totalPages]);

    const modalTitle = isEditing ? `Editar Producto/Insumo` : "Agregar Producto/Insumo";
    const submitButtonText = isSavingForm ? (<><Spinner size="sm" className="me-1" /> Guardando...</>) : isEditing ? (<><Edit size={18} className="me-1" /> Actualizar</>) : (<><Plus size={18} className="me-1" /> Guardar</>);
    const canSubmitForm = !isSavingForm;

    return (
      <Container fluid className="p-4 main-content">
        <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
        <h2 className="mb-4">Gestión de Productos e Insumos</h2>

        <Row className="mb-3 align-items-center">
          <Col md={5} lg={4}>
            <Input
              type="text" bsSize="sm" placeholder="Buscar por nombre o ID..."
              value={tableSearchText} onChange={handleTableSearch}
              disabled={isLoadingData && data.length === 0}
              style={{ borderRadius: "0.25rem" }}
              aria-label="Buscar productos o insumos"
            />
          </Col>
          <Col md={7} lg={8} className="text-md-end mt-2 mt-md-0">
            <Button color="success" size="sm" onClick={openAddModal} className="me-2 button-add">
              <Plus size={18} className="me-1" /> Agregar Producto/Insumo
            </Button>
            <Button color="primary" size="sm" onClick={() => navigate("/home/fichas-tecnicas/crear")} className="button-add-ficha">
              <FileText size={18} className="me-1" /> Crear Ficha Técnica
            </Button>
          </Col>
        </Row>

        <div className="table-responsive shadow-sm custom-table-container mb-3">
          <Table hover striped size="sm" className="mb-0 custom-table align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col" className="text-center" style={{ width: "10%" }}>ID</th>
                <th scope="col" style={{ width: "45%" }}>Nombre Producto/Insumo</th>
                <th scope="col" className="text-center" style={{ width: "15%" }}>Estado</th>
                <th scope="col" className="text-center" style={{ width: "30%" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && data.length === 0 ? (
                <tr><td colSpan="4" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.idProduct}>
                    <th scope="row" className="text-center">{item.idProduct}</th>
                    <td>{item.productName || "-"}</td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        className={`status-button ${item.status ? "status-active" : "status-inactive"}`}
                        onClick={() => requestChangeStatusConfirmation(item)}
                        disabled={isConfirmActionLoading}
                        title={item.status ? "Activo (Clic para Desactivar)" : "Inactivo (Clic para Activar)"}
                      >
                        {item.status ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td className="text-center">
                      <div className="d-inline-flex gap-1 action-cell-content">
                        <Button
                          size="sm" color="info" outline
                          onClick={() => handleNavigateToProductFichas(item.idProduct)} // Usa la nueva función
                          title="Ver Fichas Técnicas"
                          className="action-button action-view"
                        >
                          <ListChecks size={18} />
                        </Button>
                        <Button
                          size="sm" color="secondary" outline onClick={() => openEditModal(item)}
                          title="Editar" className="action-button action-edit"
                          disabled={isConfirmActionLoading}
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          size="sm" color="danger" outline onClick={() => requestDeleteConfirmation(item)}
                          title="Eliminar" className="action-button action-delete"
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
                  <td colSpan="4" className="text-center fst-italic p-4">
                    {tableSearchText ? `No se encontraron coincidencias para "${tableSearchText}".` : "No hay productos/insumos registrados."}
                  </td>
                </tr>
              )}
              {isLoadingData && data.length > 0 && (
                <tr><td colSpan="4" className="text-center p-2"><Spinner size="sm" color="secondary" /> Actualizando...</td></tr>
              )}
            </tbody>
          </Table>
        </div>

        {totalPages > 1 && !isLoadingData && (
          <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange}/>
        )}

        {/* Modal para Agregar/Editar Producto/Insumo (se mantiene) */}
        <Modal isOpen={modalOpen} toggle={!isSavingForm ? toggleMainModal : undefined} centered size="md" backdrop="static" keyboard={!isSavingForm} aria-labelledby="productoInsumoModalTitle">
          {/* ... contenido del modal ... */}
          <ModalHeader toggle={!isSavingForm ? toggleMainModal : undefined} id="productoInsumoModalTitle"> <div className="d-flex align-items-center"> {isEditing ? <Edit size={20} className="me-2" /> : <Plus size={20} className="me-2" />} {modalTitle} </div> </ModalHeader> <ModalBody> {formErrors.general && ( <Alert color="danger" fade={false} className="d-flex align-items-center py-2 mb-3"> <AlertTriangle size={18} className="me-2" /> {formErrors.general} </Alert> )} <Form id="productoInsumoForm" noValidate onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}> <FormGroup> <Label for="modalProductName" className="form-label fw-bold">Nombre Producto/Insumo <span className="text-danger">*</span></Label> <Input id="modalProductName" type="text" name="productName" value={form.productName} onChange={handleChange} invalid={formErrors.productName} required aria-describedby="productNameFeedback" disabled={isSavingForm} placeholder="Ej: Harina de Trigo Superior" /> <FormFeedback id="productNameFeedback"> {formErrors.productName && "El nombre es requerido (mín. 3 caracteres, solo letras/números/espacios/ñ/acentos)."} </FormFeedback> </FormGroup> </Form> </ModalBody> <ModalFooter className="border-top pt-3"> <Button color="secondary" outline onClick={toggleMainModal} disabled={isSavingForm}>Cancelar</Button> <Button type="submit" form="productoInsumoForm" color="primary" disabled={!canSubmitForm}>{submitButtonText}</Button> </ModalFooter>
        </Modal>

        {/* Modal de Confirmación (se mantiene) */}
        <ConfirmationModal
          isOpen={confirmModalOpen} toggle={toggleConfirmModal} title={confirmModalProps.title}
          onConfirm={() => confirmActionRef.current && confirmActionRef.current()}
          confirmText={confirmModalProps.confirmText} confirmColor={confirmModalProps.confirmColor}
          isConfirming={isConfirmActionLoading}
        >
          {confirmModalProps.message}
        </ConfirmationModal>

        {/* --- JSX DEL MODAL DE FICHAS TÉCNICAS ELIMINADO --- */}
        {/*
        <Modal isOpen={showFichasModal} toggle={toggleFichasModal} size="lg" centered backdrop="static">
          // ... contenido del modal de fichas ...
        </Modal>
        */}
        {/* --- FIN JSX ELIMINADO --- */}

      </Container>
    );
  };

  export default ProductoInsumo;