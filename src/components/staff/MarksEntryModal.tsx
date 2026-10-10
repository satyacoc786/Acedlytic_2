import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { X, Award, CheckCircle2, AlertCircle, Save, TrendingUp } from 'lucide-react';

interface MarksEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSuccess: () => void;
}

export const MarksEntryModal: React.FC<MarksEntryModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [departmentStudents, setDepartmentStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(student?.student_id || '');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(student || null);

  const [mid1, setMid1] = useState(student ? student.mid_1_marks : 10);
  const [mid2, setMid2] = useState(student ? student.mid_2_marks : 10);
  const [internal, setInternal] = useState(student ? student.internal_marks : 60);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dept = user?.department || 'CSE';

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/students?department=${dept}&limit=200`)
        .then(res => res.json())
        .then(data => {
          if (data.students) {
            setDepartmentStudents(data.students);
            if (!student && data.students.length > 0) {
              setSelectedStudentId(data.students[0].student_id);
              setCurrentStudent(data.students[0]);
              setMid1(data.students[0].mid_1_marks);
              setMid2(data.students[0].mid_2_marks);
              setInternal(data.students[0].internal_marks);
            }
          }
        });
    }
  }, [isOpen, dept, student]);

  useEffect(() => {
    if (student) {
      setSelectedStudentId(student.student_id);
      setCurrentStudent(student);
      setMid1(student.mid_1_marks);
      setMid2(student.mid_2_marks);
      setInternal(student.internal_marks);
    }
  }, [student]);

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    const target = departmentStudents.find(s => s.student_id === id);
    if (target) {
      setCurrentStudent(target);
      setMid1(target.mid_1_marks);
      setMid2(target.mid_2_marks);
      setInternal(target.internal_marks);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Enforce prompt constraint: MID marks max 15
    if (mid1 < 0 || mid1 > 15) {
      setValidationError('MID-1 marks must be between 0 and 15');
      return;
    }
    if (mid2 < 0 || mid2 > 15) {
      setValidationError('MID-2 marks must be between 0 and 15');
      return;
    }
    if (internal < 0 || internal > 100) {
      setValidationError('Internal marks must be between 0 and 100');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/marks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          mid_1_marks: mid1,
          mid_2_marks: mid2,
          internal_marks: internal,
          staff_name: user?.name,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        setValidationError(err.error || 'Failed to update marks');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Award className="h-5 w-5 text-sky-600" />
              <span>Input Examination & Mid Marks</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly normalized: Maximum 15 marks for Mid-1 & Mid-2 evaluations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Student Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Student in {dept} Branch
            </label>
            <select
              value={selectedStudentId}
              onChange={e => handleStudentChange(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              {departmentStudents.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.student_id} — {s.student_name} ({s.year_of_study}, Sem {s.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Marks input fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MID-1 Examination Marks <span className="text-sky-600 font-bold">(Max 15)</span>
              </label>
              <input
                type="number"
                min="0"
                max="15"
                step="0.5"
                required
                value={mid1}
                onChange={e => setMid1(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Scale: 0 to 15.0</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MID-2 Examination Marks <span className="text-cyan-600 font-bold">(Max 15)</span>
              </label>
              <input
                type="number"
                min="0"
                max="15"
                step="0.5"
                required
                value={mid2}
                onChange={e => setMid2(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Scale: 0 to 15.0</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Assessment Marks <span className="text-purple-600 font-bold">(Max 100)</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={internal}
              onChange={e => setInternal(Number(e.target.value))}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
            />
          </div>

          {/* Real-time recalculated preview */}
          {currentStudent && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-semibold text-slate-700 block">Immediate Recalculation Impact:</span>
              <div className="flex justify-between text-slate-600">
                <span>Mid Normalized Average:</span>
                <span className="font-bold text-sky-600">
                  {((((mid1 + mid2) / 30) * 100)).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Predicted Student Success Rate:</span>
                <span className="font-bold text-sky-600">{currentStudent.success_rate || currentStudent.success_score}%</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Saving...' : 'Update & Recalculate Scores'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
