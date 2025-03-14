/**
 * Service for interacting with the YouTube Data API
 */
export class YouTubeApiService {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  /**
   * Get details for a YouTube video
   * @param videoId YouTube video ID
   * @returns Video details including title, description and view count
   */
  async getVideoDetails(videoId: string): Promise<{
    title: string;
    description: string;
    viewCount: number;
  }> {
    try {
      if (!this.apiKey) {
        console.warn("YouTube API key not provided. Using placeholder data.");
        return {
          title: `YouTube Video ${videoId}`,
          description: "This is a placeholder description for a YouTube video.",
          viewCount: 0,
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${this.apiKey}`,
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error(`Video with ID ${videoId} not found`);
      }

      const video = data.items[0];

      return {
        title: video.snippet.title,
        description: video.snippet.description,
        viewCount: parseInt(video.statistics.viewCount, 10) || 0,
      };
    } catch (error) {
      console.error("Error fetching YouTube video details:", error);
      throw error;
    }
  }

  /**
   * Extract YouTube video ID from a YouTube URL
   * @param url YouTube video URL
   * @returns Video ID or null if not a valid YouTube URL
   */
  static extractVideoId(url: string): string | null {
    // Handle youtu.be format
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
      return id || null;
    }

    // Handle youtube.com format
    const videoIdMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    );

    return videoIdMatch ? videoIdMatch[1] : null;
  }
}
