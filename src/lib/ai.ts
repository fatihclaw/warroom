// AI client for Kimi K2.5 via Fireworks AI (or any OpenAI-compatible API)

const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
const MODEL = "accounts/fireworks/models/kimi-k2-5-flash";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIResponse {
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    json?: boolean;
  } = {}
): Promise<AIResponse> {
  const apiKey = process.env.KIMI_API_KEY;

  if (!apiKey || apiKey === "placeholder_add_later") {
    // Fallback: generate mock responses for development
    return {
      content: JSON.stringify({
        message:
          "AI features require a Fireworks AI API key. Add KIMI_API_KEY to your .env.local file.",
      }),
    };
  }

  const res = await fetch(FIREWORKS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}

// Generate content ideas based on trending data and gap analysis
export async function generateIdeas(context: {
  niche?: string;
  trends?: string[];
  topContent?: string[];
  platform?: string;
  count?: number;
}): Promise<string> {
  const systemPrompt = `You are an expert content strategist. Generate specific, actionable content ideas based on current trends and gap analysis.
Each idea must include:
- topic: clear topic
- hook: compelling first line or 3-second hook
- angle: unique perspective or angle
- format: content format (talking head, b-roll, text overlay, etc.)
- target_platform: best platform for this content
- reasoning: why this would work right now

Return as JSON array of ideas.`;

  const userPrompt = `Generate ${context.count || 5} content ideas.
${context.niche ? `Niche: ${context.niche}` : ""}
${context.platform ? `Target platform: ${context.platform}` : "All platforms"}
${context.trends?.length ? `Current trends:\n${context.trends.join("\n")}` : ""}
${context.topContent?.length ? `Top performing content:\n${context.topContent.join("\n")}` : ""}

Be specific with hooks — write the actual words, not descriptions. Make each idea different in format and angle.`;

  const result = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.8, json: true }
  );

  return result.content;
}

// Generate a platform-specific script
export async function generateScript(context: {
  idea: string;
  platform: string;
  tone?: string;
  references?: string[];
}): Promise<string> {
  const platformTemplates: Record<string, string> = {
    tiktok: `Format as:
HOOK (0-3s): [exact words + visual direction]
SETUP (3-8s): [transition to value]
BEAT 1 (8-15s): [first point]
BEAT 2 (15-22s): [second point]
BEAT 3 (22-28s): [third point or twist]
PAYOFF (28-35s): [resolution]
CTA (35-40s): [call to action]
TEXT OVERLAYS: [suggested text on screen]
SOUND: [suggested audio/music]`,
    youtube: `Format as:
TITLE: [click-worthy title]
THUMBNAIL CONCEPT: [visual description]
HOOK (0-30s): [exact script for opening]
INTRO (30s-1m): [context setting]
SECTION 1: [main point 1 with b-roll notes]
SECTION 2: [main point 2 with b-roll notes]
SECTION 3: [main point 3 with b-roll notes]
CONCLUSION: [wrap up]
CTA: [subscribe/like/comment prompt]
DESCRIPTION: [SEO-optimized description]
TAGS: [relevant tags]`,
    instagram: `Format as:
HOOK (first frame): [scroll-stopping visual + text]
SLIDES/SCENES: [numbered content beats]
CTA: [action prompt]
CAPTION: [formatted Instagram caption]
HASHTAGS: [30 relevant hashtags]`,
    twitter: `Format as:
TWEET: [280 chars max, punchy and standalone]
THREAD (if applicable):
1/ [opening hook]
2/ [context]
3/ [insight]
4/ [proof/example]
5/ [CTA]`,
    linkedin: `Format as:
LINE 1: [scroll-stopping opener - short!]

[blank line]
SHORT PARAGRAPHS: [2-3 sentences each, story format]

LESSON: [key takeaway]

QUESTION: [engagement prompt]`,
  };

  const template = platformTemplates[context.platform] || platformTemplates.tiktok;

  const result = await chatCompletion(
    [
      {
        role: "system",
        content: `You are an expert content creator and scriptwriter. Write viral-worthy scripts optimized for ${context.platform}. Be specific — write exact words, not descriptions. ${context.tone ? `Tone: ${context.tone}` : ""}`,
      },
      {
        role: "user",
        content: `Write a ${context.platform} script for this idea:
${context.idea}

${template}

${context.references?.length ? `Reference content that inspired this:\n${context.references.join("\n")}` : ""}

Write the COMPLETE script with exact words. Be specific and creative.`,
      },
    ],
    { temperature: 0.8, maxTokens: 3000 }
  );

  return result.content;
}

// Review and score content
export async function reviewContent(context: {
  script: string;
  platform: string;
  topPerformingPatterns?: string[];
}): Promise<string> {
  const result = await chatCompletion(
    [
      {
        role: "system",
        content: `You are a content review expert who has analyzed thousands of viral videos. Score and review content scripts. Return JSON with:
- score: 1-100 overall prediction
- hook_score: 1-100 hook strength
- flags: array of issues found
- suggestions: array of specific improvements
- strengths: array of what's good
- improved_hook: better hook alternative if score < 80`,
      },
      {
        role: "user",
        content: `Review this ${context.platform} script:

${context.script}

${context.topPerformingPatterns?.length ? `Top performing patterns in this niche:\n${context.topPerformingPatterns.join("\n")}` : ""}

Score it honestly and give actionable feedback.`,
      },
    ],
    { temperature: 0.3, json: true }
  );

  return result.content;
}
