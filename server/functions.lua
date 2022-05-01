function Ox.GetIdentifiers(source)
	local identifiers = {}

	for i = 0, GetNumPlayerIdentifiers(source) - 1 do
		local prefix, identifier = string.strsplit(':', GetPlayerIdentifier(source, i))
		identifiers[prefix] = identifier
	end

	return identifiers
end
