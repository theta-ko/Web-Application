/**
 * Firebase Client Integration for Smallie
 * Handles authentication and voting functionality
 */

// Create mock Firebase implementation for demo mode
function createMockFirebase() {
    console.warn("Creating mock Firebase implementation for demo mode");
    
    // Create mock Firebase
    window.firebase = {
        initializeApp: function() { 
            console.log("Mock Firebase initialized");
            return {}; 
        },
        auth: function() {
            return {
                onAuthStateChanged: function(callback) { 
                    setTimeout(function() { callback(null); }, 0); 
                },
                signInWithRedirect: function() { 
                    return Promise.reject(new Error("Demo mode")); 
                },
                signOut: function() { 
                    return Promise.resolve(); 
                },
                currentUser: null
            };
        },
        firestore: function() {
            return {
                collection: function(name) {
                    return {
                        doc: function(id) {
                            return {
                                get: function() { 
                                    return Promise.resolve({ 
                                        exists: false, 
                                        data: function() { return {}; } 
                                    }); 
                                },
                                update: function() { return Promise.resolve(); },
                                set: function() { return Promise.resolve(); }
                            };
                        },
                        add: function() { return Promise.resolve(); },
                        get: function() { return Promise.resolve([]); }
                    };
                }
            };
        }
    };
    
    // Add FieldValue mock
    window.firebase.firestore.FieldValue = {
        increment: function(val) { return val; },
        serverTimestamp: function() { return new Date(); }
    };
    
    return window.firebase;
}

// Initialize Firebase
let firebaseApp, auth, db, provider;

// Ensure Firebase will be defined even if initialization fails
let mockInitialized = false;

function ensureFirebaseInitialized() {
    if (mockInitialized) {
        return;
    }

    try {
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.warn("Firebase SDK not loaded, creating mock implementation");
            createMockFirebase();
            mockInitialized = true;
            return;
        }

        // Try to initialize Firebase with config from the window
        const firebaseConfig = {
            apiKey: (window.FIREBASE_API_KEY && window.FIREBASE_API_KEY !== "{{ firebase_api_key }}") 
                ? window.FIREBASE_API_KEY : "demo-api-key",
            projectId: (window.FIREBASE_PROJECT_ID && window.FIREBASE_PROJECT_ID !== "{{ firebase_project_id }}")
                ? window.FIREBASE_PROJECT_ID : "demo",
            authDomain: (window.FIREBASE_PROJECT_ID && window.FIREBASE_PROJECT_ID !== "{{ firebase_project_id }}")
                ? `${window.FIREBASE_PROJECT_ID}.firebaseapp.com` : "demo.firebaseapp.com",
            appId: (window.FIREBASE_APP_ID && window.FIREBASE_APP_ID !== "{{ firebase_app_id }}")
                ? window.FIREBASE_APP_ID : "demo-app-id"
        };
        
        // Log config for troubleshooting
        console.log("Firebase config:", JSON.stringify({
            apiKey: firebaseConfig.apiKey.substring(0, 3) + "...",
            projectId: firebaseConfig.projectId,
            authDomain: firebaseConfig.authDomain,
            appId: firebaseConfig.appId.substring(0, 3) + "..."
        }));

        // Initialize Firebase if not already initialized
        if (firebase.apps && firebase.apps.length) {
            firebaseApp = firebase.apps[0];
        } else {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        }
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.error("Failed to initialize Firebase app:", e);
        createMockFirebase();
        mockInitialized = true;
    }
}

try {
    // First try to initialize Firebase properly
    ensureFirebaseInitialized();
    
    // Get Firebase services if available
    auth = firebase.auth();
    db = firebase.firestore();
    provider = new firebase.auth.GoogleAuthProvider();
} catch (error) {
    console.error("Error setting up Firebase:", error);
    
    // Create mock services
    if (!mockInitialized) {
        createMockFirebase();
        mockInitialized = true;
    }
    
    // Always set up local fallbacks to ensure the app works
    auth = firebase.auth();
    db = firebase.firestore();
    
    try {
        provider = new firebase.auth.GoogleAuthProvider();
    } catch (e) {
        provider = {
            addScope: function() { return this; }
        };
    }
    
    console.warn("Using demo mode with mock Firebase services");
}

// DOM Elements
const loginButton = document.getElementById('login-button');
const userProfile = document.getElementById('user-profile');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const logoutButton = document.getElementById('logout-button');
const voteForm = document.getElementById('voting-form');
const voteCountElement = document.getElementById('vote-count');
const votePriceElement = document.getElementById('vote-price');
const modalVoteCount = document.getElementById('modal-vote-count');
const modalContestantName = document.getElementById('modal-contestant-name');
const modalVoteTotal = document.getElementById('modal-vote-total');
const confirmVoteButton = document.getElementById('confirm-vote');
const voteModal = document.getElementById('vote-modal');
const successModal = document.getElementById('success-modal');

