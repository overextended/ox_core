local Vehicle = {}
local db = require 'server.vehicle.db'

require 'server.vehicle.registry'
require 'server.vehicle.commands'

---Save all vehicles for the resource and despawn them.
---@param resource string?
function Vehicle.saveAll(resource)
    if resource == 'ox_core' then
        resource = nil
    end

    local parameters = {}
    local size = 0

    for _, vehicle in pairs(Ox.GetVehicleRegistry()) do
        if not resource or resource == vehicle.script then
            if (vehicle.owner or vehicle.group) ~= false then
                size += 1
                parameters[size] = { vehicle.stored or 'impound', json.encode(vehicle:get()), vehicle.id }
            end

            if resource then
                vehicle:despawn()
            elseif DoesEntityExist(vehicle.entity) then
                DeleteEntity(vehicle.entity)
            end
        end
    end

    if size > 0 then
        db.updateVehicle(parameters)
    end
end

local utils = require 'server.utils'
local plateFormat = string.upper(GetConvar('ox:plateFormat', '........'))
local formatLen = #plateFormat

---Creates a unique vehicle license plate.
---@return string
function Ox.GeneratePlate()
    local plate = table.create(8, 0)

    while true do
        local tableLen = 1

        for i = 1, formatLen do
            local char = plateFormat:sub(i, i)

            if char == '1' then
                plate[tableLen] = utils.getRandomInt()
            elseif char == 'A' then
                plate[tableLen] = utils.getRandomLetter()
            elseif char == '.' then
                plate[tableLen] = utils.getAlphanumeric()
            elseif char == '^' then
                i += 1

                plate[tableLen] = plateFormat:sub(i, i)
            else
                plate[tableLen] = char
            end

            tableLen += 1

            if tableLen == 9 then
                break
            end
        end

        if tableLen < 9 then
            for i = tableLen, 8 do
                plate[i] = ' '
            end
        end

        local str = table.concat(plate)

        if db.isPlateAvailable(str) then return str end
    end
end

---Creates a unique vehicle vin number.
---@param model string
---@return string
function Ox.GenerateVin(model)
    local vehicle = Ox.GetVehicleData(model:lower()) --[[@as VehicleData]]

    local arr = {
        utils.getRandomInt(1, 9),
        vehicle.make == '' and 'OX' or vehicle.make:sub(1, 2):upper(),
        model:sub(1, 2):upper(),
        nil,
        nil,
        os.time()
    }

    while true do
        arr[4] = utils.getAlphanumeric()
        arr[5] = utils.getRandomLetter()
        ---@diagnostic disable-next-line: param-type-mismatch
        local vin = table.concat(arr)

        if db.isVinAvailable(vin) then return vin end
    end
end

AddEventHandler('onResourceStop', Vehicle.saveAll)
AddEventHandler('txAdmin:events:serverShuttingDown', function() Vehicle.saveAll() end)
