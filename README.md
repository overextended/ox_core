# Do not use in production, and do not expect support.
The base features aren't even implemented yet, and there's a lot of code that will be rewritten.  
If you go make something just for API to change, it'll be on you to work out the changes.

---

Contents for secondary testing resource, using `@ox_core/imports.lua`

```lua
local function test(player)
	if player then
		print(json.encode(player, {indent=true}))
		print(player.getCoords())

		local playerState = player.state

		local police = GlobalState['group:police']
		print(police.label, police.ranks[playerState.police])

		local ox = GlobalState['group:ox']
		print(ox.label, ox.ranks[playerState.ox])

		player.setGroup('police', math.random(0, 1))
		player.setGroup('ox', math.random(0, 4))

		print(json.encode(player.getGroups(), {indent=true}))

		print(json.encode(player.getAccount(), {indent=true}))
		print(json.encode(player.getAccount('test'), {indent=true}))
		player.addAccount('test', 60)
		print(json.encode(player.getAccount('test'), {indent=true}))
	end
end

AddEventHandler('ox:playerLoaded', function(source, userid, charid)
    test(Ox.Player(source))
end)

CreateThread(function()
	local players = exports.ox_core:getPlayers()

	for _, player in pairs(players) do
		return test(Ox.Player(player.source))
	end
end)
```
