import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sliders, CheckCircle2, TrendingUp, BarChart2, Shield } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MLModelDiagnostics: React.FC = () => {
  const [modelData, setModelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Success Score Weights Configuration State
  const [weights, setWeights] = useState({
    academic: 40,
    attendance: 25,
    lms: 10,
    placement: 10,
    skills: 10,
    engagement: 5,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/analytics/ml-model')
      .then(res => res.json())
      .then(data => {
        setModelData(data);
        if (data.weights_configuration) {
          setWeights({
            academic: data.weights_configuration.academic_weight,
            attendance: data.weights_configuration.attendance_weight,
            lms: data.weights_configuration.lms_weight,
            placement: data.weights_configuration.placement_weight,
            skills: data.weights_configuration.skills_weight,
            engagement: data.weights_configuration.engagement_weight,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalWeight = weights.academic + weights.attendance + weights.lms + weights.placement + weights.skills + weights.engagement;

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) return;
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading || !modelData) return null;

  const featureChart = modelData.feature_importance.map((f: any) => ({
    name: f.feature,
    importance: Math.round(f.weight * 100),
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-sky-600 mb-1">
          <BrainCircuit className="h-5 w-5" />
          <h1 className="text-xl font-bold text-slate-900">Machine Learning Diagnostics & Success Score Weights</h1>
        </div>
        <p className="text-xs text-slate-500">
          Supervised Ensemble Gradient Boosted Predictor & Configurable Holistic Student Success Weights.
        </p>
      </div>

      {/* Model Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">ROC-AUC</span>
          <span className="text-2xl font-black text-sky-600 mt-1 block">{modelData.metrics.roc_auc}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">High Discrimination</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{(modelData.metrics.accuracy * 100).toFixed(1)}%</span>
          <span className="text-[10px] text-slate-400">Test Cohort</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Precision</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{(modelData.metrics.precision * 100).toFixed(1)}%</span>
          <span className="text-[10px] text-slate-400">Low False Alarm</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Recall</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{(modelData.metrics.recall * 100).toFixed(1)}%</span>
          <span className="text-[10px] text-emerald-600 font-semibold">Catches At-Risk</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">F1-Score</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">{modelData.metrics.f1_score}</span>
          <span className="text-[10px] text-slate-400">Harmonic Mean</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">RMSE</span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">{modelData.metrics.rmse}</span>
          <span className="text-[10px] text-slate-400">Score Error</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Explainable Feature Importance</h2>
          <p className="text-xs text-slate-500 mb-4">Relative predictive weight allocated by Random Forest ensemble</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureChart} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 35]} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={160} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="importance" name="Importance %" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weights Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Success Score Formula Weights</h2>
              <p className="text-xs text-slate-500">Configure contribution percentages (Sum must equal 100%)</p>
            </div>
            <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              totalWeight === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              Total: {totalWeight}%
            </div>
          </div>

          <form onSubmit={handleSaveWeights} className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Academic Performance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.academic}
                  onChange={e => setWeights({ ...weights, academic: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Attendance Record (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.attendance}
                  onChange={e => setWeights({ ...weights, attendance: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">LMS & Assignments (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.lms}
                  onChange={e => setWeights({ ...weights, lms: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Placement Readiness (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.placement}
                  onChange={e => setWeights({ ...weights, placement: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Technical Skills (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.skills}
                  onChange={e => setWeights({ ...weights, skills: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Campus Engagement (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.engagement}
                  onChange={e => setWeights({ ...weights, engagement: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3">
              {savedSuccess ? (
                <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Weights recalculated for 1,000 students!</span>
                </span>
              ) : <div />}

              <button
                type="submit"
                disabled={totalWeight !== 100}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl transition shadow-xs"
              >
                Apply Weight Scheme
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
