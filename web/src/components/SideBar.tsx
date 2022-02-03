import React from "react";
import { Box, Text, Flex, Spacer, Icon } from "@chakra-ui/react";
import Characters from "./Characters";
import { BsFillPersonPlusFill } from "react-icons/bs";

const SideBar: React.FC = () => {
	return (
		<Box
			position="fixed"
			left="0"
			w="30vh"
			h="100vh"
			// bg="gray.800"
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
				<Flex
					fontSize="xl"
					alignContent="center"
					justifyContent="space-evenly"
					alignItems="center"
					mb={5}
					fontFamily="Poppins"
				>
					<Icon as={BsFillPersonPlusFill} verticalAlign="middle" />
					<Text>Create new character</Text>
				</Flex>
			</Flex>
		</Box>
	);
};

export default SideBar;
