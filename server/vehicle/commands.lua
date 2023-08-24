local function deleteCurrentVehicle(ped)
    local entity = GetVehiclePedIsIn(ped, false)

    if entity and entity > 0 then
        local vehicle = Ox.GetVehicle(entity)

        if vehicle then
            vehicle:despawn()
        else
            DeleteEntity(entity)
        end
    end
end

lib.addCommand('car', {
    help = 'Spawn a vehicle using the given model',
    params = {
        { name = 'model', help = 'The model hash or archetype' },
        { name = 'owner', type = 'playerId', help = 'Add the vehicle to the database and set its owner as the given player', optional = true }
    },
    restricted = 'group.admin'
}, function(source, args)
    if args.owner and args.owner > 0 then
        args.owner = Ox.GetPlayer(args.owner)?.charId
    end

    local ped = GetPlayerPed(source)
    local vehicle = Ox.CreateVehicle({
        owner = args.owner,
        model = args.model,
    }, GetEntityCoords(ped), GetEntityHeading(ped))

    if vehicle then
        deleteCurrentVehicle(ped)

        for i = 1, 50 do
            Wait(0)
            SetPedIntoVehicle(ped, vehicle.entity, -1)

            if GetVehiclePedIsIn(ped, false) == vehicle.entity then
                break
            end
        end
    end
end)

lib.addCommand('dv', {
    help = 'Despawn your current vehicle, or vehicles within range',
    params = {
        { name = 'radius', type = 'number', help = 'Range to despawn vehicles, defaulting to 2', optional = true },
        { name = 'owned', type = 'string', help = 'Include player-owned vehicles', optional = true }
    },
    restricted = 'group.admin'
}, function(source, args)
    local ped = GetPlayerPed(source)

    if not args.radius then
        return deleteCurrentVehicle(ped)
    end

    local vehicles = lib.callback.await('ox:getNearbyVehicles', source, args.radius)

    for i = 1, #vehicles do
        local entity = NetworkGetEntityFromNetworkId(vehicles[i])
        local vehicle = Ox.GetVehicle(entity)

        if not vehicle then
            DeleteEntity(entity)
        elseif args.owned == 'true' then
            vehicle:despawn()
        end
    end
end)
