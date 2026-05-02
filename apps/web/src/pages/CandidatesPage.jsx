import { useEffect, useMemo, useState } from 'react';
import { useCandidates } from '../context/CandidatesContext';

const initialCandidateForm = {
  name: '',
  role: '',
  score: '',
  stage: 'Applied',
  email: '',
};

function CandidatesPage() {
  const {
    candidates,
    loadingCandidates,
    candidatesError,
    addCandidate,
    updateCandidate,
    deleteCandidate,
  } = useCandidates();

  // User inputs for filtering the list.
  const [searchText, setSearchText] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [form, setForm] = useState(initialCandidateForm);
  const [editingCandidateId, setEditingCandidateId] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [sortKey, setSortKey] = useState('score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(6);

  const stageOptions = ['All', 'Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];

  // Filter list by both search text and stage dropdown.
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesText =
        candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
        candidate.role.toLowerCase().includes(searchText.toLowerCase());
      const matchesStage = stageFilter === 'All' || candidate.stage === stageFilter;
      return matchesText && matchesStage;
    });
  }, [candidates, searchText, stageFilter]);

  useEffect(() => {
    setPageIndex(0);
  }, [searchText, stageFilter]);

  function handleSort(nextKey) {
    setPageIndex(0);

    if (nextKey === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === 'score' ? 'desc' : 'asc');
  }

  function getSortIndicator(key) {
    if (key !== sortKey) {
      return '';
    }
    return sortDirection === 'asc' ? '▲' : '▼';
  }

  const sortedCandidates = useMemo(() => {
    const copy = [...filteredCandidates];

    copy.sort((a, b) => {
      if (sortKey === 'score') {
        const aNum = Number(a.score || 0);
        const bNum = Number(b.score || 0);
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      const aValue = (a?.[sortKey] ?? '').toString().toLowerCase();
      const bValue = (b?.[sortKey] ?? '').toString().toLowerCase();

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }

      return 0;
    });

    return copy;
  }, [filteredCandidates, sortKey, sortDirection]);

  const totalRows = sortedCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    if (pageIndex > totalPages - 1) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [pageIndex, totalPages]);

  const pagedCandidates = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedCandidates.slice(start, start + pageSize);
  }, [sortedCandidates, pageIndex]);

  const pageStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const pageEnd = Math.min((pageIndex + 1) * pageSize, totalRows);

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setPageIndex(0);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormMessage('');
  }

  function handleEdit(candidate) {
    setEditingCandidateId(candidate.id);
    setForm({
      name: candidate.name,
      role: candidate.role,
      score: String(candidate.score),
      stage: candidate.stage,
      email: candidate.email || '',
    });
    setFormMessage('Edit mode enabled for selected candidate.');
  }

  function resetFormState() {
    setForm(initialCandidateForm);
    setEditingCandidateId('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name || !form.role || !form.score || !form.stage) {
      setFormMessage('Please fill all required fields.');
      return;
    }

    const scoreValue = Number(form.score);
    if (Number.isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      setFormMessage('Score must be between 0 and 100.');
      return;
    }

    const payload = {
      name: form.name,
      role: form.role,
      score: scoreValue,
      stage: form.stage,
      email: form.email || undefined,
    };

    try {
      setIsSaving(true);

      if (editingCandidateId) {
        await updateCandidate(editingCandidateId, payload);
        setFormMessage('Candidate updated successfully.');
      } else {
        await addCandidate(payload);
        setFormMessage('Candidate created successfully.');
      }

      resetFormState();
    } catch (error) {
      setFormMessage(error.message || 'Unable to save candidate right now.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(candidateId) {
    const shouldDelete = window.confirm('Delete this candidate?');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteCandidate(candidateId);
      if (editingCandidateId === candidateId) {
        resetFormState();
      }
    } catch (error) {
      setFormMessage(error.message || 'Unable to delete candidate right now.');
    }
  }

  return (
    <div>
      <h2 className="section-title">Candidates</h2>
      <p className="section-desc">Shortlisted and active candidates.</p>

      {loadingCandidates ? <p className="empty-state">Loading candidates from backend...</p> : null}
      {candidatesError ? <p className="error">{candidatesError}</p> : null}

      <div className="panel filter-bar">
        <input
          className="filter-input"
          type="text"
          placeholder="Search by name or role"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <select
          className="filter-select"
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value)}
        >
          {stageOptions.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3>{editingCandidateId ? 'Edit Candidate' : 'Add Candidate'}</h3>
          {editingCandidateId ? (
            <button type="button" className="secondary-button" onClick={resetFormState}>
              Cancel Edit
            </button>
          ) : null}
        </div>

        <form className="candidate-form-grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="candidate-name">Name *</label>
            <input
              id="candidate-name"
              name="name"
              className="form-input"
              value={form.name}
              onChange={handleChange}
              placeholder="Candidate full name"
            />
          </div>

          <div>
            <label htmlFor="candidate-role">Role *</label>
            <input
              id="candidate-role"
              name="role"
              className="form-input"
              value={form.role}
              onChange={handleChange}
              placeholder="Frontend Developer"
            />
          </div>

          <div>
            <label htmlFor="candidate-score">Score (0-100) *</label>
            <input
              id="candidate-score"
              name="score"
              type="number"
              min="0"
              max="100"
              className="form-input"
              value={form.score}
              onChange={handleChange}
              placeholder="85"
            />
          </div>

          <div>
            <label htmlFor="candidate-stage">Stage *</label>
            <select
              id="candidate-stage"
              name="stage"
              className="form-input"
              value={form.stage}
              onChange={handleChange}
            >
              {stageOptions.filter((stage) => stage !== 'All').map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          <div className="candidate-form-span">
            <label htmlFor="candidate-email">Email (optional)</label>
            <input
              id="candidate-email"
              name="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={handleChange}
              placeholder="candidate@email.com"
            />
          </div>

          <div className="candidate-form-actions candidate-form-span">
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingCandidateId ? 'Update Candidate' : 'Add Candidate'}
            </button>
          </div>
        </form>

        {formMessage ? <p className="form-message">{formMessage}</p> : null}
      </div>

      <div className="panel">
        {/* Show empty message when filters return no result */}
        {!loadingCandidates && filteredCandidates.length === 0 ? (
          <p className="empty-state">No candidates found for current filter.</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="table-sort-button" onClick={() => handleSort('name')}>
                      Name <span className="sort-indicator">{getSortIndicator('name')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-button" onClick={() => handleSort('role')}>
                      Role <span className="sort-indicator">{getSortIndicator('role')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-button" onClick={() => handleSort('score')}>
                      Match Score <span className="sort-indicator">{getSortIndicator('score')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-button" onClick={() => handleSort('stage')}>
                      Stage <span className="sort-indicator">{getSortIndicator('stage')}</span>
                    </button>
                  </th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>{candidate.name}</td>
                    <td>{candidate.role}</td>
                    <td>
                      <span className={candidate.score >= 80 ? 'badge badge-open' : 'badge badge-closed'}>
                        {candidate.score}%
                      </span>
                    </td>
                    <td>{candidate.stage}</td>
                    <td>{candidate.email || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handleEdit(candidate)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDelete(candidate.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              <div className="table-footer-left">
                <p className="table-footer-text">Showing {pageStart}-{pageEnd} of {totalRows}</p>
                <label className="rows-select-label" htmlFor="candidates-rows-per-page">Rows:</label>
                <select
                  id="candidates-rows-per-page"
                  className="rows-select"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="pagination">
                <button
                  type="button"
                  className="secondary-button pagination-button"
                  onClick={() => setPageIndex(0)}
                  disabled={pageIndex === 0}
                >
                  First
                </button>
                <button
                  type="button"
                  className="secondary-button pagination-button"
                  onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                  disabled={pageIndex === 0}
                >
                  Prev
                </button>
                <p className="table-footer-text">Page {pageIndex + 1} of {totalPages}</p>
                <button
                  type="button"
                  className="secondary-button pagination-button"
                  onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={pageIndex >= totalPages - 1}
                >
                  Next
                </button>
                <button
                  type="button"
                  className="secondary-button pagination-button"
                  onClick={() => setPageIndex(totalPages - 1)}
                  disabled={pageIndex >= totalPages - 1}
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CandidatesPage;
