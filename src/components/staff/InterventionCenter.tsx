import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Intervention, Student } from '../../types';
import { AlertTriangle, PlusCircle, CheckCircle2, Clock, MessageSquare, ChevronRight, Filter } from 'lucide-react';

export const InterventionCenter: React.FC = () => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [departmentStudents, setDepartmentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // New intervention modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reason, setReason] = useState('Critical attendance drop (<65%) requiring counseling');
  const [indicator, setIndicator] = useState('Low attendance');
  const [action, setAction] = useState('Mandatory academic advisory meeting with guardian notification');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  // Filter
  const [statusFilter, setStatusFilter] = useState('ALL');

  const dept = user?.department || 'CSE';

  const fetchInterventions = () => {
    fetch(`/api/interventions?department=${dept}`)
      .then(res => res.json())
      .then(data => {
        if (data.interventions) setInterventions(data.interventions);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInterventions();
    fetch(`/api/students?department=${dept}&limit=200`)
      .then(res => res.json())
      .then(data => {
        if (data.students) {
          setDepartmentStudents(data.students);
          if (data.students.length > 0) setSelectedStudentId(data.students[0].student_id);
        }
      });
  }, [dept]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const res = await fetch('/api/interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: selectedStudentId,
        reason,
        indicator,
        recommended_action: action,
        priority,
        assigned_staff_name: user?.name || 'Department Faculty Advisor',
      }),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchInterventions();
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'In Progress' | 'Completed' | 'Closed') => {
    const res = await fetch(`/api/interventions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        note: `Status updated to ${newStatus} by faculty advisor`,
      }),
    });
    if (res.ok) fetchInterventions();
  };

  const filtered = interventions.filter(i => {
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h1 className="text-xl font-bold text-slate-900">Student Academic Intervention Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track, assign, and resolve targeted faculty mentoring actions for students requiring support.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center space-x-1.5 self-start md:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Academic Intervention</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        {['ALL', 'New', 'In Progress', 'Completed', 'Closed'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              statusFilter === st ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {st === 'ALL' ? 'All Interventions' : st}
          </button>
        ))}
      </div>

      {/* Interventions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(int => (
          <div key={int.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  int.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {int.priority} Priority
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  int.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : int.status === 'In Progress' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {int.status}
                </span>
              </div>

              <div className="mt-2">
                <h3 className="font-bold text-slate-900 text-sm">{int.student_name}</h3>
                <span className="font-mono text-xs text-slate-500">{int.student_id} • {int.department}</span>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="font-semibold text-slate-700">Reason:</div>
                <div className="text-slate-600 italic">"{int.reason}"</div>
                <div className="text-[11px] text-slate-500 pt-1">Indicator: {int.indicator}</div>
              </div>

              <div className="mt-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Recommended Action: </span>
                {int.recommended_action}
              </div>

              {int.notes && int.notes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  Latest Note: {int.notes[int.notes.length - 1]}
                </div>
              )}
            </div>

            {/* Status change actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">Assigned: {int.assigned_staff_name}</span>

              <div className="flex space-x-1">
                {int.status !== 'In Progress' && int.status !== 'Completed' && (
                  <button
                    onClick={() => handleStatusUpdate(int.id, 'In Progress')}
                    className="px-2 py-1 text-[10px] font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                  >
                    Start
                  </button>
                )}
                {int.status !== 'Completed' && (
                  <button
                    onClick={() => handleStatusUpdate(int.id, 'Completed')}
                    className="px-2 py-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4">Create Student Academic Intervention</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Student</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white"
                >
                  {departmentStudents.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.student_id} — {s.student_name} (Risk: {s.risk_level}, Mid1: {s.mid_1_marks}/15)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Intervention Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Academic Indicator</label>
                <input
                  type="text"
                  required
                  value={indicator}
                  onChange={e => setIndicator(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recommended Action</label>
                <textarea
                  rows={2}
                  required
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
                >
                  Create Support Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
