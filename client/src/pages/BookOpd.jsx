import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

const TIME_SLOTS = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:30 AM - 12:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
];

export default function BookOpd() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[2]);

  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch hospitals and doctors
  useEffect(() => {
    async function fetchHospitals() {
      try {
        setLoading(true);
        const res = await fetch("/api/hospitals");
        const data = await res.json();
        if (data.success && data.hospitals) {
          setHospitals(data.hospitals);
          if (data.hospitals.length > 0) {
            setSelectedHospital(data.hospitals[0]);
            if (data.hospitals[0].doctors?.length > 0) {
              setSelectedDoctor(data.hospitals[0].doctors[0]);
            }
          }
        } else {
          setError("Failed to load hospital listings.");
        }
      } catch (err) {
        console.error("Error fetching hospitals:", err);
        setError("Unable to connect to the healthcare network.");
      } finally {
        setLoading(false);
      }
    }

    fetchHospitals();
  }, []);

  const handleHospitalChange = (hospitalId) => {
    const h = hospitals.find((item) => item.id === parseInt(hospitalId, 10));
    setSelectedHospital(h);
    if (h && h.doctors?.length > 0) {
      setSelectedDoctor(h.doctors[0]);
    } else {
      setSelectedDoctor(null);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!user || !token) {
      alert("Please sign in to your SwasthCard account to book an OPD appointment.");
      navigate("/login");
      return;
    }

    if (!selectedHospital || !selectedDoctor || !selectedDate || !selectedSlot) {
      alert("Please choose a hospital, doctor, appointment date, and time slot.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hospitalId: selectedHospital.id,
          doctorId: selectedDoctor.userId,
          date: selectedDate,
          timeSlot: selectedSlot,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setBookingSuccess(data.appointment);
      } else {
        setError(data.message || "Failed to book appointment. Please try again.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError("Network error while submitting appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 flex-1 w-full">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <Link to="/" className="text-sm font-semibold text-blue-700 hover:underline">
            ← Back to Citizen Services
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
            Book OPD Consultation
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Schedule an in-person or outpatient consultation with verified hospital specialists.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {/* Success Modal / Banner */}
        {bookingSuccess ? (
          <div className="rounded-xl border border-green-200 bg-white p-8 shadow-md text-center max-w-2xl mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✅
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              OPD Appointment Confirmed!
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Your appointment has been registered in the SwasthCard network.
            </p>

            <div className="mt-6 rounded-lg bg-gray-50 p-6 text-left border border-gray-200 space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Appointment ID</span>
                <span className="text-sm font-bold text-blue-900 font-mono">
                  #APT-{bookingSuccess.id}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Hospital</span>
                <span className="text-sm font-medium text-gray-800 text-right">
                  {selectedHospital?.name}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Consulting Doctor</span>
                <span className="text-sm font-medium text-gray-800">
                  {bookingSuccess.doctor?.user?.name || selectedDoctor?.user?.name}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Date & Slot</span>
                <span className="text-sm font-semibold text-green-700">
                  {new Date(bookingSuccess.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  ({bookingSuccess.timeSlot})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Patient Name</span>
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                to="/appointments"
                className="rounded-lg bg-blue-800 px-6 py-2.5 font-semibold text-white shadow hover:bg-blue-700 transition"
              >
                View My Appointments →
              </Link>
              <button
                onClick={() => setBookingSuccess(null)}
                className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Book Another OPD
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Form */}
            <form onSubmit={handleBooking} className="lg:col-span-2 space-y-6">
              {/* Step 1: Hospital */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white">
                    1
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">
                    Select Participating Hospital
                  </h2>
                </div>

                {loading ? (
                  <p className="text-sm text-gray-500">Loading hospitals...</p>
                ) : (
                  <div className="space-y-3">
                    {hospitals.map((h) => (
                      <label
                        key={h.id}
                        className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition ${
                          selectedHospital?.id === h.id
                            ? "border-blue-700 bg-blue-50/60 ring-2 ring-blue-700/20"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="hospital"
                          value={h.id}
                          checked={selectedHospital?.id === h.id}
                          onChange={() => handleHospitalChange(h.id)}
                          className="mt-1 text-blue-800"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{h.name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{h.address}</p>
                          <p className="mt-2 text-xs font-medium text-blue-700">
                            {h.doctors?.length || 0} Specialists Available
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Doctor */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white">
                    2
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">
                    Choose Specialist / Doctor
                  </h2>
                </div>

                {!selectedHospital?.doctors || selectedHospital.doctors.length === 0 ? (
                  <p className="text-sm text-gray-500">No doctors registered for this hospital.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedHospital.doctors.map((doc) => (
                      <div
                        key={doc.userId}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`cursor-pointer rounded-lg border p-4 transition ${
                          selectedDoctor?.userId === doc.userId
                            ? "border-blue-700 bg-blue-50/60 ring-2 ring-blue-700/20"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">
                            👨‍⚕️
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{doc.user?.name}</p>
                            <span className="inline-block mt-0.5 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                              {doc.specialization}
                            </span>
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] text-gray-500 font-mono">
                          Reg: {doc.licenseNo}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Date & Time Slot */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white">
                    3
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">
                    Select Date & Time Slot
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Preferred Slot
                    </label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                      required
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-800 py-4 font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer text-base"
              >
                {submitting ? "Booking Appointment..." : "Confirm & Book OPD Appointment"}
              </button>
            </form>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sticky top-24">
                <h3 className="text-base font-bold text-gray-900 border-b pb-3">
                  Consultation Summary
                </h3>

                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Hospital</span>
                    <p className="font-semibold text-gray-900">
                      {selectedHospital?.name || "Not Selected"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Specialist</span>
                    <p className="font-semibold text-gray-900">
                      {selectedDoctor?.user?.name || "Not Selected"}
                    </p>
                    <p className="text-xs text-blue-700">
                      {selectedDoctor?.specialization}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Date & Time</span>
                    <p className="font-semibold text-gray-900">
                      {selectedDate || "Not Selected"}
                    </p>
                    <p className="text-xs text-gray-600">{selectedSlot}</p>
                  </div>

                  <div className="border-t pt-3">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Patient Account</span>
                    <p className="font-semibold text-gray-900">
                      {user ? user.name : "Guest (Sign in required)"}
                    </p>
                    {user?.mobile && (
                      <p className="text-xs text-gray-600">Mobile: {user.mobile}</p>
                    )}
                  </div>

                  <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-100">
                    💡 <strong>Notice:</strong> Please arrive 15 minutes before your slot with your digital SwasthCard QR ID.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
