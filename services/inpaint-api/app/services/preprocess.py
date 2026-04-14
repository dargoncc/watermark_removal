import cv2
import numpy as np
from PIL import Image, ImageOps


def normalize_source_image(image: Image.Image) -> np.ndarray:
    normalized = ImageOps.exif_transpose(image).convert("RGB")
    rgb_array = np.array(normalized, dtype=np.uint8)
    return cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)


def normalize_mask_image(mask: Image.Image) -> np.ndarray:
    normalized = ImageOps.exif_transpose(mask).convert("L")
    mask_array = np.array(normalized, dtype=np.uint8)
    return np.where(mask_array > 0, 255, 0).astype(np.uint8)

