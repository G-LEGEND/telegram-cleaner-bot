import os
import uuid
from flask import Flask, request, send_file, render_template
from ai.cleaner import clean_image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/clean", methods=["POST"])
def clean():
    image = request.files.get("image")
    mask = request.files.get("mask")

    if not image or not mask:
        return "Missing image or mask", 400

    uid = str(uuid.uuid4())

    input_path = os.path.join(UPLOAD_DIR, f"{uid}_input.png")
    mask_path = os.path.join(UPLOAD_DIR, f"{uid}_mask.png")
    output_path = os.path.join(OUTPUT_DIR, f"{uid}.png")

    image.save(input_path)
    mask.save(mask_path)

    # Clean image (MUST create output_path)
    clean_image(input_path, mask_path, output_path)

    if not os.path.exists(output_path):
        return "Cleaning failed: output not created", 500

    return send_file(output_path, mimetype="image/png")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
