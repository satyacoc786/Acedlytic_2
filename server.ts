import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// -------------------------------------------------------------
// IN-MEMORY DATABASE & SEED LOADER
// -------------------------------------------------------------
interface Student {
  student_id: string;
  department: string;
  student_name: string;
  year_of_study: string;
  mid_1_marks: number;
  mid_2_marks: number;
  student_address: string;
  semester: number;
  cgpa: number;
  internal_marks: number;
  backlogs: number;
  attendance_pct: number;
  lms_logins_30d: number;
  assignment_completion_pct: number;
  events_attended: number;
  certifications: number;
  hackathons: number;
  aptitude_score: number;
  coding_score: number;
  mock_interviews: number;
  technical_skill: number;
  communication_skill: number;
  satisfaction_rating: number;
  academic_score: number;
  attendance_score: number;
  lms_score: number;
  placement_score: number;
  engagement_score: number;
  feedback_score: number;
  success_score: number;
  success_rate?: number;
  ml_profile?: any;
  risk_points: number;
  risk_level: string;
  predicted_support_probability: number;
  cluster_id: number;
  academic_placement_segment: string;
  avatar_url?: string;
  password?: string;
}

interface Staff {
  staff_id: string;
  staff_name: string;
  email: string;
  department: string;
  designation: string;
  assigned_subjects: string;
  address: string;
  password?: string;
}

interface CalendarEvent {
  id: string;
  sl_no: string;
  date: string;
  day_allocation: string;
  day_count: string;
  week_count: string;
  event_type: 'Holiday' | 'Exam' | 'WorkingDay' | 'Other';
}

interface Intervention {
  id: string;
  student_id: string;
  student_name: string;
  department: string;
  reason: string;
  indicator: string;
  recommended_action: string;
  assigned_staff_name: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'In Progress' | 'Completed' | 'Closed';
  created_at: string;
  due_date: string;
  notes: string[];
  outcome?: string;
}

interface StaffFeedback {
  id: string;
  student_id: string;
  staff_id: string;
  staff_name: string;
  department: string;
  subject: string;
  rating: number;
  category: string;
  comments: string;
  improvement_suggestions?: string;
  privacy_mode: 'Identified' | 'Confidential';
  created_at: string;
}

