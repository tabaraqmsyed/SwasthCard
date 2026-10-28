import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

export default function Appointments() {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    async function loadAppointments() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch("/api/appointments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setAppointments(data.appointments || []);
        } else {
          setError(data.message || "Failed to load appointments.");
        }
      } catch (err) {
        console.error("Error loading appointments:", err);
        setError("Unable to connect to appointments service.");
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [token]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    setCancellingId(id);

    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAppointments((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "CANCELLED" } : item
          )
        );
      } else {
        alert(data.message || "Could not cancel appointment.");
      }
    } catch (err) {
      console.error("Cancel appointment error:", err);
      alert("Error cancelling appointment.");
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    if (filter === "upcoming") {
      return aptDate >= now && apt.status !== "CANCELLED";
    }
    if (filter === "past") {
      return aptDate < now || apt.status === "CANCELLED";
    }
    return true;
  });

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
              Hospital Appointments
            </h1>
            <p className="text-sm text-gray-600">
              Track upcoming visits, scheduled OPD consultations, and booking history.
            </p>
          </div>

          <Link
            to="/book-opd"
            className="rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>📅</span> Book New OPD
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition ${
              filter === "all"
                ? "border-blue-800 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All Bookings ({appointments.length})
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition ${
              filter === "upcoming"
                ? "border-blue-800 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition ${
              filter === "past"
                ? "border-blue-800 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Past & Cancelled
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">Retrieving appointment schedules...</p>
          </div>
        ) : !user ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-800">Please Sign In</p>
            <p className="mt-1 text-sm text-gray-600">
              Sign in to manage and view your hospital bookings.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-blue-800 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">🏥</div>
            <h3 className="text-lg font-bold text-gray-800">No Appointments Found</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              You do not have any appointments under this view. Need consultation? Click "Book New OPD".
            </p>
            <Link
              to="/book-opd"
              className="mt-5 inline-block rounded-lg bg-blue-800 px-6 py-2.5 text-sm font-semibold text-white shadow"
            >
              Book OPD Now →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => {
              const aptDate = new Date(apt.date);
              const isPast = aptDate < now;
              const isCancelled = apt.status === "CANCELLED";

              return (
                <div
                  key={apt.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between md:items-center gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl font-bold text-blue-900">
                      📅
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {apt.doctor?.user?.name || "Hospital Specialist"}
                        </h3>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          {apt.doctor?.specialization || "General Medicine"}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mt-0.5">
                        {apt.hospital?.name} • {apt.hospital?.address}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span className="font-semibold text-gray-800">
                          Date: {aptDate.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="font-semibold text-gray-800">
                          Slot: {apt.timeSlot}
                        </span>
                        <span className="font-mono text-gray-500">
                          ID: #APT-{apt.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Cancel Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                    <div>
                      {isCancelled ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-200">
                          CANCELLED
                        </span>
                      ) : isPast ? (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 border border-green-200">
                          CONFIRMED
                        </span>
                      )}
                    </div>

                    {!isCancelled && !isPast && (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        disabled={cancellingId === apt.id}
                        className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                      >
                        {cancellingId === apt.id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

