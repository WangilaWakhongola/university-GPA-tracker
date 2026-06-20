// src/pages/Login.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => setForm({ email: "demo@university.edu", password: "demo1234" });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — brand/info */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-700 text-white flex-col justify-between p-12">
        <div>
          <span className="text-2xl font-bold tracking-tight">
            GPA<span className="text-primary-300">Calc</span>
          </span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight mb-4">
            Track your academic<br />performance with clarity.
          </h1>
          <p className="text-primary-200 text-base leading-relaxed max-w-sm">
            Manage courses, calculate semester GPA, track your CGPA over time,
            and generate professional academic reports — all in one place.
          </p>
        </div>
        <div className="text-primary-300 text-sm">
          Supporting 4.0, 5.0, and 7.0 grading scales
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Sign in</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Register
              </Link>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                name="email" type="email" required
                className="input" placeholder="you@university.edu"
                value={form.email} onChange={handle}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                name="password" type="password" required
                className="input" placeholder="••••••••"
                value={form.password} onChange={handle}
              />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
              Try the demo account
            </p>
            <button onClick={fillDemo} className="btn-secondary w-full text-center text-sm">
              Use demo credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
