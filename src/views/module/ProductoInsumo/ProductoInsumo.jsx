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
    Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, ListChecks, FileText,
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
  // MODIFICADO: Añadimos minStock y maxStock al estado inicial del formulario
  const INITIAL_FORM_STATE = { idProduct: "", productName: "", minStock: "", maxStock: "", status: true };
  // MODIFICADO: Añadimos los errores para los nuevos campos
  const INITIAL_FORM_ERRORS = { productName: false, minStock: false, maxStock: false, general: "" };
  const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null };
  const ITEMS_PER_PAGE = 7;

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

    const navigate = useNavigate();
    const confirmActionRef = useRef(null);
    
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

    const handleNavigateToProductFichas = (productId) => {
        if (!productId) {
            console.error("ID de producto no proporcionado para ver fichas.");
            toast.error("No se pudo obtener el ID del producto.");
            return;
        }
        navigate(`/home/producto/${productId}/fichas`);
    };

    const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);
    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    // MODIFICADO: Actualizamos la validación del formulario
    const validateForm = useCallback(() => {
        let errors = { ...INITIAL_FORM_ERRORS };
        let isValid = true;
        errors.general = "";
      
        // Validación del nombre
        const trimmedName = String(form.productName ?? "").trim();
        if (!trimmedName || trimmedName.length < 3 || !/^[a-zA-Z0-9\sñÑáéíóúÁÉÍÓÚüÜ]+$/.test(trimmedName)) {
            errors.productName = true;
            isValid = false;
        }
      
        // Validación de stocks
        const minStock = form.minStock !== "" ? Number(form.minStock) : null;
        const maxStock = form.maxStock !== "" ? Number(form.maxStock) : null;
      
        if (minStock !== null && (isNaN(minStock) || minStock < 0)) {
            errors.minStock = true;
            isValid = false;
        }
        if (maxStock !== null && (isNaN(maxStock) || maxStock < 0)) {
            errors.maxStock = true;
            isValid = false;
        }
      
        // Validación de que min <= max
        if (minStock !== null && maxStock !== null && minStock > maxStock) {
            errors.minStock = true;
            errors.maxStock = true;
            errors.general = "El stock máximo no puede ser menor que el mínimo.";
            isValid = false;
        }
      
        setFormErrors(errors);
        return isValid;
    }, [form]);

    const handleChange = useCallback((e) => {
        const { name, value, type } = e.target;
        // Permitimos que los campos numéricos estén vacíos
        const val = type === 'number' && value === '' ? '' : value;
        
        setForm((prev) => ({ ...prev, [name]: val }));
        
        if (formErrors[name] || formErrors.general) {
            setFormErrors((prevErr) => ({
                ...prevErr,
                [name]: false,
                general: "", // Limpiamos el error general también
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
              toggleConfirmModal(); 
            }
          };
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
        
        // MODIFICADO: Preparamos los datos a enviar, convirtiendo stocks vacíos a null o 0 si es necesario
        const dataToSend = {
            ...form,
            productName: form.productName.trim(),
            minStock: form.minStock === '' ? 0 : Number(form.minStock),
            maxStock: form.maxStock === '' ? 0 : Number(form.maxStock),
        };
        
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
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || error.message || "Error desconocido";
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
            setData((prevData) =>
              prevData.map((item) =>
                item.idProduct === idProduct ? { ...item, status: newStatus } : item
              )
            );
            toast.success(`Producto/Insumo "${productName || ""}" ${actionText}.`, { id: toastId });
            toggleConfirmModal();
          } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido.";
            toast.error(`Error al ${currentStatus ? "desactivar" : "activar"}: ${errorMsg}`,{ id: toastId });
            toggleConfirmModal();
          } finally {
            setIsConfirmActionLoading(false);
          }
    }, [toggleConfirmModal]);

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
          console.error("Error completo al eliminar:", error);
          let rawErrorMessage = "Error desconocido.";
          if (error.response && error.response.data && error.response.data.message) {
            rawErrorMessage = error.response.data.message;
          } else if (error.message) {
            rawErrorMessage = error.message;
          }
          console.log("Mensaje de error crudo detectado:", rawErrorMessage);
          let displayErrorMessage = `Error al eliminar: ${rawErrorMessage}`;
          let toastIcon = <XCircle className="text-danger" />;
          let toastDuration = 3500;
          const lowerCaseError = rawErrorMessage.toLowerCase();
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
          toggleConfirmModal();
        } finally {
          setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal]);
    
    const openAddModal = useCallback(() => {
      resetForm();
      clearFormErrors();
      setIsEditing(false);
      setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    // MODIFICADO: Actualizamos para incluir los nuevos campos al editar
    const openEditModal = useCallback((item) => {
      setForm({
          idProduct: item.idProduct || "",
          productName: item.productName || "",
          // Usamos ?? '' para manejar valores null/undefined de la DB y evitar warnings de React
          minStock: item.minStock ?? '',
          maxStock: item.maxStock ?? '',
          status: item.status !== undefined ? item.status : true,
        });
        setIsEditing(true);
        clearFormErrors();
        setModalOpen(true);
    }, [clearFormErrors]);

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
              {/* MODIFICADO: Añadimos las cabeceras para los stocks */}
              <tr>
                <th scope="col" className="text-center" style={{ width: "8%" }}>ID</th>
                <th scope="col" style={{ width: "32%" }}>Nombre Producto/Insumo</th>
                <th scope="col" className="text-center" style={{ width: "10%" }}>Stock Mín.</th>
                <th scope="col" className="text-center" style={{ width: "10%" }}>Stock Máx.</th>
                <th scope="col" className="text-center" style={{ width: "12%" }}>Estado</th>
                <th scope="col" className="text-center" style={{ width: "28%" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && data.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.idProduct}>
                    <th scope="row" className="text-center">{item.idProduct}</th>
                    <td>{item.productName || "-"}</td>
                    {/* MODIFICADO: Mostramos los valores de stock. Usamos 'N/A' si no hay valor. */}
                    <td className="text-center">{item.minStock ?? 'N/A'}</td>
                    <td className="text-center">{item.maxStock ?? 'N/A'}</td>
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
                          onClick={() => handleNavigateToProductFichas(item.idProduct)}
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
                  <td colSpan="6" className="text-center fst-italic p-4">
                    {tableSearchText ? `No se encontraron coincidencias para "${tableSearchText}".` : "No hay productos/insumos registrados."}
                  </td>
                </tr>
              )}
              {isLoadingData && data.length > 0 && (
                <tr><td colSpan="6" className="text-center p-2"><Spinner size="sm" color="secondary" /> Actualizando...</td></tr>
              )}
            </tbody>
          </Table>
        </div>

        {totalPages > 1 && !isLoadingData && (
          <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange}/>
        )}

        {/* MODIFICADO: Añadimos los campos del formulario en el Modal */}
        <Modal isOpen={modalOpen} toggle={!isSavingForm ? toggleMainModal : undefined} centered size="md" backdrop="static" keyboard={!isSavingForm} aria-labelledby="productoInsumoModalTitle">
            <ModalHeader toggle={!isSavingForm ? toggleMainModal : undefined} id="productoInsumoModalTitle"> <div className="d-flex align-items-center"> {isEditing ? <Edit size={20} className="me-2" /> : <Plus size={20} className="me-2" />} {modalTitle} </div> </ModalHeader>
            <ModalBody>
                {formErrors.general && ( <Alert color="danger" fade={false} className="d-flex align-items-center py-2 mb-3"> <AlertTriangle size={18} className="me-2" /> {formErrors.general} </Alert> )}
                <Form id="productoInsumoForm" noValidate onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <FormGroup>
                        <Label for="modalProductName" className="form-label fw-bold">Nombre Producto/Insumo <span className="text-danger">*</span></Label>
                        <Input id="modalProductName" type="text" name="productName" value={form.productName} onChange={handleChange} invalid={formErrors.productName} required aria-describedby="productNameFeedback" disabled={isSavingForm} placeholder="Ej: Harina de Trigo Superior" />
                        <FormFeedback id="productNameFeedback">El nombre es requerido (mín. 3 caracteres, solo letras/números/espacios/ñ/acentos).</FormFeedback>
                    </FormGroup>

                    {/* NUEVO: Campos para stock mínimo y máximo */}
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
      </Container>
    );
  };

  export default ProductoInsumo;