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

	if not data.slot then
		character = player.registerCharacter(obj.userid, data.firstName, data.lastName, data.gender, data.date)
	elseif type(data.slot) == 'number' and string.len(data.slot) == 1 then
		character = obj.characters[data.slot]
		data = obj.characters[data.slot]
	else
		error(('ox:selectCharacter received invalid slot (should be number with length of 1). Received %s'):format(data.slot))
	end

	obj.characters = nil
	obj.charid = character.charid
	obj.firstname = data.firstname
	obj.lastname = data.lastname
	obj.gender = data.gender
	obj.dob = data.dateofbirth
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
