import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertOctagon,
  Sparkles,
  Clock,
  Star,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const STUDY_MODES = [
  "Learning",
  "Revision",
  "Practice",
  "PYQ",
  "Mock Test",
  "Reading",
  "Coding",
  "Lecture",
  "Assignment"
];

export default function StudyTimer() {
  const [timerMode, setTimerMode] = useState('pomodoro'); // 'pomodoro' or 'stopwatch'
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [studyMode, setStudyMode] = useState("Learning");

  // Selection state
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  // Distraction & Focus state
  const [distractions, setDistractions] = useState(0);
  const [distractionNotes, setDistractionNotes] = useState('');
  const [focusRating, setFocusRating] = useState(5);
  const [notes, setNotes] = useState('');

  // Completed session modal & history
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sessionsHistory, setSessionsHistory] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef(null);

  useEffect(() => {
    loadMetadata();
    loadHistory();
  }, []);

  const loadMetadata = async () => {
    try {
      const cRes = await api.getCourses();
      setCourses(cRes.courses || []);
      const sRes = await api.getSubjects();
      setSubjects(sRes.subjects || []);
      if (sRes.subjects?.length > 0) {
        setSelectedSubjectId(sRes.subjects[0].id);
        setTopics(sRes.subjects[0].topics || []);
        if (sRes.subjects[0].topics?.length > 0) {
          setSelectedTopicId(sRes.subjects[0].topics[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getStudySessions('?limit=15');
      setSessionsHistory(res.sessions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubjectChange = (subjId) => {
    setSelectedSubjectId(subjId);
    const found = subjects.find(s => s.id === parseInt(subjId));
    if (found && found.topics) {
      setTopics(found.topics);
      setSelectedTopicId(found.topics[0]?.id || '');
    } else {
      setTopics([]);
      setSelectedTopicId('');
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (timerMode === 'pomodoro') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsRunning(false);
              triggerCompletion(selectedMinutes);
              return 0;
            }
            return prev - 1;
          });
        } else {
          // Stopwatch
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode, selectedMinutes]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (timerMode === 'pomodoro') {
      setTimeLeft(selectedMinutes * 60);
    } else {
      setElapsedSeconds(0);
    }
  };

  const setPresetDuration = (mins) => {
    setIsRunning(false);
    setSelectedMinutes(mins);
    setTimeLeft(mins * 60);
  };

  const triggerCompletion = (studiedMinutes) => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
    setShowCompletionModal(true);
  };

  const logSessionManual = async () => {
    const duration = timerMode === 'pomodoro' 
      ? selectedMinutes 
      : Math.max(1, Math.round(elapsedSeconds / 60));

    try {
      await api.logStudySession({
        subject_id: selectedSubjectId ? parseInt(selectedSubjectId) : null,
        topic_id: selectedTopicId ? parseInt(selectedTopicId) : null,
        course_id: selectedCourseId ? parseInt(selectedCourseId) : null,
        duration_minutes: duration,
        mode: studyMode,
        focus_rating: focusRating,
        distraction_count: distractions,
        distraction_notes: distractionNotes,
        notes: notes
      });

      setShowCompletionModal(false);
      resetTimer();
      setDistractions(0);
      setDistractionNotes('');
      setNotes('');
      loadHistory();
    } catch (err) {
      alert("Failed to record study session: " + err.message);
    }
  };

  const formatDisplayTime = () => {
    const totalSecs = timerMode === 'pomodoro' ? timeLeft : elapsedSeconds;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress percentage for circular ring
  const totalSecsGoal = selectedMinutes * 60;
  const progressPct = timerMode === 'pomodoro'
    ? ((totalSecsGoal - timeLeft) / (totalSecsGoal || 1)) * 100
    : 100;

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
          Deep Focus Room
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Session tracking with focus metrics, distraction logging, and syllabus linkage.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Main Focus Room Timer Card */}
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', position: 'relative' }}>
          {/* Mode Switcher */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '28px'
          }}>
            <button
              onClick={() => { setTimerMode('pomodoro'); resetTimer(); }}
              className={`btn ${timerMode === 'pomodoro' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 16px', fontSize: '0.82rem', borderRadius: '8px' }}
            >
              Pomodoro
            </button>
            <button
              onClick={() => { setTimerMode('stopwatch'); resetTimer(); }}
              className={`btn ${timerMode === 'stopwatch' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 16px', fontSize: '0.82rem', borderRadius: '8px' }}
            >
              Stopwatch
            </button>
          </div>

          {/* Pomodoro Presets */}
          {timerMode === 'pomodoro' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[15, 25, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setPresetDuration(mins)}
                  style={{
                    background: selectedMinutes === mins ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedMinutes === mins ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    color: selectedMinutes === mins ? '#A5B4FC' : 'var(--text-muted)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}

          {/* Circular Countdown Display */}
          <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 28px' }}>
            <svg width="220" height="220" className="circular-progress">
              <circle
                cx="110"
                cy="110"
                r="95"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="110"
                cy="110"
                r="95"
                stroke="url(#timerGradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray={2 * Math.PI * 95}
                strokeDashoffset={2 * Math.PI * 95 * (1 - progressPct / 100)}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Time Display */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                fontSize: '3.2rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.04em',
                color: '#FFFFFF'
              }}>
                {formatDisplayTime()}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isRunning ? (timerMode === 'pomodoro' ? 'Focus In Progress' : 'Recording Session') : 'Paused'}
              </span>
            </div>
          </div>

          {/* Timer Action Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '24px' }}>
            <button
              onClick={toggleTimer}
              className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '12px 28px', fontSize: '1rem', borderRadius: '30px' }}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              onClick={resetTimer}
              className="btn btn-secondary"
              style={{ padding: '12px', borderRadius: '50%' }}
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={() => triggerCompletion(selectedMinutes)}
              className="btn btn-emerald"
              style={{ padding: '12px 20px', borderRadius: '30px' }}
              title="Finish & Log Now"
            >
              <CheckCircle size={18} /> Finish & Log
            </button>
          </div>

          {/* Real-time Distraction Logger */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                Distraction Tracker
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: distractions > 0 ? '#FDA4AF' : 'var(--text-main)' }}>
                {distractions} interruptions logged
              </span>
            </div>
            <button
              onClick={() => setDistractions(d => d + 1)}
              className="btn btn-danger"
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              <AlertOctagon size={14} /> +1 Distraction
            </button>
          </div>
        </div>

        {/* Study Context & Metadata Configuration Card */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <BookOpen size={18} color="#818CF8" />
            <h3 style={{ fontSize: '1.15rem' }}>Session Target & Context</h3>
          </div>

          {/* Subject Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="input-field"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* Topic Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Topic / Chapter
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="input-field"
            >
              <option value="">-- General Subject Study --</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.completion_pct}% complete)
                </option>
              ))}
            </select>
          </div>

          {/* Study Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Study Mode
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {STUDY_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setStudyMode(mode)}
                  style={{
                    background: studyMode === mode ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: studyMode === mode ? '#FFFFFF' : 'var(--text-muted)',
                    border: '1px solid ' + (studyMode === mode ? 'var(--primary)' : 'var(--border-subtle)'),
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Course Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Course (Optional)
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="input-field"
            >
              <option value="">-- None / Independent --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Completion & Feedback Modal */}
      {showCompletionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Sparkles size={36} color="#F59E0B" className="anim-pulse" style={{ margin: '0 auto 10px' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Great Focus Session!</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Rate your focus and record your notes for Study DNA analytics.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                Focus Quality Rating (1 to 5 Stars)
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFocusRating(star)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Star
                      size={28}
                      fill={star <= focusRating ? '#F59E0B' : 'transparent'}
                      color={star <= focusRating ? '#F59E0B' : '#475569'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {distractions > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Distraction Note ({distractions} recorded)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Phone notifications, noisy surroundings"
                  value={distractionNotes}
                  onChange={(e) => setDistractionNotes(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Session Key Takeaways / Notes
              </label>
              <textarea
                placeholder="What did you learn or accomplish in this block?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={logSessionManual}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                Save to Database & Log XP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session History Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Recent Focus Sessions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                <th style={{ padding: '10px 14px' }}>Date</th>
                <th style={{ padding: '10px 14px' }}>Subject</th>
                <th style={{ padding: '10px 14px' }}>Topic</th>
                <th style={{ padding: '10px 14px' }}>Mode</th>
                <th style={{ padding: '10px 14px' }}>Duration</th>
                <th style={{ padding: '10px 14px' }}>Focus</th>
                <th style={{ padding: '10px 14px' }}>Distractions</th>
              </tr>
            </thead>
            <tbody>
              {sessionsHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No sessions logged yet. Complete your first session above!
                  </td>
                </tr>
              ) : (
                sessionsHistory.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{s.date}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: s.subject_color || 'var(--primary)', marginRight: '8px' }} />
                      {s.subject_name || 'Self-study'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{s.topic_name || '—'}</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge badge-primary">{s.mode}</span></td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.duration_minutes}m</td>
                    <td style={{ padding: '12px 14px', color: '#F59E0B' }}>{'⭐'.repeat(s.focus_rating || 4)}</td>
                    <td style={{ padding: '12px 14px', color: s.distraction_count > 0 ? '#FDA4AF' : 'var(--text-dim)' }}>{s.distraction_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
