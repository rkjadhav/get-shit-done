// ===== GLOBAL VARIABLES AND STATE =====
let tasks = [];
let currentDate = new Date();
let userSettings = {
    darkMode: true,
    defaultTimerDuration: 15,
    timerSound: true
};
let userStats = {
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    totalTasksCompleted: 0,
    totalFocusTime: 0
};
let userJournal = {};
let activityLog = {};
let achievements = [
    { id: 'focus_wizard', name: 'Focus Wizard', icon: 'fa-wand-magic-sparkles', description: 'Complete 5 micro tasks in a day', unlocked: false },
    { id: 'consistency_goblin', name: 'Consistency Goblin', icon: 'fa-calendar-check', description: '3 days streak', unlocked: false },
    { id: 'task_master', name: 'Task Master', icon: 'fa-trophy', description: 'Complete 20 tasks total', unlocked: false },
    { id: 'time_lord', name: 'Time Lord', icon: 'fa-hourglass-half', description: 'Spend 2 hours in focus mode', unlocked: false },
    { id: 'completion_king', name: 'Completion King', icon: 'fa-crown', description: 'Complete all tasks in a day', unlocked: false }
];

// Timer variables
let timerInterval;
let timerDuration = 15 * 60; // Default: 15 minutes in seconds
let timerRemaining = timerDuration;
let timerRunning = false;
let currentTask = null;
let currentMicroTask = null;

// ===== DOM ELEMENTS =====
// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Task Deck
const tasksContainer = document.getElementById('tasksContainer');
const emptyTaskState = document.getElementById('emptyTaskState');
const addTaskBtn = document.getElementById('addTaskBtn');

// Task Modal
const taskModal = document.getElementById('taskModal');
const taskModalTitle = document.getElementById('taskModalTitle');
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskTagSelect = document.getElementById('taskTag');
const taskEffortSelect = document.getElementById('taskEffort');
const microTasksContainer = document.getElementById('microTasksContainer');
const addMicroTaskBtn = document.getElementById('addMicroTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const saveTaskBtn = document.getElementById('saveTaskBtn');

// Spin Wheel
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const emptySpinState = document.getElementById('emptySpinState');

// Focus Timer
const focusSection = document.getElementById('focusSection');
const currentTaskTitle = document.getElementById('currentTaskTitle');
const currentTaskTag = document.getElementById('currentTaskTag');
const timerText = document.getElementById('timerText');
const timerFill = document.getElementById('timerFill');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const timerDurationSelect = document.getElementById('timerDuration');

// Progress
const dopamineFill = document.getElementById('dopamineFill');
const tasksCompletedEl = document.getElementById('tasksCompleted');
const totalTasksEl = document.getElementById('totalTasks');
const xpEarnedEl = document.getElementById('xpEarned');
const userLevelEl = document.getElementById('userLevel');
const currentStreakEl = document.getElementById('currentStreak');

// Activity Tab
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const currentDateEl = document.getElementById('currentDate');
const logEntries = document.getElementById('logEntries');
const emojiBtns = document.querySelectorAll('.emoji-btn');
const journalText = document.getElementById('journalText');
const saveJournalBtn = document.getElementById('saveJournalBtn');

// Dashboard Tab
const dateRangeSelect = document.getElementById('dateRangeSelect');
const totalTasksCompletedEl = document.getElementById('totalTasksCompleted');
const statsStreakEl = document.getElementById('statsStreak');
const longestStreakEl = document.getElementById('longestStreak');
const totalFocusTimeEl = document.getElementById('totalFocusTime');
const achievementsGrid = document.getElementById('achievementsGrid');

// Settings Tab
const defaultTimerDurationSelect = document.getElementById('defaultTimerDuration');
const timerSoundToggle = document.getElementById('timerSoundToggle');
const exportDataBtn = document.getElementById('exportDataBtn');
const clearDataBtn = document.getElementById('clearDataBtn');

// Modals
const celebrationModal = document.getElementById('celebrationModal');
const celebrationMessage = document.getElementById('celebrationMessage');
const earnedXPEl = document.getElementById('earnedXP');
const closeCelebrationBtn = document.getElementById('closeCelebrationBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmBtn = document.getElementById('confirmBtn');
const toastContainer = document.getElementById('toastContainer');

// Charts
let completionChart;
let categoryChart;

// DOM Elements - Add theme toggle
const themeToggle = document.getElementById('themeToggle');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeUI();
    setupEventListeners();
    updateTaskDisplay();
    updateProgressBar();
    updateActivityLog();
    updateAchievements();
    
    // Initialize charts if we're on the dashboard tab
    if (document.querySelector('#dashboard').classList.contains('active')) {
        initializeCharts();
    }
});

