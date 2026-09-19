import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Award, AlertTriangle, Plus, Clock, Target, CheckCircle2, TrendingUp } from 'lucide-react';

export default function MockTests() {
  const [mocks, setMocks] = useState([]);
  const [history, setHistory] = useState([]);
  const [weakSections, setWeakSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected attempt for visual breakdown
  const [activeAttempt, setActiveAttempt] = useState(null);

  // Record Mock Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [form, setForm] = useState({
    mock_id: '',
    score: 65,
    correct_count: 45,
    wrong_count: 12,
    skipped_count: 8,
    time_taken_minutes: 160,
    sections: { OS: 80, DBMS: 75, CN: 70, TOC: 60, Math: 85 }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, hRes] = await Promise.all([api.getMocks(), api.getMockHistory()]);
      setMocks(mRes.mock_tests || []);
      setHistory(hRes.attempts || []);
      setWeakSections(hRes.weak_sections || []);
      if (hRes.attempts?.length > 0) {
        setActiveAttempt(hRes.attempts[0]);
        setForm(f => ({ ...f, mock_id: mRes.mock_tests?.[0]?.id || '' }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAttempt = async (e) => {
    e.preventDefault();
    try {
      await api.submitMockAttempt(form.mock_id, {
        score: parseFloat(form.score),
        correct_count: parseInt(form.correct_count),
        wrong_count: parseInt(form.wrong_count),
        skipped_count: parseInt(form.skipped_count),
        time_taken_minutes: parseFloat(form.time_taken_minutes),
        section_breakdown: form.sections
      });
      setShowRecordModal(false);
      loadData();
    } catch (err) {
      alert("Failed to submit mock attempt: " + err.message);
    }
  };

  // Convert section breakdown to Recharts format
  const sectionChartData = activeAttempt ? Object.entries(activeAttempt.section_breakdown || {}).map(([subject, score]) => ({
    subject,
    score,
    fullMark: 100
  })) : [];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Mock Test Analytics Arena
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track scores, accuracy, section breakdowns, and pinpoint recurring subject weaknesses.
          </p>
        </div>

        <button onClick={() => setShowRecordModal(true)} className="btn btn-primary">
          <Plus size={16} /> Record Mock Attempt
        </button>
      </div>

      {/* Weak Section Alerts */}
      {weakSections.length > 0 && (
        <div className="glass-panel" style={{
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          borderLeft: '4px solid var(--rose)',
          background: 'rgba(244, 63, 94, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={20} color="#FDA4AF" />
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
              Recurring Weak Spot Detected:
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
              {weakSections.map(w => `${w.section} (avg ${w.average_score}%)`).join(', ')} — Practice recommended.
            </span>
          </div>
        </div>
      )}

      {/* Active Attempt Detailed Breakdown */}
      {activeAttempt && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          {/* Attempt Score Card */}
          <div className="glass-card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '4px' }}>Latest Evaluated Mock</span>
                <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>{activeAttempt.mock_title || "Mock Test"}</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {activeAttempt.date}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Score</span>
                <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)' }}>
                  {activeAttempt.score} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/ {activeAttempt.total_marks}</span>
                </h4>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Accuracy</span>
                <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#A5B4FC' }}>
                  {activeAttempt.accuracy_pct}%
                </h4>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <span>✅ {activeAttempt.correct_count} Correct</span>
              <span>❌ {activeAttempt.wrong_count} Wrong</span>
              <span>⏭️ {activeAttempt.skipped_count} Skipped</span>
              <span>⏱️ {Math.floor(activeAttempt.time_taken_minutes / 60)}h {Math.floor(activeAttempt.time_taken_minutes % 60)}m</span>
            </div>
          </div>

          {/* Radar Chart: Section Breakdown (OS, DBMS, CN, Math, TOC, etc.) */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="#6366F1" /> Section-Wise Accuracy Radar
            </h3>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={sectionChartData}>
                  <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.15)" />
                  <Radar name="Accuracy %" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', color: '#F8FAFC' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Mock Test Attempt History Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Attempt History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                <th style={{ padding: '10px 14px' }}>Date</th>
                <th style={{ padding: '10px 14px' }}>Mock Test</th>
                <th style={{ padding: '10px 14px' }}>Score</th>
                <th style={{ padding: '10px 14px' }}>Accuracy</th>
                <th style={{ padding: '10px 14px' }}>Time Taken</th>
                <th style={{ padding: '10px 14px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No mock test attempts recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((att) => (
                  <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{att.date}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{att.mock_title || "Mock Test"}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--emerald)' }}>{att.score} / {att.total_marks}</td>
                    <td style={{ padding: '12px 14px', color: '#A5B4FC', fontWeight: 600 }}>{att.accuracy_pct}%</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{att.time_taken_minutes} min</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => setActiveAttempt(att)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Inspect Radar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Mock Attempt Modal */}
      {showRecordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Record Mock Attempt</h3>
            <form onSubmit={handleRecordAttempt} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Mock Test</label>
                <select
                  required
                  value={form.mock_id}
                  onChange={(e) => setForm({ ...form, mock_id: e.target.value })}
                  className="input-field"
                >
                  {mocks.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Score</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Time (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={form.time_taken_minutes}
                    onChange={(e) => setForm({ ...form, time_taken_minutes: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Correct</label>
                  <input
                    type="number"
                    value={form.correct_count}
                    onChange={(e) => setForm({ ...form, correct_count: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Wrong</label>
                  <input
                    type="number"
                    value={form.wrong_count}
                    onChange={(e) => setForm({ ...form, wrong_count: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Skipped</label>
                  <input
                    type="number"
                    value={form.skipped_count}
                    onChange={(e) => setForm({ ...form, skipped_count: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowRecordModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Save Mock Attempt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
