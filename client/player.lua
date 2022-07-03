player = {}
local CPlayer = {}

function SetPlayerData(data)
	data.loaded = true
	player = setmetatable(data, CPlayer)
end

NetEventHandler('ox:setGroup', function(name, grade)
	player.groups[name] = grade
end)

function CPlayer:__index(index)
	local method = CPlayer[index]

	return method and function(...)
		return method(self, ...)
	end
end

---API entry point for triggering player methods.
---@param method string
---@param ... unknown
---@return unknown
function Ox.CPlayer(method, ...)
	return player[method](...)
end

function Ox.GetPlayerData()
	return player.loaded and player
end

function Ox.PlayerExports()
	return {}
end
