// Instagram fetcher — uses oembed + public page scraping (no API key needed)

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

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

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
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`,
      { headers: HEADERS }
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

// Fetch post details via scraping the public page
export async function getInstagramPost(postUrl: string): Promise<InstagramPost | null> {
  try {
    // Get oembed first for basic info
    const oembed = await getInstagramOembed(postUrl);

    // Extract shortcode from URL
    const shortcodeMatch = postUrl.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
    const shortcode = shortcodeMatch?.[2] || "";

    // Try scraping the page for embedded JSON
    const res = await fetch(postUrl, {
      headers: HEADERS,
      redirect: "follow",
    });

    let postData: any = null;

    if (res.ok) {
      const html = await res.text();

      // Method 1: Look for shared data in script tags
      const sharedDataMatch = html.match(
        /window\._sharedData\s*=\s*({.+?});<\/script>/s
      );
      if (sharedDataMatch) {
        try {
          const json = JSON.parse(sharedDataMatch[1]);
          const media =
            json?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
          if (media) postData = media;
        } catch { /* parse failed */ }
      }

      // Method 2: Look for __additionalData or meta tags
      if (!postData) {
        const additionalMatch = html.match(
          /window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s
        );
        if (additionalMatch) {
          try {
            const json = JSON.parse(additionalMatch[1]);
            const media = json?.graphql?.shortcode_media || json?.items?.[0];
            if (media) postData = media;
          } catch { /* parse failed */ }
        }
      }

      // Method 3: Extract from meta tags
      if (!postData) {
        const ogVideo = html.match(
          /property="og:video"\s+content="([^"]+)"/
        );
        const ogImage = html.match(
          /property="og:image"\s+content="([^"]+)"/
        );
        const ogDescription = html.match(
          /property="og:description"\s+content="([^"]+)"/
        );
        const ogTitle = html.match(
          /property="og:title"\s+content="([^"]+)"/
        );

        if (ogImage || ogDescription) {
          const description = decodeHtmlEntities(ogDescription?.[1] || oembed?.title || "");
          // Parse likes/comments from description like "X likes, Y comments"
          const likesMatch = description.match(/([\d,.]+[KMB]?)\s+likes/i);
          const commentsMatch = description.match(/([\d,.]+[KMB]?)\s+comments/i);

          return {
            id: shortcode,
            shortcode,
            title: oembed?.title || decodeHtmlEntities(ogTitle?.[1] || ""),
            description,
            thumbnail: ogImage?.[1] || oembed?.thumbnail || "",
            authorName: oembed?.authorName || "",
            authorUsername: oembed?.authorName || "",
            viewCount: 0,
            likeCount: parseMetricString(likesMatch?.[1] || "0"),
            commentCount: parseMetricString(commentsMatch?.[1] || "0"),
            shareCount: 0,
            saveCount: 0,
            duration: 0,
            hashtags: extractHashtags(description),
            isVideo: !!ogVideo || postUrl.includes("/reel"),
            createdAt: "",
            url: postUrl,
          };
        }
      }
    }

    // If we have scraped data, use it
    if (postData) {
      return {
        id: postData.id || shortcode,
        shortcode: postData.shortcode || shortcode,
        title: postData.edge_media_to_caption?.edges?.[0]?.node?.text?.substring(0, 200) || oembed?.title || "",
        description: postData.edge_media_to_caption?.edges?.[0]?.node?.text || oembed?.title || "",
        thumbnail: postData.display_url || postData.thumbnail_src || oembed?.thumbnail || "",
        authorName: postData.owner?.full_name || oembed?.authorName || "",
        authorUsername: postData.owner?.username || oembed?.authorName || "",
        viewCount: postData.video_view_count || 0,
        likeCount: postData.edge_media_preview_like?.count || 0,
        commentCount: postData.edge_media_to_comment?.count || postData.edge_media_preview_comment?.count || 0,
        shareCount: 0,
        saveCount: 0,
        duration: postData.video_duration || 0,
        hashtags: extractHashtags(
          postData.edge_media_to_caption?.edges?.[0]?.node?.text || ""
        ),
        isVideo: postData.is_video || postUrl.includes("/reel"),
        createdAt: postData.taken_at_timestamp
          ? new Date(postData.taken_at_timestamp * 1000).toISOString()
          : "",
        url: postUrl,
      };
    }

    // Fallback: oembed-only data
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
    return null;
  }
}

// Fetch profile info by scraping the public page
export async function getInstagramProfile(username: string): Promise<InstagramProfile | null> {
  try {
    const cleanUsername = username.replace("@", "").replace(/\/$/, "");
    const url = `https://www.instagram.com/${cleanUsername}/`;

    const res = await fetch(url, {
      headers: HEADERS,
      redirect: "follow",
    });

    if (!res.ok) {
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
    }

    const html = await res.text();

    // Method 1: window._sharedData
    const sharedDataMatch = html.match(
      /window\._sharedData\s*=\s*({.+?});<\/script>/s
    );
    if (sharedDataMatch) {
      try {
        const json = JSON.parse(sharedDataMatch[1]);
        const user = json?.entry_data?.ProfilePage?.[0]?.graphql?.user;
        if (user) {
          return {
            username: user.username || cleanUsername,
            displayName: user.full_name || cleanUsername,
            avatar: user.profile_pic_url_hd || user.profile_pic_url || "",
            followerCount: user.edge_followed_by?.count || 0,
            followingCount: user.edge_follow?.count || 0,
            postCount: user.edge_owner_to_timeline_media?.count || 0,
            bio: user.biography || "",
            isVerified: user.is_verified || false,
          };
        }
      } catch { /* parse failed */ }
    }

    // Method 2: Extract from meta tags
    const ogDescription = html.match(
      /property="og:description"\s+content="([^"]+)"/
    );
    const ogImage = html.match(
      /property="og:image"\s+content="([^"]+)"/
    );

    if (ogDescription) {
      const desc = decodeHtmlEntities(ogDescription[1]);
      // Parse "1.2M Followers, 100 Following, 500 Posts"
      const followersMatch = desc.match(/([\d,.]+[KMB]?)\s+Followers/i);
      const followingMatch = desc.match(/([\d,.]+[KMB]?)\s+Following/i);
      const postsMatch = desc.match(/([\d,.]+[KMB]?)\s+Posts/i);

      return {
        username: cleanUsername,
        displayName: cleanUsername,
        avatar: ogImage?.[1] || "",
        followerCount: parseMetricString(followersMatch?.[1] || "0"),
        followingCount: parseMetricString(followingMatch?.[1] || "0"),
        postCount: parseMetricString(postsMatch?.[1] || "0"),
        bio: "",
        isVerified: false,
      };
    }

    return {
      username: cleanUsername,
      displayName: cleanUsername,
      avatar: ogImage?.[1] || "",
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

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) || []).map((t) => t.toLowerCase());
}

function parseMetricString(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, "");
  const num = parseFloat(clean);
  if (clean.toUpperCase().endsWith("B")) return Math.round(num * 1_000_000_000);
  if (clean.toUpperCase().endsWith("M")) return Math.round(num * 1_000_000);
  if (clean.toUpperCase().endsWith("K")) return Math.round(num * 1_000);
  return Math.round(num) || 0;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
