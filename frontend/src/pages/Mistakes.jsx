import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Edit3,
  Search,
  Filter,
  Trash2,
  Sparkles
} from 'lucide-react';

const REASONS = [
  "concept gap",
  "calculation error",
  "careless error",
  "misunderstood question",
  "memory issue",
  "time pressure",
  "guessed answer"
];

export default function Mistakes() {
  const [mistakes, setMistakes] = useState([]);
  const [reasonBreakdown, setReasonBreakdown] = useState({});
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Reattempt Modal State
  const [activeReattempt, setActiveReattempt] = useState(null);
  const [reattemptAnswer, setReattemptAnswer] = useState('');
  const [reattemptResult, setReattemptResult] = useState(null);

  // Edit Note Modal
  const [editMistake, setEditMistake] = useState(null);
  const [conceptNote, setConceptNote] = useState('');

  useEffect(() => {
    loadMistakes();
  }, [selectedReason]);

  const loadMistakes = async () => {
    try {
      setLoading(true);
      const param = selectedReason ? `?reason=${encodeURIComponent(selectedReason)}` : '';
      const res = await api.getMistakes(param);
      setMistakes(res.mistakes || []);
      setReasonBreakdown(res.reason_breakdown || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReattempt = (m) => {
    setActiveReattempt(m);
    setReattemptAnswer('');
    setReattemptResult(null);
  };

  const handleSubmitReattempt = async () => {
    if (!reattemptAnswer) {
      alert("Please select or type your answer!");
      return;
    }

    try {
      const res = await api.reattemptMistake(activeReattempt.id, { answer: reattemptAnswer });
      setReattemptResult(res);
      if (res.is_correct) {
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
      }
      loadMistakes();
    } catch (err) {
      alert("Failed to submit reattempt: " + err.message);
    }
  };

  const handleSaveConceptNote = async () => {
    try {
      await api.updateMistake(editMistake.id, { concept_note: conceptNote });
      setEditMistake(null);
      loadMistakes();
    } catch (err) {
      alert("Failed to update note: " + err.message);
    }
  };

  const handleDeleteMistake = async (id) => {
    if (confirm("Remove this entry from Mistake Book?")) {
      await api.deleteMistake(id);
      loadMistakes();
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Personal Mistake Book
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Turn every wrong question into conceptual mastery with diagnostic error categorization.
          </p>
        </div>
      </div>

      {/* Mistake Diagnostic Reason Filter Pills */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedReason('')}
          style={{
            background: selectedReason === '' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid ' + (selectedReason === '' ? 'var(--primary)' : 'var(--border-subtle)'),
            color: selectedReason === '' ? '#FFFFFF' : 'var(--text-muted)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          All Mistakes ({mistakes.length})
        </button>

        {REASONS.map((r) => {
          const count = reasonBreakdown[r] || 0;
          return (
            <button
              key={r}
              onClick={() => setSelectedReason(r)}
              style={{
                background: selectedReason === r ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (selectedReason === r ? 'var(--primary)' : 'var(--border-subtle)'),
                color: selectedReason === r ? '#FFFFFF' : 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {r} ({count})
            </button>
          );
        })}
      </div>

      {/* Mistake Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {mistakes.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-dim)' }}>
              No mistakes found under this diagnostic filter. Keep practicing questions!
            </p>
          </div>
        ) : (
          mistakes.map((m) => (
            <div key={m.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className={`badge ${m.last_result === 'corrected' ? 'badge-emerald' : (m.last_result === 'failed_again' ? 'badge-rose' : 'badge-amber')}`}>
                    {m.last_result === 'corrected' ? 'Mastered / Corrected' : (m.last_result === 'failed_again' ? 'Repeat Error' : 'Unresolved')}
                  </span>
                  <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-dim)', fontWeight: 600 }}>
                    🏷️ {m.reason}
                  </span>
                </div>

                {/* Subject & Topic */}
                <span style={{ fontSize: '0.78rem', color: '#A5B4FC', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  {m.subject_name} • {m.topic_name || 'General'}
                </span>

                {/* Question Statement */}
                <p style={{ fontSize: '0.92rem', color: '#FFFFFF', lineHeight: 1.5, marginBottom: '14px', fontWeight: 500 }}>
                  {m.question_text}
                </p>

                {/* Comparison Details */}
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--rose)' }}>Your Answer: {m.user_answer || "None"}</span>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>Correct: {m.correct_answer}</span>
                  </div>
                </div>

                {/* Concept Note */}
                {m.concept_note && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginBottom: '16px'
                  }}>
                    <strong style={{ color: '#A5B4FC', display: 'block', marginBottom: '2px' }}>Personal Concept Note:</strong>
                    {m.concept_note}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <button
                  onClick={() => { setEditMistake(m); setConceptNote(m.concept_note || ''); }}
                  className="btn btn-ghost"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  <Edit3 size={14} /> Note
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDeleteMistake(m.id)}
                    className="btn btn-ghost"
                    style={{ padding: '6px 8px', color: 'var(--rose)' }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleOpenReattempt(m)}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    <RotateCcw size={14} /> Reattempt
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reattempt Modal */}
      {activeReattempt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Reattempt Question</h3>
            <p style={{ fontSize: '0.92rem', color: '#FFFFFF', lineHeight: 1.5, marginBottom: '18px' }}>
              {activeReattempt.question_text}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {activeReattempt.options?.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => !reattemptResult && setReattemptAnswer(opt)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: reattemptAnswer === opt ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                    border: reattemptAnswer === opt ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    cursor: reattemptResult ? 'default' : 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
                </div>
              ))}
            </div>

            {reattemptResult && (
              <div style={{
                padding: '14px',
                borderRadius: '8px',
                background: reattemptResult.is_correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                marginBottom: '16px'
              }}>
                <span style={{ fontWeight: 700, color: reattemptResult.is_correct ? 'var(--emerald)' : 'var(--rose)' }}>
                  {reattemptResult.is_correct ? "🎉 Correct! Mistake resolved." : "❌ Incorrect. Concept note review needed."}
                </span>
                {reattemptResult.explanation && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {reattemptResult.explanation}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveReattempt(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Close
              </button>
              {!reattemptResult && (
                <button
                  onClick={handleSubmitReattempt}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  Verify Reattempt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Concept Note Modal */}
      {editMistake && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Update Concept Note</h3>
            <textarea
              rows={4}
              value={conceptNote}
              onChange={(e) => setConceptNote(e.target.value)}
              placeholder="Why did this mistake happen? Write key reminder..."
              className="input-field"
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEditMistake(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleSaveConceptNote} className="btn btn-primary" style={{ flex: 2 }}>
                Save Concept Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
