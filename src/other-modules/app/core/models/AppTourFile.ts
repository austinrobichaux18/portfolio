export interface AppTourFile {
  id: string;
  csharpPath: string;
  pythonPath: string;
  description: string;
  lessonIds: string[];
  csharp: string;
  python: string;
  notes: string[];
  contrivedNote?: string;
}
