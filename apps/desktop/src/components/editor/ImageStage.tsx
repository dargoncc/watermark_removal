import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { BrushStroke, EditorTool, ImportedImage, MaskState, Point, RectangleMask } from "../../types/editor";


type ImageStageProps = {
  activeTool: EditorTool;
  importedImage: ImportedImage;
  maskState: MaskState;
  onAddBrushStroke: (stroke: BrushStroke) => void;
  onAddRectangle: (rectangle: RectangleMask) => void;
};

type DraftRectangle = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

const VIEWPORT_WIDTH = 900;
const VIEWPORT_HEIGHT = 620;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRectangle(draft: DraftRectangle): RectangleMask | null {
  const x = Math.min(draft.startX, draft.endX);
  const y = Math.min(draft.startY, draft.endY);
  const width = Math.abs(draft.endX - draft.startX);
  const height = Math.abs(draft.endY - draft.startY);

  if (width < 4 || height < 4) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    x,
    y,
    width,
    height,
  };
}

function fitImageWithinViewport(image: ImportedImage) {
  const scale = Math.min(VIEWPORT_WIDTH / image.width, VIEWPORT_HEIGHT / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  return {
    baseScale: scale,
    stageWidth: VIEWPORT_WIDTH,
    stageHeight: VIEWPORT_HEIGHT,
    offsetX: (VIEWPORT_WIDTH - scaledWidth) / 2,
    offsetY: (VIEWPORT_HEIGHT - scaledHeight) / 2,
  };
}

function useLoadedImage(objectUrl: string) {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => setImageElement(image);
    image.src = objectUrl;

    return () => {
      setImageElement(null);
    };
  }, [objectUrl]);

  return imageElement;
}

export function ImageStage(props: ImageStageProps) {
  const stageRef = useRef<any>(null);
  const loadedImage = useLoadedImage(props.importedImage.objectUrl);
  const fit = useMemo(() => fitImageWithinViewport(props.importedImage), [props.importedImage]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: fit.offsetX, y: fit.offsetY });
  const [draftRectangle, setDraftRectangle] = useState<DraftRectangle | null>(null);
  const [draftBrush, setDraftBrush] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: fit.offsetX, y: fit.offsetY });
    setDraftRectangle(null);
    setDraftBrush([]);
    setIsDrawing(false);
  }, [fit.offsetX, fit.offsetY, props.importedImage.objectUrl]);

  const stageScale = fit.baseScale * zoom;

  const getImagePoint = (event: KonvaEventObject<MouseEvent | WheelEvent>) => {
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) {
      return null;
    }

    return {
      x: clamp((pointer.x - offset.x) / stageScale, 0, props.importedImage.width),
      y: clamp((pointer.y - offset.y) / stageScale, 0, props.importedImage.height),
    };
  };

  const handleMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    if (props.activeTool === "pan") {
      return;
    }

    const point = getImagePoint(event);
    if (!point) {
      return;
    }

    setIsDrawing(true);
    if (props.activeTool === "rectangle") {
      setDraftRectangle({
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
      });
      return;
    }

    setDraftBrush([point]);
  };

  const handleMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) {
      return;
    }

    const point = getImagePoint(event);
    if (!point) {
      return;
    }

    if (props.activeTool === "rectangle") {
      setDraftRectangle((current) =>
        current
          ? {
              ...current,
              endX: point.x,
              endY: point.y,
            }
          : current,
      );
      return;
    }

    setDraftBrush((current) => [...current, point]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (props.activeTool === "rectangle" && draftRectangle) {
      const rectangle = normalizeRectangle(draftRectangle);
      if (rectangle) {
        props.onAddRectangle(rectangle);
      }
      setDraftRectangle(null);
      return;
    }

    if (props.activeTool === "brush" && draftBrush.length > 0) {
      props.onAddBrushStroke({
        id: crypto.randomUUID(),
        points: draftBrush,
        brushSize: 8,
      });
      setDraftBrush([]);
    }
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const point = getImagePoint(event);
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!point || !pointer) {
      return;
    }

    const nextZoom = clamp(zoom * (event.evt.deltaY > 0 ? 0.92 : 1.08), 0.5, 5);
    const nextScale = fit.baseScale * nextZoom;
    setZoom(nextZoom);
    setOffset({
      x: pointer.x - point.x * nextScale,
      y: pointer.y - point.y * nextScale,
    });
  };

  return (
    <div className="stage-shell">
      <div className="stage-meta">
        <span>
          画布尺寸 {props.importedImage.width} × {props.importedImage.height}
        </span>
        <span>缩放 {Math.round(zoom * 100)}%</span>
      </div>
      <Stage
        className="image-stage"
        height={fit.stageHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        ref={stageRef}
        width={fit.stageWidth}
      >
        <Layer>
          <Group
            draggable={props.activeTool === "pan"}
            onDragEnd={(event) => {
              setOffset({ x: event.target.x(), y: event.target.y() });
            }}
            scaleX={stageScale}
            scaleY={stageScale}
            x={offset.x}
            y={offset.y}
          >
            {loadedImage ? <KonvaImage image={loadedImage} /> : null}
            {props.maskState.rectangles.map((rectangle) => (
              <Rect
                fill="rgba(252, 109, 38, 0.18)"
                height={rectangle.height}
                key={rectangle.id}
                listening={false}
                stroke="#fc6d26"
                strokeWidth={2 / stageScale}
                width={rectangle.width}
                x={rectangle.x}
                y={rectangle.y}
              />
            ))}
            {props.maskState.brushStrokes.map((stroke) => (
              <Line
                key={stroke.id}
                lineCap="round"
                lineJoin="round"
                listening={false}
                points={stroke.points.flatMap((point) => [point.x, point.y])}
                stroke="#fc6d26"
                strokeWidth={(stroke.brushSize * 2) / stageScale}
              />
            ))}
            {draftRectangle ? (
              <Rect
                fill="rgba(27, 86, 76, 0.16)"
                height={Math.abs(draftRectangle.endY - draftRectangle.startY)}
                listening={false}
                stroke="#1b564c"
                strokeDash={[8, 6]}
                strokeWidth={2 / stageScale}
                width={Math.abs(draftRectangle.endX - draftRectangle.startX)}
                x={Math.min(draftRectangle.startX, draftRectangle.endX)}
                y={Math.min(draftRectangle.startY, draftRectangle.endY)}
              />
            ) : null}
            {draftBrush.length > 0 ? (
              <Line
                lineCap="round"
                lineJoin="round"
                listening={false}
                points={draftBrush.flatMap((point) => [point.x, point.y])}
                stroke="#1b564c"
                strokeWidth={16 / stageScale}
              />
            ) : null}
          </Group>
        </Layer>
      </Stage>
      <p className="stage-hint">
        使用滚轮缩放，切换到“拖拽浏览”后可移动视图。矩形框选适合规则水印，画笔更适合不规则边缘。
      </p>
    </div>
  );
}
