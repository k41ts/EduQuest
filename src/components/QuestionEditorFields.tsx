import type { CSSProperties } from 'react';
import type { Question } from '../types';
import { adminField, adminTextArea } from './adminUi';

export type QuestionDraft = {
  subject: Question['subject'];
  difficulty: Question['difficulty'];
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

const optionLabels = ['Jawaban 1', 'Jawaban 2', 'Jawaban 3', 'Jawaban 4'] as const;

export function defaultQuestionDraft(initial?: Partial<Question>): QuestionDraft {
  return {
    subject: initial?.subject ?? 'TPS',
    difficulty: initial?.difficulty ?? 'easy',
    text: initial?.text ?? '',
    options: [
      initial?.options?.[0] ?? '',
      initial?.options?.[1] ?? '',
      initial?.options?.[2] ?? '',
      initial?.options?.[3] ?? '',
    ],
    correctIndex: initial?.correctIndex ?? 0,
    explanation: initial?.explanation ?? '',
  };
}

export function QuestionEditorFields({
  draft,
  onChange,
}: {
  draft: QuestionDraft;
  onChange: (next: QuestionDraft) => void;
}) {
  const update = <K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  const updateOption = (index: number, value: string) => {
    const nextOptions = [...draft.options] as QuestionDraft['options'];
    nextOptions[index] = value;
    onChange({ ...draft, options: nextOptions });
  };

  const fieldStyle: CSSProperties = adminField;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <select value={draft.subject} onChange={e => update('subject', e.target.value as Question['subject'])} style={fieldStyle}>
          <option value="TPS">TPS</option>
          <option value="Literasi">Literasi</option>
          <option value="Matematika">Matematika</option>
        </select>
        <select value={draft.difficulty} onChange={e => update('difficulty', e.target.value as Question['difficulty'])} style={fieldStyle}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <textarea
        placeholder="Pertanyaan"
        value={draft.text}
        onChange={e => update('text', e.target.value)}
        style={adminTextArea}
      />

      <div style={{ display: 'grid', gap: 10 }}>
        {optionLabels.map((label, index) => (
          <div key={label} style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#726F86' }}>{label}</label>
            <input
              value={draft.options[index]}
              onChange={e => updateOption(index, e.target.value)}
              style={fieldStyle}
              placeholder={label}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#726F86' }}>Jawaban benar</label>
        <select value={draft.correctIndex} onChange={e => update('correctIndex', Number(e.target.value))} style={fieldStyle}>
          <option value={0}>Jawaban 1</option>
          <option value={1}>Jawaban 2</option>
          <option value={2}>Jawaban 3</option>
          <option value={3}>Jawaban 4</option>
        </select>
      </div>

      <textarea
        placeholder="Explanation"
        value={draft.explanation}
        onChange={e => update('explanation', e.target.value)}
        style={adminTextArea}
      />
    </div>
  );
}
