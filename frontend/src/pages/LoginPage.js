import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import axios from 'axios';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// List of roles that should be redirected to admin dashboard after login

const ADMIN_ROLES = ['hidden', 'admin', 'manager', 'co-owner', 'owner', 'editor'];

// ─────────────────────────────────────────────
// OTP VERIFICATION SCREEN
// ─────────────────────────────────────────────
function OTPVerificationForm({ email, otpToken, onSuccess, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // take last char
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (value && index === 5) {
      const fullOtp = [...newOtp.slice(0, 5), value.slice(-1)].join('');
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  

  const handleKeyDown = (index, e) => {
    // On backspace, clear current and go back
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // On paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) return;
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    // Focus last filled or last input
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
    // Auto-submit if complete
    if (pasted.length === 6) handleVerify(pasted);
  };


  const handleVerify = async (otpValue = null) => {
    const finalOtp = otpValue || otp.join('');
    if (finalOtp.length !== 6) {
      return toast.error('Please enter the complete 6-digit code');
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-2fa', {
        otpToken,
        otp: finalOtp,
      });

      if (res.data.success) {
        onSuccess(res.data.token, res.data.user);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid verification code';
      toast.error(message);
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    toast('Resend functionality requires re-triggering Google login', { icon: 'ℹ️' });
    // In a real app, you'd call a resend endpoint here
    setCanResend(false);
    setResendTimer(60);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        {/* Shield Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#161b11] border border-[#2a3420] flex items-center justify-center">
            <svg className="w-7 h-7 text-[#97b084]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
        </div>

        <h3 className="text-[16px] font-bold text-[#f5f5f5]">Two-Factor Verification</h3>
        <p className="text-[13px] text-[#889679] leading-relaxed">
          We sent a 6-digit code to
        </p>
        <p className="text-[13px] font-semibold text-[#a5b287]">{email}</p>
      </div>

      {/* OTP Input Boxes */}
      <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className={`w-11 h-13 py-3 text-center rounded-[10px] bg-[#10140c] border text-[#f5f5f5] text-[20px] font-bold transition-all duration-150 focus:outline-none
              ${digit
                ? 'border-[#516441] ring-1 ring-[#516441]'
                : 'border-[#232c1b] focus:border-[#516441] focus:ring-1 focus:ring-[#516441]'
              }`}
          />
        ))}
      </div>

      {/* Verify Button */}
      <button
        onClick={() => handleVerify()}
        disabled={loading || otp.join('').length !== 6}
        className="w-full bg-[#567245] hover:bg-[#658553] text-[#f5f5f5] font-semibold py-3 rounded-[10px] text-[14px] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Verifying...
          </span>
        ) : 'Verify Code'}
      </button>

      {/* Resend & Back */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-[12px] text-[#6e7d5e]">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-[#a5b287] hover:text-[#c4d6a1] transition-colors font-medium"
            >
              Resend verification code
            </button>
          ) : (
            <span>Resend code in <span className="text-[#a5b287] font-semibold">{resendTimer}s</span></span>
          )}
        </div>

        <button
          onClick={onBack}
          className="text-[12px] text-[#6e7d5e] hover:text-[#889679] transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to sign in
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AUTH PAGE WRAPPER
// ─────────────────────────────────────────────
export function AuthPage() {
  const [activeTab, setActiveTab] = useState('signin');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#10140c] text-sans pt-24 pb-8">
      <div className="w-full max-w-[420px] flex flex-col">

        {/* Page Title */}
        <div className="text-center mb-7">
          <h1 className="text-[26px] font-bold text-[#f5f5f5] mb-1.5 tracking-tight">
            {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-[#889679] text-[14px]">
            {activeTab === 'signin'
              ? 'Sign in to access your ZetrexKeys account'
              : 'Join ZetrexKeys and start gaming today'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1e2517] rounded-[24px] p-6 sm:p-8 shadow-2xl border border-[#2a3420]/60">

          {/* Tab Buttons */}
          <div className="flex bg-[#161b11] p-1 rounded-[12px] mb-7">
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all duration-200 ${
                activeTab === 'signin'
                  ? 'bg-[#516441] text-white shadow-sm'
                  : 'text-[#889679] hover:text-[#c4d6a1]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-[#516441] text-white shadow-sm'
                  : 'text-[#889679] hover:text-[#c4d6a1]'
              }`}
            >
              Register
            </button>
          </div>

          {/* Forms */}
          {activeTab === 'signin' && <SignInForm />}
          {activeTab === 'register' && <RegisterForm />}
        </div>

        {/* Outer Bottom Link */}
        <div className="text-center mt-5 mb-10">
          <p className="text-[#7c8d6e] text-[12px] font-medium">
            {activeTab === 'signin' ? (
              <>Don't have an account? <button onClick={() => setActiveTab('register')} className="text-[#a5b287] hover:text-[#c4d6a1] transition-colors ml-1">Register</button></>
            ) : (
              <>Already have an account? <button onClick={() => setActiveTab('signin')} className="text-[#a5b287] hover:text-[#c4d6a1] transition-colors ml-1">Sign In</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIGN IN FORM
// ─────────────────────────────────────────────
function SignInForm() {
  const { login, googleLogin, setAuthToken } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // OTP state
  const [otpData, setOtpData] = useState(null); // { email, otpToken }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const result = await googleLogin(credentialResponse.credential);

      // ── Backend requires OTP verification ──
      if (result?.requiresOTP) {
        setOtpData({ email: result.email, otpToken: result.otpToken });
        toast('Check your email for a verification code', { icon: '📧' });
        return;
      }

      // ── Direct login (no OTP) ──
      toast.success('Successfully logged in with Google!');
      if (ADMIN_ROLES.includes(result?.role)) {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    } catch (err) {
      toast.error('Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (token, user) => {
    // Store JWT and update auth context
    setAuthToken(token, user);
    toast.success('Welcome back! 🎉');
    if (ADMIN_ROLES.includes(user?.role)) {
      navigate('/admin');
    } else {
      navigate(redirect);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Welcome back!');
      if (ADMIN_ROLES.includes(user.role)) {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // ── Show OTP screen ──
  if (otpData) {
    return (
      <OTPVerificationForm
        email={otpData.email}
        otpToken={otpData.otpToken}
        onSuccess={handleOTPSuccess}
        onBack={() => setOtpData(null)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Input */}
      <div>
        <label className="block text-[10px] font-bold text-[#b4c89e] mb-1.5 uppercase tracking-wide">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="
          ZetrexKeys@example.com"
          className="w-full px-4 py-3 rounded-[10px] bg-[#10140c] border border-[#232c1b] text-[#f5f5f5] placeholder:text-[#4d5943] focus:border-[#516441] focus:outline-none focus:ring-1 focus:ring-[#516441] transition-all text-[14px]"
        />
      </div>

      {/* Password Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-[#b4c89e]">Password</label>
          
        </div>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            required
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-[10px] bg-[#10140c] border border-[#232c1b] text-[#f5f5f5] placeholder:text-[#4d5943] focus:border-[#516441] focus:outline-none focus:ring-1 focus:ring-[#516441] transition-all text-[14px] pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-[15px] text-[#4d5943] hover:text-[#889679] transition-colors"
          >
            {showPass ? (
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
                <path d="M15.171 13.576l1.414 1.414a1 1 0 001.414-1.414l-14-14a1 1 0 00-1.414 1.414l1.474 1.474A10.017 10.017 0 00.458 10c1.274 4.057 5.065 7 9.542 7 1.986 0 3.897-.359 5.671-1.029z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3C5.58 3 1.73 6.46 1 11c.73 4.54 4.58 8 10 8s9.27-3.46 10-8c-.73-4.54-4.58-8-10-8zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#567245] hover:bg-[#658553] text-[#f5f5f5] font-semibold py-3 rounded-[10px] text-[14px] transition-all duration-200 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'CONNECTING...' : 'Sign In'}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex-1 h-px bg-[#2a3420]"></div>
        <span className="text-[12px] text-[#6e7d5e] font-medium tracking-wide">or continue with</span>
        <div className="flex-1 h-px bg-[#2a3420]"></div>
      </div>

      {/* Google Button */}
      <div className="w-full flex justify-center h-12 overflow-hidden rounded-[10px] items-center">
        {googleClientId ? (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google Login was cancelled or failed')}
            size="large"
            theme="filled_black"
            shape="rectangular"
            text="continue_with"
          />
        ) : (
          <button
            type="button"
            disabled
            className="w-full bg-[#10140c] border border-[#232c1b] text-[#6e7d5e] font-semibold py-3 rounded-[10px] text-[14px] cursor-not-allowed"
          >
            Google Sign-In unavailable
          </button>
        )}
      </div>

      {/* Support Section */}
      <div className="mt-2 p-4 bg-[#10140c] border border-[#232c1b] rounded-[12px]">
        <p className="text-[11px] text-[#6e7d5e] text-center mb-3">
          Can't access your account?{' '}
          <button
            type="button"
            onClick={() => window.$chatwoot?.toggle('open')}
            className="text-[#a5b287] hover:text-[#c4d6a1] font-semibold transition-colors"
          >
            Chat with support
          </button>
        </p>
        <button
          type="button"
          onClick={() => window.$chatwoot?.toggle('open')}
          className="w-full py-2.5 bg-[#161b11] border border-[#2a3420] text-[#889679] text-[12px] font-semibold rounded-[10px] hover:border-[#516441] hover:text-[#a5b287] transition-all flex items-center justify-center gap-2"
        >
          <span>💬</span> Need Help? Talk to Us
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// REGISTER FORM
// ─────────────────────────────────────────────
function RegisterForm() {
  const { register, googleLogin, setAuthToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', terms: false });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // OTP state
  const [otpData, setOtpData] = useState(null);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const result = await googleLogin(credentialResponse.credential);

      // ── Backend requires OTP verification ──
      if (result?.requiresOTP) {
        setOtpData({ email: result.email, otpToken: result.otpToken });
        toast('Check your email for a verification code', { icon: '📧' });
        return;
      }

      toast.success('Successfully created an account with Google! 🎉');
      if (ADMIN_ROLES.includes(result?.role)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error('Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (token, user) => {
    setAuthToken(token, user);
    toast.success('Account verified! Welcome 🎉');
    if (ADMIN_ROLES.includes(user?.role)) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.terms) return toast.error('You must agree to the Terms of Service and Privacy Policy');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');

    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.phone || null);
      toast.success('Account created successfully!');
      if (ADMIN_ROLES.includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Show OTP screen ──
  if (otpData) {
    return (
      <OTPVerificationForm
        email={otpData.email}
        otpToken={otpData.otpToken}
        onSuccess={handleOTPSuccess}
        onBack={() => setOtpData(null)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username Input */}
      <div>
        <label className="block text-xs font-semibold text-[#b4c89e] mb-1.5">Username</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="ZetrexKeys"
          className="w-full px-4 py-3 rounded-[10px] bg-[#10140c] border border-[#232c1b] text-[#f5f5f5] placeholder:text-[#4d5943] focus:border-[#516441] focus:outline-none focus:ring-1 focus:ring-[#516441] transition-all text-[14px]"
        />
      </div>

      {/* Phone Number Input */}
      <div>
        <label className="block text-xs font-semibold text-[#b4c89e] mb-1.5">
          Phone Number <span className="text-[#6e7d5e] font-normal lowercase text-xs ml-1">(optional)</span>
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="+1 555 000 0000"
          className="w-full px-4 py-3 rounded-[10px] bg-[#10140c] border border-[#232c1b] text-[#f5f5f5] placeholder:text-[#4d5943] focus:border-[#516441] focus:outline-none focus:ring-1 focus:ring-[#516441] transition-all text-[14px]"
        />
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-xs font-semibold text-[#b4c89e] mb-1.5">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="zetex@gmail.com"
          className="w-full px-4 py-3 rounded-[10px] bg-[#10140c] border border-[#232c1b] text-[#f5f5f5] placeholder:text-[#4d5943] focus:border-[#516441] focus:outline-none focus:ring-1 focus:ring-[#516441] transition-all text-[14px]"
        />
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-semibold text-[#b4c89e] mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            required
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-[10px] bg-[#10140c] border border-[#232c1b] text-[#f5f5f5] placeholder:text-[#4d5943] focus:border-[#516441] focus:outline-none focus:ring-1 focus:ring-[#516441] transition-all text-[14px] pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-[15px] text-[#4d5943] hover:text-[#889679] transition-colors"
          >
            {showPass ? (
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
                <path d="M15.171 13.576l1.414 1.414a1 1 0 001.414-1.414l-14-14a1 1 0 00-1.414 1.414l1.474 1.474A10.017 10.017 0 00.458 10c1.274 4.057 5.065 7 9.542 7 1.986 0 3.897-.359 5.671-1.029z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3C5.58 3 1.73 6.46 1 11c.73 4.54 4.58 8 10 8s9.27-3.46 10-8c-.73-4.54-4.58-8-10-8zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start gap-2.5 mt-2.5 mb-2">
        <input
          type="checkbox"
          id="terms"
          checked={form.terms}
          onChange={e => setForm(f => ({ ...f, terms: e.target.checked }))}
          className="w-[14px] h-[14px] mt-0.5 rounded-[4px] bg-[#10140c] border border-[#303f25] appearance-none checked:bg-[#97b084] checked:border-[#97b084] cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-[#10140c] checked:after:font-black checked:after:text-[10px] checked:after:left-[2.5px] checked:after:-top-[0.5px] transition-colors"
        />
        <label htmlFor="terms" className="text-[12px] text-[#889679] cursor-pointer select-none">
          I agree to the <Link to="/terms" target="_blank" className="text-[#a5b287] hover:text-[#c4d6a1] transition-colors font-medium">Terms of Service</Link> and <Link to="/privacy" target="_blank" className="text-[#a5b287] hover:text-[#c4d6a1] transition-colors font-medium">Privacy Policy</Link>
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#567245] hover:bg-[#658553] text-[#f5f5f5] font-semibold py-3 rounded-[10px] text-[14px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex-1 h-px bg-[#2a3420]"></div>
        <span className="text-[12px] text-[#6e7d5e] font-medium tracking-wide">or continue with</span>
        <div className="flex-1 h-px bg-[#2a3420]"></div>
      </div>

      {/* Google Button */}
      <div className="w-full flex justify-center h-12 overflow-hidden rounded-[10px] items-center">
        {googleClientId ? (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google Login was cancelled or failed')}
            size="large"
            theme="filled_black"
            shape="rectangular"
            text="continue_with"
          />
        ) : (
          <button
            type="button"
            disabled
            className="w-full bg-[#10140c] border border-[#232c1b] text-[#6e7d5e] font-semibold py-3 rounded-[10px] text-[14px] cursor-not-allowed"
          >
            Google Sign-In unavailable
          </button>
        )}
      </div>
    </form>
  );
}

export function LoginPage() {
  return <AuthPage />;
}

export function RegisterPage() {
  return <AuthPage />;
}

export default AuthPage;