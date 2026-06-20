// src/pages/Register.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const SCALES = [
  { value: "4.0", label: "4.0 Scale (A–F)" },
  { value: "5.0", label: "5.0 Scale (A–F, Nigerian)" },
  { value: "7.0", label: "7.0 Scale (Australian)" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", email: "", password: "", full_name: "",
    university: "", program: "", grading_scale: "4.0",
  });
  const [busy, setBusy] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <span className="text-xl font-bold tracking-tight text-primary-600 dark:text-primary-400">
            GPA<span className="text-gray-900 dark:text-white">Calc</span>
          </span>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">Create account</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full name</label>
              <input name="full_name" required className="input" placeholder="Alex Johnson"
                value={form.full_name} onChange={handle} />
            </div>
            <div>
              <label className="label">Username</label>
              <input name="username" required className="input" placeholder="alexj"
                value={form.username} onChange={handle} />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" placeholder="you@university.edu"
                value={form.email} onChange={handle} />
            </div>
            <div className="col-span-2">
              <label className="label">Password</label>
              <input name="password" type="password" required className="input" placeholder="At least 8 characters"
                value={form.password} onChange={handle} />
            </div>
            <div className="col-span-2">
              <label className="label">University <span className="text-gray-400 font-normal">(optional)</span></label>
              <input name="university" className="input" placeholder="State University of Technology"
                value={form.university} onChange={handle} />
            </div>
            <div>
              <label className="label">Program <span className="text-gray-400 font-normal">(optional)</span></label>
              <input name="program" className="input" placeholder="B.Sc. Computer Science"
                value={form.program} onChange={handle} />
            </div>
            <div>
              <label className="label">Grading scale</label>
              <select name="grading_scale" className="input" value={form.grading_scale} onChange={handle}>
                {SCALES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
