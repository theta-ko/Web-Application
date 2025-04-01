# Smallie - Nigeria's Premier Live Streaming Competition

A 7-day Nigerian livestreaming competition platform featuring 10 contestants competing in daily Nigerian-themed challenges. This platform enables real-time contestant interactions, voting, and comprehensive administrative management.

## 🚀 Latest Updates (April 2025)

- Enhanced Firebase integration with robust fallback mechanisms
- Improved error handling in serverless functions for Vercel deployment
- Fixed "function invocation" and "serverless function crashed" errors
- Added detailed deployment troubleshooting guide
- Optimized client-side Firebase initialization
- Added support for both base64 and file-based Firebase credentials

## Features

- Mobile-first, single-page web application
- Daily Nigerian-themed challenges (April 15-21, 2025)
- Real-time voting system ($0.50 per vote)
- Contestant profiles with live streaming integration
- Administrative dashboard for competition management
- Flutterwave and Solana payment integration
- Daily eliminations based on voting results
- Transparent prize pool distribution

## Technologies Used

- Backend: Python/Flask
- Database: Firebase Firestore
- Authentication: Firebase Auth
- Frontend: Vanilla JavaScript, HTML, CSS
- Payment Processing: Flutterwave (fiat), Solana (crypto)

## Deployment Instructions

### Vercel Deployment

1. Fork or clone this repository
2. Create a Vercel account and connect it to your GitHub account
3. Create a new project in Vercel and select this repository
4. Configure the following environment variables in Vercel:
   - `FIREBASE_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_CREDENTIALS` (Base64 encoded service account key)
   - `FLUTTERWAVE_PUBLIC_KEY`
   - `FLUTTERWAVE_SECRET_KEY`
   - `SOLANA_PROJECT_ID`
5. Deploy the application

### Firebase Setup

1. Create a Firebase project in the Firebase Console
2. Enable Authentication (Google Sign-in)
3. Create a Firestore database
4. Add your deployed domain to the Authorized Domains list
5. Generate a service account key and use it for the `FIREBASE_CREDENTIALS` environment variable

## Running Locally

1. Clone the repository
2. Install dependencies: `pip install -r requirements-vercel.txt`
3. Set up required environment variables
4. Run the application: `python main.py`

## Project Structure

- `/templates` - HTML templates
- `/static` - CSS, JavaScript, and static assets
- `/static/js` - Modular JavaScript functionality
- `app.py` - Main application logic
- `main.py` - Application entry point
- `vercel.json` - Vercel deployment configuration

## Contest Rules & Schedule

- Daily tasks announced at 9 AM WAT
- Voting open from 9 AM to 9 PM WAT daily
- Lowest vote-getter eliminated each day
- 9% of votes go to contestants daily, 1% to platform, 90% to prize pool
- Winner on Day 7 receives 90% of total prize pool

### Daily Tasks (April 15-21, 2025)
- Day 1: Naija Throwback Dance Challenge
- Day 2: Jollof Wars Cook-Off
- Day 3: Nollywood Skit Showdown
- Day 4: Afrobeat Freestyle Face-Off
- Day 5: Owambe Fashion Flex
- Day 6: Pidgin Proverbs Remix
- Day 7: Lagos Hustle Pitch