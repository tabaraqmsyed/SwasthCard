import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Register() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    nationalId: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) {
      setMessage("Please enter your full name.");
      setSuccess(false);
      return;
    }

    if (!formData.mobile.trim() && !formData.email.trim() && !formData.nationalId.trim()) {
      setMessage("Please provide at least a mobile number, email, or national ID.");
      setSuccess(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error(
          `Server returned an invalid response (${response.status}: ${response.statusText}). Make sure the backend server is running correctly.`,
          { cause: parseErr }
        );
      }

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage(
          data.message ||
            "Registration successful! Your SwasthCard account has been created."
        );

        // Store user and token in AuthContext
        if (data.token && data.user) {
          login(data.user, data.token);
        }

        setFormData({
          name: "",
          mobile: "",
          email: "",
          nationalId: "",
          password: "",
        });
      } else {
        setSuccess(false);
        setMessage(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setSuccess(false);
      setMessage(
        error.message ||
          "Unable to connect to the SwasthCard server. Please verify the backend is running on port 5000."
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
          <div className="flex items-center gap-3">
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
          </div>

          <Link
            to="/"
            className="text-sm font-medium text-blue-200 hover:text-white transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Registration Section */}
      <main className="flex justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Create Your SwasthCard
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Register to access your digital health records & hospital services.
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
              {success && (
                <div className="mt-3 flex gap-3">
                  <Link
                    to="/login"
                    className="inline-block rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800"
                  >
                    Go to Login →
                  </Link>
                  <Link
                    to="/"
                    className="inline-block rounded border border-green-700 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100"
                  >
                    Return Home
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-xs text-gray-500">(Optional)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* National ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                National ID / Aadhaar <span className="text-xs text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="Enter your national ID or Aadhaar"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-blue-800 px-4 py-3 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center text-sm text-gray-600 border-t pt-4">
            <p>
              Already have a SwasthCard account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-800 hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;