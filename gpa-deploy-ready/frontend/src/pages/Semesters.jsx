// src/pages/Semesters.jsx — list all semesters, add/delete

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { formatGpa, classifyGpa } from "../utils/gpa";
import toast from "react-hot-toast";

const TERMS = ["Fall", "Spring", "Summer", "Winter"];

const BADGE_MAP = {
  green:  "badge-green",
  blue:   "badge-blue",
  yellow: "badge-yellow",
  orange: "badge-orange",
  red:    "badge-red",
  gray:   "badge-gray",
};

export default function Semesters() {
  const { user } = useAuth();
  const scale = user?.grading_scale || "4.0";
  const [semesters, setSemesters] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ name: "", year: new Date().getFullYear(), term: "Fall" });
  const [deleting,  setDeleting]  = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/semesters/");
      setSemesters(data);
    } catch {
      toast.error("Failed to load semesters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createSemester = async (e) => {
    e.preventDefault();
    try {
      const name = form.name || `${form.term} ${form.year}`;
      const { data } = await api.post("/semesters/", { ...form, name });
      setSemesters([data, ...semesters]);
      setShowForm(false);
      setForm({ name: "", year: new Date().getFullYear(), term: "Fall" });
      toast.success("Semester added");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add semester");
    }
  };

  const deleteSemester = async (id) => {
    if (!window.confirm("Delete this semester and all its courses?")) return;
    setDeleting(id);
    try {
      await api.delete(`/semesters/${id}`);
      setSemesters(semesters.filter((s) => s.id !== id));
      toast.success("Semester deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Semesters</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Cancel" : "+ Add semester"}
        </button>
      </div>

      {/* Add semester form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="section-header mb-4">New Semester</h2>
          <form onSubmit={createSemester} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Term</label>
              <select name="term" className="input" value={form.term} onChange={handle}>
                {TERMS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input name="year" type="number" required className="input"
                value={form.year} onChange={handle} min="2000" max="2050" />
            </div>
            <div className="col-span-2">
              <label className="label">Custom name <span className="text-gray-400 font-normal">(optional)</span></label>
              <input name="name" className="input" placeholder={`${form.term} ${form.year}`}
                value={form.name} onChange={handle} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Add semester</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : semesters.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No semesters yet.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
            Add your first semester
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map((sem) => {
            const credits = sem.courses?.reduce((a, c) => a + c.credit_hours, 0) || 0;
            const classification = sem.courses?.length ? classifyGpa(sem.gpa, scale) : null;
            const badgeCls = classification ? (BADGE_MAP[classification.color] || "badge-gray") : null;
            return (
              <div key={sem.id} className="card p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{sem.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sem.courses?.length || 0} courses · {credits} credit hours
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">GPA</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatGpa(sem.gpa)}</p>
                  {classification && (
                    <span className={`${badgeCls} mt-1`}>{classification.cls}</span>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <Link
                    to={`/semesters/${sem.id}`}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => deleteSemester(sem.id)}
                    disabled={deleting === sem.id}
                    className="text-xs px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
