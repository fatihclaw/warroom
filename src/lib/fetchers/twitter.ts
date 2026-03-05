// X/Twitter API v2 fetcher
// Requires a Bearer Token from the Twitter Developer Portal

const API_BASE = "https://api.twitter.com/2";

export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  viewCount: number;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  createdAt: string;
  mediaUrl?: string;
}

// Search recent tweets (last 7 days) sorted by popularity
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

  const res = await fetch(`${API_BASE}/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  if (!data.data) return [];

  // Build user lookup
  const users: Record<string, { name: string; username: string }> = {};
  for (const u of data.includes?.users || []) {
    users[u.id] = { name: u.name, username: u.username };
  }

  return data.data.map((tweet: any) => ({
    id: tweet.id,
    text: tweet.text,
    authorId: tweet.author_id,
    authorName: users[tweet.author_id]?.name || "",
    authorUsername: users[tweet.author_id]?.username || "",
    viewCount: tweet.public_metrics?.impression_count || 0,
    likeCount: tweet.public_metrics?.like_count || 0,
    retweetCount: tweet.public_metrics?.retweet_count || 0,
    replyCount: tweet.public_metrics?.reply_count || 0,
    quoteCount: tweet.public_metrics?.quote_count || 0,
    createdAt: tweet.created_at,
  }));
}

// Get trending topics for a WOEID (1 = worldwide, 23424977 = US)
export async function getTrendingTopics(
  bearerToken: string,
  woeid = 1
): Promise<{ name: string; tweetVolume: number | null; url: string }[]> {
  // Note: This uses v1.1 trends endpoint (still available with v2 bearer tokens)
  const res = await fetch(
    `https://api.twitter.com/1.1/trends/place.json?id=${woeid}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );

  if (!res.ok) {
    // v1.1 trends may not be available on all access levels
    return [];
  }

  const data = await res.json();
  return (data[0]?.trends || []).map((t: any) => ({
    name: t.name,
    tweetVolume: t.tweet_volume,
    url: t.url,
  }));
}
