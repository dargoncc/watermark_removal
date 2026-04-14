import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";

import type { ImportedImage, ResultImage } from "../../types/editor";


function inferMimeType(filePath: string): string {
  const normalized = filePath.toLowerCase();
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "image/png";
}

function extractFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? "image.png";
}

function loadImageDimensions(objectUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("failed to load image"));
    image.src = objectUrl;
  });
}

export async function openImageFromDialog(): Promise<ImportedImage | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg"],
      },
    ],
  });

  if (selected === null || Array.isArray(selected)) {
    return null;
  }

  const bytes = await readFile(selected);
  const mimeType = inferMimeType(selected);
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const dimensions = await loadImageDimensions(objectUrl);

  return {
    fileName: extractFileName(selected),
    mimeType,
    width: dimensions.width,
    height: dimensions.height,
    objectUrl,
    bytes,
  };
}

export async function saveResultImage(
  resultImage: ResultImage,
  suggestedName: string,
): Promise<boolean> {
  const selected = await save({
    defaultPath: suggestedName,
    filters: [
      {
        name: "PNG",
        extensions: ["png"],
      },
    ],
  });

  if (selected === null) {
    return false;
  }

  const bytes = new Uint8Array(await resultImage.blob.arrayBuffer());
  await writeFile(selected, bytes);
  return true;
}

