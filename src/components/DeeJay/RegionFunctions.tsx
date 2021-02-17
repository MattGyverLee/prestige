import store from "../../store/store";
import { LooseObject } from "../../store/annot/types";
import { roundIt } from "../globalFunctions";

export function getNiceHSLColor(colorPos = 0): string {
  // https://gist.github.com/AlexLamson/6785065
  // https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
  const goldenRatioConj = (1.0 + Math.sqrt(5.0)) / 2.0;
  let hue = Math.random();
  hue += goldenRatioConj * (colorPos / (5 * Math.random()));
  hue = hue % 1;
  hue = roundIt(359 * hue, 0);
  return "hsl(" + hue + ", " + 60 + "%, " + 50 + "%, 0.0)";
}
export function getRandomRGBAColor(): string {
  const rgb =
    "rgba(" +
    [
      ~~(Math.random() * 255),
      ~~(Math.random() * 255),
      ~~(Math.random() * 255),
      0.0,
    ] +
    ")";
  return rgb;
}

export function generateRegionColors(): string[] {
  const state = store.getState();
  const regionColors: string[] = [];
  let pos = 0;
  if (state.annot.currentTimeline !== -1) {
    state.annot.timeline[state.annot.currentTimeline].milestones.forEach(() => {
      regionColors.push(getNiceHSLColor(pos));
      pos += 1;
    });
  }
  return regionColors;
}

export function updateRegionAlpha(
  regions: any,
  alpha: number,
  start: number,
  end: number
): void {
  const id = findRegion(regions, start, end);
  if (id) {
    regions[id].color = regions[id].color
      .split(",")
      .map((v: string) => (v.endsWith(")") ? `${alpha})` : v))
      .join(",");
    regions[id].onDrag(0);
  }
}

function findRegion(regions: any, start: number, end: number): string {
  const id = Object.keys(regions).filter((id: any) => {
    const r = regions[id];
    return r.start === start && r.end === end;
  });
  return id.length === 1 ? id[0] : "";
}

// Toggle Between Various Representations of the Current Timeline's Regions
export function toggleAllRegions(
  regionsOn: number,
  noIncrement: boolean,
  wsRegions: any[]
): void {
  const state = store.getState();

  // FIXME: Last Region in all WSs Not Drawn
  if (state.annot.currentTimeline !== -1 && regionsOn !== 2) {
    const alpha = regionsOn - +(noIncrement || 0) ? 0.0 : 0.1;
    state.annot.timeline[state.annot.currentTimeline].milestones.forEach(
      (m: any) => {
        updateRegionAlpha(wsRegions[0], alpha, m.startTime, m.stopTime);
        m.data.forEach((d: LooseObject) => {
          const wsNum =
            +d.channel.endsWith("Merged") *
            (1 + +d.channel.startsWith("Translation"));
          if (wsNum)
            updateRegionAlpha(wsRegions[wsNum], alpha, d.clipStart, d.clipStop);
        });
      }
    );
  }
}
