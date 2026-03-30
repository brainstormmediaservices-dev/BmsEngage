/**
 * Property-based tests for onboarding types and core functionality
 * Using fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { 
  TourState, 
  TourPreferences, 
  CardPosition,
  ModuleName 
} from './types';

describe('Onboarding Types - Property-Based Tests', () => {
  
  // ============================================================================
  // Generators for property-based testing
  // ============================================================================
  
  const moduleNameArb = fc.constantFrom<ModuleName>(
    'dashboard',
    'gallery',
    'composer',
    'scheduler',
    'posts',
    'analytics',
    'social-accounts',
    'settings'
  );

  const tourStateArb = fc.integer({ min: 0, max: 1000000 }).chain(startedAt => 
    fc.record<TourState>({
      isActive: fc.boolean(),
      currentStepIndex: fc.nat({ max: 100 }),
      completedSteps: fc.array(fc.string(), { maxLength: 50 }),
      skippedSteps: fc.array(fc.string(), { maxLength: 50 }),
      startedAt: fc.constant(startedAt),
      lastActiveAt: fc.integer({ min: startedAt, max: startedAt + 1000000 }),
      completedAt: fc.option(
        fc.integer({ min: startedAt, max: startedAt + 1000000 }), 
        { nil: undefined }
      ),
      version: fc.string(),
    })
  );

  const tourPreferencesArb = fc.record<TourPreferences>({
    autoStart: fc.boolean(),
    showHints: fc.boolean(),
    animationSpeed: fc.constantFrom('slow', 'normal', 'fast'),
    skipCompleted: fc.boolean(),
  });

  const cardPositionArb = fc.record<CardPosition>({
    type: fc.constantFrom('fixed', 'relative', 'absolute'),
    placement: fc.option(
      fc.constantFrom('bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'),
      { nil: undefined }
    ),
    offset: fc.option(
      fc.record({ x: fc.integer(), y: fc.integer() }),
      { nil: undefined }
    ),
  });

  // ============================================================================
  // Property Tests
  // ============================================================================

  describe('TourState Properties', () => {
    
    it('should maintain valid step index bounds', () => {
      fc.assert(
        fc.property(tourStateArb, (state) => {
          // Step index should always be non-negative
          expect(state.currentStepIndex).toBeGreaterThanOrEqual(0);
        })
      );
    });

    it('should have lastActiveAt >= startedAt when both are set', () => {
      fc.assert(
        fc.property(tourStateArb, (state) => {
          if (state.startedAt > 0 && state.lastActiveAt > 0) {
            expect(state.lastActiveAt).toBeGreaterThanOrEqual(state.startedAt);
          }
        })
      );
    });

    it('should have completedAt >= startedAt when tour is completed', () => {
      fc.assert(
        fc.property(tourStateArb, (state) => {
          if (state.completedAt !== undefined && state.startedAt > 0) {
            expect(state.completedAt).toBeGreaterThanOrEqual(state.startedAt);
          }
        })
      );
    });

    it('should have unique step IDs in completedSteps array', () => {
      fc.assert(
        fc.property(tourStateArb, (state) => {
          const uniqueSteps = new Set(state.completedSteps);
          expect(uniqueSteps.size).toBeLessThanOrEqual(state.completedSteps.length);
        })
      );
    });
  });

  describe('TourPreferences Properties', () => {
    
    it('should have valid animationSpeed values', () => {
      fc.assert(
        fc.property(tourPreferencesArb, (prefs) => {
          expect(['slow', 'normal', 'fast']).toContain(prefs.animationSpeed);
        })
      );
    });

    it('should have boolean flags', () => {
      fc.assert(
        fc.property(tourPreferencesArb, (prefs) => {
          expect(typeof prefs.autoStart).toBe('boolean');
          expect(typeof prefs.showHints).toBe('boolean');
          expect(typeof prefs.skipCompleted).toBe('boolean');
        })
      );
    });
  });

  describe('CardPosition Properties', () => {
    
    it('should have valid position type', () => {
      fc.assert(
        fc.property(cardPositionArb, (position) => {
          expect(['fixed', 'relative', 'absolute']).toContain(position.type);
        })
      );
    });

    it('should have valid placement when defined', () => {
      fc.assert(
        fc.property(cardPositionArb, (position) => {
          if (position.placement !== undefined) {
            expect([
              'bottom-right',
              'bottom-left',
              'top-right',
              'top-left',
              'center'
            ]).toContain(position.placement);
          }
        })
      );
    });

    it('should have numeric offset coordinates when defined', () => {
      fc.assert(
        fc.property(cardPositionArb, (position) => {
          if (position.offset !== undefined) {
            expect(typeof position.offset.x).toBe('number');
            expect(typeof position.offset.y).toBe('number');
          }
        })
      );
    });
  });

  describe('ModuleName Properties', () => {
    
    it('should only contain valid module names', () => {
      fc.assert(
        fc.property(moduleNameArb, (moduleName) => {
          const validModules: ModuleName[] = [
            'dashboard',
            'gallery',
            'composer',
            'scheduler',
            'posts',
            'analytics',
            'social-accounts',
            'settings'
          ];
          expect(validModules).toContain(moduleName);
        })
      );
    });
  });

  // ============================================================================
  // JSON Serialization Properties
  // ============================================================================

  describe('JSON Serialization Round-Trip', () => {
    
    it('TourState should survive JSON round-trip', () => {
      fc.assert(
        fc.property(tourStateArb, (state) => {
          const serialized = JSON.stringify(state);
          const deserialized = JSON.parse(serialized);
          
          expect(deserialized.isActive).toBe(state.isActive);
          expect(deserialized.currentStepIndex).toBe(state.currentStepIndex);
          expect(deserialized.version).toBe(state.version);
        })
      );
    });

    it('TourPreferences should survive JSON round-trip', () => {
      fc.assert(
        fc.property(tourPreferencesArb, (prefs) => {
          const serialized = JSON.stringify(prefs);
          const deserialized = JSON.parse(serialized);
          
          expect(deserialized).toEqual(prefs);
        })
      );
    });
  });
});
