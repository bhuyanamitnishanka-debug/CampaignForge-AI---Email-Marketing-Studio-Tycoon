import { EmailCampaign } from '../types';

export const CAMPAIGN_PRESETS: EmailCampaign[] = [
  {
    id: 'preset-saas-launch',
    title: 'FlowState AI: Next-Gen Autonomous Workflows',
    objective: 'product_launch',
    targetAudience: 'Engineering managers, product teams, and founders',
    brandTone: 'persuasive',
    prompt: 'Launch FlowState AI, an autonomous workflow engine that automates multi-step DevOps and product deployments with zero configuration.',
    createdAt: 1729000000000,
    selectedSubjectIndex: 0,
    previewText: 'Deploy complex workflows 10x faster without writing boilerplate code.',
    subjectLines: [
      {
        id: 's-1',
        text: '⚡ Introducing FlowState: Autonomous deployment pipelines are here',
        angle: 'benefit',
        spamScore: 6,
        predictedOpenRate: 48.4,
        isRecommended: true
      },
      {
        id: 's-2',
        text: 'The death of fragile CI/CD YAML files (read this)',
        angle: 'curiosity',
        spamScore: 12,
        predictedOpenRate: 51.2,
        isRecommended: false
      },
      {
        id: 's-3',
        text: 'How 340+ tech leaders cut deployment failures by 84%',
        angle: 'social_proof',
        spamScore: 5,
        predictedOpenRate: 46.8,
        isRecommended: false
      },
      {
        id: 's-4',
        text: 'Early founder access closes in 48 hours',
        angle: 'urgency',
        spamScore: 16,
        predictedOpenRate: 42.1,
        isRecommended: false
      },
      {
        id: 's-5',
        text: 'How to automate your entire staging environment today',
        angle: 'how_to',
        spamScore: 8,
        predictedOpenRate: 44.5,
        isRecommended: false
      }
    ],
    eyebrow: 'PRODUCT LAUNCH // VERSION 3.0',
    headline: 'Stop Babysitting Pipelines. Let FlowState Run Deployments.',
    subheadline: 'The first workflow platform that diagnoses flaky steps, auto-rolls back failures, and syncs environments in real time.',
    introHook: 'Shipping software shouldn’t feel like defusing a bomb at 5:00 PM on a Friday. We spent 18 months rebuilding the developer deployment loop so your team can focus exclusively on shipping features instead of wrangling broken scripts.',
    benefits: [
      {
        id: 'b-1',
        title: 'Zero-Config Autonomous Triggers',
        description: 'Auto-detects repository dependencies and scaffolds production-grade pipelines in under 90 seconds.',
        icon: '🚀'
      },
      {
        id: 'b-2',
        title: 'Predictive Flaky Test Shield',
        description: 'Isolates non-deterministic tests and prevents broken builds from halting team-wide merges.',
        icon: '🛡️'
      },
      {
        id: 'b-3',
        title: 'Instant Instant Rollbacks with Context',
        description: 'One-click reversions with automated root-cause summaries delivered directly to Slack.',
        icon: '⚡'
      }
    ],
    highlightQuote: {
      quote: 'FlowState reduced our release cycle from 3 hours to 4 minutes. It is the single highest leverage developer tool we adopted this year.',
      author: 'Elena Rostova',
      role: 'VP of Platform Engineering at Veloce Cloud'
    },
    cta: {
      text: 'Start Your 14-Day Free Trial',
      url: 'https://example.com/signup',
      style: 'primary',
      secondaryText: 'Full enterprise features • Instant setup • Cancel anytime'
    },
    urgencyBanner: 'Launch week perk: First 250 teams receive $1,000 in free compute credits.',
    footerCompliance: {
      companyName: 'FlowState Systems Inc.',
      physicalAddress: '100 Montgomery St, Suite 1900, San Francisco, CA 94104',
      unsubscribeNotice: 'You received this notification because you subscribed to FlowState developer releases.'
    },
    visual: {
      prompt: 'Isometric high-tech 3D render of luminous server pipelines, translucent glass data nodes with sapphire and indigo glowing energy lines, dark minimalist background, cinematic octane lighting, 8k resolution banner.',
      aspectRatio: '16:9',
      imageSize: '2K',
      imageUrl: null,
      altText: 'FlowState 3D automated deployment architecture visual',
      placement: 'header'
    },
    tracking: {
      enableUtm: true,
      utmSource: 'newsletter',
      utmMedium: 'email',
      utmCampaign: 'flowstate-autonomous-workflows-launch',
      utmContent: 'primary_cta',
      enableTrackingPixel: true,
      pixelEndpoint: 'https://track.campaignforge.io/pixel.gif'
    }
  },
  {
    id: 'preset-ecommerce-sale',
    title: 'Aura Sound: VIP Black Friday Studio Audio',
    objective: 'flash_sale',
    targetAudience: 'Audiophiles, podcasters, music producers, and sound designers',
    brandTone: 'luxury',
    prompt: 'VIP early access Black Friday sale for Aura Pro Studio headphones with 35% savings and free custom acoustic case.',
    createdAt: 1729000000000,
    selectedSubjectIndex: 0,
    previewText: 'Exclusive 35% private savings unlocked before public Black Friday starts.',
    subjectLines: [
      {
        id: 's-10',
        text: '🎧 Your private VIP invitation: 35% off Aura Studio Pro',
        angle: 'benefit',
        spamScore: 14,
        predictedOpenRate: 52.4,
        isRecommended: true
      },
      {
        id: 's-11',
        text: 'The sound engineers’ secret weapon is finally on sale',
        angle: 'curiosity',
        spamScore: 11,
        predictedOpenRate: 49.0,
        isRecommended: false
      },
      {
        id: 's-12',
        text: 'Only 300 custom acoustic cases allocated for VIP members',
        angle: 'urgency',
        spamScore: 15,
        predictedOpenRate: 47.3,
        isRecommended: false
      }
    ],
    eyebrow: 'PRIVATE VIP ACCESS',
    headline: 'Experience Sound Exactly As The Artist Intended.',
    subheadline: 'Crafted with beryllium drivers, precision planar balance, and zero acoustic compromise.',
    introHook: 'For the next 72 hours, we are unlocking our private reserve for our most dedicated community members before the public rush begins. Claim your custom Aura Studio Pro headphones with full acoustic tailoring.',
    benefits: [
      {
        id: 'b-10',
        title: 'Custom 50mm Planar Drivers',
        description: 'Near-zero harmonic distortion (THD < 0.05%) across the entire 5Hz - 45kHz frequency spectrum.',
        icon: '🎵'
      },
      {
        id: 'b-11',
        title: 'Aerospace-Grade Magnesium Alloy',
        description: 'Featherlight 245g chassis designed for fatigue-free 10-hour mixing and mastering sessions.',
        icon: '✨'
      },
      {
        id: 'b-12',
        title: 'Complimentary Custom Hardcase',
        description: 'Laser-engraved travel case and oxygen-free silver braided cabling included at zero cost.',
        icon: '🎁'
      }
    ],
    highlightQuote: {
      quote: 'The spatial depth on these headphones is astonishing. I hear nuances in masters I have listened to a thousand times.',
      author: 'David Thorne',
      role: 'Grammy-Nominated Mastering Engineer'
    },
    cta: {
      text: 'Claim VIP Savings (35% Off)',
      url: 'https://example.com/vip-sale',
      style: 'primary',
      secondaryText: 'VIP priority shipping included • 60-day home audition'
    },
    urgencyBanner: 'VIP vault closes in 48 hours or when the 300 allocated units are claimed.',
    footerCompliance: {
      companyName: 'Aura Acoustic Laboratories',
      physicalAddress: '742 Evergreen Terrace, Portland, OR 97201',
      unsubscribeNotice: 'You are receiving this private invite as an Aura VIP Club member.'
    },
    visual: {
      prompt: 'Ultra-luxurious studio photography of matte black and polished brass planar magnetic headphones resting on dark obsidian stone, subtle warm amber rim light, premium audio craftsmanship, crisp 4k product visual.',
      aspectRatio: '16:9',
      imageSize: '4K',
      imageUrl: null,
      altText: 'Aura Pro Studio flagship headphones on obsidian stone',
      placement: 'header'
    },
    tracking: {
      enableUtm: true,
      utmSource: 'vip_club',
      utmMedium: 'email',
      utmCampaign: 'aura-sound-vip-black-friday',
      utmContent: 'hero_cta',
      enableTrackingPixel: true,
      pixelEndpoint: 'https://track.campaignforge.io/pixel.gif'
    }
  }
];
