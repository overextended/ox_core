if not Shared.DEBUG then return end

lib.addCommand('parsevehicles', {
    help = 'Generate and save vehicle data for available models on the client',
    params = {
        { name = 'processAll', help = 'Include vehicles with existing data (in the event of updated vehicle stats)', optional = true }
    },
    restricted = 'group.admin'
}, function(source, args)
        ---@type table<string, VehicleData>, TopVehicleStats
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
