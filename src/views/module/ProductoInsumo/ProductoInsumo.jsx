import  { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, FormGroup, Label, Input, Button} from 'reactstrap';

const initialFormState = {
  productName: '',
  quantity: 0,
  typeGrams: '',
  startDate: '',
  endDate: '',
  // Next row inputs (assuming separate form fields):
  productionStart: '',
  portionsPerUnit: 0,
  portions: 0,
  productionTypeGrams: '',
  supplier: '',
};

const ProductForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isEditing]= useState('');
  const [Snackbar]=useState('');
  
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Perform form validation or data processing here
    // (e.g., check for empty fields, handle numerical inputs)

    console.log('Submitted form data:', formData);

    // Reset form
    setFormData(initialFormState);

    // Optionally show a success snackbar
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
          <Col md={6}>
            <FormGroup>
              <Label for="productName">Product Name</Label>
              <Input
                type="text"
                name="productName"
                id="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </FormGroup>
          </Col>
          <Col md={3}>
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
          <Col md={3}>
            <FormGroup>
              <Label for="typeGrams">Type (Grams)</Label>
              <Input
                type="text"
                name="typeGrams"
                id="typeGrams"
                value={formData.typeGrams}
                onChange={handleChange}
                placeholder="Enter type (grams)"
                required
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={3}>
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
          <Col md={3}>
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
          <Col md={3}>
            <FormGroup>
              <Label for="productionStart">Production Start</Label>
              <Input
                type="date"
                name="productionStart"
                id="productionStart"
                value={formData.productionStart}
                onChange={handleChange}
              />
            </FormGroup>
          </Col>
          <Col md={3}>
            <FormGroup>
              <Label for="portionsPerUnit">Portions per Unit</Label>
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
              <Label for="portions">Portions</Label>
              <Input
                type="number"
                name="portions"
                id="portions"
                value={formData.portions}
                onChange={handleChange}
              />
            </FormGroup>
          </Col>
          <Col md={3}>
            <FormGroup>
              <Label for="productionTypeGrams">Production Type (Grams)</Label>
              <Input
                type="text"
                name="productionTypeGrams"
                id="productionTypeGrams"
                value={formData.productionTypeGrams}
                onChange={handleChange}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={3}>
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
        </Row>
        <Row>
          <Col md={12}>
            <Button color="primary" type="submit">
              {isEditing ? 'Update Product' : 'Add Product'}
            </Button>
          </Col>
        </Row>
      </form>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
    </div>
  );
}
export default ProductForm;