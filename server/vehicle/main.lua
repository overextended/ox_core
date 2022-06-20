local Query = {
	DELETE_VEHICLE = 'DELETE FROM vehicles WHERE plate = ?',
	INSERT_VEHICLE = 'INSERT INTO vehicles (plate, owner, model, class, type, data, stored) VALUES (?, ?, ?, ?, ?, ?, ?)',
	PLATE_EXISTS = 'SELECT 1 FROM vehicles WHERE plate = ?',
	SELECT_VEHICLE = 'SELECT owner, model, type, data FROM vehicles WHERE id = ?',
	UPDATE_STORED = 'UPDATE vehicles SET stored = ? WHERE plate = ?',
	UPDATE_VEHICLE = 'UPDATE vehicles SET stored = ?, data = ? WHERE plate = ?',
	SELECT_MODEL_DATA = 'SELECT name, make, type, bodytype, class, price, doors, seats, weapons FROM vehicle_data WHERE model = ?'
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
		MySQL.prepare(Query.DELETE_VEHICLE, { self.plate })
	end

	self.despawn()
end

function CVehicle:store(value)
	if self.owner ~= false then
		MySQL.prepare(Query.UPDATE_VEHICLE, { value or 'impound', json.encode(self.get()), self.plate })
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
				parameters[size] = { 'impound', json.encode(vehicle.get()), vehicle.plate }
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
			MySQL.prepare(Query.UPDATE_STORED, { 'false' })
		end

		return Vehicle + self
	end
end

-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

function Ox.CreateVehicle(data, coords, heading)
	local script = GetInvokingResource()

	if type(data) == 'number' then
		do
			local type = type(coords)

			if type ~= 'vector3' then
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

		return spawnVehicle(vehicle.id, vehicle.owner, vehicle.plate, vehicle.model, script, vehicle.data, coords, heading or 90.0)
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

	data = {
		properties = data.properties or {}
	}

	data.properties.plate = plate

	if owner and owner < 1 then
		owner = nil
	end

	local vehicleId

	if owner ~= false then
		vehicleId = MySQL.prepare.await(Query.INSERT_VEHICLE, { plate, owner, model, modelData.class, modelData.type, json.encode(data), stored or 'false' })
	end

	if stored then
		return vehicleId
	end

	return spawnVehicle(vehicleId, owner, plate, model, script, data, coords, heading or 90.0)
end

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

function Ox.GetVehicle(entity)
	local vehicle = Vehicle(entity)

	if vehicle then
		return vehicle
	end

	error(("no vehicle exists with id '%s'"):format(source))
end

local models = setmetatable({}, {
	__index = function(self, model)
		self[model] = MySQL.prepare.await(Query.SELECT_MODEL_DATA, { model })
		return self[model]
	end
})

function Ox.GetVehicleData(model)
	return models[model]
end

function Ox.CVehicle(source, method, ...)
	return Ox.GetVehicle(source)[method](...)
end

function Ox.GetVehicles()
	local size = 0
	local vehicles = {}

	for _, v in pairs(Vehicle.list) do
		size += 1
		vehicles[size] = v
	end

	return vehicles
end
