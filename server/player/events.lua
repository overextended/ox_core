AddEventHandler('playerEnteredScope', function(data)
	local source = tonumber(data['for'])
	local target = tonumber(data.player)
	local player = Player(source)

	local inScope = player.get('inScope')
	inScope[target] = true
end)

AddEventHandler('playerLeftScope', function(data)
	local source = tonumber(data['for'])
	local target = tonumber(data.player)
	local player = Player(source)

	local inScope = player.get('inScope')
	inScope[target] = nil
end)

AddEventHandler('playerConnecting', function(_, _, deferrals)
	deferrals.defer()
	local identifier = Ox.GetIdentifiers(source)?[Server.PRIMARY_IDENTIFIER]

	if not identifier then
		return deferrals.done(('Unable to register an account, unable to determine "%s" identifier.'):format(Server.PRIMARY_IDENTIFIER))
	end

	deferrals.done()
end)

