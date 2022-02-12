import React from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
  Input,
  Spacer,
  Select,
  ScaleFade,
  useToast,
} from '@chakra-ui/react';
import { theme } from '../../styles/theme';
import { fetchNui } from '../../utils/fetchNui';
import { useVisibility } from '../../providers/VisibilityProvider';
import { useCharacters } from '../../providers/CharactersProvider';
import { firstToUpper } from '../../utils/misc';

interface Props {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateCharacter: React.FC<Props> = (props: Props) => {
  // Todo: Reset fields on dialog open
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [currentDate, setCurrentDate] = React.useState('');

  const characters = useCharacters();
  const frameVisibility = useVisibility();
  const toast = useToast();

  React.useEffect(() => {
    props.visible && fetchNui('ox:setCharacter');
  }, [props.visible]);

  React.useEffect(() => {
    const date = new Date();
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth() + 1;
    const dateDay = date.getDate();
    setCurrentDate(`${dateYear}-0${dateMonth}-0${dateDay}`);
  }, []);

  const createCharacter = () => {
    if (firstName === '' || lastName === '' || date === '' || gender === '') return;
    const userDate = new Date(date).getTime();
    const today = new Date(currentDate).getTime();
    if (userDate > today || userDate < new Date('1900-01-01').getTime())
      return toast({
        title: 'Incorrect date',
        description: 'Please enter a valid year',
        status: 'error',
      });
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
        slot: characters.value.length - 1,
      },
    ]);
  };

  return (
    <ScaleFade in={props.visible} unmountOnExit>
      <Box
        bg={theme.colors.sideHover}
        w="100%"
        h="fit-content"
        visibility={props.visible ? 'visible' : 'hidden'}
        fontFamily="Poppins"
      >
        <Flex justifyContent="center" alignItems="center" direction="column" h="100%" p={1}>
          <Text fontSize="lg">Create Character</Text>
          <Input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(firstToUpper(e.target.value))}
          ></Input>
          <Input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(firstToUpper(e.target.value))}
          ></Input>
          <Input
            placeholder="DoB"
            type="date"
            min="1900-01-01"
            max={currentDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          ></Input>
          <Select
            placeholder="Gender"
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
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-Binary</option>
          </Select>
          <Spacer />
          <Box mb={3} mt={3}>
            <Button mr={1} _hover={{ bg: 'green.500' }} onClick={() => createCharacter()}>
              Confirm
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

export default CreateCharacter;
