local function deleteVehicle(entity)
    local vehicle = Ox.GetVehicle(entity)
    return vehicle and vehicle:despawn() or DeleteEntity(entity)
end

lib.addCommand('group.admin', 'car', function(source, args)
    local ped = GetPlayerPed(source)
    local entity = GetVehiclePedIsIn(ped)

    if entity then
        deleteVehicle(entity)
    end

    if args.owner and args.owner > 0 then
        args.owner = Ox.GetPlayer(args.owner)?.charid
    end

    local vehicle = Ox.CreateVehicle({
        owner = args.owner,
        model = args.model,
    }, GetEntityCoords(ped), GetEntityHeading(ped))

    if vehicle then
        for i = 1, 50 do
            Wait(0)
            SetPedIntoVehicle(ped, vehicle.entity, -1)

            if GetVehiclePedIsIn(ped, false) == vehicle.entity then
                break
            end
        end
    end
end, {'model:string', 'owner:?number'})

lib.addCommand('group.admin', 'dv', function(source, args)
    local ped = GetPlayerPed(source)
    local entity = GetVehiclePedIsIn(ped)

    if entity > 0 then
        return deleteVehicle(entity)
    end

    local vehicles = lib.callback.await('ox:getNearbyVehicles', source, args.radius)

    for i = 1, #vehicles do
        entity = NetworkGetEntityFromNetworkId(vehicles[i])
        local vehicle = Ox.GetVehicle(entity)

        if vehicle then
            if args.owned == 'true' then
                vehicle:despawn()
            end
        else
            DeleteEntity(entity)
        end
    end
end, {'radius:?number', 'owned:?string'})
