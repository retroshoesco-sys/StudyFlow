/**
 * StudyFlow - Vanilla JS Logic
 * No external dependencies required except Lucide icons via CDN
 */

// --- State Management ---
let state = {
    activeTab: 'dashboard',
    isTimerRunning: false,
    timerSeconds: 25 * 60,
    timerInterval: null,
    notes: JSON.parse(localStorage.getItem('sf_notes') || '[]'),
    isDeveloper: localStorage.getItem('sf_dev') === 'true',
    isCloaked: false,
    isStealth: false,
    secretBuffer: '',
    clickCount: 0
};

// --- DOM Elements ---
const elements = {
    loading: document.getElementById('loading-overlay'),
    mainView: document.getElementById('main-view'),
    stealthView: document.getElementById('stealth-view'),
    timerDisplay: document.getElementById('timer-display'),
    notesList: document.getElementById('notes-list'),
    noteTitle: document.getElementById('note-title'),
    noteContent: document.getElementById('note-content'),
    devBanner: document.getElementById('dev-banner'),
    adminTab: document.getElementById('admin-tab'),
    tabs: document.querySelectorAll('[data-tab]'),
    pages: document.querySelectorAll('.page')
};

// --- Initialization ---
function init() {
    // Hide loading screen immediately
    setTimeout(() => {
        elements.loading.classList.add('hidden');
    }, 500);

    renderNotes();
    updateTimerDisplay();
    updateUI();
    setupEventListeners();
}

// --- UI Updates ---
function updateUI() {
    // Update Tabs
    elements.tabs.forEach(btn => {
        if (btn.dataset.tab === state.activeTab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update Pages
    elements.pages.forEach(page => {
        if (page.id === `${state.activeTab}-page`) {
            page.classList.remove('hidden');
        } else {
            page.classList.add('hidden');
        }
    });

    // Dev Mode
    if (state.isDeveloper) {
        elements.devBanner.classList.remove('hidden');
        elements.adminTab.classList.remove('hidden');
    } else {
        elements.devBanner.classList.add('hidden');
        elements.adminTab.classList.add('hidden');
    }

    // Stealth Mode
    if (state.isStealth) {
        document.body.classList.add('stealth');
    } else {
        document.body.classList.remove('stealth');
    }

    // Tab Cloaking
    if (state.isCloaked || state.isStealth) {
        document.title = "Google Classroom";
    } else {
        document.title = "StudyFlow";
    }
}

// --- Timer Logic ---
function toggleTimer() {
    if (state.isTimerRunning) {
        clearInterval(state.timerInterval);
        state.isTimerRunning = false;
        document.getElementById('timer-toggle-btn').innerHTML = '<i data-lucide="play"></i>';
    } else {
        state.isTimerRunning = true;
        document.getElementById('timer-toggle-btn').innerHTML = '<i data-lucide="pause"></i>';
        state.timerInterval = setInterval(() => {
            state.timerSeconds--;
            if (state.timerSeconds <= 0) {
                clearInterval(state.timerInterval);
                state.isTimerRunning = false;
                alert("Session complete!");
            }
            updateTimerDisplay();
        }, 1000);
    }
    lucide.createIcons();
}

function resetTimer(seconds = 25 * 60) {
    clearInterval(state.timerInterval);
    state.isTimerRunning = false;
    state.timerSeconds = seconds;
    updateTimerDisplay();
    document.getElementById('timer-toggle-btn').innerHTML = '<i data-lucide="play"></i>';
    lucide.createIcons();
}

function updateTimerDisplay() {
    const m = Math.floor(state.timerSeconds / 60);
    const s = state.timerSeconds % 60;
    elements.timerDisplay.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Notes Logic ---
function saveNote() {
    const title = elements.noteTitle.value.trim();
    const content = elements.noteContent.value.trim();
    if (!title) return;

    const note = { id: Date.now(), title, content };
    state.notes.unshift(note);
    localStorage.setItem('sf_notes', JSON.stringify(state.notes));
    
    elements.noteTitle.value = '';
    elements.noteContent.value = '';
    renderNotes();
}

function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
    localStorage.setItem('sf_notes', JSON.stringify(state.notes));
    renderNotes();
}

function renderNotes() {
    if (!elements.notesList) return;
    elements.notesList.innerHTML = state.notes.map(note => `
        <div class="note-card">
            <button class="btn btn-ghost delete-btn" onclick="deleteNote(${note.id})">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
            <h4 class="font-black mb-2" style="font-size: 1.25rem;">${note.title}</h4>
            <p style="color: #71717a; font-size: 0.875rem; white-space: pre-wrap;">${note.content}</p>
        </div>
    `).join('');
    
    if (state.notes.length === 0) {
        elements.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #d4d4d8; border: 2px dashed #f4f4f5; border-radius: 2rem;">No notes yet.</div>';
    }
    lucide.createIcons();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Navigation
    elements.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeTab = btn.dataset.tab;
            updateUI();
        });
    });

    // Secret Code Detection
    window.addEventListener('keydown', (e) => {
        if (e.key === '\\') {
            window.location.href = 'https://classroom.google.com';
        }
        
        if (e.key.length === 1) {
            state.secretBuffer = (state.secretBuffer + e.key.toLowerCase()).slice(-20);
            if (state.secretBuffer.includes('ayansatishmadethis')) {
                unlockDevMode();
            }
        }
    });

    // Footer Click Activation
    document.getElementById('footer-tamil').addEventListener('click', () => {
        state.clickCount++;
        if (state.clickCount >= 5) {
            unlockDevMode();
            state.clickCount = 0;
        }
    });
}

function unlockDevMode() {
    state.isDeveloper = true;
    state.activeTab = 'admin';
    localStorage.setItem('sf_dev', 'true');
    alert('Developer Mode Unlocked!');
    updateUI();
}

function toggleCloak() {
    state.isCloaked = !state.isCloaked;
    updateUI();
    const btn = document.getElementById('cloak-btn');
    btn.style.color = state.isCloaked ? 'var(--emerald-600)' : 'var(--zinc-400)';
}

function toggleStealth() {
    state.isStealth = !state.isStealth;
    updateUI();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
window.deleteNote = deleteNote; // Expose to global for onclick
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.saveNote = saveNote;
window.toggleCloak = toggleCloak;
window.toggleStealth = toggleStealth;
