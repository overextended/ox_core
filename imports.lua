local isServer = IsDuplicityVersion()
local core = exports.ox_core

Ox = setmetatable({
	PlayerLogout = false,
	PlayerLoaded = false,
}, {
	__index = function(self, method)
		rawset(self, method, function(...)
			return core[method](nil, ...)
		end)

		return self[method]
	end
})

cache = setmetatable({}, {
	__call = function(self)
		self.groups = setmetatable({}, {
			__index = function(groups, index)
				groups[index] = GlobalState['group:'..index]
				return groups[index]
			end
		})
	end,

	__index = function(self, index)
		self[index] = {}
		return self[index]
	end
})

CreateThread(function()
	while true do
		cache()
		Wait(60000)
	end
end)

if isServer then
	-----------------------------------------------------------------------------------------------
	--	Player Interface
	-----------------------------------------------------------------------------------------------

	---Triggers exported Class functions when triggering a player's index metamethod.
	---@param self table
	---@param index string
	---@return function export
	local function playerMethod(self, index)
		if index == 'state' then
			return Player(self.source).state
		else
			return function(...)
				return core['player_'..index](nil, self, ...)
			end
		end
	end

	---Access and manipulate data for a player object.
	---@param player table | number
	---@return table player
	function Ox.Player(player)
		local self = (type(player) == 'table' and player.charid) and player or Ox.getPlayer(player)

		if not self then
			error(("%s is not a player"):format(json.encode(player)))
		end

		return setmetatable(self, {
			__index = playerMethod
		})
	end

	-----------------------------------------------------------------------------------------------
	--	Vehicle Interface
	-----------------------------------------------------------------------------------------------

	---Triggers exported Class functions when triggering a vehicles's index metamethod.
	---@param self table
	---@param index string
	---@return function export
	local function vehicleMethod(self, index)
		if index == 'state' then
			return Entity(self.source).state
		else
			return function(...)
				return core['vehicle_'..index](nil, self, ...)
			end
		end
	end

	---Access and manipulate data for a vehicle object.
	---@param vehicle table | number
	---@return table vehicle
	function Ox.Vehicle(vehicle)
		local self = (type(vehicle) == 'table' and vehicle.netid) and vehicle or Ox.getVehicle(vehicle)

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

		local vehicle = core['vehicle_new'](nil, owner, data, coords.x, coords.y, coords.z, coords.w)

		return setmetatable(vehicle, {
			__index = vehicleMethod
		})
	end
else
	cache.player.id = PlayerId()

	RegisterNetEvent('ox:playerLoaded', function()
		if Ox.PlayerLoaded then
			Ox.PlayerLoaded()
		end
	end)

	AddEventHandler('ox:playerLogout', function()
		if Ox.PlayerLogout then
			Ox.PlayerLogout()
		end
	end)

	CreateThread(function()
		if Ox.PlayerLoaded and Ox.IsPlayerLoaded() then
			Ox.PlayerLoaded()
		end
	end)
end
