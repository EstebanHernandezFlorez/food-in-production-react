import { useState } from "react";
import { useAuth } from "../../hooks/AuthProvider";

export default function Login() {

  const [input, setInput] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);

  const auth = useAuth();

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (input.email !== "" && input.password !== "") {
      auth.loginAction(input);
      return;
    }
    alert("pleae provide a valid input");
  };
  
    return (
      <div className="row h-150 w-150">
        <div className="col-sm-12 col-md-6 d-flex justify-content-center align-items-center">
          <div className="d-flex justify-content-center align-items-center h-100 w-100 ">
            <form
              className="p-5 border border-black border border-3"
              onSubmit={handleSubmitEvent}
            >
              <div className="d-flex justify-content-center">
                <img
                  src="../src/assets/logoFIP.png"
                  alt="logo"
                  style={{ width: 100, height: 100 }}
                  className="justify-content-center"
                />
              </div>
              <div className="form-group d-flex flex-column align-items-center">
                <label htmlFor="username" className="form-label">
                  <strong>Usuario</strong>
                </label>
                <div className="input-group mb-3 w-100 justify-content-center">
                  <div className="input-group-prepend"></div>
                  <input
                    type="email"
                    className="form-control border border-black border-2"
                    id="email"
                    placeholder="Ingrese el usuario"
                    value={input.email}
                    onChange={(e) => setInput({ ...input, email: e.target.value })}
                  />
                </div>
              </div>
  
              <div className="form-group d-flex flex-column align-items-center">
                <label htmlFor="password" className="form-label">
                  <strong>Contraseña</strong>
                </label>
  
                <div className="input-group mb-3 w-100 justify-content-center">
                  <div className="input-group-prepend"></div>
                  <input
                    type="password"
                    className="form-control border border-black border-2"
                    id="password"
                    placeholder="Ingrese la contraseña"
                    value={input.password}
                    onChange={(e) => setInput({ ...input, password: e.target.value })}
                  />
                </div>
              </div>
  
              {error && <div className="text-danger mb-3">{error}</div>}
              <div className="my-3 text-center link-text">
                <a href="#!">
                  {" "}
                  ¿Ha olvidado su contraseña?
                </a>
              </div>
              <div className="btn-group w-100">
                <button
                  type="submit"
                  className="btn w-100"
                  style={{ backgroundColor: "#8C1616", color: "white" }}
                >
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
  
        <article className="col-sm-12 col-md-6">
          <div className="d-flex justify-content-center align-items-center h-100">
            <img
              src="../src/assets/login.jpg"
              alt="food-in-production"
              width="790"
              height="734"
              className="rounded"
            />
          </div>
        </article>
      </div>
    );
  }