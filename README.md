Contents for secondary testing resource, using @ox_core/imports.lua

```lua
local groups = exports.ox_groups

local function test(oxPlayer)
	if oxPlayer then
		print(json.encode(oxPlayer, {indent=true}))
		print(vec3(oxPlayer.getCoords()))

		local playerState = oxPlayer.state

		local police = GlobalState['group:police']
		print(police.label, police.ranks[playerState.police])

		local ox = GlobalState['group:ox']
		print(ox.label, ox.ranks[playerState.ox])

		groups:setGroup(oxPlayer.source, 'ox', 4)

	end
end

AddEventHandler('ox:playerLoaded', function(source, userid, charid)
    test(Ox.Player(source))
end)

CreateThread(function()
	Wait(0)
	local players = exports.ox_core:getPlayers()

	for _, player in pairs(players) do
		return test(Ox.Player(player.source))
	end
end)
```
