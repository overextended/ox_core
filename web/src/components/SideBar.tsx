import React from "react";
import { Box, Text, Flex, Spacer, Divider } from "@chakra-ui/react";

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
					<Box>
						<Text fontSize="2xl">Peter Linden</Text>
						<Text fontSize="sm">Location: Pillbox Hill</Text>
						<Text fontSize="sm">Last Played: 31/01/2022</Text>
					</Box>
					<Divider />
				</Flex>
				<Spacer />
				<Text
					fontSize="xl"
					align="center"
					paddingBottom={5}
					fontFamily="Poppins"
				>
					Create new character
				</Text>
			</Flex>
		</Box>
	);
};

export default SideBar;
