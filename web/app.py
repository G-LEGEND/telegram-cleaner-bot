import os
from flask import Flask, request, send_file, render_template
from ai.cleaner import clean_image

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/clean", methods=["POST"])
def clean():
    image_file = request.files["image"]
    mask_file = request.files["mask"]
    output = clean_image(image_file, mask_file)
    return send_file(output, mimetype="image/png")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
