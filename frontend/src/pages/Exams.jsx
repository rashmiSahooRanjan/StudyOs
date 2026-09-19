import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { Target, Plus, Calendar, Award, BookOpen, Clock, ArrowRight } from 'lucide-react';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    exam_date: '',
    target_score: 80,
    target_rank: 100,
    notes: ''
  });

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await api.getExams();
      setExams(res.exams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await api.createExam(form);
      setShowAddModal(false);
      setForm({ name: '', exam_date: '', target_score: 80, target_rank: 100, notes: '' });
      loadExams();
    } catch (err) {
      alert("Failed to create exam: " + err.message);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Competitive Exam Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Target tracking, syllabus completion, weightage, and real-time countdown clocks.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Track New Exam
        </button>
      </div>

      {/* Exam Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {exams.map((exam) => (
          <div key={exam.id} className="glass-card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span className="badge badge-rose" style={{ marginBottom: '6px' }}>Target Examination</span>
                <h3 style={{ fontSize: '1.3rem', color: '#FFFFFF' }}>{exam.name}</h3>
              </div>
              <div style={{
                padding: '8px 14px',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FDA4AF', display: 'block', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                  {exam.days_remaining}
                </span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Days Left
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                <Calendar size={15} color="#818CF8" />
                <span>Date: {exam.exam_date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                <Award size={15} color="#F59E0B" />
                <span>Target: {exam.target_score} pts</span>
              </div>
            </div>

            {/* Syllabus Completion */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Overall Syllabus Progress</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{exam.syllabus_completion}%</span>
              </div>
              <ProgressBar
                value={exam.syllabus_completion}
                color="linear-gradient(90deg, #6366F1 0%, #10B981 100%)"
                height={9}
              />
            </div>

            {/* Subjects overview inside Exam */}
            {exam.subjects && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {exam.subjects.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {s.name} ({s.progress}%)
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Strategy: {exam.revision_strategy.replace('_', ' ').toUpperCase()}
              </span>
              <Link to="/syllabus" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                View Full Syllabus <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Exam Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Track Competitive Exam</h3>
            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GATE CSE 2027, UPSC CSE, SSC CGL"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Exam Date</label>
                <input
                  type="date"
                  required
                  value={form.exam_date}
                  onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Target Score</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.target_score}
                    onChange={(e) => setForm({ ...form, target_score: parseFloat(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Target Rank</label>
                  <input
                    type="number"
                    value={form.target_rank}
                    onChange={(e) => setForm({ ...form, target_rank: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Create Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
