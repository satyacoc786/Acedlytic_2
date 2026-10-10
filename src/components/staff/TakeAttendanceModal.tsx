import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { X, Check, CheckCircle2, UserX, UserCheck, Calendar, Users, Save } from 'lucide-react';

interface TakeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TakeAttendanceModal: React.FC<TakeAttendanceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent'>>({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [yearFilter, setYearFilter] = useState('3rd Year');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const dept = user?.department || 'CSE';

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/students?department=${dept}&limit=200`)
        .then(res => res.json())
        .then(data => {
          if (data.students) {
            setStudents(data.students);
            // Default everyone to present
            const initial: Record<string, 'Present' | 'Absent'> = {};
            data.students.forEach((s: Student) => {
              initial[s.student_id] = 'Present';
            });
            setAttendanceMap(initial);
          }
        });
    }
  }, [isOpen, dept]);

  const targetStudents = students.filter(s => s.year_of_study === yearFilter);

  const toggleStatus = (id: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [id]: prev[id] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const markAll = (status: 'Present' | 'Absent') => {
    const updated = { ...attendanceMap };
    targetStudents.forEach(s => {
      updated[s.student_id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const records = targetStudents.map(s => ({
      student_id: s.student_id,
      status: attendanceMap[s.student_id] || 'Present',
    }));

    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: dept,
          year: yearFilter,
          date,
          records,
          staff_name: user?.name,
        }),
      });

      if (res.ok) {
        setSuccessToast(true);
        setTimeout(() => {
          setSuccessToast(false);
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to submit attendance session:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const presentCount = targetStudents.filter(s => attendanceMap[s.student_id] === 'Present').length;
  const absentCount = targetStudents.length - presentCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              <span>Record Daily Classroom Attendance</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized Branch: <span className="font-bold text-slate-800">{dept}</span> • Staff: {user?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Row */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Session Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Study Year</label>
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => markAll('Present')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100 transition"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('Absent')}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Summary counter */}
        <div className="px-5 py-2.5 bg-sky-50/50 border-b border-sky-100 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600">Total Enrolled: {targetStudents.length}</span>
          <div className="flex space-x-4">
            <span className="text-emerald-700">Present: {presentCount}</span>
            <span className="text-rose-700">Absent: {absentCount}</span>
          </div>
        </div>

        {/* Student Roster */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {targetStudents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No students found in {dept} ({yearFilter}).
            </div>
          ) : (
            targetStudents.map(s => {
              const isPresent = attendanceMap[s.student_id] !== 'Absent';
              return (
                <div
                  key={s.student_id}
                  onClick={() => toggleStatus(s.student_id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isPresent
                      ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                      : 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-900 text-xs">{s.student_id}</span>
                    <span className="font-semibold text-slate-800 text-xs">{s.student_name}</span>
                    <span className="text-[11px] text-slate-400">Cur: {s.attendance_pct}%</span>
                  </div>

                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    {isPresent ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Present</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-3.5 w-3.5" />
                        <span>Absent</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Attendance updates immediately persist to database & recalculate Student Success Scores.
          </span>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting || targetStudents.length === 0}
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Saving...' : 'Submit Attendance Session'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
