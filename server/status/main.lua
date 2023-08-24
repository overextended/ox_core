local StatusRegistry = require 'server.status.registry'
local db = require 'server.status.db'

require 'server.status.events'

local function loadStatuses()
    local results = db.selectStatuses()

    if results then
        local players = Ox.GetPlayerRegistry()

        for i = 1, #results do
            local status = results[i]
            local name = status.name
            status.name = nil
            status.onTick = tonumber(status.onTick)

            StatusRegistry[name] = status
            GlobalState[('status.%s'):format(name)] = status

            for _, player in pairs(players) do
                local value = player.charId and player:getStatus(name)

                if not value or value > 100 then
                    player:setStatus(name, value or status.default)
                end
            end

            Wait(0)
        end
    end
end

MySQL.ready(loadStatuses)

lib.addCommand('refreshstatuses', {
    help = 'Refresh statuses from the database',
    restricted = 'group.admin'
}, loadStatuses)
