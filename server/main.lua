RegisterNetEvent('ox:playerJoined', function()
	player.new(source)
end)

AddEventHandler('playerDropped', function()
	local obj = player(source)
	if obj then
		return player - obj
	end
end)

AddEventHandler('onServerResourceStart', function(resource)
	if resource == 'ox_inventory' then
		for _, obj in pairs(player.list) do
			if not obj.characters then
				obj:loadInventory()
			end
		end
	elseif resource == 'npwd' then
		for _, obj in pairs(player.list) do
			if not obj.characters then
				obj:loadPhone()
			end
		end
	end
end)

RegisterNetEvent('ox:selectCharacter', function(data)
	local obj = player(source)
	local character

	if type(data) == 'table' then
		local phoneNumber = exports.npwd:generatePhoneNumber()
		character = {
			firstname = data.firstName,
			lastname = data.lastName,
			gender = data.gender,
			dateofbirth = data.date,
			phone_number = phoneNumber,
			charid = player.registerCharacter(obj.userid, data.firstName, data.lastName, data.gender, data.date, phoneNumber)
		}
	elseif type(data) == 'number' and data < 10 then
		character = obj.characters[data]
	else
		error(('ox:selectCharacter received invalid slot. Received %s'):format(data))
	end

	obj.characters = nil
	obj.charid = character.charid
	obj.firstname = character.firstname
	obj.lastname = character.lastname
	obj.gender = character.gender
	obj.dateofbirth = character.dateofbirth
	obj.phone_number = character.phone_number

	player.loaded(obj, character)
end)

RegisterNetEvent('ox:deleteCharacter', function(slot)
	if type(slot) == 'number' and slot < 11 then
		slot += 1
		local obj = player(source)
		local charid = obj.characters[slot]?.charid

		if charid then
			TriggerEvent('ox:characterDeleted', obj.source, obj.userid, charid)
			player.deleteCharacter(charid)
			return table.remove(obj.characters, slot)
		end
	end

	error(('ox:deleteCharacter received invalid slot. Received %s'):format(slot))
end)

RegisterNetEvent('ox:playerDeath', function(dead)
	local obj = player(source)
	obj.dead = dead
end)

AddEventHandler('onResourceStop', function(resource)
	if resource == 'ox_core' then
		player.saveAll()
	elseif resource == 'ox_inventory' then
		player.saveAll()
	end
end)

RegisterCommand('logout', function(source)
	local obj = player(source)
	obj:logout()
end)
