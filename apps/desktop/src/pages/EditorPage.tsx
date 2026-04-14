import type { ComponentProps } from "react";

import { Toolbar } from "../components/editor/Toolbar";
import { ImageStage } from "../components/editor/ImageStage";
import type { EditorTool, ImportedImage, JobState, MaskState } from "../types/editor";


type EditorPageProps = {
  activeTool: EditorTool;
  canSubmit: boolean;
  errorMessage: string | null;
  importedImage: ImportedImage;
  jobState: JobState;
  maskState: MaskState;
  onAddBrushStroke: ImageStageProps["onAddBrushStroke"];
  onAddRectangle: ImageStageProps["onAddRectangle"];
  onClearMask: () => void;
  onOpenImage: () => void;
  onSubmit: () => void;
  onToolChange: (tool: EditorTool) => void;
};

type ImageStageProps = ComponentProps<typeof ImageStage>;

export function EditorPage(props: EditorPageProps) {
  return (
    <section className="editor-layout">
      <Toolbar
        activeTool={props.activeTool}
        canSubmit={props.canSubmit}
        fileName={props.importedImage.fileName}
        jobState={props.jobState}
        onClearMask={props.onClearMask}
        onOpenImage={props.onOpenImage}
        onSubmit={props.onSubmit}
        onToolChange={props.onToolChange}
      />

      <div className="workspace">
        {props.errorMessage ? <div className="status-banner status-banner--error">{props.errorMessage}</div> : null}
        <div className="panel-card workspace-card">
          <ImageStage
            activeTool={props.activeTool}
            importedImage={props.importedImage}
            maskState={props.maskState}
            onAddBrushStroke={props.onAddBrushStroke}
            onAddRectangle={props.onAddRectangle}
          />
        </div>
      </div>
    </section>
  );
}
