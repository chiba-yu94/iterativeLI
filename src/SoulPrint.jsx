import { ReactComponent as SoulPrintSVG } from './assets/ILI-SOUL.svg';

export default function SoulPrint({ slowStorm, coreGlow }) {
  let className = "soulprint-svg";
  if (slowStorm) className += " soulprint-storm-slow";
  if (coreGlow) className += " soulprint-core-glow";
  return (
    <SoulPrintSVG
      className={className}
      width={120}
      height={120}
      style={{ display: "block", margin: "0 auto" }}
    />
  );
}
