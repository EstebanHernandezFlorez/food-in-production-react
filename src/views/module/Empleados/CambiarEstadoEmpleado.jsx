import React from 'react';
import { Button } from 'reactstrap';

const CambiarEstadoEmpleado = ({ empleado, setData, openSnackbar }) => {
  const cambiarEstado = () => {
    const updatedData = data.map(item =>
      item.id === empleado.id ? { ...item, Estado: !item.Estado } : item
    );

    setData(updatedData);
    openSnackbar(`Empleado ${empleado.Estado ? "desactivado" : "activado"} exitosamente`, 'success');
  };

  return (
    <Button 
      color={empleado.Estado ? "warning" : "success"} 
      onClick={cambiarEstado}
    >
      {empleado.Estado ? "Desactivar" : "Activar"}
    </Button>
  );
};

export default CambiarEstadoEmpleado;
