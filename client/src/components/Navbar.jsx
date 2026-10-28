import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top Banner */}
      <div className="bg-blue-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
              🏥
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SwasthCard</h1>
              <p className="text-[11px] text-blue-200">
                Digital Health Card With Real-Time Medical Record Access
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right">
              <p className="text-[11px] text-blue-200">National Emergency</p>
              <p className="text-base font-bold text-white leading-tight">108</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5 text-sm font-medium">
          {/* Nav links */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-4">
            <Link
              to="/"
              className={`rounded-md px-3 py-1.5 transition ${
                isActive("/")
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-gray-700 hover:text-blue-800 hover:bg-gray-50"
              }`}
            >
              Home
            </Link>

            <Link
              to="/book-opd"
              className={`rounded-md px-3 py-1.5 transition ${
                isActive("/book-opd")
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-gray-700 hover:text-blue-800 hover:bg-gray-50"
              }`}
            >
              Book OPD
            </Link>

            <Link
              to="/health-card"
              className={`rounded-md px-3 py-1.5 transition ${
                isActive("/health-card")
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-gray-700 hover:text-blue-800 hover:bg-gray-50"
              }`}
            >
              My Card
            </Link>

            <Link
              to="/reports"
              className={`rounded-md px-3 py-1.5 transition ${
                isActive("/reports")
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-gray-700 hover:text-blue-800 hover:bg-gray-50"
              }`}
            >
              Reports
            </Link>

            <Link
              to="/prescriptions"
              className={`rounded-md px-3 py-1.5 transition ${
                isActive("/prescriptions")
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-gray-700 hover:text-blue-800 hover:bg-gray-50"
              }`}
            >
              Prescriptions
            </Link>

            <Link
              to="/appointments"
              className={`rounded-md px-3 py-1.5 transition ${
                isActive("/appointments")
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-gray-700 hover:text-blue-800 hover:bg-gray-50"
              }`}
            >
              Appointments
            </Link>

            <Link
              to="/health-history"
              className={`rounded-md px-3 py-1.5 transition ${
                isActive("/health-history")
                  ? "bg-blue-50 text-blue-900 font-bold"
                  : "text-gray-700 hover:text-blue-800 hover:bg-gray-50"
              }`}
            >
              History
            </Link>
          </div>

          {/* User Profile & Sign Out Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white uppercase">
                    {user.name ? user.name.charAt(0) : "U"}
                  </span>
                  <span className="font-semibold text-blue-950 text-xs sm:text-sm">
                    {user.name}
                  </span>
                  {user.role && (
                    <span className="rounded bg-blue-200/80 px-1.5 py-0.5 text-[10px] font-bold text-blue-900 uppercase">
                      {user.role}
                    </span>
                  )}
                </div>

                <button
                  onClick={logout}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 active:bg-red-800 cursor-pointer transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-md border border-blue-800 px-3 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-blue-800 px-3.5 py-1 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

