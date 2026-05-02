import { createContext, useContext, useEffect, useState } from 'react';
import { getInterviewsApi, updateInterviewApi } from '../services/interviewsApi';
import { getStoredAccessToken } from '../services/apiClient';

const InterviewsContext = createContext(null);

export function InterviewsProvider({ children }) {
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [interviewsError, setInterviewsError] = useState('');

  useEffect(() => {
    async function loadInterviews() {
      if (!getStoredAccessToken()) {
        setInterviews([]);
        setLoadingInterviews(false);
        setInterviewsError('');
        return;
      }

      try {
        setLoadingInterviews(true);
        setInterviewsError('');
        const fetchedInterviews = await getInterviewsApi();
        setInterviews(fetchedInterviews);
      } catch (error) {
        setInterviewsError(error.message || 'Unable to load interviews');
      } finally {
        setLoadingInterviews(false);
      }
    }

    loadInterviews();
  }, []);

  async function updateInterview(interviewId, interviewInput) {
    setInterviewsError('');
    const updatedInterview = await updateInterviewApi(interviewId, interviewInput);
    setInterviews((current) =>
      current.map((interview) => (interview.id === interviewId ? updatedInterview : interview)),
    );
    return updatedInterview;
  }

  const value = {
    interviews,
    loadingInterviews,
    interviewsError,
    updateInterview,
  };

  return <InterviewsContext.Provider value={value}>{children}</InterviewsContext.Provider>;
}

export function useInterviews() {
  const context = useContext(InterviewsContext);

  if (!context) {
    throw new Error('useInterviews must be used inside InterviewsProvider');
  }

  return context;
}
