if not Shared.DEBUG then return end

lib.addCommand('parsevehicles', {
    help = 'Generate vehicle data',
    restricted = 'group.admin',
    params = {
        { name = 'processAll', help = 'Process all vehicles (no/empty)', type = 'string', optional = true }
    }
}, function(source, args)
    CreateThread(function()
        ---@type table<string, VehicleData>, TopVehicleStats|nil
        local vehicleData, topStats = lib.callback.await('ox:generateVehicleData', source, args.processAll)

        if vehicleData and next(vehicleData) then
            if not args.processAll then
                for k, v in pairs(Ox.GetVehicleData()) do
                    vehicleData[k] = v
                end
            end

            local topVehicleStats = Ox.GetTopVehicleStats() or {}

            if topVehicleStats then
                for vtype, data in pairs(topVehicleStats) do
                    if not topStats then topStats = {} end
                    if not topStats[vtype] then topStats[vtype] = {} end

                    for stat, value in pairs(data) do
                        local newValue = topStats[vtype][stat]

                        if newValue and newValue > value then
                            topVehicleStats[vtype][stat] = newValue
                        end
                    end
                end
            end

            SaveResourceFile('ox_core', 'shared/files/topVehicleStats.json', json.encode(topVehicleStats, {
                indent = true, sort_keys = true, indent_count = 2
            }), -1)

            SaveResourceFile('ox_core', 'shared/files/vehicles.json', json.encode(vehicleData, {
                indent = true, sort_keys = true, indent_count = 2
            }), -1)
        end
    end)
end)
