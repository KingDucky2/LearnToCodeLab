"use client";

import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { sampleQuestions } from "@/lib/curriculum";

type AnswerRecord = {
  prompt: string;
  chosen: string;
  correct: string;
  topic: string;
  mistake: string;
  wasCorrect: boolean;
};

export function PracticeEngine() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState("");
  const [finished, setFinished] = useState(false);
  const question = sampleQuestions[index];
  const choices = useMemo(() => question ? [question.correct, ...question.choices].sort() : [], [question]);
  const score = answers.filter((answer) => answer.wasCorrect).length;

  function submit(choice: string) {
    if (!question || selected) return;
    setSelected(choice);
    setAnswers([...answers, { prompt: question.prompt, chosen: choice, correct: question.correct, topic: question.topic, mistake: question.mistake, wasCorrect: choice === question.correct }]);
  }

  function next() {
    setSelected("");
    if (index >= sampleQuestions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
  }

  function reset() {
    setIndex(0);
    setSelected("");
    setAnswers([]);
    setFinished(false);
  }

  if (finished) {
    const weak = answers.filter((answer) => !answer.wasCorrect);
    return (
      <div className="surface-panel">
        <p className="text-sm font-extrabold text-warning">Assessment report</p>
        <h2 className="mt-2 text-3xl font-black text-foreground">Score {score}/{sampleQuestions.length}</h2>
        <p className="mt-3 text-muted">{weak.length ? "Review these mistake patterns before the next lesson." : "Clean run. Move into a harder checkpoint or a mini-project."}</p>
        <div className="mt-5 grid gap-3">
          {(weak.length ? weak : answers.slice(0, 2)).map((answer) => (
            <div key={answer.prompt} className="rounded-lg border border-border bg-surface-secondary p-4">
              <strong className="text-foreground">{answer.topic}</strong>
              <p className="mt-2 text-muted">{answer.prompt}</p>
              <p className="mt-2 text-sm font-bold text-secondary">Mistake category: {answer.mistake}</p>
            </div>
          ))}
        </div>
        <button onClick={reset} className="btn-primary mt-5">Restart assessment</button>
      </div>
    );
  }

  return (
    <div className="surface-panel">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-warning">Adaptive placement</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">Question {index + 1} of {sampleQuestions.length}</h1>
        </div>
        <span className="rounded-full bg-surface-secondary px-3 py-2 text-sm font-black text-muted">Score {score}</span>
      </div>
      <p className="text-xl font-black text-foreground">{question.prompt}</p>
      <div className="mt-5 grid gap-3" role="radiogroup" aria-label={question.prompt}>
        {choices.map((choice) => (
          <button key={choice} role="radio" aria-checked={selected === choice} onClick={() => submit(choice)} className={`flex min-h-14 items-center justify-between gap-4 rounded-lg border p-4 text-left font-black transition-colors ${selected && choice === question.correct ? "border-emerald-600 bg-emerald-50 text-emerald-950" : selected === choice ? "border-red-600 bg-red-50 text-red-950" : "border-border bg-surface-interactive text-foreground hover:border-border-strong hover:bg-surface-secondary"}`}>
            <span>{choice}</span>
            {selected && choice === question.correct ? <Check className="h-5 w-5 shrink-0" aria-label="Correct answer" /> : selected === choice ? <X className="h-5 w-5 shrink-0" aria-label="Incorrect answer" /> : null}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="mt-5 rounded-lg bg-surface-secondary p-4">
          <p className="font-black text-foreground">{selected === question.correct ? "Correct." : `Not quite. Correct answer: ${question.correct}`}</p>
          <p className="mt-1 text-muted">Feedback category: {question.mistake}. Future versions will record hints, confidence, and time spent.</p>
          <button onClick={next} className="btn-primary mt-4">Continue</button>
        </div>
      ) : null}
    </div>
  );
}
