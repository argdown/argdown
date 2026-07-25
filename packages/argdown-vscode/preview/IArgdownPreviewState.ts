import { IDagreSettings } from "@argdown/map-views";
import { IMap, IVizSettings } from "@argdown/core";
export interface IArgdownPreviewState {
  resource?: string;
  currentView?: string;
  locked?: boolean;
  selectedNode?: string | null;
  dagre: {
    position: {
      x?: number;
      y?: number;
    };
    scale?: number;
    map?: IMap;
    settings?: IDagreSettings;
  };
  vizJs: {
    position: {
      x?: number;
      y?: number;
    };
    scale?: number;
    svg?: string;
    dot?: string;
    settings?: IVizSettings;
    images?: [
      { path: string; width: number; height: number; dataUrl?: string }
    ];
  };
  html: {
    html?: string;
    line: number;
    lineCount?: number;
  };
}
