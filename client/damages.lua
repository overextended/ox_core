local timeout, knockedOut = 10, 20
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
        playerState.knockedOut = true
        SetPedToRagdoll(entity, 1000, 1000, 0, 0, 0, 0)
        SetPlayerInvincible(cache.ped, true)
        timeout = 30
      end
    end

    if playerState.knockedOut == true then
      ResetPedRagdollTimer(entity)
      if timeout >= 0 then knockedOut = knockedOut - 1
        if knockedOut == 0 then knockedOut = 20
          timeout = timeout - 1
          SetEntityHealth(cache.ped, entity, 200)
        end
        else
          playerState.knockedOut = false
        end
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
	if (timeout >= 0) then
		DrawGenericTextThisFrame(0.85, 1.3, 1.0, 1.0, 0.3, ('You become dazed, and are currently unconscious for %s seconds.'):format(timeout), 255, 255, 255, 255)
  end
 end
end)
