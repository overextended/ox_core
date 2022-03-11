local functions = {}

function functions.getIdentifiers(source)
	local identifiers = {}

	for i = 0, GetNumPlayerIdentifiers(source)-1 do
		local prefix, identifier = string.strsplit(':', GetPlayerIdentifier(source, i))
		identifiers[prefix] = identifier
	end

	return identifiers
end

function functions.firstToUpper(str)
	return str:gsub("^%l", string.upper)
end

server.functions = functions
