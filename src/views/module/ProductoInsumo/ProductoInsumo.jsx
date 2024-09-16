import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, FormGroup, Label, Input, Button, ListGroup, ListGroupItem } from 'reactstrap';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { FaPlus } from 'react-icons/fa';

const initialFormState = {
  productName: '',
  quantity: 0,
  typeGrams: '',
  startDate: '',
  endDate: '',
  productionStart: '',
  portionsPerUnit: 0,
  portions: 0,
  productionTypeGrams: '',
  supplier: '',
  recipeDetails: '',
  task: '',
  time: '',
};

const initialIngredientState = {
  insumo: '',
  cantidadPorPorcion: 0,
  cantidad: 0,
  tipoGramaje: '',
  proveedor: '',
};

const ProductForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [ingredientData, setIngredientData] = useState(initialIngredientState);
  const [ingredients, setIngredients] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleIngredientChange = (event) => {
    const { name, value } = event.target;
    setIngredientData((prevData) => ({ ...prevData, [name]: value }));
  };

  const addIngredient = () => {
    if (Object.values(ingredientData).every(value => value !== '')) {
      setIngredients([...ingredients, ingredientData]);
      setIngredientData(initialIngredientState);
    } else {
      setSnackbarMessage('Please fill all ingredient fields');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const validateForm = () => {
    const { quantity, portions, startDate, endDate } = formData;

    if (quantity < 0) {
      setSnackbarMessage('Quantity cannot be negative!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return false;
    }

    if (portions < 0) {
      setSnackbarMessage('Portions cannot be negative!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return false;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setSnackbarMessage('End date cannot be earlier than start date!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return false;
    }

    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('Submitted form data:', { ...formData, ingredients });

    setFormData(initialFormState);
    setIngredients([]);

    setSnackbarOpen(true);
    setSnackbarMessage('Product information submitted successfully!');
    setSnackbarSeverity('success');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="container mt-3">
      <h2>Informacion del producto</h2>
      <form onSubmit={handleSubmit}>
        <Row>
          <Col md={9}>
            <Row>
              <Col md={2}>
                <FormGroup>
                  <Label for="productName">Nombre del producto</Label>
                  <Input
                    type="text"
                    name="productName"
                    id="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="product name"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="quantity">Cantidad</Label>
                  <Input
                    type="number"
                    min="0"
                    name="quantity"
                    id="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="typeGrams">Tipo gramaje</Label>
                  <Input
                    type="text"
                    name="typeGrams"
                    id="typeGrams"
                    value={formData.typeGrams}
                    onChange={handleChange}
                    placeholder="type (grams)"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="startDate">Inicio</Label>
                  <Input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="endDate">Fin</Label>
                  <Input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <FormGroup>
                  <Label for="supplier">Insumo</Label>
                  <Input
                    type="text"
                    name="supplier"
                    id="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label for="portionsPerUnit">Cantidad por porcion</Label>
                  <Input
                    type="number"
                    name="portionsPerUnit"
                    id="portionsPerUnit"
                    value={formData.portionsPerUnit}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label for="portions">Cantidad</Label>
                  <Input
                    type="number"
                    name="portions"
                    id="portions"
                    value={formData.portions}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="typeGrams">Tipo gramaje</Label>
                  <Input
                    type="text"
                    name="typeGrams"
                    id="typeGrams"
                    value={formData.typeGrams}
                    onChange={handleChange}
                    placeholder="type (grams)"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label for="proveedor">Proveedor</Label>
                  <Input
                    type="text"
                    name="proveedor"
                    id="proveedor"
                    value={formData.proveedor}
                    onChange={handleChange}
                    placeholder="Proveedor"
                  />
                </FormGroup>
              </Col>
            </Row>
          </Col>
          <Col md={3}>
            <FormGroup>
              <Label for="recipeDetails">Proceso de elaboracion</Label>
              <Input
                type="textarea"
                name="recipeDetails"
                id="recipeDetails"
                value={formData.recipeDetails}
                onChange={handleChange}
                placeholder="recipe details"
              />
            </FormGroup>
          </Col>

          <h3>Tareas de orden de produccion</h3>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="task">Tarea</Label>
                <Input
                  type="text"
                  name="task"
                  id="task"
                  value={formData.task}
                  onChange={handleChange}
                  placeholder="Tarea"
                  required
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="time">Tiempo</Label>
                <Input
                  type="text"
                  name="time"
                  id="time"
                  value={formData.time}
                  onChange={handleChange}
                  placeholder="Tiempo"
                  required
                />
              </FormGroup>
            </Col>
          </Row>
        </Row>

        <h3>Ingredientes</h3>
        <Row>
          <Col md={2}>
            <FormGroup>
              <Label for="insumo">Insumo</Label>
              <Input
                type="text"
                name="insumo"
                id="insumo"
                value={ingredientData.insumo}
                onChange={handleIngredientChange}
                placeholder="Insumo"
              />
            </FormGroup>
          </Col>
          <Col md={2}>
            <FormGroup>
              <Label for="cantidadPorPorcion">Cantidad por porcion</Label>
              <Input
                type="number"
                name="cantidadPorPorcion"
                id="cantidadPorPorcion"
                value={ingredientData.cantidadPorPorcion}
                onChange={handleIngredientChange}
              />
            </FormGroup>
          </Col>
          <Col md={2}>
            <FormGroup>
              <Label for="cantidad">Cantidad</Label>
              <Input
                type="number"
                name="cantidad"
                id="cantidad"
                value={ingredientData.cantidad}
                onChange={handleIngredientChange}
              />
            </FormGroup>
          </Col>
          <Col md={2}>
            <FormGroup>
              <Label for="tipoGramaje">Tipo gramaje</Label>
              <Input
                type="text"
                name="tipoGramaje"
                id="tipoGramaje"
                value={ingredientData.tipoGramaje}
                onChange={handleIngredientChange}
                placeholder="tipo gramaje"
              />
            </FormGroup>
          </Col>
          <Col md={3}>
            <FormGroup>
              <Label for="proveedor">Proveedor</Label>
              <div className="d-flex">
                <Input
                  type="text"
                  name="proveedor"
                  id="proveedor"
                  value={ingredientData.proveedor}
                  onChange={handleIngredientChange}
                  placeholder="Proveedor"
                />
                <Button
                  color="primary"
                  className="ms-2 rounded-circle"
                  onClick={addIngredient}
                  style={{ width: '38px', height: '38px', padding: '0' }}
                >
                  <FaPlus />
                </Button>
              </div>
            </FormGroup>
          </Col>
        </Row>

        <ListGroup className="mb-3">
          {ingredients.map((ingredient, index) => (
            <ListGroupItem key={index}>
              {`${ingredient.insumo} - ${ingredient.cantidadPorPorcion} por porción - ${ingredient.cantidad} ${ingredient.tipoGramaje} - ${ingredient.proveedor}`}
            </ListGroupItem>
          ))}
        </ListGroup>

        <Row>
          <Col md={12}>
            <Button color="primary" type="submit">
              Add Product
            </Button>
          </Col>
        </Row>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProductForm;