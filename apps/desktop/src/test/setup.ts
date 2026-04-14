import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";


if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => "blob:mock-object-url");
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

const canvasContextMock = {
  createImageData: ((width: number, height: number) =>
    ({
      colorSpace: "srgb",
      data: new Uint8ClampedArray(width * height * 4),
      height,
      width,
    }) as ImageData) as unknown as CanvasRenderingContext2D["createImageData"],
  putImageData: vi.fn() as unknown as CanvasRenderingContext2D["putImageData"],
} satisfies Pick<CanvasRenderingContext2D, "createImageData" | "putImageData">;

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: vi.fn(() => canvasContextMock),
});

HTMLCanvasElement.prototype.toBlob = function toBlob(
  callback: BlobCallback,
  type?: string,
) {
  callback(new Blob(["mock-canvas"], { type: type ?? "image/png" }));
};