// ===== LOCAL STORAGE =====
function saveToLocalStorage() {
    const data = {
        tasks,
        userSettings,
        userStats,
        userJournal,
        activityLog,
        achievements,
        lastLoginDate: new Date().toISOString().split('T')[0]
    };
    localStorage.setItem('getShitDoneApp', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('getShitDoneApp');
    if (data) {
        const parsedData = JSON.parse(data);
        tasks = parsedData.tasks || [];
        userSettings = parsedData.userSettings || { darkMode: true, defaultTimerDuration: 15, timerSound: true };
        userStats = parsedData.userStats || { xp: 0, level: 1, streak: 0, longestStreak: 0, totalTasksCompleted: 0, totalFocusTime: 0 };
        userJournal = parsedData.userJournal || {};
        activityLog = parsedData.activityLog || {};
        achievements = parsedData.achievements || [];
        
        // Check streak
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = parsedData.lastLoginDate;
        
        if (lastLogin) {
            const lastDate = new Date(lastLogin);
            const todayDate = new Date(today);
            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
                userStats.streak = 0;
                showToast('Your streak was reset. Start a new one today!', 'info');
            }
        }
        
        // Filter out completed tasks from previous days
        const todayStr = today;
        tasks = tasks.filter(task => {
            // Keep all incomplete tasks
            if (!task.completed) return true;
            
            // Keep completed tasks only if they're from today
            if (task.completedAt && task.completedAt.startsWith(todayStr)) return true;
            
            return false;
        });
    }
}

// ===== UI INITIALIZATION =====
function initializeUI() {
    // Apply light mode if dark mode is disabled
    if (!userSettings.darkMode) {
        document.body.classList.add('light-mode');
        themeToggle.checked = true;
    }
    
    // Set timer duration based on settings
    timerDuration = userSettings.defaultTimerDuration * 60;
    timerRemaining = timerDuration;
    timerDurationSelect.value = userSettings.defaultTimerDuration;
    defaultTimerDurationSelect.value = userSettings.defaultTimerDuration;
    
    // Set timer sound toggle
    timerSoundToggle.checked = userSettings.timerSound;
    
    // Update stats display
    updateStatsDisplay();
}

function updateStatsDisplay() {
    xpEarnedEl.textContent = userStats.xp;
    userLevelEl.textContent = userStats.level;
    currentStreakEl.textContent = userStats.streak;
    totalTasksCompletedEl.textContent = userStats.totalTasksCompleted;
    statsStreakEl.textContent = `${userStats.streak} days`;
    longestStreakEl.textContent = `${userStats.longestStreak} days`;
    totalFocusTimeEl.textContent = `${Math.floor(userStats.totalFocusTime / 60)} min`;
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
            
            // Initialize charts when dashboard tab is clicked
            if (tabId === 'dashboard') {
                initializeCharts();
            }
        });
    });
    
    // Task actions
    addTaskBtn.addEventListener('click', openAddTaskModal);
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    addMicroTaskBtn.addEventListener('click', addMicroTaskInput);
    
    // Spin wheel
    spinBtn.addEventListener('click', spinWheel);
    
    // Timer controls
    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', resetTimer);
    timerDurationSelect.addEventListener('change', () => {
        timerDuration = parseInt(timerDurationSelect.value) * 60;
        timerRemaining = timerDuration;
        updateTimerDisplay();
    });
    
    // Activity tab
    prevDayBtn.addEventListener('click', () => navigateActivityDate(-1));
    nextDayBtn.addEventListener('click', () => navigateActivityDate(1));
    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    saveJournalBtn.addEventListener('click', saveJournalEntry);
    
    // Dashboard tab
    dateRangeSelect.addEventListener('change', initializeCharts);
    
    // Settings tab
    defaultTimerDurationSelect.addEventListener('change', () => {
        userSettings.defaultTimerDuration = parseInt(defaultTimerDurationSelect.value);
        saveToLocalStorage();
        showToast('Default timer duration updated', 'success');
    });
    timerSoundToggle.addEventListener('change', () => {
        userSettings.timerSound = timerSoundToggle.checked;
        saveToLocalStorage();
    });
    exportDataBtn.addEventListener('click', exportData);
    clearDataBtn.addEventListener('click', () => {
        openConfirmModal('Are you sure you want to clear all data? This cannot be undone.', clearAllData);
    });
    
    // Theme toggle
    themeToggle.addEventListener('change', toggleTheme);
    
    // Modals
    closeCelebrationBtn.addEventListener('click', closeCelebrationModal);
    cancelConfirmBtn.addEventListener('click', closeConfirmModal);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        } else if (e.target === celebrationModal) {
            closeCelebrationModal();
        } else if (e.target === confirmModal) {
            closeConfirmModal();
        }
    });
}

