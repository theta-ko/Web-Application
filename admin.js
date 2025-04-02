/**
 * Smallie - Admin Dashboard
 * Manages admin functionality for the Smallie competition
 */

import { 
    initializeApp 
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';

import { 
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// Initialize Firebase
const firebaseConfig = {
    apiKey: window.FIREBASE_API_KEY,
    authDomain: `${window.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: window.FIREBASE_PROJECT_ID,
    storageBucket: `${window.FIREBASE_PROJECT_ID}.appspot.com`,
    appId: window.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Admin password (hardcoded for simplicity)
const ADMIN_PASSWORD = 'smallie2025';

// DOM Elements - Dashboard Navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

// DOM Elements - Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// DOM Elements - Modals
const loginModal = document.getElementById('login-modal');
const adminLoginForm = document.getElementById('admin-login-form');
const adminPassword = document.getElementById('admin-password');
const adminLogout = document.getElementById('admin-logout');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const contestantModal = document.getElementById('contestant-modal');
const payoutModal = document.getElementById('payout-modal');
const closeButtons = document.querySelectorAll('.close, .close-modal');

// DOM Elements - Forms and Buttons
const createTaskBtn = document.getElementById('create-task-btn');
const taskDayInput = document.getElementById('task-day');
const taskTitleInput = document.getElementById('task-title');
const taskDescriptionInput = document.getElementById('task-description');
const taskStatusInput = document.getElementById('task-status');
const taskIdInput = document.getElementById('task-id');
const taskModalTitle = document.getElementById('task-modal-title');

// DOM Elements - Contestant Actions
const approveContestantBtn = document.getElementById('approve-contestant');
const rejectContestantBtn = document.getElementById('reject-contestant');
const eliminateContestantBtn = document.getElementById('eliminate-contestant');

// DOM Elements - Payout Actions
const processDailyPayoutBtn = document.getElementById('process-daily-payout');
const processFinalPayoutBtn = document.getElementById('process-final-payout');
const payFlutterwaveBtn = document.getElementById('pay-flutterwave-admin');
const paySolanaBtn = document.getElementById('pay-solana-admin');
const payoutModalTitle = document.getElementById('payout-modal-title');
const payoutDetails = document.getElementById('payout-details');

// Helper Functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
};

const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Timestamp ? 
        timestamp.toDate() : 
        new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const showLoading = (message = 'Loading...') => {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    document.body.appendChild(loadingOverlay);
};

const hideLoading = () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        document.body.removeChild(loadingOverlay);
    }
};

// Admin Authentication
const checkAuthentication = () => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
        loginModal.style.display = 'flex';
    } else {
        loginModal.style.display = 'none';
    }
    return isAuthenticated;
};

const login = (password) => {
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('admin_authenticated', 'true');
        loginModal.style.display = 'none';
        return true;
    }
    return false;
};

const logout = () => {
    localStorage.removeItem('admin_authenticated');
    window.location.reload();
};

// Navigation Functions
const switchTab = (targetTab) => {
    // Hide all tab content
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show target tab content
    document.getElementById(`${targetTab}-tab`).classList.add('active');
    
    // Activate target tab button
    document.querySelector(`.tab-btn[data-tab="${targetTab}"]`).classList.add('active');
};

const switchSection = (targetSection) => {
    // Hide all sections
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Deactivate all nav items
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(`${targetSection}-section`).classList.add('active');
    
    // Activate target nav item
    document.querySelector(`.nav-item[data-section="${targetSection}"]`).classList.add('active');
};

// Contestants Management
const loadActiveContestants = async () => {
    try {
        const contestantsContainer = document.getElementById('active-contestants-grid');
        contestantsContainer.innerHTML = '<div class="loading">Loading contestants...</div>';
        
        const contestantsRef = collection(db, 'contestants');
        const q = query(
            contestantsRef,
            where('eliminated', '==', false)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            contestantsContainer.innerHTML = '<div class="empty-message">No active contestants found.</div>';
            return;
        }
        
        let html = '';
        querySnapshot.forEach((doc) => {
            const contestant = doc.data();
            html += `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">${contestant.name}</h3>
                        <p class="admin-card-subtitle">${contestant.age} | ${contestant.location}</p>
                    </div>
                    <div class="admin-card-content">
                        <p><strong>Votes:</strong> ${contestant.votes || 0}</p>
                        <p><strong>Bio:</strong> ${contestant.bio || 'No bio available'}</p>
                        <p><strong>Stream URL:</strong> ${contestant.stream_url || 'Not set'}</p>
                    </div>
                    <div class="admin-card-footer">
                        <span class="admin-badge-status status-approved">Active</span>
                        <button class="btn btn-secondary view-contestant" data-id="${contestant.id}">Manage</button>
                    </div>
                </div>
            `;
        });
        
        contestantsContainer.innerHTML = html;
        
        // Add event listeners to view buttons
        const viewButtons = document.querySelectorAll('.view-contestant');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const contestantId = button.dataset.id;
                openContestantModal(contestantId);
            });
        });
    } catch (error) {
        console.error('Error loading active contestants:', error);
        document.getElementById('active-contestants-grid').innerHTML = 
            '<div class="error-message">Error loading contestants. Please try again.</div>';
    }
};

const loadPendingApplications = async () => {
    try {
        const applicationsContainer = document.getElementById('pending-applications-grid');
        applicationsContainer.innerHTML = '<div class="loading">Loading applications...</div>';
        
        const signupsRef = collection(db, 'signups');
        const q = query(
            signupsRef,
            where('status', '==', 'pending')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            applicationsContainer.innerHTML = '<div class="empty-message">No pending applications found.</div>';
            return;
        }
        
        let html = '';
        querySnapshot.forEach((doc) => {
            const application = { ...doc.data(), id: doc.id };
            html += `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">${application.name}</h3>
                        <p class="admin-card-subtitle">${application.location}</p>
                    </div>
                    <div class="admin-card-content">
                        <p><strong>Email:</strong> ${application.email}</p>
                        <p><strong>Phone:</strong> ${application.phone || 'Not provided'}</p>
                        <p><strong>Why join:</strong> ${application.bio || 'No reason provided'}</p>
                        <p><strong>Experience:</strong> ${application.experience || 'No experience provided'}</p>
                        <p><strong>Applied on:</strong> ${formatDate(application.createdAt)}</p>
                    </div>
                    <div class="admin-card-footer">
                        <span class="admin-badge-status status-pending">Pending</span>
                        <button class="btn btn-secondary view-application" data-id="${application.id}">Review</button>
                    </div>
                </div>
            `;
        });
        
        applicationsContainer.innerHTML = html;
        
        // Add event listeners to view buttons
        const viewButtons = document.querySelectorAll('.view-application');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const applicationId = button.dataset.id;
                openApplicationModal(applicationId);
            });
        });
    } catch (error) {
        console.error('Error loading pending applications:', error);
        document.getElementById('pending-applications-grid').innerHTML = 
            '<div class="error-message">Error loading applications. Please try again.</div>';
    }
};

const loadEliminatedContestants = async () => {
    try {
        const contestantsContainer = document.getElementById('eliminated-contestants-grid');
        contestantsContainer.innerHTML = '<div class="loading">Loading eliminated contestants...</div>';
        
        const contestantsRef = collection(db, 'contestants');
        const q = query(
            contestantsRef,
            where('eliminated', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            contestantsContainer.innerHTML = '<div class="empty-message">No eliminated contestants found.</div>';
            return;
        }
        
        let html = '';
        querySnapshot.forEach((doc) => {
            const contestant = doc.data();
            html += `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">${contestant.name}</h3>
                        <p class="admin-card-subtitle">${contestant.age} | ${contestant.location}</p>
                    </div>
                    <div class="admin-card-content">
                        <p><strong>Final Votes:</strong> ${contestant.votes || 0}</p>
                        <p><strong>Bio:</strong> ${contestant.bio || 'No bio available'}</p>
                        <p><strong>Stream URL:</strong> ${contestant.stream_url || 'Not set'}</p>
                    </div>
                    <div class="admin-card-footer">
                        <span class="admin-badge-status status-eliminated">Eliminated</span>
                        <button class="btn btn-secondary view-contestant" data-id="${contestant.id}">Manage</button>
                    </div>
                </div>
            `;
        });
        
        contestantsContainer.innerHTML = html;
        
        // Add event listeners to view buttons
        const viewButtons = document.querySelectorAll('.view-contestant');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const contestantId = button.dataset.id;
                openContestantModal(contestantId);
            });
        });
    } catch (error) {
        console.error('Error loading eliminated contestants:', error);
        document.getElementById('eliminated-contestants-grid').innerHTML = 
            '<div class="error-message">Error loading contestants. Please try again.</div>';
    }
};

const openContestantModal = async (contestantId) => {
    try {
        showLoading('Loading contestant details...');
        
        const contestantRef = doc(db, 'contestants', contestantId.toString());
        const contestantDoc = await getDoc(contestantRef);
        
        if (!contestantDoc.exists()) {
            alert('Contestant not found');
            hideLoading();
            return;
        }
        
        const contestant = contestantDoc.data();
        
        // Update modal title
        document.getElementById('contestant-modal-title').textContent = 
            `${contestant.name} - ${contestant.eliminated ? 'Eliminated' : 'Active'} Contestant`;
        
        // Update modal content
        const detailsContainer = document.getElementById('contestant-details');
        detailsContainer.innerHTML = `
            <div class="contestant-profile">
                <div class="contestant-image">
                    <img src="${contestant.image_url || 'https://via.placeholder.com/150'}" alt="${contestant.name}">
                </div>
                <div class="contestant-info">
                    <h3>${contestant.name}</h3>
                    <div class="contestant-data">
                        <div class="data-label">Age:</div>
                        <div class="data-value">${contestant.age}</div>
                    </div>
                    <div class="contestant-data">
                        <div class="data-label">Location:</div>
                        <div class="data-value">${contestant.location}</div>
                    </div>
                    <div class="contestant-data">
                        <div class="data-label">Total Votes:</div>
                        <div class="data-value">${contestant.votes || 0}</div>
                    </div>
                    <div class="contestant-data">
                        <div class="data-label">Stream URL:</div>
                        <div class="data-value">${contestant.stream_url || 'Not set'}</div>
                    </div>
                </div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Bio:</div>
                <div class="data-value">${contestant.bio || 'No bio available'}</div>
            </div>
            <div class="votes-editor">
                <h3>Update Votes</h3>
                <div class="votes-input">
                    <input type="number" id="contestant-votes" value="${contestant.votes || 0}" min="0">
                    <button id="update-votes" class="btn btn-primary" data-id="${contestantId}">Update Votes</button>
                </div>
            </div>
        `;
        
        // Update button states
        if (contestant.eliminated) {
            eliminateContestantBtn.textContent = 'Restore Contestant';
            eliminateContestantBtn.classList.remove('btn-warning');
            eliminateContestantBtn.classList.add('btn-success');
        } else {
            eliminateContestantBtn.textContent = 'Eliminate Contestant';
            eliminateContestantBtn.classList.remove('btn-success');
            eliminateContestantBtn.classList.add('btn-warning');
        }
        
        // Hide approve/reject buttons for existing contestants
        approveContestantBtn.style.display = 'none';
        rejectContestantBtn.style.display = 'none';
        
        // Save contestant ID to modal
        contestantModal.dataset.id = contestantId;
        contestantModal.dataset.type = 'contestant';
        
        // Show modal
        contestantModal.style.display = 'flex';
        
        // Add event listener to update votes button
        document.getElementById('update-votes').addEventListener('click', updateContestantVotes);
        
        hideLoading();
    } catch (error) {
        console.error('Error opening contestant modal:', error);
        hideLoading();
        alert('Error loading contestant details. Please try again.');
    }
};

const openApplicationModal = async (applicationId) => {
    try {
        showLoading('Loading application details...');
        
        const applicationRef = doc(db, 'signups', applicationId);
        const applicationDoc = await getDoc(applicationRef);
        
        if (!applicationDoc.exists()) {
            alert('Application not found');
            hideLoading();
            return;
        }
        
        const application = applicationDoc.data();
        
        // Update modal title
        document.getElementById('contestant-modal-title').textContent = 
            `${application.name} - Pending Application`;
        
        // Update modal content
        const detailsContainer = document.getElementById('contestant-details');
        detailsContainer.innerHTML = `
            <div class="contestant-data">
                <div class="data-label">Name:</div>
                <div class="data-value">${application.name}</div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Email:</div>
                <div class="data-value">${application.email}</div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Phone:</div>
                <div class="data-value">${application.phone || 'Not provided'}</div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Location:</div>
                <div class="data-value">${application.location}</div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Social Media:</div>
                <div class="data-value">${application.socialHandle || 'Not provided'}</div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Stream URL:</div>
                <div class="data-value">${application.streamUrl || 'Not provided'}</div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Experience:</div>
                <div class="data-value">${application.experience || 'No experience provided'}</div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Why join:</div>
                <div class="data-value">${application.bio || 'No reason provided'}</div>
            </div>
            <div class="contestant-data">
                <div class="data-label">Applied on:</div>
                <div class="data-value">${formatDate(application.createdAt)}</div>
            </div>
        `;
        
        // Show approve/reject buttons
        approveContestantBtn.style.display = 'block';
        rejectContestantBtn.style.display = 'block';
        
        // Hide eliminate button
        eliminateContestantBtn.style.display = 'none';
        
        // Save application ID to modal
        contestantModal.dataset.id = applicationId;
        contestantModal.dataset.type = 'application';
        
        // Show modal
        contestantModal.style.display = 'flex';
        
        hideLoading();
    } catch (error) {
        console.error('Error opening application modal:', error);
        hideLoading();
        alert('Error loading application details. Please try again.');
    }
};

const approveApplication = async () => {
    try {
        const applicationId = contestantModal.dataset.id;
        if (!applicationId) return;
        
        showLoading('Approving application...');
        
        // Get application data
        const applicationRef = doc(db, 'signups', applicationId);
        const applicationDoc = await getDoc(applicationRef);
        
        if (!applicationDoc.exists()) {
            hideLoading();
            alert('Application not found');
            return;
        }
        
        const application = applicationDoc.data();
        
        // Calculate next contestant ID
        const contestantsRef = collection(db, 'contestants');
        const contestantsSnapshot = await getDocs(contestantsRef);
        const contestantCount = contestantsSnapshot.size;
        const newContestantId = contestantCount + 1;
        
        // Create new contestant
        const newContestant = {
            id: newContestantId,
            name: application.name,
            age: application.age || 25, // Default age if not provided
            location: application.location,
            bio: application.bio || '',
            image_url: application.photoUrl || 'https://images.unsplash.com/photo-1522327646852-4e28586a40dd', // Default image
            votes: 0,
            stream_url: application.streamUrl || '',
            eliminated: false,
            created_at: serverTimestamp(),
            email: application.email,
            phone: application.phone || '',
            social_handle: application.socialHandle || ''
        };
        
        // Add to contestants collection
        await setDoc(doc(db, 'contestants', newContestantId.toString()), newContestant);
        
        // Update application status
        await updateDoc(applicationRef, {
            status: 'approved',
            updated_at: serverTimestamp()
        });
        
        hideLoading();
        alert(`${application.name} has been approved as a contestant!`);
        
        // Close modal and refresh lists
        contestantModal.style.display = 'none';
        loadActiveContestants();
        loadPendingApplications();
    } catch (error) {
        console.error('Error approving application:', error);
        hideLoading();
        alert('Error approving application. Please try again.');
    }
};

const rejectApplication = async () => {
    try {
        const applicationId = contestantModal.dataset.id;
        if (!applicationId) return;
        
        if (!confirm('Are you sure you want to reject this application?')) {
            return;
        }
        
        showLoading('Rejecting application...');
        
        // Update application status
        const applicationRef = doc(db, 'signups', applicationId);
        await updateDoc(applicationRef, {
            status: 'rejected',
            updated_at: serverTimestamp()
        });
        
        hideLoading();
        alert('Application has been rejected');
        
        // Close modal and refresh list
        contestantModal.style.display = 'none';
        loadPendingApplications();
    } catch (error) {
        console.error('Error rejecting application:', error);
        hideLoading();
        alert('Error rejecting application. Please try again.');
    }
};

const toggleEliminateContestant = async () => {
    try {
        const contestantId = contestantModal.dataset.id;
        if (!contestantId) return;
        
        const contestantRef = doc(db, 'contestants', contestantId.toString());
        const contestantDoc = await getDoc(contestantRef);
        
        if (!contestantDoc.exists()) {
            alert('Contestant not found');
            return;
        }
        
        const contestant = contestantDoc.data();
        const isEliminated = contestant.eliminated;
        
        if (!isEliminated) {
            if (!confirm(`Are you sure you want to eliminate ${contestant.name}?`)) {
                return;
            }
            
            showLoading('Eliminating contestant...');
        } else {
            if (!confirm(`Are you sure you want to restore ${contestant.name} as an active contestant?`)) {
                return;
            }
            
            showLoading('Restoring contestant...');
        }
        
        // Update contestant status
        await updateDoc(contestantRef, {
            eliminated: !isEliminated,
            updated_at: serverTimestamp()
        });
        
        hideLoading();
        alert(`${contestant.name} has been ${isEliminated ? 'restored' : 'eliminated'}`);
        
        // Close modal and refresh lists
        contestantModal.style.display = 'none';
        loadActiveContestants();
        loadEliminatedContestants();
    } catch (error) {
        console.error('Error toggling contestant elimination:', error);
        hideLoading();
        alert('Error updating contestant status. Please try again.');
    }
};

const updateContestantVotes = async (e) => {
    try {
        const contestantId = e.target.dataset.id;
        const newVotes = parseInt(document.getElementById('contestant-votes').value);
        
        if (isNaN(newVotes) || newVotes < 0) {
            alert('Please enter a valid number of votes');
            return;
        }
        
        showLoading('Updating votes...');
        
        // Update contestant votes
        const contestantRef = doc(db, 'contestants', contestantId.toString());
        await updateDoc(contestantRef, {
            votes: newVotes,
            updated_at: serverTimestamp()
        });
        
        hideLoading();
        alert('Votes updated successfully');
        
        // Close modal and refresh lists
        contestantModal.style.display = 'none';
        loadActiveContestants();
        loadEliminatedContestants();
    } catch (error) {
        console.error('Error updating contestant votes:', error);
        hideLoading();
        alert('Error updating votes. Please try again.');
    }
};

// Tasks Management
const loadTasks = async () => {
    try {
        const tasksContainer = document.getElementById('tasks-container');
        tasksContainer.innerHTML = '<div class="loading">Loading tasks...</div>';
        
        const tasksRef = collection(db, 'tasks');
        const q = query(tasksRef, orderBy('day', 'asc'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            tasksContainer.innerHTML = `
                <div class="empty-message">No tasks found. Create tasks for each day of the competition.</div>
            `;
            return;
        }
        
        let html = '';
        querySnapshot.forEach((doc) => {
            const task = doc.data();
            html += `
                <div class="task-row">
                    <div class="task-day">Day ${task.day}</div>
                    <div class="task-date">${formatDate(task.scheduled_date)}</div>
                    <div class="task-description">
                        <div class="task-title">${task.title}</div>
                        <div class="task-description">${task.description}</div>
                    </div>
                    <div class="task-status">
                        <span class="admin-badge-status status-${task.status}">${task.status}</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-icon edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        
        tasksContainer.innerHTML = html;
        
        // Add event listeners to buttons
        const editButtons = document.querySelectorAll('.btn-icon.edit');
        const deleteButtons = document.querySelectorAll('.btn-icon.delete');
        
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const taskId = button.dataset.id;
                openTaskModal(taskId);
            });
        });
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const taskId = button.dataset.id;
                deleteTask(taskId);
            });
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('tasks-container').innerHTML = 
            '<div class="error-message">Error loading tasks. Please try again.</div>';
    }
};

