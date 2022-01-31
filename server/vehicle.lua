-----------------------------------------------------------------------------------------------
--	Module
-----------------------------------------------------------------------------------------------

local CVehicle = {
	count = 0,
	list = {},
	new = true,
}

local Query = {
	SELECT_VEHICLES = 'SELECT owner, data, x, y, z, heading FROM vehicles WHERE stored = "false"',
	UPDATE_VEHICLES = 'UPDATE vehicles SET x = ?, y = ?, z = ?, heading = ? WHERE plate = ?',
	IMPOUND_VEHICLE = 'UPDATE vehicles SET stored = "impound" WHERE plate = ?',
}


-----------------------------------------------------------------------------------------------
--	Class
-----------------------------------------------------------------------------------------------

local Class = {}
Class.__index = Class
Class.__newindex = Class
Class.__call = function(self, source)
	return self.list[source]
end

setmetatable(CVehicle, Class)

function CVehicle.new(owner, data, x, y, z, heading)
	if x and y and z then
		local entity = Citizen.InvokeNative(`CREATE_AUTOMOBILE`, data.model, x, y, z, heading or 90.0)

		if NetworkGetEntityOwner(entity) < 1 then
			MySQL.prepare(Query.STORE_VEHICLE, { data.plate })
		else
			Wait(0)

			local self = {
				owner = owner,
				data = data,
				entity = entity,
				netid = NetworkGetNetworkIdFromEntity(entity),
			}

			CVehicle.list[data.plate] = self
			CVehicle.count += 1

			Entity(entity).state.data = data
			Entity(entity).state.owner = owner

			return self
		end
	end
end


-----------------------------------------------------------------------------------------------
--	Events
-----------------------------------------------------------------------------------------------

AddEventHandler('onResourceStop', function(resource)
	if resource == 'ox_core' then
		local parameters = {}
		local size = 0

		for plate, vehicle in pairs(CVehicle.list) do
			size += 1
			local coords = GetEntityCoords(vehicle.entity)
			parameters[size] = { coords.x, coords.y, coords.z, GetEntityHeading(vehicle.entity), plate }
			DeleteEntity(vehicle.entity)
		end

		if size > 0 then
			MySQL.prepare(Query.UPDATE_VEHICLES, parameters)
		end
	end
end)

MySQL.ready(function()
	local vehicles = MySQL.query.await(Query.SELECT_VEHICLES)
	print('vehicles', vehicles)
	for i = 1, #vehicles do
		local vehicle = vehicles[i]
		vehicle = CVehicle.new(vehicle.owner, json.decode(vehicle.data), vehicle.x, vehicle.y, vehicle.z, vehicle.heading)
		print(json.encode(vehicle, {indent=true}))
	end
end)
