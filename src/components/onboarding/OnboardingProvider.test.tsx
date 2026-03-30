/**
 * Unit tests for OnboardingProvider
 * 
 * Tests state management, navigation, and lifecycle methods
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { OnboardingProvider, useOnboarding } from './OnboardingProvider';
import type { TourStep } from './types';

// Mock tour steps for testing
const mockSteps: TourStep[] = [
  {
    id: 'step-1',
    module: 'dashboard',
    title: 'Welcome',
    description: 'Welcome to the tour',
    targetSelector: '.dashboard',
    position: { type: 'fixed', placement: 'center' },
    highlightOptions: {
      allowInteraction: false,
      showTooltip: false,
      pulseAnimation: true
    }
  },
  {
    id: 'step-2',
    module: 'gallery',
    title: 'Gallery',
    description: 'Your media library',
    targetSelector: '.gallery',
    position: { type: 'fixed', placement: 'center' },
    highlightOptions: {
      allowInteraction: false,
      showTooltip: false,
      pulseAnimation: true
    }
  },
  {
    id: 'step-3',
    module: 'composer',
    title: 'Composer',
    description: 'Create posts',
    targetSelector: '.composer',
    position: { type: 'fixed', placement: 'center' },
    highlightOptions: {
      allowInteraction: false,
      showTooltip: false,
      pulseAnimation: true
    }
  }
];

describe('OnboardingProvider', () => {
  describe('Initial State', () => {
    it('should initialize with inactive state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.isActive).toBe(false);
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toBe(mockSteps[0]);
      expect(result.current.totalSteps).toBe(3);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.highlightedElement).toBe(null);
    });

    it('should calculate correct initial computed values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrevious).toBe(false);
      expect(result.current.progress).toBe(33); // (1/3) * 100 = 33.33 rounded
    });
  });

  describe('startTour', () => {
    it('should activate the tour and reset to first step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toBe(mockSteps[0]);
    });
  });

  describe('nextStep', () => {
    it('should advance to the next step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);
      expect(result.current.currentStep).toBe(mockSteps[1]);
      expect(result.current.progress).toBe(67); // (2/3) * 100 = 66.67 rounded
    });

    it('should complete the tour on last step', () => {
      const onComplete = vi.fn();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps} onComplete={onComplete}>
          {children}
        </OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      // Navigate to last step
      act(() => {
        result.current.goToStep(2);
      });

      // Complete the tour
      act(() => {
        result.current.nextStep();
      });

      expect(result.current.isActive).toBe(false);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should not advance beyond last step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
        result.current.goToStep(2);
      });

      const lastStepIndex = result.current.currentStepIndex;

      act(() => {
        result.current.nextStep(); // This should complete the tour
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('previousStep', () => {
    it('should go back to the previous step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toBe(mockSteps[0]);
    });

    it('should not go before first step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe('goToStep', () => {
    it('should jump to a specific step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.currentStepIndex).toBe(2);
      expect(result.current.currentStep).toBe(mockSteps[2]);
    });

    it('should not jump to invalid step index', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      const currentIndex = result.current.currentStepIndex;

      act(() => {
        result.current.goToStep(99);
      });

      expect(result.current.currentStepIndex).toBe(currentIndex);

      act(() => {
        result.current.goToStep(-1);
      });

      expect(result.current.currentStepIndex).toBe(currentIndex);
    });
  });

  describe('skipTour', () => {
    it('should end the tour and call onSkip callback', () => {
      const onSkip = vi.fn();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps} onSkip={onSkip}>
          {children}
        </OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
        result.current.nextStep();
      });

      act(() => {
        result.current.skipTour();
      });

      expect(result.current.isActive).toBe(false);
      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe('restartTour', () => {
    it('should reset tour to beginning', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);

      act(() => {
        result.current.restartTour();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toBe(mockSteps[0]);
    });
  });

  describe('stopTour', () => {
    it('should deactivate the tour', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.stopTour();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.highlightedElement).toBe(null);
    });
  });

  describe('Computed Properties', () => {
    it('should correctly calculate canGoNext', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      expect(result.current.canGoNext).toBe(true);

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.canGoNext).toBe(false);
    });

    it('should correctly calculate canGoPrevious', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      expect(result.current.canGoPrevious).toBe(false);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.canGoPrevious).toBe(true);
    });

    it('should correctly calculate progress percentage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps}>{children}</OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.startTour();
      });

      expect(result.current.progress).toBe(33); // Step 1 of 3

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.progress).toBe(67); // Step 2 of 3

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.progress).toBe(100); // Step 3 of 3
    });
  });

  describe('Auto-start', () => {
    it('should auto-start tour when autoStart is true', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps} autoStart={true}>
          {children}
        </OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      // Auto-start happens in useEffect, so we need to wait
      expect(result.current.isActive).toBe(true);
    });

    it('should not auto-start tour when autoStart is false', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OnboardingProvider steps={mockSteps} autoStart={false}>
          {children}
        </OnboardingProvider>
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('useOnboarding hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useOnboarding());
      }).toThrow('useOnboarding must be used within an OnboardingProvider');

      console.error = originalError;
    });
  });
});
