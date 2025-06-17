import { ReactComponent as SoulPrintSVG } from './assets/ILI-SOUL.svg';

export default function SoulPrint({ width = 120, height = 120, style = {}, slowStorm, coreGlow }) {
  const className = [
    slowStorm ? "soulprint-storm-slow" : "",
    coreGlow ? "soulprint-core-glow" : ""
  ].join(" ").trim();

  return (
    <div
      className={className}
      style={{ display: "block", margin: "0 auto", width, height, ...style }}
    >
      <SoulPrintSVG width={width} height={height} />
    </div>
  );
}
