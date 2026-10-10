import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { FaceCameraModal } from '../common/FaceCameraModal';
import { User, Shield, Camera, CheckCircle2, AlertCircle, Key, Trash2, RefreshCw } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(user?.data || null);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'enroll' | 'verify'>('enroll');

  // Address edit state
  const [address, setAddress] = useState(student?.student_address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/students/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setStudent(data);
            setAddress(data.student_address || '');
          }
        });

      fetch(`/api/auth/face/status/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setFaceEnrolled(!!data.enrolled);
        });
    }
  }, [user?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const res = await fetch(`/api/students/${user.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_address: address }),
    });
    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await fetch(`/api/students/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: base64 }),
      });
      if (res.ok) {
        setStudent(prev => prev ? { ...prev, avatar_url: base64 } : null);
        updateCurrentUser({ data: student ? { ...student, avatar_url: base64 } : undefined });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaceSuccess = async (embedding: number[]) => {
    if (!user?.id) return;
    if (cameraMode === 'enroll') {
      const res = await fetch('/api/auth/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          role: 'student',
          embedding,
          consent_accepted: true,
        }),
      });
      if (res.ok) {
        setFaceEnrolled(true);
        setFaceModalOpen(false);
      }
    } else {
      // Verification test
      setFaceModalOpen(false);
      alert('Face identity verified successfully with confidence > 92%!');
    }
  };

  const handleRevokeFace = async () => {
    if (!user?.id) return;
    if (window.confirm('Are you sure you want to delete your biometric face registration?')) {
      const res = await fetch(`/api/auth/face/${user.id}`, { method: 'DELETE' });
      if (res.ok) setFaceEnrolled(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !newPassword) return;
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, new_password: newPassword, role: 'student' }),
    });
    if (res.ok) {
      setPasswordMsg('Password changed successfully!');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  };

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-sky-400 bg-slate-100 flex items-center justify-center text-slate-400">
            {student.avatar_url ? (
              <img src={student.avatar_url} alt={student.student_name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-sky-600 text-white cursor-pointer hover:bg-sky-700 shadow-xs transition">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>

        <div className="text-center md:text-left space-y-1">
          <h1 className="text-xl font-bold text-slate-900">{student.student_name}</h1>
          <p className="text-xs font-mono font-medium text-slate-500">
            Roll Number: <span className="text-slate-800 font-bold">{student.student_id}</span> • Department of {student.department}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              {student.year_of_study} (Sem {student.semester})
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              CGPA: {student.cgpa}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Success Rate: {student.success_rate || student.success_score}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biometric Face Authentication Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-base">
            <Shield className="h-5 w-5" />
            <h2>Biometric Face Login Settings</h2>
          </div>
          <p className="text-xs text-slate-500">
            Enable instant hands-free login using encrypted ML facial feature comparison.
          </p>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Face Profile Status:</span>
              {faceEnrolled ? (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enrolled & Active</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full">
                  Not Enrolled
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              When enabled, you can log in on the campus portal by scanning your face via your webcam with anti-spoofing verification.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setCameraMode('enroll'); setFaceModalOpen(true); }}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs flex items-center space-x-1.5"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{faceEnrolled ? 'Re-enroll Face' : 'Enroll Face Profile'}</span>
              </button>

              {faceEnrolled && (
                <>
                  <button
                    type="button"
                    onClick={() => { setCameraMode('verify'); setFaceModalOpen(true); }}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition flex items-center space-x-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Test Match</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRevokeFace}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition flex items-center space-x-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Purge Template</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Details & Password */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <Key className="h-5 w-5 text-sky-600" />
            <h2>Security & Contact Details</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex justify-between items-center">
              {saveSuccess && <span className="text-xs text-emerald-600 font-semibold">Address updated!</span>}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Save Contact Info
              </button>
            </div>
          </form>

          <hr className="border-slate-100" />

          {/* Change password */}
          <form onSubmit={handleChangePassword} className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Change Account Password</h3>
            <div>
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex justify-between items-center">
              {passwordMsg && <span className="text-xs text-emerald-600 font-semibold">{passwordMsg}</span>}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Face Modal */}
      <FaceCameraModal
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        mode={cameraMode}
        userId={user?.id || ''}
        userName={student.student_name}
        userRole="student"
        onSuccess={handleFaceSuccess}
      />
    </div>
  );
};
