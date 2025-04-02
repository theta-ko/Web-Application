/**
 * Smallie Payment Integration Module
 * 
 * This module provides integration with payment providers:
 * 1. Flutterwave for traditional payment processing
 * 2. Solana blockchain for cryptocurrency payments
 */

// Initialize payment processing systems
const FLUTTERWAVE_PUBLIC_KEY = window.FLUTTERWAVE_PUBLIC_KEY || '';
const SOLANA_PROJECT_ID = window.SOLANA_PROJECT_ID || '';

// Check if payment credentials are available
const paymentsEnabled = !!(FLUTTERWAVE_PUBLIC_KEY || SOLANA_PROJECT_ID);

// Payment processing state
let paymentInProgress = false;
let paymentSuccessCallback = null;

/**
 * Process a vote payment with Flutterwave
 * 
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.email - Customer email
 * @param {string} paymentData.phone - Customer phone (optional)
 * @param {string} paymentData.name - Customer name (optional)
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.contestantName - Name of the contestant being voted for
 * @param {number} paymentData.voteCount - Number of votes being purchased
 * @param {Function} onSuccess - Callback function on successful payment
 */
function processFlutterwavePayment(paymentData, onSuccess) {
    if (paymentInProgress) {
        console.warn('Payment already in progress');
        return;
    }
    
    if (!FLUTTERWAVE_PUBLIC_KEY) {
        console.error('Flutterwave public key not available');
        alert('Payment system is currently unavailable. Please try again later.');
        return;
    }
    
    paymentInProgress = true;
    paymentSuccessCallback = onSuccess;
    
    try {
        // Configure payment
        const config = {
            public_key: FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: 'smallie-' + Date.now(),
            amount: paymentData.amount,
            currency: 'USD',
            payment_options: 'card,mobilemoney,ussd',
            customer: {
                email: paymentData.email,
                phone_number: paymentData.phone || '',
                name: paymentData.name || paymentData.email.split('@')[0]
            },
            customizations: {
                title: "Smallie Votes",
                description: `${paymentData.voteCount} votes for ${paymentData.contestantName}`,
                logo: "https://cdn.jsdelivr.net/gh/athalye-jay/smallie-assets@main/logo.png"
            },
            callback: function(response) {
                paymentInProgress = false;
                
                // Verify the transaction status
                if (response.status === "successful") {
                    console.log("Payment successful:", response);
                    
                    // Record the transaction details in localStorage for demo purposes
                    recordTransaction({
                        provider: 'flutterwave',
                        tx_ref: response.tx_ref,
                        transaction_id: response.transaction_id,
                        amount: paymentData.amount,
                        voteCount: paymentData.voteCount,
                        contestantName: paymentData.contestantName,
                        email: paymentData.email,
                        status: 'successful',
                        timestamp: new Date().toISOString()
                    });
                    
                    // Call the success callback
                    if (paymentSuccessCallback) {
                        paymentSuccessCallback();
                    }
                } else {
                    console.error("Payment failed:", response);
                    alert("Payment failed. Please try again.");
                }
            },
            onclose: function() {
                paymentInProgress = false;
                console.log("Payment modal closed");
            }
        };
        
        // Initialize and open Flutterwave payment
        if (typeof FlutterwaveCheckout === 'function') {
            FlutterwaveCheckout(config);
        } else {
            console.error('Flutterwave SDK not loaded');
            alert('Payment system is currently unavailable. Please try again later.');
            paymentInProgress = false;
        }
    } catch (error) {
        console.error('Error initializing Flutterwave payment:', error);
        alert('There was an error initializing the payment. Please try again.');
        paymentInProgress = false;
    }
}

/**
 * Process a vote payment with Solana
 * 
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.email - Customer email
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.contestantName - Name of the contestant being voted for
 * @param {number} paymentData.voteCount - Number of votes being purchased
 * @param {Function} onSuccess - Callback function on successful payment
 */
