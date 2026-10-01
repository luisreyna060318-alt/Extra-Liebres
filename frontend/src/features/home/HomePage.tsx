import { Link } from "react-router-dom";
import { useAlumnos } from "../alumnos/hooks";
import { useCarreras } from "../carreras/hooks";
import { useExtraescolares } from "../extraescolares/hooks";
import { useGrupos } from "../grupos/hooks";
import { usePromotores } from "../promotores/hooks";
import { useSemestres } from "../semestres/hooks";

interface StatTileProps {
  titulo: string;
  valor: number | undefined;
  cargando: boolean;
}

function StatTile({ titulo, valor, cargando }: StatTileProps) {
  return (
    <div className="col-6 col-md-4 col-lg-2">
      <div className="card card-body text-center h-100">
        <span className="text-muted small">{titulo}</span>
        <span className="fs-4 fw-bold">{cargando ? "..." : valor}</span>
      </div>
    </div>
  );
}

interface AccionRapidaProps {
  to: string;
  titulo: string;
  descripcion: string;
}

function AccionRapida({ to, titulo, descripcion }: AccionRapidaProps) {
  return (
    <Link to={to} className="card card-body h-100 text-decoration-none text-reset accion-rapida">
      <span className="fw-semibold">{titulo}</span>
      <span className="text-muted small">{descripcion}</span>
    </Link>
  );
}

export function HomePage() {
  const alumnos = useAlumnos({}, 1, 1);
  const carreras = useCarreras("", 1, 1);
  const promotores = usePromotores("", 1, 1);
  const extraescolares = useExtraescolares("", 1, 1);
  const grupos = useGrupos({ page: 1, pageSize: 1 });
  const semestres = useSemestres("", 1, 1);

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <img src="/itcj-logo.png" alt="ITCJ" height={56} />
        <div>
          <h1 className="h3 mb-0">Actividades extraescolares</h1>
          <p className="text-muted mb-0">Panel general del sistema</p>
        </div>
      </div>

      <h2 className="h6 label-subrayado">Resumen</h2>
      <div className="row g-3 mb-4">
        <StatTile titulo="Alumnos" valor={alumnos.data?.total} cargando={alumnos.isLoading} />
        <StatTile titulo="Grupos" valor={grupos.data?.total} cargando={grupos.isLoading} />
        <StatTile titulo="Carreras" valor={carreras.data?.total} cargando={carreras.isLoading} />
        <StatTile
          titulo="Promotores"
          valor={promotores.data?.total}
          cargando={promotores.isLoading}
        />
        <StatTile
          titulo="Extraescolares"
          valor={extraescolares.data?.total}
          cargando={extraescolares.isLoading}
        />
        <StatTile titulo="Semestres" valor={semestres.data?.total} cargando={semestres.isLoading} />
      </div>

      <h2 className="h6 label-subrayado">Accesos rapidos</h2>
      <div className="row g-3">
        <div className="col-md-6 col-lg-3">
          <AccionRapida
            to="/alumnos"
            titulo="Registrar alumno"
            descripcion="Alta, edicion y busqueda de alumnos"
          />
        </div>
        <div className="col-md-6 col-lg-3">
          <AccionRapida
            to="/gestionar-alumnos-grupo"
            titulo="Gestionar inscripciones"
            descripcion="Inscribir o retirar alumnos de un grupo"
          />
        </div>
        <div className="col-md-6 col-lg-3">
          <AccionRapida
            to="/grupos"
            titulo="Ver grupos"
            descripcion="Grupos, horarios y roster por grupo"
          />
        </div>
        <div className="col-md-6 col-lg-3">
          <AccionRapida
            to="/busqueda"
            titulo="Buscar"
            descripcion="Historial de un alumno o alumnos de un grupo"
          />
        </div>
      </div>
    </div>
  );
}
