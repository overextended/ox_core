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
import { useLocales } from '../../providers/LocaleProvider';

interface Props {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  character: Character;
}

const DeleteCharacter: React.FC<Props> = (props) => {
  const [disableDelete, setDisableDelete] = React.useState(true);

  const characters = useCharacters();
  const { locale } = useLocales();

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
    <Modal
      isOpen={props.visible}
      onClose={() => props.setVisible(false)}
      closeOnEsc={false}
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent maxW={250}>
        <ModalBody p={3}>
          <VStack textAlign="center" p={1}>
            <Text
              fontWeight="bold"
              fontSize="xl"
            >{`${props.character.firstname}  ${props.character.lastname}`}</Text>
            <Text fontWeight="bold" color="red.600">
              {locale.ui.irreversible_ation}
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
              {locale.ui.delete}
            </Button>
            <Button
              _hover={{ bg: 'red.500' }}
              _focus={{ bg: 'red.500' }}
              onClick={() => props.setVisible(false)}
            >
              {locale.ui.cancel}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteCharacter;
