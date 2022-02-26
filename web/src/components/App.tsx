import { debugData } from '../utils/debugData';
import Sidebar from './Sidebar';
import DialogWrapper from './DialogWrapper';
import React from 'react';
import type { Character } from '../types';

debugData([
  {
    action: 'setVisible',
    data: true,
  },
]);

const App: React.FC = () => {
  const [createVisible, setCreateVisible] = React.useState(false);
  const [selectVisible, setSelectVisible] = React.useState(false);
  const [deleteVisible, setDeleteVisible] = React.useState(false);
  const [character, setCharacter] = React.useState<Character>({
    firstname: '',
    lastname: '',
    gender: '',
    location: '',
    dateofbirth: '',
    groups: [''],
    phone_number: '',
    last_played: '',
    slot: 0,
  });

  const sidebarProps = {
    setCreateVisible,
    setSelectVisible,
    setDeleteVisible,
    setCharacter,
  };

  const dialogWrapperProps = {
    character,
    createVisible,
    setCreateVisible,
    selectVisible,
    setSelectVisible,
    deleteVisible,
    setDeleteVisible,
  };

  return (
    <>
      <Sidebar {...sidebarProps} />
      <DialogWrapper {...dialogWrapperProps} />
    </>
  );
};

export default App;
