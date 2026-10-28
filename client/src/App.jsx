import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import BookOpd from "./pages/BookOpd";
import HealthCard from "./pages/HealthCard";
import Reports from "./pages/Reports";
import Prescriptions from "./pages/Prescriptions";
import Appointments from "./pages/Appointments";
import HealthHistory from "./pages/HealthHistory";
import EmergencyPage from "./pages/EmergencyPage";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth Pages */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* 6 Citizen Service Pages */}
      <Route path="/book-opd" element={<BookOpd />} />
      <Route path="/health-card" element={<HealthCard />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/prescriptions" element={<Prescriptions />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/health-history" element={<HealthHistory />} 
      
      
      />{/* Public emergency profile: no login required */}
       <Route
         path="/emergency/:token"
          element={<EmergencyPage />}
          />
          
      {/* Home Portal */}
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar />

            {/* Main */}
            <main className="mx-auto max-w-7xl px-6 py-10 flex-1 w-full">
              {/* Hero Section */}
              <section className="rounded-xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-8 py-14 text-white shadow-lg">
                <div className="max-w-3xl">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-200">
                    Digital Healthcare Platform
                  </p>

                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                    Your Health Records,
                    <br />
                    One Secure Health Card.
                  </h2>

                  <p className="mt-5 text-lg leading-relaxed text-blue-100">
                    SwasthCard provides citizens with secure digital health
                    records, hospital appointments, electronic prescriptions, and diagnostic reports
                    in one unified platform.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-4">
                    {user ? (
                      <div className="flex flex-wrap items-center gap-4">
                        <Link
                          to="/health-card"
                          className="rounded-lg bg-white px-6 py-3 font-bold text-blue-900 shadow hover:bg-gray-100 transition cursor-pointer"
                        >
                          View My Health Card →
                        </Link>
                        <Link
                          to="/book-opd"
                          className="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition cursor-pointer"
                        >
                          Book OPD Consultation
                        </Link>
                      </div>
                    ) : (
                      <>
                        <Link
                          to="/register"
                          className="rounded-lg bg-white px-6 py-3.5 font-bold text-blue-900 shadow hover:bg-gray-100 transition cursor-pointer"
                        >
                          Create Free Account
                        </Link>
                        <Link
                          to="/login"
                          className="rounded-lg border-2 border-white px-6 py-3.5 font-semibold text-white hover:bg-white/10 transition cursor-pointer"
                        >
                          Sign In
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Citizen Services */}
              <section id="services" className="mt-12">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Citizen Services
                  </h2>
                  <p className="mt-1 text-gray-600">
                    Access your healthcare services quickly, transparently and securely.
                  </p>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <ServiceCard
                    title="Book OPD"
                    description="Find a participating hospital, doctor, and reserve an available appointment slot."
                    icon="📅"
                    to="/book-opd"
                  />

                  <ServiceCard
                    title="My Health Card"
                    description="View your SwasthCard identity and dynamic QR health record credential."
                    icon="🪪"
                    to="/health-card"
                  />

                  <ServiceCard
                    title="My Reports"
                    description="Securely access lab tests, diagnostic scans, and medical reports online."
                    icon="📄"
                    to="/reports"
                  />

                  <ServiceCard
                    title="Prescriptions"
                    description="View digital prescriptions provided directly by your verified doctors."
                    icon="💊"
                    to="/prescriptions"
                  />

                  <ServiceCard
                    title="Appointments"
                    description="Track previous visits and manage upcoming scheduled appointments."
                    icon="🏥"
                    to="/appointments"
                  />

                  <ServiceCard
                    title="Health History"
                    description="Complete longitudinal health history secured with audit logging."
                    icon="📋"
                    to="/health-history"
                  />
                </div>
              </section>

              {/* How It Works */}
              <section id="how-it-works" className="mt-14 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-800">
                  How SwasthCard Works
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Three simple steps to manage your digital health identity.
                </p>

                <div className="mt-8 grid gap-8 md:grid-cols-3">
                  <Step
                    number="1"
                    title="Register"
                    text="Create your digital profile using your mobile number or national ID."
                  />

                  <Step
                    number="2"
                    title="Book & Visit"
                    text="Book an appointment or present your digital health QR at participating clinics."
                  />

                  <Step
                    number="3"
                    title="Access Records"
                    text="Safely view prescriptions, diagnosis records, and doctor recommendations anytime."
                  />
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="mt-16 bg-gray-900 px-6 py-10 text-white">
              <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-lg font-bold">SwasthCard</p>
                  <p className="text-sm text-gray-400">
                    Digital Health Record & Hospital Management Portal
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  National Digital Healthcare Portal &copy; 2026.
                </p>
              </div>
            </footer>
          </div>
        }
      />
    </Routes>
  );
}

function ServiceCard({ title, description, icon, to }) {
  return (
    <Link
      to={to}
      className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition"
    >
      <div>
        <div className="text-3xl">{icon}</div>
        <h3 className="mt-4 text-lg font-bold text-gray-800 group-hover:text-blue-900 transition">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      </div>

      <div className="mt-6 flex items-center text-sm font-semibold text-blue-800 group-hover:text-blue-900 group-hover:translate-x-1 transition-transform">
        View Service →
      </div>
    </Link>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-800 font-bold text-white shadow">
        {number}
      </div>

      <div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export default App;