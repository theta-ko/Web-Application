"""
Vercel Serverless API Handler for Smallie

This file implements a proper serverless handler for Flask applications on Vercel.
It includes enhanced error handling and fallbacks for production use.
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import traceback

# Add the parent directory to the path
root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_path)

# Import the app_vercel module which is designed for serverless
try:
    from app_vercel import app as flask_app
    HAS_FLASK_APP = True
    print("Successfully imported Flask app from app_vercel.py")
except Exception as e:
    print(f"Error importing Flask app: {str(e)}")
    traceback.print_exc()
    HAS_FLASK_APP = False

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests by forwarding to Flask app"""
        self._handle_request()

    def do_POST(self):
        """Handle POST requests by forwarding to Flask app"""
        self._handle_request()

    def _handle_request(self):
        """Shared request handling logic"""
        try:
            # Attempt to use Flask app to handle the request if available
            if HAS_FLASK_APP:
                # Simulate WSGI environment
                environ = {
                    'REQUEST_METHOD': self.command,
                    'PATH_INFO': self.path,
                    'QUERY_STRING': '',
                    'SERVER_NAME': self.server.server_name,
                    'SERVER_PORT': str(self.server.server_port),
                    'wsgi.input': self.rfile,
                    'wsgi.errors': sys.stderr,
                    'wsgi.version': (1, 0),
                    'wsgi.multithread': True,
                    'wsgi.multiprocess': False,
                    'wsgi.run_once': False,
                    'wsgi.url_scheme': 'http',
                }
                
                # Try to dispatch the request to Flask
                response = flask_app(environ, self._start_response)
                self.wfile.write(response)
            else:
                # Fallback to simple response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    "status": "ok",
                    "message": "Serverless function running in fallback mode",
                    "path": self.path,
                    "project_id": os.environ.get("FIREBASE_PROJECT_ID", "Not set"),
                    "warning": "Flask app not available - using simplified response"
                }
                
                self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            # Handle any errors
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            error_response = {
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
            
            self.wfile.write(json.dumps(error_response).encode())
    
    def _start_response(self, status, headers):
        """WSGI start_response implementation"""
        status_code = int(status.split(' ')[0])
        self.send_response(status_code)
        
        for header, value in headers:
            self.send_header(header, value)
        
        self.end_headers()

# This is the function Vercel calls
def handler(event, context):
    """Serverless function handler for Vercel"""
    try:
        # Log the event for debugging
        print(f"Received event: {event}")
        
        # Check if we need to handle a specific path
        path = event.get('path', '')
        method = event.get('httpMethod', 'GET')
        
        # For specific API endpoints, we could implement direct handling here
        # For now, use a simple template response
        
        # Environment check for debugging
        firebase_vars = {
            "project_id": os.environ.get("FIREBASE_PROJECT_ID", "Not set"),
            "app_id_available": "Yes" if os.environ.get("FIREBASE_APP_ID") else "No",
            "api_key_available": "Yes" if os.environ.get("FIREBASE_API_KEY") else "No",
            "credentials_available": "Yes" if os.environ.get("FIREBASE_CREDENTIALS") else "No"
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "text/html",
            },
            "body": f"""
<!DOCTYPE html>
<html>
<head>
    <title>Smallie - Nigerian Livestreaming Competition</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }}
        h1 {{
            color: #D32F2F;
            margin-top: 40px;
        }}
        .message {{
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .smallie-logo {{
            font-size: 2.5rem;
            font-weight: bold;
            color: #D32F2F;
            margin-bottom: 10px;
        }}
        .tagline {{
            font-style: italic;
            color: #666;
            margin-bottom: 30px;
        }}
        .success {{
            color: #28a745;
            font-weight: bold;
        }}
        .instructions {{
            text-align: left;
            max-width: 600px;
            margin: 0 auto;
        }}
        code {{
            background-color: #f1f1f1;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: Monaco, monospace;
        }}
        .env-vars {{
            margin: 20px 0;
            text-align: left;
            background-color: #f1f1f1;
            padding: 10px;
            border-radius: 5px;
        }}
    </style>
</head>
<body>
    <div class="smallie-logo">Smallie</div>
    <div class="tagline">Nigeria's Premier Livestreaming Competition</div>
    
    <h1>Serverless Function Running!</h1>
    
    <div class="message">
        <p class="success">✓ Your Vercel deployment is working correctly at the API level</p>
        <p>The serverless function has been deployed successfully.</p>
    </div>
    
    <div class="env-vars">
        <h3>Environment Check</h3>
        <ul>
            <li>Project ID: {firebase_vars["project_id"]}</li>
            <li>App ID Available: {firebase_vars["app_id_available"]}</li>
            <li>API Key Available: {firebase_vars["api_key_available"]}</li>
            <li>Credentials Available: {firebase_vars["credentials_available"]}</li>
        </ul>
    </div>
    
    <div class="instructions">
        <h2>Next Steps:</h2>
        <ol>
            <li>Verify that all environment variables are set in Vercel's project settings</li>
            <li>Configure Firebase authorized domains to include your Vercel URL</li>
            <li>If using a custom domain, make sure to add it to Firebase as well</li>
        </ol>
        
        <h2>Troubleshooting:</h2>
        <p>If you're seeing this page but not the full application, check:</p>
        <ul>
            <li>Your vercel.json configuration (proper rewrites setup)</li>
            <li>Firebase credentials (properly base64-encoded)</li>
            <li>Vercel build logs for specific error messages</li>
        </ul>
    </div>
</body>
</html>
        """
        }
    except Exception as e:
        # Return a user-friendly error page
        error_details = traceback.format_exc()
        print(f"Error in handler: {str(e)}")
        print(error_details)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "text/html",
            },
            "body": f"""
<!DOCTYPE html>
<html>
<head>
    <title>Smallie - Error</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }}
        h1 {{
            color: #D32F2F;
        }}
        .error-box {{
            background-color: #fff3f3;
            border-left: 4px solid #D32F2F;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }}
        .smallie-logo {{
            font-size: 2.5rem;
            font-weight: bold;
            color: #D32F2F;
            margin-bottom: 10px;
        }}
        pre {{
            background-color: #f1f1f1;
            padding: 15px;
            overflow-x: auto;
            font-size: 0.9rem;
            border-radius: 5px;
        }}
    </style>
</head>
<body>
    <div class="smallie-logo">Smallie</div>
    
    <h1>Serverless Function Error</h1>
    
    <div class="error-box">
        <h3>Error Details</h3>
        <p>{str(e)}</p>
        <pre>{error_details}</pre>
    </div>
    
    <p>Please check the Vercel logs for more information or contact support.</p>
</body>
</html>
        """
        }