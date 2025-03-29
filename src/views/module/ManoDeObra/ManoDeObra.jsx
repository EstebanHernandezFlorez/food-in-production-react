import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter, Label } from 'reactstrap';
import { FaEye } from 'react-icons/fa';
import { PlusCircleOutlined, DeleteOutlined, SelectOutlined, EditOutlined, TeamOutlined, PlusOutlined } from '@ant-design/icons';
import FondoIcono from '../../../assets/logoFIP.png'
import { useNavigate } from 'react-router-dom';
import MonthlyOverallExpenseService from "../../services/gastosGeneralesService";
import ConceptSpentService from "../../services/conceptoGasto";
import ConceptSpentSelect from './ConceptSpentSelect';
import toast, { Toaster } from 'react-hot-toast';
import '../../../index.css';

const ManoDeObra = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState({
        idExpenseType: 1,
        dateOverallExp: '',
        novelty_expense: '',
        status: true,
        idConceptSpent: '',
        price: ''
    });
    const [addedExpenses, setAddedExpenses] = useState([]);
    const [conceptSpents, setConceptSpents] = useState([]);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedManoObra, setSelectedManoObra] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedItem, setSelectedtoggle] = useState(null);
    const itemsPerPage = 7;

    const [formErrors, setFormErrors] = useState({
        dateOverallExp: '',
        novelty_expense: '',
        expenseItems: ''
    });
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        fetchData();
        fetchConceptSpents();
    }, []);

    const fetchData = async () => {
      try {
          const expenses = await MonthlyOverallExpenseService.getAllMonthlyOverallExpenses();
          console.log("Raw API Response:", expenses); // <-- ADD THIS LINE
          setData(expenses);
          console.log("Expenses data:", expenses);
      } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Error al cargar los datos");
      }
  };

    const fetchConceptSpents = async () => {
        try {
            const conceptSpentsData = await ConceptSpentService.getAllConceptSpents();
            setConceptSpents(conceptSpentsData);
            console.log("Concept spents data:", conceptSpentsData);
        } catch (error) {
            console.error("Error fetching concept spents:", error);
            toast.error("Error al cargar los conceptos de gasto");
        }
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setForm(prevForm => ({ ...prevForm, [name]: value }));
      setFormErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
      setApiError(null);
      console.log("handleChange:", name, value); // Add this line
  };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        if (!form.dateOverallExp) {
            newErrors.dateOverallExp = 'La fecha es obligatoria';
            isValid = false;
        }

        if (!form.novelty_expense) {
            newErrors.novelty_expense = 'La novedad es obligatoria';
            isValid = false;
        }
        if (addedExpenses.length === 0) {
            newErrors.expenseItems = 'Debe agregar al menos un concepto de gasto';
            isValid = false;
        }

        setFormErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        console.log("handleSubmit called");
        if (!validateForm()) {
            toast.error("Por favor, complete todos los campos.");
            return;
        }

        const totalValueExpense = addedExpenses.reduce((sum, item) => sum + Number(item.price), 0);
        const dateOverallExp = form.dateOverallExp;

        const payload = {
            ...form,
            dateOverallExp: dateOverallExp,
            valueExpense: totalValueExpense,
            expenseItems: addedExpenses
        };

        console.log("Payload being sent:", payload);

        try {
            let response;
            if (isEditing) {
                response = await MonthlyOverallExpenseService.updateMonthlyOverallExpense(selectedManoObra.idOverallMonth, payload);
                toast.success("Gasto mensual actualizado exitosamente.");
            } else {
                response = await MonthlyOverallExpenseService.createMonthlyOverallExpense(payload);
                toast.success("Gasto mensual creado exitosamente.");
            }

            console.log("API Response:", response);
            setShowForm(false);
            setForm({
                idExpenseType: 1,
                dateOverallExp: '',
                novelty_expense: '',
                status: true,
                idConceptSpent: '',
                price: ''
            });
            setAddedExpenses([]);
            fetchData();

        } catch (error) {
            console.error("Error al guardar el gasto:", error);
            const errorMessage = error.response?.data?.message || "Error al guardar el gasto.";
            setApiError(errorMessage);
            toast.error(errorMessage);
        }
    };
    const editar = async () => {
        if (!validateForm()) {
            toast.error("Por favor, ingrese todos los campos");
            return;
        }

        try {
            const dateOverallExp = form.dateOverallExp;
            const payload = {
                ...form,
                dateOverallExp: dateOverallExp,
            };
            console.log("Payload being sent for edit:", payload);
            await MonthlyOverallExpenseService.updateMonthlyOverallExpense(selectedManoObra.idOverallMonth, payload);
            fetchData();
            setIsEditing(false);
            setModalOpen(false);
            toast.success("Gasto actualizado exitosamente");
        } catch (error) {
            console.error("Error updating expense:", error);
            setApiError(error.response?.data?.message || "Error al editar el gasto");
            toast.error(error.response?.data?.message || "Error al editar el gasto");
        }
    };

    const cambiarEstado = async (idOverallMonth) => {
        try {
            const updatedData = data.map((item) =>
                item.idOverallMonth === idOverallMonth ? { ...item, status: !item.status } : item
            );
            setData(updatedData);
            await MonthlyOverallExpenseService.changeStateMonthlyOverallExpense(idOverallMonth, !updatedData.find(item => item.idOverallMonth === idOverallMonth).status);
            toast.success("Estado del gasto mensual actualizado exitosamente");
        } catch (error) {
            console.error("Error updating expense status:", error);
            toast.error("Error al cambiar el estado del gasto");
            setData(data);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setForm({
                idExpenseType: item.idExpenseType,
                dateOverallExp: item.dateOverallExp,
                novelty_expense: item.novelty_expense,
                status: item.status,
                idConceptSpent: '',
                price: ''
            });
            setSelectedManoObra(item);
            setAddedExpenses([]);

        } else {
            setIsEditing(false);
            setForm({
                idExpenseType: 1,
                dateOverallExp: '',
                novelty_expense: '',
                status: true,
                idConceptSpent: '',
                price: ''
            });
        }
        setModalOpen(true);
        setApiError(null);
        setFormErrors({
            dateOverallExp: '',
            novelty_expense: '',
            expenseItems: ''
        });
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    const handleTableSearch = (e) => {
        setTableSearchText(e.target.value.toLowerCase());
    };

    const filteredData = data.filter(item =>
        String(item.idOverallMonth).toLowerCase().includes(tableSearchText) ||
        String(item.idExpenseType).toLowerCase().includes(tableSearchText) ||
        String(item.valueExpense).toLowerCase().includes(tableSearchText)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        navigate('/tabla-gastos')
    };
    const handleRendimientoEmp = () => {
        navigate('/rendimiento-empleado');
    };

    const toggleDetailModal = () => setDetailModalOpen(!detailModalOpen);

    const viewDetails = (item) => {
        setSelectedItem(item);
        toggleDetailModal();
    };
    const openDeleteModal = (ManoObra) => {
        setSelectedManoObra(ManoObra);
        setIsDeleteModalOpen(true);
    };
    const handleDeleteModalClose = () => {
        setIsDeleteModalOpen(false);
        setSelectedManoObra(null);
    };
    const handleOk = () => {
        if (selectedManoObra) {
            const updatedData = data.filter(registro => registro.idOverallMonth !== selectedManoObra.idOverallMonth);
            setData(updatedData);
            toast.success("Gasto mensual eliminado exitosamente");
        }
        handleDeleteModalClose();
    };

    const handleCancel = () => {
        setModalOpen(false);
        setSelectedManoObra(null);
    };

    const addExpenseToTable = () => {
      const { idConceptSpent, price, dateOverallExp } = form;
    
      console.log("Concepto seleccionado:", idConceptSpent);
      console.log("Conceptos disponibles:", conceptSpents);
    
      if (!idConceptSpent || !price) {
        toast.error("Por favor, seleccione un concepto y agregue un precio.");
        return;
      }
    
      // Ensure idConceptSpent is a string before attempting to parse
      const idConceptSpentStr = String(idConceptSpent);
    
      const parsedIdConceptSpent = Number(idConceptSpentStr);  // Or parseInt(idConceptSpent, 10);
      console.log("ID parseado:", parsedIdConceptSpent);
    
      if (isNaN(parsedIdConceptSpent)) {
        toast.error("ID de concepto no es un número válido.");
        return;
      }
    
      const concept = conceptSpents.find(c => c.idConceptSpent === parsedIdConceptSpent);
    
      if (concept) {
        setAddedExpenses([...addedExpenses,
        {
          idConceptSpent: parsedIdConceptSpent,
          conceptName: concept.name,
          price: parseFloat(price),
          expenseDate: dateOverallExp
        }]);
        setForm(prevForm => ({ ...prevForm, idConceptSpent: '', price: '' }));
      } else {
        toast.error("El concepto de gasto seleccionado no es válido.");
      }
    };
    const removeExpenseFromTable = (index) => {
        const newExpenses = [...addedExpenses];
        newExpenses.splice(index, 1);
        setAddedExpenses(newExpenses);
    };

    const totalExpenses = addedExpenses.reduce((sum, item) => sum + item.price, 0);

    return (
        <Container>
            <Toaster />
            <br />
            {!showForm && (
                <>
                    <div className="d-flex align-items-center mb-3">
                        <img
                            src={FondoIcono}
                            alt="Descripción de la Imagen"
                            style={{
                                width: '5%',
                                height: '10vh',
                                objectFit: 'cover',
                                marginRight: '20px',
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: 0 }}>Administrar Lista</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Button
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '0',
                                }}
                                onClick={handleRendimientoEmp}
                            >
                                <TeamOutlined style={{ fontSize: '34px', color: 'black' }} />
                            </Button>
                            <span style={{ fontSize: '14px', color: 'black', marginTop: '5px' }}>Empleados</span>
                        </div>
                    </div>
                    <br />
                    <h5>Gastos mensuales del restaurante</h5>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Input
                            type="text" placeholder="Buscar gasto mensual" value={tableSearchText} onChange={handleTableSearch}
                            style={{ width: '50%' }}
                        />
                        <div className="d-flex">
                            <Button
                                style={{ backgroundColor: '#228b22', color: 'black', marginRight: '10px' }}
                                onClick={handleClick}
                            >
                                Gastos
                                <SelectOutlined style={{ fontSize: '16px', color: 'black', paddingLeft: '5px' }} />
                            </Button>
                            <Button
                                style={{
                                    backgroundColor: '#228b22',
                                    color: 'black',
                                }}
                                onClick={() => {
                                    setForm({
                                        idExpenseType: 1,
                                        dateOverallExp: '',
                                        novelty_expense: '',
                                        status: true,
                                        idConceptSpent: '',
                                        price: ''
                                    });
                                    setAddedExpenses([]);
                                    setShowForm(true);
                                }}
                            >
                                Crear registro de mes
                                <PlusCircleOutlined style={{ fontSize: '16px', color: 'black', paddingLeft: '5px' }} />
                            </Button>
                        </div>
                    </div>

                    <Table className="table table-sm table-hover">
                      <thead>
                          <tr>
                              <th style={{ textAlign: 'center' }}>ID</th>
                              <th style={{ textAlign: 'center' }}>Fecha</th>
                              <th style={{ textAlign: 'center' }}>Valor Gasto</th>
                              <th style={{ textAlign: 'center' }}>Novedades</th>
                              <th>Estado</th>
                              <th>Acciones</th>
                          </tr>
                      </thead>
                      <tbody>
                          {currentItems.length > 0 ? (
                              currentItems.map((item) => (
                                  <tr key={item.idOverallMonth}>
                                      <td style={{ textAlign: 'center' }}>{item.idOverallMonth}</td>
                                      <td style={{ textAlign: 'center' }}>{new Date(item.dateOverallExp).toLocaleDateString('es-ES')}</td>
                                      <td style={{ textAlign: 'center' }}>{item.valueExpense}</td>
                                      <td style={{ textAlign: 'center' }}>{item.novelty_expense}</td>
                                      <td>
                                          <Button
                                              color={item.status ? "success" : "secondary"}
                                              onClick={() => cambiarEstado(item.idOverallMonth)}
                                              className="btn-sm"
                                          >
                                              {item.status ? "Activo" : "Inactivo"}
                                          </Button>
                                      </td>
                                      <td>
                                          <div className="d-flex align-items-center">
                                              <Button
                                                  color="dark"
                                                  onClick={() => openModal(item)}
                                                  className="me-2"
                                                  style={{ padding: '0.25rem 0.5rem' }}
                                              >
                                                  <EditOutlined style={{ fontSize: '0.75rem' }} />
                                              </Button>
                                              <Button
                                                  onClick={() => viewDetails(item)}
                                                  className="me-3 btn-sm"
                                                  style={{
                                                      backgroundColor: '#F5C300',
                                                      border: 'none',
                                                      padding: '0.45rem',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                  }}
                                              >
                                                  <FaEye style={{ color: 'black', fontSize: '1.10rem', top: '5px' }} />
                                              </Button>
                                          </div>
                                      </td>
                                  </tr>
                              ))
                          ) : (
                              <tr>
                                  <td colSpan="6" className="text-center">No hay datos disponibles</td>
                              </tr>
                          )}
                      </tbody>
                  </Table>
                    <ul className="pagination">
                        {pageNumbers.map(number => (
                            <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                <Button className="page-link" onClick={() => handlePageChange(number)}>
                                    {number}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {showForm && (
                <div>
                    <h2 className="text-center">{isEditing ? 'Editar Registro mensual de gastos' : 'Crear Registro mensual de gastos'}</h2>
                    <br />
                    <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <Row className="mb-3">
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Fecha</Label>
                                    <Input
                                        type="date"
                                        name="dateOverallExp"
                                        value={form.dateOverallExp}
                                        onChange={handleChange}
                                        invalid={!!formErrors.dateOverallExp}
                                        style={{ border: '1px solid #ced4da' }}
                                    />
                                    {formErrors.dateOverallExp && <div className="invalid-feedback">{formErrors.dateOverallExp}</div>}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Novedades para este mes</Label>
                                    <Input
                                        type="textarea"
                                        name="novelty_expense"
                                        value={form.novelty_expense}
                                        onChange={handleChange}
                                        placeholder="Novedades"
                                        invalid={!!formErrors.novelty_expense}
                                        style={{
                                            width: '100%',
                                            maxHeight: '100px',
                                            overflowY: 'auto',
                                            border: '1px solid #ced4da'
                                        }}
                                    />
                                    {formErrors.novelty_expense && <div className="invalid-feedback">{formErrors.novelty_expense}</div>}
                                </FormGroup>
                            </Col>
                        </Row>

                        {/* Agregar Concepto de Gasto y Precio */}
                        <Row>
                        <Col md={5}>
                          <ConceptSpentSelect
                              value={form.idConceptSpent}
                              onChange={handleChange}
                              conceptSpents={conceptSpents}
                          />
                      </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Precio</Label>
                                    <Input
                                      type="number"
                                      name="price"
                                      value={form.price || ''} // Provide default
                                      onChange={handleChange}
                                      placeholder="Precio"
                                      style={{ border: '1px solid #ced4da' }}
                                  />
                                </FormGroup>
                            </Col>
                            <Col md={3} className="d-flex align-items-center">
                                <Button
                                    color="success"
                                    onClick={addExpenseToTable}
                                >
                                    <PlusOutlined /> Agregar Gasto
                                </Button>
                            </Col>
                        </Row>

                        {/* Tabla de Gastos Agregados */}
                        <Table className="mt-3">
                            <thead>
                                <tr>
                                    <th>Concepto de Gasto</th>
                                    <th>Precio</th>
                                    <th>Fecha Gasto</th> {/* Added header for date */}
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {addedExpenses.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.conceptName}</td>
                                        <td>{item.price}</td>
                                        <td>{new Date(item.expenseDate).toLocaleDateString('es-ES')}</td>{/* Displaying date in the table*/}
                                        <td>
                                            <Button color="danger" onClick={() => removeExpenseFromTable(index)}>
                                                <DeleteOutlined />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {/* Total de Gastos */}
                        <div className="text-right">
                            <h4>Total: {totalExpenses}</h4>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <Button style={{ background: '#2e8322' }} onClick={handleSubmit}>
                            {isEditing ? 'Actualizar' : 'Guardar'}
                        </Button>
                        <Button style={{ background: '#6d0f0f' }} onClick={() => { setShowForm(false); setIsEditing(false); }}>
                            Cancelar
                        </Button>
                    </div>
                    {apiError && <div className="alert alert-danger">{apiError}</div>}
                </div>
            )}

            {/* Modal de edición */}
            <Modal
                isOpen={modalOpen}
                toggle={() => setModalOpen(!modalOpen)}
                style={{
                    maxWidth: '80%',
                    height: 'auto',
                    maxHeight: '97vh',
                    overflow: 'hidden',
                }}
            >
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                    Editar Empleado
                </ModalHeader>
                <ModalBody>
                    <Row className="mb-3">
                        <Col md={6}>
                            <FormGroup>
                                <Label>Fecha</Label>
                                <Input
                                    type="date"
                                    name="dateOverallExp"
                                    value={form.dateOverallExp}
                                    onChange={handleChange}
                                    invalid={!!formErrors.dateOverallExp}
                                    style={{ border: '1px solid #ced4da' }}
                                />
                                {formErrors.dateOverallExp && <div className="invalid-feedback">{formErrors.dateOverallExp}</div>}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Novedades para este mes</Label>
                                <Input
                                    type="textarea"
                                    name="novelty_expense"
                                    value={form.novelty_expense}
                                    onChange={handleChange}
                                    placeholder="Novedades"
                                    invalid={!!formErrors.novelty_expense}
                                    style={{
                                        width: '100%',
                                        maxHeight: '100px',
                                        overflowY: 'auto',
                                        border: '1px solid #ced4da'
                                    }}
                                />
                                {formErrors.novelty_expense && <div className="invalid-feedback">{formErrors.novelty_expense}</div>}
                            </FormGroup>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <Button style={{ background: '#2e8322' }} onClick={editar}>
                        Actualizar
                    </Button>
                    <Button style={{ background: '#6d0f0f' }} onClick={closeModal}>
                        Cancelar
                    </Button>
                </ModalFooter>
                {apiError && <div className="alert alert-danger">{apiError}</div>}
            </Modal>

            <Modal
                isOpen={detailModalOpen}
                toggle={toggleDetailModal}
                style={{ maxWidth: '50%', marginTop: '10px', marginBottom: '3px' }}
            >
                <ModalHeader toggle={toggleDetailModal} style={{ color: '#8C1616', fontWeight: 'bold' }}>
                    Detalles del Empleado
                </ModalHeader>
                <ModalBody style={{ padding: '20px' }}>
                    {selectedItem && (
                        <div style={{ padding: '10px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #ddd' }}>
                                <thead style={{ backgroundColor: '#cccccc' }}>
                                    <tr>
                                        <th colSpan={2} style={{ textAlign: 'left', fontWeight: 'bold' }}>Información Básica</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', textAlign: 'left' }}>idExpenseType:</td>
                                        <td style={{ padding: '8px', textAlign: 'left' }}>{selectedItem.idExpenseType}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', textAlign: 'left' }}>dateOverallExp:</td>
                                        <td style={{ padding: '8px', textAlign: 'left' }}>{selectedItem.dateOverallExp}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', textAlign: 'left' }}>novelty_expense:</td>
                                        <td style={{ padding: '8px', textAlign: 'left' }}>{selectedItem.novelty_expense}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', textAlign: 'left' }}>valueExpense:</td>
                                        <td style={{ padding: '8px', textAlign: 'left' }}>{selectedItem.valueExpense}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter style={{ display: 'flex', justifyContent: 'flex-end', padding: '0' }}>
                    <Button style={{ background: '#6d0f0f' }} onClick={toggleDetailModal}>
                        Cerrar
                    </Button>
                </ModalFooter>
            </Modal>
        </Container>
    );
};

export default ManoDeObra;