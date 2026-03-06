// Instagram fetcher — uses Apify Actor: apify/instagram-scraper

export interface InstagramPost {
  id: string;
  shortcode: string;
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
  isVideo: boolean;
  createdAt: string;
  url: string;
}

export interface InstagramProfile {
  username: string;
  displayName: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  bio: string;
  isVerified: boolean;
}

const APIFY_TOKEN = () => process.env.APIFY_API_TOKEN || "";
const ACTOR_ID = "apify~instagram-scraper";

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
    throw new Error(`Apify Instagram error (${res.status}): ${text.substring(0, 200)}`);
  }

  return res.json();
}

// Get post info via Instagram's oembed endpoint (reliable, public)
export async function getInstagramOembed(
  url: string
): Promise<{
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnail: string;
  html: string;
} | null> {
  try {
    const res = await fetch(
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || "",
      authorName: data.author_name || "",
      authorUrl: data.author_url || "",
      thumbnail: data.thumbnail_url || "",
      html: data.html || "",
    };
  } catch {
    return null;
  }
}

// Fetch post details via Apify
export async function getInstagramPost(postUrl: string): Promise<InstagramPost | null> {
  try {
    const shortcodeMatch = postUrl.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
    const shortcode = shortcodeMatch?.[2] || "";

    const items = await runApifyActor({
      directUrls: [postUrl],
      resultsType: "posts",
      resultsLimit: 1,
    });

    if (items.length > 0) {
      return mapPostItem(items[0], shortcode, postUrl);
    }

    // Fallback to oembed
    const oembed = await getInstagramOembed(postUrl);
    if (oembed) {
      return {
        id: shortcode,
        shortcode,
        title: oembed.title,
        description: oembed.title,
        thumbnail: oembed.thumbnail,
        authorName: oembed.authorName,
        authorUsername: oembed.authorName,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        saveCount: 0,
        duration: 0,
        hashtags: extractHashtags(oembed.title),
        isVideo: postUrl.includes("/reel"),
        createdAt: "",
        url: postUrl,
      };
    }

    return null;
  } catch {
    // Fallback to oembed on any Apify error
    const oembed = await getInstagramOembed(postUrl);
    if (oembed) {
      const shortcodeMatch = postUrl.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
      const shortcode = shortcodeMatch?.[2] || "";
      return {
        id: shortcode,
        shortcode,
        title: oembed.title,
        description: oembed.title,
        thumbnail: oembed.thumbnail,
        authorName: oembed.authorName,
        authorUsername: oembed.authorName,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        saveCount: 0,
        duration: 0,
        hashtags: extractHashtags(oembed.title),
        isVideo: postUrl.includes("/reel"),
        createdAt: "",
        url: postUrl,
      };
    }
    return null;
  }
}

// Fetch profile info via Apify
export async function getInstagramProfile(username: string): Promise<InstagramProfile | null> {
  try {
    const cleanUsername = username.replace("@", "").replace(/\/$/, "");

    const items = await runApifyActor({
      directUrls: [`https://www.instagram.com/${cleanUsername}/`],
      resultsType: "details",
      resultsLimit: 1,
    });

    if (items.length > 0) {
      const p = items[0];
      return {
        username: p.username || cleanUsername,
        displayName: p.fullName || p.full_name || cleanUsername,
        avatar: p.profilePicUrlHD || p.profilePicUrl || p.profile_pic_url_hd || p.profile_pic_url || "",
        followerCount: p.followersCount || p.followedByCount || p.edge_followed_by?.count || 0,
        followingCount: p.followsCount || p.followCount || p.edge_follow?.count || 0,
        postCount: p.postsCount || p.mediaCount || p.edge_owner_to_timeline_media?.count || 0,
        bio: p.biography || p.bio || "",
        isVerified: p.verified || p.isVerified || p.is_verified || false,
      };
    }

    return {
      username: cleanUsername,
      displayName: cleanUsername,
      avatar: "",
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      bio: "",
      isVerified: false,
    };
  } catch {
    return null;
  }
}

// Search Instagram posts via Apify
export async function searchInstagramPosts(
  query: string,
  maxResults = 20
): Promise<InstagramPost[]> {
  try {
    const items = await runApifyActor({
      search: query,
      resultsType: "posts",
      resultsLimit: Math.min(maxResults, 30),
    });

    return items
      .map((item: any) => mapPostItem(item))
      .filter((p): p is InstagramPost => p !== null)
      .sort((a, b) => (b.viewCount || b.likeCount) - (a.viewCount || a.likeCount));
  } catch {
    return [];
  }
}

function mapPostItem(item: any, fallbackShortcode?: string, fallbackUrl?: string): InstagramPost | null {
  if (!item) return null;

  const shortcode = item.shortCode || item.shortcode || item.code || fallbackShortcode || "";
  const caption = item.caption || item.edge_media_to_caption?.edges?.[0]?.node?.text || "";
  const url = item.url || fallbackUrl || `https://www.instagram.com/p/${shortcode}/`;

  return {
    id: item.id || shortcode,
    shortcode,
    title: caption.substring(0, 200),
    description: caption,
    thumbnail:
      item.displayUrl ||
      item.display_url ||
      item.thumbnailUrl ||
      item.thumbnail_src ||
      "",
    authorName:
      item.ownerFullName ||
      item.owner?.full_name ||
      item.ownerUsername ||
      "",
    authorUsername:
      item.ownerUsername ||
      item.owner?.username ||
      "",
    viewCount: item.videoViewCount || item.video_view_count || item.playCount || 0,
    likeCount: item.likesCount || item.likes || item.edge_media_preview_like?.count || 0,
    commentCount: item.commentsCount || item.comments || item.edge_media_to_comment?.count || 0,
    shareCount: 0,
    saveCount: 0,
    duration: item.videoDuration || item.video_duration || 0,
    hashtags: item.hashtags
      ? item.hashtags.map((h: string) => `#${h.toLowerCase()}`)
      : extractHashtags(caption),
    isVideo: item.isVideo || item.is_video || item.type === "Video" || url.includes("/reel"),
    createdAt: item.timestamp || item.taken_at_timestamp
      ? new Date(
          (item.timestamp || item.taken_at_timestamp) * (String(item.timestamp || item.taken_at_timestamp).length <= 10 ? 1000 : 1)
        ).toISOString()
      : "",
    url,
  };
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) || []).map((t) => t.toLowerCase());
}
