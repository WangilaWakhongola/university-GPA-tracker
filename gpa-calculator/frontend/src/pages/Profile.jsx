// src/pages/Profile.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const SCALES = [
  { value: "4.0", label: "4.0 Scale (Standard US/International)" },
  { value: "5.0", label: "5.0 Scale (Nigerian & West African)" },
  { value: "7.0", label: "7.0 Scale (Australian)" },
];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name:     user?.full_name     || "",
    university:    user?.university    || "",
    program:       user?.program       || "",
    grading_scale: user?.grading_scale || "4.0",
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
        full_name:     form.full_name,
        university:    form.university,
        program:       form.program,
        grading_scale: form.grading_scale,
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

        {/* Grading scale */}
        <div className="card p-5 space-y-4">
          <h2 className="section-header">Grading Scale</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This affects how letter grades are converted to GPA points.
            Changing this will re-calculate all existing GPAs on next login.
          </p>
          <div className="space-y-2">
            {SCALES.map((s) => (
              <label key={s.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio" name="grading_scale" value={s.value}
                  checked={form.grading_scale === s.value}
                  onChange={handle}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.label}</p>
                </div>
              </label>
            ))}
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
