DoScreenFadeOut(0)
exports.spawnmanager:spawnPlayer({
	x = shared.spawn.x,
	y = shared.spawn.y,
	z = shared.spawn.z,
	heading = shared.spawn.w,
	model = `mp_m_freemode_01`,
	skipFade = true,
})

SetTimeout(500, function()
	TriggerServerEvent('ox:playerJoined')
	exports.spawnmanager:setAutoSpawn(false)
end)
