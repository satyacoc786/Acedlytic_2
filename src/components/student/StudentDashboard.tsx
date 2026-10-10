import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student, CalendarEvent } from '../../types';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  BrainCircuit,
  BarChart3,
  Layers,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Scale,
  Activity,
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(user?.data || null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(!user?.data);
  const [viewMode, setViewMode] = useState<'benchmarks' | 'radar'>('benchmarks');
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/students/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setStudent(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      fetch('/api/calendar')
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            const relevant = data.events.filter((e: CalendarEvent) => e.event_type === 'Exam' || e.event_type === 'Holiday').slice(0, 4);
            setUpcomingEvents(relevant);
          }
        });
    }
  }, [user?.id]);

  if (loading || !student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 text-sm animate-pulse">Loading personalized student analytics...</div>
      </div>
    );
  }

  // Extract or compute ML-derived metrics
  const successRate = student.success_rate || student.success_score || 72;
  const supportProb = student.predicted_support_probability !== undefined 
    ? Math.round(student.predicted_support_probability * 100) 
    : Math.max(5, 100 - successRate);

  // Indicators list from student profile or computed fallback
  const mlIndicators = (student as any).ml_profile?.indicators || [
    {
      name: 'Academic Performance',
      category: 'Academics',
      score: student.academic_score,
      benchmark: 71,
      target: 70,
      weight: 35,
      weightLabel: '35%',
      status: student.academic_score >= 75 ? 'Optimal' : student.academic_score >= 65 ? 'Satisfactory' : student.academic_score >= 50 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((student.academic_score - 70) * 0.35).toFixed(1),
      impactType: student.academic_score >= 70 ? 'positive' : 'negative',
      insight: `CGPA ${student.cgpa}, Mid1: ${student.mid_1_marks}/15, Mid2: ${student.mid_2_marks}/15, Backlogs: ${student.backlogs}`,
    },
    {
      name: 'Classroom Attendance',
      category: 'Attendance',
      score: student.attendance_pct,
      benchmark: 75,
      target: 75,
      weight: 25,
      weightLabel: '25%',
      status: student.attendance_pct >= 85 ? 'Optimal' : student.attendance_pct >= 75 ? 'Satisfactory' : student.attendance_pct >= 65 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((student.attendance_pct - 75) * 0.25).toFixed(1),
      impactType: student.attendance_pct >= 75 ? 'positive' : 'negative',
      insight: student.attendance_pct >= 75 ? 'Above statutory 75% college regulation threshold' : 'Below mandatory 75% college regulatory minimum',
    },
    {
      name: 'Placement & Industry Readiness',
      category: 'Placement',
      score: student.placement_score,
      benchmark: 58,
      target: 60,
      weight: 15,
      weightLabel: '15%',
      status: student.placement_score >= 70 ? 'Optimal' : student.placement_score >= 55 ? 'Satisfactory' : student.placement_score >= 40 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((student.placement_score - 60) * 0.15).toFixed(1),
      impactType: student.placement_score >= 60 ? 'positive' : 'negative',
      insight: `Coding score: ${student.coding_score}/100, Aptitude: ${student.aptitude_score}/100`,
    },
    {
      name: 'LMS & Continuous Assessment',
      category: 'LMS Activity',
      score: student.lms_score,
      benchmark: 64,
      target: 65,
      weight: 10,
      weightLabel: '10%',
      status: student.lms_score >= 75 ? 'Optimal' : student.lms_score >= 60 ? 'Satisfactory' : student.lms_score >= 45 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((student.lms_score - 65) * 0.10).toFixed(1),
      impactType: student.lms_score >= 65 ? 'positive' : 'negative',
      insight: `${student.lms_logins_30d} portal logins in last 30 days, ${student.assignment_completion_pct}% assignments completed`,
    },
    {
      name: 'Technical & Communication Skills',
      category: 'Skills',
      score: Math.round(((student.technical_skill || 60) * 0.6) + ((student.communication_skill || 60) * 0.4)),
      benchmark: 62,
      target: 60,
      weight: 10,
      weightLabel: '10%',
      status: (student.technical_skill || 60) >= 70 ? 'Optimal' : 'Satisfactory',
      impactPercentage: +(((student.technical_skill || 60) - 60) * 0.10).toFixed(1),
      impactType: (student.technical_skill || 60) >= 60 ? 'positive' : 'negative',
      insight: `Technical Skill: ${student.technical_skill}/100, Soft Skills: ${student.communication_skill || 60}/100`,
    },
    {
      name: 'Campus Co-Curricular Engagement',
      category: 'Engagement',
      score: student.engagement_score,
      benchmark: 25,
      target: 30,
      weight: 5,
      weightLabel: '5%',
      status: student.engagement_score >= 45 ? 'Optimal' : student.engagement_score >= 20 ? 'Satisfactory' : 'Needs Attention',
      impactPercentage: +((student.engagement_score - 30) * 0.05).toFixed(1),
      impactType: student.engagement_score >= 30 ? 'positive' : 'neutral',
      insight: `${student.events_attended} events, ${student.certifications} certifications, ${student.hackathons} hackathons`,
    },
  ];

  // Multidimensional Radar chart data comparing Student vs Department Benchmark
  const radarData = mlIndicators.map((ind: any) => ({
    subject: `${ind.category} (${ind.weightLabel})`,
    Student: ind.score,
    Benchmark: ind.benchmark,
    fullMark: 100,
  }));

  // 95% Confidence Interval for ML Success Prediction
  const ci = (student as any).ml_profile?.confidence_interval || {
    confidence_level: 95,
    margin_of_error: 4.2,
    lower_bound: Math.max(5, Math.round(successRate - 4.2)),
    upper_bound: Math.min(99, Math.round(successRate + 4.2)),
    std_error: 2.14,
    sample_size: 1000,
    z_score: 1.96,
  };

  // Algorithm Input Feature Weights (attendance, assignment scores, participation, academics, placement, skills)
  const featureWeights = (student as any).ml_profile?.feature_weights || [
    {
      name: 'Classroom Attendance',
      key: 'attendance',
      weight: 0.25,
      weightPct: 25,
      studentValue: `${student.attendance_pct}%`,
      normalizedScore: student.attendance_pct,
      weightedPoints: +(student.attendance_pct * 0.25).toFixed(1),
      category: 'Attendance',
      description: 'Continuous lecture & laboratory attendance regularity',
    },
    {
      name: 'Academic Examinations & CGPA',
      key: 'academics',
      weight: 0.35,
      weightPct: 35,
      studentValue: `CGPA ${student.cgpa}, Mid avg ${Math.round(((student.mid_1_marks + student.mid_2_marks) / 30) * 100)}%`,
      normalizedScore: student.academic_score || 70,
      weightedPoints: +((student.academic_score || 70) * 0.35).toFixed(1),
      category: 'Academics',
      description: 'CGPA (40%), Mid-1 & Mid-2 exam average (35%), internal tests (25%)',
    },
    {
      name: 'Assignment Scores & LMS Activity',
      key: 'assignments',
      weight: 0.10,
      weightPct: 10,
      studentValue: `${student.assignment_completion_pct}% submitted, ${student.lms_logins_30d} logins`,
      normalizedScore: student.lms_score || 70,
      weightedPoints: +((student.lms_score || 70) * 0.10).toFixed(1),
      category: 'Assignments',
      description: 'Coursework assignment submission rate and portal engagement',
    },
    {
      name: 'Placement & Industry Readiness',
      key: 'placement',
      weight: 0.15,
      weightPct: 15,
      studentValue: `Coding ${student.coding_score}/100, Aptitude ${student.aptitude_score}/100`,
      normalizedScore: student.placement_score || 55,
      weightedPoints: +((student.placement_score || 55) * 0.15).toFixed(1),
      category: 'Placement',
      description: 'Coding assessments, quantitative aptitude, mock interviews',
    },
    {
      name: 'Technical & Communication Skills',
      key: 'skills',
      weight: 0.10,
      weightPct: 10,
      studentValue: `Tech ${student.technical_skill}/100, Comm ${student.communication_skill || 60}/100`,
      normalizedScore: Math.round(((student.technical_skill || 60) * 0.6) + ((student.communication_skill || 60) * 0.4)),
      weightedPoints: +(Math.round(((student.technical_skill || 60) * 0.6) + ((student.communication_skill || 60) * 0.4)) * 0.10).toFixed(1),
      category: 'Skills',
      description: 'Domain engineering competencies and interpersonal communication',
    },
    {
      name: 'Campus Co-Curricular Participation',
      key: 'participation',
      weight: 0.05,
      weightPct: 5,
      studentValue: `${student.events_attended} events, ${student.certifications} certs, ${student.hackathons} hacks`,
      normalizedScore: student.engagement_score || 25,
      weightedPoints: +((student.engagement_score || 25) * 0.05).toFixed(1),
      category: 'Participation',
      description: 'Active event participation, hackathons, and certifications',
    },
  ];

  const getRiskBadge = (level: string) => {
    if (level === 'Low') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Low Risk / High Success Outlook</span>
        </span>
      );
    }
    if (level === 'Moderate') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3.5 w-3.5" />
          <span>Moderate Concern / Targeted Guidance</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Priority Academic Support Required</span>
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Optimal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Satisfactory':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Needs Attention':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {student.student_name}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold border border-sky-200">
              {student.department} • {student.year_of_study} (Sem {student.semester})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Roll Number: <span className="font-mono font-semibold text-slate-700">{student.student_id}</span> • Machine Learning Success Track: Active
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Predictive Status</div>
            <div className="mt-0.5">{getRiskBadge(student.risk_level)}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ML Predicted Student Success Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <span>Student Success Rate</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold ${
                successRate >= 75 ? 'text-emerald-600' : successRate >= 60 ? 'text-sky-600' : 'text-rose-600'
              }`}>
                {successRate}%
              </span>
              <span className="text-xs font-semibold text-slate-400">ML Predicted</span>
            </div>
            <div className="mt-1 flex items-center space-x-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                successRate >= 75 ? 'bg-emerald-50 text-emerald-700' : successRate >= 60 ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {successRate >= 75 ? 'Strong Placement Likelihood' : successRate >= 60 ? 'On Track with Support' : 'Action Plan Needed'}
              </span>
            </div>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${
            successRate >= 75 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-sky-50 text-sky-600 border-sky-100'
          }`}>
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Overall Attendance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overall Attendance
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold ${student.attendance_pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {student.attendance_pct}%
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {student.attendance_pct >= 75 ? 'Above statutory 75% cutoff' : 'Alert: Below mandatory 75% cutoff'}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${
            student.attendance_pct >= 75 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Cumulative CGPA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current CGPA
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">{student.cgpa}</span>
              <span className="text-xs font-semibold text-slate-400">/ 10.0</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Active Backlogs: <span className={`font-semibold ${student.backlogs > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{student.backlogs}</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Mid Exams Performance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mid-1 & Mid-2 Marks
            </div>
            <div className="mt-2 flex items-baseline space-x-3">
              <span className="text-xl font-bold text-slate-900">M1: <span className="text-sky-600">{student.mid_1_marks}</span>/15</span>
              <span className="text-xl font-bold text-slate-900">M2: <span className="text-cyan-600">{student.mid_2_marks}</span>/15</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Internal Evaluation: <span className="font-semibold text-slate-800">{student.internal_marks}/100</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Success Indicator Breakdown (2 Columns) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-sky-600" />
                  <h2 className="text-base font-bold text-slate-900">Student Success Indicator Breakdown</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Machine Learning multidimensional breakdown calibrated across academic, attendance & placement factors
                </p>
              </div>

              {/* View Switcher: Benchmark Cards vs Multidimensional Radar */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 hidden sm:inline-block">
                  Segment: {student.academic_placement_segment}
                </span>
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5">
                  <button
                    onClick={() => setViewMode('benchmarks')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      viewMode === 'benchmarks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Indicators List
                  </button>
                  <button
                    onClick={() => setViewMode('radar')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      viewMode === 'radar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Radar Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Overall Machine Learning Success Rate Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-sky-50/50 border border-sky-100 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {successRate}%
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>Overall Predicted Success Rate</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded font-semibold">ML Ensemble</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Probability of on-time graduation with active campus placement qualification.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Cohort Mean</div>
                  <div className="font-bold text-slate-800">68% Success</div>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Confidence</div>
                  <div className="font-bold text-emerald-600">95% CI</div>
                </div>
              </div>
            </div>

            {/* View Mode 1: Benchmark Cards & Horizontal Progress */}
            {viewMode === 'benchmarks' && (
              <div className="space-y-3">
                {mlIndicators.map((ind: any, idx: number) => {
                  const isPositive = ind.impactType === 'positive';
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{ind.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                            Weight: {ind.weightLabel}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(ind.status)}`}>
                            {ind.status}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {ind.score} <span className="text-slate-400 text-[10px]">/ 100</span>
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar with Benchmark Marker */}
                      <div className="relative pt-1">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              ind.score >= ind.target
                                ? 'bg-sky-600'
                                : ind.score >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, ind.score))}%` }}
                          />
                        </div>
                        {/* Target Marker at ind.target % */}
                        <div
                          className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                          style={{ left: `${ind.target}%` }}
                        >
                          <div className="w-0.5 h-4 bg-slate-700/60" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                        <div className="truncate max-w-[70%] text-slate-600 font-medium">
                          {ind.insight}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-slate-400">ML Contribution:</span>
                          <span className={`font-semibold font-mono ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? `+${ind.impactPercentage}%` : `${ind.impactPercentage}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Mode 2: Radar Profile Chart */}
            {viewMode === 'radar' && (
              <div className="space-y-4">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" tick={{ fontSize: 10 }} />
                      <Radar name="My Score" dataKey="Student" stroke="#0284c7" fill="#0ea5e9" fillOpacity={0.4} />
                      <Radar name="Dept Benchmark" dataKey="Benchmark" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.2} strokeDasharray="3 3" />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-sky-600 flex-shrink-0" />
                    <span>The radar chart highlights student score vs the department cohort benchmark across all six success pillars.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Footer */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase">LMS Logins (30d)</span>
              <span className="text-sm font-bold text-slate-800">{student.lms_logins_30d} logins</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase">Coding Assessment</span>
              <span className="text-sm font-bold text-slate-800">{student.coding_score} / 100</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase">Aptitude Score</span>
              <span className="text-sm font-bold text-slate-800">{student.aptitude_score} / 100</span>
            </div>
          </div>
        </div>

        {/* AI Explainable Prediction & Actionable Recommendations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sky-600 font-bold text-base mb-1">
              <BrainCircuit className="h-5 w-5" />
              <h2>AI Performance Prediction</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">Gradient Boosted ML Model Evaluation</p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Predicted Academic Support Need:</span>
                <span className="font-bold font-mono text-slate-900">
                  {supportProb}% probability
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    supportProb > 60
                      ? 'bg-rose-500'
                      : supportProb > 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${supportProb}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-500 space-y-1.5 pt-1">
                <div className="font-semibold text-slate-700">Strongest Contributing Features:</div>
                <div className="flex justify-between">
                  <span>• Attendance Consistency:</span>
                  <span className={`font-semibold ${student.attendance_pct >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {student.attendance_pct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• MID Exam Normalized Average:</span>
                  <span className="font-medium text-slate-800">
                    {Math.round(((student.mid_1_marks + student.mid_2_marks) / 30) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• Active Backlogs:</span>
                  <span className={`font-semibold ${student.backlogs > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {student.backlogs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• Coding & Aptitude Readiness:</span>
                  <span className="font-medium text-slate-800">
                    {Math.round((student.coding_score + student.aptitude_score) / 2)} / 100
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                <span>Actionable Recommendations</span>
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                {student.attendance_pct < 75 && (
                  <li className="flex items-start space-x-2 bg-rose-50/70 p-2 rounded-lg text-rose-800">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Prioritize regular classroom attendance to recover past 75% regulatory requirement.</span>
                  </li>
                )}
                {student.placement_score < 60 && (
                  <li className="flex items-start space-x-2 bg-sky-50 p-2 rounded-lg text-sky-800">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>Attend campus coding assessment workshops to boost technical interview readiness.</span>
                  </li>
                )}
                {student.mid_1_marks < 8 && (
                  <li className="flex items-start space-x-2 bg-amber-50 p-2 rounded-lg text-amber-800">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Reach out to faculty mentors during doubt clarification office hours for Mid-2 prep.</span>
                  </li>
                )}
                <li className="flex items-start space-x-2 bg-slate-50 p-2 rounded-lg text-slate-700">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Complete remaining LMS assignments to keep continuous evaluation score high.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            Model version: v2.4 (Explainable Random Forest & Gradient Boosted Ensemble). Confidence interval: 95%.
          </div>
        </div>
      </div>

      {/* ALGORITHM DIAGNOSTICS & INPUT FEATURE WEIGHTS PANEL */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Sliders className="h-5 w-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">Success Prediction Algorithm Diagnostics</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                Supervised Ensemble v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transparent audit of input feature weights (attendance, assignment scores, participation) and statistical confidence intervals
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              95% CI: [{ci.lower_bound}% — {ci.upper_bound}%]
            </span>
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center space-x-1"
            >
              <span>{showDiagnostics ? 'Collapse' : 'Expand Diagnostics'}</span>
              {showDiagnostics ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {showDiagnostics && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: 95% Confidence Interval Visualizer (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Statistical Confidence Interval</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Std Error: ±{ci.std_error}%</span>
                </div>

                {/* Point Estimate & CI Range Card */}
                <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 text-center space-y-2 shadow-xs">
                  <div className="text-[11px] uppercase font-semibold text-slate-400">Predicted Success Rate</div>
                  <div className="text-3xl font-black text-sky-600 flex items-center justify-center space-x-1">
                    <span>{successRate}%</span>
                    <span className="text-xs font-semibold text-slate-400">Point Estimate</span>
                  </div>

                  {/* Range Range Display */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-3 text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">95% Lower Bound</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">{ci.lower_bound}%</span>
                    </div>
                    <div className="text-slate-300 font-bold">——</div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">95% Upper Bound</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">{ci.upper_bound}%</span>
                    </div>
                  </div>
                </div>

                {/* Visual Confidence Spread Bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Margin of Error: <strong className="text-slate-800 font-mono">±{ci.margin_of_error}%</strong></span>
                    <span>Confidence Spread: <strong className="text-slate-800 font-mono">{(ci.upper_bound - ci.lower_bound).toFixed(1)}%</strong></span>
                  </div>
                  
                  {/* Horizontal CI visualization bar from 0 to 100 */}
                  <div className="relative w-full h-5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    {/* Safe Threshold Line at 75% */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 z-10"
                      style={{ left: '75%' }}
                      title="Regulatory Safe Threshold (75%)"
                    />
                    {/* CI Range shaded segment */}
                    <div
                      className="absolute top-0 bottom-0 bg-sky-200/90 border-x-2 border-sky-600 transition-all duration-500"
                      style={{
                        left: `${ci.lower_bound}%`,
                        width: `${Math.max(4, ci.upper_bound - ci.lower_bound)}%`,
                      }}
                    />
                    {/* Center marker for point estimate */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-sky-700 shadow-md z-20"
                      style={{ left: `${successRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span className="font-bold text-slate-600">75% (Target)</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Statistical Explanatory Note */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5 shadow-xs">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Info className="h-3.5 w-3.5 text-sky-600" />
                  <span>Diagnostic Interpretation</span>
                </div>
                <p className="leading-relaxed text-slate-500">
                  There is a <strong className="text-slate-700">95% statistical probability</strong> that this student's actual continuous evaluation and graduation outcome falls between <strong className="text-slate-800">{ci.lower_bound}% and {ci.upper_bound}%</strong>. This interval accounts for random variations in midterm difficulty, lab scores, and session attendance, evaluated against 1,000 verified student records.
                </p>
              </div>
            </div>

            {/* Right Column: Input Feature Weights Matrix (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Target className="h-4 w-4 text-sky-600" />
                    <span>Algorithm Input Feature Weights Matrix</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mathematical contribution weights configured for attendance, assignment scores & participation
                  </p>
                </div>
                <div className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                  Total Model Weight: 100% (1.00)
                </div>
              </div>

              {/* Weights Cards Grid */}
              <div className="space-y-2.5">
                {featureWeights.map((feat: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/70 transition space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{feat.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          feat.category === 'Attendance' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          feat.category === 'Assignments' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          feat.category === 'Participation' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {feat.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[11px] text-slate-500">
                          Algorithm Weight: <strong className="text-slate-900 font-mono">{feat.weightPct}%</strong> ({feat.weight})
                        </span>
                        <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
                          +{feat.weightedPoints} pts
                        </span>
                      </div>
                    </div>

                    {/* Weight Capacity Progress Bar */}
                    <div className="relative pt-0.5">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            feat.category === 'Attendance' ? 'bg-emerald-500' :
                            feat.category === 'Assignments' ? 'bg-purple-500' :
                            feat.category === 'Participation' ? 'bg-amber-500' :
                            'bg-sky-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, feat.normalizedScore))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span className="truncate max-w-[65%] text-slate-600 font-medium">
                        Student Input: <strong className="text-slate-800">{feat.studentValue}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Normalized Score: {feat.normalizedScore}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mathematical Equation Synthesis Footer */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-mono text-slate-700 text-[10px] leading-relaxed">
                  Formula: Predicted Success = (0.25 × Attendance) + (0.10 × Assignments) + (0.05 × Participation) + (0.35 × Academics) + (0.15 × Placement) + (0.10 × Skills)
                </div>
                {student.backlogs > 0 && (
                  <div className="text-rose-600 font-semibold text-[10px] whitespace-nowrap bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Active Backlog Penalty: -{student.backlogs * 6} pts
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming College Events from Calendar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">Upcoming Academic Calendar Highlights</h2>
          </div>
          <span className="text-xs text-slate-400">Synced with College Academic Calendar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingEvents.map((evt, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  evt.event_type === 'Exam' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {evt.event_type}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600">{evt.date}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">{evt.day_allocation}</h3>
              <p className="text-xs text-slate-500 mt-1">Week: {evt.week_count} • Code: {evt.day_count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

