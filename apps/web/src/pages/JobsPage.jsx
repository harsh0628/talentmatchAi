import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../context/JobsContext';

function JobsPage() {
  const { jobs, deleteJob, loadingJobs, jobsError } = useJobs();
  const navigate = useNavigate();

  const [sortKey, setSortKey] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(6);

  function handleSort(nextKey) {
    setPageIndex(0);

    if (nextKey === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === 'status' ? 'asc' : 'asc');
  }

  function getSortIndicator(key) {
    if (key !== sortKey) {
      return '';
    }
    return sortDirection === 'asc' ? '▲' : '▼';
  }

  const sortedJobs = useMemo(() => {
    const copy = [...jobs];

    copy.sort((a, b) => {
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
  }, [jobs, sortKey, sortDirection]);

  const totalRows = sortedJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    if (pageIndex > totalPages - 1) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [pageIndex, totalPages]);

  const pagedJobs = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, pageIndex]);

  const pageStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const pageEnd = Math.min((pageIndex + 1) * pageSize, totalRows);

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setPageIndex(0);
  }

  // Delete removes one job from shared state and updates UI instantly.
  async function handleDelete(jobId) {
    try {
      await deleteJob(jobId);
    } catch (error) {
      alert(error.message || 'Unable to delete job right now.');
    }
  }

  // Edit opens the same form page in edit mode.
  function handleEdit(jobId) {
    navigate(`/edit-job/${jobId}`);
  }

  return (
    <div>
      <h2 className="section-title">Jobs</h2>
      <p className="section-desc">List of openings managed by recruiter.</p>

      {loadingJobs ? <p className="empty-state">Loading jobs from backend...</p> : null}
      {jobsError ? <p className="error">{jobsError}</p> : null}

      <div className="panel">
        {!loadingJobs && jobs.length === 0 ? (
          <p className="empty-state">No jobs yet. Create one to see it here.</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="table-sort-button" onClick={() => handleSort('id')}>
                      Job ID <span className="sort-indicator">{getSortIndicator('id')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-button" onClick={() => handleSort('title')}>
                      Title <span className="sort-indicator">{getSortIndicator('title')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-button" onClick={() => handleSort('location')}>
                      Location <span className="sort-indicator">{getSortIndicator('location')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-button" onClick={() => handleSort('status')}>
                      Status <span className="sort-indicator">{getSortIndicator('status')}</span>
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id}</td>
                    <td>{job.title}</td>
                    <td>{job.location}</td>
                    <td>
                      <span className={job.status === 'Open' ? 'badge badge-open' : 'badge badge-closed'}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="primary-button" onClick={() => handleEdit(job.id)}>
                          Edit
                        </button>
                        <button type="button" className="danger-button" onClick={() => handleDelete(job.id)}>
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
                <label className="rows-select-label" htmlFor="jobs-rows-per-page">Rows:</label>
                <select
                  id="jobs-rows-per-page"
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

export default JobsPage;
