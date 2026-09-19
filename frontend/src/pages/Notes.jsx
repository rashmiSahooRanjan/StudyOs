import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Plus, Pin, Search, Tag, Trash2, BookOpen } from 'lucide-react';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Note Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject_id: '',
    content: '',
    resource_type: 'Note',
    tags: '',
    pinned: false
  });

  useEffect(() => {
    loadNotes();
  }, [searchQuery, selectedSubject]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      let params = [];
      if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`);
      if (selectedSubject) params.push(`subject_id=${selectedSubject}`);
      const qs = params.length > 0 ? `?${params.join('&')}` : '';

      const [nRes, sRes] = await Promise.all([api.getNotes(qs), api.getSubjects()]);
      setNotes(nRes.notes || []);
      setSubjects(sRes.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      await api.createNote({
        ...form,
        subject_id: form.subject_id ? parseInt(form.subject_id) : null
      });
      setShowAddModal(false);
      setForm({ title: '', subject_id: '', content: '', resource_type: 'Note', tags: '', pinned: false });
      loadNotes();
    } catch (err) {
      alert("Failed to create note: " + err.message);
    }
  };

  const handleDeleteNote = async (id) => {
    if (confirm("Delete this note?")) {
      await api.deleteNote(id);
      loadNotes();
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Notes & Knowledge Library
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Markdown knowledge base linked to subjects, syllabus topics, and exam cheat sheets.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Note / Resource
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search notes by keyword, theorem, formula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ padding: '8px 12px' }}
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="input-field"
          style={{ width: '200px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Notes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {notes.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-dim)' }}>No notes found. Create your first note or formula sheet above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span className="badge badge-primary">{note.resource_type}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {note.pinned && <Pin size={15} color="#F59E0B" />}
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '6px' }}>{note.title}</h3>
                {note.subject_name && (
                  <span style={{ fontSize: '0.75rem', color: '#A5B4FC', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                    {note.subject_name}
                  </span>
                )}

                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.7)',
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  marginBottom: '14px'
                }}>
                  {note.content}
                </div>
              </div>

              {note.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  {note.tags.map((t, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Create Knowledge Note</h3>
            <form onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Banker's Algorithm Safety Formula"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Subject</label>
                  <select
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">-- General --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Resource Type</label>
                  <select
                    value={form.resource_type}
                    onChange={(e) => setForm({ ...form, resource_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="Note">Note</option>
                    <option value="Formula">Formula</option>
                    <option value="Lecture">Lecture</option>
                    <option value="PDF">PDF</option>
                    <option value="Book">Book</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Content (Markdown Supported)</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Type notes, formulas, or key concepts..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. os,deadlock,gate,cheatsheet"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="pinnedCheck"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                />
                <label htmlFor="pinnedCheck" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Pin to top of knowledge base
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
