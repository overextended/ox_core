import React from 'react';
import { Box, Flex, Spacer, Button } from '@chakra-ui/react';
import Characters from './Characters';
import CreateCharacter from './Dialogs/CreateCharacter';
import { BsFillPersonPlusFill } from 'react-icons/bs';
import { theme } from '../styles/theme';

const SideBar: React.FC = () => {
  const [createVisible, setCreateVisible] = React.useState(false);

  return (
    // Left bar
    <>
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
            _hover={{ bg: theme.colors.sideHover }}
            onClick={() => setCreateVisible(true)}
          >
            Create new character
          </Button>
        </Flex>
      </Box>
      {/* // Right bar */}
      <Box position="fixed" right="0" top="0" w="25vh" h="100vh">
        <Flex justifyContent="center" alignItems="center" h="100%">
          <CreateCharacter visible={createVisible} setVisible={setCreateVisible} />
        </Flex>
      </Box>
    </>
  );
};

export default SideBar;
