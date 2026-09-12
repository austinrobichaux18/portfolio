export interface QuizQuestion {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
    e?: string;
    f?: string;
    g?: string;
    h?: string;
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
  explanation: string;
}
