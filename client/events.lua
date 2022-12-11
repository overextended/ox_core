function NetEventHandler(event, fn)
    RegisterNetEvent(event, function(...)
        if source ~= '' then fn(...) end
    end)
end

AddStateBagChangeHandler('initVehicle', '', function(bagName, key, value, reserved, replicated)
    if value then
        local entity = GetEntityFromStateBagName(bagName)

        if entity == 0 then
            -- when would this even occur?
            return print(('received invalid entity from statebag! (%s)'):format(bagName))
        end

        -- workaround for server-vehicles that exist in traffic randomly creating peds
        -- https://forum.cfx.re/t/sometimes-an-npc-spawns-inside-an-vehicle-spawned-with-createvehicleserversetter-or-create-automobile/4947251
        for i = -1, 0 do
            local ped = GetPedInVehicleSeat(entity, i)

            if ped ~= cache.ped and ped > 0 and NetworkGetEntityOwner(ped) == cache.playerId then
                DeleteEntity(ped)
            end
        end

        if NetworkGetEntityOwner(entity) == cache.playerId then
            lib.setVehicleProperties(entity, value[1])
            SetVehicleOnGroundProperly(entity)
            SetVehicleDoorsLocked(entity, value[2])
            Entity(entity).state:set('initVehicle', nil, true)
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
