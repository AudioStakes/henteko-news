import alienAnnouncer from '../assets/alien-announcer.webp';

type AlienAnnouncerProps = {
  className?: string;
  alt?: string;
};

export function AlienAnnouncer({ className = '', alt = '' }: AlienAnnouncerProps) {
  return <img className={`alien ${className}`.trim()} src={alienAnnouncer} alt={alt} />;
}
