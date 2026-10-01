import { NavLink, useLocation } from "react-router-dom";

const CATALOGOS = [
  { to: "/carreras", label: "Carreras" },
  { to: "/promotores", label: "Promotores" },
  { to: "/semestres", label: "Semestres" },
  { to: "/extraescolares", label: "Extraescolares" },
];

const OPERACION = [
  { to: "/alumnos", label: "Alumnos" },
  { to: "/grupos", label: "Grupos" },
];

function itemClase({ isActive }: { isActive: boolean }): string {
  return `nav-link${isActive ? " active fw-semibold" : ""}`;
}

function itemDropdownClase({ isActive }: { isActive: boolean }): string {
  return `dropdown-item${isActive ? " active" : ""}`;
}

export function Navbar() {
  const location = useLocation();
  const enCatalogos = CATALOGOS.some((link) => location.pathname.startsWith(link.to));
  const enOperacion = OPERACION.some((link) => location.pathname.startsWith(link.to));

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-danger">
      <div className="container-fluid">
        <NavLink className="navbar-brand fw-semibold" to="/">
          <img src="/itcj-logo.png" alt="ITCJ" height={32} className="me-2" />
          Extraescolares
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Alternar navegacion"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink to="/" end className={itemClase}>
                Inicio
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle${enCatalogos ? " active fw-semibold" : ""}`}
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Catalogos
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                {CATALOGOS.map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} className={itemDropdownClase}>
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle${enOperacion ? " active fw-semibold" : ""}`}
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Operacion
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                {OPERACION.map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} className={itemDropdownClase}>
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
            <li className="nav-item">
              <NavLink to="/busqueda" className={itemClase}>
                Busqueda
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
