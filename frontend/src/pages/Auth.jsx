import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Sparkles, Shield, User, Lock, Mail, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [name, setName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [targetHours, setTargetHours] = useState(6.0);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(loginIdentifier, loginPassword);
      localStorage.setItem('studyos_token', res.token);
      localStorage.setItem('studyos_user', JSON.stringify(res.user));
      onAuthSuccess(res.user);
      if (res.user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register(name, regIdentifier, regPassword, targetHours);
      localStorage.setItem('studyos_token', res.token);
      localStorage.setItem('studyos_user', JSON.stringify(res.user));
      onAuthSuccess(res.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickFillAdmin = () => {
    setIsRegister(false);
    setLoginIdentifier('admin');
    setLoginPassword('admin');
  };

  const quickFillDemoStudent = () => {
    setIsRegister(false);
    setLoginIdentifier('alex');
    setLoginPassword('studyos123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--bg-primary)',
      backgroundImage: `
        radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.15) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.1) 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 55%)
      `
    }}>
      <div className="glass-card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '36px 32px',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.2)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 6px 20px var(--primary-glow)'
          }}>
            <Sparkles size={24} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Study<span style={{ color: 'var(--primary-light)' }}>OS</span>
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Learning, Productivity & Competitive Exam Intelligence
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '22px'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`btn ${!isRegister ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '8px', fontSize: '0.86rem', borderRadius: '8px' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`btn ${isRegister ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '8px', fontSize: '0.86rem', borderRadius: '8px' }}
          >
            Create Account
          </button>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>
            Quick Demo Credentials:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={quickFillAdmin}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.76rem', borderRadius: '6px' }}
            >
              <Shield size={13} color="#FDA4AF" /> Admin (admin/admin)
            </button>
            <button
              type="button"
              onClick={quickFillDemoStudent}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.76rem', borderRadius: '6px' }}
            >
              <User size={13} color="#A5B4FC" /> Demo (alex)
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#FDA4AF',
            fontSize: '0.84rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Sign In Form */}
        {!isRegister ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Username or Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or alex"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
            >
              {loading ? "Signing in..." : "Sign In to StudyOS"} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Username or Email
              </label>
              <input
                type="text"
                required
                placeholder="e.g. sarah or sarah@domain.com"
                value={regIdentifier}
                onChange={(e) => setRegIdentifier(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Choose a strong password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Daily Study Goal (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                required
                value={targetHours}
                onChange={(e) => setTargetHours(parseFloat(e.target.value))}
                className="input-field"
              />
            </div>

            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '0.76rem',
              color: 'var(--emerald)'
            }}>
              ✓ New accounts start with clean, isolated personal data. No demo data is shown.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald"
              style={{ padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
            >
              {loading ? "Creating Account..." : "Create Account & Start"} <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '22px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            100% Offline-First SQLite • Zero Paid External AI Costs
          </span>
        </div>
      </div>
    </div>
  );
}
