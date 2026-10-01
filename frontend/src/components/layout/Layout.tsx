import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container-fluid flex-grow-1 py-4">
        <Outlet />
      </main>
    </div>
  );
}
