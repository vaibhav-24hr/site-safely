import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, ArrowLeft, Camera, X } from "lucide-react";
import api from "../services/api";
import "./SafetyForm.css";

const CHECKLIST_ITEMS = [
  { id: "ppe_hard_hat", label: "PPE: Hard Hat Worn" },
  { id: "ppe_vest", label: "PPE: High-Vis Vest Worn" },
  { id: "ppe_boots", label: "PPE: Steel-toe Boots Worn" },
  { id: "ppe_eye_protection", label: "PPE: Eye Protection Worn" },
  { id: "fall_protection", label: "Fall Protection in place" },
  { id: "ladders_scaffolding", label: "Ladders & Scaffolding secure" },
  { id: "tools_cords", label: "Tools & Electrical Cords safe" },
  { id: "hazards_identified", label: "Site free of undocumented hazards" },
];

const SafetyForm = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    const urls = selectedPhotos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedPhotos]);

  const [formData, setFormData] = useState({
    site_id: "",
    notes: "",
    checklist: CHECKLIST_ITEMS.reduce((acc, item) => {
      acc[item.id] = true; // Default to safe/true
      return acc;
    }, {}),
  });

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await api.get("/sites");
        setSites(response.data.sites.filter((s) => s.active));
      } catch (err) {
        console.error("Failed to load active job sites", err);
        setError("Failed to load active job sites.");
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, []);

  const handleToggle = (id) => {
    setFormData((prev) => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [id]: !prev.checklist[id],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.site_id) {
      setError("Please select a job site.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formPayload = new FormData();
      formPayload.append("site_id", formData.site_id);
      formPayload.append("notes", formData.notes);

      Object.entries(formData.checklist).forEach(([key, value]) => {
        formPayload.append(key, value);
      });

      selectedPhotos.forEach((photo) => {
        formPayload.append("photos", photo);
      });

      const response = await api.post("/submissions", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/submissions/${response.data.id}`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "An error occurred while submitting the form.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="container"
      style={{ padding: "2rem 1rem", maxWidth: "800px" }}
    >
      <button
        onClick={() => navigate("/")}
        className="btn"
        style={{
          padding: "0",
          background: "none",
          color: "var(--color-ras-dark)",
          marginBottom: "1rem",
          display: "flex",
          gap: "0.5rem",
          fontWeight: 500,
        }}
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="card">
        <h1 style={{ margin: "0 0 1.5rem", color: "var(--color-ras-black)" }}>
          Daily Safety Assessment
        </h1>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Site Selection */}
          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label" htmlFor="site_id">
              Job Site *
            </label>
            {loadingSites ? (
              <div>Loading sites...</div>
            ) : (
              <select
                id="site_id"
                className="form-input"
                value={formData.site_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, site_id: e.target.value }))
                }
                required
              >
                <option value="">-- Select a Site --</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Checklist */}
          <div style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                margin: "0 0 1rem",
                color: "var(--color-ras-dark)",
                fontSize: "1.1rem",
              }}
            >
              Safety Checklist
            </h3>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              Verify each item. Toggle off if there is a hazard or
              non-compliance.
            </p>

            <div className="checklist-container">
              {CHECKLIST_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`checklist-item ${formData.checklist[item.id] ? "is-safe" : "is-hazard"}`}
                >
                  <span className="checklist-label">{item.label}</span>
                  <button
                    type="button"
                    className="toggle-button"
                    onClick={() => handleToggle(item.id)}
                  >
                    {formData.checklist[item.id] ? (
                      <span className="toggle-safe">
                        <CheckCircle size={18} /> Safe
                      </span>
                    ) : (
                      <span className="toggle-hazard">
                        <AlertCircle size={18} /> Hazard
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                margin: "0 0 1rem",
                color: "var(--color-ras-dark)",
                fontSize: "1.1rem",
              }}
            >
              Attach Photos
            </h3>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              Take photos of the site or specific hazards (Max 5 photos).
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {photoPreviews.map((previewUrl, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    width: "100px",
                    height: "100px",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotos((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {selectedPhotos.length < 5 && (
                <label
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    width: "100px",
                    height: "100px",
                    borderRadius: "var(--radius-md)",
                    border: "2px dashed #cbd5e1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    cursor: "pointer",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <Camera size={24} style={{ marginBottom: "0.5rem" }} />
                  <span style={{ fontSize: "0.75rem" }}>Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    aria-label="Upload site photos"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (selectedPhotos.length + files.length > 5) {
                        setError("You can only upload up to 5 photos.");
                        return;
                      }
                      setSelectedPhotos((prev) => [...prev, ...files]);
                    }}
                    style={{ opacity: 0, position: "absolute", width: "100%", height: "100%", cursor: "pointer" }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label" htmlFor="notes">
              Notes / Hazard Details
            </label>
            <textarea
              id="notes"
              className="form-input"
              rows="4"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="If you reported any hazards, please explain them here..."
            ></textarea>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
            disabled={submitting}
          >
            {submitting ? "Submitting Form..." : "Submit Assessment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SafetyForm;
