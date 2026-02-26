"use client";

import { useState, useEffect } from "react";
import {
  PenTool,
  Lightbulb,
  FileText,
  CheckCircle,
  Plus,
  Loader2,
  Sparkles,
  Copy,
  ArrowRight,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Idea {
  topic: string;
  hook: string;
  angle: string;
  format: string;
  target_platform: string;
  reasoning: string;
}

export default function ContentCommandCenter() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("tiktok");

  // Script generation
  const [scriptIdea, setScriptIdea] = useState("");
  const [scriptPlatform, setScriptPlatform] = useState("tiktok");
  const [generatedScript, setGeneratedScript] = useState("");
  const [generatingScript, setGeneratingScript] = useState(false);

  // Review
  const [reviewScript, setReviewScript] = useState("");
  const [reviewPlatform, setReviewPlatform] = useState("tiktok");
  const [review, setReview] = useState<any>(null);
  const [reviewing, setReviewing] = useState(false);

  async function handleGenerateIdeas() {
    setGeneratingIdeas(true);
    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, platform, count: 5 }),
      });
      const data = await res.json();
      if (data.ideas) setIdeas(data.ideas);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingIdeas(false);
    }
  }

  async function handleGenerateScript() {
    setGeneratingScript(true);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: scriptIdea, platform: scriptPlatform }),
      });
      const data = await res.json();
      if (data.script) setGeneratedScript(data.script);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingScript(false);
    }
  }

  async function handleReview() {
    setReviewing(true);
    try {
      const res = await fetch("/api/scripts/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: reviewScript, platform: reviewPlatform }),
      });
      const data = await res.json();
      if (data.review) setReview(data.review);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  }

  function useIdeaAsScript(idea: Idea) {
    setScriptIdea(`${idea.topic}\nHook: ${idea.hook}\nAngle: ${idea.angle}\nFormat: ${idea.format}`);
    setScriptPlatform(idea.target_platform);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PenTool className="h-6 w-6 text-[#ec4899]" />
            Content Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Ideation, scripting, and review — all in one place
          </p>
        </div>
      </div>

      <Tabs defaultValue="ideas" className="w-full">
        <TabsList className="bg-[#1a1a2e]">
          <TabsTrigger value="ideas">
            <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
            Ideas
          </TabsTrigger>
          <TabsTrigger value="scripts">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Scripts
          </TabsTrigger>
          <TabsTrigger value="review">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Review
          </TabsTrigger>
        </TabsList>

        {/* IDEAS TAB */}
        <TabsContent value="ideas" className="mt-6 space-y-4">
          <Card className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Niche / Topic
                  </label>
                  <Input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. fitness, tech reviews, cooking..."
                    className="bg-[#0a0a0a] border-white/10"
                  />
                </div>
                <div className="w-40">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Platform
                  </label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-[#0a0a0a] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">X/Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateIdeas}
                  disabled={generatingIdeas}
                  className="bg-[#ec4899] hover:bg-[#be185d] text-white"
                >
                  {generatingIdeas ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Ideas
                </Button>
              </div>
            </CardContent>
          </Card>

          {ideas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea, i) => (
                <Card key={i} className="bg-[#1a1a2e] border-white/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm">{idea.topic}</h3>
                      <Badge
                        variant="outline"
                        className="border-[#ec4899]/30 text-[#ec4899] text-xs shrink-0 ml-2"
                      >
                        {idea.target_platform}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-[#ec4899] font-medium">
                        Hook: &quot;{idea.hook}&quot;
                      </p>
                      {idea.angle && (
                        <p className="text-xs text-muted-foreground">
                          Angle: {idea.angle}
                        </p>
                      )}
                      {idea.format && (
                        <p className="text-xs text-muted-foreground">
                          Format: {idea.format}
                        </p>
                      )}
                    </div>
                    {idea.reasoning && (
                      <p className="text-xs text-muted-foreground/70 italic">
                        {idea.reasoning}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-[#ec4899]/30 text-[#ec4899] hover:bg-[#ec4899]/10"
                      onClick={() => useIdeaAsScript(idea)}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Write Script
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-[#1a1a2e] border-white/5 border-dashed border-2">
              <CardContent className="p-10 text-center">
                <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Enter a niche and click Generate to get AI-powered content
                  ideas
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SCRIPTS TAB */}
        <TabsContent value="scripts" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Script Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={scriptIdea}
                  onChange={(e) => setScriptIdea(e.target.value)}
                  placeholder="Describe your content idea... Be specific about the topic, hook, and angle."
                  className="bg-[#0a0a0a] border-white/10 min-h-[200px]"
                />
                <div className="flex gap-3">
                  <Select
                    value={scriptPlatform}
                    onValueChange={setScriptPlatform}
                  >
                    <SelectTrigger className="w-40 bg-[#0a0a0a] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">X/Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleGenerateScript}
                    disabled={!scriptIdea.trim() || generatingScript}
                    className="flex-1 bg-[#ec4899] hover:bg-[#be185d] text-white"
                  >
                    {generatingScript ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Script
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Generated Script
                </CardTitle>
                {generatedScript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(generatedScript)
                    }
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {generatedScript ? (
                  <div className="bg-[#0a0a0a] rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {generatedScript}
                    </pre>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                    Enter an idea and generate a script
                  </div>
                )}
                {generatedScript && (
                  <Button
                    variant="outline"
                    className="w-full mt-3 border-[#ec4899]/30 text-[#ec4899] hover:bg-[#ec4899]/10"
                    onClick={() => {
                      setReviewScript(generatedScript);
                      setReviewPlatform(scriptPlatform);
                    }}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Send to Review
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REVIEW TAB */}
        <TabsContent value="review" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Submit for Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={reviewScript}
                  onChange={(e) => setReviewScript(e.target.value)}
                  placeholder="Paste your script or caption here..."
                  className="bg-[#0a0a0a] border-white/10 min-h-[250px]"
                />
                <div className="flex gap-3">
                  <Select
                    value={reviewPlatform}
                    onValueChange={setReviewPlatform}
                  >
                    <SelectTrigger className="w-40 bg-[#0a0a0a] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">X/Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleReview}
                    disabled={!reviewScript.trim() || reviewing}
                    className="flex-1 bg-[#ec4899] hover:bg-[#be185d] text-white"
                  >
                    {reviewing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Review Content
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  AI Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                {review ? (
                  <div className="space-y-4">
                    {/* Scores */}
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div
                          className={`text-3xl font-bold ${
                            review.score >= 80
                              ? "text-[#22c55e]"
                              : review.score >= 60
                              ? "text-[#f59e0b]"
                              : "text-[#ef4444]"
                          }`}
                        >
                          {review.score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Overall
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-3xl font-bold ${
                            review.hook_score >= 80
                              ? "text-[#22c55e]"
                              : review.hook_score >= 60
                              ? "text-[#f59e0b]"
                              : "text-[#ef4444]"
                          }`}
                        >
                          {review.hook_score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Hook
                        </div>
                      </div>
                    </div>

                    {/* Flags */}
                    {review.flags?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[#ef4444] mb-1">
                          Issues
                        </h4>
                        <ul className="space-y-1">
                          {review.flags.map((f: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground"
                            >
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {review.suggestions?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[#f59e0b] mb-1">
                          Suggestions
                        </h4>
                        <ul className="space-y-1">
                          {review.suggestions.map((s: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Strengths */}
                    {review.strengths?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[#22c55e] mb-1">
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {review.strengths.map((s: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {review.improved_hook && (
                      <div className="bg-[#0a0a0a] rounded-lg p-3">
                        <h4 className="text-xs font-medium text-[#ec4899] mb-1">
                          Better Hook
                        </h4>
                        <p className="text-sm">{review.improved_hook}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center space-y-2">
                      <Star className="h-8 w-8 mx-auto text-muted-foreground/30" />
                      <p>Submit content to get an AI review with scoring</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
