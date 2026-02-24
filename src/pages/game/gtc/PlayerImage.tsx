import "./PlayerImage.css";

type PlayerImageProps = {
  src: string;
  alt: string;
  blurPx?: number; 
  width?: string;  
};

export function PlayerImage({ src, alt, blurPx = 0, width = "100%" }: PlayerImageProps) {
  return (
    <div className="playerFrame" style={{ width }}>
      <img
        className="playerImage"
        style={{ filter: blurPx > 0 ? `blur(${blurPx}px)` : "none" }}
        src={src}
        alt={alt}
      />
    </div>
  );
}