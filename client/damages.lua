local wait, count = 12, 60
local playerState = LocalPlayer.state

playerState.hurt = true

SetInterval(function()
  while playerState.hurt do
    Wait(0)
    if GetEntityHealth(cache.ped) <= 150 then
      lib.requestAnimSet('move_m@injured')
      SetPedMovementClipset(cache.ped, 'move_m@injured', true)
    elseif playerState.hurt and GetEntityHealth(cache.ped) > 190 then
      ResetPedMovementClipset(cache.ped)
      ResetPedStrafeClipset(cache.ped) end
    end
end)

playerState.knockedOut = false

SetInterval(function()
  while true do
    Wait(0)
    local entity = GetPlayerPed(-1)
    if IsPedInMeleeCombat(cache.ped, entity) then
      if GetEntityHealth(cache.ped, entity) < 140 then
        SetPlayerInvincible(cache.ped, true)
        SetPedToRagdoll(entity, 1000, 1000, 0, 0, 0, 0)
        wait = 20
        playerState.knockedOut = true
        SetEntityHealth(cache.ped, entity, 200)
      end
	  end

    if playerState.knockedOut == true then
      ResetPedRagdollTimer(entity)
      if wait >= 0 then
        count = count - 1
        if count == 0 then
          count = 60
          wait = wait - 1
          SetEntityHealth(cache.ped, entity, GetEntityHealth(entity) + 4) end
        else
          playerState.knockedOut = false end
        end
    end
end)

local function DrawGenericTextThisFrame(x, y, width, height, scale, text)
	SetTextFont(0)
	SetTextScale(scale, scale)
	SetTextEntry("STRING")
	AddTextComponentString(text)
	DrawText(x - width / 2, y - height / 2 + 0.005)
	ClearDrawOrigin()
end

SetInterval(function()
	while playerState.knockedOut do
    Wait(0)
	if (wait >= 0) then
		DrawGenericTextThisFrame(0.85, 1.4, 1.0, 1.0, 0.3, ('You become dazed, and are currently unconscious for %s seconds.'):format(wait), 255, 255, 255, 255) end
  end
end)
