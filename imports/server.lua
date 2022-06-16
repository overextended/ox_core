local ox_core = exports.ox_core

Ox = setmetatable({}, {
    __index = function(self, index)
        self[index] = function(...)
            return ox_core[index](nil, ...)
        end

        return self[index]
    end
})

local CPlayer = {}
local PlayerExports = Ox.PlayerExports()

function CPlayer:__index(index, ...)
	local method = CPlayer[index]

	if method then
		return function(...)
			return method(self, ...)
		end
	end

	local export = PlayerExports[index]

	if export then
		if type(export) == 'function' then
			return export(self.source, index, ...)
		end

		CPlayer[index] = function(...)
			return ox_core:CPlayer(self.source, index, ...)
		end

		return CPlayer[index]
	end
end

function CPlayer:getPed()
	if update or not self.ped then
		self.ped = GetPlayerPed(self.source)
	end

	return self.ped
end

function CPlayer:getCoords(update)
	if update or not self.coords then
		self.coords = GetEntityCoords(self.getPed())
	end

	return self.coords
end

function Ox.GetPlayer(player)
	player = type(player) == 'table' and player.charid or ox_core:GetPlayer(player)

	if not player then
		error(("no player exists with id '%s'"):format(player))
	end

	return setmetatable(player, CPlayer)
end

lib.getPlayer = Ox.GetPlayer

function Ox.GetPlayers()
	local players = ox_core:GetPlayers()

	for i = 1, #players do
		setmetatable(players[i], CPlayer)
	end

	return players
end

function CPlayer:hasGroup(filter)
	local type = type(filter)

	if type == 'string' then
		local grade = self.groups[filter]

		if grade then
			return filter, grade
		end
	elseif type == 'table' then
		local tabletype = table.type(filter)

		if tabletype == 'hash' then
			for name, grade in pairs(filter) do
				local playerGrade = self.groups[name]

				if playerGrade and grade <= playerGrade then
					return name, playerGrade
				end
			end
		elseif tabletype == 'array' then
			for i = 1, #filter do
				local name = filter[i]
				local grade = self.groups[name]

				if grade then
					return name, grade
				end
			end
		end
	else
		error(("received '%s' when checking player group"):format(filter))
	end
end

-----------------------------------------------------------------------------------------------
--	Vehicle
-----------------------------------------------------------------------------------------------
local Entity = Entity
local ox_vehicles = exports.ox_vehicles

---Triggers exported Class functions when triggering a vehicles's index metamethod.
---@param self table
---@param index string
---@return function export
local function vehicleMethod(self, index)
	if index == 'state' then
		return Entity(self.netid).state
	else
		return function(...)
			return ox_vehicles[index](nil, self, ...)
		end
	end
end

---Access and manipulate data for a vehicle object.
---@param vehicle table | number
---@return table vehicle
function Vehicle(vehicle)
	local self = (type(vehicle) == 'table' and vehicle.netid) and vehicle or ox_vehicles:get(vehicle)

	if not self then
		error(("'%s' is not a vehicle"):format(vehicle))
	end

	return setmetatable(self, {
		__index = vehicleMethod
	})
end

---@param owner number charid or false
---@param data table
---@param coords vector x, y, z, w
---@return table vehicle
function Ox.CreateVehicle(owner, data, coords)
	if type(data) ~= 'table' then
		data = {
			model = data
		}
	elseif not data.model then
		error('Did not receive data.model for new vehicle')
	end

	local vehicle = ox_vehicles:new(owner, data, coords?.x, coords?.y, coords?.z, coords?.w)

	return setmetatable(vehicle, {
		__index = vehicleMethod
	})
end
