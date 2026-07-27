export class InkblotImagePreloader {
  /**
   * Preloads a single image into browser memory with a single retry on failure.
   */
  public static async preloadImage(url: string, retryCount: number = 1): Promise<boolean> {
    if (typeof window === 'undefined') return true;
    if (!url) return false;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const loaded = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
        if (loaded) return true;
      } catch (_) {
        // Retry next attempt
      }
    }
    return false;
  }

  /**
   * Preloads all 5 inkblot images in parallel. Returns true if all succeed.
   */
  public static async preloadAll(urls: string[]): Promise<boolean> {
    if (!urls || urls.length === 0) return false;
    const results = await Promise.all(urls.map(url => this.preloadImage(url, 1)));
    return results.every(r => r === true);
  }
}