const openTaskModal = async (taskId = null) => {
    // Clear form
    taskForm.reset();
    
    if (taskId) {
        // Edit existing task
        try {
            showLoading('Loading task details...');
            
            const taskRef = doc(db, 'tasks', taskId);
            const taskDoc = await getDoc(taskRef);
            
            if (!taskDoc.exists()) {
                alert('Task not found');
                hideLoading();
                return;
            }
            
            const task = taskDoc.data();
            
            // Update modal title
            taskModalTitle.textContent = `Edit Task - Day ${task.day}`;
            
            // Fill form values
            taskDayInput.value = task.day;
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description;
            taskStatusInput.value = task.status;
            taskIdInput.value = taskId;
            
            hideLoading();
        } catch (error) {
            console.error('Error loading task details:', error);
            hideLoading();
            alert('Error loading task details. Please try again.');
            return;
        }
    } else {
        // Create new task
        taskModalTitle.textContent = 'Create New Task';
        taskIdInput.value = '';
    }
    
    // Show modal
    taskModal.style.display = 'flex';
};

const saveTask = async (e) => {
    e.preventDefault();
    
    const day = parseInt(taskDayInput.value);
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const status = taskStatusInput.value;
    const taskId = taskIdInput.value;
    
    if (!title || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        showLoading('Saving task...');
        
        // Calculate scheduled date (for demo purposes, using April 2025)
        const baseDate = new Date(2025, 3, 14); // April 14, 2025
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(baseDate.getDate() + day);
        
        const taskData = {
            day,
            title,
            description,
            status,
            scheduled_date: Timestamp.fromDate(scheduledDate),
            updated_at: serverTimestamp()
        };
        
        if (taskId) {
            // Update existing task
            await updateDoc(doc(db, 'tasks', taskId), taskData);
        } else {
            // Create new task
            await addDoc(collection(db, 'tasks'), taskData);
        }
        
        hideLoading();
        alert('Task saved successfully');
        
        // Close modal and refresh task list
        taskModal.style.display = 'none';
        loadTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        hideLoading();
        alert('Error saving task. Please try again.');
    }
};

const deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        showLoading('Deleting task...');
        
        await deleteDoc(doc(db, 'tasks', taskId));
        
        hideLoading();
        alert('Task deleted successfully');
        
        // Refresh task list
        loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        hideLoading();
        alert('Error deleting task. Please try again.');
    }
};

// Payout Management
const loadDailyPayouts = async () => {
    try {
        // Calculate today's statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startOfDay = Timestamp.fromDate(today);
        const endOfDay = Timestamp.fromDate(new Date(today.setHours(23, 59, 59, 999)));
        
        // Get today's votes
        const votesRef = collection(db, 'votes');
        const q = query(
            votesRef,
            where('timestamp', '>=', startOfDay),
            where('timestamp', '<=', endOfDay)
        );
        
        const querySnapshot = await getDocs(q);
        
        let todayVotes = 0;
        querySnapshot.forEach((doc) => {
            const vote = doc.data();
            todayVotes += vote.count || 1;
        });
        
        // Calculate revenue and payout
        const revenue = todayVotes * 0.5; // $0.50 per vote
        const dailyPayout = revenue * 0.09; // 9% for daily payouts
        
        // Update stats in UI
        document.getElementById('today-votes').textContent = todayVotes;
        document.getElementById('today-revenue').textContent = formatCurrency(revenue);
        document.getElementById('daily-payout').textContent = formatCurrency(dailyPayout);
        
        // Load daily winners
        await loadDailyWinners();
    } catch (error) {
        console.error('Error loading daily payouts:', error);
    }
};

