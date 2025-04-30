// Logo.jsx

import React from "react";
import backgroundLogo from '../../assets/logoFIP.png';
import '../../assets/css/logo.css'; // Importa el archivo CSS

const Logo = ({ collapsed, backgroundColor }) => {
    return (
        <div className={`logo-container d-flex flex-column align-items-center justify-content-center ${collapsed ? 'collapsed' : ''}`}>
            <div className="logo-image" style={{ backgroundImage: `url(${backgroundLogo})` }} />
        </div>
    );
};

export default Logo;