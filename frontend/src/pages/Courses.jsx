import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { BookOpen, Plus, FolderPlus, Layers, ArrowRight, CheckCircle, Trash2 } from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);

  // Forms
  const [courseForm, setCourseForm] = useState({ name: '', description: '', target_date: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', course_id: '', color: '#6366F1', priority: 'medium', weightage: 1.0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([api.getCourses(), api.getSubjects()]);
      setCourses(cRes.courses || []);
      setSubjects(sRes.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.createCourse(courseForm);
      setShowAddCourse(false);
      setCourseForm({ name: '', description: '', target_date: '' });
      loadData();
    } catch (err) {
      alert("Failed to create course: " + err.message);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.createSubject(subjectForm);
      setShowAddSubject(false);
      setSubjectForm({ name: '', code: '', course_id: '', color: '#6366F1', priority: 'medium', weightage: 1.0 });
      loadData();
    } catch (err) {
      alert("Failed to create subject: " + err.message);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (confirm("Are you sure you want to delete this course?")) {
      await api.deleteCourse(id);
      loadData();
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Courses & Subject Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage academic programs, subjects, hierarchical topics, and syllabus completion.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAddSubject(true)} className="btn btn-secondary">
            <Plus size={16} /> Add Subject
          </button>
          <button onClick={() => setShowAddCourse(true)} className="btn btn-primary">
            <FolderPlus size={16} /> New Course
          </button>
        </div>
      </div>

      {/* Courses Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {courses.map((course) => (
          <div key={course.id} className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '6px' }}>Academic Course</span>
                <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF' }}>{course.name}</h3>
              </div>
              <button
                onClick={() => handleDeleteCourse(course.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                title="Delete Course"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px', minHeight: '38px' }}>
              {course.description || "Core degree syllabus and foundational subjects."}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
              <span>Subjects: {course.subject_count}</span>
              <span>Target: {course.target_date || "Ongoing"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Subjects Grid */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px' }}>
          Enrolled Subjects & Mastery
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {subjects.map((sub) => (
            <div key={sub.id} className="glass-card glass-card-interactive" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `rgba(${parseInt(sub.color.slice(1,3),16)}, ${parseInt(sub.color.slice(3,5),16)}, ${parseInt(sub.color.slice(5,7),16)}, 0.18)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen size={18} color={sub.color} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{sub.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{sub.code}</span>
                  </div>
                </div>
                <span className={`badge ${sub.priority === 'high' ? 'badge-rose' : 'badge-primary'}`}>
                  {sub.priority}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Syllabus Mastery</span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{sub.progress}%</span>
                </div>
                <ProgressBar value={sub.progress} color={sub.color} height={8} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  {sub.topic_count} topics recorded
                </span>
                <Link to="/syllabus" style={{ fontSize: '0.82rem', color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Explore Syllabus <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Create Academic Course</h3>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech Computer Science"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Description</label>
                <textarea
                  placeholder="Degree or certification overview..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Target Completion Date</label>
                <input
                  type="date"
                  value={courseForm.target_date}
                  onChange={(e) => setCourseForm({ ...courseForm, target_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddCourse(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Add Subject</h3>
            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS-OS"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Course</label>
                <select
                  value={subjectForm.course_id}
                  onChange={(e) => setSubjectForm({ ...subjectForm, course_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Color Accent</label>
                <input
                  type="color"
                  value={subjectForm.color}
                  onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddSubject(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
