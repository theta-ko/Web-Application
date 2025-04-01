/**
 * Smallie - Contestant Signup Module
 * Handles contestant application form and submission to Firebase
 */

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

// Get Firebase instances
const db = getFirestore();
const auth = getAuth();

// DOM elements
const applyContestantButtons = document.querySelectorAll('.apply-btn, .btn-apply');
const applicationModal = document.getElementById('application-modal');
const applicationForm = document.getElementById('application-form');
const closeModalButtons = document.querySelectorAll('.close');

// Function to validate form data
function validateFormData(formData) {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    if (!nameRegex.test(formData.name)) {
        return 'Please enter a valid name (2-50 characters, letters only)';
    }
    
    if (formData.bio.length < 10 || formData.bio.length > 200) {
        return 'Bio must be between 10 and 200 characters';
    }
    
    if (!emailRegex.test(formData.email)) {
        return 'Please enter a valid email address';
    }
    
    if (formData.streamUrl && !urlRegex.test(formData.streamUrl)) {
        return 'Please enter a valid URL for your stream link';
    }
    
    return null; // No errors
}

// Function to submit application to Firebase
async function submitApplication(formData) {
    try {
        // Get current user if logged in
        const user = auth.currentUser;
        
        // Add user ID if available
        if (user) {
            formData.userId = user.uid;
        }
        
        // Add additional metadata
        formData.status = 'pending';
        formData.createdAt = serverTimestamp();
        
        // Submit to Firebase
        const signupsCollection = collection(db, 'signups');
        const docRef = await addDoc(signupsCollection, formData);
        
        console.log('Application submitted with ID:', docRef.id);
        return true;
    } catch (error) {
        console.error('Error submitting application:', error);
        return false;
    }
}

// Event listener for opening the application modal
if (applyContestantButtons) {
    applyContestantButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (applicationModal) {
                applicationModal.style.display = 'flex';
            }
        });
    });
}

// Event listener for form submission
if (applicationForm) {
    applicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('app-name').value.trim(),
            email: document.getElementById('app-email').value.trim(),
            phone: document.getElementById('app-phone').value.trim(),
            location: document.getElementById('app-location').value.trim(),
            bio: document.getElementById('app-why').value.trim(),
            socialHandle: document.getElementById('app-social').value.trim(),
            experience: document.getElementById('app-experience').value.trim(),
            streamUrl: document.getElementById('app-stream').value.trim()
        };
        
        // Validate form data
        const validationError = validateFormData(formData);
        if (validationError) {
            alert(validationError);
            return;
        }
        
        // Submit application
        const success = await submitApplication(formData);
        
        if (success) {
            alert('Your application has been submitted successfully! It is now pending approval.');
            applicationModal.style.display = 'none';
            applicationForm.reset();
        } else {
            alert('There was an error submitting your application. Please try again.');
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if application form has stream URL field
    const streamUrlField = document.getElementById('app-stream');
    
    // If not, we need to add it
    if (applicationForm && !streamUrlField) {
        const socialField = document.querySelector('[for="app-social"]').parentNode;
        
        // Create new form group
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        // Create label
        const label = document.createElement('label');
        label.setAttribute('for', 'app-stream');
        label.textContent = 'Your Stream Link (if any)';
        
        // Create input
        const input = document.createElement('input');
        input.type = 'url';
        input.id = 'app-stream';
        input.name = 'stream';
        input.placeholder = 'https://yourstream.com/channel';
        
        // Append to form group
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        
        // Insert after social field
        socialField.parentNode.insertBefore(formGroup, socialField.nextSibling);
    }
});