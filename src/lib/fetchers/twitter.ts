// X/Twitter fetcher — uses syndication API + oembed (no API key needed for basic data)
// Falls back to API v2 if bearer token is available

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

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// Get tweet info via syndication API (no auth required)
export async function getTweetBySyndication(tweetId: string): Promise<Tweet | null> {
  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en&token=0`,
      {
        headers: {
          ...HEADERS,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.__typename === "TweetTombstone") return null;

    const user = data.user || {};
    const text = data.text || "";

    return {
      id: data.id_str || tweetId,
      text,
      authorId: user.id_str || "",
      authorName: user.name || "",
      authorUsername: user.screen_name || "",
      authorAvatar: user.profile_image_url_https || "",
      viewCount: data.views_count ? Number(data.views_count) : 0,
      likeCount: data.favorite_count || 0,
      retweetCount: data.retweet_count || 0,
      replyCount: data.reply_count || data.conversation_count || 0,
      quoteCount: data.quote_count || 0,
      bookmarkCount: data.bookmark_count || 0,
      createdAt: data.created_at
        ? new Date(data.created_at).toISOString()
        : "",
      mediaUrl:
        data.mediaDetails?.[0]?.media_url_https ||
        data.photos?.[0]?.url ||
        undefined,
      hashtags: extractHashtags(text),
      url: `https://x.com/${user.screen_name || "i"}/status/${tweetId}`,
    };
  } catch {
    return null;
  }
}

// Get tweet via oembed (basic info, always works)
export async function getTweetOembed(
  url: string
): Promise<{ authorName: string; authorUrl: string; html: string } | null> {
  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
      { headers: HEADERS }
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

// Fetch tweet with best available data
export async function getTweet(tweetId: string, username?: string): Promise<Tweet | null> {
  // Try syndication first (richest data, no auth)
  const syndicationTweet = await getTweetBySyndication(tweetId);
  if (syndicationTweet) return syndicationTweet;

  // Fallback to oembed for basic info
  const url = username
    ? `https://x.com/${username}/status/${tweetId}`
    : `https://x.com/i/status/${tweetId}`;

  const oembed = await getTweetOembed(url);
  if (oembed) {
    // Extract text from oembed HTML
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
      url,
    };
  }

  return null;
}

// Fetch X profile via syndication timeline endpoint
export async function getTwitterProfile(username: string): Promise<TwitterProfile | null> {
  try {
    const cleanUsername = username.replace("@", "");

    // Try the syndication timeline endpoint
    const res = await fetch(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${cleanUsername}`,
      {
        headers: HEADERS,
        redirect: "follow",
      }
    );

    if (!res.ok) {
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
    }

    const html = await res.text();

    // Extract user info from the timeline HTML
    let displayName = cleanUsername;
    let avatar = "";
    let bio = "";

    // Try to extract avatar from img tags
    const avatarMatch = html.match(
      /class="[^"]*Avatar[^"]*"[^>]*src="([^"]+)"/
    ) || html.match(/profile_image[^"]*"[^>]*src="([^"]+)"/);

    if (avatarMatch) avatar = avatarMatch[1];

    // Try to extract display name
    const nameMatch = html.match(
      /class="[^"]*UserName[^"]*"[^>]*>([^<]+)</
    ) || html.match(/<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)</i);
    if (nameMatch) displayName = nameMatch[1].trim();

    return {
      username: cleanUsername,
      displayName,
      avatar,
      followerCount: 0,
      followingCount: 0,
      tweetCount: 0,
      bio,
      isVerified: false,
    };
  } catch {
    return null;
  }
}

// Search tweets via API v2 (requires bearer token)
export async function searchPopularTweets(
  bearerToken: string,
  query: string,
  maxResults = 25
): Promise<Tweet[]> {
  const params = new URLSearchParams({
    query: `${query} -is:retweet lang:en`,
    "tweet.fields": "public_metrics,created_at,author_id",
    "user.fields": "name,username,profile_image_url",
    expansions: "author_id,attachments.media_keys",
    "media.fields": "url,preview_image_url",
    max_results: String(Math.min(maxResults, 100)),
    sort_order: "relevancy",
  });

  const res = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?${params}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  if (!data.data) return [];

  const users: Record<string, { name: string; username: string; avatar: string }> = {};
  for (const u of data.includes?.users || []) {
    users[u.id] = {
      name: u.name,
      username: u.username,
      avatar: u.profile_image_url || "",
    };
  }

  return data.data.map((tweet: any) => ({
    id: tweet.id,
    text: tweet.text,
    authorId: tweet.author_id,
    authorName: users[tweet.author_id]?.name || "",
    authorUsername: users[tweet.author_id]?.username || "",
    authorAvatar: users[tweet.author_id]?.avatar || "",
    viewCount: tweet.public_metrics?.impression_count || 0,
    likeCount: tweet.public_metrics?.like_count || 0,
    retweetCount: tweet.public_metrics?.retweet_count || 0,
    replyCount: tweet.public_metrics?.reply_count || 0,
    quoteCount: tweet.public_metrics?.quote_count || 0,
    bookmarkCount: tweet.public_metrics?.bookmark_count || 0,
    createdAt: tweet.created_at,
    hashtags: extractHashtags(tweet.text),
    url: `https://x.com/${users[tweet.author_id]?.username || "i"}/status/${tweet.id}`,
  }));
}

// Get trending topics (requires bearer token, uses v1.1 endpoint)
export async function getTrendingTopics(
  bearerToken: string,
  woeid = 1
): Promise<{ name: string; tweetVolume: number | null; url: string }[]> {
  const res = await fetch(
    `https://api.twitter.com/1.1/trends/place.json?id=${woeid}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data[0]?.trends || []).map((t: any) => ({
    name: t.name,
    tweetVolume: t.tweet_volume,
    url: t.url,
  }));
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) || []).map((t) => t.toLowerCase());
}
