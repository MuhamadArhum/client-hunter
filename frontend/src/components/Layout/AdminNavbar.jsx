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

export default function AdminNavbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const key = Object.keys(pageTitles).find((k) => pathname.startsWith(k)) || '/dashboard';
  const title = pageTitles[key] || 'AbyteHunt';

  // Close dropdown on outside click
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
    <nav className="absolute top-0 left-0 w-full z-10 bg-transparent md:flex-row md:flex-nowrap md:justify-start flex items-center p-4">
      <div className="w-full mx-auto items-center flex justify-between md:flex-nowrap flex-wrap md:px-10 px-4">
        {/* Page title */}
        <a className="text-white text-sm uppercase hidden lg:inline-block font-semibold" href="#!">
          {title}
        </a>

        {/* Right side */}
        <ul className="flex-col md:flex-row list-none items-center hidden md:flex gap-3">
          {/* Notification bell */}
          <li className="inline-block relative">
            <button className="text-white opacity-70 hover:opacity-100 transition-opacity">
              <i className="fas fa-bell text-lg"></i>
            </button>
          </li>

          {/* Profile dropdown */}
          <li className="inline-block relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-white focus:outline-none"
            >
              {/* Avatar circle */}
              <span className="w-10 h-10 text-sm text-white bg-violet-500 inline-flex items-center justify-center rounded-full font-bold shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              <span className="hidden xl:block text-sm font-semibold">{user?.name}</span>
              <i className={`fas fa-chevron-down text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-50 py-2 border border-blueGray-100">
                <div className="px-4 py-2 border-b border-blueGray-100">
                  <p className="text-sm font-bold text-blueGray-700">{user?.name}</p>
                  <p className="text-xs text-blueGray-400 truncate">{user?.email}</p>
                </div>
                <a
                  href="#!"
                  onClick={(e) => { e.preventDefault(); setDropdownOpen(false); }}
                  className="block px-4 py-2 text-sm text-blueGray-700 hover:bg-blueGray-50 transition-colors"
                >
                  <i className="fas fa-user mr-2 text-blueGray-400"></i>Profile
                </a>
                <a
                  href="#!"
                  onClick={(e) => { e.preventDefault(); setDropdownOpen(false); }}
                  className="block px-4 py-2 text-sm text-blueGray-700 hover:bg-blueGray-50 transition-colors"
                >
                  <i className="fas fa-cog mr-2 text-blueGray-400"></i>Settings
                </a>
                <div className="border-t border-blueGray-100 mt-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>Logout
                </button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
