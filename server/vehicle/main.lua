local Query = {
	DELETE_VEHICLE = 'DELETE FROM vehicles WHERE plate = ?',
	INSERT_VEHICLE = 'INSERT INTO vehicles (plate, owner, stored, x, y, z, heading, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
	PLATE_EXISTS = 'SELECT 1 FROM vehicles WHERE plate = ?',
	STORE_VEHICLE = 'UPDATE vehicles SET stored = ?, data = ? WHERE plate = ?',
	UPDATE_VEHICLE = 'UPDATE vehicles SET x = ?, y = ?, z = ?, heading = ?, data = ? WHERE plate = ?',
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
		MySQL.prepare(Query.STORE_VEHICLE, { value or 'impound', json.encode(self.get()), self.plate })
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

function Vehicle.new(data)
	if type(data.model) == 'string' then
		data.model = joaat(data.model)
	end

	local owner = data.owner
	local script = GetInvokingResource()
	local plate = data.plate
	local coords = vector3(data.coords?.x or 0, data.coords?.y or 0, data.coords?.z or 0)
	local heading = data.heading or 90
	local stored = data.stored

	if owner and owner < 1 then
		owner = nil
	end

	if not data.properties then
		data.properties = {}
	end

	if not plate then
		plate = Ox.GeneratePlate()
		data.properties.plate = plate
		data.plate = nil
		data.owner = nil
		data.coords = nil
		data.stored = nil
		data.heading = nil

		if owner ~= false then
			MySQL.prepare(Query.INSERT_VEHICLE, { plate, owner, stored or 'false', coords.x, coords.y, coords.z, heading, json.encode(data) })
		end
	end

	if stored then
		return plate
	elseif not data.properties.plate then
		data.properties.plate = plate
	end

	local entity = Citizen.InvokeNative(`CREATE_AUTOMOBILE`, data.model, coords.x, coords.y, coords.z, coords.w)

	if entity then
		local self = setmetatable({
			netid = NetworkGetNetworkIdFromEntity(entity),
			owner = owner,
			entity = entity,
			script = script,
			plate = plate,
		}, CVehicle)

		vehicleData[self.entity] = data

		local state = self.getState()
		state:set('owner', self.owner, true)

		if next(data.properties) then
			state:set('vehicleProperties', data.properties, true)
		end

		return Vehicle + self
	end
end

function Vehicle.saveAll(resource)
	if resource == cache.resource then
		resource = nil
	end

	local parameters = {}
	local size = 0

	print(json.encode(Vehicle.list))

	for _, vehicle in pairs(Vehicle.list) do
		if not resource or resource == vehicle.script then
			if vehicle.owner ~= false then
				size += 1
				local coords = GetEntityCoords(vehicle.entity)
				parameters[size] = { coords.x, coords.y, coords.z, GetEntityHeading(vehicle.entity), json.encode(vehicle.get()), vehicle.plate }
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

-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

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
		despawn = true,
		delete = true,
		store = true,
	}
end

Ox.CreateVehicle = Vehicle.new

function Ox.GetVehicle(entity)
	local vehicle = Vehicle(entity)

	if vehicle then
		return vehicle
	end

	error(("no vehicle exists with id '%s'"):format(source))
end

function Ox.CVehicle(source, method, ...)
	return Ox.GetVehicle(source)[method](...)
end

function Ox.GetVehicles()
	local size = 0
	local vehicles = {}

	for _, v in pairs(Vehicle.list) do
		if v.charid then
			size += 1
			vehicles[size] = v
		end
	end

	return vehicles
end
