import cv2
import numpy as np


class OpenCvInpaintEngine:
    def __init__(self, radius: int):
        self.radius = radius

    def inpaint(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        return cv2.inpaint(image, mask, self.radius, cv2.INPAINT_TELEA)

