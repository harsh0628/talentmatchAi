import { useEffect, useMemo, useState } from 'react';
import { useCandidates } from '../context/CandidatesContext';
import {
  createEvaluationReportApi,
  getEvaluationReportsApi,
  updateEvaluationReportApi,
} from '../services/evaluationReportsApi';

function EvaluationReportPage() {
  const { candidates, loadingCandidates, candidatesError } = useCandidates();

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [form, setForm] = useState({
    technical: '7',
    communication: '7',
    problemSolving: '7',
    recommendation: 'Hold',
    summary: '',
    strengths: '',
    improvements: '',
  });

  useEffect(() => {
    async function loadReports() {
      try {
        setLoadingReports(true);
        setReportsError('');
        const fetchedReports = await getEvaluationReportsApi();
        setReports(fetchedReports);
      } catch (error) {
        setReportsError(error.message || 'Unable to load evaluation reports');
      } finally {
        setLoadingReports(false);
      }
    }

    loadReports();
  }, []);

  useEffect(() => {
    if (!selectedCandidateId && candidates.length > 0) {
      setSelectedCandidateId(candidates[0].id);
    }
  }, [candidates, selectedCandidateId]);

  const selectedCandidate = useMemo(
    () => candidates.find((item) => item.id === selectedCandidateId),
    [candidates, selectedCandidateId],
  );

  const selectedReport = useMemo(
    () => reports.find((item) => item.candidateId === selectedCandidateId),
    [reports, selectedCandidateId],
  );

  useEffect(() => {
    if (!selectedCandidateId) {
      return;
    }

    if (selectedReport) {
      setForm({
        technical: String(selectedReport.technical),
        communication: String(selectedReport.communication),
        problemSolving: String(selectedReport.problemSolving),
        recommendation: selectedReport.recommendation,
        summary: selectedReport.summary,
        strengths: selectedReport.strengths.join(', '),
        improvements: selectedReport.improvements.join(', '),
      });
      return;
    }

    setForm({
      technical: '7',
      communication: '7',
      problemSolving: '7',
      recommendation: 'Hold',
      summary: '',
      strengths: '',
      improvements: '',
    });
  }, [selectedCandidateId, selectedReport]);

  function updateFormField(field, value) {
    setSaveMessage('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  function parseList(value) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function saveReport() {
    if (!selectedCandidate) {
      return;
    }

    const payload = {
      candidateId: selectedCandidate.id,
      name: selectedCandidate.name,
      role: selectedCandidate.role,
      technical: Number(form.technical),
      communication: Number(form.communication),
      problemSolving: Number(form.problemSolving),
      recommendation: form.recommendation,
      summary: form.summary,
      strengths: parseList(form.strengths),
      improvements: parseList(form.improvements),
    };

    try {
      setReportsError('');
      setSaveMessage('');

      if (selectedReport) {
        const updated = await updateEvaluationReportApi(selectedReport.id, payload);
        setReports((current) => current.map((item) => (item.id === selectedReport.id ? updated : item)));
        setSaveMessage('Report updated successfully.');
        return;
      }

      const created = await createEvaluationReportApi(payload);
      setReports((current) => [created, ...current]);
      setSaveMessage('Report created successfully.');
    } catch (error) {
      setReportsError(error.message || 'Unable to save report');
    }
  }

  if (loadingCandidates || loadingReports) {
    return <p className="empty-state">Loading evaluation data from backend...</p>;
  }

  if (candidatesError) {
    return <p className="error">{candidatesError}</p>;
  }

  if (candidates.length === 0) {
    return <p className="empty-state">Add at least one candidate to create an evaluation report.</p>;
  }

  const technical = Number(form.technical || 0);
  const communication = Number(form.communication || 0);
  const problemSolving = Number(form.problemSolving || 0);

  return (
    <div>
      <h2 className="section-title">AI Evaluation Report</h2>
      <p className="section-desc">Backend-powered report editor with persistent candidate evaluation.</p>

      {reportsError ? <p className="error">{reportsError}</p> : null}

      <div className="panel filter-bar">
        <label htmlFor="candidateReport">Candidate</label>
        <select
          id="candidateReport"
          className="filter-select"
          value={selectedCandidateId}
          onChange={(event) => setSelectedCandidateId(event.target.value)}
        >
          {candidates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="cards-grid-2">
        <div className="panel">
          <h3>Candidate</h3>
          <p>{selectedCandidate?.name}</p>
          <h3>Role</h3>
          <p>{selectedCandidate?.role}</p>
          <h3>Recommendation</h3>
          <select
            className="form-input"
            value={form.recommendation}
            onChange={(event) => updateFormField('recommendation', event.target.value)}
          >
            <option value="Strong Hire">Strong Hire</option>
            <option value="Hire">Hire</option>
            <option value="Hold">Hold</option>
            <option value="Reject">Reject</option>
          </select>
        </div>

        <div className="panel">
          <h3>Scores</h3>
          <div className="score-item">
            <p>Technical: {technical} / 10</p>
            <input
              className="form-input"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={form.technical}
              onChange={(event) => updateFormField('technical', event.target.value)}
            />
            <div className="score-track"><div className="score-fill" style={{ width: `${technical * 10}%` }} /></div>
          </div>
          <div className="score-item">
            <p>Communication: {communication} / 10</p>
            <input
              className="form-input"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={form.communication}
              onChange={(event) => updateFormField('communication', event.target.value)}
            />
            <div className="score-track"><div className="score-fill" style={{ width: `${communication * 10}%` }} /></div>
          </div>
          <div className="score-item">
            <p>Problem Solving: {problemSolving} / 10</p>
            <input
              className="form-input"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={form.problemSolving}
              onChange={(event) => updateFormField('problemSolving', event.target.value)}
            />
            <div className="score-track"><div className="score-fill" style={{ width: `${problemSolving * 10}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>AI Summary</h3>
        <textarea
          className="form-input"
          rows="3"
          value={form.summary}
          onChange={(event) => updateFormField('summary', event.target.value)}
          placeholder="Write interview summary"
        />
        <div className="cards-grid-2 report-lists">
          <div>
            <h4>Strengths</h4>
            <textarea
              className="form-input"
              rows="3"
              value={form.strengths}
              onChange={(event) => updateFormField('strengths', event.target.value)}
              placeholder="Comma separated values"
            />
          </div>
          <div>
            <h4>Improvement Areas</h4>
            <textarea
              className="form-input"
              rows="3"
              value={form.improvements}
              onChange={(event) => updateFormField('improvements', event.target.value)}
              placeholder="Comma separated values"
            />
          </div>
        </div>

        <div className="table-actions action-row-spaced">
          <button type="button" className="primary-button" onClick={saveReport}>
            {selectedReport ? 'Update Report' : 'Create Report'}
          </button>
        </div>
        {saveMessage ? <p className="form-message">{saveMessage}</p> : null}
      </div>

      <div className="panel">
        <h3>Preview</h3>
        <p>{form.summary || 'No summary added yet.'}</p>
        <div className="cards-grid-2 report-lists">
          <div>
            <h4>Strengths</h4>
            <ul>
              {parseList(form.strengths).length === 0 ? <li>No strengths added</li> : null}
              {parseList(form.strengths).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Improvement Areas</h4>
            <ul>
              {parseList(form.improvements).length === 0 ? <li>No improvements added</li> : null}
              {parseList(form.improvements).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EvaluationReportPage;
