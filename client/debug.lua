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
                local make = GetMakeNameFromVehicleModel(hash)
                local type

                if IsThisModelACar(model) then
                    type = 'automobile'
                elseif IsThisModelABicycle(model) then
                    type = 'bicycle'
                elseif IsThisModelABike(model) then
                    type = 'bike'
                elseif IsThisModelABoat(model) then
                    type = 'boat'
                elseif IsThisModelAHeli(model) then
                    type = 'heli'
                elseif IsThisModelAPlane(model) then
                    type = 'plane'
                elseif IsThisModelAQuadbike(model) then
                    type = 'quadbike'
                elseif IsThisModelAnAmphibiousCar(model) then
                    type = 'amphibious_automobile'
                elseif IsThisModelAnAmphibiousQuadbike(model) then
                    type = 'amphibious_quadbike'
                elseif IsThisModelATrain(model) then
                    type = 'train'
                else
                    local class = GetVehicleClass(vehicle)
                    type = (class == 5 and 'submarinecar') or (class == 14 and 'submarine') or (class == 16 and 'blimp') or 'trailer'
                end

                vehicleData[model] = {
                    name = GetLabelText(GetDisplayNameFromVehicleModel(model)),
                    make = make == '' and make or GetLabelText(make),
                    class = GetVehicleClass(vehicle),
                    seats = GetVehicleModelNumberOfSeats(hash),
                    weapons = DoesVehicleHaveWeapons(vehicle) or nil,
                    doors = GetNumberOfVehicleDoors(vehicle),
                    type = type,
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
