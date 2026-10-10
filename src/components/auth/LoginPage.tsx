import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldCheck, Truck, Users, Eye, EyeOff, AlertCircle, ArrowRight, UserPlus, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, quickLogin } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name || !email || !phone || !password) {
          setErrorMsg('Please complete all fields.');
          setLoading(false);
          return;
        }
        const result = await register(name, email, phone, password);
        if (!result.success) {
          setErrorMsg(result.message);
        } else {
          setSuccessMsg(result.message);
        }
      } else {
        if (!email || !password) {
          setErrorMsg('Please enter both your email address and password.');
          setLoading(false);
          return;
        }
        const result = await login(email, password, selectedRole);
        if (!result.success) {
          setErrorMsg(result.message);
        }
      }
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSignIn = async (role: UserRole) => {
    setErrorMsg('');
    setLoading(true);
    const res = await quickLogin(role);
    if (!res.success) {
      setErrorMsg(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#285943] text-white font-bold text-xl mb-3 shadow-xs">
          EC
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#252B27]">
          EcoCivic Municipal Portal
        </h1>
        <p className="mt-1 text-sm text-[#69716B]">
          Smart Solid Waste Management &amp; Civic Redressal System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#E1E5DF] rounded-xl shadow-xs">
          {/* Role Selection Switch */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#69716B] uppercase tracking-wider mb-2">
              Select Operating Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F7F2] rounded-lg border border-[#E1E5DF]">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('citizen');
                  setIsRegistering(false);
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedRole === 'citizen'
                    ? 'bg-white text-[#285943] font-semibold shadow-xs border border-[#E1E5DF]'
                    : 'text-[#69716B] hover:text-[#252B27]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Citizen Reporter</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('worker');
                  setIsRegistering(false);
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedRole === 'worker'
                    ? 'bg-white text-[#285943] font-semibold shadow-xs border border-[#E1E5DF]'
                    : 'text-[#69716B] hover:text-[#252B27]'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Collection Worker</span>
              </button>
            </div>

            {/* Discreet Admin Switch */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setIsRegistering(false);
                  setErrorMsg('');
                }}
                className={`text-[11px] transition-colors cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'text-[#285943] font-bold underline'
                    : 'text-[#69716B] hover:text-[#252B27]'
                }`}
              >
                Municipal Administration Desk →
              </button>
            </div>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="mb-6 p-3 bg-[#F7F7F2] rounded-lg border border-[#E1E5DF]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#252B27] uppercase tracking-wider">
                Instant Demo Access
              </span>
              <span className="text-[10px] text-[#69716B]">One-Click Auth</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selectedRole === 'citizen' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('citizen')}
                    disabled={loading}
                    className="py-1.5 px-2 bg-white hover:bg-neutral-100 border border-[#E1E5DF] rounded text-left text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-[#285943]">Arun Patel</div>
                    <div className="text-[10px] text-[#69716B]">Citizen (Mumbai)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('priya.nair@gmail.com');
                      setPassword('CitizenPass@123');
                    }}
                    className="py-1.5 px-2 bg-white hover:bg-neutral-100 border border-[#E1E5DF] rounded text-left text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-[#252B27]">Priya Nair</div>
                    <div className="text-[10px] text-[#69716B]">Fill Credentials</div>
                  </button>
                </>
              ) : selectedRole === 'worker' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('worker')}
                    disabled={loading}
                    className="py-1.5 px-2 bg-white hover:bg-neutral-100 border border-[#E1E5DF] rounded text-left text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-[#285943]">Rajesh Kumar</div>
                    <div className="text-[10px] text-[#69716B]">Field Worker (Ward 4)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('anita.sharma@ecocivic.gov.in');
                      setPassword('WorkerPass@123');
                    }}
                    className="py-1.5 px-2 bg-white hover:bg-neutral-100 border border-[#E1E5DF] rounded text-left text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-[#252B27]">Anita Sharma</div>
                    <div className="text-[10px] text-[#69716B]">Field Worker (Ward 7)</div>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleQuickSignIn('admin')}
                  disabled={loading}
                  className="col-span-2 py-1.5 px-2 bg-white hover:bg-neutral-100 border border-[#E1E5DF] rounded text-left text-xs transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-[#285943]">Municipal Commissioner Desk</div>
                  <div className="text-[10px] text-[#69716B]">Full Administrative Oversight</div>
                </button>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-[#C53030]/10 border border-[#C53030]/20 rounded-md text-xs text-[#C53030] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-[#2E7D32]/10 border border-[#2E7D32]/20 rounded-md text-xs text-[#2E7D32] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arun Patel"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'worker' ? 'rajesh.kumar@ecocivic.gov.in' : 'arun.patel@gmail.com'}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 pr-10 text-sm bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#69716B] hover:text-[#252B27] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#285943] hover:bg-[#1e4533] text-white text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span>Authenticating with Municipal Server...</span>
              ) : isRegistering ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Citizen Account</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as {selectedRole === 'citizen' ? 'Citizen' : selectedRole === 'worker' ? 'Worker' : 'Admin'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login for Citizens */}
          {selectedRole === 'citizen' ? (
            <div className="mt-6 pt-4 border-t border-[#E1E5DF] text-center">
              {isRegistering ? (
                <p className="text-xs text-[#69716B]">
                  Already have a registered account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setErrorMsg('');
                    }}
                    className="text-[#285943] font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p className="text-xs text-[#69716B]">
                  New citizen reporter?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setErrorMsg('');
                    }}
                    className="text-[#285943] font-semibold hover:underline cursor-pointer"
                  >
                    Register New Account
                  </button>
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-[#E1E5DF] text-center">
              <p className="text-[11px] text-[#69716B]">
                Worker accounts are restricted to municipal sanitation personnel and require administrator authorization.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
