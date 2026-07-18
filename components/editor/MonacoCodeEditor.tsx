"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { Braces, FileCode2, WandSparkles } from "lucide-react";
import { useRef } from "react";
import type { LessonFile } from "@/lib/learning/types";

export default function MonacoCodeEditor({ files, activeFile, onActiveFile, onChange }: { files: LessonFile[]; activeFile: string; onActiveFile: (name: string) => void; onChange: (name: string, value: string) => void }) {
  const file = files.find((item) => item.name === activeFile) ?? files[0];
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const mount: OnMount = (editor) => { editorRef.current = editor; };
  const format = () => { void editorRef.current?.getAction("editor.action.formatDocument")?.run(); editorRef.current?.focus(); };
  return (
    <section className="flex min-h-[26rem] min-w-0 flex-col bg-[#07101d]" aria-label="Code editor">
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-700 px-2 py-2">
        <div role="tablist" aria-label="Lesson files" className="flex min-w-0 overflow-x-auto">
          {files.map((item, index) => <button key={item.name} id={`file-tab-${item.name}`} type="button" role="tab" aria-controls="lesson-file-editor" aria-selected={item.name === file.name} tabIndex={item.name === file.name ? 0 : -1} onClick={() => onActiveFile(item.name)} onKeyDown={(event) => moveFileTabFocus(event, index, files, onActiveFile)} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold ${item.name === file.name ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}>{item.language === "javascript" ? <Braces className="h-4 w-4" aria-hidden="true" /> : <FileCode2 className="h-4 w-4" aria-hidden="true" />}{item.name}</button>)}
        </div>
        <button type="button" onClick={format} className="btn-ghost min-h-9 shrink-0 px-2 text-xs text-slate-200" title="Format document (Shift+Alt+F)"><WandSparkles className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Format</span></button>
      </div>
      <div id="lesson-file-editor" role="tabpanel" aria-labelledby={`file-tab-${file.name}`} className="min-h-0 flex-1">
        <Editor height="100%" path={`file:///${file.name}`} language={file.language} value={file.content} theme="vs-dark" onMount={mount} onChange={(value) => onChange(file.name, value ?? "")} options={{ automaticLayout: true, minimap: { enabled: false }, fontSize: 14, lineHeight: 22, lineNumbers: "on", bracketPairColorization: { enabled: true }, formatOnPaste: true, formatOnType: true, scrollBeyondLastLine: false, tabSize: 2, wordWrap: "on", readOnly: !file.editable, padding: { top: 12, bottom: 12 }, ariaLabel: `${file.name} code editor` }} />
      </div>
    </section>
  );
}

function moveFileTabFocus(event: React.KeyboardEvent<HTMLButtonElement>, index: number, files: LessonFile[], onActiveFile: (name: string) => void) {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? files.length - 1 : event.key === "ArrowRight" ? (index + 1) % files.length : (index - 1 + files.length) % files.length;
  onActiveFile(files[nextIndex].name);
  document.getElementById(`file-tab-${files[nextIndex].name}`)?.focus();
}
