import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.identifier.trim()) {
      setMessage("Please enter your mobile, email, or national ID.");
      setSuccess(false);
      return;
    }

    if (!credentials.password) {
      setMessage("Please enter your password.");
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error(
          `Server returned an invalid response (${response.status}: ${response.statusText}). Make sure the backend server is running.`,
          { cause: parseErr }
        );
      }

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage("Login successful! Welcome back.");

        // Update global auth state and persist to localStorage
        login(data.user, data.token);

        setTimeout(() => {
          navigate("/");
        }, 800);
      } else {
        setSuccess(false);
        setMessage(data.message || "Invalid login credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setSuccess(false);
      setMessage(
        error.message ||
          "Unable to connect to the SwasthCard server. Please verify the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 px-6 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl">
              🏥
            </span>
            <div>
              <h1 className="text-xl font-bold">SwasthCard</h1>
              <p className="text-xs text-blue-200">
                Digital Health Record & Hospital Portal
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="text-sm font-medium text-blue-200 hover:text-white transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome Back
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Sign in to your SwasthCard digital health account.
            </p>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`mb-5 rounded-md p-4 text-sm font-medium leading-relaxed ${
                success
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile / Email / National ID
              </label>
              <input
                type="text"
                name="identifier"
                value={credentials.identifier}
                onChange={handleChange}
                placeholder="Enter mobile, email, or national ID"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-blue-800 px-4 py-3 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 border-t pt-4">
            <p>
              Don't have a SwasthCard yet?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-800 hover:underline"
              >
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
