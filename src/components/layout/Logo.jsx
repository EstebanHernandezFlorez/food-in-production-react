import React from "react";
import backgroundLogo from '../../assets/logoFIP.png';
import 'bootstrap/dist/css/bootstrap.min.css';

const Logo = ({ collapsed, backgroundColor }) => { // Recibimos el color de fondo
    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{
            width: collapsed ? '80px' : '200px',
            textAlign: 'center',
            margin: 'auto',
            padding: '20px',
            backgroundColor: backgroundColor, // Usamos el color de fondo
            transition: 'width 0.3s',
        }}>
            <div
                style={{
                    backgroundImage: `url(${backgroundLogo})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    width: collapsed ? '40px' : '100px',
                    height: collapsed ? '40px' : '100px',
                    marginBottom: '8px',
                    transition: 'width 0.3s, height 0.3s',
                }}
            />

        </div>
    );
};

export default Logo;