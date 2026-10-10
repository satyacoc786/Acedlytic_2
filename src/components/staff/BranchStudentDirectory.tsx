import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { Search, Filter, Award, Clock, AlertTriangle, CheckCircle2, Edit3, User } from 'lucide-react';

interface BranchStudentDirectoryProps {
  onEditStudentMarks: (student: Student) => void;
}

export const BranchStudentDirectory: React.FC<BranchStudentDirectoryProps> = ({ onEditStudentMarks }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [segmentFilter, setSegmentFilter] = useState('ALL');

  const dept = user?.department || 'CSE';

  useEffect(() => {
    fetch(`/api/students?department=${dept}&limit=300`)
      .then(res => res.json())
      .then(data => {
        if (data.students) setStudents(data.students);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dept]);

  const filtered = students.filter(s => {
    if (yearFilter !== 'ALL' && s.year_of_study !== yearFilter) return false;
    if (riskFilter !== 'ALL' && s.risk_level !== riskFilter) return false;
    if (segmentFilter !== 'ALL' && !s.academic_placement_segment.includes(segmentFilter)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return s.student_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Department Student Directory</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
              Branch: {dept}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforcing strict branch authorization. Showing {filtered.length} of {students.length} students in {dept}.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or Roll No..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition w-64"
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Filters:</span>
        </div>

        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 focus:bg-white"
        >
          <option value="ALL">All Study Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>

        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 focus:bg-white"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="High">High Risk (Priority)</option>
          <option value="Moderate">Moderate Concern</option>
          <option value="Low">Low Concern (On Track)</option>
        </select>

        <select
          value={segmentFilter}
          onChange={e => setSegmentFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 focus:bg-white"
        >
          <option value="ALL">All Academic Segments</option>
          <option value="Attendance support">Attendance support</option>
          <option value="low placement readiness">Low placement readiness</option>
          <option value="Strong academics">Strong academics</option>
          <option value="Balanced development">Balanced development</option>
        </select>

        <div className="ml-auto text-slate-400 font-mono">
          Matching: {filtered.length} students
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading department students...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No students match current filter criteria.</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center">Year / Sem</th>
                  <th className="px-4 py-3 text-center">MID-1 (15)</th>
                  <th className="px-4 py-3 text-center">MID-2 (15)</th>
                  <th className="px-4 py-3 text-center">Attendance %</th>
                  <th className="px-4 py-3 text-center">CGPA</th>
                  <th className="px-4 py-3 text-center">Success Rate</th>
                  <th className="px-4 py-3 text-center">Risk Level</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => (
                  <tr key={s.student_id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{s.student_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{s.student_name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{s.academic_placement_segment}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {s.year_of_study} (S{s.semester})
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-sky-600">{s.mid_1_marks}</td>
                    <td className="px-4 py-3 text-center font-bold text-cyan-600">{s.mid_2_marks}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${s.attendance_pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {s.attendance_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{s.cgpa}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        {s.success_rate || s.success_score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.risk_level === 'High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : s.risk_level === 'Moderate'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onEditStudentMarks(s)}
                        title="Edit Examination Marks"
                        className="px-2.5 py-1 text-[11px] font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition inline-flex items-center space-x-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit Marks</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
