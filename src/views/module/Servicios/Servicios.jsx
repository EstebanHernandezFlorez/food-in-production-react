import { useState, useEffect } from 'react';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, ModalFooter, FormGroup, Input } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const initialData = [
  { id: 1, Nombre: "Decoraciones", Estado: "Activo" }
];

const Servicios = () => {
  const [data, setData] = useState(initialData);
  const [filteredData, setFilteredData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    Nombre: '',
    Estado: 'Activo',
  });
  const [modalInsertar, setModalInsertar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    setFilteredData(data.filter(item =>
      item.Nombre.toLowerCase().includes(searchText.toLowerCase())
    ));
  }, [data, searchText]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const validarFormulario = () => {
    if (!form.Nombre.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Todos los campos son obligatorios.',
        icon: 'error',
        confirmButtonColor: '#2e8322',
      });
      return false;
    }
    return true;
  };

  const insertar = async () => {
    if (!validarFormulario()) return;

    const servicioExistente = data.find(servicio => servicio.Nombre.toLowerCase() === form.Nombre.toLowerCase());

    if (servicioExistente) {
      await Swal.fire({
        title: 'Error',
        text: 'El servicio ya existe.',
        icon: 'error',
        confirmButtonColor: '#2e8322',
      });
    } else {
      const result = await Swal.fire({
        title: '¿Desea agregar este servicio?',
        text: `Nombre: ${form.Nombre}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2e8322',
        cancelButtonColor: '#6d0f0f',
        confirmButtonText: 'Sí, agregar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const valorNuevo = { ...form, id: data.length + 1 };
        setData([...data, valorNuevo]);
        setModalInsertar(false);
        setForm({ id: '', Nombre: '', Estado: 'Activo' });
        await Swal.fire('Agregado', 'El servicio ha sido agregado con éxito.', 'success');
      }
    }
  };

  const editar = async () => {
    if (!validarFormulario()) return;

    const servicioExistente = data.find(servicio => 
      servicio.Nombre.toLowerCase() === form.Nombre.toLowerCase() && servicio.id !== form.id
    );

    if (servicioExistente) {
      await Swal.fire({
        title: 'Error',
        text: 'No se puede editar. Otro servicio con el mismo nombre ya existe.',
        icon: 'error',
        confirmButtonColor: '#2e8322',
      });
    } else {
      const result = await Swal.fire({
        title: '¿Desea editar este servicio?',
        text: `Nuevo nombre: ${form.Nombre}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2e8322',
        cancelButtonColor: '#6d0f0f',
        confirmButtonText: 'Sí, editar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const newData = data.map(servicio => servicio.id === form.id ? form : servicio);
        setData(newData);
        setModalEditar(false);
        setForm({ id: '', Nombre: '', Estado: 'Activo' });
        await Swal.fire('Editado', 'El servicio ha sido editado con éxito.', 'success');
      }
    }
  };

  const eliminar = async (servicio) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el servicio "${servicio.Nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2e8322',
      cancelButtonColor: '#6d0f0f',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const newData = data.filter(item => item.id !== servicio.id);
      setData(newData);
      await Swal.fire('Eliminado', 'El servicio ha sido eliminado con éxito.', 'success');
    }
  };

  const cambiarEstado = async (id) => {
    const servicio = data.find(s => s.id === id);
    const nuevoEstado = servicio.Estado === "Activo" ? "Inactivo" : "Activo";

    const result = await Swal.fire({
      title: "¿Desea cambiar el estado del servicio?",
      text: `El servicio "${servicio.Nombre}" pasará de ${servicio.Estado} a ${nuevoEstado}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2e8322",
      cancelButtonColor: "#6d0f0f",
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const updatedData = data.map((registro) => {
        if (registro.id === id) {
          return { ...registro, Estado: nuevoEstado };
        }
        return registro;
      });

      setData(updatedData);
      await Swal.fire('Actualizado', `El estado del servicio ha sido actualizado a ${nuevoEstado}.`, 'success');
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <Container>
      <h2 className="text-right mt-4">Lista de Servicios Adicionales</h2>
      <div className="d-flex justify-content-between align-items-center mb-3 mx-auto" style={{ maxWidth: '900px' }}>
        <Input
          type="text"
          placeholder="Buscar servicio adicional"
          value={searchText}
          onChange={handleSearch}
          style={{ width: '200px' }}
        />
        <Button color="success" onClick={() => setModalInsertar(true)}>Agregar Servicio</Button>
      </div>

      <div className="table-responsive mx-auto" style={{ maxWidth: '700px' }}>
        <Table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((elemento) => (
              <tr key={elemento.id} style={{ backgroundColor: elemento.Estado === "Inactivo" ? "#e9ecef" : "white" }}>
                <td>{elemento.id}</td>
                <td>{elemento.Nombre}</td>
                <td>
                  <Button
                    color={elemento.Estado === "Activo" ? "success" : "secondary"}
                    onClick={() => cambiarEstado(elemento.id)}
                    size="sm"
                    className="mr-1"
                    style={{ backgroundColor: elemento.Estado === "Activo" ? "#2e8322" : "#8d0f0f", color: "white", padding: '0.375rem 0.75rem' }}
                  >
                    {elemento.Estado}
                  </Button>{' '}
                  <Button color="dark" onClick={() => { setModalEditar(true); setForm(elemento); }}><FaEdit /></Button>{' '}
                  <Button color="danger" onClick={() => eliminar(elemento)}><FaTrashAlt /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-center">
        {pageNumbers.map(number => (
          <Button
            key={number}
            color="info"
            onClick={() => setCurrentPage(number)}
            className="mx-1"
          >
            {number}
          </Button>
        ))}
      </div>

      {/* Modal Insertar */}
      <Modal isOpen={modalInsertar} toggle={() => setModalInsertar(!modalInsertar)}>
        <ModalHeader style={{ background: '#6d0f0f', color: 'white' }}>
          Agregar servicio
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <label><b>Nombre:</b></label>
            <Input
              name="Nombre"
              type="text"
              onChange={handleChange}
              value={form.Nombre}
              style={{ border: '2px solid #000000' }}
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="success" onClick={insertar}>Agregar</Button>
          <Button color="danger" onClick={() => setModalInsertar(false)}>Cancelar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={modalEditar} toggle={() => setModalEditar(!modalEditar)}>
        <ModalHeader style={{ background: '#6d0f0f', color: 'white' }}>
          Editar servicio adicional
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <label><b>Nombre:</b></label>
            <Input
              name="Nombre"
              type="text"
              onChange={handleChange}
              value={form.Nombre}
              style={{ border: '2px solid #000000' }}
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="success" onClick={editar}>Editar</Button>
          <Button color="danger" onClick={() => setModalEditar(false)}>Cancelar</Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default Servicios;