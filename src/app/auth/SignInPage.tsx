import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Smartphone, QrCode, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

export default function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2FA challenge state
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'sms' | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [smsSending, setSmsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFARequired) {
      await handleTwoFAVerify();
      return;
    }
    setIsLoading(true);
    setStatus('loading');
    setErrorMessage('');

    try {
      const result = await login(email, password);
      if (result?.requires2FA) {
        setTwoFARequired(true);
        setTwoFAMethod(result.method || null);
        setIsLoading(false);
        setStatus('idle');
        // Auto-send SMS if method is sms
        if (result.method === 'sms') {
          handleSendSMS();
        }
        return;
      }
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleTwoFAVerify = async () => {
    if (!twoFACode.trim()) { setErrorMessage('Enter your verification code'); return; }
    setIsLoading(true);
    setStatus('loading');
    setErrorMessage('');
    try {
      const result = await login(email, password, twoFACode);
      if (result?.requires2FA) {
        setErrorMessage('Verification failed');
        setIsLoading(false);
        setStatus('error');
        return;
      }
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Invalid code. Try again.');
      setIsLoading(false);
    }
  };

  const handleSendSMS = async () => {
    setSmsSending(true);
    try {
      await authService.send2FALoginSMS(email);
    } catch { /* ignore */ }
    finally { setSmsSending(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Left Side */}
      <div className="hidden md:flex md:w-1/2 relative bg-card items-center justify-center p-12 overflow-hidden border-r border-border">
        <div className="absolute inset-0 overflow-hidden opacity-50">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/4 -left-1/4 w-full h-full bg-primary/20 blur-[120px] rounded-full" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-secondary/20 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 max-w-md text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Logo size="lg" className="mb-8 justify-center" />
            <h1 className="text-5xl font-bold tracking-tight mb-6 text-text">
              Welcome Back to <span className="gradient-text">BMS Engage</span>
            </h1>
            <p className="text-xl text-text-muted leading-relaxed">
              Manage your media operations, schedule content, and scale your agency with our complete publishing system.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="md:hidden absolute inset-0 bg-primary/5 blur-[100px]" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass p-8 rounded-2xl relative z-10 shadow-2xl">

          <AnimatePresence mode="wait">
            {!twoFARequired ? (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2 text-text">Sign In</h2>
                  <p className="text-text-muted text-sm">Enter your credentials to access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="name@agency.com"
                        className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Password</label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot Password?</Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-12 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full py-4 text-lg" isLoading={isLoading}>
                    <AnimatePresence mode="wait">
                      {status === 'success' ? (
                        <motion.div key="s" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> Success
                        </motion.div>
                      ) : (
                        <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          Sign In <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>

                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                    </motion.div>
                  )}
                </form>

                <p className="mt-8 text-center text-sm text-text-muted">
                  Don't have an account? <Link to="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors">Create Account</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    {twoFAMethod === 'app' ? <QrCode size={32} className="text-primary" /> : <Smartphone size={32} className="text-primary" />}
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-text">Two-Factor Authentication</h2>
                  <p className="text-text-muted text-sm">
                    {twoFAMethod === 'app'
                      ? 'Enter the 6-digit code from your authenticator app.'
                      : 'Enter the code sent to your registered phone number.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      value={twoFACode}
                      onChange={e => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-background border border-border rounded-xl py-4 px-4 text-text text-center text-2xl font-mono tracking-[0.5em] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>

                  {twoFAMethod === 'sms' && (
                    <button type="button" onClick={handleSendSMS} disabled={smsSending}
                      className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                      {smsSending ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Resend SMS code
                    </button>
                  )}

                  <Button type="submit" className="w-full py-4 text-lg" isLoading={isLoading}>
                    <AnimatePresence mode="wait">
                      {status === 'success' ? (
                        <motion.div key="s" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> Verified
                        </motion.div>
                      ) : (
                        <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          Verify & Sign In <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>

                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                    </motion.div>
                  )}

                  <button type="button" onClick={() => { setTwoFARequired(false); setTwoFACode(''); setErrorMessage(''); }}
                    className="w-full text-sm text-text-muted hover:text-text transition-colors text-center">
                    ← Back to sign in
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
