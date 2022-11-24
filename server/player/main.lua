CfxPlayer = Player
local Player = {}
_ENV.Player = Player

require 'player.registry'
require 'player.commands'
require 'player.events'

---Trigger a function when a player is loaded or the resource restarts.
---@todo module for resource integration
LoadResource = setmetatable({}, {
    __call = function(self, resource, cb)
        self[resource] = cb

        AddEventHandler('onServerResourceStart', function(res)
            if res == resource then
                for _, player in pairs(Ox.GetAllPlayers()) do
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
    LoadResource('ox_inventory', function(player)
        ox_inventory:setPlayerInventory({
            source = player.source,
            identifier = player.charid,
            name = player.name,
            sex = player:get('gender'),
            dateofbirth = player:get('dateofbirth'),
            groups = player.private.groups,
        })
    end)
end

local npwd = GetExport('npwd')

if npwd then
    LoadResource('npwd', function(player)
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
    LoadResource('pefcl', function(player)
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

        for name, grade in pairs(player.private.groups) do
            local group = Ox.GetGroup(name)

            if group then
                group:remove(player, grade)
            end
        end
    end
end

---Saves the data for all active players.
function Player.saveAll()
    local parameters = {}
    local size = 0
    local date = os.date('%Y-%m-%d', os.time())

    for _, player in pairs(Ox.GetAllPlayers()) do
        if player.charid then
            size += 1
            parameters[size] = formatCharacterSaveData(player, date--[[@as string]] )
        end
    end

    if size > 0 then
        db.updateCharacter(parameters)
    end
end

AddEventHandler('onResourceStop', function(resource)
    if resource == 'ox_core' then
        for _, player in pairs(Ox.GetAllPlayers()) do
            TriggerEvent('ox:playerLogout', player.source, player.userid, player.charid)
        end

        Player.saveAll()
    end
end)
