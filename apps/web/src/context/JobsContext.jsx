import { createContext, useContext, useEffect, useState } from 'react';
import {
  createJobApi,
  deleteJobApi,
  getJobsApi,
  updateJobApi,
} from '../services/jobsApi';
import { getStoredAccessToken } from '../services/apiClient';

const JobsContext = createContext(null);

export function JobsProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState('');

  // Load jobs from backend when app starts.
  useEffect(() => {
    async function loadJobs() {
      if (!getStoredAccessToken()) {
        setJobs([]);
        setLoadingJobs(false);
        setJobsError('');
        return;
      }

      try {
        setLoadingJobs(true);
        setJobsError('');
        const fetchedJobs = await getJobsApi();
        setJobs(fetchedJobs);
      } catch (error) {
        setJobsError(error.message || 'Unable to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    }

    loadJobs();
  }, []);

  // Create and add a new job to the top of the list.
  async function addJob(jobInput) {
    setJobsError('');
    const createdJob = await createJobApi(jobInput);
    setJobs((current) => [createdJob, ...current]);
    return createdJob;
  }

  // Remove one job by id.
  async function deleteJob(jobId) {
    setJobsError('');
    await deleteJobApi(jobId);
    setJobs((current) => current.filter((job) => job.id !== jobId));
  }

  // Update a specific job while keeping other jobs unchanged.
  async function updateJob(jobId, jobInput) {
    setJobsError('');
    const updatedJob = await updateJobApi(jobId, jobInput);
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? updatedJob
          : job,
      ),
    );
    return updatedJob;
  }

  // Helper for edit form to fetch one job by id.
  function getJobById(jobId) {
    return jobs.find((job) => job.id === jobId);
  }

  const value = {
    jobs,
    loadingJobs,
    jobsError,
    addJob,
    deleteJob,
    updateJob,
    getJobById,
  };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const context = useContext(JobsContext);

  // This guard gives a clear error if hook is used outside provider.
  if (!context) {
    throw new Error('useJobs must be used inside JobsProvider');
  }

  return context;
}
