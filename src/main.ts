import './style.css';
import './patterns/phyllotaxis';
import './patterns/maurer';
import { mountPlayground } from './ui/playground';

mountPlayground(document.querySelector<HTMLDivElement>('#app')!);
