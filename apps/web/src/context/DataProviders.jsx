import React from 'react';
import { CandidatesProvider } from './CandidatesContext';
import { EvaluationReportsProvider } from './EvaluationReportsContext';
import { InterviewsProvider } from './InterviewsContext';
import { JobsProvider } from './JobsContext';

export function DataProviders({ children }) {
  return (
    <JobsProvider>
      <CandidatesProvider>
        <InterviewsProvider>
          <EvaluationReportsProvider>{children}</EvaluationReportsProvider>
        </InterviewsProvider>
      </CandidatesProvider>
    </JobsProvider>
  );
}
