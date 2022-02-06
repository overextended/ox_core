import React from 'react';
import { Box, Text, Flex, Spacer, Button, ScaleFade } from '@chakra-ui/react';
import { theme } from '../../styles/theme';
import type { Character } from '../../types';
import { fetchNui } from '../../utils/fetchNui';
import { useVisibility } from '../../providers/VisibilityProvider';

interface Props {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  character: Character;
}

const SelectCharacter: React.FC<Props> = (props) => {
  const frameVisibility = useVisibility();

  const playCharacter = () => {
    fetchNui('ox:selectCharacter', props.character.slot);
    props.setVisible(false);
    frameVisibility.setVisible(false);
  };

  return (
    <ScaleFade in={props.visible} unmountOnExit>
      <Box
        w="100%"
        h="fit-content"
        p={3}
        bg={theme.colors.sideHover}
        fontFamily="Poppins"
        visibility={props.visible ? 'visible' : 'hidden'}
      >
        <Flex
          justifyContent="center"
          alignItems="center"
          direction="column"
          h="100%"
          textAlign="center"
        >
          <Text fontSize="lg">{`${props.character.firstname} ${props.character.lastname}`}</Text>
          <Spacer />
          <Box p={1}>
            <Text fontWeight="bold">Gender</Text>
            <Text>{props.character.gender}</Text>
          </Box>
          <Spacer />
          <Box p={1}>
            <Text fontWeight="bold">Date of Birth</Text>
            <Text>{new Date(props.character.dateofbirth).toDateString()}</Text>
          </Box>
          <Spacer />
          {props.character.phone_number && (
            <Box p={1}>
              <Text fontWeight="bold">Phone Number</Text>
              <Text>{props.character.phone_number}</Text>
            </Box>
          )}
          <Spacer />
          {props.character.groups && props.character.groups[0] !== '' && (
            <Box maxW="80%" p={1}>
              <Text fontWeight="bold">Groups</Text>
              <Text>{props.character.groups.join(', ')}</Text>
            </Box>
          )}
          <Spacer />
          <Box mb={1} p={1}>
            <Button mr={1} _hover={{ bg: 'green.500' }} onClick={() => playCharacter()}>
              Select
            </Button>
            <Button ml={1} _hover={{ bg: 'red.500' }} onClick={() => props.setVisible(false)}>
              Cancel
            </Button>
          </Box>
        </Flex>
      </Box>
    </ScaleFade>
  );
};

export default SelectCharacter;
