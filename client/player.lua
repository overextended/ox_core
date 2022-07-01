PlayerData = {}
local CPlayer = {}

function SetPlayerData(data)
	PlayerData = data
	PlayerData.id = PlayerId()
	setmetatable(PlayerData, CPlayer)
end

NetEventHandler('ox:setGroup', function(name, grade)
	PlayerData.groups[name] = grade
end)

function Ox.IsPlayerLoaded()
	return PlayerData.loaded
end

function Ox.GetPlayerData()
	return PlayerData
end

function Ox.PlayerExports()
	return {}
end
