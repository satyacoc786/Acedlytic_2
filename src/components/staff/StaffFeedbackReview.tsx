import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StaffFeedback } from '../../types';
import { MessageSquare, Star, Shield, ThumbsUp, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const StaffFeedbackReview: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<StaffFeedback[]>([]);
  const [avgRating, setAvgRating] = useState(4.8);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/feedback?staff_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.feedbacks) {
            setFeedbacks(data.feedbacks);
            setAvgRating(data.avgRating || 4.8);
            setCategoryBreakdown(data.categoryBreakdown || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-sky-600" />
            <h1 className="text-xl font-bold text-slate-900">Faculty Teaching Feedback & Evaluation</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Student evaluations submitted for {user?.name} ({user?.id}) • {user?.assigned_subjects}
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Average Student Rating</div>
            <div className="text-xl font-black text-slate-900 leading-tight">
              {avgRating} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Category Rating Scores</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown across instructional criteria</p>

          <div className="space-y-3">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((cat, i) => (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{cat.category}</span>
                    <span className="font-bold text-slate-900">{cat.avg} / 5</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${(cat.avg / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">
                Teaching clarity: 4.8 • Doubt clarification: 4.6 • Engagement: 4.7
              </div>
            )}
          </div>
        </div>

        {/* Written comments list */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Student Feedback Comments</h2>
          <p className="text-xs text-slate-500 mb-4">
            Confidential evaluations protect the student's Roll Number as per campus privacy policy.
          </p>

          <div className="space-y-3 max-h-[450px] overflow-y-auto">
            {feedbacks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No individual feedback records received yet.
              </div>
            ) : (
              feedbacks.map(fb => (
                <div key={fb.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">
                        {fb.privacy_mode === 'Confidential' ? 'Anonymous Enrolled Student' : `Student (${fb.student_id})`}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        fb.privacy_mode === 'Confidential' ? 'bg-slate-200 text-slate-700' : 'bg-sky-100 text-sky-700'
                      }`}>
                        {fb.privacy_mode}
                      </span>
                    </div>

                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 mr-1" />
                      <span>{fb.rating} / 5</span>
                    </div>
                  </div>

                  <p className="text-slate-800 italic">"{fb.comments}"</p>

                  {fb.improvement_suggestions && (
                    <div className="text-[11px] text-sky-700 bg-sky-50 p-2 rounded-lg">
                      <span className="font-semibold">Suggestion: </span>
                      {fb.improvement_suggestions}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                    <span>Category: {fb.category}</span>
                    <span>Submitted on: {fb.created_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
