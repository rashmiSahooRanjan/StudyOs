import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Heatmap from '../components/Heatmap';
import ProgressBar from '../components/ProgressBar';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  Dna,
  Zap,
  Clock,
  Target,
  Flame,
  Award,
  BookOpen,
  PieChart as PieIcon,
  TrendingUp,
  Download
} from 'lucide-react';

export default function Analytics() {
  const [dna, setDna] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [subjectBalance, setSubjectBalance] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [dnaRes, heatRes, subjRes, dailyRes, achRes] = await Promise.all([
        api.getStudyDna(),
        api.getHeatmap(90),
        api.getSubjectBalance(),
        api.getDailyTrend(),
        api.getAchievements()
      ]);
      setDna(dnaRes.study_dna);
      setHeatmap(heatRes.heatmap || []);
      setSubjectBalance(subjRes.subject_balance || []);
      setDailyTrend(dailyRes.daily_trend || []);
      setAchievements(achRes.achievements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Productivity Analytics & Study DNA
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Transparent descriptive statistics & pattern discovery derived entirely from your own logged activity.
          </p>
        </div>

        <a href={api.getExportCsvUrl()} download="studyos_sessions.csv" className="btn btn-secondary">
          <Download size={15} /> Export Sessions CSV
        </a>
      </div>

      {/* Section 26: YOUR STUDY DNA Card */}
      {dna && (
        <div className="glass-card" style={{
          padding: '28px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Dna size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Your Study DNA
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Descriptive statistics based on {dna.total_study_hours} total hours logged
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Average Daily Study</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A5B4FC', fontFamily: 'var(--font-mono)' }}>
                {dna.avg_daily_study_display}
              </span>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Average Session Length</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                {dna.avg_session_display}
              </span>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Most Productive Period</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FCD34D' }}>
                {dna.peak_productive_period}
              </span>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Highest Focus Subject</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#67E8F9' }}>
                {dna.highest_focus_subject}
              </span>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Least Studied Subject</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FDA4AF' }}>
                {dna.least_studied_subject}
              </span>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Weekly Consistency</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                {dna.weekly_consistency_pct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Heatmap Grid */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} color="#F59E0B" />
            <h3 style={{ fontSize: '1.15rem' }}>Study Activity Heatmap (Last 90 Days)</h3>
          </div>
        </div>
        <Heatmap data={heatmap} />
      </div>

      {/* Charts Grid: Daily Trend on Left, Subject Balance on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Daily Study Trend (Last 14 Days) */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#10B981" /> Daily Study Hours Trend
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${val} hours`, 'Studied']}
                  contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', color: '#FFFFFF' }}
                />
                <Bar dataKey="hours" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Time Balance Pie */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} color="#8B5CF6" /> Subject Time Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {subjectBalance.map((sb, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sb.subject}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#A5B4FC' }}>
                    {sb.hours}h ({sb.percentage}%)
                  </span>
                </div>
                <ProgressBar value={sb.percentage} color={sb.color} height={6} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gamification: Badges & Achievements */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Award size={20} color="#F59E0B" />
          <h3 style={{ fontSize: '1.15rem' }}>Earned Study Milestones & Badges</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {achievements.map((ach) => (
            <div
              key={ach.id}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={22} color="#F59E0B" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>{ach.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{ach.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
