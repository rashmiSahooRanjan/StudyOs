import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import {
  Repeat,
  RotateCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function Revision() {
  const [revisions, setRevisions] = useState({ due_today: [], overdue: [], upcoming: [], completed: [] });
  const [flashcards, setFlashcards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Flashcard Reviewer State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Add Flashcard Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ subject_id: '', front: '', back: '', difficulty: 'medium' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, fRes, sRes] = await Promise.all([
        api.getRevisions(),
        api.getFlashcards(),
        api.getSubjects()
      ]);
      setRevisions(rRes);
      setFlashcards(fRes.flashcards || []);
      setSubjects(sRes.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRevision = async (revId, quality) => {
    try {
      await api.completeRevision(revId, { quality });
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
      loadData();
    } catch (err) {
      alert("Failed to update revision: " + err.message);
    }
  };

  const handleReviewFlashcard = async (quality) => {
    const card = flashcards[cardIndex];
    if (!card) return;

    try {
      await api.reviewFlashcard(card.id, { difficulty: quality });
      setIsFlipped(false);
      if (cardIndex < flashcards.length - 1) {
        setCardIndex(cardIndex + 1);
      } else {
        setCardIndex(0);
        try {
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFlashcard = async (e) => {
    e.preventDefault();
    try {
      await api.createFlashcard({
        ...form,
        subject_id: parseInt(form.subject_id)
      });
      setShowAddModal(false);
      setForm({ subject_id: '', front: '', back: '', difficulty: 'medium' });
      loadData();
    } catch (err) {
      alert("Failed to add flashcard: " + err.message);
    }
  };

  const currentCard = flashcards[cardIndex];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Spaced Revision Engine
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Scientific spaced repetition (+1, +3, +7, +14, +30 days) to prevent the forgetting curve.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Flashcard
        </button>
      </div>

      {/* Due Today & Overdue Spaced Queue Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Left: Due & Overdue Items */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Repeat size={18} color="#F59E0B" />
              <h3 style={{ fontSize: '1.15rem' }}>Active Spaced Queue</h3>
            </div>
            <span className="badge badge-amber">
              {(revisions.due_today?.length || 0) + (revisions.overdue?.length || 0)} Due
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...(revisions.overdue || []), ...(revisions.due_today || [])].length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>No pending revisions due right now! All caught up.</p>
            ) : (
              [...(revisions.overdue || []), ...(revisions.due_today || [])].map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: rev.is_overdue ? 'rgba(244, 63, 94, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                    border: rev.is_overdue ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className={`badge ${rev.is_overdue ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '0.65rem', marginBottom: '4px' }}>
                        {rev.is_overdue ? 'Overdue' : 'Due Today'}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {rev.topic_name || "Topic Review"}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {rev.subject_name} • Stage {rev.stage} / 5 (Day +{rev.interval_days})
                      </span>
                    </div>
                  </div>

                  {/* Recall Quality Buttons */}
                  <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                    <button
                      onClick={() => handleCompleteRevision(rev.id, 'forgot')}
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--rose)', flex: 1 }}
                      title="Reset back to Day +1"
                    >
                      Forgot
                    </button>
                    <button
                      onClick={() => handleCompleteRevision(rev.id, 'hard')}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.72rem', flex: 1 }}
                    >
                      Hard
                    </button>
                    <button
                      onClick={() => handleCompleteRevision(rev.id, 'good')}
                      className="btn btn-primary"
                      style={{ padding: '4px 8px', fontSize: '0.72rem', flex: 1 }}
                    >
                      Good
                    </button>
                    <button
                      onClick={() => handleCompleteRevision(rev.id, 'easy')}
                      className="btn btn-emerald"
                      style={{ padding: '4px 8px', fontSize: '0.72rem', flex: 1 }}
                    >
                      Easy
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Interactive 3D Flip Flashcard Player */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#818CF8" />
              <h3 style={{ fontSize: '1.15rem' }}>Flashcard Deck Player</h3>
            </div>
            {flashcards.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {cardIndex + 1} of {flashcards.length}
              </span>
            )}
          </div>

          {currentCard ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Flip Card Visual Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  minHeight: '220px',
                  borderRadius: 'var(--radius-lg)',
                  background: isFlipped
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
                  border: isFlipped ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span className={`badge ${isFlipped ? 'badge-emerald' : 'badge-primary'}`} style={{ marginBottom: '14px', fontSize: '0.68rem' }}>
                  {isFlipped ? "ANSWER / KEY POINT" : "QUESTION / PROMPT"} (Click to flip)
                </span>

                <p style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line'
                }}>
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '16px' }}>
                  {currentCard.subject_name} • {currentCard.topic_name || 'General'}
                </span>
              </div>

              {/* Quality Rating Controls */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  onClick={() => handleReviewFlashcard('hard')}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.82rem' }}
                >
                  Hard (1d)
                </button>
                <button
                  onClick={() => handleReviewFlashcard('medium')}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.82rem' }}
                >
                  Good
                </button>
                <button
                  onClick={() => handleReviewFlashcard('easy')}
                  className="btn btn-emerald"
                  style={{ flex: 1, padding: '8px', fontSize: '0.82rem' }}
                >
                  Easy (Bonus XP)
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              <p>No flashcards created yet. Click "New Flashcard" above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Flashcard Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Create Spaced Flashcard</h3>
            <form onSubmit={handleAddFlashcard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Subject</label>
                <select
                  required
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Front (Prompt / Question)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. What are the 4 Coffman conditions for deadlock?"
                  value={form.front}
                  onChange={(e) => setForm({ ...form, front: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Back (Answer / Notes)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. 1. Mutual Exclusion 2. Hold and Wait 3. No Preemption 4. Circular Wait"
                  value={form.back}
                  onChange={(e) => setForm({ ...form, back: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Create Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
