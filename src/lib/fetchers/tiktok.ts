// TikTok fetcher — uses Apify Actor: clockworks/tiktok-scraper

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
  saveCount: number;
  duration: number;
  hashtags: string[];
  createdAt: string;
  url: string;
}

export interface TikTokProfile {
  username: string;
  displayName: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  likeCount: number;
  videoCount: number;
  bio: string;
}

const APIFY_TOKEN = () => process.env.APIFY_API_TOKEN || "";
const ACTOR_ID = "clockworks~tiktok-scraper";

async function runApifyActor(input: Record<string, any>): Promise<any[]> {
  const token = APIFY_TOKEN();
  if (!token) throw new Error("APIFY_API_TOKEN not configured");

  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, timeoutSecs: 120 }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify TikTok error (${res.status}): ${text.substring(0, 200)}`);
  }

  return res.json();
}

// Get basic video info via oembed (reliable, public, no auth)
export async function getTikTokOembed(
  url: string
): Promise<{
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnail: string;
} | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || "",
      authorName: data.author_name || "",
      authorUrl: data.author_url || "",
      thumbnail: data.thumbnail_url || "",
    };
  } catch {
    return null;
  }
}

// Fetch video details via Apify
export async function getTikTokVideo(videoUrl: string): Promise<TikTokVideo | null> {
  try {
    const items = await runApifyActor({
      postURLs: [videoUrl],
      resultsPerPage: 1,
    });

    if (items.length > 0) {
      return mapVideoItem(items[0], videoUrl);
    }

    // Fallback to oembed
    const oembed = await getTikTokOembed(videoUrl);
    if (oembed) {
      const urlMatch = videoUrl.match(/video\/(\d+)/);
      const userMatch = videoUrl.match(/@([^/]+)/);
      return {
        id: urlMatch?.[1] || "",
        title: oembed.title,
        description: oembed.title,
        thumbnail: oembed.thumbnail,
        authorName: oembed.authorName,
        authorUsername: userMatch?.[1] || oembed.authorName,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        saveCount: 0,
        duration: 0,
        hashtags: extractHashtags(oembed.title),
        createdAt: "",
        url: videoUrl,
      };
    }

    return null;
  } catch {
    // Fallback to oembed on any Apify error
    const oembed = await getTikTokOembed(videoUrl);
    if (oembed) {
      const urlMatch = videoUrl.match(/video\/(\d+)/);
      const userMatch = videoUrl.match(/@([^/]+)/);
      return {
        id: urlMatch?.[1] || "",
        title: oembed.title,
        description: oembed.title,
        thumbnail: oembed.thumbnail,
        authorName: oembed.authorName,
        authorUsername: userMatch?.[1] || oembed.authorName,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        saveCount: 0,
        duration: 0,
        hashtags: extractHashtags(oembed.title),
        createdAt: "",
        url: videoUrl,
      };
    }
    return null;
  }
}

// Fetch TikTok profile via Apify
export async function getTikTokProfile(username: string): Promise<TikTokProfile | null> {
  try {
    const cleanUsername = username.replace("@", "");
    const items = await runApifyActor({
      profiles: [cleanUsername],
      resultsPerPage: 1,
    });

    if (items.length > 0) {
      const p = items[0];
      return {
        username: p.uniqueId || p.authorMeta?.name || cleanUsername,
        displayName: p.nickname || p.authorMeta?.nickName || cleanUsername,
        avatar: p.avatarLarger || p.avatarMedium || p.authorMeta?.avatar || "",
        followerCount: p.followerCount || p.fans || p.authorMeta?.fans || 0,
        followingCount: p.followingCount || p.following || p.authorMeta?.following || 0,
        likeCount: p.heartCount || p.heart || p.authorMeta?.heart || 0,
        videoCount: p.videoCount || p.authorMeta?.video || 0,
        bio: p.signature || p.authorMeta?.signature || "",
      };
    }

    return {
      username: cleanUsername,
      displayName: cleanUsername,
      avatar: "",
      followerCount: 0,
      followingCount: 0,
      likeCount: 0,
      videoCount: 0,
      bio: "",
    };
  } catch {
    return null;
  }
}

// Search TikTok videos via Apify
export async function searchTikTokVideos(
  query: string,
  maxResults = 20
): Promise<TikTokVideo[]> {
  try {
    const items = await runApifyActor({
      searchQueries: [query],
      resultsPerPage: Math.min(maxResults, 30),
    });

    return items
      .map((item: any) => mapVideoItem(item))
      .filter((v): v is TikTokVideo => v !== null)
      .sort((a, b) => b.viewCount - a.viewCount);
  } catch {
    return [];
  }
}

function mapVideoItem(item: any, fallbackUrl?: string): TikTokVideo | null {
  if (!item) return null;

  const id = item.id || item.videoId || "";
  const authorUsername = item.authorMeta?.name || item.author?.uniqueId || item.uniqueId || "";
  const url =
    item.webVideoUrl ||
    item.videoUrl ||
    fallbackUrl ||
    (authorUsername && id
      ? `https://www.tiktok.com/@${authorUsername}/video/${id}`
      : "");

  return {
    id,
    title: (item.text || item.desc || "").substring(0, 200),
    description: item.text || item.desc || "",
    thumbnail:
      item.videoMeta?.coverUrl ||
      item.covers?.default ||
      item.video?.cover ||
      "",
    authorName: item.authorMeta?.nickName || item.author?.nickname || "",
    authorUsername,
    viewCount: item.playCount || item.stats?.playCount || item.videoMeta?.playCount || 0,
    likeCount: item.diggCount || item.stats?.diggCount || item.videoMeta?.diggCount || 0,
    commentCount: item.commentCount || item.stats?.commentCount || 0,
    shareCount: item.shareCount || item.stats?.shareCount || 0,
    saveCount: item.collectCount || item.stats?.collectCount || 0,
    duration: item.videoMeta?.duration || item.video?.duration || 0,
    hashtags: (item.hashtags || [])
      .map((h: any) => `#${(h.name || h).toString().toLowerCase()}`)
      .filter((h: string) => h.length > 1),
    createdAt: item.createTimeISO || item.createTime
      ? (item.createTimeISO || new Date(Number(item.createTime) * 1000).toISOString())
      : "",
    url,
  };
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) || []).map((t) => t.toLowerCase());
}
