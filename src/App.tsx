import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { LoginView } from './components/auth/LoginView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentMarks } from './components/student/StudentMarks';
import { StudentCalendar } from './components/student/StudentCalendar';
import { StudentFeedbackView } from './components/student/StudentFeedback';
import { StudentProfile } from './components/student/StudentProfile';

import { StaffDashboard } from './components/staff/StaffDashboard';
import { BranchStudentDirectory } from './components/staff/BranchStudentDirectory';
import { TakeAttendanceModal } from './components/staff/TakeAttendanceModal';
import { MarksEntryModal } from './components/staff/MarksEntryModal';
import { InterventionCenter } from './components/staff/InterventionCenter';
import { StaffFeedbackReview } from './components/staff/StaffFeedbackReview';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { ExcelImportExportCenter } from './components/admin/ExcelImportExportCenter';
import { MLModelDiagnostics } from './components/admin/MLModelDiagnostics';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { Student } from './types';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Staff Modals
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [marksModalOpen, setMarksModalOpen] = useState(false);
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState<Student | null>(null);

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* STUDENT VIEWS */}
        {user.role === 'student' && (
          <>
            {activeTab === 'dashboard' && <StudentDashboard />}
            {activeTab === 'marks' && <StudentMarks />}
            {activeTab === 'calendar' && <StudentCalendar />}
            {activeTab === 'feedback' && <StudentFeedbackView />}
            {activeTab === 'profile' && <StudentProfile />}
          </>
        )}

        {/* STAFF VIEWS */}
        {user.role === 'staff' && (
          <>
            {activeTab === 'dashboard' && (
              <StaffDashboard
                onNavigate={setActiveTab}
                onOpenAttendance={() => setAttendanceModalOpen(true)}
                onOpenMarks={s => {
                  setSelectedStudentForMarks(s || null);
                  setMarksModalOpen(true);
                }}
              />
            )}
            {(activeTab === 'directory' || activeTab === 'marks-entry') && (
              <BranchStudentDirectory
                onEditStudentMarks={s => {
                  setSelectedStudentForMarks(s);
                  setMarksModalOpen(true);
                }}
              />
            )}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Classroom Attendance Management</h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Department: {user.department} • Launch attendance session for registered students
                    </p>
                  </div>
                  <button
                    onClick={() => setAttendanceModalOpen(true)}
                    className="px-4 py-2 bg-sky-600 text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-sky-700 transition"
                  >
                    Open Daily Attendance Sheet
                  </button>
                </div>
                <BranchStudentDirectory
                  onEditStudentMarks={s => {
                    setSelectedStudentForMarks(s);
                    setMarksModalOpen(true);
                  }}
                />
              </div>
            )}
            {activeTab === 'interventions' && <InterventionCenter />}
            {activeTab === 'feedback-review' && <StaffFeedbackReview />}
          </>
        )}

        {/* ADMIN VIEWS */}
        {user.role === 'admin' && (
          <>
            {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
            {activeTab === 'import-center' && <ExcelImportExportCenter />}
            {activeTab === 'calendar' && <StudentCalendar />}
            {activeTab === 'ml-models' && <MLModelDiagnostics />}
            {activeTab === 'audit-logs' && <AuditLogsView />}
          </>
        )}
      </main>

      {/* Staff Modals */}
      <TakeAttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        onSuccess={() => {}}
      />

      <MarksEntryModal
        isOpen={marksModalOpen}
        onClose={() => setMarksModalOpen(false)}
        student={selectedStudentForMarks}
        onSuccess={() => {}}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
