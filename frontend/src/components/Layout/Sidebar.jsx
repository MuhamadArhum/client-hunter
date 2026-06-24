import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: 'ft-home', label: 'Dashboard' },
  { to: '/leads', icon: 'ft-user', label: 'Leads' },
  { to: '/proposals', icon: 'ft-file-text', label: 'Proposals' },
  { to: '/outreach', icon: 'ft-message-square', label: 'Outreach' },
  { to: '/analytics', icon: 'ft-pie-chart', label: 'Analytics' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out!');
    navigate('/login');
  };

  const isActive = (to) => pathname === to || (to !== '/dashboard' && pathname.startsWith(to));

  return (
    <div className="main-menu menu-fixed menu-light menu-accordion menu-shadow" data-scroll-to-active="true">
      <div className="navbar-header">
        <ul className="nav navbar-nav flex-row">
          <li className="nav-item mr-auto">
            <a className="navbar-brand" href="/dashboard" onClick={e => { e.preventDefault(); navigate('/dashboard'); }}>
              <h3 className="brand-text">
                <span className="text-info">Abyte</span>Hunt
              </h3>
            </a>
          </li>
          <li className="nav-item d-md-none">
            <a className="nav-link close-navbar" href="#!"><i className="ft-x"></i></a>
          </li>
        </ul>
      </div>

      <div className="main-menu-content">
        <ul className="navigation navigation-main" id="main-menu-navigation" data-menu="menu-navigation">
          {navItems.map(({ to, icon, label }) => (
            <li key={to} className={isActive(to) ? 'active' : ''}>
              <a href={to} onClick={e => { e.preventDefault(); navigate(to); }}>
                <i className={icon}></i>
                <span className="menu-title" data-i18n="">{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="navigation-background"></div>
    </div>
  );
}
