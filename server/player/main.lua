local Query = {
	SELECT_USERID = ('SELECT userid FROM users WHERE %s = ?'):format(server.PRIMARY_IDENTIFIER),
	INSERT_USERID = 'INSERT INTO users (username, license, steam, fivem, discord) VALUES (?, ?, ?, ?, ?)',
	SELECT_CHARACTERS = 'SELECT charid, firstname, lastname, gender, DATE_FORMAT(dateofbirth, "%d/%m/%Y") AS dateofbirth, phone_number, x, y, z, heading, DATE_FORMAT(last_played, "%d/%m/%Y") AS last_played FROM characters WHERE userid = ?',
	SELECT_CHARACTER = 'SELECT is_dead FROM characters WHERE charid = ?',
	INSERT_CHARACTER = 'INSERT INTO characters (userid, firstname, lastname, gender, dateofbirth, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
	UPDATE_CHARACTER = 'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, inventory = ?, is_dead = ?, last_played = ? WHERE charid = ?',
	DELETE_CHARACTER = 'DELETE FROM characters WHERE charid = ?',
	SELECT_USER_GROUPS = 'SELECT name, grade FROM user_groups WHERE charid = ?',
}

CfxPlayer = Player
local CPlayer = {}
local playerData = {}

function CPlayer:__index(index)
	local value = playerData[self.source][index]

	if value then
		return value
	end

	local method = CPlayer[index]

	return method and function(...)
		return method(self, ...)
	end
end

function CPlayer:getState()
	return CfxPlayer(self.source).state
end

---@return vector4
---Returns a player's position and heading.
function CPlayer:getCoords()
	local entity = GetPlayerPed(self.source)
	return vec4(GetEntityCoords(entity), GetEntityHeading(entity))
end

function CPlayer:loadGroups()
	local results = MySQL.prepare.await(Query.SELECT_USER_GROUPS, { self.charid })
	self.groups = {}

	if results then
		if not results[1] then results = { results } end

		for i = 1, #results do
			local data = results[i]
			local group = Ox.GetGroup(data.name)

			if group then
				group:add(self, data.grade)
			end
		end
	end
end

local ox_inventory = exports.ox_inventory

function CPlayer:loadInventory()
	ox_inventory:setPlayerInventory({
		source = self.source,
		identifier = self.charid,
		name = ('%s %s'):format(self.firstname, self.lastname),
		sex = self.gender,
		dateofbirth = self.dob,
		groups = self.groups,
	})
end

---@param logout boolean
---Update the database with a player's current data.
---If logout is true, triggering saveAccounts will also clear cached account data.
function CPlayer:save(logout)
	if self.charid then
		for name, grade in pairs(self.groups) do
			local group = Ox.GetGroup(name)

			if group then
				group:remove(self, grade)
			end
		end

		self.saveAccounts(logout)

		local coords = self.getCoords()
		local inventory = json.encode(ox_inventory:Inventory(self.source)?.items or {})

		MySQL.prepare.await(Query.UPDATE_CHARACTER, {
			coords.x,
			coords.y,
			coords.z,
			coords.w,
			inventory,
			self.dead,
			os.date('%Y-%m-%d', os.time()),
			self.charid
		})
	end
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

local appearance = exports.ox_appearance

local function selectCharacters(source, userid)
	local characters = MySQL.query.await(Query.SELECT_CHARACTERS, { userid }) or {}

	for i = 1, #characters do
		character = characters[i]
		character.groups = {}
		-- local size = 0

		-- for group in pairs(groups.load(false, character.charid)) do
		-- 	local data = groups.list[group]
		-- 	if data then
		-- 		size += 1
		-- 		character.groups[size] = data.label
		-- 	end
		-- end

		character.appearance = appearance:load(source, character.charid)
	end

	return characters
end

local npwd = exports.npwd

function CPlayer:loadPhone()
	npwd:newPlayer({
		source = self.source,
		identifier = self.charid,
		phoneNumber = self.phone_number,
		firstname = self.firstname,
		lastname = self.lastname
	})
end

---Save the player and trigger character selection.
function CPlayer:logout()
	npwd:unloadPlayer(self.source)
	self.save(true)
	self.charid = nil
	self.characters = selectCharacters(self.source, self.userid)

	TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
end

function CPlayer:get(index)
	local data = playerData[self.source]
	return data[index] or data
end

function CPlayer:set(index, value)
	playerData[self.source][index] = value
end

function CPlayer:setGroup(name, grade)
	Ox.GetGroup(name):set(self, grade)
