"use client";

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
      <div className="glass rounded-3xl p-6">
        <p className="text-xs font-black uppercase text-amber-700">Assessment report</p>
        <h2 className="mt-2 text-4xl font-black text-lab-navy">Score {score}/{sampleQuestions.length}</h2>
        <p className="mt-3 text-slate-600">{weak.length ? "Review these mistake patterns before the next lesson." : "Clean run. Move into a harder checkpoint or a mini-project."}</p>
        <div className="mt-5 grid gap-3">
          {(weak.length ? weak : answers.slice(0, 2)).map((answer) => (
            <div key={answer.prompt} className="rounded-2xl border border-slate-200 bg-white p-4">
              <strong className="text-lab-navy">{answer.topic}</strong>
              <p className="mt-2 text-slate-600">{answer.prompt}</p>
              <p className="mt-2 text-sm font-bold text-slate-700">Mistake category: {answer.mistake}</p>
            </div>
          ))}
        </div>
        <button onClick={reset} className="mt-5 rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-4 py-3 font-black text-lab-navy">Restart assessment</button>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-amber-700">Adaptive placement</p>
          <h1 className="mt-2 text-3xl font-black text-lab-navy">Question {index + 1} of {sampleQuestions.length}</h1>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">Score {score}</span>
      </div>
      <p className="text-xl font-black text-lab-navy">{question.prompt}</p>
      <div className="mt-5 grid gap-3">
        {choices.map((choice) => (
          <button key={choice} onClick={() => submit(choice)} className={`rounded-2xl border p-4 text-left font-black ${selected && choice === question.correct ? "border-emerald-300 bg-emerald-50 text-emerald-800" : selected === choice ? "border-red-300 bg-red-50 text-red-800" : "border-slate-200 bg-white text-lab-navy"}`}>
            {choice}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="mt-5 rounded-2xl bg-slate-100 p-4">
          <p className="font-black text-lab-navy">{selected === question.correct ? "Correct." : `Not quite. Correct answer: ${question.correct}`}</p>
          <p className="mt-1 text-slate-600">Feedback category: {question.mistake}. Future versions will record hints, confidence, and time spent.</p>
          <button onClick={next} className="mt-4 rounded-xl bg-lab-navy px-4 py-3 font-black text-white">Continue</button>
        </div>
      ) : null}
    </div>
  );
}
