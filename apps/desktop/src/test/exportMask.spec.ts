import { rasterizeMask } from "../lib/mask/exportMask";


describe("rasterizeMask", () => {
  it("returns a bitmap that matches the source image dimensions", () => {
    const bitmap = rasterizeMask({
      width: 8,
      height: 6,
      rectangles: [{ id: "r1", x: 1, y: 1, width: 3, height: 2 }],
      brushStrokes: [],
    });

    expect(bitmap.width).toBe(8);
    expect(bitmap.height).toBe(6);
    expect(bitmap.pixels).toHaveLength(8 * 6);
  });

  it("paints white pixels for rectangles and brush strokes", () => {
    const bitmap = rasterizeMask({
      width: 6,
      height: 6,
      rectangles: [{ id: "r1", x: 1, y: 1, width: 2, height: 2 }],
      brushStrokes: [
        {
          id: "b1",
          points: [
            { x: 4, y: 4 },
            { x: 4, y: 5 },
          ],
          brushSize: 1,
        },
      ],
    });

    expect(bitmap.pixels[1 * 6 + 1]).toBe(255);
    expect(bitmap.pixels[2 * 6 + 2]).toBe(255);
    expect(bitmap.pixels[4 * 6 + 4]).toBe(255);
  });
});

