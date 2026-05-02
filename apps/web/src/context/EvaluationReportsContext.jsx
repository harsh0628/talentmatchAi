import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createEvaluationReportApi,
  getEvaluationReportsApi,
  updateEvaluationReportApi,
} from '../services/evaluationReportsApi';
import { getStoredAccessToken } from '../services/apiClient';

const EvaluationReportsContext = createContext(null);

export function EvaluationReportsProvider({ children }) {
  const [evaluationReports, setEvaluationReports] = useState([]);
  const [loadingEvaluationReports, setLoadingEvaluationReports] = useState(true);
  const [evaluationReportsError, setEvaluationReportsError] = useState('');

  useEffect(() => {
    async function loadEvaluationReports() {
      if (!getStoredAccessToken()) {
        setEvaluationReports([]);
        setLoadingEvaluationReports(false);
        setEvaluationReportsError('');
        return;
      }

      try {
        setLoadingEvaluationReports(true);
        setEvaluationReportsError('');
        const fetchedReports = await getEvaluationReportsApi();
        setEvaluationReports(fetchedReports);
      } catch (error) {
        setEvaluationReportsError(error.message || 'Unable to load evaluation reports');
      } finally {
        setLoadingEvaluationReports(false);
      }
    }

    loadEvaluationReports();
  }, []);

  async function addEvaluationReport(reportInput) {
    setEvaluationReportsError('');
    const createdReport = await createEvaluationReportApi(reportInput);
    setEvaluationReports((current) => [createdReport, ...current]);
    return createdReport;
  }

  async function updateEvaluationReport(reportId, reportInput) {
    setEvaluationReportsError('');
    const updatedReport = await updateEvaluationReportApi(reportId, reportInput);
    setEvaluationReports((current) =>
      current.map((report) => (report.id === reportId ? updatedReport : report)),
    );
    return updatedReport;
  }

  const value = useMemo(
    () => ({
      evaluationReports,
      loadingEvaluationReports,
      evaluationReportsError,
      addEvaluationReport,
      updateEvaluationReport,
    }),
    [evaluationReports, loadingEvaluationReports, evaluationReportsError],
  );

  return (
    <EvaluationReportsContext.Provider value={value}>
      {children}
    </EvaluationReportsContext.Provider>
  );
}

export function useEvaluationReports() {
  const context = useContext(EvaluationReportsContext);

  if (!context) {
    throw new Error('useEvaluationReports must be used inside EvaluationReportsProvider');
  }

  return context;
}
