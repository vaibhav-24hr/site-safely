import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ color: 'var(--color-ras-orange)', marginBottom: '1rem' }}>Unauthorized Access</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--color-ras-dark)' }}>You do not have permission to view this page.</p>
      <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
        Return Home
      </Link>
    </div>
  );
};

export default Unauthorized;
