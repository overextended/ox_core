local statuses = {}
local currentStatus = {}

NetEventHandler('ox:setPlayerStatus', function(name, value)
    statuses[name] = GlobalState[('status.%s'):format(name)]
    currentStatus[name] = value
end)

local function startStatusLoop()
    local i = 0

    while PlayerIsLoaded do
        i += 1

        for name, value in pairs(currentStatus) do
            local tickAmount = statuses[name].ontick

            if tickAmount then
                value += tickAmount
                currentStatus[name] = value < 0 and 0 or value > 100 and 100 or value
            end
        end

        if i == 60 then
            i = 0
            TriggerServerEvent('ox:updateStatuses', currentStatus)
        end

        TriggerEvent('ox:statusTick', currentStatus)

        Wait(1000)
    end
end

return startStatusLoop
