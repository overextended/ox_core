local isServer = IsDuplicityVersion()
local core = exports.ox_core

Ox = setmetatable({}, {
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
				return core['player_'..index](_, self, ...)
			end
		end
	end

	---Access and manipulate data for a player object.
	---@param source number
	---@return table oxPlayer
	function Ox.Player(source)
		local self = Ox.getPlayer(source)

		if not self then
			error(("'%s' is not a player"):format(source))
		end

		return setmetatable(self, {
			__index = playerMethod
		})
	end
else
	cache.player.id = PlayerId()
end
