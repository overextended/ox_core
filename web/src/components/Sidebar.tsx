import React, { useState } from 'react';
import { Box, Flex, Spacer, Button, Tooltip } from '@chakra-ui/react';
import Characters from './Characters';
import { BsFillPersonPlusFill } from 'react-icons/bs';
import { theme } from '../styles/theme';
import { Link } from 'react-router-dom';
import type { Character } from '../types';
import { useNuiEvent } from '../hooks/useNuiEvent';
import { useCharacters } from '../providers/CharactersProvider';
import { useLocales } from '../providers/LocaleProvider';

interface Props {
  setCreateVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setCharacter: React.Dispatch<React.SetStateAction<Character>>;
}

const Sidebar: React.FC<Props> = (props) => {
  const [maxSlots, setMaxSlots] = useState(0);
  const characters = useCharacters();
  const { locale } = useLocales();

  useNuiEvent('sendCharacters', (data: { characters: Character[]; maxSlots: number }) =>
    setMaxSlots(data.maxSlots)
  );

  return (
    <Box
      position="fixed"
      left="0"
      top="0"
      w="fit-content"
      h="100%"
      bg="linear-gradient(90deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);"
    >
      <Box overflowY="scroll" height="90%">
        <Flex
          fontFamily="Poppins"
          direction="column"
          alignContent="center"
          justifyContent="center"
          alignItems="center"
        >
          <Characters
            setCharacter={props.setCharacter}
            setSelectVisible={props.setSelectVisible}
            setDeleteVisible={props.setDeleteVisible}
          />
        </Flex>
      </Box>
      <Spacer />
      <Flex height="10%" justifyContent="center" alignItems="center">
        <Tooltip
          isDisabled={maxSlots <= characters.value.length ? false : true}
          label={locale.ui.max_chars}
          hasArrow
        >
          <Link to="/create">
            <Button
              leftIcon={<BsFillPersonPlusFill />}
              mb={5}
              size="lg"
              fontFamily="Poppins"
              fontSize="xl"
              borderRadius="none"
              backgroundColor="transparent"
              _hover={{ bg: theme.colors.sideHover }}
              onClick={() => props.setCreateVisible(true)}
              isDisabled={maxSlots <= characters.value.length ? true : false}
            >
              {locale.ui.create_a_char}
            </Button>
          </Link>
        </Tooltip>
      </Flex>
    </Box>
  );
};

export default Sidebar;
