import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, Eye, EyeOff, Chrome, Apple, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const passwordRequirements = useMemo(() => [
    { label: 'Minimum 8 characters', met: formData.password.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'At least one lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'At least one number', met: /[0-9]/.test(formData.password) },
    { label: 'At least one special character', met: /[^A-Za-z0-9]/.test(formData.password) },
  ], [formData.password]);

  const passwordsMatch = useMemo(() => 
    formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword
  , [formData.password, formData.confirmPassword]);

  const strengthScore = useMemo(() => 
    passwordRequirements.filter(req => req.met).length
  , [passwordRequirements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strengthScore < 5 || !passwordsMatch) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      await signup(formData.fullName, formData.email, formData.password);
      navigate('/verify-email');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5 
            }}
            animate={{ 
              y: [null, Math.random() * -100, null],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 5 + Math.random() * 10, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-primary rounded-full blur-[1px]"
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl glass p-8 md:p-12 rounded-2xl relative z-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <Logo className="justify-center mb-6" size="md" />
          <h1 className="text-3xl font-bold mb-2 text-text">Create Account</h1>
          <p className="text-text-muted">Join BMS Engage and scale your media operations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="John Doe"
                  className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@agency.com"
                  className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
              
              {/* Password Strength Indicator */}
              <div className="mt-3 space-y-2">
                <div className="flex gap-1 h-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full transition-all duration-500 ${
                        i < strengthScore 
                          ? strengthScore <= 2 ? 'bg-red-500' : strengthScore <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {req.met ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-border" />
                      )}
                      <span className={`text-[10px] ${req.met ? 'text-green-500/70' : 'text-text-muted'}`}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className={`w-full bg-background border rounded-xl py-3 pl-12 pr-4 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 transition-all ${
                    formData.confirmPassword.length > 0 
                      ? passwordsMatch ? 'border-green-500/50 focus:ring-green-500/30' : 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-border focus:ring-primary/50'
                  }`}
                />
              </div>
              {formData.confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <X className="w-3 h-3" /> Passwords do not match
                </p>
              )}
              {formData.confirmPassword.length > 0 && passwordsMatch && (
                <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 ml-1">
            <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/50" />
            <label htmlFor="terms" className="text-xs text-text-muted leading-relaxed">
              I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. I understand that BMS Engage will process my data securely.
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-lg"
            isLoading={isLoading}
            disabled={strengthScore < 5 || !passwordsMatch}
          >
            <ShieldCheck className="w-5 h-5 mr-2" /> Create Account
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
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-text-muted">Or sign up with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border hover:bg-primary/5 transition-all group">
            <Chrome className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-text">Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border hover:bg-primary/5 transition-all group">
            <Apple className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-text">Apple</span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
