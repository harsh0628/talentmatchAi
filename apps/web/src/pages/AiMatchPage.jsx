import { useMemo, useState } from 'react';
import { useJobs } from '../context/JobsContext';
import { useCandidates } from '../context/CandidatesContext';
import {
  generateMatchScoreApi,
  generateSkillGapAnalysisApi,
  generateWorkflowScoreApi,
} from '../services/aiApi';

function getResultMode(result) {
  if (result?.analysisType === 'skill-gap') {
    return 'Skill Gap Analysis';
  }

  if (result?.workflowType) {
    return 'LangChain + LangGraph Workflow';
  }

  return 'AI Match Score';
}

const initialForm = {
  jobId: '',
  candidateId: '',
  jobTitle: '',
  jobDescription: '',
  requiredSkills: '',
  candidateName: '',
  candidateRole: '',
  candidateYearsExperience: '',
  candidateSkills: '',
  candidateSummary: '',
  useRag: true,
};

function AiMatchPage() {
  const { jobs } = useJobs();
  const { candidates } = useCandidates();

  const [form, setForm] = useState(initialForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
  const [isGeneratingSkillGap, setIsGeneratingSkillGap] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === form.jobId),
    [jobs, form.jobId],
  );

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === form.candidateId),
    [candidates, form.candidateId],
  );

  const resultMode = getResultMode(result);

  function handleJobSelect(event) {
    const nextId = event.target.value;
    const nextJob = jobs.find((job) => job.id === nextId);

    setForm((current) => ({
      ...current,
      jobId: nextId,
      jobTitle: nextJob?.title || '',
      jobDescription: nextJob?.description || '',
      requiredSkills: '',
    }));
  }

  function handleCandidateSelect(event) {
    const nextId = event.target.value;
    const nextCandidate = candidates.find((candidate) => candidate.id === nextId);

    setForm((current) => ({
      ...current,
      candidateId: nextId,
      candidateName: nextCandidate?.name || '',
      candidateRole: nextCandidate?.role || '',
      candidateYearsExperience: '',
      candidateSkills: '',
      candidateSummary: '',
    }));
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrorMessage('');
  }

  async function handleGenerate(event) {
    event.preventDefault();

    if (!form.jobTitle || !form.jobDescription || !form.candidateName || !form.candidateRole) {
      setErrorMessage('Please fill all required fields before generating AI score.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage('');

      const generated = await generateMatchScoreApi({
        jobTitle: form.jobTitle,
        jobDescription: form.jobDescription,
        requiredSkills: form.requiredSkills,
        candidateName: form.candidateName,
        candidateRole: form.candidateRole,
        candidateYearsExperience: Number(form.candidateYearsExperience || 0),
        candidateSkills: form.candidateSkills,
        candidateSummary: form.candidateSummary,
        useRag: form.useRag,
      });

      setResult(generated);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to generate AI score right now.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateWorkflow(event) {
    event.preventDefault();

    if (!form.jobTitle || !form.jobDescription || !form.candidateName || !form.candidateRole) {
      setErrorMessage('Please fill all required fields before generating the workflow view.');
      return;
    }

    try {
      setIsGeneratingWorkflow(true);
      setErrorMessage('');

      const generated = await generateWorkflowScoreApi({
        jobTitle: form.jobTitle,
        jobDescription: form.jobDescription,
        requiredSkills: form.requiredSkills,
        candidateName: form.candidateName,
        candidateRole: form.candidateRole,
        candidateYearsExperience: Number(form.candidateYearsExperience || 0),
        candidateSkills: form.candidateSkills,
        candidateSummary: form.candidateSummary,
        useRag: form.useRag,
      });

      setResult(generated);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to generate the workflow right now.');
    } finally {
      setIsGeneratingWorkflow(false);
    }
  }

  async function handleGenerateSkillGap(event) {
    event.preventDefault();

    if (!form.jobTitle || !form.jobDescription || !form.candidateName || !form.candidateRole) {
      setErrorMessage('Please fill all required fields before generating the skill gap analysis.');
      return;
    }

    try {
      setIsGeneratingSkillGap(true);
      setErrorMessage('');

      const generated = await generateSkillGapAnalysisApi({
        jobTitle: form.jobTitle,
        jobDescription: form.jobDescription,
        requiredSkills: form.requiredSkills,
        candidateName: form.candidateName,
        candidateRole: form.candidateRole,
        candidateYearsExperience: Number(form.candidateYearsExperience || 0),
        candidateSkills: form.candidateSkills,
        candidateSummary: form.candidateSummary,
        useRag: form.useRag,
      });

      setResult(generated);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to generate the skill gap analysis right now.');
    } finally {
      setIsGeneratingSkillGap(false);
    }
  }

  return (
    <div>
      <div className="panel ai-hero-panel">
        <div className="ai-hero-copy">
          <p className="ai-eyebrow">AI Lab</p>
          <h2 className="section-title">AI Match Scoring</h2>
          <p className="section-desc">
            Test match scoring, workflow reasoning, and skill gap analysis from one place.
          </p>
          <ul className="ai-tip-list">
            <li>Pick a job and candidate to auto-fill the form faster.</li>
            <li>Use RAG to include related jobs and candidates in the analysis.</li>
            <li>Try all three actions to compare score, workflow, and gap output.</li>
          </ul>
        </div>

        <div className="ai-hero-grid">
          <div className="mini-card">
            <h3>1. Match</h3>
            <p>Fast fit score with strengths, gaps, and fallback logic.</p>
          </div>
          <div className="mini-card">
            <h3>2. Workflow</h3>
            <p>Shows the LangChain-style pipeline and LangGraph-style flow.</p>
          </div>
          <div className="mini-card">
            <h3>3. Skill Gap</h3>
            <p>Highlights missing skills and gives a learning plan.</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3>Input Data</h3>
          <span className="badge badge-info">Required fields marked with *</span>
        </div>
        <form className="ai-match-grid" onSubmit={handleGenerate}>
          <div>
            <label htmlFor="ai-job-select">Pick Job (optional)</label>
            <select
              id="ai-job-select"
              className="form-input"
              value={form.jobId}
              onChange={handleJobSelect}
            >
              <option value="">Select job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ai-candidate-select">Pick Candidate (optional)</label>
            <select
              id="ai-candidate-select"
              className="form-input"
              value={form.candidateId}
              onChange={handleCandidateSelect}
            >
              <option value="">Select candidate</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ai-job-title">Job Title *</label>
            <input
              id="ai-job-title"
              className="form-input"
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleChange}
              placeholder="Backend Engineer"
            />
          </div>

          <div>
            <label htmlFor="ai-candidate-name">Candidate Name *</label>
            <input
              id="ai-candidate-name"
              className="form-input"
              name="candidateName"
              value={form.candidateName}
              onChange={handleChange}
              placeholder="Candidate full name"
            />
          </div>

          <div>
            <label htmlFor="ai-candidate-role">Candidate Role *</label>
            <input
              id="ai-candidate-role"
              className="form-input"
              name="candidateRole"
              value={form.candidateRole}
              onChange={handleChange}
              placeholder="Node.js Developer"
            />
          </div>

          <div>
            <label htmlFor="ai-candidate-years">Years of Experience</label>
            <input
              id="ai-candidate-years"
              className="form-input"
              name="candidateYearsExperience"
              type="number"
              min="0"
              max="40"
              value={form.candidateYearsExperience}
              onChange={handleChange}
              placeholder="3"
            />
          </div>

          <div className="ai-span-full">
            <label htmlFor="ai-required-skills">Required Skills (comma separated)</label>
            <input
              id="ai-required-skills"
              className="form-input"
              name="requiredSkills"
              value={form.requiredSkills}
              onChange={handleChange}
              placeholder="Node.js, MongoDB, Express, JWT"
            />
          </div>

          <div className="ai-span-full">
            <label htmlFor="ai-job-description">Job Description *</label>
            <textarea
              id="ai-job-description"
              className="form-input"
              name="jobDescription"
              rows="5"
              value={form.jobDescription}
              onChange={handleChange}
              placeholder="Describe responsibilities, tools, and expectations..."
            />
          </div>

          <div className="ai-span-full">
            <label htmlFor="ai-candidate-skills">Candidate Skills (comma separated)</label>
            <input
              id="ai-candidate-skills"
              className="form-input"
              name="candidateSkills"
              value={form.candidateSkills}
              onChange={handleChange}
              placeholder="React, Node.js, REST APIs"
            />
          </div>

          <div className="ai-span-full">
            <label htmlFor="ai-candidate-summary">Candidate Summary <span className="field-help-inline">(optional, improves accuracy)</span></label>
            <textarea
              id="ai-candidate-summary"
              className="form-input"
              name="candidateSummary"
              rows="4"
              value={form.candidateSummary}
              onChange={handleChange}
              placeholder="Resume highlights, projects, and outcomes..."
            />
            <p className="field-help">A short summary helps the AI understand projects, impact, and context beyond keywords.</p>
          </div>

          <div className="ai-span-full" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              id="ai-use-rag"
              type="checkbox"
              checked={form.useRag}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  useRag: event.target.checked,
                }))
              }
            />
            <label htmlFor="ai-use-rag" style={{ marginBottom: 0 }}>
              Use RAG context from existing jobs and candidates
            </label>
          </div>

          <div className="candidate-form-actions ai-span-full">
            <button type="submit" className="primary-button" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate AI Match Score'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={isGeneratingWorkflow}
              onClick={handleGenerateWorkflow}
            >
              {isGeneratingWorkflow ? 'Running workflow...' : 'Test LangChain + LangGraph'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={isGeneratingSkillGap}
              onClick={handleGenerateSkillGap}
            >
              {isGeneratingSkillGap ? 'Analyzing gaps...' : 'Analyze Skill Gaps'}
            </button>
          </div>
        </form>

        {selectedJob ? <p className="table-footer-text">Using selected job: {selectedJob.title}</p> : null}
        {selectedCandidate ? <p className="table-footer-text">Using selected candidate: {selectedCandidate.name}</p> : null}
        {errorMessage ? <p className="error">{errorMessage}</p> : null}
      </div>

      {result ? (
        <div className="panel">
          <div className="panel-title-row">
            <h3>{resultMode}</h3>
            <span className="badge badge-info">Live output</span>
          </div>
          <div className="ai-score-grid">
            <div className="mini-card">
              <h3>{result.analysisType === 'skill-gap' ? 'Fit' : 'Overall'}</h3>
              <p>{result.overallScore}%</p>
            </div>
            <div className="mini-card">
              <h3>{result.analysisType === 'skill-gap' ? 'Matched Skills' : 'Skill Match'}</h3>
              <p>{result.skillMatch}%</p>
            </div>
            <div className="mini-card">
              <h3>Experience</h3>
              <p>{result.experienceMatch}%</p>
            </div>
            <div className="mini-card">
              <h3>Role Match</h3>
              <p>{result.roleMatch}%</p>
            </div>
            <div className="mini-card">
              <h3>Confidence</h3>
              <p>{result.confidence}%</p>
            </div>
          </div>

          <p className="section-desc">{result.summary}</p>

          <div className="ai-result-strip">
            <div className="mini-card">
              <h3>Provider</h3>
              <p>{result.provider || 'unknown'}</p>
            </div>
            <div className="mini-card">
              <h3>Model</h3>
              <p>{result.model || 'unknown'}</p>
            </div>
            <div className="mini-card">
              <h3>Request ID</h3>
              <p>{result.requestId || 'Not available'}</p>
            </div>
            <div className="mini-card">
              <h3>Mode</h3>
              <p>{result.analysisType || result.workflowType || 'match-score'}</p>
            </div>
          </div>

          {result.analysisType === 'skill-gap' && result.skillGapAnalysis ? (
            <div className="panel" style={{ marginTop: '20px' }}>
              <h3>Skill Gap Analysis</h3>
              <p className="table-footer-text">{result.skillGapAnalysis.nextStep}</p>
              <p className="table-footer-text">{result.skillGapAnalysis.experienceGap}</p>

              <div className="cards-grid-2">
                <div className="panel ai-list-panel">
                  <h3>Matched Skills</h3>
                  {result.skillGapAnalysis.matchedSkills?.length ? (
                    <ul>
                      {result.skillGapAnalysis.matchedSkills.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No matched skills detected.</p>
                  )}
                </div>

                <div className="panel ai-list-panel">
                  <h3>Missing Skills</h3>
                  {result.skillGapAnalysis.missingSkills?.length ? (
                    <ul>
                      {result.skillGapAnalysis.missingSkills.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No missing skills detected.</p>
                  )}
                </div>
              </div>

              <div className="cards-grid-2" style={{ marginTop: '20px' }}>
                <div className="panel ai-list-panel">
                  <h3>Learning Plan</h3>
                  {result.skillGapAnalysis.learningPlan?.length ? (
                    <ul>
                      {result.skillGapAnalysis.learningPlan.map((item) => (
                        <li key={item.skill}>
                          <strong>{item.skill}</strong> | {item.effort}
                          <br />
                          {item.action}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No learning plan generated.</p>
                  )}
                </div>

                <div className="panel ai-list-panel">
                  <h3>Interview Focus</h3>
                  {result.skillGapAnalysis.interviewFocus?.length ? (
                    <ul>
                      {result.skillGapAnalysis.interviewFocus.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No interview focus suggestions generated.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {result.workflow ? (
            <div className="panel" style={{ marginTop: '20px' }}>
              <h3>Workflow View</h3>
              <p className="table-footer-text">{result.workflow.beginnerExplanation}</p>

              {result.workflow.chain ? (
                <div className="cards-grid-2">
                  <div className="panel ai-list-panel">
                    <h3>LangChain Step</h3>
                    <p className="table-footer-text">{result.workflow.chain.concept}</p>
                    <p className="table-footer-text">Framework: {result.workflow.chain.framework}</p>
                    <p className="table-footer-text">Retrieval used: {result.workflow.chain.retrieval?.used ? 'Yes' : 'No'}</p>
                    {result.workflow.chain.steps?.length ? (
                      <ul>
                        {result.workflow.chain.steps.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="panel ai-list-panel">
                    <h3>LangGraph Step</h3>
                    <p className="table-footer-text">{result.workflow.graph.concept}</p>
                    <p className="table-footer-text">Framework: {result.workflow.graph.framework}</p>
                    <p className="table-footer-text">Decision: {result.workflow.graph.decision}</p>
                    {result.workflow.graph.nodes?.length ? (
                      <ul>
                        {result.workflow.graph.nodes.map((node) => (
                          <li key={node.id}>
                            <strong>{node.label}</strong> | {node.status}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {result.ragContext ? (
            <div className="panel" style={{ marginTop: '20px' }}>
              <h3>Retrieved Context</h3>
              <p className="table-footer-text">{result.ragContext.note || 'RAG context used for this result.'}</p>

              {result.ragContext.keywords?.length ? (
                <p className="table-footer-text">
                  Keywords: {result.ragContext.keywords.join(', ')}
                </p>
              ) : null}

              <div className="cards-grid-2">
                <div className="panel ai-list-panel">
                  <h3>Top Related Jobs</h3>
                  {result.ragContext.topJobs?.length ? (
                    <ul>
                      {result.ragContext.topJobs.map((item) => (
                        <li key={item.id}>
                          <strong>{item.title}</strong> | {item.location} | {item.experience} | {Math.round(item.overlapScore * 100)}%
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No related jobs found.</p>
                  )}
                </div>

                <div className="panel ai-list-panel">
                  <h3>Top Related Candidates</h3>
                  {result.ragContext.topCandidates?.length ? (
                    <ul>
                      {result.ragContext.topCandidates.map((item) => (
                        <li key={item.id}>
                          <strong>{item.name}</strong> | {item.role} | {item.stage} | {Math.round(item.overlapScore * 100)}%
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No related candidates found.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="cards-grid-2">
            <div className="panel ai-list-panel">
              <h3>Strengths</h3>
              {result.strengths?.length ? (
                <ul>
                  {result.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No strengths provided by model.</p>
              )}
            </div>

            <div className="panel ai-list-panel">
              <h3>Gaps</h3>
              {result.gaps?.length ? (
                <ul>
                  {result.gaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No critical gaps detected.</p>
              )}
            </div>
          </div>

          <p className="table-footer-text">
            Provider: {result.provider || 'unknown'} | Model: {result.model || 'unknown'}
          </p>
          {result.note ? <p className="table-footer-text">Note: {result.note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default AiMatchPage;
