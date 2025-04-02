import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter, Label } from 'reactstrap';
import { FaEye } from 'react-icons/fa';
import { PlusCircleOutlined, DeleteOutlined, SelectOutlined, EditOutlined, TeamOutlined, PlusOutlined } from '@ant-design/icons';
import FondoIcono from '../../../assets/logoFIP.png'; // Make sure path is correct
import { useNavigate } from 'react-router-dom';
import MonthlyOverallExpenseService from "../../services/gastosGeneralesService"; // Corrected import name? Verify filename.
import ConceptSpentService from "../../services/conceptoGasto"; // Corrected import name? Verify filename.
import ConceptSpentSelect from './ConceptSpentSelect'; // Assuming this component works correctly
import toast, { Toaster } from 'react-hot-toast';
import '../../../index.css';

const ManoDeObra = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState({
        idExpenseType: 1, // Defaulting to 1 as per original code
        dateOverallExp: '',
        novelty_expense: '',
        status: true,
        // Fields for adding items temporarily
        idConceptSpent: '',
        price: ''
    });
    const [addedExpenses, setAddedExpenses] = useState([]); // Stores items { idConceptSpent, conceptName, price }
    const [conceptSpents, setConceptSpents] = useState([]);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false); // Flag specifically for the EDIT MODAL
    const [showForm, setShowForm] = useState(false); // Flag for showing the CREATE/main form
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editModalOpen, setEditModalOpen] = useState(false); // Renamed from modalOpen for clarity
    const [selectedManoObra, setSelectedManoObra] = useState(null); // Item being edited in the modal
    // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Keep if delete functionality is needed
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedItemForDetail, setSelectedItemForDetail] = useState(null); // Renamed for clarity
    const itemsPerPage = 7;

    const [formErrors, setFormErrors] = useState({
        dateOverallExp: '',
        novelty_expense: '',
        expenseItems: '',
        // Errors specific to the add item section
        idConceptSpent: '',
        price: ''
    });
    const [apiError, setApiError] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        fetchData();
        fetchConceptSpents();
    }, []);

    const fetchData = async () => {
        try {
            // console.log("Fetching monthly expenses...");
            const expenses = await MonthlyOverallExpenseService.getAllMonthlyOverallExpenses();
            // console.log("Raw API Response (fetchData):", expenses);
            // Ensure the response is an array
            setData(Array.isArray(expenses) ? expenses : []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(`Error al cargar los gastos: ${error.message || 'Error desconocido'}`);
            setData([]); // Set to empty array on error
        }
    };

    const fetchConceptSpents = async () => {
        try {
            // console.log("Fetching concept spents...");
            const conceptSpentsData = await ConceptSpentService.getAllConceptSpents();
            // console.log("Concept spents data:", conceptSpentsData);
            setConceptSpents(Array.isArray(conceptSpentsData) ? conceptSpentsData : []);
        } catch (error) {
            console.error("Error fetching concept spents:", error);
            toast.error(`Error al cargar los conceptos: ${error.message || 'Error desconocido'}`);
            setConceptSpents([]); // Set to empty array on error
        }
    };

    // --- Utility Functions ---
    const resetFormState = () => {
        setForm({
            idExpenseType: 1,
            dateOverallExp: '',
            novelty_expense: '',
            status: true,
            idConceptSpent: '',
            price: ''
        });
        setAddedExpenses([]);
        setFormErrors({
            dateOverallExp: '', novelty_expense: '', expenseItems: '', idConceptSpent: '', price: ''
        });
        setApiError(null);
    };

    // --- Event Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
        // Clear specific error when user types
        setFormErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
        // Clear general API error on any change
        setApiError(null);
        // Clear item-specific errors if those fields change
        if (name === 'idConceptSpent' || name === 'price') {
            setFormErrors(prevErrors => ({ ...prevErrors, idConceptSpent: '', price: '' }));
        }
        // Clear main form errors if those fields change
        if (name === 'dateOverallExp' || name === 'novelty_expense') {
             setFormErrors(prevErrors => ({ ...prevErrors, dateOverallExp: '', novelty_expense: '' }));
        }
        // Clear expense items error when adding/removing items (handled elsewhere) or changing main fields
         if (name === 'dateOverallExp' || name === 'novelty_expense') {
             setFormErrors(prevErrors => ({ ...prevErrors, expenseItems: '' }));
         }

        // console.log("handleChange:", name, value);
    };

    const addExpenseToTable = () => {
        const { idConceptSpent, price } = form;
        let itemValid = true;
        const newErrors = { ...formErrors };

        if (!idConceptSpent) {
            newErrors.idConceptSpent = 'Seleccione un concepto';
            itemValid = false;
        }
        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            newErrors.price = 'Ingrese un precio válido';
            itemValid = false;
        }

        if (!itemValid) {
            setFormErrors(newErrors);
            toast.error("Verifique el concepto y el precio.");
            return;
        }

        const parsedIdConceptSpent = parseInt(idConceptSpent, 10); // Simpler parsing

        if (isNaN(parsedIdConceptSpent)) {
             setFormErrors(prev => ({ ...prev, idConceptSpent: 'Concepto inválido'}));
             toast.error("ID de concepto no es un número válido.");
             return;
        }

        const concept = conceptSpents.find(c => c.idExpenseType === parsedIdConceptSpent);

        if (concept) {
            // Check if concept already added (optional, prevents duplicates)
            // if (addedExpenses.some(item => item.idConceptSpent === parsedIdConceptSpent)) {
            //     toast.error("Este concepto ya ha sido agregado.");
            //     return;
            // }

            setAddedExpenses(prevExpenses => [
                ...prevExpenses,
                {
                    idConceptSpent: parsedIdConceptSpent,
                    conceptName: concept.name, // Use the name from fetched concepts
                    price: parseFloat(price),
                    // NO expenseDate here unless backend needs it per item
                }
            ]);
            // Reset only the item fields in the form
            setForm(prevForm => ({ ...prevForm, idConceptSpent: '', price: '' }));
            // Clear item-specific errors and the general expenseItems error
            setFormErrors(prevErrors => ({ ...prevErrors, idConceptSpent: '', price: '', expenseItems: '' }));
        } else {
             setFormErrors(prev => ({ ...prev, idConceptSpent: 'Concepto no encontrado'}));
             toast.error("El concepto de gasto seleccionado no es válido.");
        }
    };

    const removeExpenseFromTable = (index) => {
        setAddedExpenses(prevExpenses => prevExpenses.filter((_, i) => i !== index));
         // If removing the last item might trigger validation, clear the error
        if (addedExpenses.length === 1) {
             setFormErrors(prevErrors => ({ ...prevErrors, expenseItems: '' }));
        }
    };

    // --- Main Form (Creation) Validation & Submission ---
    const validateCreationForm = () => {
        let isValid = true;
        const newErrors = { idConceptSpent: formErrors.idConceptSpent, price: formErrors.price }; // Keep item errors if any

        if (!form.dateOverallExp) {
            newErrors.dateOverallExp = 'La fecha es obligatoria';
            isValid = false;
        }
        // Basic check, allow empty novelty? Adjust if needed
        if (!form.novelty_expense) {
             newErrors.novelty_expense = 'La novedad es obligatoria';
             isValid = false;
        }
        // Check if items were added
        if (addedExpenses.length === 0) {
            newErrors.expenseItems = 'Debe agregar al menos un concepto de gasto';
            isValid = false;
        }

        setFormErrors(newErrors);
        return isValid;
    };

    const handleCreateSubmit = async () => {
        console.log("handleCreateSubmit called");
        if (!validateCreationForm()) {
            toast.error("Por favor, complete la fecha, novedad y agregue al menos un gasto.");
            return;
        }

        const totalValueExpense = addedExpenses.reduce((sum, item) => sum + Number(item.price), 0);

        // Construct payload specifically for the MonthlyOverallExpense creation
        const payload = {
            idExpenseType: form.idExpenseType, // As defined in state
            dateOverallExp: form.dateOverallExp,
            novelty_expense: form.novelty_expense,
            status: form.status, // Defaulting to true from initial state
            valueExpense: totalValueExpense,
            // Map added expenses to the format expected by the backend API
            // Adjust keys (idConceptSpent, price) if backend expects different names
            expenseItems: addedExpenses.map(item => ({
                idConceptSpent: item.idConceptSpent,
                price: item.price
            }))
        };

        console.log("Payload being sent for creation:", payload);
        setApiError(null); // Clear previous API errors

        try {
            const response = await MonthlyOverallExpenseService.createMonthlyOverallExpense(payload);
            console.log("API Response (Create):", response);
            toast.success("Registro mensual creado exitosamente.");

            setShowForm(false); // Hide form
            resetFormState(); // Reset form and items
            fetchData(); // Refresh table data

        } catch (error) {
            console.error("Error al guardar el gasto:", error);
            // Use the error structure from the service
            const errorMessage = error.message || "Error al guardar el gasto.";
            setApiError(errorMessage);
            toast.error(errorMessage);
        }
    };

    // --- Edit Modal Logic ---
    const openEditModal = (item) => {
        // console.log("Opening edit modal for:", item);
        setSelectedManoObra(item); // Store the item being edited
        setIsEditing(true); // Set the modal editing flag
        setForm({ // Populate form ONLY with fields editable in the modal
            ...form, // Keep defaults like idExpenseType, status, etc.
            dateOverallExp: item.dateOverallExp.split('T')[0], // Format date for input type="date"
            novelty_expense: item.novelty_expense,
            // Do NOT populate idConceptSpent or price here
        });
        setAddedExpenses([]); // Ensure no items carry over to edit modal state
        setFormErrors({ // Reset errors specific to the modal
             dateOverallExp: '', novelty_expense: '', expenseItems: '', idConceptSpent: '', price: ''
         });
        setApiError(null);
        setEditModalOpen(true); // Open the modal
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setIsEditing(false);
        setSelectedManoObra(null);
        resetFormState(); // Reset form fully on modal close
    };

    const validateEditForm = () => {
         let isValid = true;
         const newErrors = { };

         if (!form.dateOverallExp) {
             newErrors.dateOverallExp = 'La fecha es obligatoria';
             isValid = false;
         }
         if (!form.novelty_expense) {
              newErrors.novelty_expense = 'La novedad es obligatoria';
              isValid = false;
         }
         setFormErrors(prev => ({...prev, ...newErrors})); // Update only modal field errors
         return isValid;
    }

    const handleEditSubmit = async () => {
        // console.log("handleEditSubmit called");
        if (!selectedManoObra || !validateEditForm()) {
            toast.error("Por favor, complete todos los campos del modal.");
            return;
        }

        // Payload contains ONLY the fields being updated via the modal
        const payload = {
            dateOverallExp: form.dateOverallExp,
            novelty_expense: form.novelty_expense,
            // Include other fields like status if they *can* be changed via this modal
            // status: form.status,
            // DO NOT include valueExpense or expenseItems as they are not edited here
        };

        console.log(`Payload being sent for update (ID: ${selectedManoObra.idOverallMonth}):`, payload);
        setApiError(null);

        try {
            const response = await MonthlyOverallExpenseService.updateMonthlyOverallExpense(selectedManoObra.idOverallMonth, payload);
            console.log("API Response (Update):", response);
            toast.success("Gasto mensual actualizado exitosamente.");

            closeEditModal(); // Close modal
            fetchData(); // Refresh table

        } catch (error) {
            console.error("Error updating expense:", error);
            const errorMessage = error.message || "Error al actualizar el gasto.";
            setApiError(errorMessage); // Show error potentially within the modal
            toast.error(errorMessage);
        }
    };

    // --- Other Actions ---
    const cambiarEstado = async (idOverallMonth) => {
        // Find the current status
        const itemToToggle = data.find(item => item.idOverallMonth === idOverallMonth);
        if (!itemToToggle) return;

        const newStatus = !itemToToggle.status;
        const originalData = [...data]; // Backup data for potential rollback

        // Optimistic UI update
        setData(prevData => prevData.map(item =>
            item.idOverallMonth === idOverallMonth ? { ...item, status: newStatus } : item
        ));

        try {
            await MonthlyOverallExpenseService.changeStateMonthlyOverallExpense(idOverallMonth, newStatus);
            toast.success("Estado del gasto mensual actualizado exitosamente");
            // No need to call fetchData again if API call is successful
        } catch (error) {
            console.error("Error updating expense status:", error);
            toast.error(`Error al cambiar el estado: ${error.message || 'Error desconocido'}`);
            setData(originalData); // Rollback UI on error
        }
    };

    const handleTableSearch = (e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1); // Reset to first page on search
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        navigate('/tabla-gastos'); // Navigate to general expenses table
    };
    const handleRendimientoEmp = () => {
        navigate('/rendimiento-empleado'); // Navigate to employee performance
    };

    const openDetailModal = (item) => {
        setSelectedItemForDetail(item);
        setDetailModalOpen(true);
    };
    const closeDetailModal = () => setDetailModalOpen(false);

    // --- Filtering and Pagination ---
    const filteredData = data.filter(item =>
        item && ( // Add check if item exists
            String(item.idOverallMonth || '').toLowerCase().includes(tableSearchText) ||
            (item.dateOverallExp && new Date(item.dateOverallExp).toLocaleDateString('es-ES').includes(tableSearchText)) ||
            String(item.valueExpense || '').toLowerCase().includes(tableSearchText) ||
            String(item.novelty_expense || '').toLowerCase().includes(tableSearchText)
        )
    );


    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const totalExpenses = addedExpenses.reduce((sum, item) => sum + item.price, 0);

    // --- JSX ---
    return (
        <Container>
            <Toaster position="top-right" />
            <br />
            {!showForm ? ( // Display Table View
                <>
                    {/* Header */}
                    <div className="d-flex align-items-center mb-3">
                        <img src={FondoIcono} alt="Logo FIP" style={{ width: '5%', height: 'auto', marginRight: '20px' }} />
                        <h2 style={{ flex: 1, margin: 0 }}>Gastos Mensuales (Mano de Obra)</h2>
                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                 <Button color="link" onClick={handleRendimientoEmp} style={{ padding: 0 }}>
                                     <TeamOutlined style={{ fontSize: '34px', color: 'black' }} />
                                 </Button>
                                 <span style={{ fontSize: '14px', color: 'black', marginTop: '5px' }}>Empleados</span>
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                 <Button color="link" onClick={handleClick} style={{ padding: 0 }}>
                                      <SelectOutlined style={{ fontSize: '34px', color: 'black' }} />
                                  </Button>
                                 <span style={{ fontSize: '14px', color: 'black', marginTop: '5px' }}>Otros Gastos</span>
                              </div>
                         </div>
                    </div>
                    <hr/>

                    {/* Search and Create Button */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Input
                            type="text"
                            placeholder="Buscar por ID, Fecha, Valor o Novedad..."
                            value={tableSearchText}
                            onChange={handleTableSearch}
                            style={{ width: '40%' }}
                        />
                        <Button
                            style={{ backgroundColor: '#228b22', color: 'white', border: 'none' }}
                            onClick={() => {
                                resetFormState(); // Ensure form is clean before showing
                                setShowForm(true);
                                setIsEditing(false); // Explicitly set to creation mode
                            }}
                        >
                            Crear Registro de Mes <PlusCircleOutlined style={{ marginLeft: '5px' }} />
                        </Button>
                    </div>

                    {/* Data Table */}
                    <Table className="table table-sm table-hover table-bordered table-striped">
                        <thead className="thead-dark">
                            <tr>
                                <th style={{ textAlign: 'center' }}>ID</th>
                                <th style={{ textAlign: 'center' }}>Fecha</th>
                                <th style={{ textAlign: 'center' }}>Valor Gasto Total</th>
                                <th style={{ textAlign: 'center' }}>Novedades</th>
                                <th style={{ textAlign: 'center' }}>Estado</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.idOverallMonth}>
                                        <td style={{ textAlign: 'center' }}>{item.idOverallMonth}</td>
                                        <td style={{ textAlign: 'center' }}>{new Date(item.dateOverallExp).toLocaleDateString('es-ES')}</td>
                                        {/* Format currency if desired */}
                                        <td style={{ textAlign: 'right' }}>{item.valueExpense?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) ?? 'N/A'}</td>
                                        <td>{item.novelty_expense}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <Button
                                                color={item.status ? "success" : "secondary"}
                                                size="sm"
                                                onClick={() => cambiarEstado(item.idOverallMonth)}
                                            >
                                                {item.status ? "Activo" : "Inactivo"}
                                            </Button>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="d-flex justify-content-center align-items-center gap-2">
                                                <Button
                                                    color="dark"
                                                    size="sm"
                                                    onClick={() => openEditModal(item)}
                                                    title="Editar Cabecera"
                                                >
                                                    <EditOutlined />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => openDetailModal(item)}
                                                    style={{ backgroundColor: '#F5C300', border: 'none' }}
                                                    title="Ver Detalles"
                                                >
                                                    <FaEye style={{ color: 'black' }} />
                                                </Button>
                                                {/* Add Delete Button if needed */}
                                                {/* <Button color="danger" size="sm" onClick={() => openDeleteModal(item)}> <DeleteOutlined /> </Button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">No hay datos disponibles {tableSearchText ? 'para la búsqueda actual' : ''}.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <ul className="pagination justify-content-center">
                            {pageNumbers.map(number => (
                                <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                    <Button outline className="page-link" onClick={() => handlePageChange(number)}>
                                        {number}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            ) : ( // Display Creation Form View
                <div>
                     {/* Back Button */}
                     <Button color="secondary" outline onClick={() => setShowForm(false)} className="mb-3">
                         ← Volver a la Lista
                     </Button>
                    <h2 className="text-center">Crear Registro Mensual de Gastos</h2>
                    <hr/>
                     {apiError && <div className="alert alert-danger">{apiError}</div>}

                    {/* Main Fields */}
                    <Row className="mb-3">
                        <Col md={6}>
                            <FormGroup>
                                <Label for="dateOverallExp">Fecha del Mes <span className="text-danger">*</span></Label>
                                <Input
                                    id="dateOverallExp"
                                    type="date"
                                    name="dateOverallExp"
                                    value={form.dateOverallExp}
                                    onChange={handleChange}
                                    invalid={!!formErrors.dateOverallExp}
                                />
                                <span className="text-danger small">{formErrors.dateOverallExp}</span>
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="novelty_expense">Novedades del Mes <span className="text-danger">*</span></Label>
                                <Input
                                    id="novelty_expense"
                                    type="textarea"
                                    name="novelty_expense"
                                    value={form.novelty_expense}
                                    onChange={handleChange}
                                    placeholder="Describa las novedades o eventos relevantes para los gastos de este mes"
                                    invalid={!!formErrors.novelty_expense}
                                    rows={3}
                                />
                                 <span className="text-danger small">{formErrors.novelty_expense}</span>
                            </FormGroup>
                        </Col>
                    </Row>
                     <hr/>

                    {/* Add Expense Item Section */}
                     <h5>Agregar Conceptos de Gasto</h5>
                    <Row className="mb-3 align-items-end"> {/* Use align-items-end for button alignment */}
                        <Col md={5}>
                             <Label for="idConceptSpent">Concepto de Gasto <span className="text-danger">*</span></Label>
                            <ConceptSpentSelect
                                id="idConceptSpent" // Add id for label linking
                                value={form.idConceptSpent}
                                onChange={handleChange} // Pass the main handleChange
                                conceptSpents={conceptSpents}
                                name="idConceptSpent" // Ensure name is passed
                                invalid={!!formErrors.idConceptSpent}
                            />
                             <span className="text-danger small">{formErrors.idConceptSpent}</span>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="price">Precio <span className="text-danger">*</span></Label>
                                <Input
                                    id="price"
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="any"
                                    invalid={!!formErrors.price}
                                />
                                 <span className="text-danger small">{formErrors.price}</span>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            {/* Align button with the bottom of the inputs */}
                             <FormGroup className="mb-0"> {/* Remove bottom margin for alignment */}
                                <Button
                                    color="success"
                                    onClick={addExpenseToTable}
                                    className="w-100" // Make button take full column width
                                >
                                    <PlusOutlined /> Agregar
                                </Button>
                             </FormGroup>
                        </Col>
                    </Row>

                    {/* Table of Added Expenses */}
                    <h6 className="mt-4">Gastos Agregados para este Mes:</h6>
                     <span className="text-danger small">{formErrors.expenseItems}</span>
                    <Table className="mt-2 table-sm table-bordered">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Precio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {addedExpenses.length > 0 ? (
                                addedExpenses.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.conceptName}</td>
                                        {/* Format currency */}
                                        <td style={{ textAlign: 'right' }}>{item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <Button color="danger" size="sm" onClick={() => removeExpenseFromTable(index)}>
                                                <DeleteOutlined />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="text-center text-muted">Aún no se han agregado gastos.</td>
                                </tr>
                            )}
                        </tbody>
                         {addedExpenses.length > 0 && (
                              <tfoot>
                                  <tr>
                                      <th className="text-right">Total:</th>
                                      <th className="text-right">{totalExpenses.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</th>
                                      <th></th>
                                  </tr>
                              </tfoot>
                         )}
                    </Table>

                    {/* Action Buttons for Creation Form */}
                    <div className="d-flex justify-content-end mt-4 gap-2">
                        <Button color="secondary" onClick={() => { setShowForm(false); resetFormState(); }}>
                            Cancelar
                        </Button>
                        <Button style={{ background: '#2e8322', color: 'white', border: 'none' }} onClick={handleCreateSubmit}>
                            Guardar Registro Mensual
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Modal (Handles only Date and Novelty) */}
            <Modal isOpen={editModalOpen} toggle={closeEditModal} centered>
                <ModalHeader toggle={closeEditModal}>Editar Registro Mensual</ModalHeader>
                <ModalBody>
                    {apiError && <div className="alert alert-danger">{apiError}</div>}
                    <Row>
                        <Col md={12}> {/* Use full width for date */}
                            <FormGroup>
                                <Label for="editDateOverallExp">Fecha <span className="text-danger">*</span></Label>
                                <Input
                                    id="editDateOverallExp"
                                    type="date"
                                    name="dateOverallExp" // Must match state key
                                    value={form.dateOverallExp} // Bind to form state
                                    onChange={handleChange} // Use the same handler
                                    invalid={!!formErrors.dateOverallExp}
                                />
                                 <span className="text-danger small">{formErrors.dateOverallExp}</span>
                            </FormGroup>
                        </Col>
                        <Col md={12}> {/* Use full width for novelty */}
                            <FormGroup>
                                <Label for="editNoveltyExpense">Novedades <span className="text-danger">*</span></Label>
                                <Input
                                    id="editNoveltyExpense"
                                    type="textarea"
                                    name="novelty_expense" // Must match state key
                                    value={form.novelty_expense} // Bind to form state
                                    onChange={handleChange} // Use the same handler
                                    rows={4}
                                    invalid={!!formErrors.novelty_expense}
                                />
                                 <span className="text-danger small">{formErrors.novelty_expense}</span>
                            </FormGroup>
                        </Col>
                    </Row>
                     <p><small>Nota: Para modificar los conceptos de gasto individuales o el valor total, deberá gestionar los gastos asociados a este mes (funcionalidad futura o en otra sección).</small></p>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" onClick={closeEditModal}>
                        Cancelar
                    </Button>
                    <Button style={{ background: '#2e8322', color: 'white' }} onClick={handleEditSubmit}> {/* Call dedicated edit handler */}
                        Actualizar
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={detailModalOpen} toggle={closeDetailModal} centered size="lg">
                <ModalHeader toggle={closeDetailModal} style={{ color: '#8C1616', fontWeight: 'bold' }}>
                    Detalles del Registro Mensual
                </ModalHeader>
                <ModalBody style={{ padding: '20px' }}>
                    {selectedItemForDetail && (
                        <div>
                            <Table bordered striped size="sm">
                                <tbody>
                                    <tr>
                                        <th scope="row" style={{ width: '30%' }}>ID Registro</th>
                                        <td>{selectedItemForDetail.idOverallMonth}</td>
                                    </tr>
                                     <tr>
                                         <th scope="row">Tipo Gasto ID</th>
                                         {/* You might want to display the type name if available */}
                                         <td>{selectedItemForDetail.idExpenseType} (Mano de Obra)</td>
                                     </tr>
                                    <tr>
                                        <th scope="row">Fecha</th>
                                        <td>{new Date(selectedItemForDetail.dateOverallExp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Valor Total Gasto</th>
                                        <td>{selectedItemForDetail.valueExpense?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Novedades</th>
                                        <td>{selectedItemForDetail.novelty_expense || '-'}</td>
                                    </tr>
                                     <tr>
                                         <th scope="row">Estado</th>
                                         <td>{selectedItemForDetail.status ? 'Activo' : 'Inactivo'}</td>
                                     </tr>
                                     {/* Here you might fetch and display the individual expense items associated with this month if your API supports it */}
                                      {/* Example:
                                      <tr>
                                          <th colSpan="2">Conceptos Incluidos:</th>
                                      </tr>
                                      <tr>
                                          <td colSpan="2">
                                              [Logic to fetch and display items related to selectedItemForDetail.idOverallMonth]
                                          </td>
                                      </tr>
                                      */}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter style={{ justifyContent: 'flex-end' }}>
                    <Button color="secondary" onClick={closeDetailModal}>
                        Cerrar
                    </Button>
                </ModalFooter>
            </Modal>

             {/* Keep Delete Modal if needed */}
             {/* <Modal isOpen={isDeleteModalOpen} toggle={handleDeleteModalClose}> ... </Modal> */}

        </Container>
    );
};

export default ManoDeObra;