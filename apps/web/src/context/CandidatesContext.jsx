import { createContext, useContext, useEffect, useState } from 'react';
import {
  createCandidateApi,
  deleteCandidateApi,
  getCandidatesApi,
  updateCandidateApi,
} from '../services/candidatesApi';
import { getStoredAccessToken } from '../services/apiClient';

const CandidatesContext = createContext(null);

export function CandidatesProvider({ children }) {
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidatesError, setCandidatesError] = useState('');

  useEffect(() => {
    async function loadCandidates() {
      if (!getStoredAccessToken()) {
        setCandidates([]);
        setLoadingCandidates(false);
        setCandidatesError('');
        return;
      }

      try {
        setLoadingCandidates(true);
        setCandidatesError('');
        const fetchedCandidates = await getCandidatesApi();
        setCandidates(fetchedCandidates);
      } catch (error) {
        setCandidatesError(error.message || 'Unable to load candidates');
      } finally {
        setLoadingCandidates(false);
      }
    }

    loadCandidates();
  }, []);

  async function addCandidate(candidateInput) {
    setCandidatesError('');
    const createdCandidate = await createCandidateApi(candidateInput);
    setCandidates((current) => [createdCandidate, ...current]);
    return createdCandidate;
  }

  async function updateCandidate(candidateId, candidateInput) {
    setCandidatesError('');
    const updatedCandidate = await updateCandidateApi(candidateId, candidateInput);
    setCandidates((current) =>
      current.map((candidate) => (candidate.id === candidateId ? updatedCandidate : candidate)),
    );
    return updatedCandidate;
  }

  async function deleteCandidate(candidateId) {
    setCandidatesError('');
    await deleteCandidateApi(candidateId);
    setCandidates((current) => current.filter((candidate) => candidate.id !== candidateId));
  }

  function getCandidateById(candidateId) {
    return candidates.find((candidate) => candidate.id === candidateId);
  }

  const value = {
    candidates,
    loadingCandidates,
    candidatesError,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    getCandidateById,
  };

  return <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>;
}

export function useCandidates() {
  const context = useContext(CandidatesContext);

  if (!context) {
    throw new Error('useCandidates must be used inside CandidatesProvider');
  }

  return context;
}
