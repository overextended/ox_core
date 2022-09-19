if not Shared.DEBUG then return end

lib.addCommand('group.admin', 'parsevehicles', function(source, args)
    CreateThread(function()
        local vehicleData, topStats = lib.callback.await('ox:generateVehicleData', source, args.processAll) --[[@as table]]

        if vehicleData and next(vehicleData) then
            if not args.processAll then
                for k, v in pairs(Ox.GetVehicleData()) do
                    vehicleData[k] = v
                end
            end

            for vtype, data in pairs(Ox.GetTopVehicleStats()) do
                for stat, value in pairs(data) do
                    if not topStats[vtype][stat] or value > topStats[vtype][stat] then
                        topStats[vtype][stat] = value
                    end
                end
            end

            SaveResourceFile('ox_core', 'shared/files/topVehicleStats.json', json.encode(topStats, {
                indent = true, sort_keys = true, indent_count = 2
            }), -1)

            SaveResourceFile('ox_core', 'shared/files/vehicles.json', json.encode(vehicleData, {
                indent = true, sort_keys = true, indent_count = 2
            }), -1)
        end
    end)
end, { 'processAll' })
