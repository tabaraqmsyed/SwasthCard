import "./HealthCard.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

export default function HealthCard() {
  const { user, token } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bloodGroup: "B+",
    dob: "",
    gender: "Male",
    address: "",
    photoUrl: "",
  });

  useEffect(() => {
    async function loadCard() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/patient/card", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !data.success || !data.card) {
          setError(data.message || "Failed to load card details.");
          return;
        }

        setCardData(data.card);
        setEditForm({
          name: data.card.name || "",
          bloodGroup:
            data.card.bloodGroup && data.card.bloodGroup !== "Not Specified"
              ? data.card.bloodGroup
              : "B+",
          dob: data.card.dob ? data.card.dob.split("T")[0] : "",
          gender:
            data.card.gender && data.card.gender !== "Not Specified"
              ? data.card.gender
              : "Male",
          address:
            data.card.address && data.card.address !== "Not Provided"
              ? data.card.address
              : "",
          photoUrl: data.card.photoUrl || "",
        });
// The QR code opens the public emergency profile.
const qrText = `${window.location.origin}/emergency/${encodeURIComponent(
  data.card.qrCodeId
)}`;
        const url = await QRCode.toDataURL(qrText, {
          width: 200,
          margin: 1,
          color: { dark: "#0f2b5c", light: "#ffffff" },
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error("Health card load error:", err);
        setError("Unable to connect to the SwasthCard server.");
      } finally {
        setLoading(false);
      }
    }

    loadCard();
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const res = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCardData((prev) => ({
          ...prev,
          name: editForm.name.trim(),
          bloodGroup: editForm.bloodGroup,
          dob: editForm.dob || null,
          gender: editForm.gender,
          address: editForm.address || "Not Provided",
          photoUrl: editForm.photoUrl || "",
        }));
        setShowEditModal(false);
        alert("Profile updated successfully.");
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      alert("Error updating profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 500 * 1024) {
      alert("Please choose an image smaller than 500 KB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setEditForm((previous) => ({ ...previous, photoUrl: String(reader.result || "") }));
    reader.onerror = () => alert("Could not read this image. Please try another file.");
    reader.readAsDataURL(file);
  };

  const maskAadhaar = (value) => {
    if (!value) return "Not Provided";
    const digits = String(value).replace(/\D/g, "");
    if (digits.length < 4) return "****";
    return `XXXX XXXX ${digits.slice(-4)}`;
  };

  const formatDate = (value, options) => {
    if (!value) return "Not Specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not Specified";
    return date.toLocaleDateString("en-IN", options);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="no-print">
        <Navbar />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 flex-1 w-full">
        <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link to="/" className="text-sm font-semibold text-blue-700 hover:underline">
              ← Back to Citizen Services
            </Link>
            <h1 className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">
              My SwasthCard
            </h1>
            <p className="text-sm text-gray-600">Your personal digital health card.</p>
          </div>

          {cardData && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Print Card
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="no-print rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-base text-gray-600">Generating your SwasthCard...</p>
          </div>
        ) : error ? (
          <div className="no-print rounded-xl bg-red-50 p-6 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        ) : !user ? (
          <div className="no-print rounded-xl bg-white p-12 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-800">Please Sign In</h2>
            <p className="mt-1 text-sm text-gray-600">
              You must be logged in to access your health card.
            </p>
            <Link to="/login" className="mt-4 inline-block rounded-lg bg-blue-800 px-6 py-2.5 text-sm font-semibold text-white">
              Sign In Now
            </Link>
          </div>
        ) : cardData ? (
          <>
            <div id="print-health-card" className={`health-card-scene ${isFlipped ? "is-flipped" : ""}`}>
              <div
                className={`health-card-inner ${isFlipped ? "is-flipped" : ""}`}
                onClick={() => setIsFlipped((previous) => !previous)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsFlipped((previous) => !previous);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={isFlipped ? "Show front of health card" : "Show back of health card"}
                aria-pressed={isFlipped}
              >
                {/* FRONT SIDE */}
                <section className="health-card-face health-card-front rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 p-4 sm:p-5 text-white shadow-2xl border-4 border-blue-400/30">
                  <div className="flex justify-between items-center border-b border-blue-300/30 pb-3 gap-3">
                    <div>
                      <h2 className="text-xl font-black tracking-wider">SWASTHCARD</h2>
                      <p className="text-[10px] text-blue-200">DIGITAL HEALTH RECORD</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-300">PATIENT CARD</span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4 items-center">
                    <div className="col-span-2 space-y-4 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="health-card-photo">
                          {cardData.photoUrl ? (
                            <img src={cardData.photoUrl} alt="Patient" />
                          ) : (
                            <span aria-hidden="true">PHOTO</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-blue-300 uppercase">Full Name</p>
                          <p className="text-lg sm:text-xl font-bold break-words">{cardData.name || "Not Provided"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] text-blue-300 uppercase">Blood Group</p>
                          <p className="font-bold text-red-300">{cardData.bloodGroup || "Not Specified"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-300 uppercase">Gender</p>
                          <p className="font-semibold">{cardData.gender || "Not Specified"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-300 uppercase">Date of Birth</p>
                          <p className="font-semibold">{formatDate(cardData.dob)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-300 uppercase">Aadhaar</p>
                          <p className="font-mono font-semibold">{maskAadhaar(cardData.nationalId)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-300 uppercase">Registered Mobile</p>
                        <p className="text-xs">{cardData.mobile || "Not Provided"}</p>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl text-center min-w-0">
                      {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="Health card QR code" className="w-full aspect-square object-contain" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center text-xs text-gray-500">QR Code</div>
                      )}
                      <p className="mt-1 text-[9px] font-bold text-gray-700">SCAN TO VERIFY</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-blue-300/30 flex justify-between gap-2 text-[10px]">
                    <span className="break-all">HEALTH ID: {cardData.qrCodeId || "Not Assigned"}</span>
                    <span>Emergency: 108</span>
                  </div>
                </section>

                {/* BACK SIDE */}
                <section className="health-card-face health-card-back rounded-2xl border-4 border-blue-200 bg-gradient-to-br from-white to-blue-50 p-4 sm:p-5 text-gray-900 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-blue-200 pb-3 gap-3">
                    <div>
                      <h2 className="text-xl font-black text-blue-900">SWASTHCARD</h2>
                      <p className="text-[10px] uppercase text-gray-500">Patient information</p>
                    </div>
                    <span className="text-xs font-bold text-blue-800">BACK SIDE</span>
                  </div>

                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500">Registered Address</p>
                      <p className="mt-1 text-sm font-semibold break-words">{cardData.address || "Address not provided"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Member Since</p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(cardData.memberSince, { month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Blood Group</p>
                        <p className="mt-1 text-sm font-bold text-red-700">{cardData.bloodGroup || "Not Specified"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500">Health Card ID</p>
                      <p className="mt-1 text-sm font-mono font-bold text-blue-900 break-all">{cardData.qrCodeId || "Not Assigned"}</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-bold text-blue-900">Important Information</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-700">
                        Keep your profile details updated and share sensitive health information only with authorized healthcare professionals.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-blue-200 pt-3 text-xs text-gray-500">Personal health card</div>
                </section>
              </div>
            </div>

            <div className="no-print mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Health Card Security</h3>
                <p className="text-xs text-gray-600">
                  Your Aadhaar is masked on the card. Share sensitive medical information only with authorized healthcare professionals.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Registered Address</h3>
                <p className="text-xs text-gray-700">{cardData.address || "Not Provided"}</p>
              </div>
            </div>
          </>
        ) : null}

        {/* EDIT PROFILE MODAL */}
        {showEditModal && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Edit Health Card Profile</h3>
                <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold" aria-label="Close edit profile">✕</button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Patient Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="health-card-photo-preview">
                      {editForm.photoUrl ? <img src={editForm.photoUrl} alt="Patient photo preview" /> : <span>No photo</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="block w-full text-xs text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-800"
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WebP; maximum 500 KB.</p>
                      {editForm.photoUrl && (
                        <button type="button" onClick={() => setEditForm((previous) => ({ ...previous, photoUrl: "" }))} className="mt-2 text-xs font-semibold text-red-700 hover:underline">Remove photo</button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Permanent Address</label>
                  <textarea
                    rows={3}
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={updating} className="rounded-md bg-blue-800 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {updating ? "Saving..." : "Save Changes"}
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
