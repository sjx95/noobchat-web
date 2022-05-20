import { createRoot } from 'react-dom/client';
import './index.css';
import Call from './Call';

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<Call />);