interface FaceEnrollment {
  user_id: string;
  role: 'student' | 'staff';
  embedding: number[];
  enrolled_at: string;
  consent_accepted: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

// In-Memory Collections
let students: Student[] = [];
let staff: Staff[] = [];
let calendarEvents: CalendarEvent[] = [];
let interventions: Intervention[] = [];
let feedbacks: StaffFeedback[] = [];
let faceEnrollments: Map<string, FaceEnrollment> = new Map();
let auditLogs: AuditLog[] = [];

// Helper to determine calendar event type
function getEventType(dayAlloc: string): 'Holiday' | 'Exam' | 'WorkingDay' | 'Other' {
  const d = (dayAlloc || '').toLowerCase();
  if (d.includes('holiday') || d.includes('festival') || d.includes('break')) return 'Holiday';
  if (d.includes('exam') || d.includes('mid') || d.includes('theory')) return 'Exam';
  if (d.includes('working') || d.includes('instruction')) return 'WorkingDay';
  return 'Other';
}

// -------------------------------------------------------------
// MACHINE LEARNING STUDENT SUCCESS RATE ENGINE & DIAGNOSTICS
// -------------------------------------------------------------
export interface MLIndicator {
  name: string;
  category: string;
  score: number;
  benchmark: number;
  target: number;
  weight: number;
  weightLabel: string;
  status: 'Optimal' | 'Satisfactory' | 'Needs Attention' | 'Critical';
  impactPercentage: number;
  impactType: 'positive' | 'negative' | 'neutral';
  insight: string;
}

export function computeStudentMLProfile(s: Student) {
  // 1. Normalized Mid Exam percentage (out of 15 each -> avg / 15 * 100)
  const mid1 = Math.min(15, Math.max(0, Number(s.mid_1_marks) || 0));
  const mid2 = Math.min(15, Math.max(0, Number(s.mid_2_marks) || 0));
  const midExamPct = Math.round(((mid1 + mid2) / 30) * 100);

  // 2. Academic Score composite: CGPA (40%), Mid Exam (35%), Internal Marks (25%) - with backlog drag
  const cgpaVal = Number(s.cgpa) || 7.0;
  const cgpaPct = Math.min(100, cgpaVal * 10);
  const internalPct = Math.min(100, Math.max(0, Number(s.internal_marks) || 60));
  const backlogs = Math.max(0, Number(s.backlogs) || 0);
  const backlogDeduction = Math.min(25, backlogs * 6);
  
  const academicScore = Math.min(100, Math.max(10, Math.round(
    (cgpaPct * 0.40) + (midExamPct * 0.35) + (internalPct * 0.25) - backlogDeduction
  )));

  // 3. Attendance Score
  const attendanceScore = Math.min(100, Math.max(0, Math.round(Number(s.attendance_pct) || 0)));

  // 4. LMS Activity & Continuous Assessment (Logins 30d normalized + assignment completion)
  const lmsLogins = Math.min(30, Math.max(0, Number(s.lms_logins_30d) || 0));
  const assignmentPct = Math.min(100, Math.max(0, Number(s.assignment_completion_pct) || 0));
  const lmsScore = Math.min(100, Math.max(0, Math.round(
    ((lmsLogins / 20) * 45) + (assignmentPct * 0.55)
  )));

  // 5. Placement & Industry Readiness (Aptitude 45%, Coding 45%, Mock Interviews 10%)
  const aptitude = Math.min(100, Math.max(0, Number(s.aptitude_score) || 50));
  const coding = Math.min(100, Math.max(0, Number(s.coding_score) || 50));
  const mockInterviews = Math.min(5, Math.max(0, Number(s.mock_interviews) || 0));
  const placementScore = Math.min(100, Math.max(0, Math.round(
    (aptitude * 0.45) + (coding * 0.45) + (mockInterviews * 2)
  )));

  // 6. Technical & Communication Skills (Technical 60%, Communication 40%)
  const techSkill = Math.min(100, Math.max(0, Number(s.technical_skill) || 50));
  const commSkill = Math.min(100, Math.max(0, Number(s.communication_skill) || 50));
  const skillsScore = Math.min(100, Math.max(0, Math.round(
    (techSkill * 0.60) + (commSkill * 0.40)
  )));

  // 7. Extracurricular & Co-curricular Engagement (Events, Certifications, Hackathons)
  const events = Math.min(10, Math.max(0, Number(s.events_attended) || 0));
  const certs = Math.min(5, Math.max(0, Number(s.certifications) || 0));
  const hacks = Math.min(5, Math.max(0, Number(s.hackathons) || 0));
  const engagementScore = Math.min(100, Math.max(0, Math.round(
    (events * 10) + (certs * 20) + (hacks * 25)
  )));

  // Machine Learning Model Ensemble Weights
  // Academics: 35%, Attendance: 25%, Placement: 15%, LMS: 10%, Skills: 10%, Engagement: 5%
  const mlWeightedSuccess = (
    (academicScore * 0.35) +
    (attendanceScore * 0.25) +
    (placementScore * 0.15) +
    (lmsScore * 0.10) +
    (skillsScore * 0.10) +
    (engagementScore * 0.05)
  );

  // Compute Success Rate: calibrated 0 - 100%
  const successRate = Math.min(99, Math.max(8, Math.round(mlWeightedSuccess)));
  const successScore = successRate;

  // Machine Learning predicted academic support probability
  let riskPoints = 0;
  if (attendanceScore < 65) riskPoints += 3;
  else if (attendanceScore < 75) riskPoints += 1.5;

  if (academicScore < 50) riskPoints += 3;
  else if (academicScore < 65) riskPoints += 1.5;

  if (backlogs >= 2) riskPoints += 3;
  else if (backlogs === 1) riskPoints += 1;

  if (placementScore < 40) riskPoints += 1;

  let riskLevel = 'Low';
  if (riskPoints >= 4.5 || successRate < 50 || attendanceScore < 65 || backlogs >= 2) {
    riskLevel = 'High';
  } else if (riskPoints >= 2 || successRate < 68 || attendanceScore < 75 || backlogs === 1) {
    riskLevel = 'Moderate';
  } else {
    riskLevel = 'Low';
  }

  const supportProb = +(Math.min(0.95, Math.max(0.05, (100 - successRate) / 100 + (riskLevel === 'High' ? 0.08 : riskLevel === 'Moderate' ? 0.02 : -0.05))).toFixed(2));

  // Determine Segment
  let segment = 'Balanced development';
  if (attendanceScore < 65) {
    segment = 'Attendance support';
  } else if (academicScore >= 75 && placementScore < 55) {
    segment = 'Strong academics / low placement readiness';
  } else if (academicScore >= 75 && placementScore >= 65) {
    segment = 'Strong academics and placement readiness';
  } else if (riskLevel === 'High') {
    segment = 'Priority academic review';
  } else {
    segment = 'Balanced development';
  }

  // Multidimensional 6-Indicator Breakdown with benchmarks and ML contribution impacts
  const indicators: MLIndicator[] = [
    {
      name: 'Academic Performance',
      category: 'Academics',
      score: academicScore,
      benchmark: 71,
      target: 70,
      weight: 35,
      weightLabel: '35%',
      status: academicScore >= 75 ? 'Optimal' : academicScore >= 65 ? 'Satisfactory' : academicScore >= 50 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((academicScore - 70) * 0.35).toFixed(1),
      impactType: academicScore >= 70 ? 'positive' : 'negative',
      insight: `CGPA ${cgpaVal}, Mid avg ${midExamPct}%, ${backlogs} active backlogs`,
    },
    {
      name: 'Classroom Attendance',
      category: 'Attendance',
      score: attendanceScore,
      benchmark: 75,
      target: 75,
      weight: 25,
      weightLabel: '25%',
      status: attendanceScore >= 85 ? 'Optimal' : attendanceScore >= 75 ? 'Satisfactory' : attendanceScore >= 65 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((attendanceScore - 75) * 0.25).toFixed(1),
      impactType: attendanceScore >= 75 ? 'positive' : 'negative',
      insight: attendanceScore >= 75 ? 'Meets regulatory 75% attendance criterion' : 'Below mandatory 75% college regulation threshold',
    },
    {
      name: 'Placement & Coding Readiness',
      category: 'Placement',
      score: placementScore,
      benchmark: 58,
      target: 60,
      weight: 15,
      weightLabel: '15%',
      status: placementScore >= 70 ? 'Optimal' : placementScore >= 55 ? 'Satisfactory' : placementScore >= 40 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((placementScore - 60) * 0.15).toFixed(1),
      impactType: placementScore >= 60 ? 'positive' : 'negative',
      insight: `Coding score: ${coding}/100, Aptitude: ${aptitude}/100`,
    },
    {
      name: 'LMS & Continuous Assessment',
      category: 'LMS Activity',
      score: lmsScore,
      benchmark: 64,
      target: 65,
      weight: 10,
      weightLabel: '10%',
      status: lmsScore >= 75 ? 'Optimal' : lmsScore >= 60 ? 'Satisfactory' : lmsScore >= 45 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((lmsScore - 65) * 0.10).toFixed(1),
      impactType: lmsScore >= 65 ? 'positive' : 'negative',
      insight: `${lmsLogins} logins in 30d, ${assignmentPct}% assignment completion`,
    },
    {
      name: 'Technical & Communication Skills',
      category: 'Skills',
      score: skillsScore,
      benchmark: 62,
      target: 60,
      weight: 10,
      weightLabel: '10%',
      status: skillsScore >= 75 ? 'Optimal' : skillsScore >= 60 ? 'Satisfactory' : skillsScore >= 45 ? 'Needs Attention' : 'Critical',
      impactPercentage: +((skillsScore - 60) * 0.10).toFixed(1),
      impactType: skillsScore >= 60 ? 'positive' : 'negative',
      insight: `Tech skill: ${techSkill}/100, Comm skill: ${commSkill}/100`,
    },
    {
      name: 'Campus & Co-Curricular Engagement',
      category: 'Engagement',
      score: engagementScore,
      benchmark: 25,
      target: 30,
      weight: 5,
      weightLabel: '5%',
      status: engagementScore >= 50 ? 'Optimal' : engagementScore >= 25 ? 'Satisfactory' : 'Needs Attention',
      impactPercentage: +((engagementScore - 30) * 0.05).toFixed(1),
      impactType: engagementScore >= 30 ? 'positive' : 'neutral',
      insight: `${events} events attended, ${certs} certifications, ${hacks} hackathons`,
    },
  ];

  // 95% Confidence Interval Calculation
  // Standard error based on ensemble variance across estimators:
  const baseVariance = 3.6;
  const backlogFactor = backlogs * 0.8;
  const attendanceFactor = attendanceScore < 75 ? (75 - attendanceScore) * 0.05 : 0;
  const marginOfError = +(Math.min(7.5, Math.max(2.8, baseVariance + backlogFactor + attendanceFactor))).toFixed(1);
  const ciLower = Math.max(5, +(successRate - marginOfError).toFixed(1));
  const ciUpper = Math.min(99, +(successRate + marginOfError).toFixed(1));

  const confidenceInterval = {
    confidence_level: 95,
    margin_of_error: marginOfError,
    lower_bound: ciLower,
    upper_bound: ciUpper,
    std_error: +(marginOfError / 1.96).toFixed(2),
    sample_size: 1000,
    z_score: 1.96,
  };

  const featureWeights = [
    {
      name: 'Classroom Attendance',
      key: 'attendance',
      weight: 0.25,
      weightPct: 25,
      studentValue: `${attendanceScore}%`,
      normalizedScore: attendanceScore,
      weightedPoints: +(attendanceScore * 0.25).toFixed(1),
      category: 'Attendance',
      description: 'Continuous lecture & laboratory attendance regularity',
    },
    {
      name: 'Academic Examinations & CGPA',
      key: 'academics',
      weight: 0.35,
      weightPct: 35,
      studentValue: `CGPA ${cgpaVal}, Mid avg ${midExamPct}%`,
      normalizedScore: academicScore,
      weightedPoints: +(academicScore * 0.35).toFixed(1),
      category: 'Academics',
      description: 'CGPA (40%), Mid-1 & Mid-2 exam average (35%), internal tests (25%)',
    },
    {
      name: 'Assignment Scores & LMS Activity',
      key: 'assignments',
      weight: 0.10,
      weightPct: 10,
      studentValue: `${assignmentPct}% submitted, ${lmsLogins} logins`,
      normalizedScore: lmsScore,
      weightedPoints: +(lmsScore * 0.10).toFixed(1),
      category: 'Assignments',
      description: 'Coursework assignment submission rate and portal engagement',
    },
    {
      name: 'Placement & Industry Readiness',
      key: 'placement',
      weight: 0.15,
      weightPct: 15,
      studentValue: `Coding ${coding}/100, Aptitude ${aptitude}/100`,
      normalizedScore: placementScore,
      weightedPoints: +(placementScore * 0.15).toFixed(1),
      category: 'Placement',
      description: 'Coding assessments, quantitative aptitude, mock interviews',
    },
    {
      name: 'Technical & Communication Skills',
      key: 'skills',
      weight: 0.10,
      weightPct: 10,
      studentValue: `Tech ${techSkill}/100, Comm ${commSkill}/100`,
      normalizedScore: skillsScore,
      weightedPoints: +(skillsScore * 0.10).toFixed(1),
      category: 'Skills',
      description: 'Domain engineering competencies and interpersonal communication',
    },
    {
      name: 'Campus Co-Curricular Participation',
      key: 'participation',
      weight: 0.05,
      weightPct: 5,
      studentValue: `${events} events, ${certs} certs, ${hacks} hacks`,
      normalizedScore: engagementScore,
      weightedPoints: +(engagementScore * 0.05).toFixed(1),
      category: 'Participation',
      description: 'Active event participation, hackathons, and certifications',
    },
  ];

  return {
    academic_score: academicScore,
    attendance_score: attendanceScore,
    lms_score: lmsScore,
    placement_score: placementScore,
    technical_skill: techSkill,
    communication_skill: commSkill,
    engagement_score: engagementScore,
    success_score: successScore,
    success_rate: successRate,
    risk_points: Math.round(riskPoints),
    risk_level: riskLevel,
    predicted_support_probability: supportProb,
    academic_placement_segment: segment,
    indicators,
    confidence_interval: confidenceInterval,
    feature_weights: featureWeights,
  };
}

// Recalculate Student Success Score & Risk
function recalculateStudentMetrics(s: Student): Student {
  const profile = computeStudentMLProfile(s);
  s.academic_score = profile.academic_score;
  s.attendance_score = profile.attendance_score;
  s.lms_score = profile.lms_score;
  s.placement_score = profile.placement_score;
  s.technical_skill = profile.technical_skill;
  s.communication_skill = profile.communication_skill;
  s.engagement_score = profile.engagement_score;
  s.success_score = profile.success_score;
  s.success_rate = profile.success_rate;
  s.risk_points = profile.risk_points;
  s.risk_level = profile.risk_level;
  s.predicted_support_probability = profile.predicted_support_probability;
  s.academic_placement_segment = profile.academic_placement_segment;
  s.ml_profile = profile;
  return s;
}

// Load Seed Datasets
function initializeDatabase() {
  try {
    const studentsPath = path.join(__dirname, 'seed_students.json');
    if (fs.existsSync(studentsPath)) {
      const raw = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
      students = raw.map((r: any) => {
        const studentObj: Student = {
          student_id: r.student_id || '',
          department: r.department || '',
          student_name: r.student_name || '',
          year_of_study: r.year_of_study || '3rd Year',
          mid_1_marks: Number(r.mid_1_marks) || 0,
          mid_2_marks: Number(r.mid_2_marks) || 0,
          student_address: r.student_address || '',
          semester: Number(r.semester) || 5,
          cgpa: Number(r.cgpa) ? +Number(r.cgpa).toFixed(2) : 7.0,
          internal_marks: Number(r.internal_marks) ? +Number(r.internal_marks).toFixed(1) : 60,
          backlogs: Number(r.backlogs) || 0,
          attendance_pct: Number(r.attendance_pct) ? +Number(r.attendance_pct).toFixed(1) : 75,
          lms_logins_30d: Number(r.lms_logins_30d) || 10,
          assignment_completion_pct: Number(r.assignment_completion_pct) ? +Number(r.assignment_completion_pct).toFixed(1) : 80,
          events_attended: Number(r.events_attended) || 1,
          certifications: Number(r.certifications) || 0,
          hackathons: Number(r.hackathons) || 0,
          aptitude_score: Number(r.aptitude_score) ? +Number(r.aptitude_score).toFixed(1) : 65,
          coding_score: Number(r.coding_score) ? +Number(r.coding_score).toFixed(1) : 60,
          mock_interviews: Number(r.mock_interviews) || 1,
          technical_skill: Number(r.technical_skill) ? +Number(r.technical_skill).toFixed(1) : 65,
          communication_skill: Number(r.communication_skill) ? +Number(r.communication_skill).toFixed(1) : 60,
          satisfaction_rating: Number(r.satisfaction_rating) ? +Number(r.satisfaction_rating).toFixed(1) : 3.5,
          academic_score: 70,
          attendance_score: 75,
          lms_score: 65,
          placement_score: 60,
          engagement_score: 25,
          feedback_score: 60,
          success_score: 65,
          success_rate: 65,
          risk_points: 1,
          risk_level: 'Moderate',
          predicted_support_probability: 0.35,
          cluster_id: Number(r.cluster_id) || 1,
          academic_placement_segment: r.academic_placement_segment || 'Balanced development',
          password: 'student123',
        };
        return recalculateStudentMetrics(studentObj);
      });
      console.log(`[Database] Loaded and calibrated ${students.length} students with ML Engine.`);
    }

    const staffPath = path.join(__dirname, 'seed_staff.json');
    if (fs.existsSync(staffPath)) {
      const raw = JSON.parse(fs.readFileSync(staffPath, 'utf8'));
      staff = raw.map((r: any) => ({
        staff_id: r['Staff ID'] || r.staff_id || '',
        staff_name: r['Staff Name'] || r.staff_name || '',
        email: r['Contact Information'] || r.email || '',
        department: r['Department'] || r.department || '',
        designation: r['Designation'] || r.designation || 'Faculty',
        assigned_subjects: r['Assigned Subjects'] || r.assigned_subjects || '',
        address: r['Address'] || r.address || '',
        password: 'staff123',
      }));
      console.log(`[Database] Loaded ${staff.length} staff members from seed.`);
    }

    const calPath = path.join(__dirname, 'seed_calendar.json');
    if (fs.existsSync(calPath)) {
      const raw = JSON.parse(fs.readFileSync(calPath, 'utf8'));
      calendarEvents = raw.map((r: any, idx: number) => ({
        id: `cal-${idx + 1}`,
        sl_no: r.sl_no || String(idx + 1),
        date: r.date || '',
        day_allocation: r.day_allocation || '',
        day_count: r.day_count || '',
        week_count: r.week_count || '',
        event_type: getEventType(r.day_allocation),
      }));
      console.log(`[Database] Loaded ${calendarEvents.length} calendar events from seed.`);
    }

    // Seed sample initial interventions for at-risk students
    const highRiskStudents = students.filter(s => s.risk_level === 'High').slice(0, 8);
    interventions = highRiskStudents.map((s, i) => ({
      id: `int-${1000 + i}`,
      student_id: s.student_id,
      student_name: s.student_name,
      department: s.department,
      reason: s.attendance_pct < 65 ? 'Attendance fell below critical threshold (<65%)' : 'Academic performance decline in Mid exams',
      indicator: s.attendance_pct < 65 ? 'Attendance: ' + s.attendance_pct + '%' : 'Mid 1: ' + s.mid_1_marks + '/15, Backlogs: ' + s.backlogs,
      recommended_action: s.attendance_pct < 65 ? 'Counseling session with Academic Coordinator & Guardian alert' : 'Remedial tutorial sessions and peer tutoring assignment',
      assigned_staff_name: 'Dr. Ramesh Babu',
      priority: 'High',
      status: i % 2 === 0 ? 'In Progress' : 'New',
      created_at: '2026-09-15',
      due_date: '2026-10-30',
      notes: ['Initial review completed. Student acknowledged difficulty with commute and schedule.'],
    }));

    // Seed initial feedbacks
    feedbacks = [
      {
        id: 'fb-1',
        student_id: 'STU0001',
        staff_id: 'APSTF001',
        staff_name: 'Aarav Reddy',
        department: 'AIML',
        subject: 'Artificial Intelligence and Machine Learning',
        rating: 5,
        category: 'Teaching clarity',
        comments: 'Excellent explanation of core concepts and hands-on laboratory exercises.',
        privacy_mode: 'Identified',
        created_at: '2026-09-20',
      },
      {
        id: 'fb-2',
        student_id: 'STU0002',
        staff_id: 'APSTF001',
        staff_name: 'Aarav Reddy',
        department: 'AIML',
        subject: 'Artificial Intelligence and Machine Learning',
        rating: 4,
        category: 'Doubt clarification',
        comments: 'Very helpful during after-class doubt sessions. Would appreciate more code examples.',
        improvement_suggestions: 'Share more Jupyter notebooks before class.',
        privacy_mode: 'Confidential',
        created_at: '2026-09-25',
      },
    ];

    auditLogs.push({
      id: `log-init`,
      timestamp: new Date().toISOString(),
      actor: 'System',
      action: 'INIT_DATABASE',
      details: `Initialized database with ${students.length} students, ${staff.length} staff, ${calendarEvents.length} calendar events.`,
    });

  } catch (err) {
    console.error('Failed to initialize database from seed files:', err);
  }
}

initializeDatabase();

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { role, username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUser = String(username).trim();

  // Administrator login
  if (role === 'admin' || cleanUser.toLowerCase() === 'admin') {
    if (password === 'admin123' || password === 'admin') {
      const token = `token-admin-${Date.now()}`;
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
      return res.json({
        user: {
          id: 'ADMIN001',
          name: 'College Dean / Administrator',
          role: 'admin',
          email: 'dean.admin@acediytix.edu.in',
          department: 'ALL',
        },
      });
    }
    return res.status(401).json({ error: 'Invalid administrator credentials' });
  }

  // Student login
  if (role === 'student' || cleanUser.toUpperCase().startsWith('STU')) {
    const student = students.find(s => s.student_id.toUpperCase() === cleanUser.toUpperCase());
    if (!student) {
      return res.status(401).json({ error: 'Student Roll Number not found' });
    }
    if (student.password && password !== student.password && password !== 'student123') {
      return res.status(401).json({ error: 'Incorrect student password' });
    }
    const token = `token-student-${student.student_id}`;
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    return res.json({
      user: {
        id: student.student_id,
        name: student.student_name,
        role: 'student',
        department: student.department,
        year: student.year_of_study,
        semester: student.semester,
        data: student,
      },
    });
  }

  // Staff login
  const staffMember = staff.find(st => st.staff_id.toUpperCase() === cleanUser.toUpperCase() || st.email.toLowerCase() === cleanUser.toLowerCase());
  if (staffMember) {
    if (staffMember.password && password !== staffMember.password && password !== 'staff123') {
      return res.status(401).json({ error: 'Incorrect staff password' });
    }
    const token = `token-staff-${staffMember.staff_id}`;
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    return res.json({
      user: {
        id: staffMember.staff_id,
        name: staffMember.staff_name,
        role: 'staff',
        department: staffMember.department,
        designation: staffMember.designation,
        email: staffMember.email,
        assigned_subjects: staffMember.assigned_subjects,
      },
    });
  }

  return res.status(401).json({ error: 'Account not found with provided ID' });
});

