/**
 * API Client — Centralised HTTP calls to the FastAPI backend.
 *
 * All authenticated requests include the JWT stored in localStorage.
 */

const API_BASE = '';  // same origin — served by FastAPI

/* ── Helper: get stored token ────────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('access_token');
}

function setToken(token) {
  localStorage.setItem('access_token', token);
}

function clearToken() {
  localStorage.removeItem('access_token');
}

function isAuthenticated() {
  return !!getToken();
}

/* ── Helper: build auth header ───────────────────────────────────────────── */
function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  };
}

/* ── Auth API ────────────────────────────────────────────────────────────── */

async function apiRegister(email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Registration failed');
  return data;
}

async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  return data;
}

/* ── Resume API ──────────────────────────────────────────────────────────── */

async function apiUploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/resume/upload`, {
    method: 'POST',
    headers: authHeaders(),  // no Content-Type — FormData sets it
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.href = '/static/index.html';
      return;
    }
    throw new Error(data.detail || 'Upload failed');
  }
  return data;
}

async function apiGetHistory() {
  const res = await fetch(`${API_BASE}/resume/history`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.href = '/static/index.html';
      return;
    }
    throw new Error(data.detail || 'Failed to load history');
  }
  return data;
}

async function apiGetResumeDetail(resumeId) {
  const res = await fetch(`${API_BASE}/resume/${resumeId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.href = '/static/index.html';
      return;
    }
    throw new Error(data.detail || 'Failed to load resume');
  }
  return data;
}
