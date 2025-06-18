import { ReactComponent as SoulPrintSVG } from './assets/ILI-SOUL.svg';

export default function SoulPrint({ slowStorm, coreGlow, breathing }) {
  let className = "soulprint-svg";
  if (slowStorm) className += " soulprint-storm-slow";
  if (breathing) className += " soulprint-storm-breathing";
  return (
    <SoulPrintSVG
      className={className}
      width={120}
      height={120}
      style={{ display: "block", margin: "0 auto" }}
    />
  );
}
