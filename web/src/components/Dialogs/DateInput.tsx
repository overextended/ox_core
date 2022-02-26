import React from 'react';
import { HStack, NumberInput, NumberInputField } from '@chakra-ui/react';

interface Props {
  setDate: React.Dispatch<React.SetStateAction<string>>;
}

const inputStyle = {
  borderRadius: 'none',
  borderLeft: 'none',
  borderTop: 'none',
  borderRight: 'none',
  padding: 0,
  textAlign: 'center',
};

const DateInput: React.FC<Props> = ({ setDate }) => {
  const [maxDay, setMaxDay] = React.useState(31);
  const [day, setDay] = React.useState('');
  const [month, setMonth] = React.useState('');
  const [year, setYear] = React.useState('');

  React.useEffect(() => {
    switch (month) {
      case '2':
        setMaxDay(28);
        Number(day) > 28 && setDay('28');
        return;
      case '4':
      case '6':
      case '8':
      case '10':
      case '12':
        setMaxDay(30);
        Number(day) > 30 && setDay('30');
        return;
      default:
        setMaxDay(31);
        return;
    }
  }, [month, day]);

  React.useEffect(() => {
    setDate(`${year}-${month}-${day}`);
  }, [day, month, year, setDate]);

  return (
    <HStack>
      <NumberInput min={1} max={maxDay} value={day} onChange={(value) => setDay(value)}>
        <NumberInputField placeholder="DD" sx={inputStyle} />
      </NumberInput>
      <NumberInput min={1} max={12} value={month} onChange={(value) => setMonth(value)}>
        <NumberInputField placeholder="MM" sx={inputStyle} />
      </NumberInput>
      <NumberInput
        min={1900}
        max={new Date().getFullYear()}
        value={year}
        onChange={(value) => setYear(value)}
        p={0}
      >
        <NumberInputField placeholder="YYYY" sx={inputStyle} />
      </NumberInput>
    </HStack>
  );
};

export default DateInput;
