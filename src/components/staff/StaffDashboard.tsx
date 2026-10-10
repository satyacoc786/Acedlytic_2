import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import {
  Users,
  Clock,
  Award,
  AlertTriangle,
  ClipboardCheck,
  FileSpreadsheet,
  PlusCircle,
  TrendingUp,
  Search,
  ExternalLink,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface StaffDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenAttendance: () => void;
  onOpenMarks: (student?: Student) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onNavigate,
  onOpenAttendance,
  onOpenMarks,
}) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const dept = user?.department || 'CSE';

  useEffect(() => {
    fetch(`/api/students?department=${dept}&limit=200`)
      .then(res => res.json())
      .then(data => {
        if (data.students) setStudents(data.students);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dept]);

  const totalStudents = students.length;
  const avgAttendance = totalStudents > 0 ? +(students.reduce((acc, s) => acc + s.attendance_pct, 0) / totalStudents).toFixed(1) : 75;
  const avgSuccessScore = totalStudents > 0 ? +(students.reduce((acc, s) => acc + s.success_score, 0) / totalStudents).toFixed(1) : 65;
  const highRiskStudents = students.filter(s => s.risk_level === 'High');
  const moderateRiskStudents = students.filter(s => s.risk_level === 'Moderate');
  const lowRiskStudents = students.filter(s => s.risk_level === 'Low');

  const riskPieData = [
    { name: 'Low Risk', value: lowRiskStudents.length, color: '#10b981' },
    { name: 'Moderate', value: moderateRiskStudents.length, color: '#f59e0b' },
    { name: 'High Risk (Priority)', value: highRiskStudents.length, color: '#ef4444' },
  ];

  const handleExportBranch = () => {
    window.location.href = `/api/excel/export/students`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Faculty Department Console</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
              Department: {dept}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Faculty Member: <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.id}) • Designation: {user?.designation || 'Lecturer'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAttendance}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => onOpenMarks()}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition flex items-center space-x-1.5"
          >
            <Award className="h-4 w-4 text-sky-600" />
            <span>Input Examination Marks</span>
          </button>

          <button
            onClick={handleExportBranch}
            className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Branch XLSX</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Authorized Students</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-2 block">{totalStudents}</span>
            <p className="text-[11px] text-slate-500 mt-1">Enrolled in {dept} branch</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Average Attendance</span>
            <span className={`text-3xl font-extrabold mt-2 block ${avgAttendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {avgAttendance}%
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Across all semester classes</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Branch Success Rate</span>
            <span className="text-3xl font-extrabold text-purple-600 mt-2 block">{avgSuccessScore}%</span>
            <p className="text-[11px] text-slate-500 mt-1">Cohort average predictive success</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Priority Support Alerts</span>
            <span className="text-3xl font-extrabold text-rose-600 mt-2 block">{highRiskStudents.length}</span>
            <p className="text-[11px] text-slate-500 mt-1">Students requiring review</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts & At-Risk Roster Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Academic Risk Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">{dept} Student Segmentation</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {riskPieData.map((d, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                </span>
                <span className="font-bold text-slate-900">{d.value} students</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Academic Support Roster */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Immediate Attention Roster (Priority Review)</h2>
                <p className="text-xs text-slate-500">Students with low attendance or critical Mid marks</p>
              </div>
              <button
                onClick={() => onNavigate('interventions')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
              >
                <span>Manage Interventions</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3 py-2.5">Roll No</th>
                    <th className="px-3 py-2.5">Student Name</th>
                    <th className="px-3 py-2.5 text-center">Attendance</th>
                    <th className="px-3 py-2.5 text-center">Mid 1 / 15</th>
                    <th className="px-3 py-2.5 text-center">Mid 2 / 15</th>
                    <th className="px-3 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {highRiskStudents.slice(0, 6).map(s => (
                    <tr key={s.student_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{s.student_id}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{s.student_name}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-bold ${s.attendance_pct < 65 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {s.attendance_pct}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-700">{s.mid_1_marks}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-700">{s.mid_2_marks}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => onOpenMarks(s)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                        >
                          Update Marks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <button
              onClick={() => onNavigate('directory')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              View Full Branch Directory →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
