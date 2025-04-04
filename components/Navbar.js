"use client";

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="navbar">
      <button className="navbar-toggler" onClick={toggleSidebar}>
        ☰
      </button>
      <span>Starlink Money Web App</span>
    </nav>
  );
};

export default Navbar;
