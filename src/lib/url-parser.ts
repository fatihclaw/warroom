// Universal URL parser: detect platform and extract IDs from social media URLs

export type Platform = "youtube" | "tiktok" | "instagram" | "twitter" | "linkedin";

export interface ParsedUrl {
  platform: Platform;
  type: "video" | "profile" | "unknown";
  id: string; // video ID or username
  username?: string;
  url: string;
}

export function parseSocialUrl(url: string): ParsedUrl | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "").replace("m.", "");

    // YouTube
    if (hostname.includes("youtube.com") || hostname === "youtu.be") {
      // Video: youtube.com/watch?v=xxx or youtu.be/xxx
      if (parsed.searchParams.get("v")) {
        return {
          platform: "youtube",
          type: "video",
          id: parsed.searchParams.get("v")!,
          url,
        };
      }
      if (hostname === "youtu.be") {
        return {
          platform: "youtube",
          type: "video",
          id: parsed.pathname.slice(1),
          url,
        };
      }
      // Shorts
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) {
        return {
          platform: "youtube",
          type: "video",
          id: shortsMatch[1],
          url,
        };
      }
      // Channel: youtube.com/@username or youtube.com/channel/xxx
      const channelMatch = parsed.pathname.match(/\/@([^/?]+)/);
      if (channelMatch) {
        return {
          platform: "youtube",
          type: "profile",
          id: channelMatch[1],
          username: channelMatch[1],
          url,
        };
      }
      const channelIdMatch = parsed.pathname.match(/\/channel\/([^/?]+)/);
      if (channelIdMatch) {
        return {
          platform: "youtube",
          type: "profile",
          id: channelIdMatch[1],
          url,
        };
      }
    }

    // TikTok
    if (hostname.includes("tiktok.com")) {
      // Video: tiktok.com/@user/video/xxx
      const videoMatch = parsed.pathname.match(/\/@([^/]+)\/video\/(\d+)/);
      if (videoMatch) {
        return {
          platform: "tiktok",
          type: "video",
          id: videoMatch[2],
          username: videoMatch[1],
          url,
        };
      }
      // Profile: tiktok.com/@user
      const profileMatch = parsed.pathname.match(/\/@([^/?]+)/);
      if (profileMatch) {
        return {
          platform: "tiktok",
          type: "profile",
          id: profileMatch[1],
          username: profileMatch[1],
          url,
        };
      }
    }

    // Instagram
    if (hostname.includes("instagram.com")) {
      // Post/Reel: instagram.com/p/xxx or instagram.com/reel/xxx
      const postMatch = parsed.pathname.match(/\/(p|reel|reels)\/([^/?]+)/);
      if (postMatch) {
        return {
          platform: "instagram",
          type: "video",
          id: postMatch[2],
          url,
        };
      }
      // Profile: instagram.com/username
      const igProfile = parsed.pathname.replace(/\//g, "");
      if (igProfile && !["explore", "accounts", "about"].includes(igProfile)) {
        return {
          platform: "instagram",
          type: "profile",
          id: igProfile,
          username: igProfile,
          url,
        };
      }
    }

    // X/Twitter
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      // Tweet: twitter.com/user/status/xxx
      const tweetMatch = parsed.pathname.match(/\/([^/]+)\/status\/(\d+)/);
      if (tweetMatch) {
        return {
          platform: "twitter",
          type: "video",
          id: tweetMatch[2],
          username: tweetMatch[1],
          url,
        };
      }
      // Profile: twitter.com/username
      const twitterProfile = parsed.pathname.slice(1).split("/")[0];
      if (
        twitterProfile &&
        !["home", "explore", "notifications", "messages", "settings", "i"].includes(twitterProfile)
      ) {
        return {
          platform: "twitter",
          type: "profile",
          id: twitterProfile,
          username: twitterProfile,
          url,
        };
      }
    }

    // LinkedIn
    if (hostname.includes("linkedin.com")) {
      // Post: linkedin.com/feed/update/urn:li:activity:xxx
      const linkedinPost = parsed.pathname.match(/\/feed\/update\/([^/?]+)/);
      if (linkedinPost) {
        return {
          platform: "linkedin",
          type: "video",
          id: linkedinPost[1],
          url,
        };
      }
      // Profile: linkedin.com/in/username
      const linkedinProfile = parsed.pathname.match(/\/in\/([^/?]+)/);
      if (linkedinProfile) {
        return {
          platform: "linkedin",
          type: "profile",
          id: linkedinProfile[1],
          username: linkedinProfile[1],
          url,
        };
      }
      // Company: linkedin.com/company/name
      const company = parsed.pathname.match(/\/company\/([^/?]+)/);
      if (company) {
        return {
          platform: "linkedin",
          type: "profile",
          id: company[1],
          username: company[1],
          url,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    youtube: "#ff0000",
    tiktok: "#000000",
    instagram: "#e1306c",
    twitter: "#1da1f2",
    linkedin: "#0a66c2",
  };
  return colors[platform];
}

export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "X/Twitter",
    linkedin: "LinkedIn",
  };
  return names[platform];
}
