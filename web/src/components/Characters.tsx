import { Box, Text, Divider, Flex, IconButton } from '@chakra-ui/react';
import { useNuiEvent } from '../hooks/useNuiEvent';
import { debugData } from '../utils/debugData';
import { BsPersonDashFill } from 'react-icons/bs';
import { customTheme } from '../styles/theme';
import React from 'react';

interface Character {
  firstName: string;
  lastName: string;
  location: string;
  gender: string;
}

debugData([
  {
    action: 'sendCharacters',
    data: [
      {
        firstName: 'Peter',
        lastName: 'Linden',
        location: 'Galaxy far far away',
      },
      {
        firstName: 'Luke',
        lastName: 'Lindensson',
        gender: 'male',
        location: 'Pillbox Hill',
      },
    ],
  },
]);

const Characters: React.FC = () => {
  const [characters, setCharacters] = React.useState<Character[]>([
    {
      firstName: '',
      lastName: '',
      location: '',
      gender: '',
    },
  ]);

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
            _hover={{ bg: customTheme.colors.sideHover }}
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
              _hover={{ color: 'red.700' }}
              outline="none !important"
            />
            <Box justifySelf="center" alignItems="center" maxW="80%">
              <Text fontSize="2xl">{`${character.firstName} ${character.lastName}`}</Text>
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
