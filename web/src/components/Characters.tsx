import { Box, Text, Divider, Flex } from "@chakra-ui/react";
import { useNuiEvent } from "../hooks/useNuiEvent";
import { debugData } from "../utils/debugData";
import React from "react";

interface Character {
	firstName: string;
	lastName: string;
	location: string;
	gender: string;
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
				gender: "male",
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
			gender: "",
		},
	]);

	useNuiEvent("sendCharacters", (data: Character[]) => {
		setCharacters(data);
	});

	return (
		<>
			{characters.map((character: Character, index) => (
				<React.Fragment key={`character-${index}`}>
					<Flex p={3} w="100%" alignItems="center">
						<Text
							color={
								character.gender === "male" ? "blue" : "pink"
							}
							fontSize="3xl"
							w="15%"
						>
							{character.gender === "male" ? "♂️" : "♀️"}
						</Text>
						<Box justifySelf="center" alignItems="center">
							<Text fontSize="2xl">{`${character.firstName} ${character.lastName}`}</Text>
							<Text fontSize="sm">{`Location: ${character.location}`}</Text>
							<Text fontSize="sm">Last Played: 31/01/2022</Text>
						</Box>
					</Flex>
					<Divider />
				</React.Fragment>
			))}
		</>
	);
};

export default Characters;
