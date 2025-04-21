import { Switch } from 'antd';
import React, {Component} from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
} from "react-router-dom";
import Employee from '../../views/module/employee/indexEmploye';
import Owner from '../../views/module/owner/owner';
import Roles from '../../views/module/roles/roles';

export default class NavbarComp extends Component{
  render(){
    return(
      <Router>
      <div>
      <Navbar bg="light" data-bs-theme="light">
        <Container>
          <Navbar.Brand href="#home">Navbar</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link as={Link} to={"/Employee"}>Employee</Nav.Link>
            <Nav.Link as={Link} to={"/Owner"}>Owner</Nav.Link>
            <Nav.Link as={Link} to={"/Roles"}>Roles</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      </div>
      <div>
        <Switch>
          <Route path="/Employee">
            <Employee/>
          </Route>
          <Route path="/Owner">
            <Owner/>
          </Route>
          <Route path="/Roles">
            <Roles/>
          </Route>
        </Switch>
      </div>
      </Router>

    )
  }
}