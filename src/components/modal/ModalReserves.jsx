import  { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input } from 'reactstrap';

const ModalReserves = ({
  isOpen,
  toggle,
  reservation,
  selectedDate,
  onSave,
  onReschedule,
  onCancel,
  onEdit
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    distintivo: '',
    categoriaCliente: '',
    correo: '',
    celular: '',
    direccion: '',
    evento: '',
    fechaHora: '',
    cantidadMesas: '',
    duracionEvento: '',
    tipoEvento: '',
    nroPersonas: '',
    observaciones: '',
    servicios: '',
    montoDecoracion: '',
    abono: '',
    totalPago: '',
    restante: '',
    formaPago: '',
    estado: 'pendiente'
  });

  useEffect(() => {
    if (reservation) {
      setFormData(reservation);
    } else if (selectedDate) {
      setFormData(prev => ({ ...prev, fechaHora: selectedDate }));
    } else {
      setFormData({
        nombre: '',
        distintivo: '',
        categoriaCliente: '',
        correo: '',
        celular: '',
        direccion: '',
        evento: '',
        fechaHora: '',
        cantidadMesas: '',
        duracionEvento: '',
        tipoEvento: '',
        nroPersonas: '',
        observaciones: '',
        servicios: '',
        montoDecoracion: '',
        abono: '',
        totalPago: '',
        restante: '',
        formaPago: '',
        estado: 'pendiente'
      });
    }
  }, [reservation, selectedDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>
        {reservation ? 'Editar Reserva' : 'Nueva Reserva'}
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <FormGroup>
            <Label for="nombre">Nombre Completo</Label>
            <Input
              type="text"
              name="nombre"
              id="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="distintivo">Distintivo</Label>
            <Input
              type="text"
              name="distintivo"
              id="distintivo"
              value={formData.distintivo}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="categoriaCliente">Categoría Cliente</Label>
            <Input
              type="select"
              name="categoriaCliente"
              id="categoriaCliente"
              value={formData.categoriaCliente}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione una categoría</option>
              <option value="Privado">Privado</option>
              <option value="Corporativo">Corporativo</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="correo">Correo</Label>
            <Input
              type="email"
              name="correo"
              id="correo"
              value={formData.correo}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="celular">Celular</Label>
            <Input
              type="tel"
              name="celular"
              id="celular"
              value={formData.celular}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="direccion">Dirección</Label>
            <Input
              type="text"
              name="direccion"
              id="direccion"
              value={formData.direccion}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="evento">Evento</Label>
            <Input
              type="text"
              name="evento"
              id="evento"
              value={formData.evento}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="fechaHora">Fecha y Hora</Label>
            <Input
              type="datetime-local"
              name="fechaHora"
              id="fechaHora"
              value={formData.fechaHora}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="cantidadMesas">Cantidad de Mesas</Label>
            <Input
              type="number"
              name="cantidadMesas"
              id="cantidadMesas"
              value={formData.cantidadMesas}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="duracionEvento">Duración del Evento</Label>
            <Input
              type="text"
              name="duracionEvento"
              id="duracionEvento"
              value={formData.duracionEvento}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="tipoEvento">Tipo de Evento</Label>
            <Input
              type="text"
              name="tipoEvento"
              id="tipoEvento"
              value={formData.tipoEvento}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="nroPersonas">Número de Personas</Label>
            <Input
              type="number"
              name="nroPersonas"
              id="nroPersonas"
              value={formData.nroPersonas}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="observaciones">Observaciones</Label>
            <Input
              type="textarea"
              name="observaciones"
              id="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label for="servicios">Servicios</Label>
            <Input
              type="text"
              name="servicios"
              id="servicios"
              value={formData.servicios}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label for="montoDecoracion">Monto Decoración</Label>
            <Input
              type="number"
              name="montoDecoracion"
              id="montoDecoracion"
              value={formData.montoDecoracion}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="abono">Abono</Label>
            <Input
              type="number"
              name="abono"
              id="abono"
              value={formData.abono}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="totalPago">Total a Pagar</Label>
            <Input
              type="number"
              name="totalPago"
              id="totalPago"
              value={formData.totalPago}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="restante">Restante</Label>
            <Input
              type="number"
              name="restante"
              id="restante"
              value={formData.restante}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="formaPago">Forma de Pago</Label>
            <Input
              type="text"
              name="formaPago"
              id="formaPago"
              value={formData.formaPago}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="estado">Estado</Label>
            <Input
              type="select"
              name="estado"
              id="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_proceso">En Proceso</option>
              <option value="terminada">Terminada</option>
              <option value="anulada">Anulada</option>
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" type="submit">
            {reservation ? 'Actualizar' : 'Crear'} Reserva
          </Button>
          {reservation && (
            <>
              <Button color="warning" onClick={() => onReschedule(reservation.id)}>
                Reprogramar
              </Button>
              <Button color="danger" onClick={() => onCancel(reservation.id)}>
                Cancelar Reserva
              </Button>
            </>
          )}
          <Button color="secondary" onClick={toggle}>
            Cerrar
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

ModalReserves.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  reservation: PropTypes.object,
  selectedDate: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onReschedule: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default ModalReserves;