const loadDailyWinners = async () => {
    try {
        const winnersContainer = document.getElementById('daily-winners-grid');
        winnersContainer.innerHTML = '<div class="loading">Calculating daily winners...</div>';
        
        // Get all active contestants
        const contestantsRef = collection(db, 'contestants');
        const q = query(
            contestantsRef,
            where('eliminated', '==', false)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            winnersContainer.innerHTML = '<div class="empty-message">No active contestants found.</div>';
            return;
        }
        
        // Calculate daily votes for each contestant (this would normally come from the votes collection)
        // For demo purposes, we'll use a random number for each contestant
        const contestants = [];
        querySnapshot.forEach((doc) => {
            const contestant = doc.data();
            const dailyVotes = Math.floor(Math.random() * 100); // Random number for demo
            contestants.push({
                ...contestant,
                daily_votes: dailyVotes,
                daily_payout: dailyVotes * 0.5 * 0.09 // 9% of revenue from votes
            });
        });
        
        // Sort by daily votes
        contestants.sort((a, b) => b.daily_votes - a.daily_votes);
        
        // Get top 3
        const topContestants = contestants.slice(0, 3);
        
        // Generate HTML
        let html = '';
        topContestants.forEach((contestant, index) => {
            html += `
                <div class="payout-card">
                    <div class="payout-rank">${index + 1}</div>
                    <div class="payout-details">
                        <div class="payout-contestant">${contestant.name}</div>
                        <div class="payout-votes">${contestant.daily_votes} votes today</div>
                        <div class="payout-status status-pending-payment">Pending Payment</div>
                    </div>
                    <div class="payout-amount">${formatCurrency(contestant.daily_payout)}</div>
                </div>
            `;
        });
        
        winnersContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading daily winners:', error);
        document.getElementById('daily-winners-grid').innerHTML = 
            '<div class="error-message">Error calculating daily winners. Please try again.</div>';
    }
};

const loadFinalPayouts = async () => {
    try {
        // Calculate total votes and revenue
        const votesRef = collection(db, 'votes');
        const votesSnapshot = await getDocs(votesRef);
        
        let totalVotes = 0;
        votesSnapshot.forEach((doc) => {
            const vote = doc.data();
            totalVotes += vote.count || 1;
        });
        
        // Calculate revenue and prize pool
        const totalRevenue = totalVotes * 0.5; // $0.50 per vote
        const prizePool = totalRevenue * 0.9; // 90% for final prize pool
        
        // Update stats in UI
        document.getElementById('total-votes').textContent = totalVotes;
        document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('final-prize-pool').textContent = formatCurrency(prizePool);
        
        // Load final rankings
        await loadFinalRankings();
    } catch (error) {
        console.error('Error loading final payouts:', error);
    }
};

