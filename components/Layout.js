import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar />

      {/* Konten utama */}
      <main className="content">
        {/* Navbar */}
        <Navbar />

        {/* Area Konten */}
        <section className="dashboard-content">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;