import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User } from "lucide-react";
import "./Navbar.css";

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-brand">
          <img src="/ras-logo.png" alt="RAS Logo" className="navbar-logo" />
          <span className="navbar-title">Site Safety</span>
        </Link>

        <div className="navbar-actions">
          <div className="navbar-user">
            <User size={18} />
            <span className="navbar-role">
              {role === "admin" ? "Admin" : "Worker"}
            </span>
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Log Out">
            <LogOut size={18} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
