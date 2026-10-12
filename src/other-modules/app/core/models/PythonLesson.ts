export interface CodeComparison {
  title: string;
  description: string;
  csharp: string;
  python: string;
  notes: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PythonLesson {
  id: string;
  title: string;
  description: string;
  comparisons: CodeComparison[];
  quiz: QuizQuestion[];
}
