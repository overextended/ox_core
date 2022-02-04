import { Box, Text, Divider, Flex, IconButton } from '@chakra-ui/react';
import { useNuiEvent } from '../hooks/useNuiEvent';
import { debugData } from '../utils/debugData';
import { BsPersonDashFill } from 'react-icons/bs';
import { theme } from '../styles/theme';
import type { Character } from '../types';
import React from 'react';

interface Props {
  setCharacter: React.Dispatch<React.SetStateAction<Character>>;
  setSelectVisible: React.Dispatch<React.SetStateAction<boolean>>;
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
        slot: 0,
      },
      {
        firstname: 'Luke',
        lastname: 'Lindensson',
        gender: 'Male',
        location: 'Pillbox Hill',
        slot: 1,
      },
    ],
  },
]);

const deleteCharacter = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
  event.stopPropagation();
  // Open delete character dialog here
};

const Characters: React.FC<Props> = (props) => {
  const [characters, setCharacters] = React.useState<Character[]>([
    {
      firstname: '',
      lastname: '',
      location: '',
      gender: '',
      slot: 0,
    },
  ]);

  const selectCharacter = (index: number) => {
    // Open select charcter dialog here
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
              aria-label="Delete character"
              icon={<BsPersonDashFill />}
              color="red.500"
              position="absolute"
              fontSize="xl"
              top="1vh"
              right="2vh"
              bg="none"
              _hover={{ color: 'red.300' }}
              onClick={(e) => deleteCharacter(e)}
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
