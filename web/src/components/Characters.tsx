import { Box, Text, Divider, Flex, IconButton } from '@chakra-ui/react';
import { useNuiEvent } from '../hooks/useNuiEvent';
import { debugData } from '../utils/debugData';
import { BsPersonDashFill } from 'react-icons/bs';
import { theme } from '../styles/theme';
import { useNavigate } from 'react-router-dom';
import type { Character } from '../types';
import React from 'react';
import { useCharacters } from '../providers/CharactersProvider';
import { fetchNui } from '../utils/fetchNui';

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
  const characters = useCharacters();
  const navigate = useNavigate();

  const deleteCharacter = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    index: number
  ) => {
    event.stopPropagation();
    navigate('/delete');
    characters.value[index].slot = index;
    props.setCharacter(characters.value[index]);
    fetchNui('ox:setCharacter', index);
    props.setDeleteVisible(true);
  };

  const selectCharacter = (index: number) => {
    navigate('/select');
    characters.value[index].slot = index;
    props.setCharacter(characters.value[index]);
    fetchNui('ox:setCharacter', index);
    props.setSelectVisible(true);
  };

  useNuiEvent('sendCharacters', (data: Character[]) => {
    characters.setValue(data);
  });

  return (
    <>
      {characters.value.map((character: Character, index) => (
        <React.Fragment key={`character-${index}`}>
          <Flex
            p={3}
            w="100%"
            isTruncated
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
              onClick={(e) => deleteCharacter(e, index)}
            />
            <Box justifySelf="center" alignItems="center" maxW="80%">
              <Text fontSize="2xl">{`${character.firstname} ${character.lastname}`}</Text>
              <Text fontSize="sm">{`Location: ${character.location}`}</Text>
              <Text fontSize="sm">Last Played: {character.last_played}</Text>
            </Box>
          </Flex>
          <Divider />
        </React.Fragment>
      ))}
    </>
  );
};

export default Characters;
