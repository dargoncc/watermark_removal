import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../lib/tauri/fileBridge", () => ({
  openImageFromDialog: vi.fn(),
  saveResultImage: vi.fn(),
}));

vi.mock("../lib/api/inpaintClient", () => ({
  requestInpaint: vi.fn(),
}));

vi.mock("../lib/mask/exportMask", () => ({
  exportMaskPng: vi.fn(async () => new Blob(["mask"], { type: "image/png" })),
  hasMaskSelection: (rectangles: Array<unknown>, brushStrokes: Array<unknown>) =>
    rectangles.length > 0 || brushStrokes.length > 0,
}));

vi.mock("../components/editor/ImageStage", () => ({
  ImageStage: () => <div data-testid="image-stage">mock-stage</div>,
}));

import App from "../App";
import { openImageFromDialog, saveResultImage } from "../lib/tauri/fileBridge";
import { createImportedImage, createResultImage, useAppStore } from "../store/appStore";


const openImageFromDialogMock = vi.mocked(openImageFromDialog);
const saveResultImageMock = vi.mocked(saveResultImage);


describe("App", () => {
  beforeEach(() => {
    openImageFromDialogMock.mockReset();
    saveResultImageMock.mockReset();
    act(() => {
      useAppStore.getState().resetAll();
    });
  });

  it("renders the editor after importing an image", async () => {
    openImageFromDialogMock.mockResolvedValueOnce(
      createImportedImage({
        fileName: "demo.png",
        mimeType: "image/png",
        width: 320,
        height: 240,
        objectUrl: "blob:demo",
        bytes: new Uint8Array([1, 2, 3]),
      }),
    );

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "选择图片" }));

    await screen.findByText("编辑水印区域");
    expect(screen.getByText("demo.png")).toBeInTheDocument();
  });

  it("shows the result view when a processed image exists in store", () => {
    act(() => {
      useAppStore.getState().setImportedImage(
        createImportedImage({
          fileName: "demo.png",
          mimeType: "image/png",
          width: 320,
          height: 240,
          objectUrl: "blob:demo",
          bytes: new Uint8Array([1, 2, 3]),
        }),
      );
      useAppStore.getState().addRectangle({
        id: "r1",
        x: 10,
        y: 10,
        width: 40,
        height: 30,
      });
      useAppStore.getState().setResult(
        createResultImage({
          objectUrl: "blob:result",
          blob: new Blob(["png-bytes"], { type: "image/png" }),
          requestId: "req-2",
          processTimeMs: 210,
        }),
      );
    });

    render(<App />);

    expect(screen.getAllByText("处理结果")[0]).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "请求号：req-2"),
    ).toBeInTheDocument();
  });

  it("keeps the editor visible and shows the current error state", async () => {
    act(() => {
      useAppStore.getState().setImportedImage(
        createImportedImage({
          fileName: "demo.png",
          mimeType: "image/png",
          width: 320,
          height: 240,
          objectUrl: "blob:demo",
          bytes: new Uint8Array([1, 2, 3]),
        }),
      );
      useAppStore.getState().addRectangle({
        id: "r1",
        x: 10,
        y: 10,
        width: 40,
        height: 30,
      });
      useAppStore.getState().setError("请求处理超时", 6001);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("请求处理超时")).toBeInTheDocument();
    });
    expect(screen.getByText("编辑水印区域")).toBeInTheDocument();
  });
});
