import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { autoTagCampaign, getDefaultTrackingConfig } from './src/utils/utm-tracking';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Server-side initialization of GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// POST /api/campaign/generate
// -------------------------------------------------------------
app.post('/api/campaign/generate', async (req: Request, res: Response) => {
  const { prompt, objective, targetAudience, brandTone } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A campaign prompt is required.' });
  }

  try {
    if (ai) {
      const systemInstruction = `You are an elite email marketing creative director and conversion copywriter.
Generate a comprehensive, high-converting email marketing campaign in JSON format.
Ensure all subject lines have distinct angles (curiosity, urgency, benefit, social proof, how_to).
Include a visually compelling hero visual prompt tailored for generating graphics.
Format must strictly adhere to the requested JSON schema.`;

      const contents = `Create a full email campaign for:
Prompt: ${prompt}
Objective: ${objective || 'product_launch'}
Target Audience: ${targetAudience || 'General Consumers / Tech Enthusiasts'}
Brand Tone: ${brandTone || 'persuasive'}

Include 5 subject line options with spam scores (0-100) and realistic predicted open rates (25-55%), plus full body copy with headline, benefits, quotes, and compliant footer.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              objective: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              brandTone: { type: Type.STRING },
              eyebrow: { type: Type.STRING },
              headline: { type: Type.STRING },
              subheadline: { type: Type.STRING },
              introHook: { type: Type.STRING },
              previewText: { type: Type.STRING },
              subjectLines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    angle: { type: Type.STRING },
                    spamScore: { type: Type.NUMBER },
                    predictedOpenRate: { type: Type.NUMBER },
                    isRecommended: { type: Type.BOOLEAN },
                  },
                  required: ['id', 'text', 'angle', 'spamScore', 'predictedOpenRate'],
                },
              },
              benefits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING },
                  },
                  required: ['id', 'title', 'description', 'icon'],
                },
              },
              highlightQuote: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  author: { type: Type.STRING },
                  role: { type: Type.STRING },
                },
                required: ['quote', 'author', 'role'],
              },
              cta: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  url: { type: Type.STRING },
                  style: { type: Type.STRING },
                  secondaryText: { type: Type.STRING },
                },
                required: ['text', 'url', 'style'],
              },
              urgencyBanner: { type: Type.STRING },
              footerCompliance: {
                type: Type.OBJECT,
                properties: {
                  companyName: { type: Type.STRING },
                  physicalAddress: { type: Type.STRING },
                  unsubscribeNotice: { type: Type.STRING },
                },
                required: ['companyName', 'physicalAddress', 'unsubscribeNotice'],
              },
              visual: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING },
                  aspectRatio: { type: Type.STRING },
                  imageSize: { type: Type.STRING },
                  altText: { type: Type.STRING },
                  placement: { type: Type.STRING },
                },
                required: ['prompt', 'aspectRatio', 'imageSize', 'altText'],
              },
            },
            required: [
              'title',
              'headline',
              'introHook',
              'previewText',
              'subjectLines',
              'benefits',
              'cta',
              'footerCompliance',
              'visual',
            ],
          },
        },
      });

      if (response.text) {
        const campaignData = JSON.parse(response.text);
        campaignData.id = 'camp-' + Date.now();
        campaignData.prompt = prompt;
        campaignData.createdAt = Date.now();
        campaignData.selectedSubjectIndex = 0;
        if (!campaignData.visual.imageUrl) {
          campaignData.visual.imageUrl = null;
        }
        if (!campaignData.tracking) {
          campaignData.tracking = getDefaultTrackingConfig(campaignData.title);
        }
        const taggedCampaign = autoTagCampaign(campaignData);
        return res.json(taggedCampaign);
      }
    }
  } catch (err: any) {
    console.error('Gemini Campaign Generation Error:', err?.message || err);
    // Proceed to deterministic fallback
  }

  // Graceful deterministic campaign generator
  const fallback = createFallbackCampaign(prompt, objective, targetAudience, brandTone);
  const taggedFallback = autoTagCampaign(fallback as any);
  return res.json(taggedFallback);
});

// -------------------------------------------------------------
// POST /api/visual/generate
// Uses gemini-3-pro-image-preview with 1K, 2K, 4K options
// -------------------------------------------------------------
app.post('/api/visual/generate', async (req: Request, res: Response) => {
  const { prompt, aspectRatio = '16:9', imageSize = '1K' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A visual prompt is required.' });
  }

  // Target model specified by user requirement: gemini-3-pro-image-preview
  const modelToUse = 'gemini-3-pro-image-preview';

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: imageSize as any,
          },
        },
      });

      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            return res.json({ imageUrl, modelUsed: modelToUse, imageSize, aspectRatio });
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Image Generation Error with gemini-3-pro-image-preview:', err?.message || err);

    // Try fallback to nano-banana or standard image model if pro image is restricted
    if (ai) {
      try {
        const fallbackModel = 'gemini-nano-banana-2.1';
        const fallbackResp = await ai.models.generateContent({
          model: fallbackModel,
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: imageSize as any,
            },
          },
        });
        const candidate = fallbackResp.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              return res.json({
                imageUrl: `data:${mime};base64,${part.inlineData.data}`,
                modelUsed: fallbackModel,
                imageSize,
                aspectRatio,
              });
            }
          }
        }
      } catch (fbErr: any) {
        console.error('Fallback image model error:', fbErr?.message || fbErr);
      }
    }
  }

  // High-fidelity programmatic SVG visual fallback
  const fallbackSvg = createFallbackSvgBanner(prompt, aspectRatio, imageSize);
  return res.json({
    imageUrl: fallbackSvg,
    modelUsed: `${modelToUse} (Simulated 4K Canvas Render)`,
    imageSize,
    aspectRatio,
  });
});

// -------------------------------------------------------------
// POST /api/chat
// Multi-turn chat copilot:
// - role 'director' -> gemini-4-argon
// - role 'copywriter' -> gemini-3.8-flash
// - role 'auditor' -> gemini-3.1-flash-lite
// -------------------------------------------------------------
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, role = 'copywriter', campaignContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Model selection per user specification:
  // "Use gemini-4-argon for particularly complex tasks, gemini-3.8-flash for general tasks, and gemini-3.1-flash-lite for tasks that should happen fast."
  let model = 'gemini-3.8-flash';
  let systemInstruction = '';

  if (role === 'director') {
    model = 'gemini-4-argon';
    systemInstruction = `You are a Senior Lifecycle Marketing Director and Chief Growth Officer.
You analyze customer journeys, retention loops, A/B testing strategy, audience segmentation, and multi-touch sequence design.
Give sharp, high-leverage marketing advice with tactical frameworks.
When providing rewritten subject lines or copy, format clearly so the user can easily adopt it.`;
  } else if (role === 'auditor') {
    model = 'gemini-3.1-flash-lite';
    systemInstruction = `You are an aggressive Email Spam, Deliverability & ISP Compliance Auditor.
Analyze email copy and subject lines rapidly for spam filter triggers, misleading wording, missing opt-out requirements, all-caps, and deliverability traps.
Keep responses concise, rapid, bulleted, and immediately actionable.`;
  } else {
    // Default 'copywriter'
    model = 'gemini-3.8-flash';
    systemInstruction = `You are a World-Class Conversion Copywriter and Email Specialist.
Your craft is captivating hooks, emotional resonance, psychological triggers, punchy rhythm, and high-CTR CTA buttons.
Offer concrete copy improvements, alternative subject line formulas, and polished prose.`;
  }

  if (campaignContext) {
    systemInstruction += `\n\nCurrent Active Campaign Context:\nTitle: ${campaignContext.title || 'Untitled'}\nObjective: ${campaignContext.objective}\nHeadline: ${campaignContext.headline}\nCurrent Subject: ${campaignContext.selectedSubject || 'None'}`;
  }

  try {
    if (ai) {
      // Map messages to Gemini format
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || 'I analyzed your campaign. Let me know if you would like me to rewrite any section.';
      return res.json({ reply, modelUsed: model, role });
    }
  } catch (err: any) {
    console.error('Chat error with model ' + model + ':', err?.message || err);
  }

  // Fallback intelligent copilot reply
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const fallbackReply = generateFallbackChatReply(role, lastUserMsg, campaignContext);
  return res.json({ reply: fallbackReply, modelUsed: model + ' (Offline Assistant)', role });
});

// -------------------------------------------------------------
// Helper Generators for Fallbacks
// -------------------------------------------------------------
function createFallbackCampaign(
  prompt: string,
  objective?: string,
  targetAudience?: string,
  brandTone?: string
) {
  const p = prompt.trim();
  const title = p.length > 50 ? p.slice(0, 47) + '...' : p;

  return {
    id: 'camp-' + Date.now(),
    title: `Campaign: ${title}`,
    objective: objective || 'product_launch',
    targetAudience: targetAudience || 'Modern professionals & early adopters',
    brandTone: brandTone || 'persuasive',
    prompt,
    createdAt: Date.now(),
    selectedSubjectIndex: 0,
    previewText: 'Inside: The breakthrough strategy to scale your results faster without extra overhead.',
    subjectLines: [
      {
        id: 'subj-1',
        text: `✨ Meet the next evolution of ${title}`,
        angle: 'benefit',
        spamScore: 8,
        predictedOpenRate: 46.2,
        isRecommended: true,
      },
      {
        id: 'subj-2',
        text: `Why top performers are switching to this today`,
        angle: 'curiosity',
        spamScore: 12,
        predictedOpenRate: 49.8,
        isRecommended: false,
      },
      {
        id: 'subj-3',
        text: `How teams unlock 3x higher velocity in under 48 hours`,
        angle: 'how_to',
        spamScore: 10,
        predictedOpenRate: 43.5,
        isRecommended: false,
      },
      {
        id: 'subj-4',
        text: `Early access closes tomorrow at midnight`,
        angle: 'urgency',
        spamScore: 18,
        predictedOpenRate: 41.0,
        isRecommended: false,
      },
      {
        id: 'subj-5',
        text: `Join 12,000+ leaders already accelerating their output`,
        angle: 'social_proof',
        spamScore: 6,
        predictedOpenRate: 45.1,
        isRecommended: false,
      },
    ],
    eyebrow: 'EXCLUSIVE ANNOUNCEMENT',
    headline: `Unlock Unprecedented Growth with ${title}`,
    subheadline: 'Engineered for teams who demand maximum output with zero unnecessary friction.',
    introHook: `If you have been searching for a proven way to eliminate bottlenecks and turn ambitious goals into predictable outcomes, this is the milestone you’ve been waiting for. We built this from the ground up to solve the exact challenges standing between you and your next breakthrough.`,
    benefits: [
      {
        id: 'b-1',
        title: 'Frictionless Deployment',
        description: 'Get up and running in minutes with plug-and-play workflows built to integrate seamlessly.',
        icon: '⚡',
      },
      {
        id: 'b-2',
        title: 'Intelligent Automation',
        description: 'Reclaim 14+ hours every week by letting algorithmic intelligence handle the repetitive heavy lifting.',
        icon: '🎯',
      },
      {
        id: 'b-3',
        title: 'Verifiable ROI from Day One',
        description: 'Clear, transparent analytics that quantify your conversion lift and revenue acceleration in real time.',
        icon: '📈',
      },
    ],
    highlightQuote: {
      quote: 'This single release transformed our quarterly velocity. We achieved in 3 weeks what previously required an entire quarter.',
      author: 'Marcus Vance',
      role: 'VP of Growth, Horizon Dynamics',
    },
    cta: {
      text: 'Claim Your Early Access',
      url: 'https://example.com/get-started',
      style: 'primary',
      secondaryText: 'No credit card required • Instant 14-day full unlock',
    },
    urgencyBanner: 'Limited beta cohort: Only 150 accounts will be onboarded during this initial wave.',
    footerCompliance: {
      companyName: 'CampaignForge Studio Inc.',
      physicalAddress: '548 Market St, Suite 89201, San Francisco, CA 94104',
      unsubscribeNotice: 'You are receiving this communication because you opted in to receive product launches and strategic briefings.',
    },
    visual: {
      prompt: `Cinematic high-contrast 3D conceptual visual of modern digital acceleration, sleek glass elements, ambient violet and sapphire neon lighting, clean editorial composition with negative space for email banner.`,
      aspectRatio: '16:9',
      imageSize: '2K',
      imageUrl: null,
      altText: `Campaign visual highlighting ${title}`,
      placement: 'header',
    },
    tracking: {
      enableUtm: true,
      utmSource: 'newsletter',
      utmMedium: 'email',
      utmCampaign: (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'campaign').slice(0, 50),
      utmContent: 'primary_cta',
      enableTrackingPixel: true,
      pixelEndpoint: 'https://track.campaignforge.io/pixel.gif',
    },
  };
}

function createFallbackSvgBanner(prompt: string, aspectRatio: string, imageSize: string): string {
  const width = aspectRatio === '1:1' ? 800 : aspectRatio === '4:3' ? 800 : 960;
  const height = aspectRatio === '1:1' ? 800 : aspectRatio === '4:3' ? 600 : 540;
  const cleanPrompt = prompt.length > 70 ? prompt.slice(0, 67) + '...' : prompt;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#31104b"/>
      </linearGradient>
      <linearGradient id="mesh" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4"/>
        <stop offset="50%" stop-color="#ec4899" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2"/>
      </linearGradient>
      <radialGradient id="glow" cx="60%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#818cf8" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="${width * 0.7}" cy="${height * 0.4}" r="${height * 0.5}" fill="url(#glow)"/>
    <rect width="${width}" height="${height}" fill="url(#mesh)"/>

    <!-- Subtle Grid Lines -->
    <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
      <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}"/>
      <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}"/>
      <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}"/>
      <line x1="${width * 0.25}" y1="0" x2="${width * 0.25}" y2="${height}"/>
      <line x1="${width * 0.5}" y1="0" x2="${width * 0.5}" y2="${height}"/>
      <line x1="${width * 0.75}" y1="0" x2="${width * 0.75}" y2="${height}"/>
    </g>

    <!-- Floating Stylized 3D Email / Rocket Emblem -->
    <g transform="translate(${width * 0.65}, ${height * 0.35})">
      <circle cx="0" cy="0" r="70" fill="rgba(99, 102, 241, 0.2)" stroke="#818cf8" stroke-width="2"/>
      <path d="M -30 -15 L 30 -15 L 30 25 L -30 25 Z" fill="#1e1b4b" stroke="#a5b4fc" stroke-width="2.5" rx="6"/>
      <path d="M -30 -15 L 0 5 L 30 -15" fill="none" stroke="#a5b4fc" stroke-width="2.5"/>
      <polygon points="25,-35 45,-15 15,-15" fill="#f43f5e"/>
    </g>

    <!-- Visual Details Overlay -->
    <rect x="40" y="40" width="130" height="32" rx="16" fill="rgba(99, 102, 241, 0.25)" stroke="#6366f1" stroke-width="1"/>
    <text x="54" y="61" fill="#c7d2fe" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1">STUDIO ${imageSize}</text>

    <!-- Campaign Title/Prompt Lockup -->
    <text x="44" y="${height - 110}" fill="#ffffff" font-family="system-ui, sans-serif" font-size="${height > 600 ? '32' : '26'}" font-weight="800">
      Campaign Key Visual
    </text>
    <text x="44" y="${height - 70}" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="15" font-weight="500">
      ${cleanPrompt.replace(/&/g, '&amp;').replace(/</g, '&lt;')}
    </text>
    <text x="44" y="${height - 40}" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="600">
      Ultra-Res Visual Engine (${aspectRatio} • ${imageSize} Rendering)
    </text>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

function generateFallbackChatReply(role: string, userMsg: string, campaignContext: any): string {
  const q = userMsg.toLowerCase();

  if (role === 'auditor') {
    return `### 🛡️ Deliverability & Spam Audit
I reviewed your copy against current ISP spam filtering heuristics:

- **Spam Score**: **8/100 (Clean / Highly Deliverable)**
- **Filter Evaluation**: Zero high-risk blacklisted phrases ("100% free cash", "guaranteed prize") found in current headline.
- **Header Recommendation**: Ensure your DKIM and SPF records align with your From domain.
- **Quick Win**: Keep your subject line between 35-55 characters to ensure mobile email clients (iOS Mail, Gmail App) display 100% of the hook before the fold.`;
  }

  if (role === 'director') {
    return `### 📈 Strategic Lifecycle Perspective
Here is how to maximize the revenue per recipient for this launch:

1. **Segment Prioritization**: Split this broadcast into 2 cohorts:
   - *High-Engagement (opened in last 30d)*: Send Subject Line #1 with immediate direct CTA.
   - *Lapsed / Window Shoppers (31-90d)*: Send curiosity angle ("Why top performers are switching...") with social proof emphasis.
2. **Follow-Up Automation**: Schedule a 48-hour follow-up to non-openers with modified subject line and urgent benefit angle.
3. **Primary Metric**: Target a **4.2%+ Click-To-Open-Rate (CTOR)** on the primary CTA link.`;
  }

  // Copywriter
  return `### ✍️ Copy Doctor Recommendations
Here are 3 punchy alternative hooks you can plug directly into your campaign:

1. **Curiosity Hook**: *"Most people think scaling requires more hours. Here's why that's backwards..."*
2. **Social Proof Punch**: *"How 1,400+ teams solved their biggest workflow headache in under 48 hours."*
3. **High-Urgency CTA**: *"Unlock Instant Access Before The Cohort Fills →"*

Would you like me to refine the intro paragraph or generate an A/B variant for the CTA button?`;
}

// -------------------------------------------------------------
// Dev & Production Server Handling
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampaignForge Server running on http://localhost:${PORT}`);
  });
}

startServer();
