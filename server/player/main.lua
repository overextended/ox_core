local Query = {
    SELECT_USERID = ('SELECT userid FROM users WHERE %s = ?'):format(Server.PRIMARY_IDENTIFIER),
    INSERT_USERID = 'INSERT INTO users (username, license, steam, fivem, discord) VALUES (?, ?, ?, ?, ?)',
    SELECT_CHARACTERS = 'SELECT charid, firstname, lastname, x, y, z, heading, DATE_FORMAT(last_played, "%d/%m/%Y") AS last_played FROM characters WHERE userid = ? AND deleted IS NULL',
    SELECT_CHARACTER = 'SELECT is_dead, gender, DATE_FORMAT(dateofbirth, "%d/%m/%Y") AS dateofbirth, phone_number FROM characters WHERE charid = ?',
    INSERT_CHARACTER = 'INSERT INTO characters (userid, firstname, lastname, gender, dateofbirth, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
    UPDATE_CHARACTER = 'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, is_dead = ?, last_played = ? WHERE charid = ?',
    DELETE_CHARACTER = 'UPDATE characters SET deleted = curdate() WHERE charid = ?',
    SELECT_USER_GROUPS = 'SELECT name, grade FROM user_groups WHERE charid = ?',
}

local cfxPlayer = Player
local Player = {
    count = 0,
    list = {},
}
_ENV.Player = Player

local loadResource = {}

---Trigger a function when the player is loaded or the resource restarts.
---@param resource string
---@param cb function
function Player.loadResource(resource, cb)
    loadResource[resource] = cb

    AddEventHandler('onServerResourceStart', function(res)
        if res == resource then
            for _, player in pairs(Player.list) do
                if not player.characters then
                    cb(player)
                end
            end
        end
    end)
end

local ox_inventory = exports.ox_inventory

Player.loadResource('ox_inventory', function(self)
    ox_inventory:setPlayerInventory({
        source = self.source,
        identifier = self.charid,
        name = self.name,
        sex = self.gender,
        dateofbirth = self.dob,
        groups = self.groups,
    })
end)

local npwd = GetExport('npwd')

if npwd then
    Player.loadResource('npwd', function(self)
        npwd:newPlayer({
            source = self.source,
            identifier = self.charid,
            phoneNumber = self.phone_number,
            firstname = self.firstname,
            lastname = self.lastname
        })
    end)
end

---@class CPlayer
local CPlayer = {}
CPlayer.__index = CPlayer
local playerData = {}

---Returns the player's statebag.
---@return table<string, unknown>
function CPlayer:getState()
    return cfxPlayer(self.source).state
end

---Load groups for the player's current character.
function CPlayer:loadGroups()
    local results = MySQL.query.await(Query.SELECT_USER_GROUPS, { self.charid })
    self.groups = {}

    if results then
        for i = 1, #results do
            local data = results[i]
            local group = Ox.GetGroup(data.name)

            if group then
                group:add(self, data.grade)
            end
        end
    end
end

---Update the database with a player's current data.
function CPlayer:save()
    if self.charid then
        for name, grade in pairs(self.groups) do
            local group = Ox.GetGroup(name)

            if group then
                group:remove(self, grade)
            end
        end

        local coords = GetEntityCoords(self.ped)

        MySQL.prepare.await(Query.UPDATE_CHARACTER, {
            coords.x,
            coords.y,
            coords.z,
            GetEntityHeading(self.ped),
            self.dead or false,
            os.date('%Y-%m-%d', os.time()),
            self.charid
        })
    end
end

-- Placeholder
local accounts = {}

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

---Fetch all characters owned by the player from the database.
---@param source number
---@param userid number
---@return table
local function selectCharacters(source, userid)
    local characters = MySQL.query.await(Query.SELECT_CHARACTERS, { userid }) or {}

    for i = 1, #characters do
        local character = characters[i]
        character.appearance = appearance:load(source, character.charid)
    end

    return characters
end

---Save the player and return to character selection.
function CPlayer:logout()
    if npwd then
        npwd:unloadPlayer(self.source)
    end

    TriggerEvent('ox:playerLogout', self.source, self.userid, self.charid)

    self:save()
    self.charid = nil
    self.characters = selectCharacters(self.source, self.userid)
    local data = playerData[self.source]

    playerData[self.source] = {
        license = data.license,
        steam = data.steam,
        fivem = data.fivem,
        discord = data.discord,
    }

    TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
end

---Return player metadata.
---@param index? string
---@return unknown
function CPlayer:get(index)
    local data = playerData[self.source]
    return index and data[index] or data
end

---Updates player metadata with the new value.
---@param index string
---@param value any
function CPlayer:set(index, value, replicate)
    playerData[self.source][index] = value

    if replicate then
        TriggerClientEvent('ox:setPlayerData', self.source, index, value)
    end
end

---Updates the player's grade in the given group.
---@param name string
---@param grade number
function CPlayer:setGroup(name, grade)
    Ox.GetGroup(name):set(self, grade)
end

---Get the player's grade for the given group.
---@param name string
---@return number
function CPlayer:getGroup(name)
    return self.groups[name]
end

