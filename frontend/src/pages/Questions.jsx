import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import {
  HelpCircle,
  CheckCircle,
  XCircle,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Active Interactive Question Practice State
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);

  // Add Question Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    subject_id: '',
    question_text: '',
    options: ['', '', '', ''],
    answer: '',
    explanation: '',
    difficulty: 'Medium',
    year: 2024,
    marks: 2.0,
    negative_marks: 0.66
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([api.getQuestions(), api.getSubjects()]);
      setQuestions(qRes.questions || []);
      setSubjects(sRes.subjects || []);
      if (qRes.questions?.length > 0) {
        setActiveQuestion(qRes.questions[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (q) => {
    setActiveQuestion(q);
    setSelectedAnswer('');
    setSubmittedResult(null);
    setTimeSpent(0);
  };

  const handleSubmitAttempt = async () => {
    if (!selectedAnswer) {
      alert("Please select an option before submitting!");
      return;
    }

    try {
      const res = await api.attemptQuestion(activeQuestion.id, {
        selected_answer: selectedAnswer,
        time_taken_seconds: timeSpent || 45,
        mistake_reason: "concept gap"
      });

      setSubmittedResult(res);

      if (res.correct) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}
      }
    } catch (err) {
      alert("Failed to submit attempt: " + err.message);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.createQuestion({
        ...form,
        subject_id: parseInt(form.subject_id),
        options: form.options.filter(o => o.trim() !== '')
      });
      setShowAddModal(false);
      setForm({
        subject_id: '',
        question_text: '',
        options: ['', '', '', ''],
        answer: '',
        explanation: '',
        difficulty: 'Medium',
        year: 2024,
        marks: 2.0,
        negative_marks: 0.66
      });
      loadData();
    } catch (err) {
      alert("Failed to add question: " + err.message);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (selectedSubject && q.subject_id !== parseInt(selectedSubject)) return false;
    if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
    return true;
  });

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            PYQ & Question Bank Arena
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Practice past exam questions with instant explanations & automatic mistake book linking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Question
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="input-field"
          style={{ width: '200px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="input-field"
          style={{ width: '160px' }}
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Showing {filteredQuestions.length} questions
        </span>
      </div>

      {/* Main Split Layout: Question List on Left, Active Interactive Practice on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left: Questions List */}
        <div className="glass-card" style={{ padding: '20px', maxHeight: '720px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Question Bank</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredQuestions.map((q) => {
              const isSelected = activeQuestion?.id === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                      {q.subject_name || 'Subject'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className={`badge ${q.difficulty === 'Hard' ? 'badge-rose' : (q.difficulty === 'Medium' ? 'badge-amber' : 'badge-emerald')}`} style={{ fontSize: '0.65rem' }}>
                        {q.difficulty}
                      </span>
                      {q.year && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {q.year}
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.86rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {q.question_text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Practice Arena */}
        {activeQuestion ? (
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            {/* Question Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <span className="badge badge-primary" style={{ marginRight: '8px' }}>
                  {activeQuestion.source || 'GATE PYQ'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {activeQuestion.subject_name} • {activeQuestion.topic_name || 'General'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--emerald)' }}>+{activeQuestion.marks} Marks</span>
                <span style={{ color: 'var(--rose)' }}>-{activeQuestion.negative_marks} Neg</span>
              </div>
            </div>

            {/* Question Text */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '1.05rem', color: '#FFFFFF', lineHeight: 1.6, fontWeight: 500 }}>
                {activeQuestion.question_text}
              </p>
            </div>

            {/* MCQ Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {activeQuestion.options?.map((opt, idx) => {
                const isPicked = selectedAnswer === opt;
                return (
                  <div
                    key={idx}
                    onClick={() => !submittedResult && setSelectedAnswer(opt)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: isPicked ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                      border: isPicked ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                      cursor: submittedResult ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isPicked ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{opt}</span>
                  </div>
                );
              })}
            </div>

            {/* Submit / Action Button */}
            {!submittedResult ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSubmitAttempt}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.95rem' }}
                >
                  Confirm & Submit Answer
                </button>
              </div>
            ) : (
              /* Attempt Evaluation Result */
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: submittedResult.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: submittedResult.correct ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  {submittedResult.correct ? (
                    <>
                      <CheckCircle size={22} color="var(--emerald)" />
                      <h4 style={{ color: 'var(--emerald)', fontSize: '1.1rem' }}>Correct Answer! (+{submittedResult.xp_earned} XP)</h4>
                    </>
                  ) : (
                    <>
                      <XCircle size={22} color="var(--rose)" />
                      <h4 style={{ color: 'var(--rose)', fontSize: '1.1rem' }}>Incorrect — Auto logged to Mistake Book</h4>
                    </>
                  )}
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                  <strong>Correct Choice:</strong> {submittedResult.correct_answer}
                </p>

                {submittedResult.explanation && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5
                  }}>
                    <strong style={{ color: '#A5B4FC', display: 'block', marginBottom: '4px' }}>Explanation:</strong>
                    {submittedResult.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)' }}>Select a question from the list to start practicing.</p>
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Add Question to Bank</h3>
            <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Question Text</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter full question statement..."
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* 4 Options */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Options (A, B, C, D)</label>
                {form.options.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    required
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...form.options];
                      newOpts[i] = e.target.value;
                      setForm({ ...form, options: newOpts });
                    }}
                    className="input-field"
                    style={{ marginBottom: '6px' }}
                  />
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Exact Correct Answer</label>
                <input
                  type="text"
                  required
                  placeholder="Must match the correct option text exactly"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Explanation of the solution..."
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="input-field"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
