local Query = {
    DELETE_VEHICLE = 'DELETE FROM vehicles WHERE id = ?',
    INSERT_VEHICLE = 'INSERT INTO vehicles (plate, owner, model, class, data, stored) VALUES (?, ?, ?, ?, ?, ?)',
    PLATE_EXISTS = 'SELECT 1 FROM vehicles WHERE plate = ?',
    SELECT_VEHICLE = 'SELECT owner, model, data FROM vehicles WHERE id = ?',
    UPDATE_STORED = 'UPDATE vehicles SET stored = ? WHERE id = ?',
    UPDATE_VEHICLE = 'UPDATE vehicles SET plate = ?, stored = ?, data = ? WHERE id = ?',
}

local CVehicle = {}
local vehicleData = {}

function CVehicle:__index(index)
    local value = vehicleData[self.entity][index]

    if value then
        return value
    end

    local method = CVehicle[index]

    return method and function(...)
        return method(self, ...)
    end
end

function CVehicle:get(index)
    local data = vehicleData[self.entity]
    return data[index] or data
end

function CVehicle:set(index, value)
    if index == 'properties' and value.plate then
        self.plate = value.plate
    end

    vehicleData[self.entity][index] = value
end

function CVehicle:getState()
    return Entity(self.entity).state
end

function CVehicle:despawn()
    DeleteEntity(self.entity)
    return Vehicle - self
end

function CVehicle:delete()
    if self.owner ~= false then
        MySQL.prepare(Query.DELETE_VEHICLE, { self.id })
    end

    self.despawn()
end

function CVehicle:store(value)
    if self.owner ~= false then
        MySQL.prepare(Query.UPDATE_VEHICLE, { self.plate, value or 'impound', json.encode(self.get()), self.id })
    end

    self.despawn()
end

Vehicle = setmetatable({
    list = {},
}, {
    __add = function(self, vehicle)
        self.list[vehicle.entity] = vehicle
        return vehicle
    end,

    __sub = function(self, vehicle)
        self.list[vehicle.entity] = nil
    end,

    __call = function(self, entity)
        return self.list[entity]
    end
})

---Save all vehicles for the resource and despawn them.
---@param resource string
function Vehicle.saveAll(resource)
    if resource == cache.resource then
        resource = nil
    end

    local parameters = {}
    local size = 0

    for _, vehicle in pairs(Vehicle.list) do
        if not resource or resource == vehicle.script then
            if vehicle.owner ~= false then
                size += 1
                parameters[size] = { 'impound', json.encode(vehicle.get()), vehicle.id }
            end

            if resource then
                vehicle.despawn()
            else
                DeleteEntity(vehicle.entity)
            end
        end
    end

    if size > 0 then
        MySQL.prepare(Query.UPDATE_VEHICLE, parameters)
    end
end
AddEventHandler('onResourceStop', Vehicle.saveAll)

---@param id number
---@param owner number | boolean | nil
---@param plate string
---@param model string
---@param script string
---@param data table
---@param coords vector3
---@param heading number
---@return number
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

        vehicleData[self.entity] = data

        local state = self.getState()
        state:set('owner', self.owner, true)

        if next(data.properties) then
            state:set('vehicleProperties', data.properties, true)
        end

        if owner ~= false then
            MySQL.prepare(Query.UPDATE_STORED, { 'false', self.id })
        end

        return Vehicle + self
    end
end

-----------------------------------------------------------------------------------------------
-- Interface
-----------------------------------------------------------------------------------------------

---Loads a vehicle from the database by id, or creates a new vehicle using provided data.
---@param data table | number
---@param coords? vector3
---@param heading? number
---@return number
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

                error(("Expected coords to be 'vector3' but received '%s' instead"):format(type))
            end
        end

        do
            local type = type(heading)

            if type ~= 'number' then
                error(("Expected heading to be 'number' but received '%s' instead"):format(type))
            end
        end

        local vehicle = MySQL.prepare.await(Query.SELECT_VEHICLE, { data })
        vehicle.data = json.decode(vehicle.data)

        if not Ox.GetVehicleData(vehicle.model) then
            error(("Vehicle model is invalid '%s'\nEnsure vehicle exists in '@ox_core/files/vehicles.json'"))
        end

        return spawnVehicle(data, vehicle.owner, vehicle.plate, vehicle.model, script, vehicle.data, coords, heading or 90.0)
    end

    do
        local type = type(data.model)

        if type ~= 'string' then
            error(("Expected data.model to be 'string' but received '%s' instead"):format(type))
        end
    end

    local owner = data.owner or false
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
        vehicleId = MySQL.prepare.await(Query.INSERT_VEHICLE, { plate, owner, model, modelData.class, json.encode(data), stored or 'false' })
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

        if not MySQL.scalar.await(Query.PLATE_EXISTS, { str }) then
            return str
        end
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

---Return vehicle data for the given entity id.
---@param entity number
---@return table
function Ox.GetVehicle(entity)
    return Vehicle(entity)
end

---Return vehicle data for the given network id.
---@param netId number
---@return table
function Ox.GetVehicleFromNetId(netId)
    return Vehicle(NetworkGetEntityFromNetworkId(netId))
end

---API entry point for triggering vehicle methods.
---@param entity number
---@param method string
---@param ... unknown
---@return unknown
function Ox.CVehicle(entity, method, ...)
    local vehicle = Vehicle(entity)
    return vehicle and vehicle[method](...)
end

---Return all vehicle data.
---@return table
function Ox.GetVehicles()
    local size = 0
    local vehicles = {}

    for _, v in pairs(Vehicle.list) do
        size += 1
        vehicles[size] = v
    end

    return vehicles
end
