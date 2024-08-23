import { useState } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const users = [
  {
    id: 1,
    usuario: "Carla Gomez",
    contrasena: "12345", // Convertido a string para comparación
    rol: "auxiliar de cocina"
  },
  {
    id: 2,
    usuario: "Luis gutierrez",
    contrasena: "12345", // Convertido a string para comparación
    rol: "administrador"
  },
];

const logins = (username, password) => {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < users.length; i++) {
      if (username === users[i].usuario && password === users[i].contrasena) {
        resolve("Usuario y contraseña correctos. Ha iniciado sesión correctamente");
        return;
      }
    }
    reject("Usuario y contraseña incorrectos o usuario inactivo");
  });
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Estado para manejar el mensaje de error
  const navigate = useNavigate(); // Hook para redirección

  const handleSubmit = (event) => {
    event.preventDefault(); // Evita el envío del formulario y la recarga de la página

    logins(username, password)
      .then((message) => {
        setError(""); // Limpia el mensaje de error en caso de éxito
        navigate('/dashboard'); // Redirige a la página de inicio en caso de éxito
      })
      .catch((message) => {
        setError(message); // Establece el mensaje de error
      });
  };

  return (
    <div className="row h-100 w-100">
      <div className="col-sm-12 col-md-6">
        <div className="d-flex justify-content-center align-items-center h-100">
          <form className='border border-black p-5' onSubmit={handleSubmit}>
            <img src="../src/assets/logo.jpg" alt="logo" style={{ width: 100, height: 100 }} className="logo img-fluid mb-4" />
            <div className="form-group">
              <i className="fa fa-user fa-lg" aria-hidden="true"></i>
              <label htmlFor="username" className='form-label'>Usuario</label>
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="correo@micorreo.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className='form-label'>Contraseña</label>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Ingrese la contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="text-danger mb-3">{error}</div>} {/* Mostrar el mensaje de error */}
            <div className='my-3'>
              <a href="#">Recuperar contraseña</a>
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                Ingresar
              </button>
            </div>
          </form>
        </div>
      </div>
      <article className="col-sm-12 col-md-6">
        <div className="d-flex justify-content-center align-items-center h-100">
          <img src="../src/assets/login.jpg" alt="food-in-production" width="800" height="800" />
        </div>
      </article>
    </div>
  );
}
