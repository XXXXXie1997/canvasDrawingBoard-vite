export interface ITool {
  name: string;
  key: string;
  icon?: any;
  selected?: boolean;
  shapeType?: 'rectangle' | 'circle' | 'ellipse' | 'diamond';
}
