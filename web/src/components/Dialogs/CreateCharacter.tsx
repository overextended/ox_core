import React from 'react';
import { Box, Button, Text, Flex, Input, Spacer, Select, ScaleFade } from '@chakra-ui/react';
import { theme } from '../../styles/theme';
import { fetchNui } from '../../utils/fetchNui';
import { useVisibility } from '../../providers/VisibilityProvider';
import { useCharacters } from '../../providers/CharactersProvider';
import { firstToUpper } from '../../utils/misc';
import DateInput from './DateInput';
import { useLocales } from '../../providers/LocaleProvider';

interface Props {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateCharacter: React.FC<Props> = (props: Props) => {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [gender, setGender] = React.useState('');
  const { locale } = useLocales();

  const characters = useCharacters();
  const frameVisibility = useVisibility();

  React.useEffect(() => {
    if (!props.visible) return;
    fetchNui('ox:setCharacter');
    setFirstName('');
    setLastName('');
    setDate('');
    setGender('');
  }, [props.visible]);

  const createCharacter = () => {
    if (firstName === '' || lastName === '' || date === '' || gender === '') return;
    fetchNui('ox:selectCharacter', { firstName, lastName, date, gender });
    frameVisibility.setVisible(false);
    props.setVisible(false);
    characters.setValue([
      ...characters.value,
      {
        firstname: firstName,
        lastname: lastName,
        dateofbirth: date,
        gender,
        location: '',
        groups: [''],
        phone_number: '',
        last_played: '',
        slot: characters.value.length - 1,
      },
    ]);
  };

  return (
    <ScaleFade in={props.visible} unmountOnExit>
      <Box
        bg={theme.colors.sideHover}
        w="2xs"
        h="fit-content"
        visibility={props.visible ? 'visible' : 'hidden'}
        fontFamily="Poppins"
      >
        <Flex justifyContent="center" alignItems="center" direction="column" h="100%" p={1}>
          <Text fontSize="lg">{locale.ui.create_char}</Text>
          <Input
            placeholder={locale.ui.firstname}
            value={firstName}
            onChange={(e) => setFirstName(firstToUpper(e.target.value))}
          ></Input>
          <Input
            placeholder={locale.ui.lastname}
            value={lastName}
            onChange={(e) => setLastName(firstToUpper(e.target.value))}
          ></Input>
          <DateInput setDate={setDate} />
          <Select
            placeholder={locale.ui.gender}
            borderRadius="none"
            value={gender}
            borderTop="none"
            borderLeft="none"
            borderRight="none"
            onChange={(e) => setGender(e.target.value)}
            sx={{
              ' > option': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            <option value="male">{locale.ui.male}</option>
            <option value="female">{locale.ui.female}</option>
            <option value="non-binary">{locale.ui.non_binary}</option>
          </Select>
          <Spacer />
          <Box mb={3} mt={3}>
            <Button
              mr={1}
              _hover={{ bg: 'green.500' }}
              _focus={{ bg: 'green.500' }}
              onClick={() => createCharacter()}
            >
              {locale.ui.confirm}
            </Button>
            <Button
              ml={1}
              _hover={{ bg: 'red.500' }}
              _focus={{ bg: 'red.500' }}
              onClick={() => props.setVisible(false)}
            >
              {locale.ui.cancel}
            </Button>
          </Box>
        </Flex>
      </Box>
    </ScaleFade>
  );
};

export default CreateCharacter;
