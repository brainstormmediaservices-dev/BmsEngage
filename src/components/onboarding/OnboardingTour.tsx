import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  route: string;
  features: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to BMS Engage! 🎉',
    description: 'Your complete social media management platform. Let\'s take a quick tour of all the powerful features available to you.',
    icon: '👋',
    route: '/dashboard',
    features: [
      'Manage multiple social accounts',
      'Schedule posts across platforms',
      'Track analytics and performance',
      'Collaborate with your team'
    ]
  },
  {
    id: 2,
    title: 'Dashboard Overview 📊',
    description: 'Your central hub for monitoring all activities. View quick stats, recent content, and upcoming scheduled posts at a glance.',
    icon: '📊',
    route: '/dashboard',
    features: [
      'Real-time performance metrics',
      'Quick action buttons',
      'Recent content preview',
      'Upcoming post queue'
    ]
  },
  {
    id: 3,
    title: 'Media Gallery 🖼️',
    description: 'Your centralized media library. Upload, organize, and manage all your visual content in one place.',
    icon: '🖼️',
    route: '/gallery',
    features: [
      'Drag & drop uploads',
      'Smart categorization',
      'Advanced search & filters',
      'Asset version control'
    ]
  },
  {
    id: 4,
    title: 'Post Composer ✍️',
    description: 'Create engaging content for multiple platforms simultaneously. Use AI to generate captions and optimize your posts.',
    icon: '✍️',
    route: '/composer',
    features: [
      'Multi-platform posting',
      'AI caption generation',
      'Real-time previews',
      'Smart scheduling'
    ]
  },
  {
    id: 5,
    title: 'Content Scheduler 📅',
    description: 'Plan your content calendar with monthly, weekly, and daily views. Never miss a posting opportunity.',
    icon: '📅',
    route: '/scheduler',
    features: [
      'Multiple calendar views',
      'Drag & drop scheduling',
      'Best time suggestions',
      'Bulk scheduling'
    ]
  },
  {
    id: 6,
    title: 'Live Posts Feed 📱',
    description: 'Monitor your live social media feeds in real-time. Track engagement and respond to your audience instantly.',
    icon: '📱',
    route: '/posts',
    features: [
      'Real-time feed monitoring',
      'Engagement tracking',
      'Top performing posts',
      'Quick insights'
    ]
  },
  {
    id: 7,
    title: 'Analytics Dashboard 📈',
    description: 'Deep dive into your performance metrics. Track reach, engagement, and ROI across all platforms.',
    icon: '📈',
    route: '/analytics',
    features: [
      'Comprehensive metrics',
      'Interactive charts',
      'Platform comparison',
      'Export reports'
    ]
  },
  {
    id: 8,
    title: 'Social Accounts 🔗',
    description: 'Connect and manage all your social media accounts. Secure OAuth authentication keeps your data safe.',
    icon: '🔗',
    route: '/social-accounts',
    features: [
      'Multi-platform support',
      'Secure OAuth login',
      'Account health monitoring',
      'Easy reconnection'
    ]
  },
  {
    id: 9,
    title: 'You\'re All Set! 🚀',
    description: 'You\'re ready to start managing your social media like a pro. Connect your accounts and create your first post!',
    icon: '🚀',
    route: '/social-accounts',
    features: [
      'Connect your first account',
      'Upload some media',
      'Create your first post',
      'Schedule and publish'
    ]
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTour = ({ onComplete, onSkip }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const step = onboardingSteps[currentStep];

  useEffect(() => {
    if (step) {
      navigate(step.route);
    }
  }, [currentStep, step, navigate]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card border border-border rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-8 pb-6 bg-gradient-to-br from-primary/10 to-primary/5">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-text"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <div className="text-6xl mb-4">{step.icon}</div>
              <h2 className="text-2xl font-bold text-text mb-2">{step.title}</h2>
              <p className="text-text-muted text-sm max-w-md mx-auto">{step.description}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-3 mb-6">
              {step.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check size={14} className="text-primary" />
                  </div>
                  <p className="text-sm text-text">{feature}</p>
                </motion.div>
              ))}
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted font-semibold">
                  Step {currentStep + 1} of {onboardingSteps.length}
                </span>
                <span className="text-xs text-text-muted">
                  {Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}% Complete
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 text-sm font-semibold text-text-muted hover:text-text transition-colors"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20"
                >
                  {isLastStep ? (
                    <>
                      Get Started
                      <Check size={16} />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
