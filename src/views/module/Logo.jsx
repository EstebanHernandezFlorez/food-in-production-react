import React from "react";
import backgroundLogo from '../../assets/logoFIP.png';
import 'bootstrap/dist/css/bootstrap.min.css';

const Logo = ({ collapsed }) => {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{
            width: collapsed ? '80px' : '200px', // Ajusta el tamaño del contenedor según el estado del menú
            textAlign: 'center',
            margin: 'auto',
            padding: '20px',
            backgroundColor: 'black',
            transition: 'width 0.3s', // Transición suave para el cambio de tamaño
        }}>
            <div
                style={{
                    backgroundImage: `url(${backgroundLogo})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    width: collapsed ? '40px' : '70px', // Ajusta el tamaño del logo
                    height: collapsed ? '40px' : '70px', // Ajusta el tamaño del logo
                    marginBottom: '8px', // Espacio entre el logo y el texto
                    transition: 'width 0.3s, height 0.3s', // Transición suave para el cambio de tamaño del logo
                }}
            />
            {!collapsed && (
                <h1 className="m-0" style={{ fontSize: '20px' }}>Food in Production</h1>
            )}
        </div>
    );
};

export default Logo;
 