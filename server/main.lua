-- Disable population in routing bucket id 60
-- This routing bucket will be used during character selection
SetRoutingBucketPopulationEnabled(60, false)

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

local ox_groups = exports.ox_groups

AddEventHandler('onServerResourceStart', function(resource)
	if resource == 'ox_inventory' then
		for playerId, obj in pairs(player.list) do
			if obj.charid then
				obj.loadInventory(obj, ox_groups:getGroups(playerId, obj.charid))
			end
		end
	end
end)

local appearance = exports['fivem-appearance']

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
	local groups = ox_groups:getGroups(obj.source, character.charid)

	obj.charid = character.charid
	obj.firstname = characters.firstname
	obj.lastname = characters.lastname
	obj.gender = characters.gender
	obj.dob = characters.dateofbirth
	obj.characters = nil

	setmetatable(obj, player.class)

	TriggerClientEvent('ox:playerLoaded', obj.source, obj, vec4(character.x or -1380.316, character.y or 735.389, character.z or 182.967, character.heading or 357.165), appearance:load(obj.source, obj.charid))
	TriggerEvent('ox:playerLoaded', obj.source, obj.userid, obj.charid)
	obj:loadInventory(groups)

	SetPlayerRoutingBucket(tostring(obj.source), 0)
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