// ===== TAB NAVIGATION =====
function switchTab(tabId) {
    // Hide all tabs
    tabPanes.forEach(pane => pane.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// ===== TASK MANAGEMENT =====
function openAddTaskModal() {
    taskModalTitle.textContent = 'Add New Task';
    taskForm.reset();
    taskForm.dataset.mode = 'add';
    
    // Clear micro tasks
    microTasksContainer.innerHTML = '';
    addMicroTaskInput();
    
    // Show modal
    taskModal.classList.add('active');
    taskTitleInput.focus();
}

function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    taskModalTitle.textContent = 'Edit Task';
    taskForm.dataset.mode = 'edit';
    taskForm.dataset.taskId = taskId;
    
    // Fill form with task data
    taskTitleInput.value = task.title;
    taskTagSelect.value = task.tag;
    taskEffortSelect.value = task.effort;
    
    // Clear micro tasks
    microTasksContainer.innerHTML = '';
    
    // Add existing micro tasks
    if (task.microTasks.length === 0) {
        addMicroTaskInput();
    } else {
        task.microTasks.forEach(mt => {
            const microTaskDiv = document.createElement('div');
            microTaskDiv.className = 'micro-task-input';
            microTaskDiv.innerHTML = `
                <input type="text" class="micro-task" value="${mt.text}" placeholder="Add a micro task">
                <button type="button" class="remove-micro-task">×</button>
            `;
            microTasksContainer.appendChild(microTaskDiv);
            
            microTaskDiv.querySelector('.remove-micro-task').addEventListener('click', function() {
                microTaskDiv.remove();
            });
        });
    }
    
    // Show modal
    taskModal.classList.add('active');
    taskTitleInput.focus();
}

function closeTaskModal() {
    taskModal.classList.remove('active');
}

function addMicroTaskInput() {
    const microTaskDiv = document.createElement('div');
    microTaskDiv.className = 'micro-task-input';
    microTaskDiv.innerHTML = `
        <input type="text" class="micro-task" placeholder="Add a micro task">
        <button type="button" class="remove-micro-task">×</button>
    `;
    microTasksContainer.appendChild(microTaskDiv);
    
    microTaskDiv.querySelector('.remove-micro-task').addEventListener('click', function() {
        microTaskDiv.remove();
    });
    
    microTaskDiv.querySelector('input').focus();
}

function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const title = taskTitleInput.value.trim();
    const tag = taskTagSelect.value;
    const effort = parseInt(taskEffortSelect.value);
    
    // Get micro tasks
    const microTaskInputs = microTasksContainer.querySelectorAll('.micro-task');
    const microTasks = [];
    
    microTaskInputs.forEach((input, index) => {
        const text = input.value.trim();
        if (text) {
            microTasks.push({
                id: generateId(),
                text,
                completed: false,
                order: index
            });
        }
    });
    
    // Validation
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    
    // Check if we're adding or editing
    if (taskForm.dataset.mode === 'add') {
        // Check if we already have 5 tasks
        if (tasks.length >= 5) {
            showToast('You can only have up to 5 tasks at a time', 'error');
            return;
        }
        
        // Create new task
        const newTask = {
            id: generateId(),
            title,
            tag,
            effort,
            microTasks,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        tasks.push(newTask);
        
        // Log activity
        logActivity(`Added new task: ${title}`);
        
    } else if (taskForm.dataset.mode === 'edit') {
        // Update existing task
        const taskId = taskForm.dataset.taskId;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
            // Preserve completed status of existing micro tasks
            const existingMicroTasks = tasks[taskIndex].microTasks;
            
            microTasks.forEach(mt => {
                const existingMT = existingMicroTasks.find(emt => emt.text === mt.text);
                if (existingMT) {
                    mt.completed = existingMT.completed;
                }
            });
            
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                tag,
                effort,
                microTasks
            };
            
            // Log activity
            logActivity(`Updated task: ${title}`);
        }
    }
    
    // Save to local storage
    saveToLocalStorage();
    
    // Update UI
    updateTaskDisplay();
    updateProgressBar();
    closeTaskModal();
    
    showToast('Task saved successfully', 'success');
}

function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        const taskTitle = tasks[taskIndex].title;
        tasks.splice(taskIndex, 1);
        
        // Save to local storage
        saveToLocalStorage();
        
        // Update UI
        updateTaskDisplay();
        updateProgressBar();
        
        // Log activity
        logActivity(`Deleted task: ${taskTitle}`);
        
        showToast('Task deleted', 'info');
    }
}

function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // Check if all micro tasks are completed
        const allMicroTasksCompleted = task.microTasks.length > 0 && 
                                      task.microTasks.every(mt => mt.completed);
        
        if (allMicroTasksCompleted || task.microTasks.length === 0) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
            
            // Add XP based on effort
            const xpEarned = calculateXP(task.effort);
            addXP(xpEarned);
            
            // Increment completed tasks counter
            userStats.totalTasksCompleted++;
            
            // Check if all tasks for today are completed
            const activeTasks = tasks.filter(t => !t.completed);
            const allTasksCompleted = activeTasks.length === 0 && tasks.length > 0;
            
            if (allTasksCompleted) {
                // Check and unlock achievement
                unlockAchievement('completion_king');
                
                // Show special celebration
                openCelebrationModal('You completed all tasks for today!', xpEarned * 2);
                
                // Add bonus XP for completing all tasks
                addXP(xpEarned);
            } else {
                // Show regular celebration
                openCelebrationModal(`You completed: ${task.title}`, xpEarned);
            }
            
            // Save to local storage
            saveToLocalStorage();
            
            // Update UI
            updateTaskDisplay();
            updateProgressBar();
            
            // Log activity
            logActivity(`Completed task: ${task.title}`);
            
            // Check for streak
            checkDailyStreak();
        } else {
            showToast('Complete all micro tasks first', 'info');
        }
    }
}

