import cv2
import numpy as np
import uuid
import os

def clean_image(image_file, mask_file):
    image_bytes = image_file.read()
    mask_bytes = mask_file.read()

    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    mask = cv2.imdecode(np.frombuffer(mask_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)

    mask = cv2.threshold(mask, 10, 255, cv2.THRESH_BINARY)[1]

    cleaned = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)

    os.makedirs("outputs", exist_ok=True)
    output_path = f"outputs/{uuid.uuid4()}.png"
    cv2.imwrite(output_path, cleaned)

    return output_path
