AddEventHandler('onResourceStop', function(resource)
	if resource == 'ox_core' or resource == 'ox_inventory'then
		Player.saveAll()
	end
end)

RegisterCommand('logout', function(source)
	Player(source).logout()
end)
