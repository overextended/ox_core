local functions = server.functions


-----------------------------------------------------------------------------------------------
--	Module
-----------------------------------------------------------------------------------------------

local CPlayer = {
	count = 0,
	list = {},
	new = true,
}

local Query = {
	SELECT_USERID = ('SELECT userid FROM users WHERE %s = ?'):format(server.PRIMARY_INDENTIFIER),
	INSERT_USERID = 'INSERT INTO users (license, steam, fivem, discord, ip) VALUES (?, ?, ?, ?, ?)',
	SELECT_CHARACTERS = 'SELECT charid, firstname, lastname, gender, dateofbirth, x, y, z, heading FROM characters WHERE userid = ?',
	INSERT_CHARACTER = 'INSERT INTO characters (userid, firstname, lastname, gender, dateofbirth) VALUES (?, ?, ?, ?, ?)',
	UPDATE_CHARACTER = 'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, inventory = ? WHERE charid = ?',
}


-----------------------------------------------------------------------------------------------
--	Class
-----------------------------------------------------------------------------------------------

local Class = {}
Class.__index = Class
Class.__newindex = Class
Class.__call = function(self, source)
	return self.list[source]
end

setmetatable(CPlayer, Class)

function CPlayer:setCoords(x, y, z, heading)
	local entity = GetPlayerPed(self.source)
	SetEntityCoords(entity, x, y, z)
	SetEntityHeading(entity, heading)
end

function CPlayer:getCoords()
	return GetEntityCoords(GetPlayerPed(self.source))
end

local ox_inventory = exports.ox_inventory

function CPlayer:save()
	if not self.characters then
		local inventory = json.encode(ox_inventory:Inventory(self.source)?.items or {})
		local entity = GetPlayerPed(self.source)
		local coords = GetEntityCoords(entity)

		MySQL.prepare(Query.UPDATE_CHARACTER, {
			coords.x,
			coords.y,
			coords.z,
			GetEntityHeading(entity),
			inventory,
			self.charid
		})
	end
end

function CPlayer.new(source)
	SetPlayerRoutingBucket(tostring(source), 60)
	source = tonumber(source)

	if not CPlayer.list[source] then

		local identifiers = functions.getIdentifiers(source)
		local userid = MySQL.prepare.await(Query.SELECT_USERID, { identifiers.ip })

		if not userid then
			userid = MySQL.prepare.await(Query.INSERT_USERID, {
				identifiers.license or '',
				identifiers.steam or '',
				identifiers.fivem or '',
				identifiers.discord or '',
				identifiers.ip or '',
			})
		end

		local self = {
			source = source,
			userid = userid,
			username = GetPlayerName(source),
			characters = MySQL.query.await(Query.SELECT_CHARACTERS, { userid }) or {}
		}

		local state = Player(self.source).state

		state:set('userid', self.userid, true)
		state:set('username', self.username, true)

		for type, identifier in pairs(identifiers) do
			state:set(type, identifier, false)
		end

		CPlayer.list[source] = self
		CPlayer.count += 1

		TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
	end
end


-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

for name, method in pairs(Class) do
	if type(method) == 'function' and name ~= '__call' then
		exports('player_'..name, method)
	end
end

exports('getPlayer', function(source)
	return CPlayer.list[source]
end)

exports('getPlayers', function()
	local size = 0
	local players = {}

	for _, v in pairs(CPlayer.list) do
		if v.charid then
			size += 1
			players[size] = v
		end
	end

	return players
end)

server.CPlayer = CPlayer


-----------------------------------------------------------------------------------------------
--	Events
-----------------------------------------------------------------------------------------------

RegisterNetEvent('ox:playerJoined', function()
	CPlayer.new(source)
end)

AddEventHandler('playerDropped', function()
	local oxPlayer = CPlayer(source)
	if oxPlayer?.charid then
		oxPlayer:save()
		CPlayer.list[source] = nil
		CPlayer.count -= 1
	end
end)

AddEventHandler('onResourceStop', function(resource)
	if resource == 'ox_core' or resource == 'ox_inventory' then
		for _, oxPlayer in pairs(CPlayer.list) do
			if oxPlayer.charid then
				oxPlayer:save()
			end
		end
	end
end)

local ox_groups = exports.ox_groups

AddEventHandler('onServerResourceStart', function(resource)
	if resource == 'ox_inventory' then
		for _, oxPlayer in pairs(CPlayer.list) do
			if oxPlayer.charid then
				ox_inventory:setPlayerInventory({
					source = oxPlayer.source,
					identifier = oxPlayer.charid,
					name = ('%s %s'):format(oxPlayer.firstname, oxPlayer.lastname),
					sex = oxPlayer.gender,
					dateofbirth = oxPlayer.dob,
					groups = ox_groups:getGroups(oxPlayer.source, oxPlayer.charid),
				})
			end
		end
	end
end)

local appearance = exports['fivem-appearance']

RegisterNetEvent('ox:selectCharacter', function(slot, data)
	local oxPlayer = CPlayer(source)
	local character

	if type(slot) == 'number' and string.len(slot) == 1 then
		character = oxPlayer.characters[slot]

		if not character then
			character = { charid = MySQL.insert.await(Query.INSERT_CHARACTER, {oxPlayer.userid, data.firstname, data.lastname, data.gender, data.dateofbirth}) }
		end
	else
		error(('ox:selectCharacter received invalid slot (should be number with length of 1). Received %s'):format(slot))
	end

	local characters = oxPlayer.characters[slot] or data
	local groups = ox_groups:getGroups(oxPlayer.source, character.charid)

	oxPlayer.charid = character.charid
	oxPlayer.firstname = characters.firstname
	oxPlayer.lastname = characters.lastname
	oxPlayer.gender = characters.gender
	oxPlayer.dob = characters.dateofbirth
	oxPlayer.characters = nil

	setmetatable(oxPlayer, Class)

	TriggerClientEvent('ox:playerLoaded', oxPlayer.source, oxPlayer, vec4(character.x, character.y, character.z, character.heading), appearance:load(oxPlayer.source, oxPlayer.charid))
	TriggerEvent('ox:playerLoaded', oxPlayer.source, oxPlayer.userid, oxPlayer.charid)

	ox_inventory:setPlayerInventory({
		 source = oxPlayer.source,
		 identifier = oxPlayer.charid,
		 name = ('%s %s'):format(oxPlayer.firstname, oxPlayer.lastname),
		 sex = oxPlayer.gender,
		 dateofbirth = oxPlayer.dob,
		 groups = groups,
	})

	SetPlayerRoutingBucket(tostring(oxPlayer.source), 0)
end)

RegisterCommand('logout', function(source)
	local oxPlayer = CPlayer(source)

	oxPlayer:save()
	rawset(oxPlayer, 'charid', nil)
	rawset(oxPlayer, 'characters', MySQL.query.await(Query.SELECT_CHARACTERS, { oxPlayer.userid }) or {})

	TriggerClientEvent('ox:selectCharacter', oxPlayer.source, oxPlayer.characters)
end)
