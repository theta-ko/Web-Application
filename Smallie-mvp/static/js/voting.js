/**
 * Smallie - Voting Module
 * Handles voting area functionality, vote selection, and payment initiation
 */

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// Import updatePrizeFund from payments module
import { updatePrizeFund } from './payments.js';

// Get Firebase instances
const db = getFirestore();

// DOM Elements
const votingForm = document.getElementById('voting-form');
const votingArea = document.querySelector('.voting-area');
const contestantSelect = document.getElementById('contestant-select');
const voteCountInput = document.getElementById('vote-count');
const votePrice = document.getElementById('vote-price');
const voteModal = document.getElementById('vote-modal');
const emailRequired = document.getElementById('email-required-notice');
const emailInput = document.getElementById('email');
const voteCounterSection = document.querySelector('.vote-counter-section');

// Display the top voted contestants in the red vote tiles
export async function showTopContestants() {
    try {
        const voteTilesContainer = document.getElementById('vote-tiles');
        if (!voteTilesContainer) return;
        
        // Clear existing tiles
        voteTilesContainer.innerHTML = '';
        
        // Get contestant data sorted by votes
        let contestants = [];
        
        try {
            // Try to get from Firestore
            const contestantsRef = collection(db, 'contestants');
            const contestantsSnapshot = await getDocs(contestantsRef);
            
            if (!contestantsSnapshot.empty) {
                contestantsSnapshot.forEach(doc => {
                    contestants.push(doc.data());
                });
            }
        } catch (error) {
            console.error('Error fetching contestants:', error);
            // If Firestore fails, get from DOM
            document.querySelectorAll('.contestant-card').forEach(card => {
                const id = card.dataset.contestantId;
                const name = card.querySelector('h3').textContent;
                const votes = parseInt(card.querySelector('.votes-badge').textContent) || 0;
                const eliminated = card.classList.contains('eliminated');
                
                contestants.push({ id, name, votes, eliminated });
            });
        }
        
        // Sort by votes (highest first)
        contestants.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        // Take top 5 non-eliminated contestants
        const topContestants = contestants
            .filter(c => !c.eliminated)
            .slice(0, 5);
        
        // Create vote tiles
        topContestants.forEach(contestant => {
            const tile = document.createElement('div');
            tile.className = 'vote-tile';
            tile.dataset.id = contestant.id;
            
            tile.innerHTML = `
                <h3>${contestant.name}</h3>
                <div class="votes-count">${contestant.votes || 0} votes</div>
                <button class="vote-tile-btn" data-id="${contestant.id}">Vote</button>
            `;
            
            voteTilesContainer.appendChild(tile);
        });
        
        // Add event listeners to vote buttons
        document.querySelectorAll('.vote-tile-btn').forEach(button => {
            button.addEventListener('click', () => {
                const contestantId = button.dataset.id;
                selectContestantInForm(contestantId);
                scrollToVotingForm();
            });
        });
        
    } catch (error) {
        console.error('Error showing top contestants:', error);
    }
}

// Function to select contestant in the form
function selectContestantInForm(contestantId) {
    if (contestantSelect) {
        for (let i = 0; i < contestantSelect.options.length; i++) {
            if (contestantSelect.options[i].value === contestantId) {
                contestantSelect.selectedIndex = i;
                break;
            }
        }
    }
}