-- Likely temporary
function CPlayer:hasGroup(filter)
    local type = type(filter)

    if type == 'string' then
        local grade = self.groups[filter]

        if grade then
            return filter, grade
        end
    elseif type == 'table' then
        local tabletype = table.type(filter)

        if tabletype == 'hash' then
            for name, grade in pairs(filter) do
                local playerGrade = self.groups[name]

                if playerGrade and grade <= playerGrade then
                    return name, playerGrade
                end
            end
        elseif tabletype == 'array' then
            for i = 1, #filter do
                local name = filter[i]
                local grade = self.groups[name]

                if grade then
                    return name, grade
                end
            end
        end
    else
        error(("received '%s' when checking player group"):format(filter))
    end
end

---Check if another player is range of the player.
---@param target number
---@return boolean
function CPlayer:isPlayerInScope(target)
    return self:get('inScope')[target]
end

function CPlayer:triggerScopedEvent(eventName, ...)
    local inScope = self:get('inScope')

    for id in pairs(inScope) do
        TriggerClientEvent(eventName, id, ...)
    end
end

setmetatable(Player, {
    __add = function(self, player)
        self.list[player.source] = player
        self.count += 1
    end,

    __sub = function(self, player)
        if player.charid then player:save() end

        TriggerEvent('ox:playerLogout', player.source, player.userid, player.charid)
        playerData[player.source] = nil
        self.list[player.source] = nil
        self.count -= 1
    end,

    ---@return CPlayer
    __call = function(self, source)
        return self.list[source]
    end
})

---Creates an instance of CPlayer.
---@param source number
function Player.new(source)
    if not Player(source) then
        local identifiers = Ox.GetIdentifiers(source)
        local primary = identifiers[Server.PRIMARY_IDENTIFIER]
        local userid = MySQL.scalar.await(Query.SELECT_USERID, { primary })
        local username = GetPlayerName(source)

        if not userid then
            userid = MySQL.prepare.await(Query.INSERT_USERID, {
                username,
                identifiers.license,
                identifiers.steam,
                identifiers.fivem,
                identifiers.discord,
            }) --[[@as number]]
        end

        ---@type CPlayer
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

        for type, identifier in pairs(identifiers) do
            state:set(type, identifier, false)
        end

        data.inScope = {}

        TriggerClientEvent('ox:selectCharacter', source, self.characters)
        return Player + self
    end
end

---Saves all data stored in players.list.
function Player.saveAll()
    local parameters = {}
    local size = 0
    local date = os.date('%Y-%m-%d', os.time())

    for playerId, player in pairs(Player.list) do
        if player.charid then
            size += 1
            local entity = GetPlayerPed(playerId)
            local coords = GetEntityCoords(entity)

            parameters[size] = {
                coords.x,
                coords.y,
                coords.z,
                GetEntityHeading(entity),
                player.dead or false,
                date,
                player.charid
            }
        end
    end

    if size > 0 then
        MySQL.prepare.await(Query.UPDATE_CHARACTER, parameters)
    end
end

---Insert new character data into the database.
---@param userid number
---@param firstName string
---@param lastName string
---@param gender string
---@param date number
---@param phone_number number?
---@return unknown
function Player.registerCharacter(userid, firstName, lastName, gender, date, phone_number)
    return MySQL.prepare.await(Query.INSERT_CHARACTER, { userid, firstName, lastName, gender, date, phone_number })
end

---Remove character data from the database.
---@param charid number
function Player.deleteCharacter(charid)
    appearance:save(charid)
    return MySQL.update(Query.DELETE_CHARACTER, { charid })
end

---Finalises player loading after they have selected a character.
---@param self CPlayer
---@param character table
function Player.loaded(self, character)
    local result = MySQL.single.await(Query.SELECT_CHARACTER, { self.charid })

    if result then
        self.dead = result.is_dead
        result.is_dead = nil

        for k, v in pairs(result) do
            playerData[self.source][k] = v
        end
    end

    self.name = ('%s %s'):format(self.firstname, self.lastname)
    self:loadGroups()

    for _, load in pairs(loadResource) do
        load(self)
    end

    local state = self:getState()
    state:set('dead', self.dead, true)
    state:set('name', self.name, true)
    appearance:load(self.source, self.charid)

    TriggerEvent('ox:playerLoaded', self.source, self.userid, self.charid)
    TriggerClientEvent('ox:playerLoaded', self.source, self, character.x and vec4(character.x, character.y, character.z, character.heading))
end

-----------------------------------------------------------------------------------------------
-- Interface
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

---Return player data for the given player id.
---@param source number
---@return CPlayer?
function Ox.GetPlayer(source)
    local player = Player(source)

    if player?.charid then
        return player
    end
end

---API entry point for triggering player methods.
---@param source number
---@param method string
---@param ... unknown
---@return unknown
function Ox.CPlayer(source, method, ...)
    local player = Player(source)
    return player[method](player, ...)
end

local function filterPlayer(player, filter)
    local metadata = player:get()

    for k, v in pairs(filter) do
        if k == 'groups' then
            if not player:hasGroup(v) then
                return
            end
        elseif player[k] ~= v and metadata[k] ~= v then
            return
        end
    end

    return true
end

---Return all player data.
---@return table
function Ox.GetPlayers(filter)
    local size = 0
    local players = {}

    for _, player in pairs(Player.list) do
        if player.charid then
            if not filter or filterPlayer(player, filter) then
                size += 1
                players[size] = player
            end
        end
    end

    return players
end
