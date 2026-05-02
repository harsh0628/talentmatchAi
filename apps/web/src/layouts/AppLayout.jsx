import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Single source for sidebar links so navigation stays easy to maintain.
const navItems = [
  { to: '/dashboard', label: 'Dashboard', roles: ['Admin', 'Recruiter', 'Interviewer'] },
  { to: '/jobs', label: 'Jobs', roles: ['Admin', 'Recruiter'] },
  { to: '/candidates', label: 'Candidates', roles: ['Admin', 'Recruiter'] },
  { to: '/ai-match', label: 'AI Match', roles: ['Admin', 'Recruiter'] },
  { to: '/benchmarks', label: 'Benchmarks', roles: ['Admin', 'Recruiter'] },
  { to: '/schedule', label: 'Schedule', roles: ['Admin', 'Recruiter', 'Interviewer'] },
  { to: '/evaluation-report', label: 'Evaluation Report', roles: ['Admin', 'Recruiter', 'Interviewer'] },
  { to: '/about', label: 'About', roles: ['Admin', 'Recruiter', 'Interviewer'] },
  { to: '/create-job', label: 'Create Job', roles: ['Admin', 'Recruiter'] },
];

function AppLayout() {
  const navigate = useNavigate();
  const { authUser, logout } = useAuth();

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(authUser?.role || 'Recruiter'),
  );

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      {/* Left side navigation area */}
      <aside className="sidebar">
        <h2>TalentMatch</h2>
        <p className="sidebar-subtitle">{authUser?.role || 'User'} Panel</p>

        <nav className="menu">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'menu-link menu-link-active' : 'menu-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user-card">
          <p className="sidebar-user-name">{authUser?.name || 'User'}</p>
          <p className="sidebar-user-email">{authUser?.email || '-'}</p>
          <button type="button" className="secondary-button sidebar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area where each route page is rendered */}
      <main className="content">
        <header className="topbar">
          <div>
            <h1 className="topbar-title">Hiring Workspace</h1>
            <p className="topbar-text">MERN + AI recruiter operations suite</p>
          </div>
        </header>

        <section className="content-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AppLayout;
