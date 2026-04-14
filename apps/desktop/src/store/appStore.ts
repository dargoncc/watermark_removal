import { create } from "zustand";

import type {
  AppErrorState,
  BrushStroke,
  EditorTool,
  ImportedImage,
  JobState,
  MaskState,
  RectangleMask,
  ResultImage,
} from "../types/editor";
import type { AppErrorCode } from "../types/api";


export const createEmptyMaskState = (): MaskState => ({
  rectangles: [],
  brushStrokes: [],
});

export const createImportedImage = (image: ImportedImage): ImportedImage => image;
export const createResultImage = (image: ResultImage): ResultImage => image;

type AppStore = {
  jobState: JobState;
  activeTool: EditorTool;
  importedImage: ImportedImage | null;
  resultImage: ResultImage | null;
  maskState: MaskState;
  errorMessage: string | null;
  errorCode: AppErrorCode | null;
  setImportedImage: (image: ImportedImage) => void;
  setActiveTool: (tool: EditorTool) => void;
  setJobState: (jobState: JobState) => void;
  addRectangle: (rectangle: RectangleMask) => void;
  addBrushStroke: (stroke: BrushStroke) => void;
  clearMask: () => void;
  setResult: (resultImage: ResultImage) => void;
  setError: (message: string, code: AppErrorCode) => void;
  clearError: () => void;
  resetToEditing: () => void;
  resetAll: () => void;
};

const initialState = {
  jobState: "idle" as JobState,
  activeTool: "rectangle" as EditorTool,
  importedImage: null,
  resultImage: null,
  maskState: createEmptyMaskState(),
  errorMessage: null,
  errorCode: null,
};

const applyError = (
  state: AppStore,
  error: AppErrorState,
): Pick<AppStore, "jobState" | "errorMessage" | "errorCode"> => ({
  jobState: "error",
  errorMessage: error.message,
  errorCode: error.code,
});

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setImportedImage: (image) =>
    set({
      importedImage: image,
      resultImage: null,
      maskState: createEmptyMaskState(),
      jobState: "editing",
      errorMessage: null,
      errorCode: null,
    }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setJobState: (jobState) => set({ jobState }),
  addRectangle: (rectangle) =>
    set((state) => ({
      maskState: {
        ...state.maskState,
        rectangles: [...state.maskState.rectangles, rectangle],
      },
      jobState: state.importedImage ? "editing" : state.jobState,
      errorMessage: null,
      errorCode: null,
    })),
  addBrushStroke: (stroke) =>
    set((state) => ({
      maskState: {
        ...state.maskState,
        brushStrokes: [...state.maskState.brushStrokes, stroke],
      },
      jobState: state.importedImage ? "editing" : state.jobState,
      errorMessage: null,
      errorCode: null,
    })),
  clearMask: () =>
    set({
      maskState: createEmptyMaskState(),
      errorMessage: null,
      errorCode: null,
    }),
  setResult: (resultImage) =>
    set({
      resultImage,
      jobState: "success",
      errorMessage: null,
      errorCode: null,
    }),
  setError: (message, code) =>
    set((state) => ({
      ...applyError(state as AppStore, { code, message }),
    })),
  clearError: () =>
    set({
      errorMessage: null,
      errorCode: null,
      jobState: "editing",
    }),
  resetToEditing: () =>
    set((state) => ({
      jobState: state.importedImage ? "editing" : "idle",
      resultImage: null,
      errorMessage: null,
      errorCode: null,
    })),
  resetAll: () =>
    set({
      ...initialState,
      maskState: createEmptyMaskState(),
    }),
}));

