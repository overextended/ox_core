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
})

local ox_inventory = GetExport('ox_inventory')

if ox_inventory then
    loadResource('ox_inventory', function(player)
        ox_inventory:setPlayerInventory({
            source = player.source,
            identifier = player.charid,
            name = player.name,
            sex = player:get('gender'),
            dateofbirth = player:get('dateofbirth'),
            groups = player:get('groups'),
        })
    end)
end

local npwd = GetExport('npwd')

if npwd then
    loadResource('npwd', function(player)
        npwd:newPlayer({
            source = player.source,
            identifier = player.charid,
            phoneNumber = player:get('phoneNumber'),
            firstname = player.firstname,
            lastname = player.lastname
        })
    end)
end

local pefcl = GetExport('pefcl')

if pefcl then
    loadResource('pefcl', function(player)
        pefcl:loadPlayer(player.source, {
            source = player.source,
            identifier = player.charid,
            name = player.name
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
        player:get('isDead') or false,
        date,
        GetEntityHealth(playerPed),
        GetPedArmour(playerPed),
        player.charid
    }
end

---Update the database with a player's current data.
---@param player CPlayer
function Player.save(player)
    if player.charid then
        db.updateCharacter(formatCharacterSaveData(player, os.date('%Y-%m-%d', os.time())--[[@as string]] ))

        player.charid = nil

        for name, grade in pairs(player:get('groups')) do
            local group = Ox.GetGroup(name)

            if group then
                group:remove(player, grade)
            end
        end
    end
end

local appearance = exports.ox_appearance

---Saves the data for all active players.
function Player.saveAll()
    local parameters = {}
    local size = 0
    local date = os.date('%Y-%m-%d', os.time())

    for _, player in pairs(PlayerRegistry) do
        if player.charid then
            size += 1
            parameters[size] = formatCharacterSaveData(player, date--[[@as string]] )
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
            player:set(k, v)
        end
    end

    player.name = ('%s %s'):format(character.firstname, character.lastname)
    player.charid = character.charid
    player.firstname = character.firstname
    player.lastname = character.lastname
    player:set('groups', {})

    result = db.selectCharacterGroups(player.charid)

    if result then
        for i = 1, #result do
            local data = result[i]
            local group = Ox.GetGroup(data.name)

            if group then
                group:add(player, data.grade)
            end
        end
    end

    local metadata = db.selectMetadata(player.charid)

    for k, v in pairs(metadata) do
        if type(v) == 'string' then
            v = json.decode(v) or v
        end

        player:set(k, v)
    end

    for _, load in pairs(loadResource) do
        load(player)
    end

    local state = player:getState()
    state:set('dead', player:get('isDead'), true)
    state:set('name', player.name, true)
    appearance:load(player.source, player.charid)

    -- set groups onto player obj temporarily, for sending to the client
    local coords = character.x and vec4(character.x, character.y, character.z, character.heading)

    TriggerClientEvent('ox:loadPlayer', player.source, coords, {
        firstname = player.firstname,
        lastname = player.lastname,
        name = player.name,
        userid = player.userid,
        charid = player.charid,
        groups = player:get('groups'),
        gender = player:get('gender'),
    }, metadata.health, metadata.armour)

    player.ped = GetPlayerPed(player.source)

    TriggerEvent('ox:playerLoaded', player.source, player.userid, player.charid)
end

AddEventHandler('onResourceStop', function(resource)
    if resource == 'ox_core' then
        for _, player in pairs(PlayerRegistry) do
            TriggerEvent('ox:playerLogout', player.source, player.userid, player.charid)
        end

        Player.saveAll()
    end
end)
