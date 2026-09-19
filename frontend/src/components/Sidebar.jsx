import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  BookOpen,
  Target,
  HelpCircle,
  Award,
  Repeat,
  AlertTriangle,
  BookMarked,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Sparkles,
  Shield,
  LogOut,
  X,
  User as UserIcon
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/timer', label: 'Study Timer', icon: Timer, highlight: true },
  { path: '/courses', label: 'Courses & Syllabus', icon: BookOpen },
  { path: '/exams', label: 'Competitive Exams', icon: Target },
  { path: '/questions', label: 'PYQ Question Bank', icon: HelpCircle },
  { path: '/mocks', label: 'Mock Test Arena', icon: Award },
  { path: '/revision', label: 'Spaced Revision', icon: Repeat },
  { path: '/mistakes', label: 'Mistake Book', icon: AlertTriangle },
  { path: '/reading', label: 'Reading Tracker', icon: BookMarked },
  { path: '/calendar', label: 'Calendar Planner', icon: Calendar },
  { path: '/analytics', label: 'Study DNA & Stats', icon: BarChart3 },
  { path: '/notes', label: 'Knowledge Library', icon: FileText },
  { path: '/settings', label: 'Settings & Backup', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, user, onLogout }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`sidebar ${isOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          height: '100vh',
          background: 'rgba(10, 14, 24, 0.96)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-subtle)',
          position: 'fixed',
          left: 0,
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '20px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}>
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Study<span style={{ color: 'var(--primary-light)' }}>OS</span>
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                Learning Intelligence
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
              color: 'var(--text-dim)'
            }}
            title="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  background: isActive 
                    ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0.05) 100%)' 
                    : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.18s ease'
                })}
              >
                <Icon size={18} style={{ flexShrink: 0, opacity: 0.9 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                {item.highlight && (
                  <span style={{
                    marginLeft: 'auto',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    boxShadow: '0 0 6px var(--primary)'
                  }} />
                )}
              </NavLink>
            );
          })}

          {/* Admin Panel Nav Item for Admin Users */}
          {user?.is_admin && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                marginTop: '8px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: isActive ? '#FFFFFF' : 'var(--rose)',
                background: isActive 
                  ? 'rgba(244, 63, 94, 0.2)' 
                  : 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                transition: 'all 0.18s ease'
              })}
            >
              <Shield size={18} style={{ flexShrink: 0, color: 'var(--rose)' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Admin Console
              </span>
              <span className="badge badge-rose" style={{ marginLeft: 'auto', fontSize: '0.68rem', padding: '2px 6px' }}>
                Admin
              </span>
            </NavLink>
          )}
        </nav>

        {/* User Card & Logout Footer */}
        <div style={{
          padding: '16px 18px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.65)'
        }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: user.is_admin ? 'var(--rose)' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: '#FFFFFF',
                  flexShrink: 0
                }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.name}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: user.is_admin ? 'var(--rose)' : 'var(--text-dim)',
                    fontWeight: 500
                  }}>
                    {user.is_admin ? 'Administrator' : `@${user.username || 'student'}`}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-dim)', flexShrink: 0 }}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Zero-Cost • SQLite Offline
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
