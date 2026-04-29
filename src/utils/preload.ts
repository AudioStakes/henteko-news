export function preloadImages(urls: string[]) {
  urls.forEach((url) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  });
}

export function preloadImagesWhenIdle(urls: string[]) {
  const run = () => preloadImages(urls);

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run);
  } else {
    globalThis.setTimeout(run, 500);
  }
}
