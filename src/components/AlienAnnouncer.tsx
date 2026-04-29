type AlienAnnouncerProps = {};

export function AlienAnnouncer({}: AlienAnnouncerProps) {
  return (
    <div className="alien" aria-hidden="true">
      <div className="antenna left" />
      <div className="antenna right" />
      <div className="head">
        <div className="eye left"><span /></div>
        <div className="eye right"><span /></div>
        <div className="nose"><span /><span /></div>
        <div className="mouth" />
        <div className="cheek left" />
        <div className="cheek right" />
      </div>
      <div className="suit">
        <div className="bowtie" />
        <div className="mic" />
      </div>
    </div>
  );
}
