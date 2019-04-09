export const fontFamily = 'Helvetica Neue, Helvetica, Roboto, Arial, sans-serif';
export const backgroundColors = [0xffffff, 0x242f3e];

export const chartSidePadding = 12;
export const chartTopFadeHeight = 18;
export const chartMainLinesTopMargin = 20;
export const chartMainLinesBottomMargin = 31;
export const chartMapLineWidth = 1;
export const chartMapLinesHorizontalMargin = 1;
export const chartMapLinesVerticalMargin = 4/3;
export const chartMainLineWidth = 2;
export const chartScalePrimaryLineColors = [0x5b7589, 0x8391a3];
export const chartScalePrimaryLineOpacities = [0.11, 0.15];
export const chartScaleSecondaryLineColors = [0x5b7589, 0x8391a3];
export const chartScaleSecondaryLineOpacities = [0.09, 0.06];
export const chartScaleLineWidth = 1;
export const chartScaleLabelColors = [0x96a2aa, 0x546778];
export const chartScaleLabelFontSize = 10;
export const chartValueScaleLabelMargin = 4;
export const chartDateScaleLabelMargin = 7;
export const chartSelectorGripWidth = 10;

export const themeTransitionDuration = 300; // ms
export const themeTransitionStyle = {
  transitionDuration: `${themeTransitionDuration}ms`,
  transitionTimingFunction: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)'
};
export const themeTransitionCSS = `transition-duration: ${themeTransitionStyle.transitionDuration};`
  + `transition-timing-function: ${themeTransitionStyle.transitionTimingFunction};`;
