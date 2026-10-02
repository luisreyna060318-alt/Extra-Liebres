import { useEffect, useRef, useState } from "react";
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

type Menu = "catalogos" | "operacion";

function itemClase({ isActive }: { isActive: boolean }): string {
  return `nav-link${isActive ? " active" : ""}`;
}

function itemDropdownClase({ isActive }: { isActive: boolean }): string {
  return `dropdown-item${isActive ? " active" : ""}`;
}

/**
 * Barra de navegacion controlada por React (sin el JavaScript de Bootstrap):
 * el menu movil y los desplegables se cierran al navegar, al hacer clic
 * fuera y con Escape.
 */
export function Navbar() {
  const location = useLocation();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [desplegable, setDesplegable] = useState<Menu | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const enCatalogos = CATALOGOS.some((link) => location.pathname.startsWith(link.to));
  const enOperacion = OPERACION.some((link) => location.pathname.startsWith(link.to));

  useEffect(() => {
    setMenuMovilAbierto(false);
    setDesplegable(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!desplegable && !menuMovilAbierto) return;
    function alHacerClic(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setDesplegable(null);
        setMenuMovilAbierto(false);
      }
    }
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setDesplegable(null);
    }
    document.addEventListener("mousedown", alHacerClic);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alHacerClic);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [desplegable, menuMovilAbierto]);

  function renderDesplegable(menu: Menu, titulo: string, activo: boolean, links: typeof CATALOGOS) {
    const abierto = desplegable === menu;
    const idMenu = `menu-${menu}`;
    return (
      <li className="nav-item dropdown">
        <button
          type="button"
          className={`nav-link dropdown-toggle${activo ? " active" : ""}${abierto ? " show" : ""}`}
          aria-expanded={abierto}
          aria-controls={idMenu}
          onClick={() => setDesplegable(abierto ? null : menu)}
        >
          {titulo}
        </button>
        <ul
          id={idMenu}
          className={`dropdown-menu dropdown-menu-end${abierto ? " show" : ""}`}
          data-bs-popper="static"
        >
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={itemDropdownClase}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-danger navbar-itcj" ref={navRef}>
      <div className="container-fluid">
        <NavLink className="navbar-brand fw-semibold" to="/">
          <img src="/itcj-logo.png" alt="ITCJ" height={32} className="me-2" />
          Extraescolares
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={menuMovilAbierto}
          aria-label="Alternar navegacion"
          onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse${menuMovilAbierto ? " show" : ""}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink to="/" end className={itemClase}>
                Inicio
              </NavLink>
            </li>
            {renderDesplegable("catalogos", "Catalogos", enCatalogos, CATALOGOS)}
            {renderDesplegable("operacion", "Operacion", enOperacion, OPERACION)}
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
