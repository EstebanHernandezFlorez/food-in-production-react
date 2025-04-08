import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';
import { Select } from 'antd';



const initialData = [
  {id: 1,HorayFechaInicial: "07:05 am 04/09/2024", HorayFechaFinal: "08:00 am 05/09/2024", Producto: "Carne de hamburguesa", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 2,HorayFechaInicial: "08:05 am 04/09/2024", HorayFechaFinal: "09:00 am 05/09/2024", Producto: "Guacamole", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 3,HorayFechaInicial: "07:05 am 06/09/2024", HorayFechaFinal: "08:00 am 06/09/2024", Producto: "Postre", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 4,HorayFechaInicial: "07:05 am 07/09/2024", HorayFechaFinal: "08:00 am 07/09/2024", Producto: "Cañon", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 5,HorayFechaInicial: "07:05 am 08/09/2024", HorayFechaFinal: "08:00 am 09/09/2024", Producto: "Postre", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
  {id: 6,HorayFechaInicial: "07:05 am 10/09/2024", HorayFechaFinal: "08:00 am 10/09/2024", Producto: "Arroz", CantidadInicial: "10", CantidadFinal:"10", Estado:"", HorayFechadeEstado: "07:30am 04/09/2024"},
];
   