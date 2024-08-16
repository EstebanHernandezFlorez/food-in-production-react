import React from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, FormGroup, ModalFooter } from 'reactstrap'

const data =[
    {id:1, Nombre:"Carla Gomez", documento: 101761771, Cargo: "auxiliar de cocina"},
    {id:2, Nombre:"Luis gutierrez", documento: 11552828, Cargo: "auxiliar de cocina"},
    {id:3, Nombre:"Alex Vargas", documento: 15757361, Cargo: "jefe de cocina"},
    {id:4, Nombre:"Andrea Zapata Gomez", documento: 18916511, Cargo: "auxiliar de cocina"},
    {id:5, Nombre:"Maria Cordoba", documento: 12767627, Cargo: "auxiliar de cocina"}
]

class Index extends React.Component{
    state={
        data:data
    }
    render(){
        return(
            <>
            <Container>
                <br/>
                <Button color="primary">Insertar</Button>
                <br /><br />

                <Table>
                    <thead></thead>
                    <tbody></tbody>
                </Table>
            </Container>
            </>
        )
    }
}

export default Index