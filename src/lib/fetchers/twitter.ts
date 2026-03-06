// X/Twitter fetcher — uses Apify Actor: quacker/twitter-scraper

export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  viewCount: number;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  bookmarkCount: number;
  createdAt: string;
  mediaUrl?: string;
  hashtags: string[];
  url: string;
}

export interface TwitterProfile {
  username: string;
  displayName: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  tweetCount: number;
  bio: string;
  isVerified: boolean;
}

const APIFY_TOKEN = () => process.env.APIFY_API_TOKEN || "";
const ACTOR_ID = "quacker~twitter-scraper";

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
    throw new Error(`Apify Twitter error (${res.status}): ${text.substring(0, 200)}`);
  }

  return res.json();
}

// Get tweet via oembed (basic info, always works)
export async function getTweetOembed(
  url: string
): Promise<{ authorName: string; authorUrl: string; html: string } | null> {
  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      authorName: data.author_name || "",
      authorUrl: data.author_url || "",
      html: data.html || "",
    };
  } catch {
    return null;
  }
}

// Fetch tweet via Apify (replaces syndication + oembed approach)
export async function getTweet(tweetId: string, username?: string): Promise<Tweet | null> {
  try {
    const tweetUrl = username
      ? `https://x.com/${username}/status/${tweetId}`
      : `https://x.com/i/status/${tweetId}`;

    const items = await runApifyActor({
      tweetIDs: [tweetId],
      maxItems: 1,
    });

    if (items.length > 0) {
      return mapTweetItem(items[0], tweetId);
    }

    // Fallback to oembed
    const oembed = await getTweetOembed(tweetUrl);
    if (oembed) {
      const textMatch = oembed.html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      const text = textMatch?.[1]?.replace(/<[^>]+>/g, "") || "";
      return {
        id: tweetId,
        text,
        authorId: "",
        authorName: oembed.authorName,
        authorUsername: username || oembed.authorUrl.split("/").pop() || "",
        authorAvatar: "",
        viewCount: 0,
        likeCount: 0,
        retweetCount: 0,
        replyCount: 0,
        quoteCount: 0,
        bookmarkCount: 0,
        createdAt: "",
        hashtags: extractHashtags(text),
        url: tweetUrl,
      };
    }

    return null;
  } catch {
    // Fallback to oembed on Apify error
    const tweetUrl = username
      ? `https://x.com/${username}/status/${tweetId}`
      : `https://x.com/i/status/${tweetId}`;
    const oembed = await getTweetOembed(tweetUrl);
    if (oembed) {
      const textMatch = oembed.html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      const text = textMatch?.[1]?.replace(/<[^>]+>/g, "") || "";
      return {
        id: tweetId,
        text,
        authorId: "",
        authorName: oembed.authorName,
        authorUsername: username || oembed.authorUrl.split("/").pop() || "",
        authorAvatar: "",
        viewCount: 0,
        likeCount: 0,
        retweetCount: 0,
        replyCount: 0,
        quoteCount: 0,
        bookmarkCount: 0,
        createdAt: "",
        hashtags: extractHashtags(text),
        url: tweetUrl,
      };
    }
    return null;
  }
}

// Kept for backward compat — now routes through getTweet
export async function getTweetBySyndication(tweetId: string): Promise<Tweet | null> {
  return getTweet(tweetId);
}

