if not IsDuplicityVersion() then return end

local ox_core = exports.ox_core

Ox = setmetatable({}, {
	__index = function(self, method)
		rawset(self, method, function(...)
			return ox_core[method](nil, ...)
		end)

		return self[method]
	end
})

-----------------------------------------------------------------------------------------------
--	Player
-----------------------------------------------------------------------------------------------
local Player = Player
local CPlayer = {}
setmetatable(CPlayer, CPlayer)

function CPlayer:__index(index)
	return function(...)
		return ox_core:CPlayer(index, self.source, ...)
	end
end

function CPlayer:getState()
	return Player(self.source).state
end

function CPlayer:getPed()
	return GetPlayerPed(self.source)
end

function CPlayer:getCoords()
	return GetEntityCoords(GetPlayerPed(self.source))
end

---Access and manipulate data for a player object.
---@param player table | number
---@return table player
function Ox.Player(player)
	local self = (type(player) == 'table' and player.charid) and player or ox_core:getPlayer(player)

	if not self then
		error(("%s is not a player"):format(json.encode(player)))
	end

	return setmetatable(self, CPlayer)
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
		error(("%s is not a vehicle"):format(json.encode(vehicle)))
	end

	return setmetatable(self, {
		__index = vehicleMethod
	})
end

---@param owner number charid or false
---@param model string | number
---@param coords vector x, y, z, w
---@param data table
---@return table vehicle
function Ox.CreateVehicle(owner, model, coords, data)
	data = data or {}
	data.model = model

	local vehicle = ox_vehicles:new(owner, data, coords.x, coords.y, coords.z, coords.w)

	return setmetatable(vehicle, {
		__index = vehicleMethod
	})
end
