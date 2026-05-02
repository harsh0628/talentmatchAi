import React from 'react';
import { AuthProvider } from './AuthContext';

/**
 * A helper component to compose all context providers and avoid
 * deep nesting in the main application entry point.
 * Note: You will need to create EvaluationReportsProvider.
 */
export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};