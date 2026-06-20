// src/pages/SemesterDetail.jsx — view/edit/delete courses in a semester

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getGradeOptions, getGradePoint, formatGpa } from "../utils/gpa";
import toast from "react-hot-toast";

const EMPTY_FORM = { name: "", code: "", credit_hours: 3, grade: "A" };

export default function SemesterDetail() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const scale     = user?.grading_scale || "4.0";

  const [semester,  setSemester]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [editing,   setEditing]   = useState(null); // course id being edited
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);

  const gradeOptions = getGradeOptions(scale);

  const load = async () => {
    try {
      const { data } = await api.get(`/semesters/${id}`);
      setSemester(data);
    } catch {
      toast.error("Failed to load semester");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const addCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/courses/semester/${id}`, form);
      await load();
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Course added");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add course");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (course) => {
    setEditing(course.id);
    setEditForm({
      name: course.name, code: course.code || "",
      credit_hours: course.credit_hours, grade: course.grade,
    });
  };

  const saveEdit = async (courseId) => {
    setSaving(true);
    try {
      await api.put(`/courses/${courseId}`, editForm);
      await load();
      setEditing(null);
      toast.success("Course updated");
    } catch {
      toast.error("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await api.delete(`/courses/${courseId}`);
      await load();
      toast.success("Course deleted");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const handle      = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEdit  = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"/></div>;
  if (!semester) return null;

  const totalCredits = semester.courses.reduce((a, c) => a + c.credit_hours, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/semesters" className="hover:text-gray-900 dark:hover:text-white transition-colors">
          Semesters
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">{semester.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">{semester.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {semester.courses.length} courses · {totalCredits} credit hours
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Semester GPA</p>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {formatGpa(semester.gpa)}
          </p>
        </div>
      </div>

      {/* Add course button */}
      <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
        {showForm ? "Cancel" : "+ Add course"}
      </button>

      {/* Add course form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="section-header mb-4">New Course</h2>
          <form onSubmit={addCourse} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Course name</label>
              <input name="name" required className="input" placeholder="Introduction to Computer Science"
                value={form.name} onChange={handle} />
            </div>
            <div>
              <label className="label">Course code <span className="text-gray-400 font-normal">(optional)</span></label>
              <input name="code" className="input" placeholder="CS101"
                value={form.code} onChange={handle} />
            </div>
            <div>
              <label className="label">Credit hours</label>
              <input name="credit_hours" type="number" required min="0.5" max="12" step="0.5"
                className="input" value={form.credit_hours} onChange={handle} />
            </div>
            <div>
              <label className="label">Grade</label>
              <select name="grade" className="input" value={form.grade} onChange={handle}>
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>{g} ({getGradePoint(g, scale).toFixed(1)} pts)</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Add course"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Course table */}
      {semester.courses.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No courses in this semester yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 font-medium">Course</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Credits</th>
                <th className="text-center px-4 py-3 font-medium">Grade</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Points</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {semester.courses.map((c) => (
                editing === c.id ? (
                  /* ── Inline edit row ── */
                  <tr key={c.id} className="bg-blue-50 dark:bg-blue-900/10">
                    <td className="px-5 py-3">
                      <input name="name" className="input text-xs py-1" value={editForm.name} onChange={handleEdit} />
                      <input name="code" className="input text-xs py-1 mt-1" placeholder="Code" value={editForm.code} onChange={handleEdit} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <input name="credit_hours" type="number" min="0.5" max="12" step="0.5"
                        className="input text-xs py-1 w-16 text-center" value={editForm.credit_hours} onChange={handleEdit} />
                    </td>
                    <td className="px-4 py-3">
                      <select name="grade" className="input text-xs py-1" value={editForm.grade} onChange={handleEdit}>
                        {gradeOptions.map((g) => <option key={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-500 dark:text-gray-400">
                      {getGradePoint(editForm.grade, scale).toFixed(1)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => saveEdit(c.id)} disabled={saving}
                          className="text-xs px-2.5 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* ── Normal row ── */
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                      {c.code && <p className="text-xs text-gray-400 dark:text-gray-500">{c.code}</p>}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                      {c.credit_hours}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-900 dark:text-white">{c.grade}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                      {c.grade_point.toFixed(1)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(c)}
                          className="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400">
                          Edit
                        </button>
                        <button onClick={() => deleteCourse(c.id)}
                          className="text-xs px-2.5 py-1 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>

          {/* Summary row */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total: {totalCredits} credit hours
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              GPA: {formatGpa(semester.gpa)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
