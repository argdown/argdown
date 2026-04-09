export interface ISvgToPdfSettings {
  width?: number;
  height?: number;
  padding?: number;
  pdf?: { compress?: boolean };
  svg?: {
    useCSS?: boolean;
    assumePt?: boolean;
    preserveAspectRatio?: string;
  };
}
declare module "@argdown/core" {
  interface IArgdownRequest {
    /**
     * Settings for the [[SvgToPdfExportPlugin]]
     */
    svgToPdf?: ISvgToPdfSettings;
  }
}
export const defaultSvgToPdfSettings: Required<ISvgToPdfSettings> = {
  width: 612,
  height: 792,
  padding: 10,
  pdf: {
    compress: false
  },
  svg: {
    useCSS: true,
    assumePt: true,
    preserveAspectRatio: "xMidYMid meet"
  }
};
