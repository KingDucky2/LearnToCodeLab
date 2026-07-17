"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";

export type ConsoleEntry = { id: number; level: "log" | "warn" | "error"; text: string };

export default function LivePreview({ files, runVersion, onConsole }: { files: Record<string, string>; runVersion: number; onConsole: (entry: Omit<ConsoleEntry, "id">) => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channelRef = useRef(`preview-${Math.random().toString(36).slice(2)}`);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const srcDoc = useMemo(() => buildPreviewDocument(files, channelRef.current), [files]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.channel !== channelRef.current || event.data?.type !== "learner-console") return;
      const level = event.data.level === "warn" || event.data.level === "error" ? event.data.level : "log";
      onConsole({ level, text: String(event.data.text ?? "").slice(0, 4000) });
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onConsole]);

  const width = viewport === "mobile" ? "390px" : viewport === "tablet" ? "768px" : "100%";
  return (
    <section className="flex min-h-[24rem] min-w-0 flex-col bg-surface" aria-label="Live preview">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-xs font-black uppercase tracking-wide text-secondary">Sandboxed preview</span>
        <div className="flex items-center gap-1" role="group" aria-label="Preview width">
          {(["desktop", "tablet", "mobile"] as const).map((size) => { const Icon = size === "desktop" ? Monitor : size === "tablet" ? Tablet : Smartphone; return <button key={size} type="button" aria-pressed={viewport === size} onClick={() => setViewport(size)} className={`btn-icon h-9 w-9 ${viewport === size ? "bg-surface-secondary text-primary" : "btn-ghost"}`} title={`${size} preview`}><Icon className="h-4 w-4" aria-hidden="true" /><span className="sr-only">{size} preview</span></button>; })}
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="btn-icon btn-ghost h-9 w-9" title="Refresh preview"><RefreshCw className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Refresh preview</span></button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-surface-secondary p-2">
        <iframe key={`${runVersion}-${refreshKey}`} ref={iframeRef} title="Learner code preview" sandbox="allow-scripts" srcDoc={srcDoc} className="min-h-[21rem] max-w-full bg-white shadow-surface transition-[width] motion-reduce:transition-none" style={{ width }} />
      </div>
    </section>
  );
}

function buildPreviewDocument(files: Record<string, string>, channel: string) {
  const css = escapeClosingTag(files["styles.css"] ?? "", "style");
  const javascript = escapeClosingTag(files["script.js"] ?? "", "script");
  const bridge = `<script>(function(){const channel=${JSON.stringify(channel)};const send=(level,args)=>{let text;try{text=args.map(value=>typeof value==='string'?value:JSON.stringify(value)).join(' ')}catch{text='[Unserializable value]'}parent.postMessage({channel,type:'learner-console',level,text},'*')};['log','warn','error'].forEach(level=>{const original=console[level];console[level]=function(...args){send(level,args);original.apply(console,args)}});window.addEventListener('error',event=>send('error',[event.message+' at line '+event.lineno]));window.addEventListener('unhandledrejection',event=>send('error',['Unhandled promise rejection:',String(event.reason)]));})();</script>`;
  const assets = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: https:; font-src data:; connect-src 'none'; frame-src 'none';"><style>${css}</style>${bridge}`;
  const script = `<script>${javascript}</script>`;
  let html = (files["index.html"] ?? "").replace(/<link\b[^>]*href=["']styles\.css["'][^>]*>/gi, "").replace(/<script\b[^>]*src=["']script\.js["'][^>]*>\s*<\/script>/gi, "");
  if (!/<html[\s>]/i.test(html)) html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
  html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${assets}</head>`) : html.replace(/<html[^>]*>/i, (match) => `${match}<head>${assets}</head>`);
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${script}</body>`) : `${html}${script}`;
}

function escapeClosingTag(value: string, tag: "style" | "script") {
  return value.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);
}
