import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { BarChart3, Award, CheckCircle2, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const StudentMarks: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(user?.data || null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/students/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setStudent(data);
        });
    }
  }, [user?.id]);

  if (!student) return null;

  // Simulate subject marks based on student's overall performance
  const subjects = [
    { code: `${student.department}301`, name: 'Core Foundations & Architecture', m1: student.mid_1_marks, m2: student.mid_2_marks, internal: Math.min(100, Math.round(student.internal_marks * 1.02)), grade: student.cgpa >= 8 ? 'A+' : student.cgpa >= 7 ? 'A' : 'B' },
    { code: `${student.department}302`, name: 'Advanced Algorithms & Analysis', m1: Math.max(0, Math.min(15, student.mid_1_marks - 1)), m2: Math.max(0, Math.min(15, student.mid_2_marks + 1)), internal: Math.min(100, Math.round(student.internal_marks * 0.96)), grade: student.cgpa >= 8 ? 'A' : 'B+' },
    { code: `${student.department}303`, name: 'System Design & Distributed Data', m1: Math.max(0, Math.min(15, student.mid_1_marks + 1)), m2: Math.max(0, Math.min(15, student.mid_2_marks - 1)), internal: Math.min(100, Math.round(student.internal_marks * 1.05)), grade: student.cgpa >= 7 ? 'A' : 'B' },
    { code: `${student.department}304`, name: 'Professional Elective & Practice', m1: student.mid_1_marks, m2: Math.max(0, Math.min(15, student.mid_2_marks + 2)), internal: Math.min(100, Math.round(student.internal_marks * 1.01)), grade: student.cgpa >= 8 ? 'A+' : 'A' },
  ];

  const chartData = subjects.map(s => ({
    name: s.code,
    'MID-1 (Max 15)': s.m1,
    'MID-2 (Max 15)': s.m2,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Examination & Marks Record</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official Mid-term evaluations (Max 15 per exam) and continuous internal assessment
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500">Cumulative CGPA: </span>
            <span className="font-bold text-slate-900">{student.cgpa} / 10.0</span>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500">Backlogs: </span>
            <span className={`font-bold ${student.backlogs > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {student.backlogs}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">MID-1 Assessment</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-sky-600">{student.mid_1_marks}</span>
            <span className="text-xs font-semibold text-slate-400">/ 15 Maximum</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Percentage: {((student.mid_1_marks / 15) * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">MID-2 Assessment</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-cyan-600">{student.mid_2_marks}</span>
            <span className="text-xs font-semibold text-slate-400">/ 15 Maximum</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Percentage: {((student.mid_2_marks / 15) * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Internal Assessment</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-purple-600">{student.internal_marks}</span>
            <span className="text-xs font-semibold text-slate-400">/ 100 Continuous</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Based on assignments, lab tests, and attendance</p>
        </div>
      </div>

      {/* Chart: Mid-1 vs Mid-2 comparison */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Subject-wise MID-1 vs MID-2 Progression</h2>
            <p className="text-xs text-slate-500">Comparison across enrolled course modules</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 15]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="MID-1 (Max 15)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="MID-2 (Max 15)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900">Enrolled Semester Subject Breakdown</h2>
          <span className="text-xs text-slate-500">Semester {student.semester} • Regulation 2023</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Subject Code</th>
                <th className="px-4 py-3">Course Title</th>
                <th className="px-4 py-3 text-center">MID-1 (15)</th>
                <th className="px-4 py-3 text-center">MID-2 (15)</th>
                <th className="px-4 py-3 text-center">Internal (100)</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{sub.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{sub.name}</td>
                  <td className="px-4 py-3 text-center font-bold text-sky-600">{sub.m1}</td>
                  <td className="px-4 py-3 text-center font-bold text-cyan-600">{sub.m2}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{sub.internal}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800">
                      {sub.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Passed</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
