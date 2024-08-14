

export default function Login() {

  return (
    <div className="row h-100 w-100">
      <div className="col-sm-12 col-md-6">
        {/* agregar un div para centrar verticalmente y horizontalmente */}
        <div className="d-flex justify-content-center align-items-center h-100">
        <form className='border border-black p-5'>
          <div className="form-group">
            <label htmlFor="username" className='form-label' >Usuario</label>  
            <input
              type="text"
              className="form-control"
              id="username"
              placeholder="email@example.com" 
              />
          </div>
          <div className="form-group">
            <label htmlFor="password" className='form-label'>Contraseña</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Password"
              />
          </div>
          <div className='my-3'>

          <a href="">Recuperar contraseña</a>
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

        <img src="https://i.ibb.co/0YHn9yH/food-in-production.png" alt="food-in-production" border="0" width="600" height="600" />
      </div>
      </article>
    </div>
  )
}