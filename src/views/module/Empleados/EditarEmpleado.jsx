import React from 'react';
import { Button, FormGroup, Input, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

const EditarEmpleado = ({ modalEditar, setModalEditar, form, setForm, data, setData, openSnackbar }) => {
  const handleChange = e => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const editar = () => {
    const updatedData = data.map(item =>
      item.id === form.id ? form : item
    );

    setData(updatedData);
    setModalEditar(false);
    openSnackbar("Empleado actualizado exitosamente", 'success');
  };

  return (
    <Modal isOpen={modalEditar}>
      <ModalHeader>Editar Empleado</ModalHeader>
      <ModalBody>
        <FormGroup>
          <label>Nombre Completo:</label>
          <Input 
            name="Nombre" 
            type="text" 
            onChange={handleChange} 
            value={form.Nombre} 
          />
        </FormGroup>
        <FormGroup>
          <label>Documento:</label>
          <Input 
            name="Document" 
            type="text" 
            onChange={handleChange} 
            value={form.Document} 
          />
        </FormGroup>
        <FormGroup>
          <label>Fecha Inicio:</label>
          <Input 
            name="FechaIni" 
            type="date" 
            onChange={handleChange} 
            value={form.FechaIni} 
          />
        </FormGroup>
        <FormGroup>
          <label>Numero SS:</label>
          <Input 
            name="NumeroSS" 
            type="text" 
            onChange={handleChange} 
            value={form.NumeroSS} 
          />
        </FormGroup>
        <FormGroup>
          <label>Dirección:</label>
          <Input 
            name="Direccion" 
            type="text" 
            onChange={handleChange} 
            value={form.Direccion} 
          />
        </FormGroup>
        <FormGroup>
          <label>Tipo Contrato:</label>
          <Input 
            name="TipoContrato" 
            type="text" 
            onChange={handleChange} 
            value={form.TipoContrato} 
          />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={editar}>Guardar</Button>{' '}
        <Button color="secondary" onClick={() => setModalEditar(false)}>Cancelar</Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditarEmpleado;
