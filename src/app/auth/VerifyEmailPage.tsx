import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const verificationToken = searchParams.get('token');
  
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Auto-verify if token is in URL
    if (verificationToken) {
      handleVerify(verificationToken);
    }
  }, [verificationToken]);

  const handleVerify = async (token: string) => {
    setIsVerifying(true);
    setErrorMessage('');
    
    try {
      const response = await authService.verifyEmail(token);
      setIsVerified(true);
      await refreshUser();
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.expired) {
        setErrorMessage('This verification link has expired. Please request a new one.');
      } else {
        setErrorMessage(errorData?.error || 'Verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) {
      setErrorMessage('No email found. Please sign up again.');
      return;
    }
    
    setIsResending(true);
    setErrorMessage('');
    
    try {
      await authService.resendVerification(user.email);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to resend verification');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-10 rounded-2xl relative z-10 shadow-2xl text-center"
      >
        <Logo className="justify-center mb-10" size="sm" />
        
        <AnimatePresence mode="wait">
          {isVerifying ? (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="text-text-muted">Verifying your email...</p>
            </motion.div>
          ) : !isVerified ? (
            <motion.div
              key="verify-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
                <Mail className="w-10 h-10 text-primary" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/5 rounded-full -z-10"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold mb-3 text-text">Verify your email</h1>
                <p className="text-text-muted text-sm leading-relaxed">
                  We've sent a verification link to {user?.email || 'your email address'}. Please click the link to activate your account.
                </p>
                <p className="text-text-muted text-xs mt-2 italic">
                  ⏰ The verification link expires in 3 minutes for security.
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full py-4 group" 
                  onClick={handleResend}
                  isLoading={isResending}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  Resend Verification Link
                </Button>
              </div>

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

              <Link to="/login" className="block text-sm text-text-muted hover:text-text transition-colors">
                Back to Sign In
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="verified-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>

              <div>
                <h1 className="text-2xl font-bold mb-3 text-text">Email Verified!</h1>
                <p className="text-text-muted text-sm leading-relaxed">
                  Your account has been successfully verified. You're all set to start managing your media operations.
                </p>
              </div>

              <Button className="w-full py-4" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-border flex items-center justify-center gap-2 text-[10px] text-text-muted uppercase tracking-widest font-bold">
          <ShieldCheck className="w-3 h-3" /> Secure Enterprise Authentication
        </div>
      </motion.div>
    </div>
  );
}
