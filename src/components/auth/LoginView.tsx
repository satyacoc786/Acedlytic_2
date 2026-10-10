import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaceCameraModal } from '../common/FaceCameraModal';
import {
  GraduationCap,
  Lock,
  User,
  Shield,
  Camera,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  KeyRound,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, faceLogin } = useAuth();

  const [role, setRole] = useState<'student' | 'staff' | 'admin'>('student');
  const [username, setUsername] = useState('STU0001');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Face Login Modal
  const [faceModalOpen, setFaceModalOpen] = useState(false);

  const handleRoleSelect = (newRole: 'student' | 'staff' | 'admin') => {
    setRole(newRole);
    setErrorMessage(null);
    if (newRole === 'student') {
      setUsername('STU0001');
      setPassword('student123');
    } else if (newRole === 'staff') {
      setUsername('APSTF001');
      setPassword('staff123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const result = await login(role, username, password);
    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
    }
    setLoading(false);
  };

  const handleFaceSuccess = async (embedding: number[]) => {
    setLoading(true);
    setFaceModalOpen(false);
    const result = await faceLogin(role as 'student' | 'staff', username, embedding);
    if (!result.success) {
      setErrorMessage(result.error || 'Face verification failed.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon & Heading */}
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-4">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Acedi<span className="text-sky-600">ytix</span>
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          AI-Powered Smart Campus Analytics & Student Success Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200 sm:px-10">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1.5 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleRoleSelect('student')}
              className={`py-2 rounded-xl transition ${
                role === 'student' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('staff')}
              className={`py-2 rounded-xl transition ${
                role === 'staff' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty / Staff
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2 rounded-xl transition ${
                role === 'admin' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Administrator
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / ID input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {role === 'student' ? 'Student Roll Number' : role === 'staff' ? 'Staff ID / Email' : 'Administrator ID'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. STU0001' : role === 'staff' ? 'e.g. APSTF001' : 'admin'}
                  className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-sky-600 hover:underline cursor-pointer">
                  Forgot Password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : `Sign In as ${role.toUpperCase()}`}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Biometric Face Recognition Option */}
          {role !== 'admin' && (
            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Dual Authentication Option
              </span>

              <button
                type="button"
                onClick={() => setFaceModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <Camera className="h-4 w-4 text-sky-600" />
                <span>Sign In with Face Recognition</span>
              </button>
            </div>
          )}

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              ⚡ Quick Demo Credentials
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setUsername('STU0001');
                  setPassword('student123');
                }}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 text-slate-700 font-medium text-center transition"
              >
                Student STU0001
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('staff');
                  setUsername('APSTF001');
                  setPassword('staff123');
                }}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 text-slate-700 font-medium text-center transition"
              >
                Staff APSTF001
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setUsername('admin');
                  setPassword('admin123');
                }}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 text-slate-700 font-medium text-center transition"
              >
                Dean Admin
              </button>
            </div>
          </div>
        </div>

        {/* Security & compliance footer */}
        <p className="mt-6 text-center text-[11px] text-slate-400">
          Acediytix Campus Analytics v2.4 • Secured with Argon2id Hashing & Biometric Liveness Guards
        </p>
      </div>

      {/* Face Login Modal */}
      <FaceCameraModal
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        mode="verify"
        userId={username}
        userRole={role as 'student' | 'staff'}
        onSuccess={handleFaceSuccess}
      />
    </div>
  );
};