// Authentication state listener
auth.onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in
        if (loginButton) loginButton.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            userName.textContent = user.displayName || 'User';
            userAvatar.src = user.photoURL || '/static/images/default-avatar.png';
        }
    } else {
        // User is signed out
        if (loginButton) loginButton.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }
});

// Handle redirect result on page load
window.addEventListener('DOMContentLoaded', function() {
    console.log('App loaded, firebase authentication ready');
});

// Add event listeners
if (loginButton) {
    loginButton.addEventListener('click', function() {
        console.log('Login button clicked, redirecting to Google login');
        auth.signInWithRedirect(provider)
            .catch(function(error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            });
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', function() {
        auth.signOut().then(function() {
            console.log('User signed out');
        }).catch(function(error) {
            console.error('Error signing out:', error);
        });
    });
}

// Get contestant details
async function getContestantDetails(contestantId) {
    try {
        // In demo mode, we'll just find the contestant in the DOM
        const contestantCard = document.querySelector(`.contestant-card[data-contestant-id="${contestantId}"]`);
        if (contestantCard) {
            const name = contestantCard.querySelector('h3').textContent;
            const bio = contestantCard.querySelector('.contestant-bio').textContent;
            const votes = parseInt(contestantCard.querySelector('.votes-badge').textContent) || 0;
            
            return {
                id: contestantId,
                name: name,
                bio: bio,
                votes: votes
            };
        }
        
        console.log('No contestant found with ID:', contestantId);
        return null;
    } catch (error) {
        console.error('Error getting contestant:', error);
        return null;
    }
}

// Set up direct vote buttons on contestant cards
const contestantVoteButtons = document.querySelectorAll('.contestant-card .btn-vote');
if (contestantVoteButtons.length > 0) {
    contestantVoteButtons.forEach(function(button) {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Get contestant ID from button
            const contestantId = button.dataset.id;
            const card = button.closest('.contestant-card');
            
            // Don't allow voting on eliminated contestants
            if (card.classList.contains('eliminated')) {
                alert('This contestant has been eliminated and can no longer receive votes.');
                return;
            }
            
            // Get contestant name from card
            const contestantName = card.querySelector('h3').textContent;
            
            // Pre-select this contestant in the main voting form if it exists
            const selectElement = document.getElementById('contestant-select');
            if (selectElement) {
                for (let i = 0; i < selectElement.options.length; i++) {
                    if (selectElement.options[i].value === contestantId) {
                        selectElement.selectedIndex = i;
                        break;
                    }
                }
            }
            
            // Default to 1 vote
            const voteCount = 1;
            
            // Update modal content
            modalContestantName.textContent = contestantName;
            modalVoteCount.textContent = voteCount;
            modalVoteTotal.textContent = (voteCount * 0.5).toFixed(2);
            
            // Show confirmation modal
            voteModal.style.display = 'flex';
            
            // Store data for confirmation
            voteModal.dataset.contestantId = contestantId;
            voteModal.dataset.voteCount = voteCount;
            voteModal.dataset.email = ''; // Will prompt for email later if needed
        });
    });
}

// Vote submission from the main form
if (voteForm) {
    const selectElement = document.getElementById('contestant-select');
    const voteCountInput = document.getElementById('vote-count');
    const emailInput = document.getElementById('email');
    const decreaseButton = document.getElementById('decrease-votes');
    const increaseButton = document.getElementById('increase-votes');
    
    // Update vote count and price
    function updateVotePrice() {
        const count = parseInt(voteCountInput.value) || 1;
        const price = (count * 0.5).toFixed(2);
        votePriceElement.textContent = price;
    }
    
    // Export the function for use in other modules
    window.updateVotePrice = updateVotePrice;
    
    // Set up vote counter buttons
    if (decreaseButton) {
        decreaseButton.addEventListener('click', function() {
            const currentVal = parseInt(voteCountInput.value) || 1;
            if (currentVal > 1) {
                voteCountInput.value = currentVal - 1;
                updateVotePrice();
            }
        });
    }
    
    if (increaseButton) {
        increaseButton.addEventListener('click', function() {
            const currentVal = parseInt(voteCountInput.value) || 1;
            voteCountInput.value = currentVal + 1;
            updateVotePrice();
        });
    }
    
    if (voteCountInput) {
        voteCountInput.addEventListener('change', updateVotePrice);
    }
    
    // Vote form submission
    voteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const contestantId = selectElement.value;
        const voteCount = parseInt(voteCountInput.value) || 1;
        const email = emailInput.value;
        
        // Get contestant name for the confirmation modal
        const contestantOption = selectElement.options[selectElement.selectedIndex];
        const contestantName = contestantOption.text;
        
        // Update modal content
        modalContestantName.textContent = contestantName;
        modalVoteCount.textContent = voteCount;
        modalVoteTotal.textContent = (voteCount * 0.5).toFixed(2);
        
        // Show confirmation modal
        voteModal.style.display = 'flex';
        
        // Store data for confirmation
        voteModal.dataset.contestantId = contestantId;
        voteModal.dataset.voteCount = voteCount;
        voteModal.dataset.email = email;
    });
}

