import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

export default function HealthHistory() {
  const { user, token } = useAuth();
  const [records, setRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all"); // all, records, audit

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "DIAGNOSIS",
    condition: "",
    symptoms: "",
    treatmentPlan: "",
    severity: "Mild",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch("/api/patient/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setRecords(data.records || []);
          setAuditLogs(data.auditLogs || []);
        } else {
          setError(data.message || "Failed to load health history.");
        }
      } catch (err) {
        console.error("Error loading history:", err);
        setError("Unable to connect to health history service.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [token]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const contentObj = {
      condition: newEntry.condition,
      symptoms: newEntry.symptoms,
      treatmentPlan: newEntry.treatmentPlan,
      severity: newEntry.severity,
    };

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: newEntry.type,
          content: contentObj,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRecords([data.record, ...records]);
        setShowAddModal(false);
        setNewEntry({
          type: "DIAGNOSIS",
          condition: "",
          symptoms: "",
          treatmentPlan: "",
          severity: "Mild",
        });
      } else {
        alert(data.message || "Failed to add health record entry.");
      }
    } catch (err) {
      console.error("Create entry error:", err);
      alert("Error adding entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const parseRecordContent = (contentString) => {
    try {
      return JSON.parse(contentString);
    } catch {
      return { condition: "Medical Note", description: contentString };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link to="/" className="text-sm font-semibold text-blue-700 hover:underline">
              ← Back to Citizen Services
            </Link>
            <h1 className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">
              Longitudinal Health History
            </h1>
            <p className="text-sm text-gray-600">
              Chronological timeline of diagnoses, admissions, and cryptographic access audit logs.
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition cursor-pointer flex items-center gap-2"
            >
              <span>📋</span> Add Clinical Note
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setTab("all")}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition ${
              tab === "all"
                ? "border-blue-800 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All Timeline Events ({records.length + auditLogs.length})
          </button>
          <button
            onClick={() => setTab("records")}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition ${
              tab === "records"
                ? "border-blue-800 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Clinical Records ({records.length})
          </button>
          <button
            onClick={() => setTab("audit")}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition ${
              tab === "audit"
                ? "border-blue-800 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Access Audit Logs ({auditLogs.length})
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">Compiling longitudinal history...</p>
          </div>
        ) : !user ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-800">Please Sign In</p>
            <p className="mt-1 text-sm text-gray-600">
              Sign in to view your complete digital health record timeline.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-blue-800 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="relative border-l-2 border-blue-200 ml-4 sm:ml-6 pl-6 space-y-8">
              {/* Clinical Records */}
              {(tab === "all" || tab === "records") &&
                records.map((rec) => {
                  const content = parseRecordContent(rec.content);
                  return (
                    <div key={`rec-${rec.id}`} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[35px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-xs text-white shadow ring-4 ring-white">
                        {rec.type === "PRESCRIPTION"
                          ? "💊"
                          : rec.type === "LAB_REPORT"
                          ? "📄"
                          : "🩺"}
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-bold uppercase">
                              {rec.type.replace("_", " ")}
                            </span>
                            <h3 className="font-bold text-gray-900 text-base">
                              {content.condition || content.testName || content.diagnosis || "Clinical Record"}
                            </h3>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {new Date(rec.createdAt).toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="mt-3 text-xs text-gray-700 space-y-2 leading-relaxed">
                          {content.symptoms && (
                            <p>
                              <strong>Symptoms:</strong> {content.symptoms}
                            </p>
                          )}
                          {content.treatmentPlan && (
                            <p>
                              <strong>Treatment Plan:</strong> {content.treatmentPlan}
                            </p>
                          )}
                          {content.advice && (
                            <p>
                              <strong>Doctor Advice:</strong> {content.advice}
                            </p>
                          )}
                          {content.interpretation && (
                            <p>
                              <strong>Impression:</strong> {content.interpretation}
                            </p>
                          )}
                        </div>

                        {/* Audit Verification */}
                        <div className="mt-4 pt-3 border-t flex flex-wrap justify-between items-center text-[10px] text-gray-400 gap-2">
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <span>🛡️</span> Tamper-Evident Hash:{" "}
                            <span className="font-mono text-gray-600">
                              {rec.recordHash?.substring(0, 20)}...
                            </span>
                          </span>
                          <span>Attending Doctor: {rec.doctor?.user?.name || "Verified Hospital Specialist"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Audit Logs */}
              {(tab === "all" || tab === "audit") &&
                auditLogs.map((log) => (
                  <div key={`log-${log.id}`} className="relative group">
                    <div className="absolute -left-[35px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-600 text-xs text-white shadow ring-4 ring-white">
                      🔐
                    </div>

                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-4 shadow-sm text-xs">
                      <div className="flex justify-between items-center text-gray-500">
                        <span className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">
                          Audit Access Event #{log.id}
                        </span>
                        <span>
                          {new Date(log.timestamp).toLocaleDateString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-gray-900">{log.action}</p>
                      <p className="mt-0.5 text-gray-500 text-[11px]">
                        Authorized Access By: {log.accessedBy?.name || "System Authorization Service"} (
                        {log.accessedBy?.role || "SYSTEM"})
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Add Medical Record Entry Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Record Clinical Condition / History
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddEntry} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Record Type
                    </label>
                    <select
                      value={newEntry.type}
                      onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="DIAGNOSIS">Clinical Diagnosis</option>
                      <option value="MEDICAL_HISTORY">Medical History / Chronic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={newEntry.severity}
                      onChange={(e) => setNewEntry({ ...newEntry, severity: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Diagnosis / Health Condition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes, Asthma, Allergic Rhinitis"
                    value={newEntry.condition}
                    onChange={(e) => setNewEntry({ ...newEntry, condition: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Symptoms Observed
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Shortness of breath during exertion, wheezing"
                    value={newEntry.symptoms}
                    onChange={(e) => setNewEntry({ ...newEntry, symptoms: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Recommended Treatment / Management Plan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Inhaler twice daily, low glycemic diet, daily morning walk"
                    value={newEntry.treatmentPlan}
                    onChange={(e) => setNewEntry({ ...newEntry, treatmentPlan: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-blue-800 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Entry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

