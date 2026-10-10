import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Clock,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Download,
  BarChart3,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/institution')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 text-xs animate-pulse">Loading college-wide institutional analytics...</div>
      </div>
    );
  }

  const riskPie = [
    { name: 'Low Concern (On Track)', value: data.riskCounts.Low, color: '#10b981' },
    { name: 'Moderate Concern', value: data.riskCounts.Moderate, color: '#f59e0b' },
    { name: 'Priority Faculty Review', value: data.riskCounts.High, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Institution Executive Analytics Console</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
              Campus-wide Scope
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Holistic data aggregation across {data.totalStudents} enrolled students, {data.totalStaff} staff members, and {data.departmentsCount} departments.
          </p>
        </div>

        {/* Quick Exports */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/excel/export/students"
            className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center space-x-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Export Students XLSX</span>
          </a>
          <a
            href="/api/excel/export/staff"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1.5"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Staff XLSX</span>
          </a>
          <button
            onClick={() => onNavigate('import-center')}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel Data Import Center</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Students</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-2 block">{data.totalStudents}</span>
            <p className="text-[11px] text-slate-500 mt-1">{data.departmentsCount} academic departments</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Campus Avg Attendance</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">{data.avgAttendance}%</span>
            <p className="text-[11px] text-slate-500 mt-1">Across 290 instructional days</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Campus Success Score</span>
            <span className="text-3xl font-extrabold text-purple-600 mt-2 block">{data.avgSuccessScore}</span>
            <p className="text-[11px] text-slate-500 mt-1">Holistic 6-factor composite</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Priority Support Roster</span>
            <span className="text-3xl font-extrabold text-rose-600 mt-2 block">{data.riskCounts.High}</span>
            <p className="text-[11px] text-slate-500 mt-1">Active faculty interventions: {data.openInterventions}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Charts: Department Comparisons & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Success & Attendance Comparison */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Department Performance & Attendance Comparison</h2>
              <p className="text-xs text-slate-500">Cross-branch benchmarks across all faculties</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="avgSuccessScore" name="Avg Success Score" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgAttendance" name="Avg Attendance %" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgPlacement" name="Placement Readiness %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Campus Risk Stratification</h2>
            <p className="text-xs text-slate-500 mb-4">Total 1,000 students categorized</p>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              {riskPie.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value} students</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Success Score Buckets & Student Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Buckets */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Student Success Rate & Score Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Institution population counts per predictive success tier</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.scoreBuckets} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="range" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={140} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" name="Students" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Placement Segments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Targeted Student Action Segments</h2>
          <p className="text-xs text-slate-500 mb-4">Unsupervised clustering and heuristic rules</p>

          <div className="space-y-3">
            {data.segmentStats.map((seg: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{seg.name}</span>
                <span className="font-bold text-sky-700 bg-sky-100/60 px-2.5 py-0.5 rounded-full">
                  {seg.value} students
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