const loadFinalRankings = async () => {
    try {
        const rankingsContainer = document.getElementById('final-rankings-grid');
        rankingsContainer.innerHTML = '<div class="loading">Calculating final rankings...</div>';
        
        // Get all contestants
        const contestantsRef = collection(db, 'contestants');
        const contestantsSnapshot = await getDocs(contestantsRef);
        
        if (contestantsSnapshot.empty) {
            rankingsContainer.innerHTML = '<div class="empty-message">No contestants found.</div>';
            return;
        }
        
        // Prepare contestants list
        const contestants = [];
        contestantsSnapshot.forEach((doc) => {
            const contestant = doc.data();
            contestants.push(contestant);
        });
        
        // Sort by votes
        contestants.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        // Calculate total votes and prize pool
        const totalVotes = contestants.reduce((sum, contestant) => sum + (contestant.votes || 0), 0);
        const totalRevenue = totalVotes * 0.5; // $0.50 per vote
        const prizePool = totalRevenue * 0.9; // 90% for final prize pool
        
        // Calculate payouts
        // 1st place: 50% of prize pool
        // 2nd place: 30% of prize pool
        // 3rd place: 20% of prize pool
        const firstPlacePayout = prizePool * 0.5;
        const secondPlacePayout = prizePool * 0.3;
        const thirdPlacePayout = prizePool * 0.2;
        
        // Generate HTML
        let html = '';
        
        if (contestants.length > 0) {
            html += `
                <div class="payout-card">
                    <div class="payout-rank">1</div>
                    <div class="payout-details">
                        <div class="payout-contestant">${contestants[0].name}</div>
                        <div class="payout-votes">${contestants[0].votes || 0} total votes</div>
                        <div class="payout-status status-pending-payment">Pending Payment</div>
                    </div>
                    <div class="payout-amount">${formatCurrency(firstPlacePayout)}</div>
                </div>
            `;
        }
        
        if (contestants.length > 1) {
            html += `
                <div class="payout-card">
                    <div class="payout-rank">2</div>
                    <div class="payout-details">
                        <div class="payout-contestant">${contestants[1].name}</div>
                        <div class="payout-votes">${contestants[1].votes || 0} total votes</div>
                        <div class="payout-status status-pending-payment">Pending Payment</div>
                    </div>
                    <div class="payout-amount">${formatCurrency(secondPlacePayout)}</div>
                </div>
            `;
        }
        
        if (contestants.length > 2) {
            html += `
                <div class="payout-card">
                    <div class="payout-rank">3</div>
                    <div class="payout-details">
                        <div class="payout-contestant">${contestants[2].name}</div>
                        <div class="payout-votes">${contestants[2].votes || 0} total votes</div>
                        <div class="payout-status status-pending-payment">Pending Payment</div>
                    </div>
                    <div class="payout-amount">${formatCurrency(thirdPlacePayout)}</div>
                </div>
            `;
        }
        
        rankingsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading final rankings:', error);
        document.getElementById('final-rankings-grid').innerHTML = 
            '<div class="error-message">Error calculating final rankings. Please try again.</div>';
    }
};

