local vehicle = server.vehicle

local function deleteVehicle(entity)
	local plate = GetVehicleNumberPlateText(entity)
	local veh = vehicle(plate)

	if veh then
		veh:store()
	else
		DeleteEntity(entity)
	end
end

local Command = import.commands

Command('admin', 'car', function(source, args)
	local ped = GetPlayerPed(source)
	local coords = GetEntityCoords(ped)
	local entity = GetVehiclePedIsIn(ped)

	if entity then
		deleteVehicle(entity)
	end

	entity = Citizen.InvokeNative(`CREATE_AUTOMOBILE`, joaat(args.model), coords.x, coords.y, coords.z, GetEntityHeading(ped))
	local timeout = 50
	repeat
		Wait(0)
		timeout -= 1
		SetPedIntoVehicle(ped, entity, -1)
	until GetVehiclePedIsIn(ped, false) ~= 0 or timeout < 1
end, {'model:string'})

Command('admin', 'dv', function(source)
	local ped = GetPlayerPed(source)
	local entity = GetVehiclePedIsIn(ped)

	if entity then
		deleteVehicle(entity)
	end
end)
