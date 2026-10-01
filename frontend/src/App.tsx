import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AlumnosPage } from "./features/alumnos/AlumnosPage";
import { AlumnosGrupoPage } from "./features/alumnosGrupo/AlumnosGrupoPage";
import { BusquedaAlumnoPage } from "./features/busqueda/BusquedaAlumnoPage";
import { BusquedaHomePage } from "./features/busqueda/BusquedaHomePage";
import { CarrerasPage } from "./features/carreras/CarrerasPage";
import { ExtraescolaresPage } from "./features/extraescolares/ExtraescolaresPage";
import { GruposPage } from "./features/grupos/GruposPage";
import { HomePage } from "./features/home/HomePage";
import { PromotoresPage } from "./features/promotores/PromotoresPage";
import { SemestresPage } from "./features/semestres/SemestresPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="alumnos" element={<AlumnosPage />} />
        <Route path="carreras" element={<CarrerasPage />} />
        <Route path="promotores" element={<PromotoresPage />} />
        <Route path="semestres" element={<SemestresPage />} />
        <Route path="extraescolares" element={<ExtraescolaresPage />} />
        <Route path="grupos" element={<GruposPage />} />
        <Route path="busqueda" element={<BusquedaHomePage />} />
        <Route path="busqueda/alumno" element={<BusquedaAlumnoPage />} />
        <Route path="gestionar-alumnos-grupo" element={<AlumnosGrupoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
