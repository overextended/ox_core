import { Box, Text, Divider, Flex, IconButton } from '@chakra-ui/react';
import { useNuiEvent } from '../hooks/useNuiEvent';
import { debugData } from '../utils/debugData';
import { BsPersonDashFill } from 'react-icons/bs';
import { theme } from '../styles/theme';
import { useNavigate } from 'react-router-dom';
import type { Character } from '../types';
import React from 'react';

interface Props {
  setCharacter: React.Dispatch<React.SetStateAction<Character>>;
  setSelectVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

debugData([
  {
    action: 'sendCharacters',
    data: [
      {
        firstname: 'Peter',
        lastname: 'Linden',
        gender: 'Male',
        location: 'Galaxy far far away',
        dateofbirth: '03/07/1990',
        groups: ['Ox', 'Police'],
        phone_number: '069-999999',
        slot: 0,
      },
      {
        firstname: 'Luke',
        lastname: 'Lindensson',
        gender: 'Male',
        location: 'Pillbox Hill',
        dateofbirth: '14/03/1984',
        groups: ['Ox', 'Ambulance'],
        phone_number: '069-945132',
        slot: 1,
      },
    ],
  },
]);

const Characters: React.FC<Props> = (props) => {
  const [characters, setCharacters] = React.useState<Character[]>([
    {
      firstname: '',
      lastname: '',
      location: '',
      gender: '',
      dateofbirth: '',
      groups: [''],
      phone_number: '',
      slot: 0,
    },
  ]);

  const navigate = useNavigate();

  const deleteCharacter = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    index: number
  ) => {
    event.stopPropagation();
    navigate('/delete');
    props.setCharacter(characters[index]);
    props.setDeleteVisible(true);
  };

  const selectCharacter = (index: number) => {
    navigate('/select');
    characters[index].slot = index;
    props.setCharacter(characters[index]);
    props.setSelectVisible(true);
  };

  useNuiEvent('sendCharacters', (data: Character[]) => {
    setCharacters(data);
  });

  return (
    <>
      {characters.map((character: Character, index) => (
        <React.Fragment key={`character-${index}`}>
          <Flex
            p={3}
            w="100%"
            alignItems="center"
            position="relative"
            transition="0.3s"
            _hover={{ bg: theme.colors.sideHover }}
            onClick={() => selectCharacter(index)}
          >
            <IconButton
              aria-label="Delete chasracter"
              icon={<BsPersonDashFill />}
              color="red.500"
              position="absolute"
              fontSize="xl"
              top="1vh"
              right="2vh"
              bg="none"
              _hover={{ color: 'red.300' }}
              onClick={(e) => deleteCharacter(e, index)}
            />
            <Box justifySelf="center" alignItems="center" maxW="80%">
              <Text fontSize="2xl">{`${character.firstname} ${character.lastname}`}</Text>
              <Text fontSize="sm">{`Location: ${character.location}`}</Text>
              <Text fontSize="sm">Last Played: 31/01/2022</Text>
            </Box>
          </Flex>
          <Divider />
        </React.Fragment>
      ))}
    </>
  );
};

export default Characters;