function completeMicroTask(taskId, microTaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const microTask = task.microTasks.find(mt => mt.id === microTaskId);
    if (!microTask) return;
    
    microTask.completed = !microTask.completed;
    
    // Update UI
    updateTaskDisplay();
    
    // Log activity
    if (microTask.completed) {
        logActivity(`Completed micro task: ${microTask.text}`);
        
        // Check if this is the 5th micro task completed today
        const completedMicroTasks = tasks.flatMap(t => t.microTasks).filter(mt => mt.completed);
        if (completedMicroTasks.length === 5) {
            unlockAchievement('focus_wizard');
        }
        
        // Add small XP for completing micro task
        addXP(5);
    } else {
        logActivity(`Unmarked micro task: ${microTask.text}`);
    }
    
    // Save to local storage
    saveToLocalStorage();
}

function updateTaskDisplay() {
    tasksContainer.innerHTML = '';
    
    // Filter out completed tasks
    const activeTasks = tasks.filter(task => !task.completed);
    
    if (activeTasks.length === 0) {
        emptyTaskState.style.display = 'flex';
    } else {
        emptyTaskState.style.display = 'none';
        
        activeTasks.forEach(task => {
            const taskEl = createTaskElement(task);
            tasksContainer.appendChild(taskEl);
        });
    }
    
    // Update spin wheel
    updateSpinWheel();
}

