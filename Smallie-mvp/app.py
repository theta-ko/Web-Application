import os
import json
import logging
import datetime
import sys

# Import Flask components
from flask import Flask, render_template

# Import Firebase components
import firebase_admin
from firebase_admin import credentials, firestore

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "smallie-dev-secret-key")

# Initialize Firebase with proper credentials
db = None
try:
    # Run fix_credentials script first to ensure we have proper credentials
    try:
        # Try to import fix_credentials from root directory
        sys.path.append('..')
        import fix_credentials
        fix_credentials.fix_credentials()
        logging.info("Successfully ran fix_credentials to prepare Firebase credentials")
    except ImportError:
        # If not available as import, try to create credentials directly
        credentials_path = os.path.join("temp", "firebase-credentials.json")
        
        if not os.path.exists(credentials_path):
            os.makedirs("temp", exist_ok=True)
            firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID")
            
            # Create a minimal valid credentials file
            default_creds = {
                "type": "service_account",
                "project_id": firebase_project_id,
                "private_key_id": "example",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+Z2mi9PwFnPM9\nJoNfQOtBMGGV7A7o6kGZm7rEYJQGZ2RVQGUs0AVR6TzQO6QAmYchIU8PoYUljEMN\n-----END PRIVATE KEY-----\n",
                "client_email": f"firebase-adminsdk@{firebase_project_id}.iam.gserviceaccount.com",
                "client_id": "123456789",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40{firebase_project_id}.iam.gserviceaccount.com"
            }
            
            with open(credentials_path, "w") as f:
                json.dump(default_creds, f, indent=2)
                
            logging.info(f"Created default credentials file at {credentials_path}")
    
    # Try to initialize Firebase with the credentials file
    credentials_path = os.path.join("temp", "firebase-credentials.json")
    
    if os.path.exists(credentials_path):
        try:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            logging.info(f"Successfully initialized Firebase with credentials from {credentials_path}")
        except Exception as e:
            logging.error(f"Error initializing Firebase with credentials file: {str(e)}")
            logging.warning("Falling back to demo mode with local data")
    else:
        logging.warning("Credentials file not found, using demo mode with local data")
except Exception as e:
    logging.error(f"Error in Firebase initialization: {str(e)}")
    logging.warning("Using demo mode with local data (Firebase integration disabled)")

# Store Firebase client credentials for client-side use
firebase_api_key = os.environ.get("FIREBASE_API_KEY", "")
firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID", "")
firebase_app_id = os.environ.get("FIREBASE_APP_ID", "")

# Log Firebase environment variables (without revealing sensitive data)
logging.info(f"Firebase Project ID: {os.environ.get('FIREBASE_PROJECT_ID', 'Not Set')}")
logging.info(f"Firebase App ID available: {'Yes' if os.environ.get('FIREBASE_APP_ID') else 'No'}")
logging.info(f"Firebase API Key available: {'Yes' if os.environ.get('FIREBASE_API_KEY') else 'No'}")