// Function to scroll to voting form
function scrollToVotingForm() {
    if (votingForm) {
        votingForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// Update vote price
function updateVotePrice() {
    if (voteCountInput && votePrice) {
        const count = parseInt(voteCountInput.value) || 1;
        const price = (count * 0.5).toFixed(2);
        votePrice.textContent = price;
    }
}

// Function to toggle email field visibility based on vote count
function toggleEmailRequirement() {
    if (voteCountInput && emailRequired) {
        const count = parseInt(voteCountInput.value) || 1;
        
        // Require email for 5+ votes
        if (count >= 5) {
            emailRequired.style.display = 'block';
            emailInput.required = true;
        } else {
            emailRequired.style.display = 'none';
            emailInput.required = false;
        }
    }
}

// Function to show votes leaderboard
export async function showVotesLeaderboard() {
    try {
        const leaderboardContainer = document.getElementById('votes-leaderboard');
        if (!leaderboardContainer) return;
        
        // Clear existing leaderboard
        leaderboardContainer.innerHTML = '';
        
        // Get contestant data sorted by votes
        let contestants = [];
        
        try {
            // Try to get from Firestore
            const contestantsRef = collection(db, 'contestants');
            const contestantsSnapshot = await getDocs(contestantsRef);
            
            if (!contestantsSnapshot.empty) {
                contestantsSnapshot.forEach(doc => {
                    contestants.push(doc.data());
                });
            }
        } catch (error) {
            console.error('Error fetching contestants:', error);
            // If Firestore fails, get from DOM
            document.querySelectorAll('.contestant-card').forEach(card => {
                const id = card.dataset.contestantId;
                const name = card.querySelector('h3').textContent;
                const votes = parseInt(card.querySelector('.votes-badge').textContent) || 0;
                
                contestants.push({ id, name, votes });
            });
        }
        
        // Sort by votes (highest first)
        contestants.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        // Create leaderboard items
        contestants.forEach((contestant, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            // Add special class for top 3
            if (index < 3) {
                item.classList.add(`top-${index + 1}`);
            }
            
            item.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name">${contestant.name}</div>
                <div class="leaderboard-votes">${contestant.votes || 0}</div>
            `;
            
            leaderboardContainer.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error showing votes leaderboard:', error);
    }
}

// Initialize voting functionality
document.addEventListener('DOMContentLoaded', () => {
    // Show top contestants
    showTopContestants();
    
    // Show votes leaderboard
    showVotesLeaderboard();
    
    // Update prize fund
    updatePrizeFund();
    
    // Set up vote counter
    if (voteCountInput) {
        voteCountInput.addEventListener('change', () => {
            updateVotePrice();
            toggleEmailRequirement();
        });
        
        // Initial update
        updateVotePrice();
        toggleEmailRequirement();
    }
    
    // Add event listeners to increment/decrement buttons
    const decreaseBtn = document.getElementById('decrease-votes');
    const increaseBtn = document.getElementById('increase-votes');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            const currentVal = parseInt(voteCountInput.value) || 1;
            if (currentVal > 1) {
                voteCountInput.value = currentVal - 1;
                updateVotePrice();
                toggleEmailRequirement();
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            const currentVal = parseInt(voteCountInput.value) || 1;
            voteCountInput.value = currentVal + 1;
            updateVotePrice();
            toggleEmailRequirement();
        });
    }
    
    // Set up voting form submission
    if (votingForm) {
        votingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const contestantId = contestantSelect.value;
            const voteCount = parseInt(voteCountInput.value) || 1;
            const email = emailInput.value;
            
            // Validate
            if (!contestantId || contestantId === "") {
                alert('Please select a contestant to vote for');
                return;
            }
            
            if (voteCount < 1) {
                alert('Please enter at least 1 vote');
                return;
            }
            
            if (voteCount >= 5 && (!email || email === "")) {
                alert('Email is required for 5 or more votes');
                return;
            }
            
            // Get contestant name for the confirmation modal
            const contestantOption = contestantSelect.options[contestantSelect.selectedIndex];
            const contestantName = contestantOption.text;
            
            // Update modal content
            document.getElementById('modal-contestant-name').textContent = contestantName;
            document.getElementById('modal-vote-count').textContent = voteCount;
            document.getElementById('modal-vote-total').textContent = (voteCount * 0.5).toFixed(2);
            
            // Store data for payment processing
            voteModal.dataset.contestantId = contestantId;
            voteModal.dataset.voteCount = voteCount;
            voteModal.dataset.email = email;
            
            // Show vote confirmation modal
            voteModal.style.display = 'flex';
        });
    }
    
    // Refresh voting data every 5 minutes
    setInterval(() => {
        showTopContestants();
        showVotesLeaderboard();
        updatePrizeFund();
    }, 5 * 60 * 1000);
});