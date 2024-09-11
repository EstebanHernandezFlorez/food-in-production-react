/* import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, FormGroup, Label, Input, Button } from 'reactstrap';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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
  recipeDetails: '', // Agregamos recipeDetails al estado
};

const ProductForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
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

    console.log('Submitted form data:', formData);

    setFormData(initialFormState);

    setSnackbarOpen(true);
    setSnackbarMessage('Product information submitted successfully!');
    setSnackbarSeverity('success');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="container mt-3">
      <h2>Product Information</h2>
      <form onSubmit={handleSubmit}>
        <Row>
          <Col md={9}>
            <Row>
              <Col md={2}>
                <FormGroup>
                  <Label for="productName">Product Name</Label>
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
                  <Label for="quantity">Quantity</Label>
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
                  <Label for="typeGrams">Type (Grams)</Label>
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
                  <Label for="startDate">Start Date</Label>
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
                  <Label for="endDate">End Date</Label>
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
            <Col md={4}>
                <FormGroup>
                  <Label for="supplier">Supplier</Label>
                  <Input
                    type="text"
                    name="supplier"
                    id="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="quatityforportion">quantity for portion</Label>
                  <Input
                    type="number"
                    name="portionsPerUnit"
                    id="portionsPerUnit"
                    value={formData.portionsPerUnit}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="Cantidad">Cantidad</Label>
                  <Input
                    type="number"
                    name="Cantidad"
                    id="Cantidad"
                    value={formData.portions}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="typeGrams">Type (Grams)</Label>
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
                  <Label for="Proveedor">Proveedor</Label>
                  <Input
                    type="text"
                    name="Proveedor"
                    id="Proveedor"
                    value={formData.typeGrams}
                    onChange={handleChange}
                    placeholder="Proveedor"
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
          </Col>
          <Col md={3}>
            <FormGroup>
              <Label for="recipeDetails">Recipe Details</Label>
              <Input
                type="textarea"
                name="recipeDetails"
                id="recipeDetails"
                value={formData.recipeDetails}
                onChange={handleChange}
                placeholder="Enter recipe details"
              />
            </FormGroup>
          </Col>
        </Row>
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
 */




import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, FormGroup, Label, Input, Button } from 'reactstrap';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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
  recipeDetails: '', // Agregamos recipeDetails al estado
};

const ProductForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
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

    console.log('Submitted form data:', formData);

    setFormData(initialFormState);

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
                  <Label for="Cantidad">Cantidad</Label>
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
      <form>
        <Row>
          <Col md={12}>
            <Row>
              <Col md={12}>
              <FormGroup>
                  <Label for="Taraea">Tarea</Label>
                  <Input
                    type="text"
                    name="Tarea"
                    id="Tarea"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="Taraea"
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
          </Col>
        </Row>
      </form>
        </Row>
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
