import { Box, Text, Divider } from "@chakra-ui/react";
import { useNuiEvent } from "../hooks/useNuiEvent";
import React from "react";
import { debugData } from "../utils/debugData";

interface Character {
	firstName: string;
	lastName: string;
	location: string;
}

debugData([
	{
		action: "sendCharacters",
		data: [
			{
				firstName: "Peter",
				lastName: "Linden",
				location: "Galaxy far far away",
			},
			{
				firstName: "Luke",
				lastName: "Lindensson",
				location: "Pillbox Hill",
			},
		],
	},
]);

const Characters: React.FC = () => {
	const [characters, setCharacters] = React.useState<Character[]>([
		{
			firstName: "",
			lastName: "",
			location: "",
		},
	]);

	useNuiEvent("sendCharacters", (data: Character[]) => {
		setCharacters(data);
	});

	return (
		<>
			{characters.map((character: Character, index) => (
				<React.Fragment key={`character-${index}`}>
					<Box p={3}>
						<Text fontSize="2xl">{`${character.firstName} ${character.lastName}`}</Text>
						<Text fontSize="sm">{`Location: ${character.location}`}</Text>
						<Text fontSize="sm">Last Played: 31/01/2022</Text>
					</Box>
					<Divider />
				</React.Fragment>
			))}
		</>
	);
};

export default Characters;