function createTaskElement(task) {
    const taskEl = document.createElement('div');
    taskEl.className = `task-card ${task.completed ? 'completed' : ''}`;
    taskEl.id = `task-${task.id}`;
    
    const microTasksHTML = task.microTasks.map(mt => `
        <div class="micro-task-item ${mt.completed ? 'completed' : ''}">
            <input type="checkbox" class="micro-task-checkbox" data-task-id="${task.id}" data-micro-task-id="${mt.id}" ${mt.completed ? 'checked' : ''}>
            <span class="micro-task-label">${mt.text}</span>
        </div>
    `).join('');
    
    taskEl.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${task.title}</h3>
            <div class="task-controls">
                <button class="task-btn edit-task" title="Edit Task"><i class="fas fa-edit"></i></button>
                <button class="task-btn delete-task" title="Delete Task"><i class="fas fa-trash"></i></button>
                ${!task.completed ? `<button class="task-btn complete-task" title="Mark as Completed"><i class="fas fa-check"></i></button>` : ''}
            </div>
        </div>
        <div class="task-meta">
            <div class="task-tag ${task.tag}">${task.tag.charAt(0).toUpperCase() + task.tag.slice(1)}</div>
            <div class="task-effort">${task.effort} min</div>
        </div>
        ${task.microTasks.length > 0 ? `<div class="micro-tasks">${microTasksHTML}</div>` : ''}
    `;
    
    // Add event listeners to the task buttons
    taskEl.querySelector('.edit-task').addEventListener('click', () => {
        openEditTaskModal(task.id);
    });
    
    taskEl.querySelector('.delete-task').addEventListener('click', () => {
        openConfirmModal('Are you sure you want to delete this task?', () => deleteTask(task.id));
    });
    
    if (!task.completed) {
        taskEl.querySelector('.complete-task').addEventListener('click', () => {
            completeTask(task.id);
        });
    }
    
    // Add event listeners to micro task checkboxes
    taskEl.querySelectorAll('.micro-task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = this.dataset.taskId;
            const microTaskId = this.dataset.microTaskId;
            completeMicroTask(taskId, microTaskId);
        });
    });
    
    return taskEl;
}

// ===== SPIN WHEEL =====
function updateSpinWheel() {
    // Clear existing segments
    wheel.querySelectorAll('.wheel-segment').forEach(segment => segment.remove());
    
    // Get all incomplete micro tasks
    const incompleteMicroTasks = [];
    tasks.forEach(task => {
        task.microTasks.forEach(mt => {
            if (!mt.completed) {
                incompleteMicroTasks.push({
                    taskId: task.id,
                    microTaskId: mt.id,
                    taskTitle: task.title,
                    text: mt.text,
                    tag: task.tag
                });
            }
        });
    });
    
    if (incompleteMicroTasks.length === 0) {
        spinBtn.disabled = true;
        emptySpinState.style.display = 'flex';
        return;
    }
    
    emptySpinState.style.display = 'none';
    spinBtn.disabled = false;
    
    // Create wheel segments
    const segmentAngle = 360 / incompleteMicroTasks.length;
    
    incompleteMicroTasks.forEach((mt, index) => {
        const segment = document.createElement('div');
        segment.className = 'wheel-segment';
        segment.dataset.taskId = mt.taskId;
        segment.dataset.microTaskId = mt.microTaskId;
        
        // Calculate color based on task tag
        let segmentColor;
        switch (mt.tag) {
            case 'work': segmentColor = 'var(--tag-work)'; break;
            case 'personal': segmentColor = 'var(--tag-personal)'; break;
            case 'creative': segmentColor = 'var(--tag-creative)'; break;
            case 'health': segmentColor = 'var(--tag-health)'; break;
            default: segmentColor = 'var(--tag-other)';
        }
        
        // Set rotation angle for this segment
        const rotationAngle = index * segmentAngle;
        segment.style.transform = `rotate(${rotationAngle}deg)`;
        segment.style.backgroundColor = segmentColor;
        
        // Add text
        const textEl = document.createElement('div');
        textEl.className = 'wheel-text';
        textEl.textContent = mt.text;
        textEl.style.transform = `rotate(${45}deg)`;
        
        segment.appendChild(textEl);
        wheel.appendChild(segment);
    });
    
    // Add center point after all segments
    if (!wheel.querySelector('.wheel-center')) {
        const center = document.createElement('div');
        center.className = 'wheel-center';
        wheel.appendChild(center);
    }
}

function spinWheel() {
    if (wheel.classList.contains('spinning')) return;
    
    // Get all wheel segments
    const segments = wheel.querySelectorAll('.wheel-segment');
    if (segments.length === 0) return;
    
    // Disable spin button during animation
    spinBtn.disabled = true;
    wheel.classList.add('spinning');
    
    // Generate random rotation (between 2 and 5 full spins plus random segment)
    const segmentAngle = 360 / segments.length;
    const minRotation = 720; // Minimum 2 full rotations
    const randomRotation = Math.floor(Math.random() * 1080) + minRotation; // Random additional rotation up to 3 full rotations
    
    // For a single micro task, always select it
    let selectedIndex;
    if (segments.length === 1) {
        selectedIndex = 0;
    } else {
        selectedIndex = Math.floor(Math.random() * segments.length);
    }
    
    const finalRotation = randomRotation + (selectedIndex * segmentAngle);
    
    // Apply rotation animation
    wheel.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.11, 0.99)';
    wheel.style.transform = `rotate(${finalRotation}deg)`;
    
    // After animation completes
    setTimeout(() => {
        wheel.classList.remove('spinning');
        
        // Get the selected task
        const selectedSegment = segments[selectedIndex];
        const taskId = selectedSegment.dataset.taskId;
        const microTaskId = selectedSegment.dataset.microTaskId;
        
        // Find the task and micro task
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const microTask = task.microTasks.find(mt => mt.id === microTaskId);
        if (!microTask) return;
        
        // Update current task and micro task
        currentTask = task;
        currentMicroTask = microTask;
        
        // Update timer display
        currentTaskTitle.textContent = microTask.text;
        currentTaskTag.textContent = task.tag.charAt(0).toUpperCase() + task.tag.slice(1);
        currentTaskTag.className = 'task-tag ' + task.tag;
        
        // Enable timer controls
        startTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;
        
        // Set timer duration based on task effort
        timerDuration = task.effort * 60;
        timerRemaining = timerDuration;
        timerDurationSelect.value = task.effort;
        updateTimerDisplay();
        
        // Log activity
        logActivity(`Selected task from spin wheel: ${microTask.text}`);
        
        // Show toast
        showToast(`Selected: ${microTask.text}`, 'success');
    }, 3000);
}

// ===== TIMER FUNCTIONS =====
function updateTimerDisplay() {
    const minutes = Math.floor(timerRemaining / 60);
    const seconds = timerRemaining % 60;
    timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update fill height based on remaining time
    const percentComplete = 100 - ((timerRemaining / timerDuration) * 100);
    timerFill.style.height = `${percentComplete}%`;
}

function startTimer() {
    if (timerRunning) return;
    
    timerRunning = true;
    startTimerBtn.disabled = true;
    pauseTimerBtn.disabled = false;
    
    // Log activity if starting a fresh timer
    if (timerRemaining === timerDuration) {
        logActivity(`Started timer for: ${currentMicroTask.text}`);
    }
    
    timerInterval = setInterval(() => {
        timerRemaining--;
        updateTimerDisplay();
        
        // Check for midway encouragement (at 50%)
        if (timerRemaining === Math.floor(timerDuration / 2)) {
            showToast("You're doing great! Keep going!", 'info');
        }
        
        // Timer completed
        if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            
            // Update user stats
            userStats.totalFocusTime += timerDuration;
            
            // Check achievement
            if (userStats.totalFocusTime >= 120 * 60) { // 2 hours in seconds
                unlockAchievement('time_lord');
            }
            
            // Mark micro task as completed
            if (currentTask && currentMicroTask) {
                const task = tasks.find(t => t.id === currentTask.id);
                if (task) {
                    const microTask = task.microTasks.find(mt => mt.id === currentMicroTask.id);
                    if (microTask) {
                        microTask.completed = true;
                        updateTaskDisplay();
                        
                        // Add XP for completing with timer
                        addXP(10);
                        
                        // Log activity
                        logActivity(`Completed timer for: ${microTask.text}`);
                        
                        // Save to local storage
                        saveToLocalStorage();
                    }
                }
            }
            
            // Play sound if enabled
            if (userSettings.timerSound) {
                playSound('timer-complete');
            }
            
            // Show celebration
            showToast('Timer completed!', 'success');
            createConfetti();
            
            // Reset timer controls
            resetTimer();
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerRunning) return;
    
    clearInterval(timerInterval);
    timerRunning = false;
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
    
    // Log activity
    logActivity('Paused timer');
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemaining = timerDuration;
    updateTimerDisplay();
    
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
}

// ===== PROGRESS BAR =====
function updateProgressBar() {
    const totalTaskCount = tasks.length;
    const completedTaskCount = tasks.filter(task => task.completed).length;
    
    // Update progress bar fill
    const percentComplete = totalTaskCount === 0 ? 0 : (completedTaskCount / totalTaskCount) * 100;
    dopamineFill.style.width = `${percentComplete}%`;
    
    // Update task count text
    tasksCompletedEl.textContent = completedTaskCount;
    totalTasksEl.textContent = totalTaskCount;
}

// ===== XP AND LEVELING =====
function calculateXP(effort) {
    // Base XP + effort-based bonus
    return 50 + (effort * 2);
}

function addXP(amount) {
    userStats.xp += amount;
    
    // Check for level up (100 XP per level)
    const newLevel = Math.floor(userStats.xp / 100) + 1;
    
    if (newLevel > userStats.level) {
        userStats.level = newLevel;
        showToast(`Level Up! You're now level ${newLevel}`, 'success');
    }
    
    // Update UI
    updateStatsDisplay();
    
    // Save to local storage
    saveToLocalStorage();
}

