import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: 'fas fa-tv', label: 'Dashboard' },
  { to: '/leads', icon: 'fas fa-users', label: 'Leads' },
  { to: '/proposals', icon: 'fas fa-file-alt', label: 'Proposals' },
  { to: '/outreach', icon: 'fas fa-paper-plane', label: 'Outreach' },
  { to: '/analytics', icon: 'fas fa-chart-bar', label: 'Analytics' },
];

export default function Sidebar() {
  const [collapseShow, setCollapseShow] = useState('hidden');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="md:left-0 md:block md:fixed md:top-0 md:bottom-0 md:overflow-y-auto md:flex-row md:flex-nowrap md:overflow-hidden shadow-xl bg-white flex flex-wrap items-center justify-between relative md:w-64 z-10 py-4 px-6">
      <div className="md:flex-col md:items-stretch md:min-h-full md:flex-nowrap px-0 flex flex-wrap items-center justify-between w-full mx-auto">

        {/* Mobile toggler */}
        <button
          className="cursor-pointer text-black opacity-50 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
          type="button"
          onClick={() => setCollapseShow('bg-white m-2 py-3 px-6')}
        >
          <i className="fas fa-bars"></i>
        </button>

        {/* Brand */}
        <a href="/dashboard" className="md:block text-left md:pb-2 text-blueGray-600 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0">
          <span className="text-violet-500">Abyte</span>Hunt
        </a>

        {/* Mobile user icons */}
        <ul className="md:hidden items-center flex flex-wrap list-none">
          <li className="inline-block relative">
            <span className="w-8 h-8 text-sm text-white bg-blueGray-200 inline-flex items-center justify-center rounded-full font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </li>
        </ul>

        {/* Collapsible content */}
        <div className={
          "md:flex md:flex-col md:items-stretch md:opacity-100 md:relative md:mt-4 md:shadow-none shadow absolute top-0 left-0 right-0 z-40 overflow-y-auto overflow-x-hidden h-auto items-center flex-1 rounded " +
          collapseShow
        }>
          {/* Mobile collapse header */}
          <div className="md:min-w-full md:hidden block pb-4 mb-4 border-b border-solid border-blueGray-200">
            <div className="flex flex-wrap">
              <div className="w-6/12">
                <a href="/dashboard" className="md:block text-left md:pb-2 text-blueGray-600 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0">
                  AbyteHunt
                </a>
              </div>
              <div className="w-6/12 flex justify-end">
                <button
                  type="button"
                  className="cursor-pointer text-black opacity-50 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
                  onClick={() => setCollapseShow('hidden')}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-4 md:min-w-full" />
          {/* Heading */}
          <h6 className="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline">
            Main Navigation
          </h6>

          {/* Nav items */}
          <ul className="md:flex-col md:min-w-full flex flex-col list-none">
            {navItems.map(({ to, icon, label }) => (
              <li key={to} className="items-center">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    "text-xs uppercase py-3 font-bold block " +
                    (isActive ? "text-violet-500 hover:text-violet-600" : "text-blueGray-700 hover:text-blueGray-500")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <i className={`${icon} mr-2 text-sm ${isActive ? 'opacity-75' : 'text-blueGray-300'}`}></i>
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <hr className="my-4 md:min-w-full" />

          {/* User info + logout */}
          <div className="flex items-center gap-3 px-0 py-2">
            <span className="w-9 h-9 text-sm text-white bg-violet-500 inline-flex items-center justify-center rounded-full font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-blueGray-700 truncate">{user?.name}</p>
              <p className="text-xs text-blueGray-400 capitalize">{user?.role || 'agent'}</p>
            </div>
            <button onClick={handleLogout} className="text-blueGray-400 hover:text-red-500 transition-colors" title="Logout">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
