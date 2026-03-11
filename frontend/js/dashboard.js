/**
 * Dashboard Page Controller
 *
 * Handles file upload, history list, detail modal, and logout.
 */

// ── Auth guard ─────────────────────────────────────────────────────────────
if (!isAuthenticated()) {
    window.location.href = '/static/index.html';
}

// ── State ──────────────────────────────────────────────────────────────────
let selectedFile = null;

// ── DOM references ─────────────────────────────────────────────────────────
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const browseLink = document.getElementById('browseLink');
const filePreview = document.getElementById('filePreview');
const fileNameEl = document.getElementById('fileName');
const fileSizeEl = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const uploadBtn = document.getElementById('uploadBtn');
const progressArea = document.getElementById('progressArea');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const uploadAlert = document.getElementById('uploadAlert');
const historyList = document.getElementById('historyList');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const detailModal = document.getElementById('detailModal');
const modalFileName = document.getElementById('modalFileName');
const modalBody = document.getElementById('modalBody');

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initUserInfo();
    loadHistory();
    setupDragDrop();
    setupHistoryAccordion();
});

function initUserInfo() {
    // Decode email from JWT (payload is base64 in part[1])
    try {
        const token = getToken();
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.sub || 'User';
        document.getElementById('userEmail').textContent = email;
        document.getElementById('userAvatar').textContent = email.charAt(0).toUpperCase();
    } catch {
        document.getElementById('userEmail').textContent = 'User';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MOBILE: HISTORY ACCORDION
// ═══════════════════════════════════════════════════════════════════════════

function setupHistoryAccordion() {
    const toggleBtn = document.getElementById('historyAccordionToggle');
    const content = document.getElementById('historyAccordionContent');
    if (!toggleBtn || !content) return;

    const mql = window.matchMedia('(max-width: 900px)');

    const setExpanded = (expanded) => {
        toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        content.classList.toggle('collapsed', !expanded);
    };

    // Default: collapsed on mobile, expanded on desktop
    setExpanded(!mql.matches);

    toggleBtn.addEventListener('click', () => {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        setExpanded(!isExpanded);
    });

    // If user resizes window, reset to sensible default
    mql.addEventListener('change', (e) => {
        setExpanded(!e.matches);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
//  FILE UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

function setupDragDrop() {
    // Browse click
    browseLink.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('click', () => fileInput.click());

    // File selected via input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) selectFile(e.target.files[0]);
    });

    // Drag events
    uploadZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', (e) => {
        // Only remove when actually leaving the dropzone, not moving between children
        if (!uploadZone.contains(e.relatedTarget)) {
            uploadZone.classList.remove('drag-over');
        }
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) selectFile(e.dataTransfer.files[0]);
    });

    // Remove file
    removeFileBtn.addEventListener('click', clearFile);
}

function selectFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showUploadAlert('Please select a PDF file.', 'error');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showUploadAlert('File size must be under 10 MB.', 'error');
        return;
    }

    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatFileSize(file.size);
    filePreview.classList.remove('hidden');
    uploadZone.classList.add('hidden');
    hideUploadAlert();
}

function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    filePreview.classList.add('hidden');
    uploadZone.classList.remove('hidden');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Upload handler ─────────────────────────────────────────────────────────