// ===== STREAKS AND ACHIEVEMENTS =====
function checkDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we've completed at least one task today
    const hasCompletedTaskToday = tasks.some(task => 
        task.completed && task.completedAt && task.completedAt.startsWith(today)
    );
    
    if (hasCompletedTaskToday) {
        // Increment streak
        userStats.streak++;
        
        // Update longest streak if current streak is longer
        if (userStats.streak > userStats.longestStreak) {
            userStats.longestStreak = userStats.streak;
        }
        
        // Check for 3-day streak achievement
        if (userStats.streak === 3) {
            unlockAchievement('consistency_goblin');
        }
        
        // Save to local storage
        saveToLocalStorage();
        
        // Update UI
        updateStatsDisplay();
    }
}

function unlockAchievement(achievementId) {
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        
        // Log activity
        logActivity(`Achievement unlocked: ${achievement.name}`);
        
        // Show toast
        showToast(`Achievement Unlocked: ${achievement.name}`, 'success');
        
        // Add bonus XP
        addXP(25);
        
        // Save to local storage
        saveToLocalStorage();
        
        // Update achievements display
        updateAchievements();
    }
}

function updateAchievements() {
    if (!achievementsGrid) return;
    
    achievementsGrid.innerHTML = '';
    
    achievements.forEach(achievement => {
        const achievementEl = document.createElement('div');
        achievementEl.className = 'achievement-item';
        
        achievementEl.innerHTML = `
            <div class="achievement-icon ${achievement.unlocked ? '' : 'locked'}">
                <i class="fas ${achievement.icon}"></i>
            </div>
            <div class="achievement-name">${achievement.name}</div>
        `;
        
        // Add tooltip with description
        achievementEl.title = achievement.description;
        
        achievementsGrid.appendChild(achievementEl);
    });
}

// ===== ACTIVITY LOG AND JOURNAL =====
function logActivity(message) {
    const timestamp = new Date().toISOString();
    const today = timestamp.split('T')[0];
    
    if (!activityLog[today]) {
        activityLog[today] = [];
    }
    
    activityLog[today].push({
        timestamp,
        message
    });
    
    // Save to local storage
    saveToLocalStorage();
    
    // Update activity log display if we're on the activity tab
    if (document.querySelector('#activity').classList.contains('active')) {
        updateActivityLog();
    }
}

