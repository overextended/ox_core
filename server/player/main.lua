require 'server.player.registry'
require 'server.player.commands'
require 'server.player.events'

---Trigger a function when a player is loaded or the resource restarts.
---@todo module for resource integration
LoadResource = setmetatable({}, {
    __call = function(self, resource, cb)
        self[resource] = cb

        AddEventHandler('onServerResourceStart', function(res)
            if res == resource then
                -- Prevent potential race conditions
                Wait(100)

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

local db = require 'server.player.db'
local utils = require 'server.utils'

function Ox.GenerateStateId()
    local arr = {}

    while true do
        arr[1] = utils.getRandomLetter()
        arr[2] = utils.getRandomLetter()

        for i = 3, 7 do
            arr[i] = utils.getRandomInt()
        end

        local stateid = table.concat(arr)

        if db.isStateIdAvailable(stateid) then return stateid end
    end
end

---Saves the data for all active players.
function Ox.SaveAllPlayers()
    local parameters = {}
    local size = 0
    local date = os.date('%Y-%m-%d')

    for _, player in pairs(Ox.GetAllPlayers()) do
        if player.charid then
            size += 1
            parameters[size] = player:prepareSaveData(date)
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

        Ox.SaveAllPlayers()
    end
end)
