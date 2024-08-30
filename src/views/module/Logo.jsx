import React from "react";
import backgroundLogo from '../../assets/logoFIP.png';
import 'bootstrap/dist/css/bootstrap.min.css';

const Logo = () => {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{
            width: '200px', // Ajusta el tamaño del contenedor
            textAlign: 'center',
            margin: 'auto',
            padding:'20px',
            backgroundColor:'black'
        }}>
            <div
                style={{
                    backgroundImage: `url(${backgroundLogo})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    width: '70px', // Tamaño del logo
                    height: '70px', // Tamaño del logo
                    marginBottom: '8px' // Espacio entre el logo y el texto

                }}
            />
            <h1 className="m-0" style={{ fontSize: '20px' }}>Food in Production</h1>
        </div>
    );
};

export default Logo;