function updateActivityLog() {
    const dateToShow = currentDate.toISOString().split('T')[0];
    
    // Update date display
    if (isToday(currentDate)) {
        currentDateEl.textContent = 'Today';
    } else {
        currentDateEl.textContent = formatDate(dateToShow);
    }
    
    // Update log entries
    logEntries.innerHTML = '';
    
    if (!activityLog[dateToShow] || activityLog[dateToShow].length === 0) {
        logEntries.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No activity logged yet for this day.</p>
            </div>
        `;
    } else {
        activityLog[dateToShow].forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.className = 'log-entry';
            
            entryEl.innerHTML = `
                <div class="log-time">${formatTime(entry.timestamp)}</div>
                <div class="log-message">${entry.message}</div>
            `;
            
            logEntries.appendChild(entryEl);
        });
    }
    
    // Update journal entry if it exists
    journalText.value = userJournal[dateToShow]?.text || '';
    
    // Update selected mood
    const mood = userJournal[dateToShow]?.mood;
    emojiBtns.forEach(btn => {
        btn.classList.remove('selected');
        if (mood && btn.dataset.mood === mood) {
            btn.classList.add('selected');
        }
    });
}

function navigateActivityDate(direction) {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    
    // Don't allow navigating to future dates
    if (newDate > new Date()) return;
    
    currentDate = newDate;
    updateActivityLog();
}

function saveJournalEntry() {
    const dateToSave = currentDate.toISOString().split('T')[0];
    const text = journalText.value.trim();
    
    // Get selected mood
    let mood = null;
    emojiBtns.forEach(btn => {
        if (btn.classList.contains('selected')) {
            mood = btn.dataset.mood;
        }
    });
    
    userJournal[dateToSave] = {
        text,
        mood,
        updatedAt: new Date().toISOString()
    };
    
    // Save to local storage
    saveToLocalStorage();
    
    // Show toast
    showToast('Journal entry saved', 'success');
}

// ===== CHARTS AND ANALYTICS =====
function initializeCharts() {
    // Destroy existing charts to prevent duplicates
    if (completionChart) completionChart.destroy();
    if (categoryChart) categoryChart.destroy();
    
    const completionCtx = document.getElementById('completionChart').getContext('2d');
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    
    // Get date range
    const range = dateRangeSelect.value;
    const dateRange = getDateRange(range);
    
    // Get data for charts
    const completionData = getCompletionData(dateRange);
    const categoryData = getCategoryData(dateRange);
    
    // Chart.js global defaults
    Chart.defaults.font.family = "'Inter', 'Poppins', sans-serif";
    Chart.defaults.font.size = 12;
    
    // Set text colors for charts - this is what was missing
    const textColor = '#222831'; // Dark text for white background
    const gridColor = 'rgba(0, 0, 0, 0.1)';
    
    // Create completion rate chart
    completionChart = new Chart(completionCtx, {
        type: 'bar',
        data: {
            labels: completionData.labels,
            datasets: [{
                label: 'Tasks Completed',
                data: completionData.data,
                backgroundColor: 'rgba(154, 123, 255, 0.6)',
                borderColor: 'rgba(125, 86, 243, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        color: textColor
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 33, 38, 0.8)',
                    titleColor: '#f8f9fa',
                    bodyColor: '#f8f9fa',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stepSize: 1,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        precision: 0,
                        color: textColor
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor
                    }
                }
            }
        }
    });
    
    // Create category chart
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.data,
                backgroundColor: [
                    'rgba(45, 127, 249, 0.8)',   // work
                    'rgba(0, 224, 199, 0.8)',    // personal
                    'rgba(255, 62, 165, 0.8)',   // creative
                    'rgba(255, 202, 40, 0.8)',   // health
                    'rgba(141, 147, 160, 0.8)'   // other
                ],
                borderColor: [
                    'rgba(45, 127, 249, 1)',
                    'rgba(0, 224, 199, 1)',
                    'rgba(255, 62, 165, 1)',
                    'rgba(255, 202, 40, 1)',
                    'rgba(141, 147, 160, 1)'
                ],
                borderWidth: 1,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 15,
                        boxWidth: 12,
                        color: textColor
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 33, 38, 0.8)',
                    titleColor: '#f8f9fa',
                    bodyColor: '#f8f9fa',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            }
        }
    });
    
    // Update chart colors based on theme change
    themeToggle.addEventListener('change', () => {
        // This will only be added once even if initializeCharts is called multiple times
        if (document.body.classList.contains('light-mode')) {
            updateChartsForLightMode();
        } else {
            updateChartsForDarkMode();
        }
    });
}

// Helper function to update charts for light mode
function updateChartsForLightMode() {
    // We only update if charts exist
    if (!completionChart || !categoryChart) return;
    
    const textColor = '#222831';
    const gridColor = 'rgba(0, 0, 0, 0.1)';
    
    // Update legend text colors
    completionChart.options.plugins.legend.labels.color = textColor;
    categoryChart.options.plugins.legend.labels.color = textColor;
    
    // Update axis labels
    if (completionChart.options.scales.x) {
        completionChart.options.scales.x.ticks.color = textColor;
        completionChart.options.scales.y.ticks.color = textColor;
        completionChart.options.scales.y.grid.color = gridColor;
    }
    
    // Update tooltips
    completionChart.options.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    completionChart.options.plugins.tooltip.titleColor = '#222831';
    completionChart.options.plugins.tooltip.bodyColor = '#222831';
    completionChart.options.plugins.tooltip.borderColor = 'rgba(0, 0, 0, 0.1)';
    
    categoryChart.options.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    categoryChart.options.plugins.tooltip.titleColor = '#222831';
    categoryChart.options.plugins.tooltip.bodyColor = '#222831';
    categoryChart.options.plugins.tooltip.borderColor = 'rgba(0, 0, 0, 0.1)';
    
    // Apply changes
    completionChart.update();
    categoryChart.update();
}

// Helper function to update charts for dark mode
function updateChartsForDarkMode() {
    // We only update if charts exist
    if (!completionChart || !categoryChart) return;
    
    const textColor = '#222831'; // Keep dark text on white chart background
    const gridColor = 'rgba(0, 0, 0, 0.1)';
    
    // Update legend text colors
    completionChart.options.plugins.legend.labels.color = textColor;
    categoryChart.options.plugins.legend.labels.color = textColor;
    
    // Update axis labels
    if (completionChart.options.scales.x) {
        completionChart.options.scales.x.ticks.color = textColor;
        completionChart.options.scales.y.ticks.color = textColor;
        completionChart.options.scales.y.grid.color = gridColor;
    }
    
    // Update tooltips
    completionChart.options.plugins.tooltip.backgroundColor = 'rgba(30, 33, 38, 0.8)';
    completionChart.options.plugins.tooltip.titleColor = '#f8f9fa';
    completionChart.options.plugins.tooltip.bodyColor = '#f8f9fa';
    completionChart.options.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
    
    categoryChart.options.plugins.tooltip.backgroundColor = 'rgba(30, 33, 38, 0.8)';
    categoryChart.options.plugins.tooltip.titleColor = '#f8f9fa';
    categoryChart.options.plugins.tooltip.bodyColor = '#f8f9fa';
    categoryChart.options.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
    
    // Apply changes
    completionChart.update();
    categoryChart.update();
}

function getDateRange(range) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
        case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
    }
    
    return { startDate, endDate };
}

function getCompletionData(dateRange) {
    const labels = [];
    const data = [];
    
    // Create array of dates between start and end
    const currentDate = new Date(dateRange.startDate);
    while (currentDate <= dateRange.endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        labels.push(formatShortDate(dateStr));
        
        // Count completed tasks for this date
        const completedCount = tasks.filter(task => 
            task.completed && 
            task.completedAt && 
            task.completedAt.startsWith(dateStr)
        ).length;
        
        data.push(completedCount);
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return { labels, data };
}

function getCategoryData(dateRange) {
    const categories = ['work', 'personal', 'creative', 'health', 'other'];
    const data = Array(categories.length).fill(0);
    
    // Count completed tasks by category
    tasks.forEach(task => {
        if (task.completed && task.completedAt) {
            const completedDate = new Date(task.completedAt);
            if (completedDate >= dateRange.startDate && completedDate <= dateRange.endDate) {
                const index = categories.indexOf(task.tag);
                if (index !== -1) {
                    data[index]++;
                }
            }
        }
    });
    
    // Capitalize labels
    const labels = categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));
    
    return { labels, data };
}

// ===== SETTINGS =====
function toggleTheme() {
    userSettings.darkMode = !themeToggle.checked;
    
    if (themeToggle.checked) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    
    saveToLocalStorage();
}

function exportData() {
    const data = JSON.stringify({
        tasks,
        userSettings,
        userStats,
        userJournal,
        activityLog,
        achievements,
        exportDate: new Date().toISOString()
    }, null, 2);
    
    // Create download link
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `get-shit-done-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    showToast('Data exported successfully', 'success');
}

function clearAllData() {
    // Reset all data
    tasks = [];
    userSettings = { darkMode: true, defaultTimerDuration: 15, timerSound: true };
    userStats = { xp: 0, level: 1, streak: 0, longestStreak: 0, totalTasksCompleted: 0, totalFocusTime: 0 };
    userJournal = {};
    activityLog = {};
    achievements = achievements.map(a => ({ ...a, unlocked: false, unlockedAt: null }));
    
    // Clear local storage
    localStorage.removeItem('getShitDoneApp');
    
    // Update UI
    initializeUI();
    updateTaskDisplay();
    updateProgressBar();
    updateActivityLog();
    updateAchievements();
    
    // Close modal and show toast
    closeConfirmModal();
    showToast('All data has been cleared', 'info');
}

// ===== MODALS =====
function openCelebrationModal(message, xp) {
    celebrationMessage.textContent = message;
    earnedXPEl.textContent = xp;
    celebrationModal.classList.add('active');
    createConfetti();
    
    // Play sound if enabled
    if (userSettings.timerSound) {
        playSound('celebration');
    }
}

function closeCelebrationModal() {
    celebrationModal.classList.remove('active');
}

function openConfirmModal(message, confirmCallback) {
    confirmMessage.textContent = message;
    confirmBtn.onclick = confirmCallback;
    confirmModal.classList.add('active');
}

function closeConfirmModal() {
    confirmModal.classList.remove('active');
}

// ===== UTILITY FUNCTIONS =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatShortDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Remove after animation
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createConfetti() {
    const confettiCount = 100;
    const colors = [
        'var(--primary-color)',
        'var(--primary-light)',
        'var(--secondary-color)',
        'var(--accent-color)'
    ];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        document.body.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Simple sound system
function playSound(soundType) {
    const audio = new Audio();
    
    switch (soundType) {
        case 'timer-complete':
            audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEyLjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAAbngAICgoNDQ0QEBMTExYWGBgYGxseHh4hISQkJCYmKSkpKy0wMDA0NDc3Nzo6PT09QEBERERO';
            break;
        case 'celebration':
            audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEyLjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAAbngAICgoNDQ0QEBMTExYWGBgYGxseHh4hISQkJCYmKSkpKy0wMDA0NDc3Nzo6PT09QEBERERO';
            break;
    }
    
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play error:', e));
} 