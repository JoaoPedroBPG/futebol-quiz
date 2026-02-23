import "./CareerRow.css";

type Club = {
  name: string;
  crest: string;
};

type CareerRowProps = {
  clubs: Club[];
};

export function CareerRow({ clubs }: CareerRowProps) {
  return (
    <div className="careerRow" aria-label="Revealed career history">
      {clubs.map((club, idx) => (
        <div className="careerNode" key={`${club.name}-${idx}`}>
          <div className="crestBlock">
            <img className="clubCrest" src={club.crest} alt={club.name} />
          </div>

          <span className="clubName">{club.name}</span>

          {idx < clubs.length - 1 && (
            <span className="careerArrow" aria-hidden="true">
              ←
            </span>
          )}
        </div>
      ))}
    </div>
  );
}