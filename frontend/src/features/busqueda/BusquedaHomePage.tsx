import { Link } from "react-router-dom";

export function BusquedaHomePage() {
  return (
    <div>
      <h1 className="page-title">Busqueda</h1>
      <div className="d-flex gap-3 flex-wrap">
        <Link to="/busqueda/alumno" className="btn btn-brand btn-lg">
          Extraescolares cursados por un alumno
        </Link>
        <Link to="/gestionar-alumnos-grupo" className="btn btn-brand btn-lg">
          Alumnos inscritos en un grupo
        </Link>
      </div>
    </div>
  );
}
