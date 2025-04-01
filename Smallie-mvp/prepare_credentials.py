#!/usr/bin/env python3
"""
Firebase Credentials Preparation Tool for Vercel Deployment

This script helps convert a Firebase service account JSON file to a base64 encoded string
that can be used as an environment variable in Vercel.

Usage:
    python prepare_credentials.py path/to/firebase-credentials.json

The output will be a base64 encoded string that you can use as the FIREBASE_CREDENTIALS
environment variable in Vercel.
"""

import base64
import json
import sys

def encode_credentials(file_path):
    """Encode Firebase credentials JSON file to base64."""
    try:
        with open(file_path, 'r') as f:
            # Validate that the file contains valid JSON
            json_content = json.load(f)
            
            # Check if it has expected Firebase service account fields
            required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
            for field in required_fields:
                if field not in json_content:
                    print(f"Warning: The JSON file may not be a valid Firebase service account key (missing '{field}' field).")
            
            # Convert JSON back to string and encode
            json_str = json.dumps(json_content)
            encoded = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
            
            print("\n--- Base64 Encoded Credentials ---")
            print(encoded)
            print("\n--- End Encoded Credentials ---")
            print("\nCopy the above string and use it as the FIREBASE_CREDENTIALS environment variable in Vercel.")
            
            return encoded
    except FileNotFoundError:
        print(f"Error: File not found: {file_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error: File is not valid JSON: {file_path}")
        return None
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python prepare_credentials.py path/to/firebase-credentials.json")
        sys.exit(1)
    
    encode_credentials(sys.argv[1])