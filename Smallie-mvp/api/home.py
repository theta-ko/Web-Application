"""
Home page handler for the Smallie application on Vercel

This function acts as a bridge between Vercel's serverless functions
and our Flask application's home page.
"""

import os
import sys
import json
import traceback
from http.server import BaseHTTPRequestHandler

# Add the parent directory to the path
root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_path)

# Try to import app_vercel for a more dynamic page if possible
try:
    from app_vercel import app as flask_app
    HAS_FLASK_APP = True
    print("Successfully imported Flask app in home.py")
except Exception as e:
    print(f"Could not import Flask app in home.py: {e}")
    traceback.print_exc()
    HAS_FLASK_APP = False

# Helper function to get the HTML content for the homepage
def get_home_html():
    """Return the HTML content for the homepage"""
    
    # Get Firebase variables for the client-side
    firebase_api_key = os.environ.get('FIREBASE_API_KEY', '')
    firebase_project_id = os.environ.get('FIREBASE_PROJECT_ID', '')
    firebase_app_id = os.environ.get('FIREBASE_APP_ID', '')
    flutterwave_public_key = os.environ.get('FLUTTERWAVE_PUBLIC_KEY', '')
    solana_project_id = os.environ.get('SOLANA_PROJECT_ID', '')
    
    # Build HTML with environment variables injected
    return f"""<!DOCTYPE html>
<html>
<head>
    <title>Smallie - Nigeria's Premier Livestreaming Competition</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
    
    <!-- Firebase Config -->
    <script type="text/javascript">
        // Make the Firebase credentials available to the client-side scripts
        window.FIREBASE_API_KEY = "{firebase_api_key}";
        window.FIREBASE_PROJECT_ID = "{firebase_project_id}";
        window.FIREBASE_APP_ID = "{firebase_app_id}";
        
        // Payment credentials
        window.FLUTTERWAVE_PUBLIC_KEY = "{flutterwave_public_key}";
        window.SOLANA_PROJECT_ID = "{solana_project_id}";
    </script>
    
    <style>
        body {{
            font-family: 'Playfair Display', 'Lato', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #000000;
            margin: 0;
            padding: 0;
            background-color: #FFFFFF;
        }}
        header {{
            background-color: #D32F2F;
            color: #FFFFFF;
            padding: 20px;
            text-align: center;
        }}
        h1 {{
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            margin: 0;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }}
        .message {{
            background-color: #f8f9fa;
            border-left: 4px solid #D32F2F;
            padding: 15px;
            margin: 20px 0;
        }}
        .success {{
            color: #28a745;
            font-weight: bold;
        }}
        .section {{
            margin: 40px 0;
        }}
        .env-info {{
            background-color: #f1f1f1;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            margin-top: 20px;
        }}
        .footer {{
            text-align: center;
            margin-top: 50px;
            padding: 20px;
            border-top: 1px solid #eee;
            font-size: 0.9rem;
        }}
    </style>
</head>
<body>
    <header>
        <h1>Smallie</h1>
        <p>Nigeria's Premier Livestreaming Competition</p>
    </header>
    
    <div class="container">
        <div class="message">
            <p class="success">✓ Your Vercel deployment is working correctly</p>
            <p>This version of the Smallie application is running in serverless mode.</p>
        </div>
        
        <div class="section">
            <h2>Daily Challenge</h2>
            <p>Each day from April 15-21, 2025, contestants complete a new Nigerian-themed challenge.</p>
            <p>Today's challenge: <strong>Nollywood Skit Showdown</strong></p>
            <p>2-minute Nollywood skit (e.g., Cheating Husband)</p>
        </div>
        
        <div class="section">
            <h2>Contestants</h2>
            <p>10 talented Nigerian content creators competing for the grand prize</p>
        </div>
        
        <div class="section">
            <h2>How It Works</h2>
            <ul>
                <li>Daily tasks released at 9 AM WAT</li>
                <li>Voting closes at 9 PM WAT each day</li>
                <li>The contestant with the lowest votes is eliminated daily</li>
                <li>Votes cost $0.50 each</li>
                <li>9% of vote revenue goes to contestants, 1% to platform, 90% to final prize pool</li>
            </ul>
        </div>
        
        <div class="env-info">
            <h3>Environment Status</h3>
            <ul>
                <li>Firebase Project ID: {firebase_project_id or "Not set"}</li>
                <li>Firebase API Key: {"Available" if firebase_api_key else "Not set"}</li>
                <li>Firebase App ID: {"Available" if firebase_app_id else "Not set"}</li>
                <li>Flutterwave Public Key: {"Available" if flutterwave_public_key else "Not set"}</li>
                <li>Solana Project ID: {"Available" if solana_project_id else "Not set"}</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Visit the <a href="/admin">admin dashboard</a> to manage the competition.</p>
            <p>&copy; 2024-2025 Smallie. All rights reserved.</p>
        </div>
    </div>
    
    <!-- Firebase Scripts -->
    <script src="https://www.gstatic.com/firebasejs/9.19.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.19.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore-compat.js"></script>
    <script src="/static/js/firebase-client.js"></script>
</body>
</html>"""

# For HTTP server handler implementation
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        # Return static HTML for the homepage
        self.wfile.write(get_home_html().encode())

def handler(event, context):
    """
    Serverless handler for the home page
    
    This simulates what happens in the app.py index() function,
    but adapted for a serverless context.
    """
    # Log environment variables (without sensitive data)
    print(f"Firebase Project ID: {os.environ.get('FIREBASE_PROJECT_ID', 'Not Set')}")
    print(f"Firebase App ID available: {'Yes' if os.environ.get('FIREBASE_APP_ID') else 'No'}")
    print(f"Firebase API Key available: {'Yes' if os.environ.get('FIREBASE_API_KEY') else 'No'}")
    
    try:
        # Use our HTML generator function
        html_content = get_home_html()
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "text/html",
            },
            "body": html_content
        }
    except Exception as e:
        # Log and return error info
        error_message = str(e)
        print(f"Error in home handler: {error_message}")
        print(traceback.format_exc())
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
            },
            "body": json.dumps({
                "error": error_message,
                "traceback": traceback.format_exc()
            })
        }