async function processSolanaPayment(paymentData, onSuccess) {
    if (paymentInProgress) {
        console.warn('Payment already in progress');
        return;
    }
    
    if (!SOLANA_PROJECT_ID) {
        console.error('Solana project ID not available');
        alert('Solana payment is currently unavailable. Please try again later.');
        return;
    }
    
    paymentInProgress = true;
    paymentSuccessCallback = onSuccess;
    
    try {
        // Check if Solana Web3 is available
        if (typeof solanaWeb3 === 'undefined') {
            throw new Error('Solana Web3 SDK not loaded');
        }
        
        // For demo purposes, we'll simulate a successful Solana transaction
        console.log('Simulating Solana payment for demo purposes');
        
        // Generate a mock transaction ID
        const mockTxId = 'solana' + Math.random().toString(36).substring(2, 15);
        
        // Show a loading message
        alert('Connecting to Solana wallet... (Demo Mode)');
        
        // Simulate async processing
        setTimeout(() => {
            // Record the transaction in localStorage
            recordTransaction({
                provider: 'solana',
                tx_id: mockTxId,
                amount: paymentData.amount,
                voteCount: paymentData.voteCount,
                contestantName: paymentData.contestantName,
                email: paymentData.email,
                status: 'successful',
                timestamp: new Date().toISOString()
            });
            
            paymentInProgress = false;
            
            // Call the success callback
            if (paymentSuccessCallback) {
                paymentSuccessCallback();
            }
        }, 2000);
    } catch (error) {
        console.error('Error processing Solana payment:', error);
        alert('There was an error initializing the Solana payment. Please try regular payment instead.');
        paymentInProgress = false;
    }
}

/**
 * Record transaction details for demo purposes
 * 
 * @param {Object} transaction - Transaction details
 */
function recordTransaction(transaction) {
    try {
        // Get existing transactions
        const transactions = JSON.parse(localStorage.getItem('smallie_transactions') || '[]');
        
        // Add new transaction
        transactions.push(transaction);
        
        // Save updated transactions
        localStorage.setItem('smallie_transactions', JSON.stringify(transactions));
        
        console.log('Transaction recorded:', transaction);
    } catch (error) {
        console.error('Error recording transaction:', error);
    }
}

/**
 * Get all recorded transactions for demo purposes
 * 
 * @returns {Array} Array of transaction objects
 */
function getTransactions() {
    try {
        return JSON.parse(localStorage.getItem('smallie_transactions') || '[]');
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
}

/**
 * Update the prize fund display based on transactions
 * This function calculates the current prize fund from recorded transactions
 * 
 * @param {string} [displayElementId="prize-fund-display"] - ID of the element to update
 * @returns {number} The current prize fund amount
 */
function updatePrizeFund(displayElementId = "prize-fund-display") {
    try {
        // Get all transactions
        const transactions = getTransactions();
        
        // Calculate total amount
        const totalAmount = transactions.reduce((sum, tx) => {
            return sum + (typeof tx.amount === 'number' ? tx.amount : 0);
        }, 0);
        
        // 90% goes to prize fund
        const prizeFund = totalAmount * 0.9;
        
        // Get the element and update it
        const displayElement = document.getElementById(displayElementId);
        if (displayElement) {
            displayElement.textContent = '₦' + (prizeFund * 480).toFixed(0); // Converting USD to NGN at ₦480/$1
        }
        
        return prizeFund;
    } catch (error) {
        console.error('Error updating prize fund:', error);
        return 0;
    }
}

// Initialize prize fund on page load
document.addEventListener('DOMContentLoaded', () => {
    updatePrizeFund();
});

// Expose payment functions globally
window.processFlutterwavePayment = processFlutterwavePayment;
window.processSolanaPayment = processSolanaPayment;
window.getTransactions = getTransactions;
window.updatePrizeFund = updatePrizeFund;

// Export module functions
export { 
    processFlutterwavePayment, 
    processSolanaPayment, 
    getTransactions,
    updatePrizeFund
};