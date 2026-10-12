export type ModuleGroup = 'Japanese' | 'Local Folder' | 'Finance' | 'Music';

export interface Module {
  id: string;
  title: string;
  description: string;
  route: string;
  lastUpdated: string;
  group: ModuleGroup;
}
