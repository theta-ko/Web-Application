"""
Modified version of app.py for Vercel deployment
This file contains optimizations specific to serverless environments
"""

# Import standard modules
import os
import json
import logging
import datetime
import sys
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="VERCEL: %(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Try to import Firebase and other dependencies
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    from flask import Flask, render_template, redirect, url_for
except ImportError as e:
    logging.error(f"Failed to import required modules: {e}")
    sys.exit(1)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "smallie-vercel-secret-key")

# Initialize Firebase with enhanced robustness for production
db = None
try:
    # Check if running on Vercel
    is_vercel = os.environ.get("VERCEL_DEPLOYMENT") == "1"
    logging.info(f"Running on Vercel environment: {is_vercel}")
    
    # Get Firebase credentials from environment variable
    firebase_creds_json = os.environ.get("FIREBASE_CREDENTIALS")
    
    if firebase_creds_json:
        try:
            cred_dict = None
            # Try multiple credential formats with robust error handling
            
            # 1. First try: base64-encoded JSON (recommended for Vercel)
            try:
                import base64
                decoded_creds = base64.b64decode(firebase_creds_json).decode("utf-8")
                cred_dict = json.loads(decoded_creds)
                logging.info("Successfully decoded base64 Firebase credentials")
            except Exception as base64_err:
                logging.error(f"Failed to decode base64 credentials: {base64_err}")
                
                # 2. Second try: direct JSON string
                try:
                    cred_dict = json.loads(firebase_creds_json)
                    logging.info("Successfully parsed Firebase credentials as JSON string")
                except Exception as json_err:
                    logging.error(f"Failed to parse JSON credentials: {json_err}")
                    
                    # 3. Third try: filesystem path
                    try:
                        if os.path.exists(firebase_creds_json):
                            with open(firebase_creds_json, 'r') as f:
                                cred_dict = json.load(f)
                            logging.info(f"Loaded Firebase credentials from file: {firebase_creds_json}")
                    except Exception as file_err:
                        logging.error(f"Failed to load credentials from file: {file_err}")
            
            # If we have valid credentials, try to initialize Firebase
            if cred_dict:
                # Ensure we don't reinitialize Firebase if already initialized
                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    logging.info("Firebase app initialized with credentials")
                else:
                    logging.info("Firebase app already initialized")
                
                # Get Firestore client
                db = firestore.client()
                logging.info("Firebase Firestore client created successfully")
            else:
                logging.error("Could not parse Firebase credentials from any source")
                
                # In production, we'll create a minimal credential for demo mode
                if is_vercel:
                    firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID", "demo-project")
                    logging.warning(f"Creating minimal demo credentials for project: {firebase_project_id}")
                    
                    # Create a minimal credential for demo mode (will not work for real Firebase operations)
                    demo_creds = {
                        "type": "service_account",
                        "project_id": firebase_project_id,
                        "private_key_id": "demo",
                        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDQnFkm1qxaJjkN\nTWQUA1KnhkuNgI8Y\n-----END PRIVATE KEY-----\n",
                        "client_email": f"firebase-adminsdk@{firebase_project_id}.iam.gserviceaccount.com",
                        "client_id": "123456789",
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                        "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40{firebase_project_id}.iam.gserviceaccount.com"
                    }
                    
                    try:
                        if not firebase_admin._apps:
                            cred = credentials.Certificate(demo_creds)
                            firebase_admin.initialize_app(cred)
                            logging.warning("Firebase initialized with demo credentials (limited functionality)")
                        # We won't try to create db here as it will likely fail
                    except Exception as demo_err:
                        logging.error(f"Failed to initialize Firebase with demo credentials: {demo_err}")
        except Exception as e:
            logging.error(f"Error initializing Firebase: {e}")
    else:
        # Handle the case where credentials aren't provided
        logging.error("FIREBASE_CREDENTIALS not found in environment variables")
        
        # Create a minimal demo environment if on Vercel
        if is_vercel:
            firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID", "demo-project")
            logging.warning(f"Creating minimal demo environment for project: {firebase_project_id}")
            # We don't try to initialize Firebase here, but could set up mock data
            
except Exception as e:
    logging.error(f"Unexpected error initializing Firebase: {e}")
    logging.error(traceback.format_exc())

# Log app status
if db is not None:
    logging.info("✅ Firebase Firestore connected and ready for use")
else:
    logging.warning("⚠️ Running in local data mode - Firestore connection not available")

# Log Firebase environment variables (without revealing sensitive data)
logging.info(f"Firebase Project ID: {os.environ.get('FIREBASE_PROJECT_ID', 'Not Set')}")
logging.info(f"Firebase App ID available: {'Yes' if os.environ.get('FIREBASE_APP_ID') else 'No'}")
logging.info(f"Firebase API Key available: {'Yes' if os.environ.get('FIREBASE_API_KEY') else 'No'}")

# Import the routes and other components from the main app
from app import get_current_task, get_hardcoded_task, index, admin

# Add a simple health check endpoint for Vercel
@app.route("/api/health")
def health_check():
    """Simple health check for Vercel"""
    return {"status": "healthy", "timestamp": datetime.datetime.now().isoformat()}