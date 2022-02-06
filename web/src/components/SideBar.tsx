import React from 'react';
import { Box, Flex, Spacer, Button } from '@chakra-ui/react';
import Characters from './Characters';
import { BsFillPersonPlusFill } from 'react-icons/bs';
import { theme } from '../styles/theme';
import { Link } from 'react-router-dom';
import type { Character } from '../types';

interface Props {
  setCreateVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setCharacter: React.Dispatch<React.SetStateAction<Character>>;
}

const Sidebar: React.FC<Props> = (props) => {
  return (
    <Box
      position="fixed"
      left="0"
      w="30vh"
      h="100vh"
      bg="linear-gradient(90deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);"
    >
      <Flex direction="column" h="100%">
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
        <Spacer />
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
          >
            Create new character
          </Button>
        </Link>
      </Flex>
    </Box>
  );
};

export default Sidebar;
