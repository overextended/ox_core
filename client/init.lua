Client = {
	DEFAULT_SPAWN = vec4(-258.211, -293.077, 21.6132, 206.0),
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