// Fetch X profile via Apify
export async function getTwitterProfile(username: string): Promise<TwitterProfile | null> {
  try {
    const cleanUsername = username.replace("@", "");

    const items = await runApifyActor({
      getFollowers: false,
      getFollowing: false,
      getRetweeters: false,
      includeUnavailableUsers: false,
      maxItems: 1,
      twitterHandles: [cleanUsername],
    });

    if (items.length > 0) {
      const p = items[0];
      return {
        username: p.userName || p.screen_name || p.username || cleanUsername,
        displayName: p.name || p.displayName || cleanUsername,
        avatar: p.profilePicture || p.profile_image_url_https || p.avatarUrl || "",
        followerCount: p.followers || p.followersCount || p.followers_count || 0,
        followingCount: p.following || p.friendsCount || p.friends_count || 0,
        tweetCount: p.statusesCount || p.tweetsCount || p.statuses_count || 0,
        bio: p.description || p.bio || "",
        isVerified: p.isVerified || p.isBlueVerified || p.verified || false,
      };
    }

    return {
      username: cleanUsername,
      displayName: cleanUsername,
      avatar: "",
      followerCount: 0,
      followingCount: 0,
      tweetCount: 0,
      bio: "",
      isVerified: false,
    };
  } catch {
    return null;
  }
}

// Search tweets via Apify (replaces API v2 bearer token approach)
export async function searchPopularTweets(
  _bearerTokenOrQuery: string,
  queryOrMaxResults?: string | number,
  maxResultsArg?: number
): Promise<Tweet[]> {
  // Support both old signature (bearerToken, query, max) and new (query, max)
  let query: string;
  let maxResults: number;
  if (typeof queryOrMaxResults === "string") {
    // Old signature: searchPopularTweets(bearerToken, query, maxResults)
    query = queryOrMaxResults;
    maxResults = maxResultsArg || 25;
  } else {
    // New signature: searchPopularTweets(query, maxResults)
    query = _bearerTokenOrQuery;
    maxResults = (queryOrMaxResults as number) || 25;
  }

  try {
    const items = await runApifyActor({
      searchTerms: [query],
      maxItems: Math.min(maxResults, 30),
      sort: "Top",
    });

    return items
      .map((item: any) => mapTweetItem(item))
      .filter((t): t is Tweet => t !== null);
  } catch {
    return [];
  }
}

// Get trending topics via Apify
export async function getTrendingTopics(
  _bearerToken?: string,
  _woeid?: number
): Promise<{ name: string; tweetVolume: number | null; url: string }[]> {
  // Apify doesn't have a direct trending endpoint equivalent
  // Return empty — trending is best handled by the discover route's search
  return [];
}

function mapTweetItem(item: any, fallbackId?: string): Tweet | null {
  if (!item) return null;

  const id = item.id || item.id_str || item.tweetId || fallbackId || "";
  const authorUsername =
    item.author?.userName ||
    item.user?.screen_name ||
    item.authorUsername ||
    item.screen_name ||
    "";

  return {
    id,
    text: item.text || item.full_text || item.fullText || "",
    authorId: item.author?.id || item.user?.id_str || item.authorId || "",
    authorName: item.author?.name || item.user?.name || item.authorName || "",
    authorUsername,
    authorAvatar:
      item.author?.profilePicture ||
      item.user?.profile_image_url_https ||
      item.authorAvatar ||
      "",
    viewCount: item.viewCount || item.views?.count || item.impressionCount || 0,
    likeCount: item.likeCount || item.favorite_count || item.favoritesCount || 0,
    retweetCount: item.retweetCount || item.retweet_count || item.retweetsCount || 0,
    replyCount: item.replyCount || item.reply_count || item.repliesCount || 0,
    quoteCount: item.quoteCount || item.quote_count || item.quotesCount || 0,
    bookmarkCount: item.bookmarkCount || item.bookmark_count || item.bookmarksCount || 0,
    createdAt: item.createdAt || item.created_at
      ? new Date(item.createdAt || item.created_at).toISOString()
      : "",
    mediaUrl:
      item.media?.[0]?.url ||
      item.entities?.media?.[0]?.media_url_https ||
      item.mediaUrl ||
      undefined,
    hashtags: item.hashtags
      ? item.hashtags.map((h: any) => `#${(h.text || h.tag || h).toString().toLowerCase()}`)
      : extractHashtags(item.text || item.full_text || ""),
    url: item.url || `https://x.com/${authorUsername || "i"}/status/${id}`,
  };
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) || []).map((t) => t.toLowerCase());
}
