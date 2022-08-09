if not Shared.DEBUG then return end

lib.addCommand('group.admin', 'parsevehicles', function(source, args)
    local vehicleData = lib.callback.await('ox:generateVehicleData', source, args.processAll)
    print(vehicleData, next(vehicleData))

    if not args.processAll then
        local oldData = json.load('files/vehicles.json')

        if oldData then
            for k, v in pairs(oldData) do
                vehicleData[k] = v
            end
        end
    end

    SaveResourceFile('ox_core', 'files/vehicles.json', json.encode(vehicleData, { indent = true, sort_keys = true }), -1)
end, { 'processAll' })
