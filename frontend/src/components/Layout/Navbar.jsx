import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/proposals': 'Proposals',
  '/outreach': 'Outreach',
  '/analytics': 'Analytics',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const title = Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] || 'AbyteHunt';

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="header-navbar navbar-expand-md navbar navbar-with-menu navbar-without-dd-arrow fixed-top navbar-semi-light">
      <div className="navbar-wrapper">
        <div className="navbar-container content">
          <div className="collapse navbar-collapse show" id="navbar-mobile">
            <ul className="nav navbar-nav mr-auto float-left">
              <li className="nav-item d-block d-md-none">
                <a className="nav-link nav-menu-main menu-toggle hidden-xs" href="#!">
                  <i className="ft-menu"></i>
                </a>
              </li>
              <li className="nav-item d-none d-md-block">
                <span className="nav-link font-weight-bold" style={{ color: '#625f6e' }}>{title}</span>
              </li>
            </ul>

            <ul className="nav navbar-nav float-right">
              <li className="dropdown dropdown-user nav-item" ref={dropdownRef}>
                <a
                  className="dropdown-toggle nav-link dropdown-user-link"
                  href="#!"
                  onClick={(e) => { e.preventDefault(); setDropdownOpen(!dropdownOpen); }}
                  data-toggle="dropdown"
                >
                  <span className="avatar avatar-online">
                    <span
                      className="d-flex align-items-center justify-content-center rounded-circle text-white font-weight-bold bg-info"
                      style={{ width: 36, height: 36, fontSize: 14 }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                    <i></i>
                  </span>
                  <span className="d-none d-md-inline-block ml-1 user-name text-bold-700">
                    {user?.name}
                  </span>
                </a>

                {dropdownOpen && (
                  <div className="dropdown-menu dropdown-menu-right show" style={{ display: 'block' }}>
                    <div className="arrow_box_right">
                      <div className="dropdown-item pb-1">
                        <span className="font-weight-bold">{user?.name}</span>
                        <br />
                        <small className="text-muted">{user?.email}</small>
                      </div>
                      <div className="dropdown-divider"></div>
                      <a className="dropdown-item" href="#!" onClick={(e) => e.preventDefault()}>
                        <i className="ft-user mr-1"></i> Profile
                      </a>
                      <a className="dropdown-item" href="#!" onClick={(e) => e.preventDefault()}>
                        <i className="ft-settings mr-1"></i> Settings
                      </a>
                      <div className="dropdown-divider"></div>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                        style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <i className="ft-power mr-1"></i> Logout
                      </button>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
