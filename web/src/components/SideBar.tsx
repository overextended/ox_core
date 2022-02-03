import React from 'react';
import { Box, Flex, Spacer, Button } from '@chakra-ui/react';
import Characters from './Characters';
import { BsFillPersonPlusFill } from 'react-icons/bs';
import { customTheme } from '../styles/theme';

const SideBar: React.FC = () => {
  return (
    <Box
      position="fixed"
      left="0"
      w="30vh"
      h="100vh"
      // bg="gray.800"
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
          <Characters />
        </Flex>
        <Spacer />
        <Button
          leftIcon={<BsFillPersonPlusFill />}
          mb={5}
          size="lg"
          fontFamily="Poppins"
          fontSize="xl"
          borderRadius="none"
          backgroundColor="transparent"
          _hover={{ bg: customTheme.colors.sideHover }}
        >
          Create new character
        </Button>
      </Flex>
    </Box>
  );
};

export default SideBar;
