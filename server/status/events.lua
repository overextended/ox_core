local StatusRegistry = require 'server.status.registry'

RegisterNetEvent('ox:updateStatuses', function(data)
    ---@todo can probably implement some sort of protection against arbitrary values
    ---should probably just handle status ticks on server?
    local player = Ox.GetPlayer(source)

    if player then
        for name, value in pairs(data) do
            local status = StatusRegistry[name]

            if status and type(value) == 'number' then
                player:setStatus(name, value > 100 and 100 or value < 0 and 0 or value)
            end
        end
    end
end)

lib.callback.register('ox:getStatus', function(source, target, statusName)
    local player = Ox.GetPlayer(target or source)

    if player then
        if statusName then
            return player:getStatus(statusName)
        end

        return player:getStatuses()
    end
end)
