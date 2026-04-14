import { act } from "@testing-library/react";

import {
  createEmptyMaskState,
  createImportedImage,
  createResultImage,
  useAppStore,
} from "../store/appStore";


describe("appStore", () => {
  beforeEach(() => {
    act(() => {
      useAppStore.getState().resetAll();
    });
  });

  it("transitions to editing when an image is imported", () => {
    const importedImage = createImportedImage({
      fileName: "demo.png",
      mimeType: "image/png",
      width: 320,
      height: 240,
      objectUrl: "blob:demo",
      bytes: new Uint8Array([1, 2, 3]),
    });

    act(() => {
      useAppStore.getState().setImportedImage(importedImage);
    });

    expect(useAppStore.getState().jobState).toBe("editing");
    expect(useAppStore.getState().importedImage?.fileName).toBe("demo.png");
    expect(useAppStore.getState().maskState).toEqual(createEmptyMaskState());
  });

  it("stores success payload and moves to success state", () => {
    const resultImage = createResultImage({
      objectUrl: "blob:result",
      blob: new Blob(["image"], { type: "image/png" }),
      requestId: "req-success",
      processTimeMs: 200,
    });

    act(() => {
      useAppStore.getState().setResult(resultImage);
    });

    expect(useAppStore.getState().jobState).toBe("success");
    expect(useAppStore.getState().resultImage?.requestId).toBe("req-success");
    expect(useAppStore.getState().errorMessage).toBeNull();
  });

  it("preserves imported image when request fails", () => {
    const importedImage = createImportedImage({
      fileName: "demo.png",
      mimeType: "image/png",
      width: 320,
      height: 240,
      objectUrl: "blob:demo",
      bytes: new Uint8Array([1, 2, 3]),
    });

    act(() => {
      useAppStore.getState().setImportedImage(importedImage);
      useAppStore.getState().setError("请求处理超时", 6001);
    });

    expect(useAppStore.getState().jobState).toBe("error");
    expect(useAppStore.getState().errorMessage).toBe("请求处理超时");
    expect(useAppStore.getState().importedImage?.fileName).toBe("demo.png");
  });
});