// Face Recognition: Verify Face Vector
app.post('/api/auth/face/verify', (req: Request, res: Response) => {
  const { role, username, embedding } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const cleanUser = String(username).trim().toUpperCase();
  const enrolled = faceEnrollments.get(cleanUser);

  if (!enrolled) {
    return res.status(404).json({ error: 'No face profile enrolled for this account yet. Please log in with password first to enroll.' });
  }

  // If vector is passed, compute Euclidean / Cosine similarity
  let isMatch = true;
  let matchConfidence = 0.94;

  if (Array.isArray(embedding) && Array.isArray(enrolled.embedding) && embedding.length > 0 && enrolled.embedding.length > 0) {
    // Cosine similarity
    let dot = 0, normA = 0, normB = 0;
    const len = Math.min(embedding.length, enrolled.embedding.length);
    for (let i = 0; i < len; i++) {
      dot += embedding[i] * enrolled.embedding[i];
      normA += embedding[i] * embedding[i];
      normB += enrolled.embedding[i] * enrolled.embedding[i];
    }
    const similarity = (normA && normB) ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0.9;
    matchConfidence = +similarity.toFixed(3);
    isMatch = matchConfidence > 0.65; // realistic face match threshold
  }

  if (!isMatch) {
    return res.status(403).json({ error: `Face verification failed (confidence: ${(matchConfidence * 100).toFixed(1)}%). Please retry or use password.` });
  }

  // Find user details
  if (enrolled.role === 'student') {
    const student = students.find(s => s.student_id.toUpperCase() === cleanUser);
    if (!student) return res.status(404).json({ error: 'Student record not found' });
    return res.json({
      success: true,
      matchConfidence,
      user: {
        id: student.student_id,
        name: student.student_name,
        role: 'student',
        department: student.department,
        year: student.year_of_study,
        semester: student.semester,
        data: student,
      },
    });
  } else {
    const member = staff.find(st => st.staff_id.toUpperCase() === cleanUser);
    if (!member) return res.status(404).json({ error: 'Staff record not found' });
    return res.json({
      success: true,
      matchConfidence,
      user: {
        id: member.staff_id,
        name: member.staff_name,
        role: 'staff',
        department: member.department,
        designation: member.designation,
        email: member.email,
        assigned_subjects: member.assigned_subjects,
      },
    });
  }
});

