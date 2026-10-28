import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

export default function Prescriptions() {
  const { user, token } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeRx, setActiveRx] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRx, setNewRx] = useState({
    diagnosis: "",
    med1Name: "",
    med1Dosage: "",
    med1Freq: "1-0-1",
    med1Duration: "5 days",
    med1Inst: "After food",
    med2Name: "",
    med2Dosage: "",
    med2Freq: "0-0-1",
    med2Duration: "7 days",
    med2Inst: "At bedtime",
    advice: "Drink plenty of fluids and rest. Follow up if symptoms persist.",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadPrescriptions() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch("/api/records?type=PRESCRIPTION", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setPrescriptions(data.records || []);
        } else {
          setError(data.message || "Failed to load prescriptions.");
        }
      } catch (err) {
        console.error("Error loading prescriptions:", err);
        setError("Unable to connect to prescription service.");
      } finally {
        setLoading(false);
      }
    }

    loadPrescriptions();
  }, [token]);

  const parseRxContent = (contentString) => {
    try {
      return JSON.parse(contentString);
    } catch {
      return {
        diagnosis: "General Consultation",
        medicines: [],
        advice: contentString,
      };
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const meds = [];
    if (newRx.med1Name) {
      meds.push({
        name: newRx.med1Name,
        dosage: newRx.med1Dosage,
        frequency: newRx.med1Freq,
        duration: newRx.med1Duration,
        instructions: newRx.med1Inst,
      });
    }
    if (newRx.med2Name) {
      meds.push({
        name: newRx.med2Name,
        dosage: newRx.med2Dosage,
        frequency: newRx.med2Freq,
        duration: newRx.med2Duration,
        instructions: newRx.med2Inst,
      });
    }

    const contentObj = {
      diagnosis: newRx.diagnosis,
      medicines: meds,
      advice: newRx.advice,
    };

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "PRESCRIPTION",
          content: contentObj,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPrescriptions([data.record, ...prescriptions]);
        setShowAddModal(false);
        setNewRx({
          diagnosis: "",
          med1Name: "",
          med1Dosage: "",
          med1Freq: "1-0-1",
          med1Duration: "5 days",
          med1Inst: "After food",
          med2Name: "",
          med2Dosage: "",
          med2Freq: "0-0-1",
          med2Duration: "7 days",
          med2Inst: "At bedtime",
          advice: "Drink plenty of fluids and rest. Follow up if symptoms persist.",
        });
      } else {
        alert(data.message || "Failed to record prescription.");
      }
    } catch (err) {
      console.error("Create rx error:", err);
      alert("Error saving prescription.");
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
              Digital e-Prescriptions
            </h1>
            <p className="text-sm text-gray-600">
              Direct access to electronic prescriptions authorized by verified healthcare practitioners.
            </p>
          </div>

          
          {user?.role === "DOCTOR" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition cursor-pointer flex items-center gap-2"
            >
              <span>💊</span> Add Prescription
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
            <p className="text-gray-500">Loading digital prescriptions...</p>
          </div>
        ) : !user ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-800">Please Sign In</p>
            <p className="mt-1 text-sm text-gray-600">
              Sign in to view and download your electronic prescriptions.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-blue-800 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">💊</div>
            <h3 className="text-lg font-bold text-gray-800">No Prescriptions Found</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              Your prescription record is currently empty. Any prescriptions written during hospital consultations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {prescriptions.map((rx) => {
              const content = parseRxContent(rx.content);
              return (
                <div
                  key={rx.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                >
                  {/* Doctor & Hospital Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-2xl font-bold">
                        ℞
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {rx.doctor?.user?.name || "Attending Medical Officer"}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {rx.doctor?.hospital?.name || "Super Specialty Hospital"}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="rounded bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 border border-emerald-300">
                        VERIFIED Rx
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Prescribed on:{" "}
                        <strong>{new Date(rx.createdAt).toLocaleDateString("en-IN")}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {content.diagnosis && (
                    <div className="mt-4 inline-block rounded-md bg-amber-50 px-3 py-1.5 border border-amber-200 text-xs font-semibold text-amber-900">
                      Diagnosis: {content.diagnosis}
                    </div>
                  )}

                  {/* Medicine List */}
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Prescribed Medications
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 font-semibold text-gray-700 border-b">
                          <tr>
                            <th className="p-3">Medicine Name</th>
                            <th className="p-3">Dosage</th>
                            <th className="p-3">Frequency</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {content.medicines?.length > 0 ? (
                            content.medicines.map((med, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="p-3 font-bold text-blue-900">{med.name}</td>
                                <td className="p-3 font-semibold text-gray-700">{med.dosage}</td>
                                <td className="p-3">
                                  <span className="bg-blue-50 text-blue-800 font-mono font-bold px-2 py-0.5 rounded border border-blue-200">
                                    {med.frequency}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-600">{med.duration}</td>
                                <td className="p-3 text-gray-700">{med.instructions}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-3 text-center text-gray-400 italic">
                                General medical consultation notes
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Doctor's Advice */}
                  {content.advice && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-3.5 border text-xs text-gray-700">
                      <strong className="text-gray-900">Doctor's Advice:</strong>{" "}
                      {content.advice}
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="mt-5 pt-3 border-t flex flex-wrap justify-between items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">
                      Rx-ID: #{rx.id} | Hash: {rx.recordHash?.substring(0, 16)}...
                    </span>
                    <button
                      onClick={() => setActiveRx({ ...rx, parsedContent: content })}
                      className="rounded-md bg-blue-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
                    >
                      View & Print Prescription 🖨️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Printable Rx Modal */}
        {activeRx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl border border-gray-300 max-h-[95vh] overflow-y-auto">
              {/* Slip Header */}
              <div className="border-b-2 border-blue-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-blue-900">
                    {activeRx.doctor?.hospital?.name || "SwasthCard Medical Center"}
                  </h2>
                  <p className="text-xs text-gray-600">
                    Department of Clinical Medicine & Outpatient Services
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    Doctor: {activeRx.doctor?.user?.name} | Reg: {activeRx.doctor?.licenseNo || "MCI-VALID"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-blue-900">℞</span>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    Rx Ref: #{activeRx.id}
                  </p>
                </div>
              </div>

              {/* Patient Banner */}
              <div className="my-4 grid grid-cols-2 gap-2 bg-blue-50/70 p-3 rounded-lg border border-blue-100 text-xs">
                <div>
                  <span className="text-gray-500">Patient Name:</span>{" "}
                  <strong>{user?.name}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Health ID:</span>{" "}
                  <strong className="font-mono">{user?.qrCodeId || "SC-VERIFIED"}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>{" "}
                  <strong>{new Date(activeRx.createdAt).toLocaleDateString("en-IN")}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Diagnosis:</span>{" "}
                  <strong>{activeRx.parsedContent.diagnosis || "General Consult"}</strong>
                </div>
              </div>

              {/* Medications List */}
              <div className="my-6">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Medications & Dosing Schedule
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 font-bold text-gray-800 border-b">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Medication</th>
                        <th className="p-2.5">Dosage</th>
                        <th className="p-2.5">Schedule</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeRx.parsedContent.medicines?.map((m, i) => (
                        <tr key={i}>
                          <td className="p-2.5 text-gray-400">{i + 1}</td>
                          <td className="p-2.5 font-bold text-gray-900">{m.name}</td>
                          <td className="p-2.5">{m.dosage}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-800">{m.frequency}</td>
                          <td className="p-2.5">{m.duration}</td>
                          <td className="p-2.5 text-gray-600">{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advice */}
              {activeRx.parsedContent.advice && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-950">
                  <strong>Special Advice:</strong> {activeRx.parsedContent.advice}
                </div>
              )}

              {/* Digital Doctor Signature */}
              <div className="mt-8 pt-4 border-t flex justify-between items-end">
                <div className="text-[10px] text-gray-400 font-mono">
                  Digitally signed via SwasthCard PKI Network
                  <br />
                  Record Hash: {activeRx.recordHash?.substring(0, 32)}...
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-blue-900 font-bold text-base">
                    {activeRx.doctor?.user?.name}
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">
                    Authorized Medical Practitioner
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => setActiveRx(null)}
                  className="rounded-lg bg-blue-800 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Prescription Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Create Electronic Prescription
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddPrescription} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Diagnosis / Medical Condition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Viral Pharyngitis"
                    value={newRx.diagnosis}
                    onChange={(e) => setNewRx({ ...newRx, diagnosis: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                {/* Medicine 1 */}
                <div className="rounded-lg bg-gray-50 p-3 border space-y-2">
                  <p className="font-bold text-gray-800">Primary Drug / Medicine</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Paracetamol)"
                      value={newRx.med1Name}
                      onChange={(e) => setNewRx({ ...newRx, med1Name: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500 mg)"
                      value={newRx.med1Dosage}
                      onChange={(e) => setNewRx({ ...newRx, med1Dosage: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Schedule (e.g. 1-0-1)"
                      value={newRx.med1Freq}
                      onChange={(e) => setNewRx({ ...newRx, med1Freq: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 days)"
                      value={newRx.med1Duration}
                      onChange={(e) => setNewRx({ ...newRx, med1Duration: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Instructions (e.g. After meals)"
                    value={newRx.med1Inst}
                    onChange={(e) => setNewRx({ ...newRx, med1Inst: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2.5 py-1.5"
                  />
                </div>

                {/* Medicine 2 */}
                <div className="rounded-lg bg-gray-50 p-3 border space-y-2">
                  <p className="font-bold text-gray-800">Secondary Drug (Optional)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Cetirizine)"
                      value={newRx.med2Name}
                      onChange={(e) => setNewRx({ ...newRx, med2Name: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 10 mg)"
                      value={newRx.med2Dosage}
                      onChange={(e) => setNewRx({ ...newRx, med2Dosage: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Schedule (e.g. 0-0-1)"
                      value={newRx.med2Freq}
                      onChange={(e) => setNewRx({ ...newRx, med2Freq: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 7 days)"
                      value={newRx.med2Duration}
                      onChange={(e) => setNewRx({ ...newRx, med2Duration: e.target.value })}
                      className="rounded border border-gray-300 px-2.5 py-1.5"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Instructions (e.g. At bedtime)"
                    value={newRx.med2Inst}
                    onChange={(e) => setNewRx({ ...newRx, med2Inst: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Doctor's Advice & Lifestyle Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={newRx.advice}
                    onChange={(e) => setNewRx({ ...newRx, advice: e.target.value })}
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
                    {submitting ? "Saving..." : "Save Prescription"}
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

