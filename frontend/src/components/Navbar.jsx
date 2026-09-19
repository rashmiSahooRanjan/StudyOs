import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Zap, Timer, Menu, Shield, LogOut, User as UserIcon } from 'lucide-react';
import FocusAudio from './FocusAudio';

export default function Navbar({ dashboardData, user, onToggleMobileSidebar, onLogout }) {
  const streak = dashboardData?.streak?.current ?? user?.current_streak ?? 0;
  const xp = dashboardData?.xp ?? user?.xp ?? 0;
  const level = dashboardData?.level ?? user?.level ?? 1;

  return (
    <header style={{
      height: '70px',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      gap: '12px'
    }}>
      {/* Left: Mobile Hamburger & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="btn btn-secondary"
          style={{
            padding: '8px 10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--emerald)',
            boxShadow: '0 0 10px var(--emerald)'
          }}></span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, display: 'none', md: 'inline' }}>
            {user?.is_admin ? "Administrator Session" : "Active Student"}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Ambient Focus Sound */}
        <div style={{ display: 'none', sm: 'block' }}>
          <FocusAudio />
        </div>

        {/* Streak Counter */}
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          background: 'rgba(245, 158, 11, 0.08)'
        }}>
          <Flame size={15} color="#F59E0B" className="anim-pulse" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FCD34D' }}>
            {streak}d Streak
          </span>
        </div>

        {/* XP & Level Badge */}
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          background: 'rgba(99, 102, 241, 0.08)'
        }}>
          <Zap size={14} color="#818CF8" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#A5B4FC' }}>
            Lvl {level}
          </span>
        </div>

        {/* Admin Link if admin */}
        {user?.is_admin && (
          <Link
            to="/admin"
            className="badge badge-rose"
            style={{ padding: '6px 10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Shield size={12} /> Admin
          </Link>
        )}

        {/* User Avatar / Name */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: user.is_admin ? 'var(--rose)' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FFFFFF'
            }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
              {user.name?.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="btn btn-ghost"
          style={{ padding: '6px 8px', borderRadius: '8px', color: 'var(--text-dim)' }}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