# Function to initialize the daily tasks in Firebase if they don't exist
def init_daily_tasks():
    if db is None:
        return
    
    # Check if tasks collection exists
    tasks_ref = db.collection('tasks')
    tasks = tasks_ref.get()
    
    # If there are no tasks, add the initial ones
    if len(list(tasks)) == 0:
        logging.info("Initializing daily tasks in Firebase")
        
        daily_tasks = [
            {
                "day": 1,
                "date": "2025-04-15",
                "title": "Naija Throwback Dance Challenge",
                "description": "60-second dance to a classic hit (e.g., P-Square)",
                "release_time": "09:00 WAT",
                "voting_close_time": "21:00 WAT"
            },
            {
                "day": 2,
                "date": "2025-04-16",
                "title": "Jollof Wars: Cook-Off Edition",
                "description": "Cook jollof with ₦500 in 10 minutes, taste it",
                "release_time": "09:00 WAT",
                "voting_close_time": "21:00 WAT"
            },
            {
                "day": 3,
                "date": "2025-04-17",
                "title": "Nollywood Skit Showdown",
                "description": "2-minute Nollywood skit (e.g., Cheating Husband)",
                "release_time": "09:00 WAT",
                "voting_close_time": "21:00 WAT"
            },
            {
                "day": 4,
                "date": "2025-04-18",
                "title": "Afrobeat Freestyle Face-Off",
                "description": "1-minute freestyle on a trending beat (e.g., Burna Boy)",
                "release_time": "09:00 WAT",
                "voting_close_time": "21:00 WAT"
            },
            {
                "day": 5,
                "date": "2025-04-19",
                "title": "Owambe Fashion Flex",
                "description": "Style an owambe outfit from home, 90-second catwalk",
                "release_time": "09:00 WAT",
                "voting_close_time": "21:00 WAT"
            },
            {
                "day": 6,
                "date": "2025-04-20",
                "title": "Pidgin Proverbs Remix",
                "description": "60-second pidgin skit/song from a proverb (e.g., Monkey no fine...)",
                "release_time": "09:00 WAT",
                "voting_close_time": "21:00 WAT"
            },
            {
                "day": 7,
                "date": "2025-04-21",
                "title": "Lagos Hustle Pitch",
                "description": "3-minute pitch as Smallie winner",
                "release_time": "09:00 WAT",
                "voting_close_time": "21:00 WAT"
            }
        ]
        
        # Add tasks to Firestore
        for task in daily_tasks:
            tasks_ref.document(f"day_{task['day']}").set(task)
            
        logging.info("Daily tasks initialized in Firebase")

# Try to initialize daily tasks
try:
    init_daily_tasks()
except Exception as e:
    logging.error(f"Error initializing daily tasks: {e}")

# Function to get the current day's task
def get_current_task():
    # For demo purposes, calculate the competition day based on current date
    # Competition runs from April 15 to April 21, 2025
    today = datetime.datetime.now()
    
    # For development/testing, using a fixed date in the competition period
    # Uncomment the line below to use the real date
    # today = datetime.datetime(2025, 4, 17)  # Day 3
    
    start_date = datetime.datetime(2025, 4, 15)
    end_date = datetime.datetime(2025, 4, 21)
    
    # Calculate current day (1-7)
    if today < start_date:
        # Before competition
        current_day = 0
        task = {"title": "Competition starts soon", "description": "Stay tuned for Day 1!", "day": 0}
    elif today > end_date:
        # After competition
        current_day = 8
        task = {"title": "Competition has ended", "description": "Thanks for participating!", "day": 8}
    else:
        # During competition
        delta = today - start_date
        current_day = delta.days + 1
        
        # Try to get task from Firebase
        if db is not None:
            try:
                task_doc = db.collection('tasks').document(f"day_{current_day}").get()
                if task_doc.exists:
                    task = task_doc.to_dict()
                else:
                    # Fallback to hardcoded task if document doesn't exist
                    task = get_hardcoded_task(current_day)
            except Exception as e:
                logging.error(f"Error fetching task from Firebase: {e}")
                task = get_hardcoded_task(current_day)
        else:
            # Fallback to hardcoded task if Firebase is not available
            task = get_hardcoded_task(current_day)
    
    return current_day, task

