if not Shared.DEBUG then return end

lib.callback.register('ox:generateVehicleData', function(processAll)
    local models = GetAllVehicleModels and GetAllVehicleModels()

    if not models then
        return error('GetAllVehicleModels is not available in the current build of FiveM.')
    end

    local coords = GetEntityCoords(cache.ped)
    local vehicleData = {}
    print('Generating vehicle data...')

    for i = 1, #models do
        local model = models[i]:lower()

        if processAll or not Ox.GetVehicleData(model) then
            local hash = joaat(model)

            if not HasModelLoaded(hash) then
                RequestModel(hash)
                repeat Wait(0) until HasModelLoaded(hash)
            end

            if hash then
                local vehicle = CreateVehicle(hash, coords.x, coords.y, coords.z + 10, 0.0, false, false)

                local label = GetLabelText(model)
                local make = GetLabelText(GetMakeNameFromVehicleModel(hash))

                vehicleData[model] = {
                    name = label == 'NULL' and model or label,
                    make = make == 'NULL' and '' or make,
                    class = GetVehicleClass(vehicle),
                    seats = GetVehicleModelNumberOfSeats(hash),
                    weapons = DoesVehicleHaveWeapons(vehicle) or nil,
                    doors = GetNumberOfVehicleDoors(vehicle),
                }

                SetVehicleAsNoLongerNeeded(vehicle)
                DeleteEntity(vehicle)
                SetModelAsNoLongerNeeded(hash)
            end
        end
    end

    print('Vehicle data has been generated.')

    return vehicleData
end)
