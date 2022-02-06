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

RegisterNetEvent('ox:selectCharacter', function(data)
	local obj = player(source)
	local character

	if type(data) == 'table' then
		character = data
		character.charid = player.registerCharacter(obj.userid, data.firstName, data.lastName, data.gender, data.date)
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
	obj.dob = character.dateofbirth
	player.loaded(obj, character)
end)

RegisterNetEvent('ox:deleteCharacter', function(slot)
	if type(slot) == 'number' and slot < 11 then
		slot += 1
		local obj = player(source)
		local charid = obj.characters[slot]?.charid

		if charid then
			player.deleteCharacter(charid)
			return table.remove(obj.characters, slot)
		end
	end

	error(('ox:deleteCharacter received invalid slot. Received %s'):format(slot))
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