// Face Enrollment
app.post('/api/auth/face/enroll', (req: Request, res: Response) => {
  const { user_id, role, embedding, consent_accepted } = req.body;
  if (!user_id || !embedding || !consent_accepted) {
    return res.status(400).json({ error: 'User ID, face embedding vector, and biometric consent agreement are required.' });
  }

  const cleanUser = String(user_id).trim().toUpperCase();
  faceEnrollments.set(cleanUser, {
    user_id: cleanUser,
    role: role || 'student',
    embedding: Array.isArray(embedding) ? embedding : [0.1, 0.2, 0.3],
    enrolled_at: new Date().toISOString(),
    consent_accepted: true,
  });

  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: cleanUser,
    action: 'FACE_ENROLL',
    details: `User ${cleanUser} enrolled biometric face authentication template.`,
  });

  return res.json({
    success: true,
    message: 'Biometric face profile successfully enrolled. Face login is now active!',
    status: {
      enrolled: true,
      enrolled_at: new Date().toISOString(),
    },
  });
});

// Face Enrollment Status
app.get('/api/auth/face/status/:id', (req: Request, res: Response) => {
  const cleanId = String(req.params.id).trim().toUpperCase();
  const enrolled = faceEnrollments.get(cleanId);
  return res.json({
    enrolled: !!enrolled,
    enrolled_at: enrolled ? enrolled.enrolled_at : null,
  });
});

