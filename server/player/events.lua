AddEventHandler('playerDropped', function()
	local player = Player(source)

	if player then
		return Player - player
	end
end)

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

RegisterNetEvent('ox:playerJoined', function()
	Player.new(source)
end)

AddEventHandler('playerConnecting', function(_, _, deferrals)
	deferrals.defer()

	local identifier = Ox.GetIdentifiers(source)?[Server.PRIMARY_IDENTIFIER]

	if not identifier then
		return deferrals.done(('Unable to register an account, unable to determine "%s" identifier.'):format(Server.PRIMARY_IDENTIFIER))
	end

	deferrals.done()
end)


RegisterNetEvent('ox:selectCharacter', function(data)
	local player = Player(source)
	local character

	if type(data) == 'table' then
		local phoneNumber = exports.npwd:generatePhoneNumber()
		character = {
			firstname = data.firstName,
			lastname = data.lastName,
			gender = data.gender,
			dateofbirth = data.date,
			phone_number = phoneNumber,
			charid = Player.registerCharacter(player.userid, data.firstName, data.lastName, data.gender, data.date, phoneNumber)
		}
	elseif type(data) == 'number' and data < 10 then
		character = player.characters[data]
	else
		error(('ox:selectCharacter received invalid slot. Received %s'):format(data))
	end

	player.characters = nil
	player.charid = character.charid
	player.firstname = character.firstname
	player.lastname = character.lastname
	player.gender = character.gender
	player.dateofbirth = character.dateofbirth
	player.phone_number = character.phone_number

	Player.loaded(player, character)
end)

RegisterNetEvent('ox:deleteCharacter', function(slot)
	if type(slot) == 'number' and slot < 11 then
		slot += 1
		local player = Player(source)
		local charid = player.characters[slot]?.charid

		if charid then
			TriggerEvent('ox:characterDeleted', player.source, player.userid, charid)
			Player.deleteCharacter(charid)
			return table.remove(player.characters, slot)
		end
	end

	error(('ox:deleteCharacter received invalid slot. Received %s'):format(slot))
end)

RegisterNetEvent('ox:playerDeath', function(dead)
	Player(source).dead = dead
end)
