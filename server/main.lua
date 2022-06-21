AddEventHandler('onServerResourceStart', function(resource)
	if resource == 'ox_inventory' then
		for _, player in pairs(Player.list) do
			if not player.characters then
				player.loadInventory()
			end
		end
	elseif resource == 'npwd' then
		for _, player in pairs(Player.list) do
			if not player.characters then
				player.loadPhone()
			end
		end
	end
end)

AddEventHandler('onResourceStop', function(resource)
	if resource == 'ox_core' then
		Player.saveAll()
	elseif resource == 'ox_inventory' then
		Player.saveAll()
	end
end)

RegisterCommand('logout', function(source)
	Player(source).logout()
end)
