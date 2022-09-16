CfxPlayer = Player
local Player = {}
_ENV.Player = Player

local PlayerRegistry = require 'player.registry'

require 'player.events'

---Trigger a function when a player is loaded or the resource restarts.
local loadResource = setmetatable({}, {
    __call = function(self, resource, cb)
        self[resource] = cb

        AddEventHandler('onServerResourceStart', function(res)
            if res == resource then
                for _, player in pairs(PlayerRegistry) do
                    if not player.characters then
                        cb(player)
                    end
                end
            end
        end)
    end
}) --[[@as fun(resource: string, cb: function)]]

local ox_inventory = exports.ox_inventory

loadResource('ox_inventory', function(self)
    ox_inventory:setPlayerInventory({
        source = self.source,
        identifier = self.charid,
        name = self.name,
        sex = self.get('gender'),
        dateofbirth = self.get('dateofbirth'),
        groups = self.get('groups'),
    })
end)

local npwd = GetExport('npwd')

if npwd then
    loadResource('npwd', function(self)
        npwd:newPlayer({
            source = self.source,
            identifier = self.charid,
            phoneNumber = self.get('phoneNumber'),
            firstname = self.firstname,
            lastname = self.lastname
        })
    end)
end

local db = require 'player.db'

---Prepare parameters for updating character data.
---@param player CPlayer
---@param date string
---@return table
local function formatCharacterSaveData(player, date)
    local playerPed = player.ped
    local coords = GetEntityCoords(playerPed)

    return {
        coords.x,
        coords.y,
        coords.z,
        GetEntityHeading(playerPed),
        player.get('isDead') or false,
        date,
        GetEntityHealth(playerPed),
        GetPedArmour(playerPed),
        player.charid
    }
end

---Update the database with a player's current data.
---@param player CPlayer
---@param dropped boolean?
function Player.save(player, dropped)
    if player.charid then
        for name, grade in pairs(player.get('groups')) do
            local group = Ox.GetGroup(name)

            if group then
                group.remove(player, grade)
            end
        end

        db.updateCharacter(formatCharacterSaveData(player, os.date('%Y-%m-%d', os.time())))
    end

    if dropped then
        PlayerRegistry[player.source] = nil
    end
end

local appearance = exports.ox_appearance

---Fetch all characters owned by the player from the database.
---@param source number
---@param userid number
---@return table
function Player.selectCharacters(source, userid)
    local characters = db.selectCharacters(userid)

    for i = 1, #characters do
        local character = characters[i]
        character.appearance = appearance:load(source, character.charid)
    end

    return characters
end

local CPlayer = require 'player.class'

---Creates an instance of CPlayer.
---@param source number
---@return CPlayer
function Player.new(source, identifiers)
    local userid = db.getUserFromIdentifier(identifiers[Server.PRIMARY_IDENTIFIER])
    local username = GetPlayerName(source)

    if not userid then
        userid = db.createUser(username, identifiers) --[[@as number]]
    end

    ---@type CPlayer
    local self = setmetatable({
        source = source,
        userid = userid,
        username = username,
        ped = GetPlayerPed(source),
    }, CPlayer)

    self.init(identifiers)

    local state = self.getState()
    state:set('userid', self.userid, true)

    for type, identifier in pairs(identifiers) do
        state:set(type, identifier, false)
    end

    return self
end

---Saves the data for all active players.
function Player.saveAll()
    local parameters = {}
    local size = 0
    local date = os.date('%Y-%m-%d', os.time())

    for _, player in pairs(PlayerRegistry) do
        if player.charid then
            size += 1
            parameters[size] = formatCharacterSaveData(player, date)
        end
    end

    if size > 0 then
        db.updateCharacter(parameters)
    end
end

---Finalises player loading after they have selected a character.
---@param player CPlayer
---@param character table
function Player.loaded(player, character)
    local result = db.selectCharacterData(character.charid)

    if result then
        for k, v in pairs(result) do
            player.set(k, v)
        end
    end

    player.name = ('%s %s'):format(character.firstname, character.lastname)
    player.charid = character.charid
    player.firstname = character.firstname
    player.lastname = character.lastname
    player.set('groups', {})

    result = db.selectCharacterGroups(player.charid)

    if result then
        for i = 1, #result do
            local data = result[i]
            local group = Ox.GetGroup(data.name)

            if group then
                group.add(player, data.grade)
            end
        end
    end

    local metadata = db.selectMetadata(player.charid)

    for k, v in pairs(metadata) do
        player.set(k, v)
    end

    for _, load in pairs(loadResource) do
        load(player)
    end

    local state = player.getState()
    state:set('dead', player.get('isDead'), true)
    state:set('name', player.name, true)
    appearance:load(player.source, player.charid)

    -- set groups onto player obj temporarily, for sending to the client
    player.groups = player.get('groups')

    TriggerEvent('ox:playerLoaded', player.source, player.userid, player.charid)
    TriggerClientEvent('ox:playerLoaded', player.source, player, character.x and vec4(character.x, character.y, character.z, character.heading), metadata.health, metadata.armour)

    player.groups = nil
end

AddEventHandler('onResourceStop', function(resource)
    if resource == 'ox_core' then
        Player.saveAll()
    end
end)
