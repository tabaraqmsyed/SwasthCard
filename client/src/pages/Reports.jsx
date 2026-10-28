import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

export default function Reports() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReport, setNewReport] = useState({
    testName: "",
    labName: "",
    status: "Normal",
    parameter1: "Hemoglobin",
    value1: "14.2",
    unit1: "g/dL",
    range1: "13.0 - 17.0",
    parameter2: "Total Leukocyte Count (TLC)",
    value2: "6,800",
    unit2: "/mcL",
    range2: "4,000 - 11,000",
    interpretation: "All tested parameters appear within typical clinical boundaries.",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadReports() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch("/api/records?type=LAB_REPORT", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setReports(data.records || []);
        } else {
          setError(data.message || "Failed to load reports.");
        }
      } catch (err) {
        console.error("Error loading reports:", err);
        setError("Failed to connect to the medical records service.");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [token]);

  const parseReportContent = (contentString) => {
    try {
      return JSON.parse(contentString);
    } catch {
      return { testName: "Diagnostic Test", interpretation: contentString, results: [] };
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const contentObj = {
      testName: newReport.testName,
      labName: newReport.labName,
      status: newReport.status,
      results: [
        {
          parameter: newReport.parameter1,
          value: newReport.value1,
          unit: newReport.unit1,
          normalRange: newReport.range1,
        },
        {
          parameter: newReport.parameter2,
          value: newReport.value2,
          unit: newReport.unit2,
          normalRange: newReport.range2,
        },
      ],
      interpretation: newReport.interpretation,
    };

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "LAB_REPORT",
          content: contentObj,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReports([data.record, ...reports]);
        setShowAddModal(false);
        setNewReport({
          testName: "",
          labName: "",
          status: "Normal",
          parameter1: "Hemoglobin",
          value1: "14.2",
          unit1: "g/dL",
          range1: "13.0 - 17.0",
          parameter2: "Total Leukocyte Count (TLC)",
          value2: "6,800",
          unit2: "/mcL",
          range2: "4,000 - 11,000",
          interpretation: "All tested parameters appear within typical clinical boundaries.",
        });
      } else {
        alert(data.message || "Failed to save lab report.");
      }
    } catch (err) {
      console.error("Create report error:", err);
      alert("Error saving record.");
    } finally {
      setSubmitting(false);
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
              My Diagnostic Reports
            </h1>
            <p className="text-sm text-gray-600">
              Access digital laboratory investigations, pathology, and diagnostic imaging securely.
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition cursor-pointer flex items-center gap-2"
            >
              <span>➕</span> Add Lab Report
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">Loading diagnostic records...</p>
          </div>
        ) : !user ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-800">Please Sign In</p>
            <p className="mt-1 text-sm text-gray-600">
              Sign in to view and download your medical lab reports.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-blue-800 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-lg font-bold text-gray-800">No Reports Found</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              You do not have any diagnostic reports filed yet. Click "Add Lab Report" to add test records.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reports.map((rec) => {
              const content = parseReportContent(rec.content);
              return (
                <div
                  key={rec.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📄</span>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base leading-snug">
                            {content.testName || "Laboratory Diagnostic Report"}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {content.labName || rec.doctor?.hospital?.name || "Verified Clinical Lab"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                          content.status === "Attention"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {content.status || "Completed"}
                      </span>
                    </div>

                    <div className="mt-4 text-xs text-gray-600 space-y-1">
                      <p>
                        <strong>Authorized Specialist:</strong>{" "}
                        {rec.doctor?.user?.name || "Attending Pathologist"}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(rec.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {rec.recordHash && (
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          Hash: {rec.recordHash.substring(0, 24)}...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t flex justify-between items-center">
                    <span className="text-xs text-blue-700 font-medium">
                      {content.results?.length || 0} Measured Parameters
                    </span>
                    <button
                      onClick={() => setSelectedReport({ ...rec, parsedContent: content })}
                      className="rounded-md bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition cursor-pointer"
                    >
                      View Report Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedReport.parsedContent.testName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedReport.parsedContent.labName || selectedReport.doctor?.hospital?.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Patient and Doctor metadata */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg my-4 text-xs">
                <div>
                  <span className="text-gray-500">Patient:</span>{" "}
                  <strong>{user?.name}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Doctor:</span>{" "}
                  <strong>{selectedReport.doctor?.user?.name || "Verified Doctor"}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Date Issued:</span>{" "}
                  <strong>{new Date(selectedReport.createdAt).toLocaleDateString("en-IN")}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>{" "}
                  <span className="font-bold text-green-700">
                    {selectedReport.parsedContent.status || "Verified"}
                  </span>
                </div>
              </div>

              {/* Results Table */}
              <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-2">
                  Observed Clinical Parameters
                </h4>
                {selectedReport.parsedContent.results?.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 font-semibold text-gray-700 border-b">
                        <tr>
                          <th className="p-2.5">Parameter</th>
                          <th className="p-2.5">Observed Value</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5">Standard Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedReport.parsedContent.results.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2.5 font-medium text-gray-800">{item.parameter}</td>
                            <td className="p-2.5 font-bold text-blue-900">{item.value}</td>
                            <td className="p-2.5 text-gray-600">{item.unit}</td>
                            <td className="p-2.5 text-gray-500">{item.normalRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No structured tabular values provided.</p>
                )}
              </div>

              {/* Doctor's Interpretation */}
              {selectedReport.parsedContent.interpretation && (
                <div className="mt-4 rounded-lg bg-blue-50/60 p-4 border border-blue-100">
                  <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Pathologist Clinical Impression
                  </h5>
                  <p className="text-xs text-blue-950 leading-relaxed">
                    {selectedReport.parsedContent.interpretation}
                  </p>
                </div>
              )}

              {/* Security Hash */}
              <div className="mt-4 p-2.5 bg-gray-50 rounded border text-[10px] text-gray-500 font-mono break-all">
                🔐 Cryptographic Audit Hash: {selectedReport.recordHash}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  🖨️ Print Report
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg bg-blue-800 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Report Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Add Diagnostic Lab Report
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddReport} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Investigation / Test Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Complete Hemogram, Renal Function Test"
                    value={newReport.testName}
                    onChange={(e) => setNewReport({ ...newReport, testName: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Laboratory / Hospital Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Diagnostic Center"
                      value={newReport.labName}
                      onChange={(e) => setNewReport({ ...newReport, labName: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newReport.status}
                      onChange={(e) => setNewReport({ ...newReport, status: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Attention">Attention Needed</option>
                      <option value="Under Review">Under Review</option>
                    </select>
                  </div>
                </div>

                {/* Primary Parameter */}
                <div className="rounded-lg bg-gray-50 p-3 border space-y-2">
                  <p className="font-bold text-gray-800">Primary Parameter</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Parameter (e.g. Hemoglobin)"
                      value={newReport.parameter1}
                      onChange={(e) => setNewReport({ ...newReport, parameter1: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Observed Value (e.g. 14.5)"
                      value={newReport.value1}
                      onChange={(e) => setNewReport({ ...newReport, value1: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g. g/dL)"
                      value={newReport.unit1}
                      onChange={(e) => setNewReport({ ...newReport, unit1: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Normal Range (e.g. 13-17)"
                      value={newReport.range1}
                      onChange={(e) => setNewReport({ ...newReport, range1: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                  </div>
                </div>

                {/* Secondary Parameter */}
                <div className="rounded-lg bg-gray-50 p-3 border space-y-2">
                  <p className="font-bold text-gray-800">Secondary Parameter</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Parameter (e.g. TLC)"
                      value={newReport.parameter2}
                      onChange={(e) => setNewReport({ ...newReport, parameter2: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Observed Value (e.g. 7000)"
                      value={newReport.value2}
                      onChange={(e) => setNewReport({ ...newReport, value2: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g. /mcL)"
                      value={newReport.unit2}
                      onChange={(e) => setNewReport({ ...newReport, unit2: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Normal Range"
                      value={newReport.range2}
                      onChange={(e) => setNewReport({ ...newReport, range2: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Doctor's Impression / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newReport.interpretation}
                    onChange={(e) => setNewReport({ ...newReport, interpretation: e.target.value })}
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
                    {submitting ? "Saving..." : "Save Report"}
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

