import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div
      className="container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        textAlign: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#fef2f2",
          padding: "2rem",
          borderRadius: "50%",
          marginBottom: "2rem",
        }}
      >
        <AlertTriangle size={64} color="var(--color-ras-orange)" />
      </div>
      <h1
        style={{
          fontSize: "3rem",
          margin: "0 0 1rem",
          color: "var(--color-ras-black)",
        }}
      >
        404
      </h1>
      <h2 style={{ margin: "0 0 1rem", color: "var(--color-ras-dark)" }}>
        Page Not Found
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "2rem", maxWidth: "400px" }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="btn btn-primary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          textDecoration: "none",
        }}
      >
        <Home size={20} /> Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
