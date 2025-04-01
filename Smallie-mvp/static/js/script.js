// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const header = document.querySelector('.header');
const voteCountInput = document.getElementById('vote-count');
const decreaseBtn = document.getElementById('decrease-votes');
const increaseBtn = document.getElementById('increase-votes');
const votePriceDisplay = document.getElementById('vote-price');
const accordionItems = document.querySelectorAll('.accordion-item');
const voteButtons = document.querySelectorAll('.btn-vote');
const contestantSelect = document.getElementById('contestant-select');
const votingForm = document.getElementById('voting-form');
const voteModal = document.getElementById('vote-modal');
const successModal = document.getElementById('success-modal');
const applicationModal = document.getElementById('application-modal');
const closeButtons = document.querySelectorAll('.close');
const confirmVoteBtn = document.getElementById('confirm-vote');
const cancelVoteBtn = document.getElementById('cancel-vote');
const modalVoteCount = document.getElementById('modal-vote-count');
const modalContestantName = document.getElementById('modal-contestant-name');
const modalVoteTotal = document.getElementById('modal-vote-total');
const joinContestantBtn = document.querySelector('.btn-secondary');
const applicationForm = document.getElementById('application-form');

// Mobile Menu Toggle
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        
        // Toggle between bars and X icon
        if (nav.classList.contains('active')) {
            menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}

// Header scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Vote counter functionality
if (decreaseBtn && increaseBtn && voteCountInput) {
    decreaseBtn.addEventListener('click', () => {
        let count = parseInt(voteCountInput.value);
        if (count > 1) {
            voteCountInput.value = count - 1;
            updateVotePrice();
        }
    });

    increaseBtn.addEventListener('click', () => {
        let count = parseInt(voteCountInput.value);
        voteCountInput.value = count + 1;
        updateVotePrice();
    });

    voteCountInput.addEventListener('change', updateVotePrice);
}

function updateVotePrice() {
    if (votePriceDisplay) {
        const count = parseInt(voteCountInput.value);
        const price = (count * 0.5).toFixed(2);
        const priceNGN = Math.round(count * 0.5 * 480); // NGN to USD rate (approximate)
        
        // Update price in USD
        votePriceDisplay.textContent = price;
        
        // Update price in NGN if element exists
        const voteNgnPriceSpan = document.getElementById('vote-price-ngn');
        if (voteNgnPriceSpan) {
            voteNgnPriceSpan.textContent = priceNGN;
        }
        
        // Update modal amounts if visible
        if (voteModal && voteModal.style.display === 'flex') {
            const modalVoteTotal = document.getElementById('modal-vote-total');
            const modalVoteTotalNgn = document.getElementById('modal-vote-total-ngn');
            
            if (modalVoteTotal) {
                modalVoteTotal.textContent = price;
            }
            
            if (modalVoteTotalNgn) {
                modalVoteTotalNgn.textContent = priceNGN;
            }
        }
    }
}

// Accordion functionality
accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    
    header.addEventListener('click', () => {
        // Close all other items
        accordionItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });
        
        // Toggle current item
        item.classList.toggle('active');
    });
});

// Voting functionality
if (voteButtons) {
    voteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const contestantId = e.target.dataset.id;
            const contestantCard = e.target.closest('.contestant-card');
            const contestantName = contestantCard.querySelector('h3').textContent;
            
            // Set the contestant in the voting form
            if (contestantSelect) {
                contestantSelect.value = contestantId;
            }
            
            // Scroll to voting section
            document.getElementById('voting').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Vote submission
if (votingForm) {
    votingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedContestant = contestantSelect.options[contestantSelect.selectedIndex].text;
        const contestantId = contestantSelect.value;
        const voteCount = parseInt(voteCountInput.value);
        const totalPrice = (voteCount * 0.5).toFixed(2);
        const totalPriceNGN = Math.round(voteCount * 0.5 * 480); // NGN to USD rate
        const email = document.getElementById('email').value;
        
        // Validate
        if (voteCount >= 5 && !email) {
            alert('Email is required for 5 or more votes');
            return;
        }
        
        // Update modal content
        modalVoteCount.textContent = voteCount;
        modalContestantName.textContent = selectedContestant;
        modalVoteTotal.textContent = totalPrice;
        
        // Update NGN price if element exists
        const modalVoteTotalNgn = document.getElementById('modal-vote-total-ngn');
        if (modalVoteTotalNgn) {
            modalVoteTotalNgn.textContent = totalPriceNGN;
        }
        
        // Store data for payment processing
        voteModal.dataset.contestantId = contestantId;
        voteModal.dataset.voteCount = voteCount;
        voteModal.dataset.email = email;
        
        // Show confirmation modal
        voteModal.style.display = 'flex';
    });
}

// Modal close buttons
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        voteModal.style.display = 'none';
        successModal.style.display = 'none';
        applicationModal.style.display = 'none';
    });
});

// Clicking outside modal to close
window.addEventListener('click', (e) => {
    if (e.target === voteModal) {
        voteModal.style.display = 'none';
    }
    if (e.target === successModal) {
        successModal.style.display = 'none';
    }
    if (e.target === applicationModal) {
        applicationModal.style.display = 'none';
    }
});

