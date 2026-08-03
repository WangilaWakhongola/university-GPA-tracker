// src/pages/Profile.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const REGIONS = [
  { value: "us_international",    label: "United States / International", scale: "4.0" },
  { value: "nigeria_west_africa", label: "Nigeria / West Africa",          scale: "5.0" },
  { value: "australia",           label: "Australia",                      scale: "7.0" },
];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name:     user?.full_name     || "",
    university:    user?.university    || "",
    program:       user?.program       || "",
    region:        user?.region        || "us_international",
    password:      "",
    confirm:       "",
  });
  const [saving, setSaving] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name:  form.full_name,
        university: form.university,
        program:    form.program,
        region:     form.region,
      };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      toast.success("Profile updated");
      setForm({ ...form, password: "", confirm: "" });
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="page-header">Settings</h1>

      <form onSubmit={submit} className="space-y-6">
        {/* Personal info */}
        <div className="card p-5 space-y-4">
          <h2 className="section-header">Personal Information</h2>

          <div>
            <label className="label">Full name</label>
            <input name="full_name" required className="input"
              value={form.full_name} onChange={handle} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input opacity-60 cursor-not-allowed" value={user?.email} readOnly />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input opacity-60 cursor-not-allowed" value={user?.username} readOnly />
            </div>
          </div>

          <div>
            <label className="label">University</label>
            <input name="university" className="input"
              value={form.university} onChange={handle} />
          </div>

          <div>
            <label className="label">Program / Degree</label>
            <input name="program" className="input"
              value={form.program} onChange={handle} />
          </div>
        </div>

        {/* Region / grading scale */}
        <div className="card p-5 space-y-4">
          <h2 className="section-header">Region & Grading Scale</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your grading scale is set automatically from your region, so it always matches
            how your institution actually grades. Changing region will re-calculate all
            existing GPAs on next login.
          </p>
          <div>
            <label className="label">Region</label>
            <select name="region" className="input" value={form.region} onChange={handle}>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Grading scale:</span>
            <span className="badge-blue">
              {REGIONS.find((r) => r.value === form.region)?.scale} scale
            </span>
          </div>
        </div>

        {/* Change password */}
        <div className="card p-5 space-y-4">
          <h2 className="section-header">Change Password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Leave blank to keep your current password.</p>
          <div>
            <label className="label">New password</label>
            <input name="password" type="password" className="input" placeholder="At least 8 characters"
              value={form.password} onChange={handle} />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input name="confirm" type="password" className="input" placeholder="Repeat password"
              value={form.confirm} onChange={handle} />
          </div>
        </div>

        <button type="submit" className="btn-primary px-6" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
