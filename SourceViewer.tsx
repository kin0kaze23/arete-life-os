import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ExternalLink,
  Download,
} from 'lucide-react';
import { SourceFile, CategorizedFact } from './types';

interface SourceViewerProps {
  files: SourceFile[];
  facts?: CategorizedFact[];
  initialIndex?: number;
  onClose: () => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  files,
  facts = [],
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentFile = files[currentIndex];
  const isImage = currentFile.mimeType.startsWith('image/');
  const isPdf = currentFile.mimeType === 'application/pdf';

  const next = () => setCurrentIndex((currentIndex + 1) % files.length);
  const prev = () => setCurrentIndex((currentIndex - 1 + files.length) % files.length);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:${currentFile.mimeType};base64,${currentFile.data}`;
    link.download = currentFile.name;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col md:flex-row bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
      {/* 1. Main Stage */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-12 overflow-hidden border-r border-white/5">
        {/* Top Controls */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <FileText size={18} />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Original Source
              </p>
              <h3 className="text-xs font-bold text-white truncate max-w-[200px]">
                {currentFile.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isImage && (
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
                  className="p-2 hover:bg-white/10 text-slate-400 rounded-lg"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[10px] font-mono text-slate-500 px-2">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
                  className="p-2 hover:bg-white/10 text-slate-400 rounded-lg"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}
            <button
              onClick={handleDownload}
              className="p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-slate-300 transition-all"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-black/40 hover:bg-rose-500 text-white backdrop-blur-md border border-white/10 rounded-xl transition-all ml-4"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="relative w-full h-full flex items-center justify-center overflow-auto no-scrollbar">
          {isImage ? (
            <img
              src={`data:${currentFile.mimeType};base64,${currentFile.data}`}
              alt={currentFile.name}
              className="max-w-full max-h-full transition-transform duration-200 shadow-2xl rounded-sm"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : isPdf ? (
            <iframe
              src={`data:${currentFile.mimeType};base64,${currentFile.data}#toolbar=0`}
              className="w-full h-full rounded-lg border border-white/10"
              title={currentFile.name}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <div className="p-12 rounded-[3rem] bg-white/5 border border-white/10">
                <FileText size={64} />
              </div>
              <p className="font-bold text-xs uppercase tracking-widest">
                Document type not viewable inline
              </p>
              <button
                onClick={handleDownload}
                className="text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Download to Inspect
              </button>
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        {files.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 hover:bg-indigo-600 border border-white/10 rounded-full text-white transition-all"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={next}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 hover:bg-indigo-600 border border-white/10 rounded-full text-white transition-all"
            >
              <ChevronRight size={32} />
            </button>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
              {files.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all ${i === currentIndex ? 'bg-indigo-500 w-8' : 'bg-slate-700 hover:bg-slate-500'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. Intelligence Sidebar */}
      <div className="w-full md:w-96 bg-[#08090C] p-8 flex flex-col gap-8 overflow-y-auto no-scrollbar">
        <div className="space-y-1">
          <h4 className="text-xl font-black text-white tracking-tighter uppercase italic">
            Neural Anchors
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Mapped facts from this evidence
          </p>
        </div>

        <div className="space-y-4">
          {facts.length > 0 ? (
            facts.map((fact, i) => (
              <div
                key={i}
                className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                  <p className="text-xs font-bold text-slate-200 leading-relaxed italic">
                    "{fact.fact}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter px-1.5 py-0.5 rounded border border-white/5">
                    {fact.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400">
                    {Math.round(fact.confidence)}% Match
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="text-slate-700 mb-3">
                <Maximize2 size={32} />
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                System has not anchored specific atomic facts to this file yet.
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-8 border-t border-white/5">
          <div className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl">
            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ExternalLink size={12} /> Privacy Protocol
            </h5>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              This document is encrypted at rest in your local browser database. AI analysis occurs
              contextually but original files are never uploaded to remote cloud storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
