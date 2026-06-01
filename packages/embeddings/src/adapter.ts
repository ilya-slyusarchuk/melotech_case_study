export interface EmbeddingAdapter {
  /**
   * Providers only convert text into a vector.
   * User ownership, platform rules, and cache storage belong to higher layers.
   */
  embedText(text: string): Promise<number[]>;
}
