import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { BookMarked, Plus, BookOpen, Clock, FileText, CheckCircle2, Trash2 } from 'lucide-react';

export default function Reading() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Log session modal
  const [activeItem, setActiveItem] = useState(null);
  const [pagesRead, setPagesRead] = useState(15);
  const [durationMins, setDurationMins] = useState(30);

  // Add Item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    type: 'Book',
    total_pages: 350,
    current_page: 0,
    cover_color: '#3B82F6'
  });

  useEffect(() => {
    loadReading();
  }, []);

  const loadReading = async () => {
    try {
      setLoading(true);
      const res = await api.getReading();
      setItems(res.items || []);
      setStats(res.stats || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogReadingSession = async (e) => {
    e.preventDefault();
    if (!activeItem) return;

    try {
      await api.logReadingSession(activeItem.id, {
        pages_read: parseInt(pagesRead),
        duration_minutes: parseFloat(durationMins)
      });
      setActiveItem(null);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
      loadReading();
    } catch (err) {
      alert("Failed to log session: " + err.message);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.addReading(form);
      setShowAddModal(false);
      setForm({ title: '', author: '', type: 'Book', total_pages: 350, current_page: 0, cover_color: '#3B82F6' });
      loadReading();
    } catch (err) {
      alert("Failed to add reading item: " + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm("Remove this reading item?")) {
      await api.deleteReading(id);
      loadReading();
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
            Reading Velocity & Tracker
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track textbooks, research papers, and technical PDFs with page reading speed analytics.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Book / Paper
        </button>
      </div>

      {/* Stats Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tracked Books</span>
          <h3 style={{ fontSize: '1.6rem', color: '#FFFFFF' }}>{stats.total_books_tracked || 0}</h3>
        </div>
        <div className="glass-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pages Read</span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--emerald)' }}>{stats.total_pages_read || 0}</h3>
        </div>
        <div className="glass-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Finished Books</span>
          <h3 style={{ fontSize: '1.6rem', color: '#A5B4FC' }}>{stats.completed_books || 0}</h3>
        </div>
      </div>

      {/* Bookshelf Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
        {items.map((item) => (
          <div key={item.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge badge-primary">{item.type}</span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '4px', lineHeight: 1.3 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                by {item.author || "Unknown Author"}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>
                    Page {item.current_page} of {item.total_pages}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                    {item.progress_pct}%
                  </span>
                </div>
                <ProgressBar value={item.progress_pct} color={item.cover_color} height={8} />
              </div>

              {item.reading_speed_pph > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#A5B4FC', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <Clock size={14} /> Average Reading Velocity: {item.reading_speed_pph} pages/hr
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <button
                onClick={() => { setActiveItem(item); setPagesRead(15); setDurationMins(30); }}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <BookOpen size={14} /> Log Pages Read
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Log Pages Modal */}
      {activeItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Log Reading Session</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              {activeItem.title} (Currently on page {activeItem.current_page})
            </p>

            <form onSubmit={handleLogReadingSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Pages Read Today</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activeItem.total_pages - activeItem.current_page}
                  value={pagesRead}
                  onChange={(e) => setPagesRead(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Reading Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min="5"
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setActiveItem(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Log Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reading Item Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Add Reading Resource</h3>
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating System Concepts"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Author</label>
                <input
                  type="text"
                  placeholder="e.g. Silberschatz, Galvin"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="input-field"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="Book">Book</option>
                    <option value="PDF">PDF</option>
                    <option value="Paper">Paper</option>
                    <option value="Article">Article</option>
                    <option value="Notes">Notes</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>Total Pages</label>
                  <input
                    type="number"
                    required
                    value={form.total_pages}
                    onChange={(e) => setForm({ ...form, total_pages: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Add to Bookshelf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
