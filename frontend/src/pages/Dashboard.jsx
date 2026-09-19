import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import {
  Clock,
  Flame,
  Target,
  AlertCircle,
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  Calendar,
  BookOpen,
  Award,
  Repeat,
  DownloadCloud
} from 'lucide-react';

export default function Dashboard({ user, onRefreshUserData }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneStarter = async () => {
    try {
      setCloning(true);
      setCloneMsg('');
      const res = await api.cloneStarterTemplate();
      setCloneMsg(res.message || 'Starter template installed successfully!');
      await loadDashboard();
      if (onRefreshUserData) onRefreshUserData();
    } catch (err) {
      setCloneMsg('Notice: ' + err.message);
    } finally {
      setCloning(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.updateTask(taskId, { status: 'completed' });
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="anim-pulse" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading StudyOS Intelligence Engine...</p>
        </div>
      </div>
    );
  }

  const todayStudy = data?.today_study || {};
  const priorities = data?.priorities || [];
  const alerts = data?.alerts || [];
  const subjectTime = data?.subject_time || [];
  const recentSessions = data?.recent_sessions || [];
  const tasksToday = data?.tasks_today || [];
  const isNewUser = (data?.total_hours === 0 && data?.streak?.current === 0 && recentSessions.length === 0);

  return (
    <div className="page-wrapper">
      {/* Top Welcome & Summary Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              Study Command Center
            </h1>
            <span className="badge badge-primary">
              {user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Day Focus'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Transforming day-to-day learning into structured insights & exam readiness.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/timer" className="btn btn-primary">
            <Play size={16} /> Start Study Session
          </Link>
          <Link to="/questions" className="btn btn-secondary">
            <Target size={16} /> Practice PYQs
          </Link>
        </div>
      </div>

      {/* New User Fresh Account Onboarding Banner */}
      {isNewUser && (
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '28px',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '680px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px var(--primary-glow)',
                flexShrink: 0
              }}>
                <Sparkles size={22} color="#FFF" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF', marginBottom: '4px' }}>
                  Clean Workspace Ready for Your Journey!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  You are registered on StudyOS with complete data isolation. No dummy data will appear—every chart, streak, and revision badge will reflect only what you study.
                </p>
                {cloneMsg && (
                  <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--emerald)', fontWeight: 600 }}>
                    {cloneMsg}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleCloneStarter}
                disabled={cloning}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <DownloadCloud size={15} />
                {cloning ? 'Importing Starter...' : 'Load Starter Syllabus (Optional)'}
              </button>
              <Link to="/timer" className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                <Play size={14} /> Start 1st Session
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Banner (if any) */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: alert.type === 'urgent' ? '4px solid var(--rose)' : '4px solid var(--amber)',
                background: alert.type === 'urgent' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'
              }}
            >
              <AlertCircle size={18} color={alert.type === 'urgent' ? '#FDA4AF' : '#FCD34D'} />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 500 }}>
                {alert.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Top 4 Core Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        <StatCard
          title="Today's Study"
          value={todayStudy.display || "00h 00m"}
          subtitle={`Target: ${todayStudy.goal_display || "06h 00m"}`}
          icon={Clock}
          color="#6366F1"
          badge={`${todayStudy.progress_pct || 0}%`}
        />
        <StatCard
          title="Goal Completion"
          value={`${todayStudy.progress_pct || 0}%`}
          subtitle={`${todayStudy.session_count || 0} sessions completed today`}
          icon={Target}
          color="#10B981"
        />
        <StatCard
          title="Consistency Streak"
          value={`${data?.streak?.current || 0} Days`}
          subtitle={`Personal Record: ${data?.streak?.best || 0} days`}
          icon={Flame}
          color="#F59E0B"
          badge={data?.streak?.current > 0 ? "Active" : "Ready"}
        />
        <StatCard
          title="Experience & Level"
          value={`Lvl ${data?.level || 1}`}
          subtitle={`${data?.xp || 0} XP earned total`}
          icon={Award}
          color="#8B5CF6"
        />
      </div>

      {/* Main Grid: Left Section (Priorities & Subject Breakdown), Right Section (Tasks & Sessions) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Today's Priorities (Smart Rule-Based Engine: R1 to R8) */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#818CF8" />
              <h3 style={{ fontSize: '1.15rem' }}>Today's Priorities</h3>
            </div>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              Rules R1–R8 Engine
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {priorities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '10px' }}>
                  No urgent priority tasks. Ready for self-directed study!
                </p>
                <Link to="/courses" className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                  Browse Syllabus & Subjects
                </Link>
              </div>
            ) : (
              priorities.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`badge ${item.priority === 'urgent' ? 'badge-rose' : 'badge-amber'}`}>
                        {item.badge}
                      </span>
                      {item.subject && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          • {item.subject}
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.description}
                    </p>
                  </div>

                  <Link to={item.action_link || "/timer"} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {item.action_text || "Execute"} <ArrowRight size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subject Study Time Distribution Today */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#34D399" />
              <h3 style={{ fontSize: '1.15rem' }}>Subject Time Breakdown</h3>
            </div>
            <Link to="/analytics" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
              Deep Analytics →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {subjectTime.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 12px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '12px' }}>
                  No study sessions recorded yet today.
                </p>
                <Link to="/timer" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                  <Play size={13} /> Record First Session
                </Link>
              </div>
            ) : (
              subjectTime.map((sub, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: sub.color }} />
                      {sub.subject}
                    </span>
                    <span style={{ fontWeight: 700, color: '#A5B4FC', fontFamily: 'var(--font-mono)' }}>
                      {sub.display}
                    </span>
                  </div>
                  <ProgressBar
                    value={sub.minutes}
                    max={todayStudy.minutes || 1}
                    color={sub.color}
                    height={7}
                  />
                </div>
              ))
            )}
          </div>

          {/* Goal Progress Visual Bar */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daily Goal Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>{todayStudy.progress_pct || 0}% Complete</span>
            </div>
            <ProgressBar
              value={todayStudy.hours || 0}
              max={todayStudy.goal_hours || 6}
              color="linear-gradient(90deg, #6366F1 0%, #10B981 100%)"
              height={10}
            />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Planned Blocks and Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px'
      }}>
        {/* Today's Tasks / Schedule */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#F59E0B" />
              <h3 style={{ fontSize: '1.15rem' }}>Planned Blocks for Today</h3>
            </div>
            <Link to="/calendar" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
              Open Planner →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasksToday.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '10px' }}>
                  No tasks scheduled for today. Add study blocks in the planner!
                </p>
                <Link to="/calendar" className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                  + Schedule Study Block
                </Link>
              </div>
            ) : (
              tasksToday.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: task.status === 'completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: task.status === 'completed' ? 'var(--emerald)' : 'var(--text-dim)',
                        padding: 0
                      }}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <div>
                      <h5 style={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: task.status === 'completed' ? 'var(--text-dim)' : 'var(--text-main)'
                      }}>
                        {task.title}
                      </h5>
                      {task.scheduled_time && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          🕒 {task.scheduled_time} • {task.subject_name || 'General'}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`badge ${task.status === 'completed' ? 'badge-emerald' : 'badge-primary'}`} style={{ fontSize: '0.68rem' }}>
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Study Sessions */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#67E8F9" />
              <h3 style={{ fontSize: '1.15rem' }}>Recent Study Activity</h3>
            </div>
            <Link to="/timer" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
              Session History →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '10px' }}>
                  No recent study sessions logged yet.
                </p>
                <Link to="/timer" className="btn btn-primary" style={{ fontSize: '0.78rem' }}>
                  <Play size={13} /> Launch Pomodoro Timer
                </Link>
              </div>
            ) : (
              recentSessions.map((sess) => (
                <div
                  key={sess.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sess.subject_color || 'var(--primary)' }} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{sess.subject_name || 'Self Study'}</span>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{sess.mode}</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      {sess.topic_name || 'Deep work'} • Focus: {sess.focus_rating}/5 ⭐
                    </span>
                  </div>

                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#A5B4FC', fontFamily: 'var(--font-mono)' }}>
                    {sess.duration_minutes} min
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
