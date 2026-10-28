
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function displayValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "— Not available";
  }

  const text = String(value).trim();

  if (
    ["not specified", "not provided", "not available", "unknown"].includes(
      text.toLowerCase()
    )
  ) {
    return "— Not available";
  }

  return text;
}

export default function EmergencyPage() {
  const { token } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      setLoading(true);
      setError("");
      setProfile(null);

      if (!token || !/^[A-Za-z0-9_-]{32}$/.test(token)) {
        setError("Invalid emergency QR code.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/emergency/${encodeURIComponent(token)}`,
          {
            signal: controller.signal,
            cache: "no-store",
            headers: { Accept: "application/json" },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.emergencyProfile) {
          setError(data.message || "Emergency profile not found.");
          return;
        }

        setProfile(data.emergencyProfile);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Unable to connect to the SwasthCard server.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [token]);

  const rows = profile
    ? [
        { label: "Full name", value: profile.name },
        {
          label: "Blood group",
          value: profile.bloodGroup,
          important: true,
        },
        { label: "Age", value: profile.age },
        { label: "Gender", value: profile.gender },
        { label: "Allergies", value: profile.allergies },
        {
          label: "Current medications",
          value: profile.currentMedications,
        },
        {
          label: "Medical conditions",
          value: profile.medicalConditions,
        },
        {
          label: "Emergency contacts",
          value: profile.emergencyContacts,
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-900">
            SwasthCard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Emergency Medical Profile
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="bg-red-700 px-5 py-4 text-white">
            <h2 className="text-xl font-bold">
              Emergency Information
            </h2>
            <p className="mt-1 text-sm text-red-100">
              Patient details for emergency situations
            </p>
          </div>

          <div className="p-5 sm:p-7">
            {loading && (
              <p role="status" className="py-8 text-center text-slate-600">
                Loading emergency profile...
              </p>
            )}

            {!loading && error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"
              >
                <h3 className="font-bold">Profile unavailable</h3>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            )}

            {!loading && profile && (
              <>
                {/* Patient photograph and name */}
                <div className="mb-6 flex items-center gap-4 border-b border-slate-200 pb-6">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={`Photo of ${displayValue(profile.name)}`}
                      className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 object-cover"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label="Patient photo not available"
                      className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-center text-xs text-slate-500"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="38"
                        height="38"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                      </svg>
                      <span className="mt-1">Photo unavailable</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Patient
                    </p>
                    <h3 className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl">
                      {displayValue(profile.name)}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Emergency health information
                    </p>
                  </div>
                </div>

                {/* Medical details as a vertical list */}
                <h3 className="mb-3 text-lg font-bold text-slate-900">
                  Medical Details
                </h3>

                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-2 sm:gap-4"
                    >
                      <span className="text-sm font-medium text-slate-600">
                        {row.label}
                      </span>

                      <span
                        className={`break-words text-sm font-semibold ${
                          row.important
                            ? "text-red-700"
                            : "text-slate-900"
                        } ${
                          row.value == null || String(row.value).trim() === ""
                            ? "font-normal text-slate-500"
                            : ""
                        }`}
                      >
                        {displayValue(row.value)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <h3 className="font-bold text-amber-900">
                    Emergency notice
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    {profile.emergencyNotice}
                  </p>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Missing information is marked as not available. Do not
                  assume that missing information means the patient has
                  no allergies or medical conditions.
                </p>
              </>
            )}
          </div>
        </section>

        <footer className="mt-6 text-center text-sm text-slate-500">
          SwasthCard Emergency Profile
          <div>
            <Link
              to="/"
              className="mt-3 inline-block font-semibold text-blue-800 hover:underline"
            >
              Return to SwasthCard
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