async function handleUpload() {
    if (!selectedFile) return;

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<div class="spinner"></div><span>Analysing...</span>';
    progressArea.classList.remove('hidden');

    // Simulate progress (the actual upload is a single POST, but analysis takes time)
    let progress = 0;
    const stages = [
        { pct: 20, text: '<i class="fa-solid fa-upload"></i> Uploading resume...' },
        { pct: 45, text: '<i class="fa-solid fa-file-pdf"></i> Extracting text from PDF...' },
        { pct: 70, text: '<i class="fa-solid fa-robot"></i> AI is analysing your resume...' },
        { pct: 90, text: '<i class="fa-solid fa-magic"></i> Generating insights...' },
    ];

    let stageIdx = 0;
    const progressInterval = setInterval(() => {
        if (stageIdx < stages.length) {
            progress = stages[stageIdx].pct;
            progressBar.style.width = progress + '%';
            progressText.innerHTML = stages[stageIdx].text;
            stageIdx++;
        }
    }, 1200);

    try {
        const data = await apiUploadResume(selectedFile);

        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressText.innerHTML = '<i class="fa-solid fa-check-circle"></i> Analysis complete!';

        // Show result inline
        renderAnalysis(data, resultContent);
        resultSection.classList.remove('hidden');
        // Smooth reveal animation
        resultSection.classList.remove('fade-in-up');
        // Force reflow so animation re-triggers
        void resultSection.offsetWidth;
        resultSection.classList.add('fade-in-up');

        // Refresh history (this will also update summary header)
        await loadHistory();

        // Clean up after short delay
        setTimeout(() => {
            clearFile();
            progressArea.classList.add('hidden');
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fa-solid fa-rocket"></i><span>Analyse Resume</span>';
        }, 1500);

    } catch (err) {
        clearInterval(progressInterval);
        progressArea.classList.add('hidden');
        showUploadAlert(err.message, 'error');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fa-solid fa-rocket"></i><span>Analyse Resume</span>';
    }
}

// ── Alerts ─────────────────────────────────────────────────────────────────
function showUploadAlert(msg, type) {
    uploadAlert.className = `alert alert-${type} mt-md`;
    uploadAlert.textContent = msg;
}

function hideUploadAlert() {
    uploadAlert.className = 'hidden mt-md';
}

// ═══════════════════════════════════════════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════════════════════════════════════════

async function loadHistory() {
    try {
        const resumes = await apiGetHistory();

        // Update summary header with last resume
        updateSummaryHeader(resumes);

        if (!resumes || resumes.length === 0) {
            historyList.innerHTML = `
        <div class="history-empty">
          <div class="empty-icon">
            <i class="fa-solid fa-inbox"></i>
          </div>
          <h3>No resumes yet</h3>
          <p>Upload your first resume to get AI-powered insights!</p>
          <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <span>Upload Resume</span>
          </button>
        </div>`;
            return;
        }

        historyList.innerHTML = resumes.map(r => {
            const score = r.score != null ? Math.round(r.score) : null;
            const scoreLevel = score != null ? scoreClass(score) : null;
            const scoreLabel = scoreLevel === 'high' ? 'High' : scoreLevel === 'medium' ? 'Medium' : scoreLevel === 'low' ? 'Low' : '';
            
            return `
      <div class="history-item" onclick="openDetail(${r.id})">
        <span class="file-icon"><i class="fa-solid fa-file-lines"></i></span>
        <div class="item-info">
          <div class="item-name" title="${escapeHtml(r.filename)}">${escapeHtml(r.filename)}</div>
          <div class="item-date">${formatDate(r.created_at)}</div>
        </div>
        <div class="item-score-group">
          ${score != null ? `<div class="score-badge ${scoreClass(score)}">${score}</div>` : ''}
          ${scoreLabel ? `<span class="score-pill ${scoreLevel}">${scoreLabel}</span>` : ''}
        </div>
      </div>
    `;
        }).join('');

    } catch (err) {
        historyList.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
    }
}

// ── Update Summary Header ─────────────────────────────────────────────────
function updateSummaryHeader(resumes) {
    const summaryTitle = document.getElementById('summaryTitle');
    const summarySubtitle = document.getElementById('summarySubtitle');
    const summaryScore = document.getElementById('summaryScore');
    if (!summaryTitle || !summarySubtitle || !summaryScore) {
        // If the summary header is not present (defensive guard), skip.
        return;
    }
    const summaryScoreValue = summaryScore.querySelector('.summary-score-value');

    if (!resumes || resumes.length === 0) {
        summaryTitle.textContent = 'No resume analysed yet';
        summarySubtitle.textContent = 'Upload your first resume to get started';
        summaryScoreValue.textContent = '--';
        summaryScore.className = 'summary-score';
        return;
    }

    // Get the most recent resume (assume array is sorted oldest -> newest)
    const lastResume = resumes[resumes.length - 1];
    const score = lastResume.score != null ? Math.round(lastResume.score) : null;

    if (score != null) {
        summaryTitle.textContent = `${score}/100 - ${getScoreDescription(score)}`;
        summarySubtitle.textContent = lastResume.filename || 'Resume Analysis';
        summaryScoreValue.textContent = score;
        summaryScore.className = `summary-score ${scoreClass(score)}`;
    } else {
        summaryTitle.textContent = lastResume.filename || 'Resume';
        summarySubtitle.textContent = 'Analysis in progress...';
        summaryScoreValue.textContent = '--';
        summaryScore.className = 'summary-score';
    }
}

