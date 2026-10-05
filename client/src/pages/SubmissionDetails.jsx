import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Save,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CHECKLIST_FIELDS = [
  { id: "ppe_hard_hat", label: "Hard Hat" },
  { id: "ppe_vest", label: "High-Vis Vest" },
  { id: "ppe_boots", label: "Steel-toe Boots" },
  { id: "ppe_eye_protection", label: "Eye Protection" },
  { id: "fall_protection", label: "Fall Protection" },
  { id: "ladders_scaffolding", label: "Ladders & Scaffolding" },
  { id: "tools_cords", label: "Tools & Cords" },
  { id: "hazards_identified", label: "No Undocumented Hazards" },
];

const SubmissionDetails = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  const endpoint =
    role === "admin" ? `/admin/submissions/${id}` : `/submissions/${id}`;

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await api.get(endpoint);
        setSubmission(response.data);
      } catch (err) {
        console.error("Failed to load submission details", err);
        setError("Failed to load submission details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id, role, endpoint]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this submission? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(endpoint);
      navigate(role === "admin" ? "/dashboard" : "/");
    } catch (err) {
      console.error("Failed to delete submission", err);
      alert("Failed to delete submission");
    }
  };

  const handleEditToggle = () => {
    if (!isEditing && submission) {
      const initialEditData = { notes: submission.notes || "" };
      CHECKLIST_FIELDS.forEach((f) => {
        initialEditData[f.id] = submission[f.id];
      });
      setEditData(initialEditData);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const response = await api.put(endpoint, editData);
      setSubmission((prev) => ({
        ...prev,
        ...response.data,
        all_safe: Object.values(editData)
          .filter((v) => typeof v === "boolean")
          .every((v) => v === true),
      }));
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save changes", err);
      alert("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !submission)
    return (
      <div className="container" style={{ padding: "2rem" }}>
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="container" style={{ padding: "2rem", color: "#b91c1c" }}>
        {error}
      </div>
    );
  if (!submission)
    return (
      <div className="container" style={{ padding: "2rem" }}>
        Submission not found.
      </div>
    );

  return (
    <div
      className="container"
      style={{ padding: "2rem 1rem", maxWidth: "800px" }}
    >
      <Link
        to={role === "admin" ? "/dashboard" : "/"}
        className="btn"
        style={{
          padding: "0",
          background: "none",
          color: "var(--color-ras-dark)",
          marginBottom: "1rem",
          display: "flex",
          gap: "0.5rem",
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={20} /> Back
      </Link>

      <div className="card">
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h1
                style={{
                  margin: "0 0 0.5rem",
                  color: "var(--color-ras-black)",
                }}
              >
                {submission.site ? submission.site.name : "Unknown Site"}
              </h1>
              <p style={{ color: "#6b7280", margin: 0 }}>
                Submitted by{" "}
                {submission.worker || submission.user
                  ? (submission.worker || submission.user).full_name
                  : "Unknown"}
              </p>
              <p
                style={{
                  color: "#6b7280",
                  margin: "0.25rem 0 0",
                  fontSize: "0.875rem",
                }}
              >
                {new Date(submission.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}
              </p>
            </div>
            <div>
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="btn"
                    style={{
                      padding: "0.5rem",
                      background: "#f3f4f6",
                      color: "#374151",
                      marginRight: "0.5rem",
                    }}
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn"
                    style={{
                      padding: "0.5rem",
                      background: "#fef2f2",
                      color: "#dc2626",
                    }}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="btn"
                    style={{
                      padding: "0.5rem",
                      background: "#f3f4f6",
                      color: "#374151",
                      marginRight: "0.5rem",
                    }}
                    title="Cancel"
                  >
                    <X size={18} /> Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="btn btn-primary"
                    style={{ padding: "0.5rem 1rem" }}
                    title="Save"
                  >
                    <Save size={18} /> Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ margin: 0, color: "var(--color-ras-dark)" }}>
              Checklist Results
            </h3>
            {!isEditing && (
              <span
                style={{
                  backgroundColor: submission.all_safe
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(240, 82, 61, 0.1)",
                  color: submission.all_safe
                    ? "var(--color-ras-green-emerald)"
                    : "var(--color-ras-orange)",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                {submission.all_safe ? (
                  <>
                    <CheckCircle size={16} /> All Safe
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} /> Hazards Found
                  </>
                )}
              </span>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {CHECKLIST_FIELDS.map((field) => {
              const isSafe = isEditing
                ? editData[field.id]
                : submission[field.id];
              return (
                <div
                  key={field.id}
                  onClick={() =>
                    isEditing &&
                    setEditData((p) => ({ ...p, [field.id]: !p[field.id] }))
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    backgroundColor: isSafe ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${isSafe ? "#bbf7d0" : "#fecaca"}`,
                    borderRadius: "var(--radius-md)",
                    cursor: isEditing ? "pointer" : "default",
                    opacity: isEditing ? 0.9 : 1,
                  }}
                >
                  {isSafe ? (
                    <CheckCircle
                      size={20}
                      style={{ color: "var(--color-ras-green-emerald)" }}
                    />
                  ) : (
                    <AlertCircle
                      size={20}
                      style={{ color: "var(--color-ras-orange)" }}
                    />
                  )}
                  <span
                    style={{
                      fontWeight: 500,
                      color: "var(--color-ras-dark)",
                      flex: 1,
                    }}
                  >
                    {field.label}
                  </span>
                  {isEditing && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: isSafe
                          ? "var(--color-ras-green-emerald)"
                          : "var(--color-ras-orange)",
                      }}
                    >
                      {isSafe ? "Safe" : "Hazard"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {(submission.notes || isEditing) && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ margin: "0 0 1rem", color: "var(--color-ras-dark)" }}>
              Notes & Hazard Details
            </h3>
            {isEditing ? (
              <textarea
                className="form-input"
                rows="4"
                value={editData.notes || ""}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Update notes or hazard details..."
              />
            ) : (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid #e5e7eb",
                  whiteSpace: "pre-wrap",
                  color: "var(--color-ras-dark)",
                }}
              >
                {submission.notes}
              </div>
            )}
          </div>
        )}

        {/* Photos placeholder */}
        <div>
          <h3 style={{ margin: "0 0 1rem", color: "var(--color-ras-dark)" }}>
            Photos
          </h3>
          {submission.photos && submission.photos.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "1rem",
              }}
            >
              {submission.photos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block" }}
                >
                  <img
                    src={photo.url}
                    alt="Safety Form Evidence"
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid #e5e7eb",
                      transition: "transform 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  />
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: "#6b7280", fontStyle: "italic" }}>
              No photos attached to this submission.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetails;
