import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Staff, StaffFeedback } from '../../types';
import { MessageSquare, Star, Shield, CheckCircle2, Send, History, Sparkles } from 'lucide-react';

export const StudentFeedbackView: React.FC = () => {
  const { user } = useAuth();
  const [departmentStaff, setDepartmentStaff] = useState<Staff[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<StaffFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Teaching clarity');
  const [comments, setComments] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'Identified' | 'Confidential'>('Identified');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categories = [
    'Teaching clarity',
    'Subject knowledge',
    'Doubt clarification',
    'Classroom engagement',
    'Timeliness of feedback',
    'Assignment guidance',
    'Overall teaching experience',
  ];

  useEffect(() => {
    // Fetch department staff
    const dept = user?.data?.department || user?.department || 'ALL';
    fetch(`/api/staff?department=${dept}`)
      .then(res => res.json())
      .then(data => {
        if (data.staff) {
          setDepartmentStaff(data.staff);
          if (data.staff.length > 0) setSelectedStaffId(data.staff[0].staff_id);
        }
      });

    // Fetch student's own feedback history
    fetch(`/api/feedback`)
      .then(res => res.json())
      .then(data => {
        if (data.feedbacks && user?.id) {
          const myFb = data.feedbacks.filter((f: StaffFeedback) => f.student_id === user.id);
          setFeedbackHistory(myFb);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !user?.id) return;
    setSubmitting(true);
    setSuccessMessage(null);

    const targetStaff = departmentStaff.find(s => s.staff_id === selectedStaffId);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          staff_id: selectedStaffId,
          subject: targetStaff?.assigned_subjects || 'Department Subject',
          rating,
          category,
          comments,
          improvement_suggestions: improvementSuggestions,
          privacy_mode: privacyMode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.feedback) {
        setFeedbackHistory(prev => [data.feedback, ...prev]);
        setSuccessMessage('Feedback submitted successfully. Thank you for your constructive evaluation!');
        setComments('');
        setImprovementSuggestions('');
      }
    } catch (err: any) {
      console.error('Feedback submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-sky-600 mb-1">
          <MessageSquare className="h-5 w-5" />
          <h1 className="text-xl font-bold text-slate-900">Student-to-Faculty Academic Feedback</h1>
        </div>
        <p className="text-xs text-slate-500">
          Provide constructive evaluations on faculty instruction, syllabus coverage, and classroom engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback Submission Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <span>Submit New Faculty Feedback</span>
          </h2>

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Faculty selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Department Faculty Member
              </label>
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {departmentStaff.map(st => (
                  <option key={st.staff_id} value={st.staff_id}>
                    {st.staff_name} ({st.staff_id}) — {st.assigned_subjects}
                  </option>
                ))}
              </select>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluation Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Rating Stars (1-5) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Performance Rating (1 to 5 Stars)
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 focus:outline-hidden transition"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating === 5 ? 'Excellent (5/5)' : rating === 4 ? 'Very Good (4/5)' : rating === 3 ? 'Satisfactory (3/5)' : rating === 2 ? 'Needs Improvement (2/5)' : 'Poor (1/5)'}
                </span>
              </div>
            </div>

            {/* Written comments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Written Feedback</label>
              <textarea
                required
                rows={3}
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Share your experience regarding instruction clarity, subject depth, and learning materials..."
                className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Improvement suggestions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Suggestions for Course Improvement (Optional)</label>
              <input
                type="text"
                value={improvementSuggestions}
                onChange={e => setImprovementSuggestions(e.target.value)}
                placeholder="E.g., Include more real-world problem sets or code walkthroughs"
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Privacy Mode */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="block text-xs font-semibold text-slate-700 mb-1">Privacy Mode</span>
              <div className="flex items-center space-x-6 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    value="Identified"
                    checked={privacyMode === 'Identified'}
                    onChange={() => setPrivacyMode('Identified')}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Identified (Visible to faculty advisor)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    value="Confidential"
                    checked={privacyMode === 'Confidential'}
                    onChange={() => setPrivacyMode('Confidential')}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Confidential (Student Roll No hidden from faculty)</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Faculty Feedback'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* My Submission History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm mb-4">
            <History className="h-4 w-4 text-sky-600" />
            <h2>My Feedback Submission History</h2>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400 text-center py-8">Loading history...</div>
          ) : feedbackHistory.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8">
              No feedback submissions logged yet.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {feedbackHistory.map(fb => (
                <div key={fb.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{fb.staff_name}</span>
                    <span className="flex items-center text-amber-500 font-bold">
                      <Star className="h-3 w-3 fill-amber-400 mr-1" />
                      {fb.rating}/5
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{fb.category} • {fb.subject}</div>
                  <p className="text-slate-700 italic">"{fb.comments}"</p>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px] text-slate-400">
                    <span>Mode: {fb.privacy_mode}</span>
                    <span>{fb.created_at}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
