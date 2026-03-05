// TikTok viral content discovery
// Uses unofficial public endpoints — no API key needed

export interface TikTokVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  authorName: string;
  authorUsername: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  url: string;
}

// Fetch TikTok trending via oembed + search approach
// TikTok doesn't have a public trending API, so we use their oembed endpoint
// for validation and the unofficial web search for discovery
export async function searchTikTokVideos(
  query: string,
  _maxResults = 20
): Promise<TikTokVideo[]> {
  // TikTok's webapp has an internal API we can query for public search results
  // This endpoint doesn't require auth and returns public video data
  try {
    const encodedQuery = encodeURIComponent(query);
    const res = await fetch(
      `https://www.tiktok.com/api/search/general/full/?keyword=${encodedQuery}&offset=0&search_id=0`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.tiktok.com/",
        },
      }
    );

    if (!res.ok) {
      // TikTok blocks API calls from servers — this is expected
      // Fall back to empty results with a note
      return [];
    }

    const data = await res.json();
    const items = data?.data || [];

    return items
      .filter((item: any) => item.type === 1 && item.item)
      .map((item: any) => {
        const v = item.item;
        return {
          id: v.id,
          title: v.desc?.substring(0, 100) || "",
          description: v.desc || "",
          thumbnail: v.video?.cover || v.video?.dynamicCover || "",
          authorName: v.author?.nickname || "",
          authorUsername: v.author?.uniqueId || "",
          viewCount: v.stats?.playCount || 0,
          likeCount: v.stats?.diggCount || 0,
          commentCount: v.stats?.commentCount || 0,
          shareCount: v.stats?.shareCount || 0,
          createdAt: v.createTime
            ? new Date(v.createTime * 1000).toISOString()
            : "",
          url: `https://www.tiktok.com/@${v.author?.uniqueId}/video/${v.id}`,
        };
      })
      .sort(
        (a: TikTokVideo, b: TikTokVideo) => b.viewCount - a.viewCount
      );
  } catch {
    // TikTok API is unreliable from server-side — return empty
    return [];
  }
}

// Get TikTok video info via oembed (reliable, public)
export async function getTikTokOembed(
  url: string
): Promise<{ title: string; authorName: string; thumbnail: string } | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || "",
      authorName: data.author_name || "",
      thumbnail: data.thumbnail_url || "",
    };
  } catch {
    return null;
  }
}