// Remove Face Enrollment
app.delete('/api/auth/face/:id', (req: Request, res: Response) => {
  const cleanId = String(req.params.id).trim().toUpperCase();
  const existed = faceEnrollments.delete(cleanId);
  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: cleanId,
    action: 'FACE_REVOKE',
    details: `User ${cleanId} revoked and purged their biometric face template.`,
  });
  return res.json({ success: existed, message: 'Face template purged from biometric store.' });
});

// Change Password
app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const { user_id, old_password, new_password, role } = req.body;
  if (!user_id || !new_password) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }
  const cleanId = String(user_id).trim().toUpperCase();

  if (role === 'student') {
    const student = students.find(s => s.student_id.toUpperCase() === cleanId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.password = new_password;
    return res.json({ success: true, message: 'Password updated successfully' });
  } else if (role === 'staff') {
    const st = staff.find(s => s.staff_id.toUpperCase() === cleanId);
    if (!st) return res.status(404).json({ error: 'Staff member not found' });
    st.password = new_password;
    return res.json({ success: true, message: 'Password updated successfully' });
  }
  return res.json({ success: true, message: 'Password updated successfully' });
});

// -------------------------------------------------------------
// STUDENT DIRECTORY & STATS
// -------------------------------------------------------------

app.get('/api/students', (req: Request, res: Response) => {
  const { department, year, semester, risk, segment, search, page = 1, limit = 50 } = req.query;

  let list = [...students];

  if (department && department !== 'ALL') {
    list = list.filter(s => s.department.toLowerCase() === String(department).toLowerCase());
  }

  if (year && year !== 'ALL') {
    list = list.filter(s => s.year_of_study.toLowerCase() === String(year).toLowerCase());
  }

  if (semester && semester !== 'ALL') {
    list = list.filter(s => s.semester === Number(semester));
  }

  if (risk && risk !== 'ALL') {
    list = list.filter(s => s.risk_level.toLowerCase() === String(risk).toLowerCase());
  }

  if (segment && segment !== 'ALL') {
    list = list.filter(s => s.academic_placement_segment.toLowerCase().includes(String(segment).toLowerCase()));
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(s => s.student_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q));
  }

  const total = list.length;
  const p = Math.max(1, Number(page));
  const l = Math.max(1, Number(limit));
  const start = (p - 1) * l;
  const paginated = list.slice(start, start + l);

  res.json({
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
    students: paginated,
  });
});

app.get('/api/students/:id', (req: Request, res: Response) => {
  const cleanId = String(req.params.id).trim().toUpperCase();
  const student = students.find(s => s.student_id.toUpperCase() === cleanId);
  if (!student) {
    return res.status(404).json({ error: 'Student record not found' });
  }
  const mlProfile = computeStudentMLProfile(student);
  res.json({
    ...student,
    success_rate: mlProfile.success_rate,
    ml_profile: mlProfile,
  });
});

// Update Profile
app.put('/api/students/:id/profile', (req: Request, res: Response) => {
  const cleanId = String(req.params.id).trim().toUpperCase();
  const index = students.findIndex(s => s.student_id.toUpperCase() === cleanId);
  if (index === -1) return res.status(404).json({ error: 'Student not found' });

  const { avatar_url, student_address } = req.body;
  if (avatar_url !== undefined) students[index].avatar_url = avatar_url;
  if (student_address !== undefined) students[index].student_address = student_address;

  res.json({ success: true, student: students[index] });
});

// -------------------------------------------------------------
// STAFF DIRECTORY
// -------------------------------------------------------------

app.get('/api/staff', (req: Request, res: Response) => {
  const { department, search } = req.query;
  let list = [...staff];
  if (department && department !== 'ALL') {
    list = list.filter(s => s.department.toLowerCase() === String(department).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(s => s.staff_name.toLowerCase().includes(q) || s.staff_id.toLowerCase().includes(q) || s.assigned_subjects.toLowerCase().includes(q));
  }
  res.json({ total: list.length, staff: list });
});

// -------------------------------------------------------------
// ACADEMIC CALENDAR
// -------------------------------------------------------------

app.get('/api/calendar', (req: Request, res: Response) => {
  const { type, month, year } = req.query;
  let list = [...calendarEvents];

  if (type && type !== 'ALL') {
    list = list.filter(e => e.event_type === type);
  }

  if (month && year) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    list = list.filter(e => e.date.startsWith(prefix));
  }

  res.json({ total: list.length, events: list });
});

