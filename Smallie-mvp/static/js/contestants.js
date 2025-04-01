/**
 * Smallie - Contestants Module
 * Manages contestant functionality including voting, streaming, and status display
 */

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    increment,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

// Get Firebase instances
const db = getFirestore();
const auth = getAuth();

// DOM Elements
const contestantCards = document.querySelectorAll('.contestant-card');
const watchButtons = document.querySelectorAll('.btn-watch');
const voteButtons = document.querySelectorAll('.btn-vote');
const streamLinkButtons = document.querySelectorAll('.btn-add-stream');
const streamLinkModal = document.getElementById('stream-link-modal');
const streamLinkForm = document.getElementById('stream-link-form');
const streamLinkInput = document.getElementById('stream-link-input');
const streamLinkSubmit = document.getElementById('stream-link-submit');
const closeModalButtons = document.querySelectorAll('.close');

// Function to update vote count display
function updateVoteDisplay(contestantId, newCount) {
    const card = document.querySelector(`[data-contestant-id="${contestantId}"]`);
    if (card) {
        const votesBadge = card.querySelector('.votes-badge');
        if (votesBadge) {
            votesBadge.textContent = `${newCount} votes`;
        }
    }
}

// Function to mark contestant as eliminated
function markContestantEliminated(contestantId, isEliminated = true) {
    const card = document.querySelector(`[data-contestant-id="${contestantId}"]`);
    if (card) {
        if (isEliminated) {
            card.classList.add('eliminated');
            // Add eliminated badge if it doesn't exist
            if (!card.querySelector('.eliminated-badge')) {
                const badge = document.createElement('div');
                badge.className = 'eliminated-badge';
                badge.textContent = 'Eliminated';
                card.appendChild(badge);
            }
        } else {
            card.classList.remove('eliminated');
            // Remove eliminated badge if exists
            const badge = card.querySelector('.eliminated-badge');
            if (badge) {
                badge.remove();
            }
        }
    }
}

// Function to add stream link for a contestant
async function addStreamLink(contestantId, streamLink) {
    try {
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            alert('Please login to add a stream link');
            return false;
        }
        
        // Update contestant in Firestore
        const contestantRef = doc(db, 'contestants', contestantId.toString());
        await updateDoc(contestantRef, {
            streamUrl: streamLink,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid
        });
        
        // Update UI
        const card = document.querySelector(`[data-contestant-id="${contestantId}"]`);
        if (card) {
            const watchBtn = card.querySelector('.btn-watch');
            if (watchBtn) {
                watchBtn.href = streamLink;
                watchBtn.classList.remove('disabled');
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error adding stream link:', error);
        return false;
    }
}

// Initialize stream link modal
let currentContestantId = null;

// Set up event listeners for stream link buttons
if (streamLinkButtons) {
    streamLinkButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check if user is logged in
            if (!auth.currentUser) {
                alert('Please login to add a stream link');
                return;
            }
            
            // Get contestant ID
            currentContestantId = button.dataset.id;
            
            // Show modal
            if (streamLinkModal) {
                streamLinkModal.style.display = 'flex';
            }
        });
    });
}

// Set up stream link form submission
if (streamLinkForm) {
    streamLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentContestantId) {
            alert('No contestant selected');
            return;
        }
        
        const streamLink = streamLinkInput.value.trim();
        if (!streamLink) {
            alert('Please enter a valid stream link');
            return;
        }
        
        // Validate URL
        try {
            new URL(streamLink);
        } catch (error) {
            alert('Please enter a valid URL');
            return;
        }
        
        // Add stream link
        const success = await addStreamLink(currentContestantId, streamLink);
        
        if (success) {
            alert('Stream link added successfully!');
            streamLinkModal.style.display = 'none';
            streamLinkForm.reset();
        } else {
            alert('Failed to add stream link. Please try again.');
        }
    });
}

// Set up event listeners for close buttons
if (closeModalButtons) {
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
}

// Function to initialize the contestants section
async function initContestants() {
    try {
        // Check if we have contestants in Firestore
        const contestantsCollection = collection(db, 'contestants');
        const contestantsSnapshot = await getDocs(contestantsCollection);
        
        // If we don't have any contestants in Firestore, let's use the ones from the HTML
        if (contestantsSnapshot.empty) {
            console.log('No contestants found in Firestore, using default data');
            return;
        }
        
        // Update UI with data from Firestore
        contestantsSnapshot.forEach(doc => {
            const contestant = doc.data();
            const card = document.querySelector(`[data-contestant-id="${contestant.id}"]`);
            
            if (card) {
                // Update vote count
                const votesBadge = card.querySelector('.votes-badge');
                if (votesBadge && contestant.votes) {
                    votesBadge.textContent = `${contestant.votes} votes`;
                }
                
                // Update stream link
                const watchBtn = card.querySelector('.btn-watch');
                if (watchBtn && contestant.streamUrl) {
                    watchBtn.href = contestant.streamUrl;
                    watchBtn.classList.remove('disabled');
                }
                
                // Update elimination status
                if (contestant.eliminated) {
                    markContestantEliminated(contestant.id, true);
                }
            }
        });
    } catch (error) {
        console.error('Error initializing contestants:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only run if we have contestant cards
    if (contestantCards.length > 0) {
        // Set up watch buttons
        watchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const href = button.getAttribute('href');
                if (!href || href === '#' || button.classList.contains('disabled')) {
                    e.preventDefault();
                    alert('No stream link available for this contestant yet.');
                }
            });
        });
        
        // Initialize contestants from Firestore
        initContestants();
    }
});

// Check authentication state changes
onAuthStateChanged(auth, (user) => {
    // Update UI based on authentication status
    const addStreamBtns = document.querySelectorAll('.btn-add-stream');
    
    if (user) {
        // User is signed in
        addStreamBtns.forEach(btn => {
            btn.classList.remove('hidden');
        });
    } else {
        // User is signed out
        addStreamBtns.forEach(btn => {
            btn.classList.add('hidden');
        });
    }
});