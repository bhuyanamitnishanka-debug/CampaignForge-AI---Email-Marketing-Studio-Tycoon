import React, { useState } from 'react';
import { SubjectLine } from '../types';
import { analyzeSpamScore, SpamAnalysisResult } from '../utils/spam-score';
import { ShieldCheck, ShieldAlert, Sparkles, Check, Edit2, TrendingUp, Info, AlertTriangle } from 'lucide-react';

interface SubjectLineTesterProps {
  subjectLines: SubjectLine[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onUpdateSubject: (index: number, newText: string) => void;
  previewText: string;
  onUpdatePreviewText: (text: string) => void;
}

export const SubjectLineTester: React.FC<SubjectLineTesterProps> = ({
  subjectLines,
  selectedIndex,
  onSelectIndex,
  onUpdateSubject,
  previewText,
  onUpdatePreviewText,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [inspectSpamModal, setInspectSpamModal] = useState<SpamAnalysisResult | null>(null);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(subjectLines[index].text);
  };

  const saveEdit = (index: number) => {
    if (editText.trim()) {
      onUpdateSubject(index, editText.trim());
    }
    setEditingIndex(null);
  };

  const handleInspect = (text: string) => {
    const analysis = analyzeSpamScore(text);
    setInspectSpamModal(analysis);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Subject Line A/B Laboratory &amp; Deliverability Check
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select your active primary subject line or run deliverability diagnostics.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg self-start sm:self-auto border border-slate-700/60">
          {subjectLines.length} Strategic Variants
        </span>
      </div>

      {/* Subject Line Variants list */}
      <div className="space-y-3">
        {subjectLines.map((subj, idx) => {
          const isSelected = selectedIndex === idx;
          const isEditing = editingIndex === idx;
          const analysis = analyzeSpamScore(subj.text);

          return (
            <div
              key={subj.id || idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                
                {/* Radio Selector & Content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectIndex(idx)}
                    className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-600 bg-slate-900 text-transparent hover:border-slate-400'
                    }`}
                    aria-label={`Select subject line: ${subj.text}`}
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (!isEditing) onSelectIndex(idx);
                    }}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-slate-900 border border-indigo-500 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(idx);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(idx)}
                          className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-100 break-words">
                          {subj.text}
                        </span>
                        {subj.isRecommended && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> High Pick
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {subj.angle.replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    {/* Deliverability & Metrics Bar */}
                    <div className="mt-2 flex items-center gap-4 text-xs flex-wrap">
                      {/* Predicted Open Rate */}
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>~{subj.predictedOpenRate || 42}% Est. Open</span>
                      </div>

                      {/* Spam Score Badge */}
                      <button
                        type="button"
                        onClick={() => handleInspect(subj.text)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                          analysis.score < 20
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                            : analysis.score < 50
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                            : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
                        }`}
                        title="Click to view full spam trigger breakdown"
                      >
                        {analysis.score < 20 ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                        )}
                        <span>Spam Risk: {analysis.score}/100 ({analysis.rating})</span>
                      </button>

                      {/* Quick character count */}
                      <span className="text-slate-400 text-[11px]">
                        {subj.text.length} chars
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEdit(idx)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit subject text"
                    aria-label={`Edit subject line ${idx + 1}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Text / Preheader editor */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Inbox Preheader (Preview Text)
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Appears right after subject line in recipient inboxes
          </span>
        </label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => onUpdatePreviewText(e.target.value)}
          placeholder="e.g. Inside: The 3-minute framework to unlock 3x higher revenue..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Spam Inspector Modal */}
      {inspectSpamModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Spam Score Diagnostics
              </h4>
              <button
                onClick={() => setInspectSpamModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-medium">Deliverability Rating:</span>
                <span className={`font-bold px-2.5 py-1 rounded-md ${
                  inspectSpamModal.score < 20 ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}>
                  {inspectSpamModal.score}/100 • {inspectSpamModal.rating}
                </span>
              </div>

              {inspectSpamModal.flaggedWords.length > 0 && (
                <div>
                  <span className="font-semibold text-rose-300 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> High Risk Keywords Detected:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectSpamModal.flaggedWords.map((word, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-200">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-semibold text-slate-200 block mb-1">Deliverability Recommendations:</span>
                <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                  {inspectSpamModal.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectSpamModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
