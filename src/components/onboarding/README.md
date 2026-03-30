# Interactive Context-Aware Onboarding System

This directory contains the implementation of the Interactive Context-Aware Onboarding System for BMS Engage.

## Directory Structure

```
onboarding/
├── types.ts                    # Core TypeScript interfaces and types
├── types.test.ts              # Property-based tests for types
├── index.ts                   # Main exports
├── OnboardingProvider.tsx     # Context provider for state management (TODO)
├── OnboardingCard.tsx         # Tour content card component (TODO)
├── Spotlight.tsx              # Visual highlighting component (TODO)
├── ElementHighlighter.tsx     # DOM query and scroll management (TODO)
├── tourSteps.ts              # Module-specific tour step configurations (TODO)
└── README.md                  # This file
```

## Core Types

All TypeScript interfaces are defined in `types.ts`:

- **State Management**: `TourState`, `OnboardingContextValue`, `OnboardingProviderProps`
- **Tour Configuration**: `TourStep`, `TourStepConfig`, `ModuleName`
- **Component Props**: `OnboardingCardProps`, `SpotlightProps`, `ElementHighlighterProps`
- **Positioning**: `CardPosition`, `SpotlightPosition`, `ElementBounds`, `ViewportInfo`
- **Interaction**: `HighlightOptions`, `InteractionHint`, `ScrollBehavior`
- **Validation**: `StepValidation`, `StepCallbacks`
- **Persistence**: `PersistedTourData`, `TourPreferences`, `TourAnalytics`

## Testing

Property-based tests are implemented using `fast-check` to ensure type correctness and invariants.

Run tests:
```bash
npm test                    # Run all tests once
npm run test:watch         # Run tests in watch mode
npm run test:ui            # Run tests with UI
npm run test:coverage      # Run tests with coverage report
```

## Implementation Status

- [x] Core TypeScript interfaces
- [x] Property-based testing setup
- [x] Testing framework configuration (Vitest + fast-check)
- [ ] OnboardingProvider component
- [ ] OnboardingCard component
- [ ] Spotlight component
- [ ] ElementHighlighter component
- [ ] Tour step configurations

## Next Steps

1. Implement OnboardingProvider with state management
2. Create OnboardingCard component
3. Build Spotlight visual effects
4. Implement ElementHighlighter for DOM manipulation
5. Define module-specific tour steps