// Confirm vote button
if (confirmVoteButton) {
    confirmVoteButton.addEventListener('click', async function() {
        const contestantId = voteModal.dataset.contestantId;
        const voteCount = parseInt(voteModal.dataset.voteCount);
        const email = voteModal.dataset.email;
        
        try {
            // Get current day
            const dayElement = document.querySelector('#daily-task h2');
            const currentDay = dayElement ? parseInt(dayElement.textContent.split(' ')[1]) || 1 : 1;
            
            console.log(`Submitting vote: ${voteCount} votes for contestant ID ${contestantId}`);
            
            // Check if the user is logged in
            const user = auth.currentUser;
            if (!user && !email) {
                alert('Please log in or provide an email to vote.');
                return;
            }
            
            // Get contestant name for payment details
            const contestantName = modalContestantName.textContent;
            const amount = parseFloat(modalVoteTotal.textContent);
            
            // Process payment for the votes
            const processVote = function() {
                try {
                    // For demo mode, just update the UI
                    if (typeof firebase.firestore.FieldValue === 'undefined') {
                        throw new Error('Demo mode - using local data only');
                    }
                    
                    // Get the contestant reference
                    const contestantRef = db.collection('contestants').doc(contestantId);
                    
                    // Record the vote in Firestore
                    contestantRef.update({
                        votes: firebase.firestore.FieldValue.increment(voteCount)
                    });
                    
                    // Also record the vote in the votes collection for tracking
                    db.collection('votes').add({
                        contestantId: contestantId,
                        userId: user ? user.uid : null,
                        email: user ? user.email : email,
                        count: voteCount,
                        day: currentDay,
                        timestamp: new Date(),
                        amount: voteCount * 0.5 // $0.50 per vote
                    });
                } catch (error) {
                    console.warn('Using local mode for vote processing:', error);
                    // In demo mode, just update the UI
                }
                
                // Update the UI to reflect the new vote count
                const contestantCard = document.querySelector(`.contestant-card[data-contestant-id="${contestantId}"]`);
                if (contestantCard) {
                    const votesBadge = contestantCard.querySelector('.votes-badge');
                    if (votesBadge) {
                        const currentVotes = parseInt(votesBadge.textContent) || 0;
                        votesBadge.textContent = `${currentVotes + voteCount} votes`;
                    }
                }
                
                // Close vote modal
                voteModal.style.display = 'none';
                
                // Show success modal
                successModal.style.display = 'flex';
                
                // Reset form if exists
                if (voteForm) {
                    voteForm.reset();
                    updateVotePrice();
                }
                
                // Update prize fund display if function exists
                if (typeof window.updatePrizeFund === 'function') {
                    window.updatePrizeFund();
                }
                
                // Record transaction for demo purposes if function exists
                if (typeof window.recordTransaction === 'function') {
                    window.recordTransaction({
                        id: 'tx_' + Date.now(),
                        contestantId: contestantId,
                        contestantName: contestantName,
                        email: email || (user ? user.email : 'anon@example.com'),
                        voteCount: voteCount,
                        amount: amount,
                        timestamp: new Date().toISOString(),
                        paymentMethod: 'Flutterwave',
                        status: 'completed'
                    });
                }
            };
            
            // Use Flutterwave for payment processing if available
            if (typeof window.processFlutterwavePayment === 'function') {
                voteModal.style.display = 'none';
                window.processFlutterwavePayment({
                    email: email || (user ? user.email : 'voter@example.com'),
                    amount: amount,
                    contestantName: contestantName,
                    voteCount: voteCount
                }, processVote);
            } else {
                // Fallback to direct vote if payment processing is not available
                console.warn('Payment processing not available. Using direct vote.');
                processVote();
            }
            
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('There was an error submitting your vote. Please try again.');
            voteModal.style.display = 'none';
        }
    });
}

// Close modal buttons
document.querySelectorAll('.close, #cancel-vote').forEach(function(button) {
    button.addEventListener('click', function() {
        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.style.display = 'none';
        });
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (typeof updateVotePrice === 'function') {
        updateVotePrice();
    }
    console.log('App loaded, firebase authentication ready');
});

// Expose functions globally
window.getContestantDetails = getContestantDetails;