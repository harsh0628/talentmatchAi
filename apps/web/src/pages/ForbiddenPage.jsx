import { Link } from 'react-router-dom';

function ForbiddenPage() {
  return (
    <div>
      <h2 className="section-title">Access Denied</h2>
      <p className="section-desc">
        Your current role does not have permission to open this page.
      </p>

      <div className="panel">
        <p className="empty-state">If you believe this is a mistake, contact your admin.</p>
        <div className="quick-link-row action-row-spaced">
          <Link to="/dashboard" className="back-link">Go back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default ForbiddenPage;
