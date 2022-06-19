SetTimeout(500, function()
	exports.spawnmanager:spawnPlayer({
		x = shared.spawn.x,
		y = shared.spawn.y,
		z = shared.spawn.z,
		heading = shared.spawn.w,
		model = `mp_m_freemode_01`,
		skipFade = true,
	})

	exports.spawnmanager:setAutoSpawn(false)
	TriggerServerEvent('ox:playerJoined')
end)

for i = 0, 5 do
	SetDefaultVehicleNumberPlateTextPattern(i, '........')
end
