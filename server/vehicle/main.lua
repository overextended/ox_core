local Vehicle = {}
_ENV.Vehicle = Vehicle

local db = require 'vehicle.db'

---Removes a vehicle from the vehicle registry and despawns the entity.  
---removeEntry will remove the vehicle from the database, otherwise it will be saved instead.
---@param vehicle CVehicle
---@param removeEntry boolean?
---@param metadata table
function Vehicle.despawn(vehicle, removeEntry, metadata)
    local entity = vehicle.entity

    if vehicle.owner ~= false then
        if removeEntry then
            db.deleteVehicle(vehicle.id)
        elseif metadata then
            db.updateVehicle({
                vehicle.plate,
                vehicle.stored,
                json.encode(metadata),
                vehicle.id
            })
        end
    end

    VehicleRegistry[entity] = nil
    DeleteEntity(entity)
end

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
            if vehicle.owner ~= false then
                size += 1
                parameters[size] = { vehicle.plate, vehicle.stored or 'impound', json.encode(vehicle.get()), vehicle.id }
            end

            if resource then
                vehicle.store()
            else
                DeleteEntity(vehicle.entity)
            end
        end
    end

    if size > 0 then
        db.updateVehicle(parameters)
    end
end

---@param id number?
---@param owner number | boolean | nil
---@param plate string
---@param model string
---@param script string
---@param data table
---@param coords vector3
---@param heading number
---@return table?
local function spawnVehicle(id, owner, plate, model, script, data, coords, heading)
    local entity = Citizen.InvokeNative(`CREATE_AUTOMOBILE`, joaat(model), coords.x, coords.y, coords.z, heading)

    if entity then
        local self = setmetatable({
            id = id,
            netid = NetworkGetNetworkIdFromEntity(entity),
            owner = owner,
            entity = entity,
            script = script,
            plate = plate,
            model = model,
        }, CVehicle)

        self.init(data)

        local state = self.getState()
        state:set('owner', self.owner, true)

        if next(data.properties) then
            state:set('vehicleProperties', data.properties, true)
        end

        if owner ~= false then
            db.setStored(nil, self.id)
        end

        return self
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

        if not Ox.GetVehicleData(vehicle.model) then
            error(("Vehicle model is invalid '%s'\nEnsure vehicle exists in '@ox_core/files/vehicles.json'"))
        end

        return spawnVehicle(data, vehicle.owner, vehicle.plate, vehicle.model, script, vehicle.data, coords,
            heading or 90.0)
    end

    do
        local type = type(data.model)

        if type ~= 'string' then
            TypeError('data.model', 'string', type)
        end
    end

    local owner = data.owner or false --[[@as boolean?]]
    local model = data.model:lower()
    local stored = data.stored
    local plate = Ox.GeneratePlate()
    local modelData = Ox.GetVehicleData(model)

    if not modelData then
        error(("Vehicle model is invalid '%s'\nEnsure vehicle exists in '@ox_core/files/vehicles.json'"))
    end

    data = {
        properties = data.properties or {}
    }

    data.properties.plate = plate

    if owner and owner < 1 then
        owner = nil
    end

    local vehicleId

    if owner ~= false then
        vehicleId = db.createVehicle(plate, owner, model, modelData.class, data, stored)
    end


    if stored then
        return vehicleId
    end

    return spawnVehicle(vehicleId, owner, plate, model, script, data, coords, heading or 90.0)
end

---Creates a unique vehicle license plate.
---@return string
function Ox.GeneratePlate()
    local plate = table.create(8, 0)

    while true do
        for i = 1, 8 do
            plate[i] = math.random(0, 1) == 1 and string.char(math.random(65, 90)) or math.random(0, 9)
        end

        local str = table.concat(plate)

        if db.isPlateAvailable(str) then return str end
    end
end

function Ox.VehicleExports()
    return {
        set = true,
        get = true,
        delete = true,
        store = true,
    }
end

AddEventHandler('onResourceStop', Vehicle.saveAll)
AddEventHandler('txAdmin:events:serverShuttingDown', function() Vehicle.saveAll() end)
