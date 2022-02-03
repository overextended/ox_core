import { debugData } from '../utils/debugData';
import SideBar from './SideBar';

debugData([
  {
    action: 'setVisible',
    data: true,
  },
]);

const App: React.FC = () => {
  return (
    <>
      <SideBar />
    </>
  );
};

export default App;
