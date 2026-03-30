/**
 * OnboardingProvider - Centralized state management for the onboarding tour system
 * 
 * This component provides React Context for managing tour state, navigation,
 * and lifecycle across all child components.
 * 
 * Requirements: 1.1, 1.6, 2.1, 2.2, 2.3, 2.4, 1.4, 10.1, 10.2, 10.3, 10.4
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { 
  OnboardingContextValue, 
  OnboardingProviderProps, 
  TourStep,
  TourState 
} from './types';

// Create the context with undefined default (will throw if used outside provider)
const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

// Current tour version for migration support
const CURRENT_TOUR_VERSION = '1.0.0';

// Default tour state
const DEFAULT_TOUR_STATE: TourState = {
  isActive: false,
  currentStepIndex: 0,
  completedSteps: [],
  skippedSteps: [],
  startedAt: 0,
  lastActiveAt: 0,
  version: CURRENT_TOUR_VERSION
};

/**
 * Load tour state from localStorage
 * Handles version validation and migration
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
const loadTourState = (storageKey: string): TourState => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return DEFAULT_TOUR_STATE;
    }

    const parsed = JSON.parse(stored) as TourState;
    
    // Validate state structure
    if (!parsed || typeof parsed !== 'object') {
      console.error('[Onboarding] Invalid tour state structure, resetting to default');
      return DEFAULT_TOUR_STATE;
    }

    // Version validation and migration
    if (parsed.version !== CURRENT_TOUR_VERSION) {
      console.warn(`[Onboarding] Tour state version mismatch (${parsed.version} -> ${CURRENT_TOUR_VERSION}), migrating...`);
      return migrateTourState(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('[Onboarding] Failed to load tour state from localStorage:', error);
    return DEFAULT_TOUR_STATE;
  }
};

/**
 * Migrate tour state from older versions to current version
 * Requirements: 10.3, 10.4
 */
const migrateTourState = (oldState: TourState): TourState => {
  // For now, we only have version 1.0.0
  // Future migrations would go here based on oldState.version
  
  // Ensure all required fields exist
  const migrated: TourState = {
    isActive: oldState.isActive ?? false,
    currentStepIndex: oldState.currentStepIndex ?? 0,
    completedSteps: Array.isArray(oldState.completedSteps) ? oldState.completedSteps : [],
    skippedSteps: Array.isArray(oldState.skippedSteps) ? oldState.skippedSteps : [],
    startedAt: oldState.startedAt ?? 0,
    lastActiveAt: oldState.lastActiveAt ?? 0,
    completedAt: oldState.completedAt,
    version: CURRENT_TOUR_VERSION
  };

  return migrated;
};

/**
 * Save tour state to localStorage
 * Requirements: 1.4, 10.1
 */
const saveTourState = (storageKey: string, state: TourState): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.error('[Onboarding] Failed to save tour state to localStorage:', error);
  }
};