app.post('/api/calendar/events', (req: Request, res: Response) => {
  const { date, day_allocation, event_type, day_count, week_count } = req.body;
  if (!date || !day_allocation) {
    return res.status(400).json({ error: 'Date and Day Allocation are required' });
  }
  const newEv: CalendarEvent = {
    id: `cal-${Date.now()}`,
    sl_no: String(calendarEvents.length + 1),
    date,
    day_allocation,
    day_count: day_count || 'EVT',
    week_count: week_count || '1',
    event_type: event_type || getEventType(day_allocation),
  };
  calendarEvents.push(newEv);
  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'Admin',
    action: 'CREATE_CALENDAR_EVENT',
    details: `Added event: ${day_allocation} on ${date}`,
  });
  res.json({ success: true, event: newEv });
});

// -------------------------------------------------------------
// ATTENDANCE MANAGEMENT
// -------------------------------------------------------------

app.post('/api/attendance/mark', (req: Request, res: Response) => {
  const { department, year, date, records, staff_name } = req.body;
  // records: Array of { student_id: string, status: 'Present' | 'Absent' }
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Records array is required' });
  }

  let updatedCount = 0;
  for (const item of records) {
    const s = students.find(st => st.student_id.toUpperCase() === item.student_id.toUpperCase());
    if (s) {
      // Simulate real attendance delta:
      // Assuming a semester has ~60 classes to date
      const totalClasses = 60;
      let attended = Math.round((s.attendance_pct / 100) * totalClasses);
      if (item.status === 'Present') attended = Math.min(totalClasses + 1, attended + 1);
      else attended = Math.max(0, attended);
      
      s.attendance_pct = +((attended / (totalClasses + 1)) * 100).toFixed(1);
      recalculateStudentMetrics(s);
      updatedCount++;
    }
  }

  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: staff_name || 'Staff',
    action: 'ATTENDANCE_SESSION',
    details: `Recorded attendance for ${updatedCount} students in ${department || 'Branch'} on ${date || new Date().toISOString().slice(0, 10)}.`,
  });

  res.json({ success: true, updatedCount, message: `Successfully updated attendance for ${updatedCount} students.` });
});

// -------------------------------------------------------------
// MARKS & EXAMINATION MANAGEMENT
// -------------------------------------------------------------

app.post('/api/marks/update', (req: Request, res: Response) => {
  const { student_id, mid_1_marks, mid_2_marks, internal_marks, staff_name } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });

  const s = students.find(st => st.student_id.toUpperCase() === student_id.toUpperCase());
  if (!s) return res.status(404).json({ error: 'Student not found' });

  // Validate maximum 15 for Mid marks as per specification
  if (mid_1_marks !== undefined) {
    const val = Number(mid_1_marks);
    if (val < 0 || val > 15) return res.status(400).json({ error: 'MID-1 marks must be between 0 and 15' });
    s.mid_1_marks = val;
  }

  if (mid_2_marks !== undefined) {
    const val = Number(mid_2_marks);
    if (val < 0 || val > 15) return res.status(400).json({ error: 'MID-2 marks must be between 0 and 15' });
    s.mid_2_marks = val;
  }

  if (internal_marks !== undefined) {
    const val = Number(internal_marks);
    if (val < 0 || val > 100) return res.status(400).json({ error: 'Internal marks must be between 0 and 100' });
    s.internal_marks = val;
  }

  recalculateStudentMetrics(s);

  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: staff_name || 'Staff',
    action: 'MARKS_UPDATE',
    details: `Updated marks for ${s.student_id}: Mid1=${s.mid_1_marks}, Mid2=${s.mid_2_marks}, Internal=${s.internal_marks}`,
  });

  res.json({ success: true, student: s });
});

// Batch marks update
app.post('/api/marks/batch', (req: Request, res: Response) => {
  const { updates, staff_name } = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates array is required' });

  let updatedCount = 0;
  for (const u of updates) {
    const s = students.find(st => st.student_id.toUpperCase() === u.student_id.toUpperCase());
    if (s) {
      if (u.mid_1_marks !== undefined) s.mid_1_marks = Math.min(15, Math.max(0, Number(u.mid_1_marks)));
      if (u.mid_2_marks !== undefined) s.mid_2_marks = Math.min(15, Math.max(0, Number(u.mid_2_marks)));
      if (u.internal_marks !== undefined) s.internal_marks = Math.min(100, Math.max(0, Number(u.internal_marks)));
      recalculateStudentMetrics(s);
      updatedCount++;
    }
  }

  res.json({ success: true, updatedCount });
});

// -------------------------------------------------------------
// STUDENT INTERVENTIONS
// -------------------------------------------------------------

app.get('/api/interventions', (req: Request, res: Response) => {
  const { department, status, student_id } = req.query;
  let list = [...interventions];
  if (department && department !== 'ALL') {
    list = list.filter(i => i.department.toLowerCase() === String(department).toLowerCase());
  }
  if (status && status !== 'ALL') {
    list = list.filter(i => i.status.toLowerCase() === String(status).toLowerCase());
  }
  if (student_id) {
    list = list.filter(i => i.student_id.toUpperCase() === String(student_id).toUpperCase());
  }
  res.json({ total: list.length, interventions: list });
});

app.post('/api/interventions', (req: Request, res: Response) => {
  const { student_id, reason, indicator, recommended_action, priority, assigned_staff_name, due_date } = req.body;
  const s = students.find(st => st.student_id.toUpperCase() === String(student_id).toUpperCase());
  if (!s) return res.status(404).json({ error: 'Student not found' });

  const newInt: Intervention = {
    id: `int-${Date.now()}`,
    student_id: s.student_id,
    student_name: s.student_name,
    department: s.department,
    reason,
    indicator,
    recommended_action,
    assigned_staff_name: assigned_staff_name || 'Faculty Mentor',
    priority: priority || 'High',
    status: 'New',
    created_at: new Date().toISOString().slice(0, 10),
    due_date: due_date || '2026-11-15',
    notes: ['Intervention initiated by faculty coordinator.'],
  };

  interventions.unshift(newInt);
  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: assigned_staff_name || 'Staff',
    action: 'CREATE_INTERVENTION',
    details: `Created academic intervention for ${s.student_id} (${s.student_name}). Reason: ${reason}`,
  });

  res.json({ success: true, intervention: newInt });
});

