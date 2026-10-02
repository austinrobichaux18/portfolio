export type KanaRowKind = 'gojuon' | 'dakuten' | 'handakuten' | 'yoon';

export interface KanaRowGroup {
  id: string;
  label: string;
  kind: KanaRowKind;
}
