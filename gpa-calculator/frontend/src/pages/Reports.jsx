// src/pages/Reports.jsx — charts, grade distribution, export

import { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { formatGpa, classifyGpa } from "../utils/gpa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import toast from "react-hot-toast";

const PIE_COLORS = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#65a30d"];

export default function Reports() {
  const { user }  = useAuth();
  const scale     = user?.grading_scale || "4.0";
  const maxScale  = scale === "7.0" ? 7 : scale === "5.0" ? 5 : 4;

  const [stats,   setStats]   = useState(null);
  const [trend,   setTrend]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/stats/dashboard"), api.get("/stats/trend")])
      .then(([s, t]) => { setStats(s.data); setTrend(t.data); })
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get("/stats/export/csv", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = "gpa_report.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = () => {
    // jsPDF client-side generation
    import("jspdf").then(({ default: jsPDF }) => {
      const doc     = new jsPDF();
      const name    = user?.full_name || "";
      const program = user?.program   || "";
      const uni     = user?.university|| "";

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Academic Transcript", 14, 20);

      // Student info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Student: ${name}`,     14, 32);
      doc.text(`Program: ${program}`,  14, 38);
      doc.text(`University: ${uni}`,   14, 44);
      doc.text(`Grading Scale: ${scale}`, 14, 50);
      doc.text(`CGPA: ${formatGpa(stats?.cgpa)}`, 14, 56);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 62);

      // Trend table
      let y = 74;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("GPA Trend by Semester", 14, y);
      y += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Semester",       14,  y);
      doc.text("GPA",           100,  y);
      doc.text("CGPA",          140,  y);
      doc.text("Total Credits", 165,  y);
      y += 5;
      doc.line(14, y, 196, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      trend.forEach((row) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(row.semester,              14,  y);
        doc.text(String(row.semester_gpa), 100,  y);
        doc.text(String(row.cgpa),         140,  y);
        doc.text(String(row.total_credits),165,  y);
        y += 6;
      });

      doc.save("gpa_report.pdf");
      toast.success("PDF downloaded");
    });
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"/></div>;
  if (!stats)  return null;

  const classification = classifyGpa(stats.cgpa, scale);

  // Grade distribution pie data
  const pieData = Object.entries(stats.grade_distribution || {}).map(([grade, count]) => ({
    name: grade, value: count,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-header">Reports</h1>
        <div className="flex gap-3">
          <button onClick={exportCSV} disabled={exporting} className="btn-secondary text-sm">
            {exporting ? "…" : "Export CSV"}
          </button>
          <button onClick={exportPDF} className="btn-primary text-sm">
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CGPA</p>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{formatGpa(stats.cgpa)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">out of {maxScale}.00</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classification</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">{classification.cls}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{classification.desc}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Credits</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_credits}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Courses</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_courses}</p>
        </div>
      </div>

      {/* GPA trend line chart */}
      {trend.length > 0 && (
        <div className="card p-5">
          <h2 className="section-header mb-4">GPA Over Time</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
              <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, maxScale]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="semester_gpa" name="Semester GPA"
                stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="cgpa" name="CGPA"
                stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPA bar chart */}
        {trend.length > 0 && (
          <div className="card p-5">
            <h2 className="section-header mb-4">Semester GPA Comparison</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
                <XAxis dataKey="semester" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, maxScale]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="semester_gpa" name="GPA" fill="#2563eb" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Grade distribution pie */}
        {pieData.length > 0 && (
          <div className="card p-5">
            <h2 className="section-header mb-4">Grade Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75}
                  dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Semester breakdown table */}
      {stats.semesters.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="section-header">Semester Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 font-medium">Semester</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Courses</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Credits</th>
                <th className="text-right px-5 py-3 font-medium">GPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.semesters.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">{s.course_count}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">{s.total_credits}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatGpa(s.gpa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