// Confirm vote
if (confirmVoteBtn) {
    confirmVoteBtn.addEventListener('click', () => {
        // Here we would send the vote to the server
        // For this demo, we'll just show success modal
        voteModal.style.display = 'none';
        
        // Show loading state for a moment
        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('loading-overlay');
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Processing your vote...</p>
        `;
        document.body.appendChild(loadingIndicator);
        
        // Simulate server request
        setTimeout(() => {
            document.body.removeChild(loadingIndicator);
            successModal.style.display = 'flex';
            
            // Update the vote count on the contestant card (for demo purposes)
            const contestantId = contestantSelect.value;
            const contestantCard = document.querySelector(`.contestant-card[data-contestant-id="${contestantId}"]`);
            if (contestantCard) {
                const votesBadge = contestantCard.querySelector('.votes-badge');
                const currentVotes = parseInt(votesBadge.textContent);
                const newVotes = currentVotes + parseInt(voteCountInput.value);
                votesBadge.textContent = `${newVotes} votes`;
            }
            
            // Reset form
            votingForm.reset();
            voteCountInput.value = 1;
            updateVotePrice();
        }, 1500);
    });
}

// Cancel vote
if (cancelVoteBtn) {
    cancelVoteBtn.addEventListener('click', () => {
        voteModal.style.display = 'none';
    });
}

// Join as Contestant button
if (joinContestantBtn) {
    joinContestantBtn.addEventListener('click', () => {
        applicationModal.style.display = 'flex';
    });
}

// Application form submission
if (applicationForm) {
    applicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Here we would send the application to the server
        // For this demo, we'll just acknowledge submission
        
        // Show loading state
        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('loading-overlay');
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Submitting your application...</p>
        `;
        document.body.appendChild(loadingIndicator);
        
        // Simulate server request
        setTimeout(() => {
            document.body.removeChild(loadingIndicator);
            applicationModal.style.display = 'none';
            
            // Show confirmation alert
            alert('Thank you for your application! We will review it and contact you shortly.');
            
            // Reset form
            applicationForm.reset();
        }, 1500);
    });
}

// Countdown timer for daily task
function updateCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    
    const timeRemaining = midnight - now;
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

// Initialize countdown
updateCountdown();
setInterval(updateCountdown, 1000);

// Add CSS for loading state
const loadingStyle = document.createElement('style');
loadingStyle.innerHTML = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        color: white;
    }
    
    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: var(--red);
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 20px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(loadingStyle);

// Payment Button Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Setup payment buttons
    const payFlutterwaveBtn = document.getElementById('pay-flutterwave');
    const paySolanaBtn = document.getElementById('pay-solana');
    
    if (payFlutterwaveBtn) {
        payFlutterwaveBtn.addEventListener('click', () => {
            const voteModal = document.getElementById('vote-modal');
            const contestantId = voteModal.dataset.contestantId;
            const voteCount = parseInt(voteModal.dataset.voteCount);
            const email = voteModal.dataset.email;
            
            // Get contestant name from the modal display
            const contestantName = document.getElementById('modal-contestant-name').textContent;
            
            // Calculate amount (each vote is $0.50)
            const amount = voteCount * 0.50;
            
            if (typeof window.processFlutterwavePayment === 'function') {
                const paymentData = {
                    email: email,
                    amount: amount,
                    contestantName: contestantName,
                    voteCount: voteCount
                };
                
                // Define success callback
                const onSuccess = () => {
                    // Show success message
                    voteModal.style.display = 'none';
                    const successModal = document.getElementById('success-modal');
                    successModal.style.display = 'flex';
                };
                
                // Process payment
                window.processFlutterwavePayment(paymentData, onSuccess);
            } else {
                console.error('processFlutterwavePayment function not found');
                alert('Payment system is not available at the moment. Please try again later.');
            }
        });
    }
    
    if (paySolanaBtn) {
        paySolanaBtn.addEventListener('click', () => {
            const voteModal = document.getElementById('vote-modal');
            const contestantId = voteModal.dataset.contestantId;
            const voteCount = parseInt(voteModal.dataset.voteCount);
            const email = voteModal.dataset.email;
            
            // Get contestant name from the modal display
            const contestantName = document.getElementById('modal-contestant-name').textContent;
            
            // Calculate amount (each vote is $0.50)
            const amount = voteCount * 0.50;
            
            if (typeof window.processSolanaPayment === 'function') {
                const paymentData = {
                    email: email,
                    amount: amount,
                    contestantName: contestantName,
                    voteCount: voteCount
                };
                
                // Define success callback
                const onSuccess = () => {
                    // Show success message
                    voteModal.style.display = 'none';
                    const successModal = document.getElementById('success-modal');
                    successModal.style.display = 'flex';
                };
                
                // Process payment
                window.processSolanaPayment(paymentData, onSuccess);
            } else {
                console.error('processSolanaPayment function not found');
                alert('Crypto payment system is not available at the moment. Please try regular payment.');
            }
        });
    }
});
