import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowLeft, Send, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import authService from '../../services/authService';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  
  const [step, setStep] = useState<'email' | 'success' | 'reset'>(resetToken ? 'reset' : 'email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      await authService.forgotPassword(email);
      setStep('success');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    if (passwords.new.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      await authService.resetPassword({ 
        token: resetToken || '', 
        password: passwords.new 
      });
      window.location.href = '/login';
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to reset password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-8 rounded-2xl relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" size="sm" />
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div
                key="email-head"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-2xl font-bold mb-2 text-text">Forgot Password?</h1>
                <p className="text-text-muted text-sm">No worries, we'll send you reset instructions.</p>
              </motion.div>
            )}
            {step === 'success' && (
              <motion.div
                key="success-head"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-text">Check your email</h1>
                <p className="text-text-muted text-sm">We've sent a password reset link to <span className="text-text font-medium">{email}</span></p>
              </motion.div>
            )}
            {step === 'reset' && (
              <motion.div
                key="reset-head"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-2xl font-bold mb-2 text-text">Reset Password</h1>
                <p className="text-text-muted text-sm">Enter a new secure password for your account.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.form
              key="email-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSendReset}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@agency.com"
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-4" isLoading={isLoading}>
                <Send className="w-4 h-4 mr-2" /> Send Reset Link
              </Button>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errorMessage}
                </motion.div>
              )}

              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </motion.form>
          )}

          {step === 'success' && (
            <motion.div
              key="success-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <p className="text-center text-sm text-text-muted">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button 
                variant="outline" 
                className="w-full py-4" 
                onClick={() => setStep('email')}
              >
                Resend Email
              </Button>
              <button 
                onClick={() => setStep('reset')}
                className="w-full text-xs text-primary/50 hover:text-primary transition-colors"
              >
                (Demo: Skip to Reset Form)
              </button>
              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </motion.div>
          )}

          {step === 'reset' && (
            <motion.form
              key="reset-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleResetPassword}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-12 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Confirm New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-4" isLoading={isLoading}>
                <ShieldCheck className="w-4 h-4 mr-2" /> Reset Password
              </Button>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errorMessage}
                </motion.div>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
