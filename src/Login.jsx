export default function Login() {

  return (
    <div className="row h-100 w-100">
      <div className="col-sm-12 col-md-6">  
        <div className="d-flex justify-content-center align-items-center h-100">
        <form className='border border-black p-5'>
              <img src="../src/assets/logo.jpg" alt="logo" style={{width: 100, height: 100}} className=" justify-content , logo img-fluid mb-4 just  "/>
              
          <div className="form-group">
              
              
            <i className="fa fa-user fa-lg" aria-hidden="true"></i>
            <label htmlFor="username" className='form-label'>Usuario</label>  
            <input
              type="text"
              className="form-control"
              id="username"
              placeholder="correo@micorreo.com" 
              />
          </div>
          <div className="form-group">
            <label htmlFor="password" className='form-label'>Contraseña</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Ingrese la contraseña"
              />
          </div>
          <div className='my-3'>

          <a href="">Recuperar contraseña</a>
          </div>
        <div className="btn-group">
          <button type="submit" className="btn btn-primary accordion ">
            Ingresar
          </button>
        </div>
        </form>
        </div>
      </div>
      <article className="col-sm-12 col-md-6">
      <div className="d-flex justify-content-center align-items-center h-100">

        <img src="../src/assets/login.jpg" alt="food-in-production" border="0" width="800" height="800" />
      </div>
      </article>
    </div>
  )
} 