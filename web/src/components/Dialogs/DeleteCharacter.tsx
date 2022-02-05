import React from 'react';
import { Box, VStack, Text, Input, Button, HStack, ScaleFade } from '@chakra-ui/react';
import { theme } from '../../styles/theme';
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
  const [inputValue, setInputValue] = React.useState('');

  const characters = useCharacters();

  const handleInput = () => {
    if (inputValue !== `${props.character.firstname} ${props.character.lastname}`)
      setDisableDelete(true);
    else setDisableDelete(false);
  };

  const handleDelete = () => {
    fetchNui('ox:deleteCharacter', props.character.slot);
    characters.setValue(characters.value.filter((_, i) => i !== props.character.slot));
    props.setVisible(false);
  };

  React.useEffect(() => setInputValue(''), [props.visible, props.character]);
  React.useEffect(handleInput, [inputValue]);

  return (
    <ScaleFade in={props.visible} unmountOnExit>
      <Box bg={theme.colors.sideHover} w="100%" h="fit-content" fontFamily="Poppins">
        <VStack textAlign="center" p={1}>
          <Text fontSize="lg">Delete Character</Text>
          <Text fontWeight="bold">{`${props.character.firstname}  ${props.character.lastname}`}</Text>
          <Text fontWeight="bold" color="red.600">
            This action is irreversible
          </Text>
          <Input
            placeholder="Character name"
            textAlign="center"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </VStack>
        <HStack align="center" justify="center" mt={3} p={3}>
          <Button
            _hover={{ bg: 'green.500' }}
            isDisabled={disableDelete}
            onClick={() => handleDelete()}
          >
            Delete
          </Button>
          <Button _hover={{ bg: 'red.500' }} onClick={() => props.setVisible(false)}>
            Cancel
          </Button>
        </HStack>
      </Box>
    </ScaleFade>
  );
};

export default DeleteCharacter;
