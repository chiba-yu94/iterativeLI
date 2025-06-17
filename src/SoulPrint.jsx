import { ReactComponent as SoulPrintSVG } from './assets/ILI-SOUL.svg';

export default function SoulPrint(props) {
  return (
    <SoulPrintSVG
      width={props.width || 120}
      height={props.height || 120}
      style={{ display: "block", margin: "0 auto", ...props.style }}
    />
  );
}
