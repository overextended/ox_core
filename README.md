## Do not use in production, and do not expect support.
The base features aren't even implemented yet, and there's a lot of code that will be rewritten.  
If you go make something just for API to change, it'll be on you to work out the changes.

## Third-party resources
If you create a resoure that is dependent on ox_core, ox_accounts, etc. *do not use the ox_ prefix*.  
Doing so adds confusion about the resource creator and can lead to multiple resources existing with the name _ox_banking_ or similar.

---

Sample to showcase playerdata, player methods, groups, accounts, and cache.

```lua
local function playerData(source, userid, charid)
	local player = Ox.Player(source)

	print(json.encode(player, {indent=true}))
	print(player.getCoords())

	for group, rank in pairs(player.getGroups()) do
		print(group, rank, cache.groups[group].ranks[rank])
	end

	player.addAccount('test', 1)
	print(player.getAccount('test'))

	for account, balance in pairs(player.getAccount()) do
		print(account, '$'..balance)
	end
end

AddEventHandler('ox:playerLoaded', playerData)

CreateThread(function()
	local players = exports.ox_core:getPlayers()

	for _, player in pairs(players) do
		return playerData(player.source)
	end
end)

RegisterCommand('setgroup', function(source, args)
	if source < 1 then
		local player = Ox.Player(tonumber(args[1]))
		player.setGroup(args[2], tonumber(args[3]))
	end
end)
```
