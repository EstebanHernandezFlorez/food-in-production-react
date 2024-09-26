import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Table,
  Button,
  Container,
  Row,
  Col,
  FormGroup,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { Snackbar, Alert } from "@mui/material";
import * as XLSX from "xlsx";

const initialData = [
  {
    id: 1,
    HorayFechaInicial: "07:05 am 04/09/2024",
    HorayFechaFinal: "08:00 am 05/09/2024",
    Producto: "Carne de hamburguesa",
    CantidadInicial: "10",
    CantidadFinal: "10",
    Estado: "Por iniciar",
    HorayFechadeEstado: "07:30am 04/09/2024",
  },
  {
    id: 2,
    HorayFechaInicial: "08:05 am 04/09/2024",
    HorayFechaFinal: "09:00 am 05/09/2024",
    Producto: "Guacamole",
    CantidadInicial: "10",
    CantidadFinal: "10",
    Estado: "En produccion",
    HorayFechadeEstado: "07:30am 04/09/2024",
  },
  {
    id: 3,
    HorayFechaInicial: "07:05 am 06/09/2024",
    HorayFechaFinal: "08:00 am 06/09/2024",
    Producto: "Postre",
    CantidadInicial: "10",
    CantidadFinal: "10",
    Estado: "En pausa",
    HorayFechadeEstado: "07:30am 04/09/2024",
  },
  {
    id: 4,
    HorayFechaInicial: "07:05 am 07/09/2024",
    HorayFechaFinal: "08:00 am 07/09/2024",
    Producto: "Cañon",
    CantidadInicial: "10",
    CantidadFinal: "10",
    Estado: "Terminado",
    HorayFechadeEstado: "07:30am 04/09/2024",
  },
  {
    id: 5,
    HorayFechaInicial: "07:05 am 08/09/2024",
    HorayFechaFinal: "08:00 am 09/09/2024",
    Producto: "Postre",
    CantidadInicial: "10",
    CantidadFinal: "10",
    Estado: "Cancelado",
    HorayFechadeEstado: "07:30am 04/09/2024",
  },
  {
    id: 6,
    HorayFechaInicial: "07:05 am 10/09/2024",
    HorayFechaFinal: "08:00 am 10/09/2024",
    Producto: "Arroz",
    CantidadInicial: "10",
    CantidadFinal: "10",
    Estado: "",
    HorayFechadeEstado: "07:30am 04/09/2024",
  },
];

