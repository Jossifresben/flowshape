import './style.css';
import './patterns/index';
import { mountPlayground } from './ui/playground';

mountPlayground(document.querySelector<HTMLDivElement>('#app')!);
