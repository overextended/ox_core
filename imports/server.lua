if not lib.player then lib.player() end

local ox_core = exports.ox_core

Ox = setmetatable({}, {
    __index = function(self, index)
        self[index] = function(...)
            return ox_core[index](nil, ...)
        end

        return self[index]
    end
})

local CPlayer = lib.getPlayer()

function lib.getPlayer(player)
	player = type(player) == 'table' and player.charid or ox_core:getPlayer(player)

	if not player then
		error(("'%s' is not a valid player"):format(player))
	end

	return setmetatable(player, CPlayer)
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
