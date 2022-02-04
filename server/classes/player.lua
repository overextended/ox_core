-----------------------------------------------------------------------------------------------
--	Module
-----------------------------------------------------------------------------------------------

local player = {
	count = 0,
	list = {},
	class = {},
}

setmetatable(player, {
	__add = function(self, obj)
		self.list[obj.source] = obj
		self.count += 1
	end,

	__sub = function(self, obj)
		obj:save()
		self.list[obj.source] = nil
		self.count -= 1
	end,

	__call = function(self, source)
		return self.list[source]
	end
})

local Query = {
	SELECT_USERID = ('SELECT userid FROM users WHERE %s = ?'):format(server.PRIMARY_INDENTIFIER),
	INSERT_USERID = 'INSERT INTO users (license, steam, fivem, discord, ip) VALUES (?, ?, ?, ?, ?)',
	SELECT_CHARACTERS = 'SELECT charid, firstname, lastname, gender, dateofbirth, x, y, z, heading FROM characters WHERE userid = ?',
	INSERT_CHARACTER = 'INSERT INTO characters (userid, firstname, lastname, gender, dateofbirth) VALUES (?, ?, ?, ?, ?)',
	UPDATE_CHARACTER = 'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, inventory = ? WHERE charid = ?',
}

local CPlayer = player.class
CPlayer.__index = CPlayer
CPlayer.__newindex = CPlayer

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
	if self.charid then
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

function CPlayer:registerCharacter(data)
	return { charid = MySQL.insert.await(Query.INSERT_CHARACTER, {
			self.userid,
			data.firstname,
			data.lastname,
			data.gender,
			data.dateofbirth
		})
	}
end

function CPlayer:loadInventory(groups)
	ox_inventory:setPlayerInventory({
		source = self.source,
		identifier = self.charid,
		name = ('%s %s'):format(self.firstname, self.lastname),
		sex = self.gender,
		dateofbirth = self.dob,
		groups = groups,
	})
end

local groups = server.groups

function CPlayer:getGroups()
	return groups.getGroups(self.source)
end

function CPlayer:setGroup(group, rank)
	return groups.setGroup(self.source, group, rank)
end

function CPlayer:logout()
	self:save()
	rawset(self, 'charid', nil)
	rawset(self, 'characters', MySQL.query.await(Query.SELECT_CHARACTERS, { self.userid }) or {})
	TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
end

local functions = server.functions

function player.new(source)
	SetPlayerRoutingBucket(tostring(source), 60)
	source = tonumber(source)

	if not player(source) then

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

		TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
		return player + self
	end
end

function player.saveAll()
	local parameters = {}
	local size = 0

	for playerId, obj in pairs(player.list) do
		if obj.charid then
			size += 1
			local inventory = json.encode(ox_inventory:Inventory(playerId)?.items or {})
			local entity = GetPlayerPed(playerId)
			local coords = GetEntityCoords(entity)

			parameters[size] = {
				coords.x,
				coords.y,
				coords.z,
				GetEntityHeading(entity),
				inventory,
				obj.charid
			}
		end
	end

	if size > 0 then
		MySQL.prepare(Query.UPDATE_CHARACTER, parameters)
	end
end

-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

for name, method in pairs(CPlayer) do
	if type(method) == 'function' and name ~= '__call' then
		exports('player_'..name, method)
		print('registered export:', 'player_'..name)
	end
end

exports('getPlayer', function(source)
	return player.list[source]
end)

exports('getPlayers', function()
	local size = 0
	local players = {}

	for _, v in pairs(player.list) do
		if v.charid then
			size += 1
			players[size] = v
		end
	end

	return players
end)

server.player = player
