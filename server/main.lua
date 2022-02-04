local player = server.player

RegisterNetEvent('ox:playerJoined', function()
	player.new(source)
end)

AddEventHandler('playerDropped', function()
	local obj = player(source)
	if obj?.charid then
		return player - obj
	end
end)

AddEventHandler('onServerResourceStart', function(resource)
	if resource == 'ox_inventory' then
		for _, obj in pairs(player.list) do
			if obj.charid then
				obj:loadInventory()
			end
		end
	elseif resource == 'npwd' then
		for _, obj in pairs(player.list) do
			if obj.charid then
				obj:loadPhone()
			end
		end
	end
end)

RegisterNetEvent('ox:selectCharacter', function(slot, data)
	local obj = player(source)
	local character

	if type(slot) == 'number' and string.len(slot) == 1 then
		character = obj.characters[slot]

		if not character then
			character = obj:registerCharacter(data)
		end
	else
		error(('ox:selectCharacter received invalid slot (should be number with length of 1). Received %s'):format(slot))
	end

	local characters = obj.characters[slot] or data

	obj.charid = character.charid
	obj.firstname = characters.firstname
	obj.lastname = characters.lastname
	obj.gender = characters.gender
	obj.dob = characters.dateofbirth
	obj.characters = nil
	player.loaded(obj, character)
end)

local vehicle = server.vehicle

AddEventHandler('onResourceStop', function(resource)
	if resource == 'ox_core' then
		player.saveAll()
		vehicle.saveAll()
	elseif resource == 'ox_inventory' then
		player.saveAll()
	end
end)

MySQL.ready(function()
	vehicle.load()
end)

RegisterCommand('logout', function(source)
	local obj = player(source)
	obj:logout()
end)
