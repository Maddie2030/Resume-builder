# C:\Users\madhu\web_project\seed.py
import requests
import json
import os
from pathlib import Path

BASE_URL = "http://localhost:8001/api/v1"
UPLOAD_ENDPOINT = f"{BASE_URL}/templates/upload"
IMAGES_DIR = Path("./seeding_images")

SAMPLE_TEMPLATES = [
    {
        "name": "Professional Template",
        "image_filename": "image1.jpg",
        "text_blocks": [
            {"x": 50, "y": 50, "width": 800, "height": 100, "font_size": 48, "color": "#FFFFFF", "default_text": "Your Title Here"},
            {"x": 50, "y": 160, "width": 800, "height": 50, "font_size": 24, "color": "#CCCCCC", "default_text": "Your Subtitle Here"}
        ]
    },
    {
        "name": "Holiday Greeting",
        "image_filename": "image2.png",
        "text_blocks": [
            {"x": 100, "y": 100, "width": 600, "height": 200, "font_size": 60, "color": "#FFD700", "default_text": "Happy Holidays!"}
        ]
    },
    {
        "name": "Rustic Announcement",
        "image_filename": "image3.jpg",
        "text_blocks": [
            {"x": 50, "y": 50, "width": 400, "height": 50, "font_size": 36, "color": "#000000", "default_text": "Big News"},
            {"x": 50, "y": 110, "width": 400, "height": 150, "font_size": 18, "color": "#333333", "default_text": "We have something to share..."}
        ]
    }
]

def seed_templates():
    print("Starting template seeding process...")
    for template in SAMPLE_TEMPLATES:
        image_path = IMAGES_DIR / template["image_filename"]
        if not image_path.exists():
            print(f"File not found: {image_path}. Skipping this template.")
            continue

        data = {
            "name": template["name"],
            "text_blocks_json": json.dumps(template["text_blocks"])
        }
        
        try:
            with open(image_path, "rb") as image_file:
                files = {
                    "image": (image_path.name, image_file, "image/jpeg" if image_path.suffix.lower() in [".jpg", ".jpeg"] else "image/png")
                }
                
                print(f"Uploading template: '{template['name']}'...")
                response = requests.post(UPLOAD_ENDPOINT, data=data, files=files, timeout=60)
                
                if response.status_code == 201:
                    print(f"✅ Successfully uploaded '{template['name']}'. ID: {response.json()['_id']}")
                else:
                    print(f"❌ Failed to upload '{template['name']}'. Status code: {response.status_code}")
                    print(f"Server response: {response.text}")
                    response.raise_for_status()

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to upload '{template['name']}'. Error: {e}")

if __name__ == "__main__":
    seed_templates()