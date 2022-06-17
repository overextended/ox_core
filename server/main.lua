RegisterNetEvent('ox:playerJoined', function()
	Player.new(source)
end)

AddEventHandler('playerDropped', function()
	local player = Player(source)

	if player then
		return Player - player
	end
end)

AddEventHandler('onServerResourceStart', function(resource)
	if resource == 'ox_inventory' then
		for _, player in pairs(Player.list) do
			if not player.characters then
				player.loadInventory()
			end
		end
	elseif resource == 'npwd' then
		for _, player in pairs(Player.list) do
			if not player.characters then
				player.loadPhone()
			end
		end
	end
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

AddEventHandler('onResourceStop', function(resource)
	if resource == 'ox_core' then
		Player.saveAll()
	elseif resource == 'ox_inventory' then
		Player.saveAll()
	end
end)

RegisterCommand('logout', function(source)
	Player(source).logout()
end)
