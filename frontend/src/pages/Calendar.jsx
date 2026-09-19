import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject_id: '',
    scheduled_time: '19:00 - 20:00',
    planned_minutes: 60,
    priority: 'medium'
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes] = await Promise.all([
        api.getTasks(`?date=${selectedDate}`),
        api.getSubjects()
      ]);
      setTasks(tRes.tasks || []);
      setSubjects(sRes.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRollover = async () => {
    try {
      const res = await api.rolloverTasks();
      alert(res.message);
      loadData();
    } catch (err) {
      alert("Failed to rollover tasks: " + err.message);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.createTask({
        ...form,
        subject_id: form.subject_id ? parseInt(form.subject_id) : null,
        due_date: selectedDate
      });
      setShowAddModal(false);
      setForm({ title: '', subject_id: '', scheduled_time: '19:00 - 20:00', planned_minutes: 60, priority: 'medium' });
      loadData();
    } catch (err) {
      alert("Failed to create task: " + err.message);
    }
  };

  // Planned vs Actual Variance Calculations
  const totalPlannedMins = tasks.reduce((sum, t) => sum + (t.planned_minutes || 0), 0);
  const totalActualMins = tasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);
  const planAdherencePct = totalPlannedMins > 0 ? Math.min(100, Math.round((totalActualMins / totalPlannedMins) * 100)) : 0;

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Calendar & Smart Planner
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Compare planned study blocks versus actual logged activity with automated rollover.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleRollover} className="btn btn-secondary" title="Move unfinished tasks from past days to today">
            <RefreshCw size={15} /> Rollover Unfinished Tasks
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Plan Study Block
          </button>
        </div>
      </div>

      {/* Date Selector Banner & Plan vs Actual Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Date Picker Card */}
        <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Selected Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
              style={{ marginTop: '6px' }}
            />
          </div>
          <CalendarIcon size={32} color="#818CF8" style={{ opacity: 0.8 }} />
        </div>

        {/* Plan vs Actual Variance Card */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Plan Adherence</span>
            <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>{planAdherencePct}% Adherence</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Planned: {Math.floor(totalPlannedMins / 60)}h {totalPlannedMins % 60}m</span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Actual: {Math.floor(totalActualMins / 60)}h {totalActualMins % 60}m</span>
          </div>

          <ProgressBar value={planAdherencePct} color="linear-gradient(90deg, #6366F1 0%, #10B981 100%)" height={8} />
        </div>
      </div>

      {/* Section 17 Plan vs Actual Comparison Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '18px' }}>Scheduled Blocks for {selectedDate}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
              <p>No study blocks scheduled for this date. Click "Plan Study Block" above!</p>
            </div>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: t.status === 'completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    onClick={() => handleToggleTaskStatus(t)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <CheckCircle2 size={22} color={t.status === 'completed' ? 'var(--emerald)' : 'var(--text-dim)'} />
                  </button>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span className={`badge ${t.priority === 'high' ? 'badge-rose' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                        {t.priority}
                      </span>
                      {t.subject_name && (
                        <span style={{ fontSize: '0.75rem', color: '#A5B4FC', fontWeight: 600 }}>
                          • {t.subject_name}
                        </span>
                      )}
                    </div>
                    <h4 style={{
                      fontSize: '0.98rem',
                      fontWeight: 600,
                      color: t.status === 'completed' ? 'var(--text-dim)' : 'var(--text-main)',
                      textDecoration: t.status === 'completed' ? 'line-through' : 'none'
                    }}>
                      {t.title}
                    </h4>
                  </div>
                </div>

                {/* Plan vs Actual Variance Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {t.scheduled_time && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Time Slot</span>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {t.scheduled_time}
                      </span>
                    </div>
                  )}

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Plan vs Actual</span>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: t.status === 'completed' ? 'var(--emerald)' : '#FFFFFF' }}>
                      {t.planned_minutes}m plan / {t.actual_minutes}m act
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Plan Block Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Schedule Study Block</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Block Title / Task</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OS - Deadlock & Banker's Algorithm Revision"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Subject</label>
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- General / Non-subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 19:00 - 20:00"
                    value={form.scheduled_time}
                    onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Planned Mins</label>
                  <input
                    type="number"
                    value={form.planned_minutes}
                    onChange={(e) => setForm({ ...form, planned_minutes: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Schedule Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
