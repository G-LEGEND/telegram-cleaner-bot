import cv2
import numpy as np

def clean_image(image_path, mask_path, output_path):
    image = cv2.imread(image_path)
    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

    if image is None or mask is None:
        raise RuntimeError("Failed to load image or mask")

    # Ensure mask is binary
    _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

    # Inpaint
    cleaned = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)

    # SAVE OUTPUT (THIS WAS YOUR BUG)
    cv2.imwrite(output_path, cleaned)
