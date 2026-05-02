import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';

// Static summary numbers for dashboard widgets.
const stats = [
  { title: 'Open Jobs', value: 12, subtitle: 'Active hiring roles' },
  { title: 'Candidates', value: 57, subtitle: 'Total applicants' },
  { title: 'Interviews This Week', value: 9, subtitle: 'Scheduled sessions' },
  { title: 'Offers Sent', value: 3, subtitle: 'Final selections' },
];

function DashboardPage() {
  return (
    <div>
      <h2 className="section-title">Dashboard</h2>
      <p className="section-desc">Quick summary of current hiring activity.</p>

      {/* Reuse one card component for all metrics */}
      <div className="cards-grid-2">
        {stats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} subtitle={item.subtitle} />
        ))}
      </div>

      <div className="panel quick-links">
        <h3>Quick Navigation</h3>
        <div className="quick-link-row">
          <Link to="/jobs" className="back-link">Go to Jobs</Link>
          <Link to="/candidates" className="back-link">Go to Candidates</Link>
          <Link to="/schedule" className="back-link">Go to Schedule</Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
