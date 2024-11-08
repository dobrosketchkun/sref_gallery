import os
from flask import Flask, render_template, request, jsonify, send_from_directory, abort
import json
import base64
from PIL import Image
import urllib.parse

app = Flask(__name__)

# Define the folder where images and JSON files are stored
IMAGE_FOLDER = 'actual_images'

# Ensure the image folder exists
if not os.path.exists(IMAGE_FOLDER):
    os.makedirs(IMAGE_FOLDER)

def get_image_info():
    """
    Scans the IMAGE_FOLDER and retrieves information about each image and its corresponding JSON file.
    Returns a list of dictionaries containing image data and metadata.
    """
    images = []
    categories = set()
    tags = set()
    for root, dirs, files in os.walk(IMAGE_FOLDER):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                image_path = os.path.join(root, file)
                json_file = os.path.splitext(file)[0] + '.json'
                json_path = os.path.join(root, json_file)
                if os.path.exists(json_path):
                    with open(json_path, 'r') as f:
                        data = json.load(f)
                        image = {
                            'image_name': file,
                            'image_ext': os.path.splitext(file)[1],
                            'image_path': os.path.relpath(image_path, IMAGE_FOLDER).replace('\\', '/'),
                            'json_file': os.path.relpath(json_path, IMAGE_FOLDER).replace('\\', '/'),
                            'prompt': data.get('prompt', ''),
                            'sref': data.get('sref', []),
                            'categories': data.get('categories', []),
                            'tags': data.get('tags', []),
                        }
                        images.append(image)
                        categories.update(image['categories'])
                        tags.update(image['tags'])
    return sorted(images, key=lambda x: x['image_name'].lower()), sorted(categories), sorted(tags)

@app.route('/')
def index():
    images, categories, tags = get_image_info()
    return render_template('index.html', images=images, categories=categories, tags=tags)

@app.route('/images/<path:filename>')
def serve_image(filename):
    """
    Serves image files from the IMAGE_FOLDER.
    """
    try:
        return send_from_directory(IMAGE_FOLDER, filename)
    except FileNotFoundError:
        abort(404)

@app.route('/update/<path:json_file>', methods=['POST'])
def update(json_file):
    # Decode the URL-encoded json_file path
    json_file_decoded = urllib.parse.unquote(json_file)
    json_path = os.path.join(IMAGE_FOLDER, json_file_decoded)
    if not os.path.exists(json_path):
        return jsonify({'status': 'error', 'message': 'JSON file does not exist.'})
    try:
        data = json.load(open(json_path, 'r'))
        # Update categories and tags
        data['categories'] = request.form.getlist('categories[]')
        data['tags'] = request.form.getlist('tags[]')
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=4)
        return jsonify({'status': 'success', 'message': 'Image updated successfully.'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Failed to update image: {str(e)}'})

@app.route('/bulk_update', methods=['POST'])
def bulk_update():
    json_files = request.form.getlist('json_files[]')
    add_categories = request.form.getlist('categories[]')
    add_tags = request.form.getlist('tags[]')

    if not json_files:
        return jsonify({'status': 'error', 'message': 'No images selected for bulk update.'})

    try:
        for json_file in json_files:
            json_file_decoded = urllib.parse.unquote(json_file)
            json_path = os.path.join(IMAGE_FOLDER, json_file_decoded)
            if os.path.exists(json_path):
                with open(json_path, 'r') as f:
                    data = json.load(f)
                # Add new categories and tags, avoiding duplicates
                data['categories'] = sorted(list(set(data.get('categories', []) + add_categories)))
                data['tags'] = sorted(list(set(data.get('tags', []) + add_tags)))
                with open(json_path, 'w') as f:
                    json.dump(data, f, indent=4)
        return jsonify({'status': 'success', 'message': 'Bulk update successful.'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Bulk update failed: {str(e)}'})

@app.route('/add_category', methods=['POST'])
def add_category():
    new_category = request.form.get('new_category', '').strip()
    if not new_category:
        return jsonify({'status': 'error', 'message': 'Category name cannot be empty.'})
    # Here you might want to add the category to a central repository or validate it
    # For simplicity, we'll assume categories are managed through image JSON files
    return jsonify({'status': 'success', 'category': new_category, 'message': 'Category added successfully.'})

@app.route('/delete_category', methods=['POST'])
def delete_category():
    category = request.form.get('category', '').strip()
    if not category:
        return jsonify({'status': 'error', 'message': 'No category specified.'})
    # Here you would handle removing the category from all image JSON files
    # For simplicity, we'll iterate through all JSON files and remove the category
    try:
        for root, dirs, files in os.walk(IMAGE_FOLDER):
            for file in files:
                if file.lower().endswith('.json'):
                    json_path = os.path.join(root, file)
                    with open(json_path, 'r') as f:
                        data = json.load(f)
                    if category in data.get('categories', []):
                        data['categories'].remove(category)
                        with open(json_path, 'w') as f:
                            json.dump(data, f, indent=4)
        return jsonify({'status': 'success', 'category': category, 'message': 'Category deleted successfully.'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Failed to delete category: {str(e)}'})

@app.route('/add_tag', methods=['POST'])
def add_tag():
    new_tag = request.form.get('new_tag', '').strip()
    if not new_tag:
        return jsonify({'status': 'error', 'message': 'Tag name cannot be empty.'})
    # Similar to add_category, manage tags as needed
    return jsonify({'status': 'success', 'tag': new_tag, 'message': 'Tag added successfully.'})

@app.route('/delete_tag', methods=['POST'])
def delete_tag():
    tag = request.form.get('tag', '').strip()
    if not tag:
        return jsonify({'status': 'error', 'message': 'No tag specified.'})
    # Remove tag from all image JSON files
    try:
        for root, dirs, files in os.walk(IMAGE_FOLDER):
            for file in files:
                if file.lower().endswith('.json'):
                    json_path = os.path.join(root, file)
                    with open(json_path, 'r') as f:
                        data = json.load(f)
                    if tag in data.get('tags', []):
                        data['tags'].remove(tag)
                        with open(json_path, 'w') as f:
                            json.dump(data, f, indent=4)
        return jsonify({'status': 'success', 'tag': tag, 'message': 'Tag deleted successfully.'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Failed to delete tag: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True)
