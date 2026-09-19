import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings as SettingsIcon, Download, User, Database, ShieldCheck, HardDrive, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState({ name: 'Alex Morgan', email: 'alex@studyos.local', target_daily_hours: 8.0 });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile({
        name: user.name,
        target_daily_hours: parseFloat(user.target_daily_hours)
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    }
  };

  const handleDownloadJsonBackup = async () => {
    try {
      setDownloading(true);
      const data = await api.getBackupData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyos_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download backup: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
          Settings & Local Data Ownership
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Profile preferences, daily targets, and 100% offline data backup & export.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Profile Settings */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User size={20} color="#818CF8" />
            <h3 style={{ fontSize: '1.2rem' }}>Student Profile & Targets</h3>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Student Name</label>
              <input
                type="text"
                required
                value={user.name || ''}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Email (Local Account)</label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="input-field"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>
                Target Daily Study Hours (Default Goal)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                required
                value={user.target_daily_hours || 6}
                onChange={(e) => setUser({ ...user, target_daily_hours: parseFloat(e.target.value) })}
                className="input-field"
              />
            </div>

            {savedSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', fontSize: '0.85rem' }}>
                <CheckCircle size={16} /> Preferences saved successfully!
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Save Target Preferences
            </button>
          </form>
        </div>

        {/* Data Ownership & Export */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <HardDrive size={20} color="#10B981" />
              <h3 style={{ fontSize: '1.2rem' }}>Data Ownership & Backup</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              StudyOS adheres to complete data sovereignty. You own all raw study history, syllabus progress, mistake logs, and flashcards. Export your complete state anytime.
            </p>

            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck size={18} color="var(--emerald)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>Zero External AI Cost Guarantee</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                All algorithms (spaced repetition intervals, rule recommendations R1-R8, Study DNA profiler) run 100% locally on your machine with deterministic rules and SQLite.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleDownloadJsonBackup}
              disabled={downloading}
              className="btn btn-emerald"
            >
              <Download size={16} /> {downloading ? "Preparing Backup..." : "Download Full JSON Database Backup"}
            </button>

            <a
              href={api.getExportCsvUrl()}
              download="studyos_sessions.csv"
              className="btn btn-secondary"
              style={{ textAlign: 'center' }}
            >
              <Download size={16} /> Download Study Sessions CSV Log
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
