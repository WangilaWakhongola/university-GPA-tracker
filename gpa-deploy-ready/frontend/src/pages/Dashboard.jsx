// src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { formatGpa, classifyGpa } from "../utils/gpa";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

const BADGE_MAP = {
  green:  "badge-green",
  blue:   "badge-blue",
  yellow: "badge-yellow",
  orange: "badge-orange",
  red:    "badge-red",
  gray:   "badge-gray",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,  setStats]  = useState(null);
  const [trend,  setTrend]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          api.get("/stats/dashboard"),
          api.get("/stats/trend"),
        ]);
        setStats(sRes.data);
        setTrend(tRes.data);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Skeleton />;
  if (!stats)  return null;

  const classification = classifyGpa(stats.cgpa, user?.grading_scale || "4.0");
  const badgeCls = BADGE_MAP[classification.color] || "badge-gray";
  const maxScale = user?.grading_scale === "7.0" ? 7 : user?.grading_scale === "5.0" ? 5 : 4;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Greeting */}
      <div>
        <h1 className="page-header">
          Good {greeting()}, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here's your academic overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current CGPA" value={formatGpa(stats.cgpa)} sub={`out of ${maxScale}.00`} highlight />
        <StatCard label="Semesters"     value={stats.total_semesters} sub="completed" />
        <StatCard label="Total Credits" value={stats.total_credits}   sub="credit hours" />
        <StatCard label="Courses"        value={stats.total_courses}   sub="total courses" />
      </div>

      {/* Classification banner */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Grade Classification
          </p>
          <div className="flex items-center gap-3">
            <span className={`${badgeCls} text-sm px-3 py-1`}>
              {classification.cls}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {classification.desc}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Grading scale: {user?.grading_scale || "4.0"}
          </p>
          {user?.program && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.program}</p>
          )}
        </div>
      </div>

      {/* GPA trend chart */}
      {trend.length > 0 && (
        <div className="card p-5">
          <h2 className="section-header mb-4">GPA Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
              <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, maxScale]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone" dataKey="semester_gpa" name="Semester GPA"
                stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="cgpa" name="CGPA"
                stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent semesters */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="section-header">Recent Semesters</h2>
          <Link to="/semesters" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
            View all
          </Link>
        </div>
        {stats.semesters.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No semesters yet.{" "}
            <Link to="/semesters" className="text-primary-600 dark:text-primary-400 hover:underline">
              Add your first semester
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3 font-medium">Semester</th>
                <th className="text-center px-5 py-3 font-medium hidden sm:table-cell">Courses</th>
                <th className="text-center px-5 py-3 font-medium hidden sm:table-cell">Credits</th>
                <th className="text-right px-5 py-3 font-medium">GPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[...stats.semesters].reverse().slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                    {s.course_count}
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                    {s.total_credits}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold ${gpaColor(s.gpa, maxScale)}`}>
                      {formatGpa(s.gpa)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function gpaColor(gpa, max) {
  const ratio = gpa / max;
  if (ratio >= 0.85) return "text-green-600 dark:text-green-400";
  if (ratio >= 0.65) return "text-blue-600 dark:text-blue-400";
  if (ratio >= 0.50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function StatCard({ label, value, sub, highlight = false }) {
  return (
    <div className="stat-card">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold ${highlight ? "text-primary-600 dark:text-primary-400" : "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
  );
}
