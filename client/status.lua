local statuses = {}

NetEventHandler('ox:setPlayerStatus', function(name, value)
    statuses[name] = value
end)

local function startStatusLoop()
    local i = 0

    while PlayerIsLoaded do
        i += 1

        for name, value in pairs(statuses) do
            if value < 100 then
                statuses[name] = value + 0.1
            elseif value > 100 then
                statuses[name] = 100
            end
        end

        if i == 60 then
            i = 0
            TriggerServerEvent('ox:updateStatuses', statuses)
        end

        TriggerEvent('ox:statusTick', statuses)

        Wait(1000)
    end
end

return startStatusLoop
