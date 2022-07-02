import React from 'react';
import {
  VStack,
  Text,
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
} from '@chakra-ui/react';
import type { Character } from '../../types';
import { fetchNui } from '../../utils/fetchNui';
import { useCharacters } from '../../providers/CharactersProvider';

interface Props {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  character: Character;
}

const DeleteCharacter: React.FC<Props> = (props) => {
  const [disableDelete, setDisableDelete] = React.useState(true);

  const characters = useCharacters();

  const handleDelete = () => {
    characters.setValue(characters.value.filter((_, i) => i !== props.character.slot));
    fetchNui('ox:deleteCharacter', props.character.slot);
    props.setVisible(false);
  };

  React.useEffect(() => {
    // Disables the confirm button for 2 seconds after opening the dialog
    if (props.visible) {
      setDisableDelete(true);
      setTimeout(() => {
        setDisableDelete(false);
      }, 2000);
    }
  }, [props.visible, props.character]);

  return (
    <Modal isOpen={props.visible} onClose={() => props.setVisible(false)} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent maxW={250}>
        <ModalBody p={3}>
          <VStack textAlign="center" p={1}>
            <Text
              fontWeight="bold"
              fontSize="xl"
            >{`${props.character.firstname}  ${props.character.lastname}`}</Text>
            <Text fontWeight="bold" color="red.600">
              This action is irreversible
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter sx={{ justifyContent: 'center' }} p={0}>
          <HStack align="center" justify="center" p={3}>
            <Button
              _hover={{ bg: 'green.500' }}
              _focus={{ bg: 'green.500' }}
              isDisabled={disableDelete}
              onClick={() => handleDelete()}
            >
              Delete
            </Button>
            <Button
              _hover={{ bg: 'red.500' }}
              _focus={{ bg: 'red.500' }}
              onClick={() => props.setVisible(false)}
            >
              Cancel
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteCharacter;
