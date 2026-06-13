import { IDagreSettings } from "@argdown/map-views";
import { IMap, IVizSettings } from "@argdown/core";
import { Uri } from "vscode";
export interface IArgdownPreviewState {
  resource?: Uri;
  currentView?: string | null;
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
  };
  html: {
    html?: string;
    line: number;
    lineCount?: number;
  };
}
