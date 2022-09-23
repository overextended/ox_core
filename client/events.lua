function NetEventHandler(event, fn)
    RegisterNetEvent(event, function(...)
        if source ~= '' then fn(...) end
    end)
end

AddStateBagChangeHandler('initVehicle', nil, function(bagName, key, value, reserved, replicated)
    if value then
        Wait(50)
        local netId = tonumber(bagName:gsub('entity:', ''), 10)
        local entity = NetworkDoesNetworkIdExist(netId) and NetworkGetEntityFromNetworkId(netId)

        if entity and NetworkGetEntityOwner(entity) == cache.playerId then
            lib.setVehicleProperties(entity, value[1])
            SetVehicleOnGroundProperly(entity)
            SetVehicleDoorsLocked(entity, value[2])
            Entity(entity).state:set('vehicleProperties', nil, true)
        end
    end
end)

lib.callback.register('ox:getNearbyVehicles', function(radius)
    local nearbyEntities = {}
    local playerCoords = GetEntityCoords(cache.ped)
    local vehicles = GetGamePool('CVehicle')
    local size = 0

    for i = 1, #vehicles do
        local entity = vehicles[i]
        local entityCoords = GetEntityCoords(entity)

        if #(entityCoords - playerCoords) <= (radius or 2) and NetworkGetEntityIsNetworked(entity) then
            size += 1
            nearbyEntities[size] = VehToNet(entity)
        end
    end

    return nearbyEntities
end)
