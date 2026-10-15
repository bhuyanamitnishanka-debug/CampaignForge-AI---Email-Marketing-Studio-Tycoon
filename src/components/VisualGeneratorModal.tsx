import React, { useState } from 'react';
import { Sparkles, Image, Check, Loader2, X, Download, Sliders, Maximize2 } from 'lucide-react';
import { CampaignVisual } from '../types';

interface VisualGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  visual: CampaignVisual;
  onApplyVisual: (visual: CampaignVisual) => void;
  defaultPrompt?: string;
}

export const VisualGeneratorModal: React.FC<VisualGeneratorModalProps> = ({
  isOpen,
  onClose,
  visual,
  onApplyVisual,
  defaultPrompt,
}) => {
  const [prompt, setPrompt] = useState(visual.prompt || defaultPrompt || '');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '4:3' | '9:16'>(visual.aspectRatio || '16:9');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>(visual.imageSize || '2K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(visual.imageUrl);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<string>('gemini-3-pro-image-preview');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setStatusMessage('Connecting to gemini-3-pro-image-preview engine...');

    try {
      const res = await fetch('/api/visual/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          imageSize,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedUrl(data.imageUrl);
        if (data.modelUsed) setModelInfo(data.modelUsed);
        setStatusMessage('Render complete!');
      } else {
        setStatusMessage('Could not render image. Please retry.');
      }
    } catch (err: any) {
      console.error('Visual generation failed:', err);
      setStatusMessage('Error contacting image generation API.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedUrl) {
      onApplyVisual({
        ...visual,
        prompt,
        aspectRatio,
        imageSize,
        imageUrl: generatedUrl,
        altText: `Generated key visual: ${prompt.slice(0, 60)}`,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
          aria-label="Close visual generator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">AI Visual Creator</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30">
                gemini-3-pro-image-preview
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-resolution visual generation with configurable resolution (1K, 2K, 4K) &amp; aspect ratios.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Controls Column */}
          <div className="space-y-4">
            
            {/* Prompt input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Visual Description Prompt</span>
                <span className="text-[11px] text-violet-400">Cinematic / 3D / Editorial</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describe your email visual (e.g. 'A sleek modern isometric 3D render of a luminous glowing cloud server with violet and cyan neon accents on dark obsidian surface, negative space for banner...')"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* MANDATORY AFFORDANCE: Image Size Selection (1K, 2K, 4K) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
                Image Resolution (Size)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setImageSize(size)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                      imageSize === size
                        ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/30 ring-1 ring-violet-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{size}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      {size === '1K' ? '1024px' : size === '2K' ? '2048px HD' : '3840px Ultra'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-violet-400" />
                Email Banner Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '16:9' as const, label: '16:9 Banner' },
                  { id: '1:1' as const, label: '1:1 Square' },
                  { id: '4:3' as const, label: '4:3 Product' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      aspectRatio === ratio.id
                        ? 'bg-slate-800 text-white border-violet-500 ring-1 ring-violet-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20 ${
                isGenerating || !prompt.trim()
                  ? 'bg-violet-600/50 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing {imageSize} Visual...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-violet-200" />
                  <span>Generate with gemini-3-pro-image-preview</span>
                </>
              )}
            </button>

            {statusMessage && (
              <p className="text-[11px] text-center text-slate-400">
                {statusMessage}
              </p>
            )}

          </div>

          {/* Visual Preview Column */}
          <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl p-4 min-h-[260px] relative overflow-hidden">
            {generatedUrl ? (
              <div className="w-full flex flex-col items-center space-y-3">
                <div className="w-full rounded-xl overflow-hidden border border-slate-700 shadow-xl bg-slate-900">
                  <img
                    src={generatedUrl}
                    alt="Generated Campaign Visual"
                    className="w-full object-cover max-h-[260px]"
                  />
                </div>
                <div className="flex items-center justify-between w-full text-[11px] text-slate-400">
                  <span>Engine: {modelInfo}</span>
                  <span className="font-semibold text-violet-400">{imageSize} • {aspectRatio}</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Image className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-300">No Visual Generated Yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Select your resolution ({imageSize}), adjust your prompt, and tap Generate to render with gemini-3-pro-image-preview.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            Supports email client responsive retina display.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-700/80"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsert}
              disabled={!generatedUrl}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 ${
                generatedUrl
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Visual Into Email</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
