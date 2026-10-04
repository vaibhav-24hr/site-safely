import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  MapPin,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [missingWorkers, setMissingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sites, setSites] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Build query params
      const params = new URLSearchParams();
      if (dateFilter) params.append("date", dateFilter);
      if (siteFilter) params.append("site_id", siteFilter);
      const query = params.toString() ? `?${params.toString()}` : "";

      // Run fetches in parallel
      const [summaryRes, subsRes, missingRes, sitesRes] = await Promise.all([
        api.get("/admin/summary"),
        api.get(`/admin/submissions${query}`),
        api.get("/admin/missing-workers"),
        api.get("/sites"), // get active sites for the dropdown
      ]);

      setSummary(summaryRes.data);
      setSubmissions(subsRes.data.submissions || []);
      setMissingWorkers(missingRes.data || []);
      setSites(sitesRes.data.sites || []);
    } catch (err) {
      setError("Failed to load dashboard data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, siteFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Refetch when filters change

  const filteredSubmissions = submissions.filter((sub) => {
    if (workerFilter && sub.worker?.id !== workerFilter && sub.user_id !== workerFilter) return false;
    if (statusFilter === "safe" && !sub.all_safe) return false;
    if (statusFilter === "hazards" && sub.all_safe) return false;
    return true;
  });

  const uniqueWorkers = [...new Map(submissions.map(item => [item.user_id || item.worker?.id, {id: item.user_id || item.worker?.id, name: item.worker?.full_name || item.worker_name}])).values()].filter(w => w.name);

  const safeCount = filteredSubmissions.filter(s => s.all_safe).length;
  const hazardsCount = filteredSubmissions.length - safeCount;
  const chartData = {
    labels: ['Safe', 'Hazards'],
    datasets: [
      {
        data: [safeCount, hazardsCount],
        backgroundColor: ['#10b981', '#f0523d'],
        borderWidth: 0,
      },
    ],
  };

  if (loading && !summary) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "2rem 1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ color: "var(--color-ras-black)", margin: 0 }}>
          Admin Dashboard
        </h1>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {/* Summary Cards */}
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#e0f2fe",
                padding: "1rem",
                borderRadius: "var(--radius-full)",
              }}
            >
              <FileText size={24} color="#0284c7" />
            </div>
            <div>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
                Today's Submissions
              </p>
              <h2 style={{ margin: 0, color: "var(--color-ras-black)" }}>
                {summary.todays_submissions}
              </h2>
            </div>
          </div>
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#dcfce7",
                padding: "1rem",
                borderRadius: "var(--radius-full)",
              }}
            >
              <MapPin size={24} color="var(--color-ras-green-emerald)" />
            </div>
            <div>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
                Active Sites
              </p>
              <h2 style={{ margin: 0, color: "var(--color-ras-black)" }}>
                {summary.active_sites}
              </h2>
            </div>
          </div>
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#fef3c7",
                padding: "1rem",
                borderRadius: "var(--radius-full)",
              }}
            >
              <Users size={24} color="var(--color-ras-amber)" />
            </div>
            <div>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
                Total Workers
              </p>
              <h2 style={{ margin: 0, color: "var(--color-ras-black)" }}>
                {summary.total_workers}
              </h2>
            </div>
          </div>
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#fee2e2",
                padding: "1rem",
                borderRadius: "var(--radius-full)",
              }}
            >
              <AlertTriangle size={24} color="var(--color-ras-orange)" />
            </div>
            <div>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
                Missing Forms Today
              </p>
              <h2 style={{ margin: 0, color: "var(--color-ras-black)" }}>
                {summary.missing_workers}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Missing Workers Section */}
      {missingWorkers.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: "2rem",
            border: "1px solid #fecaca",
            backgroundColor: "#fff5f5",
          }}
        >
          <h2
            style={{
              margin: "0 0 1rem",
              color: "#b91c1c",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertTriangle size={20} /> Workers Missing Forms Today
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {missingWorkers.map((siteGroup) => (
              <div
                key={siteGroup.site_id}
                style={{
                  backgroundColor: "white",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 0.5rem",
                    color: "var(--color-ras-dark)",
                  }}
                >
                  {siteGroup.site_name}
                </h4>
                <ul
                  style={{ margin: 0, paddingLeft: "1.5rem", color: "#6b7280" }}
                >
                  {siteGroup.missing.map((user) => (
                    <li key={user.id}>
                      {user.full_name} ({user.email})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions Section */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ margin: 0, color: "var(--color-ras-black)" }}>
            Recent Submissions
          </h2>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <select
              className="form-input"
              style={{ width: "auto" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="safe">Safe Only</option>
              <option value="hazards">Hazards Only</option>
            </select>
            <select
              className="form-input"
              style={{ width: "auto" }}
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
            >
              <option value="">All Workers</option>
              {uniqueWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ width: "auto" }}
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
            >
              <option value="">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="form-input"
              style={{ width: "auto" }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {filteredSubmissions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', height: '200px' }}>
            <Pie 
              data={chartData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' }
                }
              }} 
            />
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e5e7eb",
                  color: "#6b7280",
                  fontSize: "0.875rem",
                }}
              >
                <th style={{ padding: "0.75rem 1rem" }}>Date & Time</th>
                <th style={{ padding: "0.75rem 1rem" }}>Worker</th>
                <th style={{ padding: "0.75rem 1rem" }}>Site</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "#6b7280",
                    }}
                  >
                    No submissions found for these filters.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9fafb")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                    onClick={() => navigate(`/submissions/${sub.id}`)}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          color: "var(--color-ras-black)",
                          fontWeight: 500,
                        }}
                      >
                        {sub.submission_date
                          ? new Date(sub.submission_date + 'T00:00:00').toLocaleDateString()
                          : new Date(sub.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                        {new Date(sub.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--color-ras-dark)",
                      }}
                    >
                      {sub.worker_name || "Unknown"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--color-ras-dark)",
                      }}
                    >
                      {sub.site_name || "Unknown Site"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {sub.all_safe ? (
                        <span
                          style={{
                            color: "var(--color-ras-green-emerald)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          <CheckCircle size={16} /> Safe
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "var(--color-ras-orange)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          <AlertCircle size={16} /> Hazards
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
