import { useNavigate } from "react-router-dom";
import { NavDropdown  } from "react-bootstrap";
import {
    UserOutlined,
  } from "@ant-design/icons";

export default function Redire() {
    const navigate = useNavigate();

    return (
        <div className="mt-3"  style={{ position: 'absolute ', right: '20px', }} >
                        <NavDropdown
                          title={
                            <span>
                              <UserOutlined
                                style={{ marginRight: '8px', fontSize: '20px' }}
                              />
                              Lina Marcela - Admin
                            </span>
                          }
                          id="nav-dropdown"
                        >
                          <NavDropdown.Item href="#action1" onClick={()=>navigate('/perfil')}>Perfil</NavDropdown.Item>
                          <NavDropdown.Item href="#action2">Cerrar Sesión</NavDropdown.Item>
                        </NavDropdown>
                      </div>
    );
}

