export function AppFooter() {
  return (
    <footer className="app-footer">
      <p className="app-footer__text">
        Created by{" "}
        <a
          className="app-footer__link"
          href="https://x.com/AudioStakes"
          target="_blank"
          rel="noopener noreferrer"
        >
          @AudioStakes
        </a>
        {" · "}
        <a
          className="app-footer__link"
          href="https://github.com/AudioStakes/henteko-news/blob/main/docs/PRIVACY.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          プライバシー
        </a>
      </p>
    </footer>
  );
}
