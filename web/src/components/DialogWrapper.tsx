import CreateCharacter from './Dialogs/CreateCharacter';
import DeleteCharacter from './Dialogs/DeleteCharacter';
import SelectCharacter from './Dialogs/SelectCharacter';
import React from 'react';
import { Flex } from '@chakra-ui/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import type { Character } from '../types';

interface Props {
  setCreateVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteVisible: React.Dispatch<React.SetStateAction<boolean>>;
  createVisible: boolean;
  selectVisible: boolean;
  deleteVisible: boolean;
  character: Character;
}

const DialogWrapper: React.FC<Props> = (props) => {
  const location = useLocation();

  return (
    <Flex
      w="100%"
      h="100%"
      direction="column"
      justifyContent="center"
      alignItems={location.pathname === '/create' ? 'center' : 'flex-end'}
    >
      <Routes>
        <Route path="/" element={<></>} />
        <Route
          path="/create"
          element={
            <CreateCharacter visible={props.createVisible} setVisible={props.setCreateVisible} />
          }
        />
        <Route
          path="/select"
          element={
            <SelectCharacter
              visible={props.selectVisible}
              setVisible={props.setSelectVisible}
              character={props.character}
            />
          }
        />
        <Route
          path="/delete"
          element={
            <DeleteCharacter
              visible={props.deleteVisible}
              setVisible={props.setDeleteVisible}
              character={props.character}
            />
          }
        />
      </Routes>
    </Flex>
  );
};

export default DialogWrapper;
