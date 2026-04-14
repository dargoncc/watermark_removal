import type { AppErrorCode } from "./api";


export type JobState = "idle" | "editing" | "uploading" | "processing" | "success" | "error";
export type EditorTool = "rectangle" | "brush" | "pan";

export interface Point {
  x: number;
  y: number;
}

export interface RectangleMask {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrushStroke {
  id: string;
  points: Point[];
  brushSize: number;
}

export interface MaskState {
  rectangles: RectangleMask[];
  brushStrokes: BrushStroke[];
}

export interface ImportedImage {
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  objectUrl: string;
  bytes: Uint8Array;
}

export interface ResultImage {
  objectUrl: string;
  blob: Blob;
  requestId: string;
  processTimeMs: number;
}

export interface EditorViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface AppErrorState {
  code: AppErrorCode;
  message: string;
}

