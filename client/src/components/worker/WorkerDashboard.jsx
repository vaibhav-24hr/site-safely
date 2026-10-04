import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, AlertCircle } from "lucide-react";
import api from "../../services/api";

const WorkerDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await api.get("/submissions");
        setSubmissions(response.data.submissions || []);
      } catch (err) {
        console.error('Failed to load past submissions', err);
        setError('Failed to load past submissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  return (
    <div className="container" style={{ padding: "2rem 1rem" }}>
      <div
        className="flex justify-between items-center"
        style={{ marginBottom: "2rem" }}
      >
        <h1 style={{ color: "var(--color-ras-black)", margin: 0 }}>
          My Submissions
        </h1>
        <Link
          to="/submit"
          className="btn btn-primary flex items-center"
          style={{ gap: "0.5rem", textDecoration: "none" }}
        >
          <Plus size={20} />
          <span>New Form</span>
        </Link>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--color-ras-dark)",
          }}
        >
          Loading submissions...
        </div>
      ) : submissions.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "4rem 2rem" }}
        >
          <FileText
            size={48}
            style={{ color: "#9ca3af", margin: "0 auto 1rem" }}
          />
          <h3 style={{ margin: "0 0 0.5rem", color: "var(--color-ras-dark)" }}>
            No submissions yet
          </h3>
          <p style={{ color: "#6b7280", margin: "0 0 1.5rem" }}>
            You haven't submitted any safety forms.
          </p>
          <Link
            to="/submit"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            Start your first assessment
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {submissions.map((sub) => (
            <Link
              to={`/submissions/${sub.id}`}
              key={sub.id}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="card"
                style={{
                  padding: "1.5rem",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  className="flex justify-between items-center"
                  style={{ marginBottom: "0.5rem" }}
                >
                  <h3 style={{ margin: 0, color: "var(--color-ras-black)" }}>
                    {sub.site ? sub.site.name : "Unknown Site"}
                  </h3>
                  <span
                    style={{
                      backgroundColor: sub.all_safe
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(240, 82, 61, 0.1)",
                      color: sub.all_safe
                        ? "var(--color-ras-green-emerald)"
                        : "var(--color-ras-orange)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    {sub.all_safe ? "Safe" : "Hazards Found"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    color: "#6b7280",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>
                    {sub.submission_date
                      ? new Date(sub.submission_date + 'T00:00:00').toLocaleDateString()
                      : new Date(sub.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    {new Date(sub.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
