PlayerData = {}
local CPlayer = {}

function SetPlayerData(data)
	data.id = PlayerId()
	data.loaded = true
	PlayerData = setmetatable(data, CPlayer)
end

NetEventHandler('ox:setGroup', function(name, grade)
	PlayerData.groups[name] = grade
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
	return PlayerData[method](...)
end

function Ox.GetPlayerData()
	return PlayerData.loaded and PlayerData
end

function Ox.PlayerExports()
	return {}
end
