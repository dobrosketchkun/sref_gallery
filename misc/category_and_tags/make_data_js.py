import os
import json
import hashlib

# Configuration
IMAGES_DIR = './actual_images/'       # Root images directory
OUTPUT_FILE = 'data.js'     # Output data.js file
TITLE_HASH_LENGTH = 8       # Length of the hashed title

def hash_sref(sref_list):
    """
    Generates a hashed title based on the sref list.
    """
    sref_str = ''.join(sref_list)
    hash_object = hashlib.sha256(sref_str.encode())
    hash_hex = hash_object.hexdigest()
    return hash_hex[:TITLE_HASH_LENGTH]

def process_images_directory(images_dir):
    """
    Processes the images directory and returns the gallery data.
    """
    gallery_data = {
        "posts": []
    }
    
    post_id = 1
    image_id = 1

    # List all subdirectories in the images directory
    for subdir in sorted(os.listdir(images_dir)):
        subdir_path = os.path.join(images_dir, subdir)
        if not os.path.isdir(subdir_path):
            continue  # Skip files, only process directories
        
        # Initialize post data
        post_srefs = set()
        post_categories = set()
        post_tags = set()
        images = []

        # List all files in the subdirectory
        files = sorted(os.listdir(subdir_path))
        # Filter out JPEG files
        jpeg_files = [f for f in files if f.lower().endswith('.jpeg')]

        for jpeg_file in jpeg_files:
            base_name = os.path.splitext(jpeg_file)[0]
            json_file = f"{base_name}.json"
            json_path = os.path.join(subdir_path, json_file)
            jpeg_path = os.path.join(subdir_path, jpeg_file)

            # Check if corresponding JSON file exists
            if not os.path.exists(json_path):
                print(f"Warning: JSON file {json_file} not found for image {jpeg_file}. Skipping.")
                continue

            # Read JSON data
            with open(json_path, 'r', encoding='utf-8') as jf:
                try:
                    data = json.load(jf)
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON file {json_file}: {e}. Skipping.")
                    continue

            # Extract data
            prompt = data.get('prompt', '')
            srefs = data.get('sref', [])
            categories = data.get('categories', [])
            tags = data.get('tags', [])

            # Update post-level data
            for sref in srefs:
                post_srefs.add(sref)
            for category in categories:
                post_categories.add(category)
            for tag in tags:
                post_tags.add(tag)

            # Construct image URL relative to the website root
            image_url = os.path.join('images', subdir, jpeg_file).replace('\\', '/')

            # Create image object
            image_obj = {
                "imageId": image_id,
                "url": image_url,
                "prompt": prompt,
                "sref": srefs,
                "tags": tags
            }
            images.append(image_obj)
            image_id += 1

        if not images:
            print(f"Warning: No images found in subdirectory {subdir}. Skipping post.")
            continue

        # Generate title by hashing the srefs
        title = hash_sref(list(post_srefs))

        # Create post object
        post_obj = {
            "postId": post_id,
            "title": title,
            "sref": list(post_srefs),
            "tags": list(post_tags),
            "categories": list(post_categories),
            "images": images
        }
        gallery_data["posts"].append(post_obj)
        post_id += 1

    return gallery_data

def write_data_js(gallery_data, output_file):
    """
    Writes the gallery data to a JavaScript file in the desired format.
    """
    # Convert Python dict to JSON string with indentation
    json_str = json.dumps(gallery_data, indent=4)

    # Replace double quotes with single quotes for JavaScript compatibility if needed
    # However, JSON is generally acceptable in JS, so this step can be skipped
    # json_str = json_str.replace('"', "'")

    # Create the final JavaScript content
    js_content = f"const galleryData = {json_str};\n"

    # Write to the output file
    with open(output_file, 'w', encoding='utf-8') as of:
        of.write(js_content)

    print(f"Successfully wrote gallery data to {output_file}")

def main():
    # Check if images directory exists
    if not os.path.exists(IMAGES_DIR):
        print(f"Error: Images directory '{IMAGES_DIR}' does not exist.")
        return

    # Process the images directory
    gallery_data = process_images_directory(IMAGES_DIR)

    # Write the data.js file
    write_data_js(gallery_data, OUTPUT_FILE)

if __name__ == "__main__":
    main()