const Produccion = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: "",
    producto: "",
    receta: "",
    cantidadaproducir: "",
    pesofinalporunidad: "",
    cantidadfinal: "",
    horayfechafinal: "",
    estado: "",
    horayfechadeestado: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableSearchText, setTableSearchText] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false); // Estado para el modal de edición
  const itemsPerPage = 7;

  // States for validation
  const [formErrors, setFormErrors] = useState({
    TipoDocumento: false,
    Documento: false,
    Celular: false,
    NombreCompleto: false,
    Correo: false,
    Rol: false,
    Contraseña: false,
    Confirmarcontraseña: false,
  });

  const handleTableSearch = (e) => {
    setTableSearchText(e.target.value.toLowerCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  const validateForm = () => {
    const errors = {
      producto: !form.producto,
      receta: !form.receta,
      cantidadaproducir: !form.cantidadaproducir,
      pesofinalporunidad: !form.pesofinalporunidad,
      cantidadfinal: !form.cantidadfinal,
      horayfechafinal: !form.horayfechafinal,
      estado: !form.estado,
      horayfechadeestado: !form.horayfechadeestado,
    };
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", "warning");
      return;
    }

    //   const {Producto,receta,cantidadaproducir,pesofinalporunidad,cantidadfinal,fechayhoraestimadadeterminacion,estado,observaciones} = form;

    //   const ordenExistente = data.find(registro => registro.id.toString() === id.toString().);
    // //  { if (ordenExistente) {
    // //     openSnackbar("La orden de produccion ya existe. Por favor, ingrese un documento de usuario diferente.", 'error');
    // //     return;
    // //   }}

    const nuevaorden = {
      ...form,
      id: data.length ? Math.max(...data.map((user) => user.id)) + 1 : 1,
    };

    setData([...data, nuevaorden]);
    setForm({
      id: "",
      HorayFechaInicial: "",
      HorayFechaFinal: "",
      Producto: "",
      CantidadInicial: "",
      CantidadFinal: "",
      Estado: "",
      HorayFechadeEstado: "",
    });
    setShowForm(false);
    openSnackbar("orden agregada exitosamente", "success");
  };

  const editar = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", "warning");
      return;
    }

    const usuarioExistente = data.find(
      (registro) =>
        registro.Documento.toString() === form.Documento.toString() &&
        registro.id !== form.id
    );

    if (usuarioExistente) {
      openSnackbar(
        "Ya existe un usuario con el mismo documento. Por favor, ingresa un documento diferente.",
        "error"
      );
      return;
    }

    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );

    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false); // Cierra el modal después de actualizar
    openSnackbar("Orden de produccion actualizada exitosamente", "success");
  };

  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });

    setData(updatedData);
    openSnackbar("Estado del usuario actualizado exitosamente", "success");
  };
  const filteredData = data.filter(
    (item) =>
      item.HorayFechaInicial.toLowerCase().includes(tableSearchText) ||
      item.HorayFechaFinal.toString().includes(tableSearchText) ||
      item.Producto.toLowerCase().includes(tableSearchText) ||
      item.CantidadInicial.toString().includes(tableSearchText) ||
      item.CantidadFinal.toString().includes(tableSearchText) ||
      item.Estado.toString().includes(tableSearchText) ||
      item.HorayFechadeEstado.toString().includes(tableSearchText)
  );

  const Producto = [
    { id: 1, nombreproducto: "LOMO DE CERDO AHUMADO" },
    { id: 2, nombreproducto: "ROASTBEEF" },
    { id: 3, nombreproducto: "PULLEDPORK" },
    { id: 4, nombreproducto: "COSTILLAS" },
    { id: 5, nombreproducto: "CARNE HAMBURGUESA" },
    { id: 6, nombreproducto: "POLLO DE SMECHADO" },
    { id: 7, nombreproducto: "ZABALETA DESMECHADA" },
    { id: 8, nombreproducto: "FILETES DE POLLO CON ADOBO AL PASTOR" },
    { id: 9, nombreproducto: "ALBÓNDIGAS DE RES" },
    { id: 10, nombreproducto: "FILETES DE CERDO CON ADOBO AL PASTOR" },
    { id: 11, nombreproducto: "SALSA BBQ" },
    { id: 12, nombreproducto: "SALSA MARACUYÁ DULCE PYPICANTE" },
    { id: 13, nombreproducto: "SALSA CHILANGA" },
    { id: 14, nombreproducto: "SALSA DE LIMON" },
    { id: 15, nombreproducto: "SALSA DE ALBAHACA" },
    { id: 16, nombreproducto: "SALSA MIEL MOSTAZA" },
    { id: 17, nombreproducto: "SALSA CARAMELO DE COCO" },
    { id: 18, nombreproducto: "ADOBO PASTOR" },
    { id: 19, nombreproducto: "SALSA DE VEGETALES ROSTIZADOS" },
    { id: 20, nombreproducto: "PRELIMINAR LIMONADA DE COCO" },
    { id: 21, nombreproducto: "BIZCOCHUELO" },
    { id: 22, nombreproducto: "BROWNIE" },
    { id: 23, nombreproducto: "FLANES" },
    {
      id: 24,
      nombreproducto: "FRUTA PROCESADA PARAJUGOS",
      frutas: ["MANGO", "FRESA", "UVA", "PIÑA", "MORA"],
    },
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const handleDownloadExcel = () => {
    // Datos de ejemplo, puedes reemplazarlos con tus propios datos
    const data = [
      {
        HorayFechaInicial: "07:05 am 04/09/2024",
        HorayFechaFinal: "08:00 am 05/09/2024",
        Producto: "Carne de hamburguesa",
        CantidadInicial: "10",
        CantidadFinal: "10",
        Estado: "",
        HorayFechadeEstado: "07:30am 04/09/2024",
      },
    ];

    // Crea una hoja de trabajo (worksheet) a partir de los datos
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Crea un libro de trabajo (workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Personas");

    // Genera un archivo Excel
    XLSX.writeFile(workbook, "datos.xlsx");
  };

  // Lista de tareas y tiempos correspondientes
  const tareas = [
    "Buscar y pesar ingredientes",
    "Mezclar en licuadora",
    "Inyectar",
    "Sumergir en salmuera",
    "Refrigerar",
    "Colocar en horno",
    "Reposar",
    "Buscar y pesar ingredientes",
    "Cortar",
    "Pesar",
    "Empacar al vacío",
    "Rotular",
    "Congelar",
  ];

  // Tiempos correspondientes para cada tarea en minutos
  const tiempos = [10, 15, 20, 25, 30, 45, 50, 60, 10, 15, 20, 25, 30];

  // Calcular el tiempo total sumando todos los tiempos
  const tiempoTotal = tiempos.reduce((acc, curr) => acc + curr, 0);

  return (
    <Container>
      <br />
      {/* Mostrar la sección de búsqueda y el botón solo si no se está mostrando el formulario */}
      {!showForm && (
        <>
          <h2 className="mb-5 text-center">Ordenes de producciòn</h2>
          <div>
              <div className="d-flex justify-content-between  mb-4">
                <Input
                  type="text"
                  placeholder="Buscar orden de producciòn"
                  value={tableSearchText}
                  onChange={handleTableSearch}
                  style={{ width: "50%" }}
                />

                <button
                  className="btn btn-success"
                  onClick={() => {
                    handleDownloadExcel();
                  }}
                >
                  Descargar Excel
                </button>
                <Button
                  color="success"
                  onClick={() => {
                    setForm({
                      id: "",
                      HorayFechaInicial: "",
                      HorayFechaFinal: "",
                      Producto: "",
                      CantidadInicial: "",
                      CantidadFinal: "",
                      Estado: "",
                      HorayFechadeEstado: "",
                    });
                    setIsEditing(false);
                    setShowForm(true);
                  }}
                >
                  Crear orden de producciòn
                </Button>
              </div>

              <Row className="mb-3 justify-content-center d-flex flex-wrap">
                {meses.map((mes, index) => (
                  <Col key={index} xs="auto">
                    <div className="mes">{mes}</div>
                  </Col>
                ))}
              </Row>
            </div>

            <Table className="table table-sm table-hover">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Hora y Fecha Inicio</th>
                  <th>Hora y Fecha Final</th>
                  <th>Producto</th>
                  <th>Cantidad Inicial</th>
                  <th>Cantidad Final</th>
                  <th>Estado</th>
                  <th>Hora y Fecha de Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.HorayFechaInicial}</td>
                      <td>{item.HorayFechaFinal}</td>
                      <td>{item.Producto}</td>
                      <td>{item.CantidadInicial}</td>
                      <td>{item.CantidadFinal}</td>
                      <td>{item.Estado}</td>
                      <td>{item.HorayFechadeEstado}</td>

                      <td>
                        <div className="d-flex align-items-center">
                          <Button
                            color="info"
                            onClick={() => {
                              setForm(item);
                              setIsEditing(true);
                              setModalOpen(true);
                            }}
                            className="me-2 btn-sm"
                          >
                            <FaEdit />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No hay datos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <ul className="pagination">
              {pageNumbers.map((number) => (
                <li
                  key={number}
                  className={`page-item ${
                    currentPage === number ? "active" : ""
                  }`}
                >
                  <Button
                    className="page-link"
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Formulario de inserción */}
        {showForm && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 text-center">
              <h4 className="text-center">
                {isEditing
                  ? "Editar orden de producción"
                  : "ORDEN DE PRODUCCIÒN Nº XXX"}
              </h4>
            </div>
            <br />
            <div className="d-flex align-items-center flex-nowrap">
              <div className="d-flex align-items-center">
                <Col md={2} className="mb-2 col-md-4">
                  <FormGroup className="d-flex align-items-center">
                    <label
                      style={{
                        
                      
                    
                      }}
                    >
                      Elija el nombre del producto
                    </label>
                    <Input
                      type="select"
                      name="Produco"
                      value={form.producto}
                      onChange={handleChange}
                      className={`form-control  ${
                        formErrors.Producto ? "is-invalid" : ""
                      }`}
                      style={{ width: "50%" }}
                    >
                      <option value="">PRODUCTO</option>
                      {Producto.map((producto) => (
                        <option key={producto.id} value={producto.nombreproducto}>
                          {producto.nombreproducto}
                        </option>
                      ))}
                    </Input>
                    {formErrors.Producto && (
                      <div className="invalid-feedback">
                        Este campo es obligatorio.
                      </div>
                    )}
                  </FormGroup>
                </Col>

                <Col md={2} className="mb-2 m-2">
                  <FormGroup>
                    <label style={{ fontSize: "15px", padding: "5px" }}>
                      Receta
                    </label>
                    <Input
                      type="text"
                      name="receta"
                      value={form.receta}
                      onChange={handleChange}
                      placeholder="Receta"
                      className={`form-control ${
                        formErrors.receta ? "is-invalid" : ""
                      }`}
                    />
                    {formErrors.receta && (
                      <div className="invalid-feedback">
                        Este campo es obligatorio.
                      </div>
                    )}
                  </FormGroup>
                </Col>

                <Col md={2} className="mb-2 mx-3">
  <FormGroup>
    <label style={{ fontSize: "15px", paddingRight: "5px" }}>
      Cantidad a producir
    </label>
    <Input
      type="number"
      name="cantidadaproducir"
      value={form.cantidadaproducir}
      onChange={handleChange}
      className={`form-control ${
        formErrors.cantidadaproducir ? "is-invalid" : ""
      }`}
      style={{ width: "100px" }} // Ajuste del ancho del input
    />
    {formErrors.cantidadaproducir && (
      <div className="invalid-feedback">Este campo es obligatorio.</div>
    )}
  </FormGroup>
</Col>

<Col md={2} className="mb-2 mx-3">
  <FormGroup>
    <label style={{ fontSize: "15px", paddingRight: "5px" }}>
      Peso final por unidad
    </label>
    <Input
      type="text"
      name="pesofinalporunidad"
      value={form.pesofinalporunidad}
      onChange={handleChange}
      className={`form-control ${
        formErrors.pesofinalporunidad ? "is-invalid" : ""
      }`}
      style={{ width: "100px" }} // Ajuste del ancho del input
    />
    {formErrors.pesofinalporunidad && (
      <div className="invalid-feedback">Este campo es obligatorio.</div>
    )}
  </FormGroup>
</Col>


                <Col md={2} className="mb-2">
                  <FormGroup>
                    <label style={{ fontSize: "15px", padding: "5px" }}>
                      Cantidad final
                    </label>
                    <Input
                      type="number"
                      name="cantidadfinal"
                      value={form.cantidadfinal}
                      onChange={handleChange}
                      className={`form-control ${
                        formErrors.cantidadfinal ? "is-invalid" : ""
                      }`}
                      style={{ width: "80px" }} // Ajuste del ancho del input
                    />
                    {formErrors.cantidadfinal && (
                      <div className="invalid-feedback">
                        Este campo es obligatorio.
                      </div>
                    )}
                  </FormGroup>
                </Col>
              </div>
            </div>
          <hr
            style={{
              width: "100%",
              margin: "20px 0",
              border: "none",
              height: "2px", // Ajusta el grosor de la línea
              backgroundColor: "black", // Color negro
            }}
          />
          <div>
            <div className="container mt-4">
              {/* Título alineado a la izquierda */}
              <h2 className="text-left">Tareas de orden de producción</h2>

              {/* Encabezado para las columnas de tiempo */}
              <div className="row">
                <div className="col-md-2"></div>{" "}
                {/* Espacio vacío para alinearlo con los tiempos */}
                <div className="col-md-2 text-center">
                  <h5>Tiempo</h5>
                </div>
                <div className="col-md-2"></div>
                <div className="col-md-2 text-center">
                  <h5>Tiempo</h5>
                </div>
                <div className="col-md-2"></div>
                <div className="col-md-2 text-center">
                  <h5>Tiempo</h5>
                </div>
              </div>

              {/* Filas de contenido con 6 columnas */}
              <div className="row">
                {/* Primera columna de tareas (1-5) */}
                <div className="col-md-2">
                  {tareas.slice(0, 5).map((tarea, index) => (
                    <p key={index}>
                      {index + 1}. {tarea}
                    </p>
                  ))}
                </div>

                {/* Segunda columna de tiempos (1-5) */}
                <div className="col-md-2">
                  {tiempos.slice(0, 5).map((tiempo, index) => (
                    <div key={index} className="border p-2 text-center">
                      <strong>{tiempo}</strong> minutos
                    </div>
                  ))}
                </div>

                {/* Tercera columna de tareas (6-10) */}
                <div className="col-md-2">
                  {tareas.slice(5, 10).map((tarea, index) => (
                    <p key={index + 5}>
                      {index + 6}. {tarea}
                    </p>
                  ))}
                </div>

                {/* Cuarta columna de tiempos (6-10) */}
                <div className="col-md-2">
                  {tiempos.slice(5, 10).map((tiempo, index) => (
                    <div key={index} className="border p-2 text-center">
                      <strong>{tiempo}</strong> minutos
                    </div>
                  ))}
                </div>

                {/* Quinta columna de tareas (11-13) */}
                <div className="col-md-2">
                  {tareas.slice(10, 13).map((tarea, index) => (
                    <p key={index + 10}>
                      {index + 11}. {tarea}
                    </p>
                  ))}
                </div>

                {/* Sexta columna de tiempos (11-13) */}
                <div className="col-md-2">
                  {tiempos.slice(10, 13).map((tiempo, index) => (
                    <div key={index} className="border p-2 text-center">
                      <strong>{tiempo}</strong> minutos
                    </div>
                  ))}
                </div>
              </div>

              {/* Tiempo total al final */}
              <div className="row mt-4">
                <div className="col text-right">
                  <h4>Tiempo total: {tiempoTotal} minutos</h4>
                </div>
              </div>
            </div>

            <hr
              style={{
                width: "100%",
                margin: "20px 0",
                border: "none",
                height: "2px", // Ajusta el grosor de la línea
                backgroundColor: "black", // Color negro
              }}
            />
          </div>
          <div>
              <Row>
                {/* Fecha y hora estimada de terminación */}
                <Col md={6}>
                  <FormGroup>
                    <div className="d-flex align-items-center">
                      <label style={{ fontSize: "15px", paddingRight: "10px" }}>
                        Fecha y hora estimada de terminación
                      </label>
                      {/* Campo para seleccionar la fecha */}
                      <Input
                        type="date"
                        name="fechafinal"
                        value={form.fechafinal}
                        onChange={handleChange}
                        className={`form-control me-2 ${
                          formErrors.fechafinal ? "is-invalid" : ""
                        }`}
                        style={{ width: "50%" }}
                      />
                      {/* Campo para ingresar la hora */}
                      <Input
                        type="time"
                        name="horafinal"
                        value={form.horafinal}
                        onChange={handleChange}
                        className={`form-control ms-2 ${
                          formErrors.horafinal ? "is-invalid" : ""
                        }`}
                        style={{ width: "50%" }}
                      />
                    </div>
                    {formErrors.fechafinal && (
                      <div className="invalid-feedback">
                        Este campo es obligatorio.
                      </div>
                    )}
                    {formErrors.horafinal && (
                      <div className="invalid-feedback">
                        Este campo es obligatorio.
                      </div>
                    )}
                  </FormGroup>
                </Col>
                

              {/* Estado con campo desplegable */}
              <Col md={6}>
                <FormGroup>
                  <div className="d-flex align-items-center">
                    <label style={{ fontSize: "15px", paddingRight: "10px" }}>
                      Estado
                    </label>
                    <Input
                      type="select"
                      name="estado"
                      value={form.estado}
                      onChange={handleChange}
                      className={`form-control ms-2 ${
                        formErrors.estado ? "is-invalid" : ""
                      }`}
                      style={{ width: "50%" }}
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="por_iniciar">Por iniciar</option>
                      <option value="en_produccion">En producción</option>
                      <option value="en_pausa">En pausa</option>
                      <option value="terminado">Terminado</option>
                      <option value="cancelado">Cancelado</option>
                    </Input>
                  </div>
                  {formErrors.estado && (
                    <div className="invalid-feedback">{formErrors.estado}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>
          </div>
          {/* Observaciones */}
          <Col md={6}>
  <FormGroup style={{ display: "flex", alignItems: "flex-start" }}>
    <label
      style={{ fontSize: "15px", paddingRight: "10px", whiteSpace: "nowrap" }}
    >
      Observaciones
    </label>
    <textarea
      className="form-control"
      rows="3"
      name="observaciones"
      value={form.observaciones}
      onChange={handleChange}
      style={{ flexGrow: 1 }}
    />
  </FormGroup>
</Col>

  {/* Fecha y hora estimada de terminación */}
  <Col md={6}>
    {/* ... Resto del código existente ... */}
  </Col>

          <div className="d-flex justify-content-star mt-3">
            <Button style={{ background: "#2e8322" }} onClick={handleSubmit}>
              {isEditing ? "Actualizar" : "Agregar"}
            </Button>

            <Button
              style={{ background: "#6d0f0f" }}
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Editar Usuario
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Tipo Documento</label>
                <Input
                  type="text"
                  name="TipoDocumento"
                  readOnly
                  value={form.TipoDocumento}
                  placeholder="Tipo Documento del usuario"
                  className={`form-control ${
                    formErrors.TipoDocumento ? "is-invalid" : ""
                  }`}
                />
                {formErrors.TipoDocumento && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Documento</label>
                <Input
                  type="text"
                  name="Documento"
                  readOnly
                  value={form.Documento}
                  placeholder="Número de documento"
                  className={`form-control ${
                    formErrors.Documento ? "is-invalid" : ""
                  }`}
                />
                {formErrors.Documento && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Celular</label>
                <Input
                  type="text" // Corrige el typo "te" a "text"
                  name="Celular"
                  value={form.Celular}
                  onChange={handleChange}
                  placeholder="Número de contacto"
                  className={`form-control ${
                    formErrors.Celular ? "is-invalid" : ""
                  }`}
                />
                {formErrors.Celular && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Nombre Completo
                </label>
                <Input
                  type="text"
                  name="NombreCompleto"
                  value={form.NombreCompleto}
                  onChange={handleChange}
                  placeholder="Nombre Completo"
                  className={`form-control ${
                    formErrors.NombreCompleto ? "is-invalid" : ""
                  }`}
                />
                {formErrors.NombreCompleto && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Correo
                </label>
                <Input
                  type="email" // Cambiado a "email" para validación automática del formato
                  name="Correo"
                  value={form.Correo}
                  onChange={handleChange}
                  placeholder="Correo Electrónico"
                  className={`form-control ${
                    formErrors.Correo ? "is-invalid" : ""
                  }`}
                />
                {formErrors.Correo && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>Rol</label>
                <Input
                  type="text"
                  name="Rol"
                  value={form.Rol}
                  readOnly
                  placeholder="Rol del usuario"
                  className={`form-control ${
                    formErrors.Rol ? "is-invalid" : ""
                  }`}
                />
                {formErrors.Rol && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={editar}>
            Actualizar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Produccion;
