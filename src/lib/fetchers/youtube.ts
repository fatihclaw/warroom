// YouTube Data API v3 fetcher
// Requires YOUTUBE_API_KEY in .env.local

const API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeChannelInfo {
  id: string;
  title: string;
  username: string;
  avatar: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: number; // seconds
  viewCount: number;
  likeCount: number;
  commentCount: number;
  channelId: string;
  channelTitle: string;
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    (parseInt(match[1] || "0") * 3600) +
    (parseInt(match[2] || "0") * 60) +
    parseInt(match[3] || "0")
  );
}

export async function getChannelByHandle(
  handle: string,
  apiKey: string
): Promise<YouTubeChannelInfo | null> {
  // Try @handle first
  const res = await fetch(
    `${API_BASE}/channels?part=snippet,statistics&forHandle=${handle}&key=${apiKey}`
  );
  const data = await res.json();

  if (data.items && data.items.length > 0) {
    const ch = data.items[0];
    return {
      id: ch.id,
      title: ch.snippet.title,
      username: handle,
      avatar: ch.snippet.thumbnails?.default?.url || "",
      subscriberCount: parseInt(ch.statistics.subscriberCount || "0"),
      videoCount: parseInt(ch.statistics.videoCount || "0"),
      viewCount: parseInt(ch.statistics.viewCount || "0"),
    };
  }

  // Try as channel ID
  const res2 = await fetch(
    `${API_BASE}/channels?part=snippet,statistics&id=${handle}&key=${apiKey}`
  );
  const data2 = await res2.json();

  if (data2.items && data2.items.length > 0) {
    const ch = data2.items[0];
    return {
      id: ch.id,
      title: ch.snippet.title,
      username: ch.snippet.customUrl || handle,
      avatar: ch.snippet.thumbnails?.default?.url || "",
      subscriberCount: parseInt(ch.statistics.subscriberCount || "0"),
      videoCount: parseInt(ch.statistics.videoCount || "0"),
      viewCount: parseInt(ch.statistics.viewCount || "0"),
    };
  }

  return null;
}

export async function getChannelVideos(
  channelId: string,
  apiKey: string,
  maxResults = 50
): Promise<YouTubeVideoInfo[]> {
  // Get upload playlist ID
  const channelRes = await fetch(
    `${API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  const channelData = await channelRes.json();

  if (!channelData.items?.length) return [];

  const uploadsPlaylistId =
    channelData.items[0].contentDetails.relatedPlaylists.uploads;

  // Get playlist items
  const playlistRes = await fetch(
    `${API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`
  );
  const playlistData = await playlistRes.json();

  if (!playlistData.items?.length) return [];

  const videoIds = playlistData.items
    .map((item: any) => item.contentDetails.videoId)
    .join(",");

  // Get video details
  const videosRes = await fetch(
    `${API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`
  );
  const videosData = await videosRes.json();

  return (videosData.items || []).map((v: any) => ({
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description?.substring(0, 500) || "",
    thumbnail:
      v.snippet.thumbnails?.maxres?.url ||
      v.snippet.thumbnails?.high?.url ||
      v.snippet.thumbnails?.default?.url ||
      "",
    publishedAt: v.snippet.publishedAt,
    duration: parseDuration(v.contentDetails.duration),
    viewCount: parseInt(v.statistics.viewCount || "0"),
    likeCount: parseInt(v.statistics.likeCount || "0"),
    commentCount: parseInt(v.statistics.commentCount || "0"),
    channelId: v.snippet.channelId,
    channelTitle: v.snippet.channelTitle,
  }));
}

// Get YouTube video categories for a region
export async function getVideoCategories(
  apiKey: string,
  regionCode = "US"
): Promise<{ id: string; title: string }[]> {
  const res = await fetch(
    `${API_BASE}/videoCategories?part=snippet&regionCode=${regionCode}&key=${apiKey}`
  );
  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
  }));
}

// Get trending/most popular videos
export async function getTrendingVideos(
  apiKey: string,
  regionCode = "US",
  categoryId?: string,
  maxResults = 25
): Promise<YouTubeVideoInfo[]> {
  let url = `${API_BASE}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&key=${apiKey}`;
  if (categoryId) url += `&videoCategoryId=${categoryId}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube trending error: ${await res.text()}`);
  const data = await res.json();

  return (data.items || []).map((v: any) => ({
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description?.substring(0, 500) || "",
    thumbnail:
      v.snippet.thumbnails?.maxres?.url ||
      v.snippet.thumbnails?.high?.url ||
      v.snippet.thumbnails?.default?.url ||
      "",
    publishedAt: v.snippet.publishedAt,
    duration: parseDuration(v.contentDetails.duration),
    viewCount: parseInt(v.statistics.viewCount || "0"),
    likeCount: parseInt(v.statistics.likeCount || "0"),
    commentCount: parseInt(v.statistics.commentCount || "0"),
    channelId: v.snippet.channelId,
    channelTitle: v.snippet.channelTitle,
  }));
}

// Search for viral videos by keyword
export async function searchViralVideos(
  apiKey: string,
  query: string,
  publishedAfter?: string,
  maxResults = 25
): Promise<YouTubeVideoInfo[]> {
  let searchUrl = `${API_BASE}/search?part=snippet&type=video&order=viewCount&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
  if (publishedAfter) searchUrl += `&publishedAfter=${publishedAfter}`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error(`YouTube search error: ${await searchRes.text()}`);
  const searchData = await searchRes.json();

  const videoIds = (searchData.items || [])
    .map((item: any) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  if (!videoIds) return [];

  const statsRes = await fetch(
    `${API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`
  );
  const statsData = await statsRes.json();

  return (statsData.items || [])
    .map((v: any) => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description?.substring(0, 500) || "",
      thumbnail:
        v.snippet.thumbnails?.maxres?.url ||
        v.snippet.thumbnails?.high?.url ||
        v.snippet.thumbnails?.default?.url ||
        "",
      publishedAt: v.snippet.publishedAt,
      duration: parseDuration(v.contentDetails.duration),
      viewCount: parseInt(v.statistics.viewCount || "0"),
      likeCount: parseInt(v.statistics.likeCount || "0"),
      commentCount: parseInt(v.statistics.commentCount || "0"),
      channelId: v.snippet.channelId,
      channelTitle: v.snippet.channelTitle,
    }))
    .sort((a: YouTubeVideoInfo, b: YouTubeVideoInfo) => b.viewCount - a.viewCount);
}

export async function getVideoById(
  videoId: string,
  apiKey: string
): Promise<YouTubeVideoInfo | null> {
  const res = await fetch(
    `${API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
  );
  const data = await res.json();

  if (!data.items?.length) return null;

  const v = data.items[0];
  return {
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description?.substring(0, 500) || "",
    thumbnail:
      v.snippet.thumbnails?.maxres?.url ||
      v.snippet.thumbnails?.high?.url ||
      v.snippet.thumbnails?.default?.url ||
      "",
    publishedAt: v.snippet.publishedAt,
    duration: parseDuration(v.contentDetails.duration),
    viewCount: parseInt(v.statistics.viewCount || "0"),
    likeCount: parseInt(v.statistics.likeCount || "0"),
    commentCount: parseInt(v.statistics.commentCount || "0"),
    channelId: v.snippet.channelId,
    channelTitle: v.snippet.channelTitle,
  };
}
