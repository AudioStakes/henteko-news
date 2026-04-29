type AlienAnnouncerProps = {
  variant?: 'home' | 'select' | 'result';
};

export function AlienAnnouncer({ variant = 'home' }: AlienAnnouncerProps) {
  return (
    <div className={`alien alien-${variant}`} aria-hidden="true">
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