function getScoreDescription(score) {
    if (score >= 85) return 'Excellent Profile';
    if (score >= 70) return 'Strong Profile';
    if (score >= 50) return 'Good Profile';
    if (score >= 30) return 'Needs Improvement';
    return 'Requires Work';
}

// ═══════════════════════════════════════════════════════════════════════════
//  DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════

async function openDetail(resumeId) {
    detailModal.classList.remove('hidden');
    modalBody.innerHTML = `
    <div class="loading-overlay">
      <div class="spinner spinner-lg"></div>
      <div class="loading-text">Loading analysis...</div>
    </div>`;
    modalFileName.textContent = 'Loading...';

    try {
        const data = await apiGetResumeDetail(resumeId);
        modalFileName.textContent = data.filename;
        renderAnalysis(data, modalBody);
    } catch (err) {
        modalBody.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
}

function closeModal() {
    detailModal.classList.add('hidden');
}

// Close modal on overlay click
detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ═══════════════════════════════════════════════════════════════════════════
//  RENDER ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

function renderAnalysis(data, container) {
    const score = data.score != null ? Math.round(data.score) : null;
    const circumference = 2 * Math.PI * 60; // radius=60
    const offset = score != null ? circumference - (score / 100) * circumference : circumference;

    container.innerHTML = `
    ${score != null ? `
    <div class="score-ring-container">
      <div class="score-ring">
        <svg viewBox="0 0 140 140">
          <circle class="ring-bg" cx="70" cy="70" r="60"/>
          <circle class="ring-fill ${scoreClass(score)}" cx="70" cy="70" r="60"
                  style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}"/>
        </svg>
        <div class="score-value">
          <div class="score-number">${score}</div>
          <div class="score-label">out of 100</div>
        </div>
      </div>
      <div class="score-description">${scoreDescription(score)}</div>
    </div>` : ''}

    <div class="analysis-section">
      <div class="analysis-section-header">
        <div class="section-icon skills">💡</div>
        <h3>Key Skills</h3>
      </div>
      <div class="analysis-section-content">${escapeHtml(data.skill_summary || 'No data')}</div>
    </div>

    <div class="analysis-section">
      <div class="analysis-section-header">
        <div class="section-icon strengths">💪</div>
        <h3>Strengths</h3>
      </div>
      <div class="analysis-section-content">${escapeHtml(data.strengths || 'No data')}</div>
    </div>

    <div class="analysis-section">
      <div class="analysis-section-header">
        <div class="section-icon weaknesses">⚠️</div>
        <h3>Weaknesses</h3>
      </div>
      <div class="analysis-section-content">${escapeHtml(data.weaknesses || 'No data')}</div>
    </div>

    <div class="analysis-section">
      <div class="analysis-section-header">
        <div class="section-icon improvements">🚀</div>
        <h3>Improvement Suggestions</h3>
      </div>
      <div class="analysis-section-content">${escapeHtml(data.improvements || 'No data')}</div>
    </div>
  `;

    // Animate the score ring after render
    if (score != null) {
        requestAnimationFrame(() => {
            const ring = container.querySelector('.ring-fill');
            if (ring) ring.style.strokeDashoffset = offset;
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function scoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

function scoreDescription(score) {
    if (score >= 85) return '🌟 Excellent resume!';
    if (score >= 70) return '👍 Good resume — minor improvements possible';
    if (score >= 50) return '📝 Average — room for improvement';
    if (score >= 30) return '⚡ Needs significant work';
    return '🔧 Major revisions recommended';
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Logout ─────────────────────────────────────────────────────────────────
function handleLogout() {
    clearToken();
    window.location.href = '/static/index.html';
}