/**
 * OnboardingProvider Component
 * 
 * Manages the complete state of the onboarding tour including:
 * - Active/inactive state
 * - Current step tracking
 * - Navigation between steps
 * - Progress calculation
 * - Tour lifecycle (start, stop, skip, restart)
 * - localStorage persistence
 */
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  steps,
  autoStart = false,
  onComplete,
  onSkip,
  storageKey = 'bms-engage-onboarding-tour'
}) => {
  // Load initial state from localStorage
  const [tourState, setTourState] = useState<TourState>(() => loadTourState(storageKey));
  
  // State management
  const [isActive, setIsActive] = useState(tourState.isActive);
  const [currentStepIndex, setCurrentStepIndex] = useState(tourState.currentStepIndex);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  // Persist tour state to localStorage whenever it changes
  // Requirements: 1.4, 10.1
  useEffect(() => {
    saveTourState(storageKey, tourState);
  }, [tourState, storageKey]);

  // Computed values
  const currentStep = useMemo<TourStep | null>(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return null;
  }, [currentStepIndex, steps]);

  const totalSteps = steps.length;

  const isComplete = useMemo(() => {
    return tourState.completedSteps.length === totalSteps && totalSteps > 0;
  }, [tourState.completedSteps.length, totalSteps]);

  const canGoNext = useMemo(() => {
    return currentStepIndex < totalSteps - 1;
  }, [currentStepIndex, totalSteps]);

  const canGoPrevious = useMemo(() => {
    return currentStepIndex > 0;
  }, [currentStepIndex]);

  const progress = useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  }, [currentStepIndex, totalSteps]);

  // Action methods
  const startTour = useCallback(() => {
    const now = Date.now();
    const newState: TourState = {
      isActive: true,
      currentStepIndex: 0,
      completedSteps: [],
      skippedSteps: [],
      startedAt: now,
      lastActiveAt: now,
      version: CURRENT_TOUR_VERSION
    };
    
    setIsActive(true);
    setCurrentStepIndex(0);
    setTourState(newState);
  }, []);

  const stopTour = useCallback(() => {
    const now = Date.now();
    const newState: TourState = {
      ...tourState,
      isActive: false,
      lastActiveAt: now
    };
    
    setIsActive(false);
    setHighlightedElement(null);
    setTourState(newState);
  }, [tourState]);

  const nextStep = useCallback(() => {
    const now = Date.now();
    
    if (canGoNext) {
      const newIndex = currentStepIndex + 1;
      const newState: TourState = {
        ...tourState,
        currentStepIndex: newIndex,
        lastActiveAt: now,
        completedSteps: [...tourState.completedSteps, steps[currentStepIndex].id]
      };
      
      setCurrentStepIndex(newIndex);
      setTourState(newState);
    } else if (currentStepIndex === totalSteps - 1) {
      // Last step - complete the tour
      const newState: TourState = {
        ...tourState,
        completedSteps: [...tourState.completedSteps, steps[currentStepIndex].id],
        completedAt: now,
        lastActiveAt: now,
        isActive: false
      };
      
      setIsActive(false);
      setHighlightedElement(null);
      setTourState(newState);
      onComplete?.();
    }
  }, [canGoNext, currentStepIndex, totalSteps, steps, tourState, onComplete]);

  const previousStep = useCallback(() => {
    if (canGoPrevious) {
      const newIndex = currentStepIndex - 1;
      const now = Date.now();
      const newState: TourState = {
        ...tourState,
        currentStepIndex: newIndex,
        lastActiveAt: now
      };
      
      setCurrentStepIndex(newIndex);
      setTourState(newState);
    }
  }, [canGoPrevious, currentStepIndex, tourState]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      const now = Date.now();
      const newState: TourState = {
        ...tourState,
        currentStepIndex: index,
        lastActiveAt: now
      };
      
      setCurrentStepIndex(index);
      setTourState(newState);
    }
  }, [totalSteps, tourState]);

  const skipTour = useCallback(() => {
    const now = Date.now();
    const newState: TourState = {
      ...tourState,
      skippedSteps: [...tourState.skippedSteps, ...steps.slice(currentStepIndex).map(s => s.id)],
      lastActiveAt: now,
      isActive: false
    };
    
    setIsActive(false);
    setHighlightedElement(null);
    setTourState(newState);
    onSkip?.();
  }, [currentStepIndex, steps, tourState, onSkip]);

  const restartTour = useCallback(() => {
    const now = Date.now();
    const newState: TourState = {
      isActive: true,
      currentStepIndex: 0,
      completedSteps: [],
      skippedSteps: [],
      startedAt: now,
      lastActiveAt: now,
      version: CURRENT_TOUR_VERSION
    };
    
    setIsActive(true);
    setCurrentStepIndex(0);
    setTourState(newState);
  }, []);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && !isActive && steps.length > 0) {
      startTour();
    }
  }, [autoStart, isActive, steps.length, startTour]);

  // Context value
  const contextValue = useMemo<OnboardingContextValue>(() => ({
    // State
    isActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    isComplete,
    highlightedElement,
    
    // Actions
    startTour,
    stopTour,
    nextStep,
    previousStep,
    goToStep,
    skipTour,
    restartTour,
    
    // Utilities
    canGoNext,
    canGoPrevious,
    progress
  }), [
    isActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    isComplete,
    highlightedElement,
    startTour,
    stopTour,
    nextStep,
    previousStep,
    goToStep,
    skipTour,
    restartTour,
    canGoNext,
    canGoPrevious,
    progress
  ]);

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

/**
 * Custom hook to access the onboarding context
 * 
 * @throws Error if used outside of OnboardingProvider
 */
export const useOnboarding = (): OnboardingContextValue => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
