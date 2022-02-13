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
	INSERT_USERID = 'INSERT INTO users (username, license, steam, fivem, discord) VALUES (?, ?, ?, ?, ?)',
	SELECT_CHARACTERS = 'SELECT charid, firstname, lastname, gender, DATE_FORMAT(dateofbirth, "%d/%m/%Y") AS dateofbirth, phone_number, x, y, z, heading, DATE_FORMAT(last_played, "%d/%m/%Y") AS last_played FROM characters WHERE userid = ?',
	SELECT_CHARACTER = 'SELECT is_dead FROM characters WHERE charid = ?',
	INSERT_CHARACTER = 'INSERT INTO characters (userid, firstname, lastname, gender, dateofbirth) VALUES (?, ?, ?, ?, ?)',
	UPDATE_CHARACTER = 'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, inventory = ?, is_dead = ?, last_played = ? WHERE charid = ?',
	DELETE_CHARACTER = 'DELETE FROM characters WHERE charid = ?',
}

local CPlayer = {}
CPlayer.__index = CPlayer
CPlayer.__newindex = CPlayer

---@param x number
---@param y number
---@param z number
---@param heading number
---Sets a player's position and heading.
function CPlayer:setCoords(x, y, z, heading)
	local entity = GetPlayerPed(self.source)
	SetEntityCoords(entity, x, y, z)
	SetEntityHeading(entity, heading)
end

---@return vector4
---Returns a player's position and heading.
function CPlayer:getCoords()
	local entity = GetPlayerPed(self.source)
	return vec4(GetEntityCoords(entity), GetEntityHeading(entity))
end

local ox_inventory = exports.ox_inventory

---@param logout boolean
---Update the database with a player's current data.  
---If logout is true, triggering saveAccounts will also clear cached account data.
function CPlayer:save(logout)
	if self.charid then
		self:saveAccounts(logout)

		local inventory = json.encode(ox_inventory:Inventory(self.source)?.items or {})
		local coords = self:getCoords()

		MySQL.prepare.await(Query.UPDATE_CHARACTER, {
			coords.x,
			coords.y,
			coords.z,
			coords.w,
			inventory,
			self.isdead,
			os.date('%Y-%m-%d', os.time()),
			self.charid
		})
	end
end

---Send player data to ox_inventory.
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

---Send player data to npwd.
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

---@param group string
---@return number | table<string, number>
---Return the player's rank in the given group
function CPlayer:getGroup(group)
	return groups.get(self.source, group)
end

---@return number | table<string, number>
---Return a list of all groups and ranks for the player.
function CPlayer:getGroups()
	return groups.get(self.source)
end

---@param group string name of the group to adjust
---@param rank number
---Any rank under 1 will remove the group from the player.
function CPlayer:setGroup(group, rank)
	return groups.set(self.source, group, rank)
end

local accounts = server.accounts

---@param account? string return the amount in the given account
---@return number | table<string, number>
---Leave account undefined to get a table of all accounts and amounts
function CPlayer:getAccount(account)
	return accounts.get(self.source, account)
end

---@param account string name of the account to adjust
---@param amount number
function CPlayer:addAccount(account, amount)
	return accounts.add(self.source, account, amount)
end

---@param account string name of the account to adjust
---@param amount number
function CPlayer:removeAccount(account, amount)
	return accounts.remove(self.source, account, amount)
end

---@param account string name of the account to adjust
---@param amount number
function CPlayer:setAccount(account, amount)
	return accounts.set(self.source, account, amount)
end

function CPlayer:saveAccount(account)
	return accounts.save(self.source, account)
end

function CPlayer:saveAccounts(remove)
	return accounts.saveAll(self.source, remove)
end

local appearance = exports['fivem-appearance']

local function getData(source, characters)
	for i = 1, #characters do
		character = characters[i]
		character.groups = {}
		local size = 0

		for group in pairs(groups.load(false, character.charid)) do
			size += 1
			character.groups[size] = groups.list[group].label
		end

		character.appearance = appearance:load(source, character.charid)
	end

	return characters
end

---Save the player and trigger character selection.
function CPlayer:logout()
	npwd:unloadPlayer(self.source)
	self:save(true)
	rawset(self, 'charid', nil)
	rawset(self, 'characters', MySQL.query.await(Query.SELECT_CHARACTERS, { self.userid }) or {})
	self.characters = getData(self.source, self.characters)

	TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
end

local functions = server.functions

---@param source number
---Creates an instance of CPlayer.
function player.new(source)
	SetPlayerRoutingBucket(tostring(source), 60)
	source = tonumber(source)

	if not player(source) then

		local identifiers = functions.getIdentifiers(source)
		local userid = MySQL.prepare.await(Query.SELECT_USERID, { identifiers[server.PRIMARY_INDENTIFIER] })
		local username = GetPlayerName(source)

		if not userid then
			userid = MySQL.prepare.await(Query.INSERT_USERID, {
				username,
				identifiers.license or '',
				identifiers.steam or '',
				identifiers.fivem or '',
				identifiers.discord or '',
			})
		end

		local self = {
			source = source,
			userid = userid,
			username = username,
			characters = MySQL.query.await(Query.SELECT_CHARACTERS, { userid }) or {}
		}

		local state = Player(source).state

		state:set('userid', self.userid, true)
		state:set('username', self.username, true)

		for type, identifier in pairs(identifiers) do
			state:set(type, identifier, false)
		end

		self.characters = getData(source, self.characters)

		TriggerClientEvent('ox:selectCharacter', source, self.characters)
		return player + self
	end
end

---@param remove boolean
---Saves all data stored in players.list, and removes cached data if remove is true.
function player.saveAll(remove)
	local parameters = {}
	local size = 0
	local date = os.date('%Y-%m-%d', os.time())

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
				obj.isdead,
				date,
				obj.charid
			}
		end
	end

	if size > 0 then
		MySQL.prepare(Query.UPDATE_CHARACTER, parameters)
		accounts.saveAll(false, remove)
	end
end

---Insert new character data into the database.
function player.registerCharacter(userid, firstName, lastName, gender, date)
	return MySQL.insert.await(Query.INSERT_CHARACTER, { userid, firstName, lastName, gender, date })
end

---Remove character data from the database, and delete any known KVP.
function player.deleteCharacter(charid)
	appearance:save(charid)
	return MySQL.update(Query.DELETE_CHARACTER, { charid })
end

---@param obj table player
---@param character table
---Finalises player loading after they have selected a character.
function player.loaded(obj, character)
	setmetatable(obj, CPlayer)

	-- currently returns a single value; will require iteration for more data
	obj.isdead = MySQL.prepare.await(Query.SELECT_CHARACTER, { obj.charid }) == 1

	groups.load(obj.source, obj.charid)
	accounts.load(obj.source, obj.charid)
	appearance:load(obj.source, obj.charid)

	obj:loadInventory()
	obj:loadPhone()

	TriggerEvent('ox:playerLoaded', obj.source, obj.userid, obj.charid)
	TriggerClientEvent('ox:playerLoaded', obj.source, obj, character.x and vec4(character.x, character.y, character.z, character.heading))

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