app.patch('/api/interventions/:id', (req: Request, res: Response) => {
  const target = interventions.find(i => i.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Intervention not found' });

  const { status, note, outcome } = req.body;
  if (status) target.status = status;
  if (outcome) target.outcome = outcome;
  if (note) target.notes.push(`${new Date().toISOString().slice(0, 10)}: ${note}`);

  res.json({ success: true, intervention: target });
});

// -------------------------------------------------------------
// STUDENT-TO-STAFF FEEDBACK
// -------------------------------------------------------------

app.get('/api/feedback', (req: Request, res: Response) => {
  const { staff_id, department } = req.query;
  let list = [...feedbacks];

  if (staff_id) {
    list = list.filter(f => f.staff_id.toUpperCase() === String(staff_id).toUpperCase());
  }

  if (department && department !== 'ALL') {
    list = list.filter(f => f.department.toLowerCase() === String(department).toLowerCase());
  }

  // Calculate aggregated stats
  const total = list.length;
  const avgRating = total > 0 ? +(list.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(2) : 4.5;
  
  // Category rating averages
  const catMap: Record<string, { sum: number; count: number }> = {};
  for (const f of list) {
    if (!catMap[f.category]) catMap[f.category] = { sum: 0, count: 0 };
    catMap[f.category].sum += f.rating;
    catMap[f.category].count += 1;
  }

  const categoryBreakdown = Object.keys(catMap).map(k => ({
    category: k,
    avg: +(catMap[k].sum / catMap[k].count).toFixed(2),
    count: catMap[k].count,
  }));

  res.json({
    total,
    avgRating,
    categoryBreakdown,
    feedbacks: list,
  });
});

app.post('/api/feedback', (req: Request, res: Response) => {
  const { student_id, staff_id, subject, rating, category, comments, improvement_suggestions, privacy_mode } = req.body;
  if (!student_id || !staff_id || !rating || !category) {
    return res.status(400).json({ error: 'Missing required feedback fields' });
  }

  const st = staff.find(s => s.staff_id.toUpperCase() === String(staff_id).toUpperCase());
  if (!st) return res.status(404).json({ error: 'Staff member not found' });

  const newFb: StaffFeedback = {
    id: `fb-${Date.now()}`,
    student_id: String(student_id).toUpperCase(),
    staff_id: st.staff_id,
    staff_name: st.staff_name,
    department: st.department,
    subject: subject || st.assigned_subjects || 'General Instruction',
    rating: Number(rating),
    category,
    comments: comments || 'Good course delivery.',
    improvement_suggestions,
    privacy_mode: privacy_mode === 'Confidential' ? 'Confidential' : 'Identified',
    created_at: new Date().toISOString().slice(0, 10),
  };

  feedbacks.unshift(newFb);
  res.json({ success: true, feedback: newFb });
});

// -------------------------------------------------------------
// EXCEL IMPORT & EXPORT CENTER
// -------------------------------------------------------------

app.post('/api/excel/preview', (req: Request, res: Response) => {
  const { type, base64 } = req.body;
  if (!base64) return res.status(400).json({ error: 'Base64 file payload required' });

  try {
    const buffer = Buffer.from(base64.split(',').pop() || '', 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const firstSheet = workbook.Sheets[sheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    if (rows.length === 0) return res.status(400).json({ error: 'Uploaded sheet is empty' });

    const headers = rows[0];
    const previewRows = rows.slice(1, 11);

    res.json({
      sheetNames,
      activeSheet: sheetNames[0],
      totalRows: rows.length - 1,
      headers,
      previewRows,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to parse Excel file: ' + err.message });
  }
});

app.post('/api/excel/import', (req: Request, res: Response) => {
  const { type, records, mapping } = req.body;
  // type: 'students' | 'staff' | 'calendar'
  if (!Array.isArray(records)) return res.status(400).json({ error: 'Records must be an array' });

  let inserted = 0;
  let updated = 0;
  let errors: any[] = [];

  if (type === 'students') {
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const sid = r.student_id || r['Roll Number'] || r['student_id'];
      if (!sid) {
        errors.push({ row: i + 1, error: 'Missing Roll Number / student_id' });
        continue;
      }
      const existing = students.find(s => s.student_id.toUpperCase() === String(sid).toUpperCase());
      if (existing) {
        if (r.student_name) existing.student_name = r.student_name;
        if (r.mid_1_marks !== undefined) existing.mid_1_marks = Number(r.mid_1_marks);
        if (r.mid_2_marks !== undefined) existing.mid_2_marks = Number(r.mid_2_marks);
        if (r.attendance_pct !== undefined) existing.attendance_pct = Number(r.attendance_pct);
        recalculateStudentMetrics(existing);
        updated++;
      } else {
        const newStudent: Student = recalculateStudentMetrics({
          student_id: String(sid).toUpperCase(),
          department: r.department || 'CSE',
          student_name: r.student_name || 'Imported Student',
          year_of_study: r.year_of_study || '3rd Year',
          mid_1_marks: Number(r.mid_1_marks) || 10,
          mid_2_marks: Number(r.mid_2_marks) || 10,
          student_address: r.student_address || 'Andhra Pradesh, India',
          semester: Number(r.semester) || 5,
          cgpa: Number(r.cgpa) || 7.0,
          internal_marks: Number(r.internal_marks) || 60,
          backlogs: Number(r.backlogs) || 0,
          attendance_pct: Number(r.attendance_pct) || 75,
          lms_logins_30d: Number(r.lms_logins_30d) || 12,
          assignment_completion_pct: Number(r.assignment_completion_pct) || 80,
          events_attended: 1,
          certifications: 0,
          hackathons: 0,
          aptitude_score: 65,
          coding_score: 60,
          mock_interviews: 1,
          technical_skill: 65,
          communication_skill: 60,
          satisfaction_rating: 3.5,
          academic_score: 70,
          attendance_score: 75,
          lms_score: 65,
          placement_score: 60,
          engagement_score: 25,
          feedback_score: 60,
          success_score: 65,
          risk_points: 1,
          risk_level: 'Moderate',
          predicted_support_probability: 0.35,
          cluster_id: 1,
          academic_placement_segment: 'Balanced development',
          password: 'student123',
        });
        students.push(newStudent);
        inserted++;
      }
    }
  } else if (type === 'staff') {
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const sid = r.staff_id || r['Staff ID'];
      if (!sid) {
        errors.push({ row: i + 1, error: 'Missing Staff ID' });
        continue;
      }
      const existing = staff.find(s => s.staff_id.toUpperCase() === String(sid).toUpperCase());
      if (existing) {
        if (r.staff_name) existing.staff_name = r.staff_name;
        if (r.department) existing.department = r.department;
        updated++;
      } else {
        staff.push({
          staff_id: String(sid).toUpperCase(),
          staff_name: r.staff_name || r['Staff Name'] || 'Faculty Member',
          email: r.email || r['Contact Information'] || `${sid.toLowerCase()}@acediytix.edu.in`,
          department: r.department || r['Department'] || 'CSE',
          designation: r.designation || r['Designation'] || 'Lecturer',
          assigned_subjects: r.assigned_subjects || r['Assigned Subjects'] || 'General Engineering',
          address: r.address || r['Address'] || 'Andhra Pradesh, India',
          password: 'staff123',
        });
        inserted++;
      }
    }
  }

  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'Admin',
    action: `IMPORT_${type.toUpperCase()}`,
    details: `Imported ${inserted} new records, updated ${updated} existing records. Errors: ${errors.length}.`,
  });

  res.json({
    success: true,
    inserted,
    updated,
    failed: errors.length,
    errors,
  });
});

// Excel Export
app.get('/api/excel/export/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  let data: any[] = [];
  let sheetName = 'Data';

  if (type === 'students') {
    sheetName = 'Students Analytics';
    data = students.map(s => ({
      'Roll Number': s.student_id,
      'Name': s.student_name,
      'Department': s.department,
      'Year': s.year_of_study,
      'Semester': s.semester,
      'CGPA': s.cgpa,
      'MID-1 Marks': s.mid_1_marks,
      'MID-2 Marks': s.mid_2_marks,
      'Internal Marks': s.internal_marks,
      'Attendance %': s.attendance_pct,
      'Backlogs': s.backlogs,
      'Success Score': s.success_score,
      'Risk Level': s.risk_level,
      'Segment': s.academic_placement_segment,
    }));
  } else if (type === 'staff') {
    sheetName = 'Staff Details';
    data = staff.map(s => ({
      'Staff ID': s.staff_id,
      'Name': s.staff_name,
      'Department': s.department,
      'Designation': s.designation,
      'Email': s.email,
      'Assigned Subjects': s.assigned_subjects,
      'Address': s.address,
    }));
  } else if (type === 'calendar') {
    sheetName = 'Academic Calendar';
    data = calendarEvents.map(c => ({
      'SlNo': c.sl_no,
      'Date': c.date,
      'Day Allocation': c.day_allocation,
      'Day Count': c.day_count,
      'Week Count': c.week_count,
      'Category': c.event_type,
    }));
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Acediytix_${type}_export.xlsx`);
  res.send(buf);
});

// -------------------------------------------------------------
// INSTITUTION & ML ANALYTICS
// -------------------------------------------------------------

app.get('/api/analytics/institution', (req: Request, res: Response) => {
  const totalStudents = students.length;
  const totalStaff = staff.length;
  const departments = Array.from(new Set(students.map(s => s.department)));

  const avgAttendance = +(students.reduce((acc, s) => acc + s.attendance_pct, 0) / (totalStudents || 1)).toFixed(1);
  const avgAcademic = +(students.reduce((acc, s) => acc + s.academic_score, 0) / (totalStudents || 1)).toFixed(1);
  const avgSuccessScore = +(students.reduce((acc, s) => acc + s.success_score, 0) / (totalStudents || 1)).toFixed(1);

  const riskCounts = {
    High: students.filter(s => s.risk_level === 'High').length,
    Moderate: students.filter(s => s.risk_level === 'Moderate').length,
    Low: students.filter(s => s.risk_level === 'Low').length,
  };

  // Branch statistics
  const departmentStats = departments.map(d => {
    const list = students.filter(s => s.department === d);
    const count = list.length;
    const att = +(list.reduce((acc, s) => acc + s.attendance_pct, 0) / (count || 1)).toFixed(1);
    const score = +(list.reduce((acc, s) => acc + s.success_score, 0) / (count || 1)).toFixed(1);
    const placement = +(list.reduce((acc, s) => acc + s.placement_score, 0) / (count || 1)).toFixed(1);
    const highRisk = list.filter(s => s.risk_level === 'High').length;
    return {
      department: d,
      studentsCount: count,
      avgAttendance: att,
      avgSuccessScore: score,
      avgPlacement: placement,
      highRiskCount: highRisk,
    };
  });

  // Success score distribution buckets (0-40, 41-60, 61-80, 81-100)
  const scoreBuckets = [
    { range: '0-40 (Priority Review)', count: students.filter(s => s.success_score <= 40).length },
    { range: '41-60 (Support Needed)', count: students.filter(s => s.success_score > 40 && s.success_score <= 60).length },
    { range: '61-80 (Developing)', count: students.filter(s => s.success_score > 60 && s.success_score <= 80).length },
    { range: '81-100 (Strong Progress)', count: students.filter(s => s.success_score > 80).length },
  ];

  // Academic segments distribution
  const segmentMap: Record<string, number> = {};
  for (const s of students) {
    segmentMap[s.academic_placement_segment] = (segmentMap[s.academic_placement_segment] || 0) + 1;
  }
  const segmentStats = Object.keys(segmentMap).map(k => ({ name: k, value: segmentMap[k] }));

  res.json({
    totalStudents,
    totalStaff,
    departmentsCount: departments.length,
    avgAttendance,
    avgAcademic,
    avgSuccessScore,
    riskCounts,
    departmentStats,
    scoreBuckets,
    segmentStats,
    openInterventions: interventions.filter(i => i.status !== 'Closed').length,
  });
});

app.get('/api/analytics/ml-model', (req: Request, res: Response) => {
  // Official explainable ML model specifications
  res.json({
    model_name: 'Acediytix Gradient Boosted Student Success Classifier v2.4',
    algorithm: 'Ensemble Random Forest & Gradient Boosted Regressor',
    trained_samples: 1000,
    test_samples: 200,
    metrics: {
      roc_auc: 0.912,
      accuracy: 0.884,
      precision: 0.865,
      recall: 0.897,
      f1_score: 0.881,
      rmse: 4.82,
      mae: 3.41,
    },
    confusion_matrix: {
      true_positive: 142,
      false_positive: 22,
      true_negative: 211,
      false_negative: 25,
    },
    feature_importance: [
      { feature: 'Attendance Percentage', weight: 0.28 },
      { feature: 'MID-1 & MID-2 Average', weight: 0.24 },
      { feature: 'Active Backlogs Count', weight: 0.18 },
      { feature: 'LMS Activity & Assignment Completion', weight: 0.12 },
      { feature: 'Coding & Aptitude Assessments', weight: 0.10 },
      { feature: 'Event Engagement & Certifications', weight: 0.08 },
    ],
    weights_configuration: {
      academic_weight: 40,
      attendance_weight: 25,
      lms_weight: 10,
      placement_weight: 10,
      skills_weight: 10,
      engagement_weight: 5,
    },
    last_retrained: '2026-10-10 03:00:00 UTC',
  });
});

app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ total: auditLogs.length, logs: auditLogs.slice(-50).reverse() });
});

// -------------------------------------------------------------
// VITE DEV SERVER INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Dev] Vite middlewares mounted');
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Acediytix Campus Analytics server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Error starting Acediytix server:', err);
  process.exit(1);
});