# Fallback function to get hardcoded tasks if Firebase is not available
def get_hardcoded_task(day):
    tasks = [
        {
            "day": 1,
            "title": "Naija Throwback Dance Challenge",
            "description": "60-second dance to a classic hit (e.g., P-Square)",
            "release_time": "09:00 WAT",
            "voting_close_time": "21:00 WAT"
        },
        {
            "day": 2,
            "title": "Jollof Wars: Cook-Off Edition",
            "description": "Cook jollof with ₦500 in 10 minutes, taste it",
            "release_time": "09:00 WAT",
            "voting_close_time": "21:00 WAT"
        },
        {
            "day": 3,
            "title": "Nollywood Skit Showdown",
            "description": "2-minute Nollywood skit (e.g., Cheating Husband)",
            "release_time": "09:00 WAT",
            "voting_close_time": "21:00 WAT"
        },
        {
            "day": 4,
            "title": "Afrobeat Freestyle Face-Off",
            "description": "1-minute freestyle on a trending beat (e.g., Burna Boy)",
            "release_time": "09:00 WAT",
            "voting_close_time": "21:00 WAT"
        },
        {
            "day": 5,
            "title": "Owambe Fashion Flex",
            "description": "Style an owambe outfit from home, 90-second catwalk",
            "release_time": "09:00 WAT",
            "voting_close_time": "21:00 WAT"
        },
        {
            "day": 6,
            "title": "Pidgin Proverbs Remix",
            "description": "60-second pidgin skit/song from a proverb (e.g., Monkey no fine...)",
            "release_time": "09:00 WAT",
            "voting_close_time": "21:00 WAT"
        },
        {
            "day": 7,
            "title": "Lagos Hustle Pitch",
            "description": "3-minute pitch as Smallie winner",
            "release_time": "09:00 WAT",
            "voting_close_time": "21:00 WAT"
        }
    ]
    
    return tasks[day-1] if 1 <= day <= 7 else {"title": "No task available", "description": "Check back later"}

