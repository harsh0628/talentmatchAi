import { useMemo, useState } from 'react';
import { useInterviews } from '../context/InterviewsContext';

function SchedulePage() {
  const { interviews, loadingInterviews, interviewsError, updateInterview } = useInterviews();

  // Filter by interview mode.
  const [modeFilter, setModeFilter] = useState('All');

  // Build visible list based on selected mode filter.
  const visibleInterviews = useMemo(() => {
    return interviews.filter((item) => modeFilter === 'All' || item.mode === modeFilter);
  }, [interviews, modeFilter]);

  // Mark one interview as completed.
  async function markCompleted(interviewId) {
    try {
      await updateInterview(interviewId, { status: 'Completed' });
    } catch (error) {
      alert(error.message || 'Unable to update interview right now.');
    }
  }

  return (
    <div>
      <h2 className="section-title">Interview Schedule</h2>
      <p className="section-desc">Upcoming interviews for this week.</p>

      {loadingInterviews ? <p className="empty-state">Loading interviews from backend...</p> : null}
      {interviewsError ? <p className="error">{interviewsError}</p> : null}

      <div className="panel filter-bar">
        <label htmlFor="modeFilter">Filter by mode</label>
        <select id="modeFilter" className="filter-select" value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Online">Online</option>
          <option value="Onsite">Onsite</option>
        </select>
      </div>

      <div className="cards-grid-2">
        {!loadingInterviews && visibleInterviews.length === 0 ? (
          <p className="empty-state">No interviews found for current filter.</p>
        ) : null}

        {visibleInterviews.map((interview) => (
          <article key={interview.id} className="panel">
            <h3>{interview.candidate}</h3>
            <p><strong>Date:</strong> {interview.date}</p>
            <p><strong>Panel:</strong> {interview.panel}</p>
            <p><strong>Mode:</strong> {interview.mode}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={interview.status === 'Completed' ? 'badge badge-open' : 'badge badge-closed'}>
                {interview.status}
              </span>
            </p>
            {interview.status !== 'Completed' ? (
              <button type="button" className="primary-button" onClick={() => markCompleted(interview.id)}>
                Mark Completed
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export default SchedulePage;
