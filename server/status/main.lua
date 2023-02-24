local StatusRegistry = require 'server.status.registry'
local db = require 'server.status.db'

require 'server.status.events'

local function loadStatuses()
    local results = db.selectStatuses()

    if results then
        local players = Ox.GetAllPlayers()

        for i = 1, #results do
            local status = results[i]
            local name = status.name
            status.name = nil
            status.ontick = tonumber(status.ontick)

            StatusRegistry[name] = status
            GlobalState[('status.%s'):format(name)] = status

            for _, player in pairs(players) do
                local value = player.charid and player.private.statuses[name]

                if not value or value > 100 then
                    player:setStatus(name, value or status.default)
                end
            end

            Wait(0)
        end
    end
end

MySQL.ready(loadStatuses)

lib.addCommand('refreshstatus', {
    help = 'Refresh statuses (hunger, thirst, stress etc.)',
    restricted = 'group.admin',
}, loadStatuses)