import React from 'react';
import { Button } from 'reactstrap';
import { FaTrashAlt } from 'react-icons/fa';

const EliminarEmpleado = ({ empleado, setData, openSnackbar }) => {
  const eliminar = () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este empleado?")) {
      setData(prevData => prevData.filter(item => item.id !== empleado.id));
      openSnackbar("Empleado eliminado exitosamente", 'success');
    }
  };

  return (
    <Button color="danger" onClick={eliminar}>
      <FaTrashAlt />
    </Button>
  );
};

export default EliminarEmpleado;
