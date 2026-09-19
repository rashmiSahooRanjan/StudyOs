import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Users, Clock, Database, Trash2, Key, Award, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('studyos123');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [uRes, sRes] = await Promise.all([api.getAdminUsers(), api.getAdminStats()]);
      setUsers(uRes.users || []);
      setStats(sRes.stats || {});
    } catch (err) {
      console.error(err);
      setActionMessage("Error loading admin data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (confirm(`Permanently delete user "${userName}" and all their study data?`)) {
      try {
        const res = await api.deleteAdminUser(userId);
        setActionMessage(res.message);
        loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      const res = await api.toggleAdminRole(userId);
      setActionMessage(res.message);
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalUser) return;
    try {
      const res = await api.resetAdminUserPassword(resetModalUser.id, newPassword);
      alert(res.message);
      setResetModalUser(null);
      setNewPassword('studyos123');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={24} color="#FDA4AF" />
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              Master Administrator Console
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            System overview, user isolation management, and database configuration.
          </p>
        </div>

        <button onClick={loadAdminData} className="btn btn-secondary">
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      {actionMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#A5B4FC',
          marginBottom: '20px',
          fontSize: '0.88rem'
        }}>
          {actionMessage}
        </div>
      )}

      {/* System Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Registered Users</span>
            <Users size={18} color="#818CF8" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#FFFFFF', fontWeight: 800 }}>{stats.total_users || 0}</h3>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Hours Logged</span>
            <Clock size={18} color="#10B981" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: 'var(--emerald)', fontWeight: 800 }}>{stats.total_study_hours || 0}h</h3>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Study Sessions</span>
            <Award size={18} color="#F59E0B" />
          </div>
          <h3 style={{ fontSize: '1.8rem', color: '#FCD34D', fontWeight: 800 }}>{stats.total_study_sessions || 0}</h3>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Database Engine</span>
            <Database size={18} color="#06B6D4" />
          </div>
          <span style={{ fontSize: '0.92rem', color: '#67E8F9', fontWeight: 700, display: 'block' }}>
            {stats.database_type || "SQLite (WAL Mode)"}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--emerald)' }}>● {stats.database_status || "Online"}</span>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '18px' }}>All Registered Accounts</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px 14px' }}>ID</th>
                <th style={{ padding: '12px 14px' }}>Student Name</th>
                <th style={{ padding: '12px 14px' }}>Username / Email</th>
                <th style={{ padding: '12px 14px' }}>Role</th>
                <th style={{ padding: '12px 14px' }}>Study Hours</th>
                <th style={{ padding: '12px 14px' }}>Sessions</th>
                <th style={{ padding: '12px 14px' }}>Joined</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>#{u.id}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#FFFFFF' }}>{u.name}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`badge ${u.is_admin ? 'badge-rose' : 'badge-primary'}`}>
                      {u.is_admin ? "Administrator" : "Student"}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                    {u.total_study_hours}h
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.total_sessions}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>{u.created_at}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => handleToggleAdmin(u.id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          title="Toggle Admin Privilege"
                        >
                          Role
                        </button>
                      )}

                      <button
                        onClick={() => { setResetModalUser(u); setNewPassword('studyos123'); }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title="Reset Password"
                      >
                        <Key size={13} />
                      </button>

                      {u.username !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Reset Student Password</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Set a new password for <strong>{resetModalUser.name}</strong> ({resetModalUser.email}).
            </p>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>New Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setResetModalUser(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Apply Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
