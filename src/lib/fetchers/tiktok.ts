// TikTok fetcher — uses oembed + public web scraping (no API key needed)

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

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

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
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { headers: HEADERS }
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

// Fetch video details by scraping the public page's embedded JSON
export async function getTikTokVideo(videoUrl: string): Promise<TikTokVideo | null> {
  try {
    // First get oembed for basic info
    const oembed = await getTikTokOembed(videoUrl);

    // Try scraping the page for __UNIVERSAL_DATA_FOR_REHYDRATION__
    const res = await fetch(videoUrl, {
      headers: HEADERS,
      redirect: "follow",
    });

    if (!res.ok) {
      // Fallback to oembed-only data
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

    const html = await res.text();

    // Try to extract SIGI_STATE or __UNIVERSAL_DATA_FOR_REHYDRATION__
    let videoData: any = null;

    // Method 1: __UNIVERSAL_DATA_FOR_REHYDRATION__
    const universalMatch = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]+?)<\/script>/
    );
    if (universalMatch) {
      try {
        const json = JSON.parse(universalMatch[1]);
        const defaultScope = json?.["__DEFAULT_SCOPE__"];
        const detail = defaultScope?.["webapp.video-detail"]?.["itemInfo"]?.["itemStruct"];
        if (detail) videoData = detail;
      } catch { /* parse failed */ }
    }

    // Method 2: SIGI_STATE
    if (!videoData) {
      const sigiMatch = html.match(
        /<script id="SIGI_STATE"[^>]*>([\s\S]+?)<\/script>/
      );
      if (sigiMatch) {
        try {
          const json = JSON.parse(sigiMatch[1]);
          const itemModule = json?.ItemModule;
          if (itemModule) {
            const key = Object.keys(itemModule)[0];
            if (key) videoData = itemModule[key];
          }
        } catch { /* parse failed */ }
      }
    }

    if (videoData) {
      return {
        id: videoData.id || "",
        title: videoData.desc || oembed?.title || "",
        description: videoData.desc || "",
        thumbnail:
          videoData.video?.cover ||
          videoData.video?.dynamicCover ||
          oembed?.thumbnail ||
          "",
        authorName:
          videoData.author?.nickname || oembed?.authorName || "",
        authorUsername:
          videoData.author?.uniqueId || "",
        viewCount: videoData.stats?.playCount || 0,
        likeCount: videoData.stats?.diggCount || 0,
        commentCount: videoData.stats?.commentCount || 0,
        shareCount: videoData.stats?.shareCount || 0,
        saveCount: videoData.stats?.collectCount || 0,
        duration: videoData.video?.duration || 0,
        hashtags: (videoData.textExtra || [])
          .filter((t: any) => t.hashtagName)
          .map((t: any) => `#${t.hashtagName}`.toLowerCase()),
        createdAt: videoData.createTime
          ? new Date(Number(videoData.createTime) * 1000).toISOString()
          : "",
        url: videoUrl,
      };
    }

    // Fallback: oembed-only data
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
    return null;
  }
}

// Fetch TikTok profile by scraping the public page
export async function getTikTokProfile(username: string): Promise<TikTokProfile | null> {
  try {
    const cleanUsername = username.replace("@", "");
    const url = `https://www.tiktok.com/@${cleanUsername}`;

    const res = await fetch(url, {
      headers: HEADERS,
      redirect: "follow",
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Try __UNIVERSAL_DATA_FOR_REHYDRATION__
    const universalMatch = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]+?)<\/script>/
    );
    if (universalMatch) {
      try {
        const json = JSON.parse(universalMatch[1]);
        const defaultScope = json?.["__DEFAULT_SCOPE__"];
        const userDetail = defaultScope?.["webapp.user-detail"]?.["userInfo"];
        if (userDetail) {
          return {
            username: userDetail.user?.uniqueId || cleanUsername,
            displayName: userDetail.user?.nickname || cleanUsername,
            avatar: userDetail.user?.avatarLarger || userDetail.user?.avatarMedium || "",
            followerCount: userDetail.stats?.followerCount || 0,
            followingCount: userDetail.stats?.followingCount || 0,
            likeCount: userDetail.stats?.heartCount || 0,
            videoCount: userDetail.stats?.videoCount || 0,
            bio: userDetail.user?.signature || "",
          };
        }
      } catch { /* parse failed */ }
    }

    // Try SIGI_STATE
    const sigiMatch = html.match(
      /<script id="SIGI_STATE"[^>]*>([\s\S]+?)<\/script>/
    );
    if (sigiMatch) {
      try {
        const json = JSON.parse(sigiMatch[1]);
        const userModule = json?.UserModule?.users;
        const statsModule = json?.UserModule?.stats;
        if (userModule) {
          const key = Object.keys(userModule)[0];
          const user = userModule[key];
          const stats = statsModule?.[key];
          if (user) {
            return {
              username: user.uniqueId || cleanUsername,
              displayName: user.nickname || cleanUsername,
              avatar: user.avatarLarger || user.avatarMedium || "",
              followerCount: stats?.followerCount || 0,
              followingCount: stats?.followingCount || 0,
              likeCount: stats?.heartCount || 0,
              videoCount: stats?.videoCount || 0,
              bio: user.signature || "",
            };
          }
        }
      } catch { /* parse failed */ }
    }

    // Minimal fallback
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

// Search TikTok videos (used by discover route)
// TikTok blocks server-side API calls, so this returns empty most of the time
export async function searchTikTokVideos(
  query: string,
  _maxResults = 20
): Promise<TikTokVideo[]> {
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

    if (!res.ok) return [];

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
          saveCount: v.stats?.collectCount || 0,
          duration: v.video?.duration || 0,
          hashtags: (v.textExtra || [])
            .filter((t: any) => t.hashtagName)
            .map((t: any) => `#${t.hashtagName}`.toLowerCase()),
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
    return [];
  }
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) || []).map((t) => t.toLowerCase());
}
