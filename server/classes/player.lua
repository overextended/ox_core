-----------------------------------------------------------------------------------------------
--	Module
-----------------------------------------------------------------------------------------------

local player = {
	count = 0,
	list = {},
}

setmetatable(player, {
	__add = function(self, obj)
		self.list[obj.source] = obj
		self.count += 1
	end,

	__sub = function(self, obj)
		obj:save(true)
		self.list[obj.source] = nil
		self.count -= 1
	end,

	__call = function(self, source)
		return self.list[source]
	end
})

local Query = {
	SELECT_USERID = ('SELECT userid FROM users WHERE %s = ?'):format(server.PRIMARY_INDENTIFIER),
	INSERT_USERID = 'INSERT INTO users (license, steam, fivem, discord) VALUES (?, ?, ?, ?, ?)',
	SELECT_CHARACTERS = 'SELECT charid, firstname, lastname, gender, dateofbirth, x, y, z, heading FROM characters WHERE userid = ?',
	INSERT_CHARACTER = 'INSERT INTO characters (userid, firstname, lastname, gender, dateofbirth) VALUES (?, ?, ?, ?, ?)',
	UPDATE_CHARACTER = 'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, inventory = ? WHERE charid = ?',
}

local CPlayer = {}
CPlayer.__index = CPlayer
CPlayer.__newindex = CPlayer

function CPlayer:setCoords(x, y, z, heading)
	local entity = GetPlayerPed(self.source)
	SetEntityCoords(entity, x, y, z)
	SetEntityHeading(entity, heading)
end

function CPlayer:getEntity()
	return GetPlayerPed(self.source)
end

function CPlayer:getCoords()
	local entity = CPlayer.getEntity(self)
	return vec4(GetEntityCoords(entity), GetEntityHeading(entity))
end

local ox_inventory = exports.ox_inventory

function CPlayer:save(logout)
	if self.charid then
		local inventory = json.encode(ox_inventory:Inventory(self.source)?.items or {})
		local coords = self:getCoords()

		MySQL.prepare(Query.UPDATE_CHARACTER, {
			coords.x,
			coords.y,
			coords.z,
			coords.w,
			inventory,
			self.charid
		})

		self:saveAccounts(logout)
	end
end

function CPlayer:loadInventory()
	ox_inventory:setPlayerInventory({
		source = self.source,
		identifier = self.charid,
		name = ('%s %s'):format(self.firstname, self.lastname),
		sex = self.gender,
		dateofbirth = self.dob,
		groups = self:getGroups(),
	})
end

local npwd = exports.npwd

function CPlayer:loadPhone()
	npwd:newPlayer({
		source = self.source,
		identifier = self.charid,
		phoneNumber = self.phoneNumber,
		firstname = self.firstName,
		lastname = self.lastName
	})
end

local groups = server.groups

function CPlayer:getGroups()
	return groups.getGroups(self.source, self.charid)
end

function CPlayer:setGroup(group, rank)
	return groups.setGroup(self.source, group, rank)
end

local accounts = server.accounts

function CPlayer:getAccount(account)
	return accounts.get(self.source, account)
end

function CPlayer:addAccount(account, amount)
	return accounts.add(self.source, account, amount)
end

function CPlayer:removeAccount(account, amount)
	return accounts.remove(self.source, account, amount)
end

function CPlayer:setAccount(account, amount)
	return accounts.set(self.source, account, amount)
end

function CPlayer:saveAccount(account)
	return accounts.save(self.source, account)
end

function CPlayer:saveAccounts(remove)
	return accounts.saveAll(self.source, remove)
end

function CPlayer:logout()
	npwd:unloadPlayer(self.source)
	self:save(true)
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
		local userid = MySQL.prepare.await(Query.SELECT_USERID, { identifiers[server.PRIMARY_INDENTIFIER] })

		if not userid then
			userid = MySQL.prepare.await(Query.INSERT_USERID, {
				identifiers.license or '',
				identifiers.steam or '',
				identifiers.fivem or '',
				identifiers.discord or '',
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

function player.saveAll(remove)
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
		accounts.saveAll(false, remove)
	end
end

function player.registerCharacter(userid, firstName, lastName, gender, date)
	return { charid = MySQL.insert.await(Query.INSERT_CHARACTER, { userid, firstName, lastName, gender, date }) }
end

local appearance = exports['fivem-appearance']

function player.loaded(obj, character)
	setmetatable(obj, CPlayer)

	accounts.load(obj.source, obj.charid)
	obj:loadInventory()
	obj:loadPhone()

	TriggerEvent('ox:playerLoaded', obj.source, obj.userid, obj.charid)
	TriggerClientEvent('ox:playerLoaded', obj.source, obj, vec4(character.x or -1380.316, character.y or 735.389, character.z or 182.967, character.heading or 357.165), appearance:load(obj.source, obj.charid))

	SetPlayerRoutingBucket(tostring(obj.source), 0)
end

-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

for name, method in pairs(CPlayer) do
	if type(method) == 'function' and name ~= '__call' then
		exports('player_'..name, method)
		-- print('registered export:', 'player_'..name)
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
