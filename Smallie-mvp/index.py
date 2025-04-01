"""
Entry point for Vercel serverless functions
This file acts as a bridge between Vercel's serverless functions and our Flask app
"""

import os
import sys

# Add the current directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Try to import the Vercel-optimized app if it exists, otherwise use the standard app
try:
    from app_vercel import app as flask_app
    print("Using Vercel-optimized Flask app")
except ImportError:
    # Fallback to the standard app
    from app import app as flask_app
    print("Using standard Flask app")

# Vercel needs this specific style of handler
def handler(request, **kwargs):
    """
    This function is used by Vercel to handle requests
    It is not meant to be called directly
    
    In Vercel serverless functions, this handler converts the standard request object
    to a WSGI-compatible format that Flask can understand.
    """
    environ = {
        "wsgi.version": (1, 0),
        "wsgi.url_scheme": request.url.split("://")[0],
        "wsgi.input": request.body,
        "wsgi.errors": sys.stderr,
        "wsgi.multithread": False,
        "wsgi.multiprocess": False,
        "wsgi.run_once": False,
        "REQUEST_METHOD": request.method,
        "PATH_INFO": request.path,
        "QUERY_STRING": request.query_string.decode("utf-8"),
        "SERVER_PROTOCOL": "HTTP/1.1",
        "HTTP_HOST": request.headers.get("host", "localhost"),
    }

    # Add all headers to the environment
    for key, value in request.headers.items():
        key = key.upper().replace("-", "_")
        environ[f"HTTP_{key}"] = value

    # Add content length and type if available
    if request.body:
        environ["CONTENT_LENGTH"] = str(len(request.body))
    if request.headers.get("content-type"):
        environ["CONTENT_TYPE"] = request.headers.get("content-type")

    # This will hold the response data
    response_data = {}

    def start_response(status, response_headers, exc_info=None):
        response_data["status"] = status
        response_data["headers"] = response_headers

    # Call the Flask application with the environment
    body_iter = flask_app(environ, start_response)
    body = b""
    
    # Collect all response data
    for chunk in body_iter:
        if chunk:  # Some WSGI servers yield empty chunks
            body += chunk if isinstance(chunk, bytes) else chunk.encode("utf-8")

    # Return the response in the format Vercel expects
    return {
        "statusCode": int(response_data["status"].split(" ")[0]),
        "headers": dict(response_data["headers"]),
        "body": body.decode("utf-8"),
    }