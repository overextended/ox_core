local Vehicle = {}
local db = require 'vehicle.db'
local VehicleRegistry = require 'vehicle.registry'

require 'vehicle.commands'

---Save all vehicles for the resource and despawn them.
---@param resource string?
function Vehicle.saveAll(resource)
    if resource == 'ox_core' then
        resource = nil
    end

    local parameters = {}
    local size = 0

    for _, vehicle in pairs(VehicleRegistry) do
        if not resource or resource == vehicle.script then
            if (vehicle.owner or vehicle.group) ~= false then
                size += 1
                parameters[size] = { vehicle.stored or 'impound', json.encode(vehicle:get()), vehicle.id }
            end

            if resource then
                vehicle:despawn()
            else
                DeleteEntity(vehicle.entity)
            end
        end
    end

    if size > 0 then
        db.updateVehicle(parameters)
    end
end

local CVehicle = require 'vehicle.class'

---@param id? number
---@param owner? number | boolean
---@param group? string | boolean
---@param plate string
---@param model string
---@param script string
---@param data table
---@param coords vector3
---@param heading number
---@param vType string
---@return CVehicle?
local function spawnVehicle(id, owner, group, plate, vin, model, script, data, coords, heading, vType)
    -- New native seems to be missing some types, for now we'll convert to known types
    -- https://github.com/citizenfx/fivem/commit/1e266a2ca5c04eb96c090de67508a3475d35d6da
    if vType == 'bicycle' or vType == 'quadbike' or vType == 'amphibious_quadbike' then
        vType = 'bike'
    elseif vType == 'amphibious_automobile' or vType == 'submarinecar' then
        vType = 'automobile'
    elseif vType == 'blimp' then
        vType = 'heli'
    end

    local entity = CreateVehicleServerSetter(joaat(model), vType, coords.x, coords.y, coords.z, heading)

    if DoesEntityExist(entity) then
        local vehicle = CVehicle.new({
            id = id,
            netid = NetworkGetNetworkIdFromEntity(entity),
            owner = owner,
            group = group,
            entity = entity,
            script = script,
            plate = plate,
            vin = vin,
            model = model,
        })

        vehicle:init(data)

        if owner ~= false or group then
            db.setStored(nil, vehicle.id)
        end

        return vehicle
    else
        print(("^1Failed to spawn vehicle '%s'^0"):format(model))
    end
end

-----------------------------------------------------------------------------------------------
-- Interface
-----------------------------------------------------------------------------------------------

---Loads a vehicle from the database by id, or creates a new vehicle using provided data.
---@param data table | number
---@param coords vector3
---@param heading? number
---@return table | number | nil
function Ox.CreateVehicle(data, coords, heading)
    local script = GetInvokingResource()

    if type(data) == 'number' then
        do
            local type = type(coords)

            if type == 'table' then
                if coords[1] then
                    coords = vector3(coords[1], coords[2], coords[3])
                end
            elseif type ~= 'vector3' then
                TypeError('coords', 'vector3', type)
            end
        end

        do
            local type = type(heading)

            if type ~= 'number' then
                TypeError('heading', 'number', type)
            end
        end

        local vehicle = db.getVehicleFromId(data)

        if not vehicle then
            error(("Failed to spawn vehicle with id '%s' (invalid id or already spawned)"):format(data))
        end

        vehicle.data = json.decode(vehicle.data--[[@as string]] )
        local modelData = Ox.GetVehicleData(vehicle.model)

        if not modelData then
            error(("Vehicle model is invalid '%s'\nEnsure vehicle exists in '@ox_core/files/vehicles.json'"))
        end

        return spawnVehicle(data, vehicle.owner, vehicle.group, vehicle.plate, vehicle.vin, vehicle.model, script, vehicle.data, coords,
            heading or 90.0, modelData.type)
    end

    do
        local type = type(data.model)

        if type ~= 'string' then
            TypeError('data.model', 'string', type)
        end
    end

    local model = data.model:lower()
    local modelData = Ox.GetVehicleData(model)

    if not modelData then
        error(("Vehicle model is invalid '%s'\nEnsure vehicle exists in '@ox_core/files/vehicles.json'"))
    end

    local owner = data.owner or false --[[@as boolean?]]
    local group = data.group or false --[[@as boolean?]]
    local stored = data.stored or not coords and 'impound' or nil
    local plate = Ox.GeneratePlate()
    local vin = Ox.GenerateVin(model)

    data = {
        properties = data.properties or {},
        lockStatus = data.lockStatus or 1,
    }

    data.properties.plate = plate

    if owner and owner < 1 then
        owner = nil
    end

    if group and type(group) ~= 'string' then
        group = nil
    end

    local vehicleId

    if owner ~= false or group then
        vehicleId = db.createVehicle(plate, vin, owner, group, model, modelData.class, data, stored)
    end

    if stored then
        return vehicleId
    end

    return spawnVehicle(vehicleId, owner, group, plate, vin, model, script, data, coords, heading or 90.0, modelData.type)
end

local math_random = math.random

local function getNumber()
    return math_random(0, 9)
end

local function getLetter()
    return string.char(math_random(65, 90))
end

local function getAlphanumeric()
    return math_random(0, 1) == 1 and getLetter() or getNumber()
end

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
                plate[tableLen] = getNumber()
            elseif char == 'A' then
                plate[tableLen] = getLetter()
            elseif char == '.' then
                plate[tableLen] = getAlphanumeric()
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
    local vehicle = Ox.GetVehicleData(model:lower())
    local arr = {
        math_random(1, 9),
        vehicle.make == '' and 'OX' or vehicle.make:sub(1, 2):upper(),
        model:sub(1, 2):upper(),
        getAlphanumeric(),
        string.char(math_random(65, 90)),
    }

    while true do
        ---@diagnostic disable-next-line: param-type-mismatch
        arr[6] = os.time(os.date("!*t"))
        local vin = table.concat(arr)

        if db.isVinAvailable(vin) then return vin end
    end
end

AddEventHandler('onResourceStop', Vehicle.saveAll)
AddEventHandler('txAdmin:events:serverShuttingDown', function() Vehicle.saveAll() end)