end

function CPlayer:getGroup(name)
	return self.groups[name]
end

function CPlayer:isPlayerInScope(target)
	return self.get('inScope')[target]
end

function CPlayer:triggerScopedEvent(eventName, ...)
	local inScope = self.get('inScope')

	for id in pairs(inScope) do
		TriggerClientEvent(eventName, id, ...)
	end
end

Player = setmetatable({
	count = 0,
	list = {},
}, {
	__add = function(self, obj)
		self.list[obj.source] = obj
		self.count += 1
	end,

	__sub = function(self, obj)
		if obj.charid then obj.save(true) end

		TriggerEvent('ox:playerLogout', obj.source, obj.userid, obj.charid)
		self.list[obj.source] = nil
		self.count -= 1
	end,

	__call = function(self, source)
		return self.list[source]
	end
})

---@param source number
---Creates an instance of CPlayer.
function Player.new(source)
	SetPlayerRoutingBucket(tostring(source), 60)
	source = tonumber(source)

	if not Player(source) then
		local identifiers = Ox.GetIdentifiers(source)
		local primary = identifiers[server.PRIMARY_IDENTIFIER]
		local userid = MySQL.prepare.await(Query.SELECT_USERID, { primary })
		local username = GetPlayerName(source)

		if not userid then
			userid = MySQL.prepare.await(Query.INSERT_USERID, {
				username,
				identifiers.license,
				identifiers.steam,
				identifiers.fivem,
				identifiers.discord,
			})
		end

		local self = setmetatable({
			source = source,
			userid = userid,
			username = username,
			characters = selectCharacters(source, userid),
			ped = GetPlayerPed(source),
		}, CPlayer)

		local data = identifiers
		playerData[source] = data

		local state = self:getState()
		state:set('userid', self.userid, true)
		state:set('username', self.username, true)

		for type, identifier in pairs(identifiers) do
			state:set(type, identifier, false)
		end

		data.inScope = {}

		TriggerClientEvent('ox:selectCharacter', source, self.characters)
		return Player + self
	end
end

---@param remove boolean
---Saves all data stored in players.list, and removes cached data if remove is true.
function Player.saveAll(remove)
	local parameters = {}
	local size = 0
	local date = os.date('%Y-%m-%d', os.time())

	for playerId, obj in pairs(Player.list) do
		if obj.charid then
			size += 1
			local entity = GetPlayerPed(playerId)
			local coords = GetEntityCoords(entity)
			local inventory = json.encode(ox_inventory:Inventory(playerId)?.items or {})

			parameters[size] = {
				coords.x,
				coords.y,
				coords.z,
				GetEntityHeading(entity),
				inventory,
				obj.dead,
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
function Player.registerCharacter(userid, firstName, lastName, gender, date, phone_number)
	return MySQL.insert.await(Query.INSERT_CHARACTER, { userid, firstName, lastName, gender, date, phone_number })
end

---Remove character data from the database, and delete any known KVP.
function Player.deleteCharacter(charid)
	appearance:save(charid)
	return MySQL.update(Query.DELETE_CHARACTER, { charid })
end

---@param self table player
---@param character table
---Finalises player loading after they have selected a character.
function Player.loaded(self, character)
	-- currently returns a single value; will require iteration for more data
	self.dead = MySQL.prepare.await(Query.SELECT_CHARACTER, { self.charid }) == 1

	accounts.load(self.source, self.charid)
	appearance:load(self.source, self.charid)

	self.loadGroups()
	self.loadPhone()
	self.loadInventory()

	TriggerEvent('ox:playerLoaded', self.source, self.userid, self.charid)
	TriggerClientEvent('ox:playerLoaded', self.source, self, character.x and vec4(character.x, character.y, character.z, character.heading))

	SetPlayerRoutingBucket(tostring(self.source), 0)
end

-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

function Ox.PlayerExports()
	return {
		set = true,
		get = true,
		setGroup = true,
		getGroup = true,
		isPlayerInScope = true,
		triggerScopedEvent = true,
	}
end

function Ox.GetPlayer(source)
	local player = Player(source)

	if player?.charid then
		return player
	end

	error(("no player exists with id '%s'"):format(source))
end

function Ox.CPlayer(source, method, ...)
	return Ox.GetPlayer(source)[method](...)
end

function Ox.GetPlayers()
	local size = 0
	local players = {}

	for _, v in pairs(Player.list) do
		if v.charid then
			size += 1
			players[size] = v
		end
	end

	return players
end
