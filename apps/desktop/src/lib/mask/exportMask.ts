import type { BrushStroke, RectangleMask } from "../../types/editor";


type RasterizeMaskInput = {
  width: number;
  height: number;
  rectangles: RectangleMask[];
  brushStrokes: BrushStroke[];
};

export type RasterizedMask = {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function setPixel(pixels: Uint8ClampedArray, width: number, height: number, x: number, y: number): void {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= width || py >= height) {
    return;
  }

  pixels[py * width + px] = 255;
}

function paintCircle(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  const minX = clamp(Math.floor(centerX - radius), 0, width - 1);
  const maxX = clamp(Math.ceil(centerX + radius), 0, width - 1);
  const minY = clamp(Math.floor(centerY - radius), 0, height - 1);
  const maxY = clamp(Math.ceil(centerY + radius), 0, height - 1);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(pixels, width, height, x, y);
      }
    }
  }
}

function paintLine(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  brushSize: number,
): void {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY), 1);

  for (let step = 0; step <= distance; step += 1) {
    const t = step / distance;
    paintCircle(
      pixels,
      width,
      height,
      startX + deltaX * t,
      startY + deltaY * t,
      brushSize,
    );
  }
}

function paintRectangle(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  rectangle: RectangleMask,
): void {
  const startX = clamp(Math.floor(rectangle.x), 0, width - 1);
  const endX = clamp(Math.ceil(rectangle.x + rectangle.width), 0, width - 1);
  const startY = clamp(Math.floor(rectangle.y), 0, height - 1);
  const endY = clamp(Math.ceil(rectangle.y + rectangle.height), 0, height - 1);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      setPixel(pixels, width, height, x, y);
    }
  }
}

export function rasterizeMask(input: RasterizeMaskInput): RasterizedMask {
  const pixels = new Uint8ClampedArray(input.width * input.height);

  input.rectangles.forEach((rectangle) => paintRectangle(pixels, input.width, input.height, rectangle));
  input.brushStrokes.forEach((stroke) => {
    if (stroke.points.length === 1) {
      paintCircle(
        pixels,
        input.width,
        input.height,
        stroke.points[0].x,
        stroke.points[0].y,
        stroke.brushSize,
      );
      return;
    }

    for (let index = 1; index < stroke.points.length; index += 1) {
      const previous = stroke.points[index - 1];
      const current = stroke.points[index];
      paintLine(
        pixels,
        input.width,
        input.height,
        previous.x,
        previous.y,
        current.x,
        current.y,
        stroke.brushSize,
      );
    }
  });

  return {
    width: input.width,
    height: input.height,
    pixels,
  };
}

export function hasMaskSelection(rectangles: RectangleMask[], brushStrokes: BrushStroke[]): boolean {
  return rectangles.length > 0 || brushStrokes.length > 0;
}

export async function exportMaskPng(input: RasterizeMaskInput): Promise<Blob> {
  const rasterized = rasterizeMask(input);
  const canvas = document.createElement("canvas");
  canvas.width = rasterized.width;
  canvas.height = rasterized.height;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D context is unavailable");
  }

  const imageData = context.createImageData(rasterized.width, rasterized.height);
  for (let index = 0; index < rasterized.pixels.length; index += 1) {
    const value = rasterized.pixels[index];
    const rgbaIndex = index * 4;
    imageData.data[rgbaIndex] = value;
    imageData.data[rgbaIndex + 1] = value;
    imageData.data[rgbaIndex + 2] = value;
    imageData.data[rgbaIndex + 3] = 255;
  }
  context.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error("Failed to export mask"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}
