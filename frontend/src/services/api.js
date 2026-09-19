const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';


function getHeaders() {
  const token = localStorage.getItem('studyos_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        // Clear expired or invalid token
        localStorage.removeItem('studyos_token');
        localStorage.removeItem('studyos_user');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (identifier, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  register: (name, email, password, target_daily_hours = 6.0) => 
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, target_daily_hours }) }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  cloneStarterTemplate: () => request('/auth/clone-starter-template', { method: 'POST' }),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Study & Timer
  getStudySessions: (params = '') => request(`/study-sessions${params}`),
  logStudySession: (data) => request('/study-sessions', { method: 'POST', body: JSON.stringify(data) }),
  deleteStudySession: (id) => request(`/study-sessions/${id}`, { method: 'DELETE' }),

  // Courses & Syllabus
  getCourses: () => request('/courses'),
  createCourse: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  getSubjects: (params = '') => request(`/subjects${params}`),
  createSubject: (data) => request('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),
  createTopic: (data) => request('/topics', { method: 'POST', body: JSON.stringify(data) }),
  updateTopicStatus: (id, data) => request(`/topics/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),

  // Exams
  getExams: () => request('/exams'),
  createExam: (data) => request('/exams', { method: 'POST', body: JSON.stringify(data) }),
  getExamSyllabus: (id) => request(`/exams/${id}/syllabus`),
  deleteExam: (id) => request(`/exams/${id}`, { method: 'DELETE' }),

  // Reading Tracker
  getReading: () => request('/reading'),
  addReading: (data) => request('/reading', { method: 'POST', body: JSON.stringify(data) }),
  logReadingSession: (id, data) => request(`/reading/${id}/log-session`, { method: 'POST', body: JSON.stringify(data) }),
  deleteReading: (id) => request(`/reading/${id}`, { method: 'DELETE' }),

  // Goals & Tasks
  getGoals: () => request('/goals'),
  createGoal: (data) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
  getTasks: (params = '') => request(`/tasks${params}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  rolloverTasks: () => request('/tasks/rollover', { method: 'POST' }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Questions & PYQs
  getQuestions: (params = '') => request(`/questions${params}`),
  createQuestion: (data) => request('/questions', { method: 'POST', body: JSON.stringify(data) }),
  attemptQuestion: (id, data) => request(`/questions/${id}/attempt`, { method: 'POST', body: JSON.stringify(data) }),

  // Mock Tests
  getMocks: (params = '') => request(`/mocks${params}`),
  createMock: (data) => request('/mocks', { method: 'POST', body: JSON.stringify(data) }),
  submitMockAttempt: (id, data) => request(`/mocks/${id}/attempt`, { method: 'POST', body: JSON.stringify(data) }),
  getMockHistory: () => request('/mocks/history'),

  // Spaced Revision & Flashcards
  getRevisions: () => request('/revisions/today'),
  completeRevision: (id, data) => request(`/revisions/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  getFlashcards: (params = '') => request(`/flashcards${params}`),
  createFlashcard: (data) => request('/flashcards', { method: 'POST', body: JSON.stringify(data) }),
  reviewFlashcard: (id, data) => request(`/flashcards/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),

  // Mistake Book
  getMistakes: (params = '') => request(`/mistakes${params}`),
  createMistake: (data) => request('/mistakes', { method: 'POST', body: JSON.stringify(data) }),
  updateMistake: (id, data) => request(`/mistakes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reattemptMistake: (id, data) => request(`/mistakes/${id}/reattempt`, { method: 'POST', body: JSON.stringify(data) }),
  deleteMistake: (id) => request(`/mistakes/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes: (params = '') => request(`/notes${params}`),
  createNote: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  // Analytics & Exports
  getStudyDna: () => request('/analytics/study-dna'),
  getHeatmap: (days = 90) => request(`/analytics/heatmap?days=${days}`),
  getSubjectBalance: () => request('/analytics/subjects'),
  getDailyTrend: () => request('/analytics/daily'),
  getAchievements: () => request('/achievements'),
  getBackupData: () => request('/export/backup'),
  getExportCsvUrl: () => `${API_BASE}/export/sessions-csv`,

  // Admin
  getAdminUsers: () => request('/admin/users'),
  getAdminStats: () => request('/admin/system-stats'),
  deleteAdminUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  toggleAdminRole: (id) => request(`/admin/users/${id}/toggle-admin`, { method: 'PUT' }),
  resetAdminUserPassword: (id, password) => 
    request(`/admin/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) })
};
