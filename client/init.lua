Client = {
	DEFAULT_SPAWN = vec4(-258.211, -293.077, 21.6132, 206.0),
    DEATH_SYSTEM = GetConvarInt('ox:deathSystem', 1) == 1,
    SPAWN_LOCATIONS = {
        vec3(0, 0, 0),
        vec3(394.492828, -713.897949, 29.285452),
    }
}

SetTimeout(500, function()
	exports.spawnmanager:spawnPlayer({
		x = Client.DEFAULT_SPAWN.x,
		y = Client.DEFAULT_SPAWN.y,
		z = Client.DEFAULT_SPAWN.z,
		heading = Client.DEFAULT_SPAWN.w,
		model = `mp_m_freemode_01`,
		skipFade = true,
	})

	exports.spawnmanager:setAutoSpawn(false)
	TriggerServerEvent('ox:playerJoined')
end)

for i = 0, 5 do
	SetDefaultVehicleNumberPlateTextPattern(i, '........')
end
