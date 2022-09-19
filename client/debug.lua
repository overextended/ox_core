if not Shared.DEBUG then return end

lib.callback.register('ox:generateVehicleData', function(processAll)
    local models = GetAllVehicleModels and GetAllVehicleModels()

    if not models then
        return error('GetAllVehicleModels is not available in the current build of FiveM.')
    end

    local coords = GetEntityCoords(cache.ped)
    local vehicleData = {}
    local topStats = {}

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

                if make == '' then
                    local make2 = GetMakeNameFromVehicleModel(model:gsub('%A', ''))

                    if make2 ~= 'CARNOTFOUND' then
                        make = make2
                    end
                end

                local class = GetVehicleClass(vehicle)
                local vType

                if IsThisModelACar(hash) then
                    vType = 'automobile'
                elseif IsThisModelABicycle(hash) then
                    vType = 'bicycle'
                elseif IsThisModelABike(hash) then
                    vType = 'bike'
                elseif IsThisModelABoat(hash) then
                    vType = 'boat'
                elseif IsThisModelAHeli(hash) then
                    vType = 'heli'
                elseif IsThisModelAPlane(hash) then
                    vType = 'plane'
                elseif IsThisModelAQuadbike(hash) then
                    vType = 'quadbike'
                elseif IsThisModelAnAmphibiousCar(hash) then
                    vType = 'amphibious_automobile'
                elseif IsThisModelAnAmphibiousQuadbike(hash) then
                    vType = 'amphibious_quadbike'
                elseif IsThisModelATrain(hash) then
                    vType = 'train'
                else
                    vType = (class == 5 and 'submarinecar') or (class == 14 and 'submarine') or (class == 16 and 'blimp') or 'trailer'
                end

                local data = {
                    name = GetLabelText(GetDisplayNameFromVehicleModel(hash)),
                    make = make == '' and make or GetLabelText(make),
                    class = class,
                    seats = GetVehicleModelNumberOfSeats(hash),
                    weapons = DoesVehicleHaveWeapons(vehicle) or nil,
                    doors = GetNumberOfVehicleDoors(vehicle),
                    type = vType,
                }

                local stats = {
                    braking = GetVehicleModelMaxBraking(hash),
                    acceleration = GetVehicleModelAcceleration(hash),
                    speed = GetVehicleModelEstimatedMaxSpeed(hash),
                    handling = GetVehicleModelEstimatedAgility(hash),
                }

                if vType ~= 'trailer' and vType ~= 'train' then
                    local vGroup = (vType == 'heli' or vType == 'plane' or vType == 'blimp') and 'air' or (vType == 'boat' or vType == 'submarine') and 'sea' or 'land'
                    local topTypeStats = topStats[vGroup]

                    if not topTypeStats then
                        topStats[vGroup] = {}
                        topTypeStats = topStats[vGroup]
                    end

                    for k, v in pairs(stats) do
                        if not topTypeStats[k] or v > topTypeStats[k] then
                            topTypeStats[k] = v
                        end

                        data[k] = v
                    end
                end

                vehicleData[model] = data

                SetVehicleAsNoLongerNeeded(vehicle)
                DeleteEntity(vehicle)
                SetModelAsNoLongerNeeded(hash)
            end
        end
    end

    print('Vehicle data has been generated.')

    return vehicleData, topStats
end)
