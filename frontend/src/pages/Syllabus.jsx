import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import {
  FolderTree,
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle,
  Clock,
  Circle,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function Syllabus() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [syllabusData, setSyllabusData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Expanded nodes state
  const [expandedSubjects, setExpandedSubjects] = useState({});

  // Add Topic state
  const [showAddModal, setShowAddModal] = useState(false);
  const [topicForm, setTopicForm] = useState({ subject_id: '', name: '', priority: 'medium', estimated_hours: 4.0 });

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await api.getExams();
      setExams(res.exams || []);
      if (res.exams?.length > 0) {
        setSelectedExamId(res.exams[0].id);
        loadSyllabus(res.exams[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSyllabus = async (examId) => {
    try {
      const res = await api.getExamSyllabus(examId);
      setSyllabusData(res);
      // Auto expand all subjects
      const exp = {};
      res.syllabus?.forEach(s => { exp[s.id] = true; });
      setExpandedSubjects(exp);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExamChange = (id) => {
    setSelectedExamId(id);
    loadSyllabus(id);
  };

  const toggleSubject = (subId) => {
    setExpandedSubjects(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const handleUpdateTopicProgress = async (topicId, currentPct) => {
    const nextPct = currentPct >= 100 ? 0 : (currentPct === 0 ? 50 : 100);
    try {
      await api.updateTopicStatus(topicId, { completion_pct: nextPct });
      loadSyllabus(selectedExamId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      await api.createTopic({
        ...topicForm,
        subject_id: parseInt(topicForm.subject_id),
        completion_pct: 0
      });
      setShowAddModal(false);
      setTopicForm({ subject_id: '', name: '', priority: 'medium', estimated_hours: 4.0 });
      loadSyllabus(selectedExamId);
    } catch (err) {
      alert("Failed to add topic: " + err.message);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Hierarchical Syllabus Tracker
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Exam → Subject → Topic → Subtopic progress calculated directly from topic mastery states.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="input-field"
            style={{ width: '220px' }}
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Topic
          </button>
        </div>
      </div>

      {/* Overall Progress Banner */}
      {syllabusData && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
              {syllabusData.exam_name}
            </span>
            <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>
              Overall Syllabus Readiness: {syllabusData.overall_progress}%
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              ⏳ {syllabusData.days_remaining} days remaining until exam
            </span>
          </div>

          <div style={{ width: '280px' }}>
            <ProgressBar
              value={syllabusData.overall_progress}
              color="linear-gradient(90deg, #6366F1 0%, #10B981 100%)"
              height={10}
            />
          </div>
        </div>
      )}

      {/* Hierarchical Tree of Subjects & Topics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {syllabusData?.syllabus?.map((sub) => {
          const isExpanded = expandedSubjects[sub.id];
          return (
            <div key={sub.id} className="glass-card" style={{ overflow: 'hidden' }}>
              {/* Subject Header Row */}
              <div
                onClick={() => toggleSubject(sub.id)}
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: sub.color }} />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{sub.name}</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Code: {sub.code} • Priority: {sub.priority.toUpperCase()} • Weight: {sub.weightage}x
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '140px' }}>
                    <ProgressBar value={sub.progress} color={sub.color} height={6} />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF', minWidth: '42px', textAlign: 'right' }}>
                    {sub.progress}%
                  </span>
                </div>
              </div>

              {/* Topics Tree Rows */}
              {isExpanded && (
                <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sub.topics?.length === 0 ? (
                    <p style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      No topics added under this subject yet.
                    </p>
                  ) : (
                    sub.topics?.map((topic) => (
                      <div
                        key={topic.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            onClick={() => handleUpdateTopicProgress(topic.id, topic.completion_pct)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Click to toggle progress (0% -> 50% -> 100%)"
                          >
                            {topic.completion_pct >= 100 ? (
                              <CheckCircle size={20} color="var(--emerald)" />
                            ) : topic.completion_pct > 0 ? (
                              <Clock size={20} color="var(--amber)" />
                            ) : (
                              <Circle size={20} color="var(--text-dim)" />
                            )}
                          </button>
                          <div>
                            <span style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: topic.completion_pct >= 100 ? '#A5B4FC' : 'var(--text-main)',
                              textDecoration: topic.completion_pct >= 100 ? 'line-through' : 'none'
                            }}>
                              {topic.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <span className={`badge ${topic.priority === 'high' ? 'badge-rose' : 'badge-primary'}`} style={{ fontSize: '0.62rem' }}>
                                {topic.priority}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                Est. {topic.estimated_hours} hrs
                              </span>
                              {topic.completion_pct >= 100 && (
                                <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                                  Mastered
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Slider / direct progress button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <button
                            onClick={() => handleUpdateTopicProgress(topic.id, topic.completion_pct)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                          >
                            {topic.completion_pct}% Progress
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Topic Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Add Topic to Syllabus</h3>
            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Target Subject</label>
                <select
                  required
                  value={topicForm.subject_id}
                  onChange={(e) => setTopicForm({ ...topicForm, subject_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Select Subject --</option>
                  {syllabusData?.syllabus?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Topic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deadlock Avoidance & Banker's Algorithm"
                  value={topicForm.name}
                  onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Priority</label>
                  <select
                    value={topicForm.priority}
                    onChange={(e) => setTopicForm({ ...topicForm, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={topicForm.estimated_hours}
                    onChange={(e) => setTopicForm({ ...topicForm, estimated_hours: parseFloat(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