@app.route('/')
def index():
    """Render the homepage"""
    # Mock data for contestants
    contestants = [
        {
            "id": 1,
            "name": "Adebola Johnson", 
            "age": 25,
            "location": "Lagos",
            "bio": "Content creator and aspiring actor with a passion for storytelling.",
            "votes": 245,
            "image_url": "https://images.unsplash.com/photo-1522327646852-4e28586a40dd",
            "stream_url": "https://www.youtube.com/watch?v=example1",
            "eliminated": False
        },
        {
            "id": 2,
            "name": "Chioma Okafor",
            "age": 23,
            "location": "Abuja",
            "bio": "Fashion designer and lifestyle vlogger sharing Nigerian culture.",
            "votes": 312,
            "image_url": "https://images.unsplash.com/photo-1659540517934-cba43fc64ded",
            "stream_url": "https://www.youtube.com/watch?v=example2",
            "eliminated": False
        },
        {
            "id": 3,
            "name": "Emeka Nwosu",
            "age": 28,
            "location": "Port Harcourt",
            "bio": "Music producer who loves to create fusion of afrobeats and jazz.",
            "votes": 189,
            "image_url": "https://images.unsplash.com/photo-1589707181684-24a34853641d",
            "stream_url": "",
            "eliminated": False
        },
        {
            "id": 4,
            "name": "Folake Ade",
            "age": 24,
            "location": "Ibadan",
            "bio": "Dancer and choreographer with unique Afro-contemporary moves.",
            "votes": 278,
            "image_url": "https://images.unsplash.com/photo-1659540517163-e9a29f4d1251",
            "stream_url": "https://www.youtube.com/watch?v=example4",
            "eliminated": False
        },
        {
            "id": 5,
            "name": "Tunde Bakare",
            "age": 26,
            "location": "Kano",
            "bio": "Tech enthusiast and gaming streamer building a Nigerian gaming community.",
            "votes": 201,
            "image_url": "https://images.unsplash.com/photo-1495434942214-9b525bba74e9",
            "stream_url": "https://www.twitch.tv/example5",
            "eliminated": False
        },
        {
            "id": 6,
            "name": "Ngozi Eze",
            "age": 22,
            "location": "Enugu",
            "bio": "Makeup artist and beauty influencer creating unique Nigerian looks.",
            "votes": 267,
            "image_url": "https://images.unsplash.com/photo-1523365280197-f1783db9fe62",
            "stream_url": "",
            "eliminated": False
        },
        {
            "id": 7,
            "name": "Ibrahim Yusuf",
            "age": 27,
            "location": "Kaduna",
            "bio": "Stand-up comedian bringing laughter and social commentary.",
            "votes": 234,
            "image_url": "https://images.unsplash.com/photo-1528820184586-dd0d858b7254",
            "stream_url": "https://www.youtube.com/watch?v=example7",
            "eliminated": False
        },
        {
            "id": 8,
            "name": "Amara Obi",
            "age": 25,
            "location": "Owerri",
            "bio": "Culinary enthusiast showcasing modern Nigerian cuisine.",
            "votes": 156,
            "image_url": "https://images.unsplash.com/photo-1632215861513-130b66fe97f4",
            "stream_url": "",
            "eliminated": True
        },
        {
            "id": 9,
            "name": "Dayo Adeleke",
            "age": 29,
            "location": "Abeokuta",
            "bio": "Fitness trainer promoting healthy living with African exercises.",
            "votes": 198,
            "image_url": "https://images.unsplash.com/photo-1543234723-b70b104d8e25",
            "stream_url": "https://www.youtube.com/watch?v=example9",
            "eliminated": True
        },
        {
            "id": 10,
            "name": "Fatima Bello",
            "age": 24,
            "location": "Sokoto",
            "bio": "Traditional storyteller bringing Nigerian folklore to modern audiences.",
            "votes": 222,
            "image_url": "https://images.unsplash.com/photo-1539414785349-55cfff23f5b9",
            "stream_url": "https://www.youtube.com/watch?v=example10",
            "eliminated": False
        }
    ]

    # Try to get contestants from Firebase if available
    if db is not None:
        try:
            contestants_ref = db.collection('contestants')
            contestants_docs = contestants_ref.get()
            
            # If we have contestants in Firebase, use them instead
            if len(list(contestants_docs)) > 0:
                firestore_contestants = [doc.to_dict() for doc in contestants_docs]
                # Only replace if we got valid data
                if len(firestore_contestants) > 0:
                    contestants = firestore_contestants
                    logging.info(f"Loaded {len(contestants)} contestants from Firestore")
            else:
                # Initialize Firebase with our mock data if empty
                for contestant in contestants:
                    contestants_ref.document(str(contestant['id'])).set(contestant)
                logging.info("Initialized contestants in Firestore")
        except Exception as e:
            logging.error(f"Error loading contestants from Firebase: {e}")
    
    # Get current day and task
    current_day, daily_task = get_current_task()
    
    # Get Firebase credentials from environment
    firebase_api_key = os.environ.get("FIREBASE_API_KEY", "")
    firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID", "")
    firebase_app_id = os.environ.get("FIREBASE_APP_ID", "")
    
    # Get payment credentials from environment
    flutterwave_public_key = os.environ.get("FLUTTERWAVE_PUBLIC_KEY", "")
    solana_project_id = os.environ.get("SOLANA_PROJECT_ID", "")

    return render_template(
        'index.html', 
        contestants=contestants, 
        daily_task=daily_task, 
        current_day=current_day,
        firebase_api_key=firebase_api_key,
        firebase_project_id=firebase_project_id,
        firebase_app_id=firebase_app_id,
        flutterwave_public_key=flutterwave_public_key,
        solana_project_id=solana_project_id
    )

@app.route('/admin')
def admin():
    """Render the admin dashboard"""
    # Get Firebase credentials from environment
    firebase_api_key = os.environ.get("FIREBASE_API_KEY", "")
    firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID", "")
    firebase_app_id = os.environ.get("FIREBASE_APP_ID", "")
    
    # Get payment credentials from environment
    flutterwave_public_key = os.environ.get("FLUTTERWAVE_PUBLIC_KEY", "")
    solana_project_id = os.environ.get("SOLANA_PROJECT_ID", "")

    return render_template(
        'admin.html',
        firebase_api_key=firebase_api_key,
        firebase_project_id=firebase_project_id,
        firebase_app_id=firebase_app_id,
        flutterwave_public_key=flutterwave_public_key,
        solana_project_id=solana_project_id
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
