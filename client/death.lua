function client.onPlayerDeath(cache)
	cache.dead = true

	while cache.dead do
		Wait(2000)
		cache.ped = PlayerPedId()
		local coords = GetEntityCoords(cache.ped)
        NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, GetEntityHeading(cache.ped), false, false)
		SetEntityHealth(cache.ped, GetEntityMaxHealth(cache.ped))
		cache.dead = false
	end
end