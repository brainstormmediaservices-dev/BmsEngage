/**
 * Core TypeScript interfaces for the Interactive Context-Aware Onboarding System
 */

import { ReactNode } from 'react';

// ============================================================================
// Module and State Types
// ============================================================================

export type ModuleName = 
  | 'dashboard' 
  | 'gallery' 
  | 'composer' 
  | 'scheduler' 
  | 'posts' 
  | 'analytics' 
  | 'social-accounts' 
  | 'settings';

export interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  completedSteps: string[]; // Step IDs
  skippedSteps: string[]; // Step IDs
  startedAt: number; // Timestamp
  lastActiveAt: number; // Timestamp
  completedAt?: number; // Timestamp
  version: string; // Tour version for migrations
}

// ============================================================================
// Card Positioning Types
// ============================================================================

export interface CardPosition {
  type: 'fixed' | 'relative' | 'absolute';
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  offset?: { x: number; y: number };
}

// ============================================================================
// Highlight and Interaction Types
// ============================================================================

export interface HighlightOptions {
  allowInteraction: boolean;
  showTooltip: boolean;
  tooltipContent?: string;
  pulseAnimation: boolean;
}

export interface InteractionHint {
  selector: string;
  tooltip: string;
  trigger: 'hover' | 'click' | 'focus';
}

// ============================================================================
// Step Validation and Callbacks
// ============================================================================

export interface StepValidation {
  requireElement: boolean;
  requireVisible: boolean;
  customValidator?: () => boolean;
}

export interface StepCallbacks {
  onEnter?: () => void | Promise<void>;
  onExit?: () => void | Promise<void>;
  onSkip?: () => void;
  onComplete?: () => void;
}

// ============================================================================
// Tour Step Configuration
// ============================================================================

export interface TourStep {
  id: string;
  module: ModuleName;
  title: string;
  description: string;
  icon?: string;
  targetSelector: string;
  fallbackSelector?: string;
  position: CardPosition;
  highlightOptions: HighlightOptions;
  validation?: StepValidation;
  callbacks?: StepCallbacks;
  interactionHints?: InteractionHint[];
}

export interface TourStepConfig {
  steps: TourStep[];
  version: string;
}

// ============================================================================
// Context and Provider Types
// ============================================================================

export interface OnboardingContextValue {
  // State
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  totalSteps: number;
  isComplete: boolean;
  highlightedElement: HTMLElement | null;
  
  // Actions
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
  restartTour: () => void;
  
  // Utilities
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number; // 0-100
}

export interface OnboardingProviderProps {
  children: ReactNode;
  steps: TourStep[];
  autoStart?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  storageKey?: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface OnboardingCardProps {
  position?: CardPosition;
  className?: string;
  showProgress?: boolean;
  showStepIndicator?: boolean;
  allowSkip?: boolean;
}

export interface StepContentProps {
  title: string;
  description: string;
  icon?: ReactNode;
  media?: string; // Optional screenshot/preview
}

export interface SpotlightProps {
  targetElement: HTMLElement | null;
  isActive: boolean;
  padding?: number;
  borderRadius?: number;
  glowColor?: string;
  backdropOpacity?: number;
  showPointer?: boolean;
  pointerDirection?: 'top' | 'bottom' | 'left' | 'right';
  animationDuration?: number;
}

export interface ElementHighlighterProps {
  selector: string;
  onElementFound?: (element: HTMLElement) => void;
  onElementNotFound?: () => void;
  scrollBehavior?: ScrollBehavior;
  scrollOffset?: number;
}

// ============================================================================
// Scroll and Element Types
// ============================================================================

export interface ScrollBehavior {
  enabled: boolean;
  behavior: 'auto' | 'smooth';
  block: 'start' | 'center' | 'end' | 'nearest';
  inline: 'start' | 'center' | 'end' | 'nearest';
}

export interface ElementBounds {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
  centerX: number;
  centerY: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

// ============================================================================
// Spotlight Position and Pointer Types
// ============================================================================

export interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface PointerConfig {
  from: { x: number; y: number };
  to: { x: number; y: number };
  curvature: number;
}

// ============================================================================
// Persistence and Analytics Types
// ============================================================================

export interface PersistedTourData {
  userId?: string;
  tourState: TourState;
  preferences: TourPreferences;
  analytics: TourAnalytics;
}

export interface TourPreferences {
  autoStart: boolean;
  showHints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  skipCompleted: boolean;
}

export interface TourAnalytics {
  totalSteps: number;
  completedSteps: number;
  skippedSteps: number;
  averageStepDuration: number;
  dropoffStep?: string;
  completionRate: number;
}