const openPayoutModal = async (type) => {
    try {
        showLoading('Preparing payout details...');
        
        let title, details;
        let recipientInfo = {};
        
        if (type === 'daily') {
            title = 'Process Daily Payout';
            
            // Calculate today's statistics and identify winners
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const startOfDay = Timestamp.fromDate(today);
            const endOfDay = Timestamp.fromDate(new Date(today.setHours(23, 59, 59, 999)));
            
            // Get today's votes
            const votesRef = collection(db, 'votes');
            const q = query(
                votesRef,
                where('timestamp', '>=', startOfDay),
                where('timestamp', '<=', endOfDay)
            );
            
            const querySnapshot = await getDocs(q);
            
            // Track today's votes and votes per contestant
            let todayVotes = 0;
            const contestantVotes = {};
            
            querySnapshot.forEach((doc) => {
                const vote = doc.data();
                const voteCount = vote.count || 1;
                todayVotes += voteCount;
                
                // Track votes by contestant
                const contestantId = vote.contestantId;
                if (contestantId) {
                    contestantVotes[contestantId] = (contestantVotes[contestantId] || 0) + voteCount;
                }
            });
            
            // Find top 3 contestants by votes
            const sortedContestants = Object.entries(contestantVotes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            
            // Calculate revenue and payout
            const revenue = todayVotes * 0.5; // $0.50 per vote
            const dailyPayout = revenue * 0.09; // 9% for daily payouts
            
            // Calculate in Naira
            const revenueNaira = revenue * 480; // Approximate NGN conversion
            const payoutNaira = dailyPayout * 480; // Approximate NGN conversion
            
            // Create winner details HTML
            let winnersList = '';
            const totalWinners = sortedContestants.length;
            
            if (totalWinners > 0) {
                // Calculate payout distribution
                const firstPlaceAmount = payoutNaira * 0.5;
                const secondPlaceAmount = totalWinners >= 2 ? payoutNaira * 0.3 : 0;
                const thirdPlaceAmount = totalWinners >= 3 ? payoutNaira * 0.2 : 0;
                
                // Get details for top contestants
                const topContestantPromises = sortedContestants.map(async ([id, votes], index) => {
                    try {
                        // Get contestant details
                        const contestantDoc = await getDoc(doc(db, 'contestants', id));
                        if (contestantDoc.exists()) {
                            const contestant = contestantDoc.data();
                            let amount;
                            let place;
                            
                            // Determine payout amount based on place
                            if (index === 0) {
                                amount = firstPlaceAmount;
                                place = '1st';
                                
                                // Store first place recipient info for payment
                                recipientInfo = {
                                    id: id,
                                    name: contestant.name || 'Contestant ' + id,
                                    email: contestant.email || 'contestant@smallie.app',
                                    wallet: contestant.walletAddress || '',
                                    place: 'First Place',
                                    payout: firstPlaceAmount,
                                    votes: votes
                                };
                            } else if (index === 1) {
                                amount = secondPlaceAmount;
                                place = '2nd';
                            } else {
                                amount = thirdPlaceAmount;
                                place = '3rd';
                            }
                            
                            return `
                                <div class="winner-item">
                                    <div class="winner-place">${place} Place</div>
                                    <div class="winner-name">${contestant.name || 'Contestant ' + id}</div>
                                    <div class="winner-votes">${votes} votes</div>
                                    <div class="winner-payout">${formatNaira(amount)}</div>
                                </div>
                            `;
                        }
                        return '';
                    } catch (err) {
                        console.error('Error fetching contestant details:', err);
                        return '';
                    }
                });
                
                // Wait for all contestant details to be fetched
                const winnerDetails = await Promise.all(topContestantPromises);
                winnersList = winnerDetails.join('');
            } else {
                winnersList = '<div class="no-winners">No votes recorded today</div>';
                
                // Default recipient info
                recipientInfo = {
                    id: 'default',
                    name: 'No Winner',
                    email: 'admin@smallie.app',
                    wallet: '',
                    place: 'No Winner',
                    payout: 0,
                    votes: 0
                };
            }
            
            details = `
                <div class="payout-summary">
                    <div class="payout-stats">
                        <div class="payout-stat">
                            <div class="stat-label">Today's Votes:</div>
                            <div class="stat-value">${todayVotes}</div>
                        </div>
                        <div class="payout-stat">
                            <div class="stat-label">Today's Revenue:</div>
                            <div class="stat-value">${formatCurrency(revenue)} (${formatNaira(revenueNaira)})</div>
                        </div>
                        <div class="payout-stat">
                            <div class="stat-label">Daily Payout (9%):</div>
                            <div class="stat-value">${formatCurrency(dailyPayout)} (${formatNaira(payoutNaira)})</div>
                        </div>
                    </div>
                    
                    <div class="winners-section">
                        <h3>Today's Winners</h3>
                        <div class="winners-list">
                            ${winnersList}
                        </div>
                    </div>
                </div>
                <p>This will process payouts for today's top ${totalWinners > 0 ? totalWinners : 'contestants'} based on votes received today.</p>
                <p>Payments will be sent via your selected payment method to the first place winner.</p>
            `;
            
            // Set payment data attributes
            payoutModal.dataset.amount = (dailyPayout * 0.5 / 240).toFixed(4); // Convert to SOL (approximate)
            payoutModal.dataset.amountNaira = payoutNaira * 0.5; // First place gets 50%
            payoutModal.dataset.recipientName = recipientInfo.name;
            payoutModal.dataset.recipientEmail = recipientInfo.email;
            payoutModal.dataset.recipientWallet = recipientInfo.wallet;
            payoutModal.dataset.recipientId = recipientInfo.id;
        } else if (type === 'final') {
            title = 'Process Final Payout';
            
            // Calculate total votes and identify overall winners
            const votesRef = collection(db, 'votes');
            const votesSnapshot = await getDocs(votesRef);
            
            // Track total votes and votes per contestant
            let totalVotes = 0;
            const contestantVotes = {};
            
            votesSnapshot.forEach((doc) => {
                const vote = doc.data();
                const voteCount = vote.count || 1;
                totalVotes += voteCount;
                
                // Track votes by contestant
                const contestantId = vote.contestantId;
                if (contestantId) {
                    contestantVotes[contestantId] = (contestantVotes[contestantId] || 0) + voteCount;
                }
            });
            
            // Find top 3 contestants by votes
            const sortedContestants = Object.entries(contestantVotes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            
            // Calculate revenue and prize pool
            const totalRevenue = totalVotes * 0.5; // $0.50 per vote
            const prizePool = totalRevenue * 0.9; // 90% for final prize pool
            
            // Calculate in Naira
            const revenueNaira = totalRevenue * 480; // Approximate NGN conversion
            const prizePoolNaira = prizePool * 480; // Approximate NGN conversion
            
            // Create winner details HTML
            let winnersList = '';
            const totalWinners = sortedContestants.length;
            
            if (totalWinners > 0) {
                // Calculate payout distribution
                const firstPlaceAmount = prizePoolNaira * 0.5;
                const secondPlaceAmount = totalWinners >= 2 ? prizePoolNaira * 0.3 : 0;
                const thirdPlaceAmount = totalWinners >= 3 ? prizePoolNaira * 0.2 : 0;
                
                // Get details for top contestants
                const topContestantPromises = sortedContestants.map(async ([id, votes], index) => {
                    try {
                        // Get contestant details
                        const contestantDoc = await getDoc(doc(db, 'contestants', id));
                        if (contestantDoc.exists()) {
                            const contestant = contestantDoc.data();
                            let amount;
                            let place;
                            
                            // Determine payout amount based on place
                            if (index === 0) {
                                amount = firstPlaceAmount;
                                place = '1st';
                                
                                // Store first place recipient info for payment
                                recipientInfo = {
                                    id: id,
                                    name: contestant.name || 'Contestant ' + id,
                                    email: contestant.email || 'contestant@smallie.app',
                                    wallet: contestant.walletAddress || '',
                                    place: 'Grand Prize Winner',
                                    payout: firstPlaceAmount,
                                    votes: votes
                                };
                            } else if (index === 1) {
                                amount = secondPlaceAmount;
                                place = '2nd';
                            } else {
                                amount = thirdPlaceAmount;
                                place = '3rd';
                            }
                            
                            return `
                                <div class="winner-item">
                                    <div class="winner-place">${place} Place</div>
                                    <div class="winner-name">${contestant.name || 'Contestant ' + id}</div>
                                    <div class="winner-votes">${votes} votes</div>
                                    <div class="winner-payout">${formatNaira(amount)}</div>
                                </div>
                            `;
                        }
                        return '';
                    } catch (err) {
                        console.error('Error fetching contestant details:', err);
                        return '';
                    }
                });
                
                // Wait for all contestant details to be fetched
                const winnerDetails = await Promise.all(topContestantPromises);
                winnersList = winnerDetails.join('');
            } else {
                winnersList = '<div class="no-winners">No contestants found</div>';
                
                // Default recipient info
                recipientInfo = {
                    id: 'default',
                    name: 'No Winner',
                    email: 'admin@smallie.app',
                    wallet: '',
                    place: 'No Winner',
                    payout: 0,
                    votes: 0
                };
            }
            
            details = `
                <div class="payout-summary">
                    <div class="payout-stats">
                        <div class="payout-stat">
                            <div class="stat-label">Total Votes:</div>
                            <div class="stat-value">${totalVotes}</div>
                        </div>
                        <div class="payout-stat">
                            <div class="stat-label">Total Revenue:</div>
                            <div class="stat-value">${formatCurrency(totalRevenue)} (${formatNaira(revenueNaira)})</div>
                        </div>
                        <div class="payout-stat">
                            <div class="stat-label">Final Prize Pool (90%):</div>
                            <div class="stat-value">${formatCurrency(prizePool)} (${formatNaira(prizePoolNaira)})</div>
                        </div>
                    </div>
                    
                    <div class="winners-section">
                        <h3>Final Winners</h3>
                        <div class="winners-list">
                            ${winnersList}
                        </div>
                    </div>
                </div>
                <p>This will process the final payouts to the top ${totalWinners > 0 ? totalWinners : 'contestants'}.</p>
                <p>Payments will be sent via your selected payment method to the first place winner.</p>
            `;
            
            // Set payment data attributes
            payoutModal.dataset.amount = (prizePool * 0.5 / 240).toFixed(4); // Convert to SOL (approximate)
            payoutModal.dataset.amountNaira = prizePoolNaira * 0.5; // First place gets 50%
            payoutModal.dataset.recipientName = recipientInfo.name;
            payoutModal.dataset.recipientEmail = recipientInfo.email;
            payoutModal.dataset.recipientWallet = recipientInfo.wallet;
            payoutModal.dataset.recipientId = recipientInfo.id;
        }
        
        // Create additional record in Firebase for this payout
        try {
            await addDoc(collection(db, 'payoutRequests'), {
                type: type,
                amount: parseFloat(payoutModal.dataset.amountNaira),
                amountSol: parseFloat(payoutModal.dataset.amount),
                recipient: recipientInfo,
                status: 'pending',
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error('Error creating payout request record:', err);
        }
        
        // Update modal content
        document.getElementById('payout-modal-title').textContent = title;
        document.getElementById('payout-details').innerHTML = details;
        payoutModal.dataset.type = type;
        
        // Show modal
        payoutModal.style.display = 'flex';
        
        hideLoading();
    } catch (error) {
        console.error('Error opening payout modal:', error);
        hideLoading();
        alert('Error preparing payout details. Please try again.');
    }
};

// Stats Dashboard
const loadStatsDashboard = async () => {
    try {
        // Calculate total votes, revenue, and prize pool
        const votesRef = collection(db, 'votes');
        const votesSnapshot = await getDocs(votesRef);
        
        let totalVotes = 0;
        votesSnapshot.forEach((doc) => {
            const vote = doc.data();
            totalVotes += vote.count || 1;
        });
        
        // Calculate revenue and prize pool
        const totalRevenue = totalVotes * 0.5; // $0.50 per vote
        const prizePool = totalRevenue * 0.9; // 90% for final prize pool
        
        // Count active contestants
        const contestantsRef = collection(db, 'contestants');
        const activeContestantsQuery = query(
            contestantsRef,
            where('eliminated', '==', false)
        );
        const activeContestantsSnapshot = await getDocs(activeContestantsQuery);
        const activeContestantsCount = activeContestantsSnapshot.size;
        
        // Update stats in UI
        document.getElementById('stats-total-votes').textContent = totalVotes;
        document.getElementById('stats-total-revenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('stats-prize-pool').textContent = formatCurrency(prizePool);
        document.getElementById('stats-contestants').textContent = activeContestantsCount;
        
        // Load charts
        loadVotesChart();
        loadContestantVotesChart();
        
        // Load stats table
        loadStatsTable();
    } catch (error) {
        console.error('Error loading stats dashboard:', error);
    }
};

const loadVotesChart = async () => {
    try {
        // Generate date labels for the past 7 days
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            
            labels.push(formattedDate);
            
            // Generate random data for demo
            data.push(Math.floor(Math.random() * 500) + 100);
        }
        
        // Create chart
        const ctx = document.getElementById('votes-chart').getContext('2d');
        
        // Check if chart already exists and destroy it
        if (window.votesChart) {
            window.votesChart.destroy();
        }
        
        window.votesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes',
                    data: data,
                    backgroundColor: 'rgba(211, 47, 47, 0.2)',
                    borderColor: 'rgba(211, 47, 47, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading votes chart:', error);
    }
};

const loadContestantVotesChart = async () => {
    try {
        // Get all contestants
        const contestantsRef = collection(db, 'contestants');
        const contestantsSnapshot = await getDocs(contestantsRef);
        
        if (contestantsSnapshot.empty) {
            return;
        }
        
        // Prepare data
        const labels = [];
        const data = [];
        const backgroundColors = [];
        
        contestantsSnapshot.forEach((doc) => {
            const contestant = doc.data();
            labels.push(contestant.name);
            data.push(contestant.votes || 0);
            
            // Different color for eliminated contestants
            if (contestant.eliminated) {
                backgroundColors.push('rgba(150, 150, 150, 0.7)');
            } else {
                backgroundColors.push('rgba(211, 47, 47, 0.7)');
            }
        });
        
        // Create chart
        const ctx = document.getElementById('contestant-votes-chart').getContext('2d');
        
        // Check if chart already exists and destroy it
        if (window.contestantVotesChart) {
            window.contestantVotesChart.destroy();
        }
        
        window.contestantVotesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading contestant votes chart:', error);
    }
};

const loadStatsTable = async () => {
    try {
        const tableBody = document.getElementById('stats-table-body');
        tableBody.innerHTML = '';
        
        // Generate data for 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            // Generate random data for demo
            const votes = Math.floor(Math.random() * 500) + 100;
            const revenue = votes * 0.5;
            const payout = revenue * 0.09;
            
            // Get winner name (randomly from first 3 contestants for demo)
            const contestantsRef = collection(db, 'contestants');
            const contestantsSnapshot = await getDocs(contestantsRef);
            
            let winnerName = 'N/A';
            if (!contestantsSnapshot.empty) {
                const contestants = [];
                contestantsSnapshot.forEach((doc) => {
                    contestants.push(doc.data());
                });
                
                if (contestants.length > 0) {
                    const randomIndex = Math.floor(Math.random() * Math.min(3, contestants.length));
                    winnerName = contestants[randomIndex].name;
                }
            }
            
            // Generate row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Day ${i + 1}</td>
                <td>${formattedDate}</td>
                <td>${votes}</td>
                <td>${formatCurrency(revenue)}</td>
                <td>${winnerName}</td>
                <td><span class="admin-badge-status ${i === 0 ? 'status-pending' : 'status-approved'}">
                    ${i === 0 ? 'Pending' : 'Paid'}
                </span></td>
            `;
            
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading stats table:', error);
    }
};

// Payment Integration
const processFlutterwavePayment = async () => {
    try {
        const payoutType = payoutModal.dataset.type;
        const amount = parseFloat(payoutModal.dataset.amountNaira);
        const recipientName = payoutModal.dataset.recipientName || "Smallie Contestant";
        const recipientEmail = payoutModal.dataset.recipientEmail || "contestant@smallie.app";
        
        if (isNaN(amount) || amount <= 0) {
            alert('Invalid payout amount');
            return;
        }
        
        showLoading('Initializing payment...');
        
        // Create payment record in Firestore
        const paymentRef = await addDoc(collection(db, 'payments'), {
            type: 'flutterwave',
            payoutType: payoutType,
            amount: amount,
            currency: 'NGN',
            recipientName: recipientName,
            recipientEmail: recipientEmail,
            status: 'initiated',
            timestamp: serverTimestamp()
        });
        
        // Configure Flutterwave payment
        const flutterwaveConfig = {
            public_key: window.FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: `smallie-${payoutType}-${Date.now()}`,
            amount: amount,
            currency: 'NGN',
            payment_options: 'card,banktransfer,ussd',
            customer: {
                email: recipientEmail,
                name: recipientName,
            },
            customizations: {
                title: `Smallie ${payoutType.charAt(0).toUpperCase() + payoutType.slice(1)} Payout`,
                description: `Payout for ${payoutType} competition results`,
                logo: 'https://cdn.replit.store/p/Smallie.png',
            },
            callback: async function(response) {
                try {
                    // Update payment record
                    await updateDoc(doc(db, 'payments', paymentRef.id), {
                        status: 'completed',
                        flutterwaveReference: response.transaction_id,
                        completedAt: serverTimestamp()
                    });
                    
                    hideLoading();
                    alert(`Payment successful. Transaction reference: ${response.transaction_id}`);
                    payoutModal.style.display = 'none';
                    
                    // Refresh payout data
                    if (payoutType === 'daily') {
                        loadDailyPayouts();
                    } else {
                        loadFinalPayouts();
                    }
                } catch (err) {
                    console.error('Error updating payment record:', err);
                    hideLoading();
                    alert('Payment was processed but there was an error updating records.');
                }
            },
            onclose: async function() {
                try {
                    // Update payment record to cancelled if closed without completing
                    await updateDoc(doc(db, 'payments', paymentRef.id), {
                        status: 'cancelled',
                        cancelledAt: serverTimestamp()
                    });
                    
                    hideLoading();
                } catch (err) {
                    console.error('Error updating payment record on close:', err);
                    hideLoading();
                }
            }
        };
        
        // Check if Flutterwave is available
        if (window.FlutterwaveCheckout) {
            hideLoading();
            window.FlutterwaveCheckout(flutterwaveConfig);
        } else {
            throw new Error('Flutterwave SDK not available');
        }
    } catch (error) {
        console.error('Error processing Flutterwave payment:', error);
        hideLoading();
        alert(`Error processing payment: ${error.message}. Please ensure the Flutterwave API key is set.`);
    }
};

const processSolanaPayment = async () => {
    try {
        const payoutType = payoutModal.dataset.type;
        const amount = parseFloat(payoutModal.dataset.amount);
        const recipientName = payoutModal.dataset.recipientName || "Smallie Contestant";
        const recipientWalletAddress = payoutModal.dataset.recipientWallet || "";
        
        if (isNaN(amount) || amount <= 0) {
            alert('Invalid payout amount');
            return;
        }
        
        if (!recipientWalletAddress) {
            alert('Recipient wallet address is required for Solana payment');
            return;
        }
        
        showLoading('Initializing Solana payment...');
        
        // Create payment record in Firestore
        const paymentRef = await addDoc(collection(db, 'payments'), {
            type: 'solana',
            payoutType: payoutType,
            amount: amount,
            currency: 'SOL',
            recipientName: recipientName,
            recipientWallet: recipientWalletAddress,
            status: 'initiated',
            timestamp: serverTimestamp()
        });
        
        // Check if Solana Web3 is available
        if (!window.solanaWeb3) {
            throw new Error('Solana Web3 SDK not loaded');
        }
        
        try {
            const solanaConnection = new solanaWeb3.Connection(
                `https://api.devnet.solana.com?project_id=${window.SOLANA_PROJECT_ID}`, 
                'confirmed'
            );
            
            // We need phantom wallet or similar to be connected
            // This is a simplified version - in a real implementation, 
            // you would integrate with Phantom or another Solana wallet
            
            // For demonstration purposes, we'll show what would happen
            // if a Solana wallet was connected
            
            // Update the payment status in Firestore
            await updateDoc(doc(db, 'payments', paymentRef.id), {
                status: 'processing',
                processingStartedAt: serverTimestamp(),
                solanaNetwork: 'devnet'
            });
            
            // Display information modal to the admin
            hideLoading();
            
            // Show wallet connection dialog
            const confirmed = confirm(
                `Connect your Solana wallet to complete this payment:\n\n` +
                `Recipient: ${recipientName}\n` +
                `Wallet: ${recipientWalletAddress}\n` +
                `Amount: ${amount} SOL\n\n` +
                `Would you like to simulate a successful payment? (In a real implementation, this would connect to your wallet)`
            );
            
            if (confirmed) {
                showLoading('Processing payment...');
                
                // Simulate transaction delay
                setTimeout(async () => {
                    try {
                        // Update payment record to completed with transaction details
                        await updateDoc(doc(db, 'payments', paymentRef.id), {
                            status: 'completed',
                            solanaSignature: `${Date.now().toString(16)}`,
                            solanaBlock: Math.floor(Math.random() * 1000000) + 10000000,
                            completedAt: serverTimestamp()
                        });
                        
                        hideLoading();
                        alert('Payment processed successfully via Solana!');
                        payoutModal.style.display = 'none';
                        
                        // Refresh payout data
                        if (payoutType === 'daily') {
                            loadDailyPayouts();
                        } else {
                            loadFinalPayouts();
                        }
                    } catch (updError) {
                        console.error('Error updating payment record:', updError);
                        hideLoading();
                        alert('Error updating payment record. Please check the transaction status manually.');
                    }
                }, 2000);
            } else {
                // User cancelled the transaction
                await updateDoc(doc(db, 'payments', paymentRef.id), {
                    status: 'cancelled',
                    cancelledAt: serverTimestamp(),
                    cancellationReason: 'User cancelled wallet connection'
                });
                
                hideLoading();
                alert('Payment cancelled.');
            }
        } catch (solanaError) {
            console.error('Solana connection error:', solanaError);
            
            // Update payment record to failed
            await updateDoc(doc(db, 'payments', paymentRef.id), {
                status: 'failed',
                failedAt: serverTimestamp(),
                errorMessage: solanaError.message
            });
            
            hideLoading();
            alert(`Solana payment error: ${solanaError.message}`);
        }
    } catch (error) {
        console.error('Error processing Solana payment:', error);
        hideLoading();
        alert(`Error processing payment: ${error.message}. Please ensure the Solana Project ID is set.`);
    }
};

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated - but continue loading the dashboard regardless
    // This allows the login form to be shown while the dashboard is loaded underneath
    checkAuthentication();
    
    // Load initial data
    loadActiveContestants();
    loadTasks();
    loadDailyPayouts();
    loadStatsDashboard();
    
    // Set up navigation event listeners
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.dataset.section;
            switchSection(targetSection);
            
            // Load specific data based on section
            if (targetSection === 'contestants') {
                loadActiveContestants();
                // Default to active contestants tab
                switchTab('approved');
            } else if (targetSection === 'tasks') {
                loadTasks();
            } else if (targetSection === 'payouts') {
                loadDailyPayouts();
                loadFinalPayouts();
                // Default to daily payouts tab
                switchTab('daily');
            } else if (targetSection === 'stats') {
                loadStatsDashboard();
            }
        });
    });
    
    // Set up tab event listeners
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
            
            // Load specific data based on tab
            if (targetTab === 'approved') {
                loadActiveContestants();
            } else if (targetTab === 'pending') {
                loadPendingApplications();
            } else if (targetTab === 'eliminated') {
                loadEliminatedContestants();
            } else if (targetTab === 'daily') {
                loadDailyPayouts();
            } else if (targetTab === 'final') {
                loadFinalPayouts();
            }
        });
    });
    
    // Set up modal event listeners
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = adminPassword.value;
        
        if (login(password)) {
            // Load initial data after login
            loadActiveContestants();
            loadTasks();
            loadDailyPayouts();
            loadStatsDashboard();
        } else {
            alert('Invalid password');
        }
    });
    
    adminLogout.addEventListener('click', logout);
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Set up task form event listeners
    createTaskBtn.addEventListener('click', () => openTaskModal());
    taskForm.addEventListener('submit', saveTask);
    
    // Set up contestant action event listeners
    approveContestantBtn.addEventListener('click', approveApplication);
    rejectContestantBtn.addEventListener('click', rejectApplication);
    eliminateContestantBtn.addEventListener('click', toggleEliminateContestant);
    
    // Set up payout action event listeners
    processDailyPayoutBtn.addEventListener('click', () => openPayoutModal('daily'));
    processFinalPayoutBtn.addEventListener('click', () => openPayoutModal('final'));
    payFlutterwaveBtn.addEventListener('click', processFlutterwavePayment);
    paySolanaBtn.addEventListener('click', processSolanaPayment);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});