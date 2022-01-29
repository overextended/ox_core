local cache

RegisterNetEvent('ox:selectCharacter', function(characters)
	if cache then TriggerEvent('ox:playerLogout') end

	local menu = {}
	local size = #characters

	for i=1, size do
		local character = characters[i]
		menu[i] = {
			id = i,
			header = 'Select character',
			txt = character.firstname and (character.firstname..' '..character.lastname) or '',
			params = {
				event = 'ox:selectCharacter',
				isServer = true,
				args = i
			}
		}
	end

	if size < 4 then
		size = size+1
		menu[size] = {
			id = size,
			header = 'Create character',
			params = {
				event = 'ox:newCharacter',
				args = size
			}
		}
	end

	exports.zf_context:openMenu(menu)
end)

AddEventHandler('ox:newCharacter', function(slot)
	TriggerServerEvent('ox:selectCharacter', slot, {firstname = 'John', lastname = 'Smith', dateofbirth = '1990-01-01', gender = 'male'})
end)

RegisterNetEvent('ox:playerLoaded', function(data, appearance)
	cache = data

	if not appearance.model then
		exports['fivem-appearance']:startPlayerCustomization(function(appearance)
			if appearance then
				TriggerServerEvent('fivem-appearance:save', appearance)
			end
		end, { ped = true, headBlend = true, faceFeatures = true, headOverlays = true, components = true, props = true })
	else
		exports['fivem-appearance']:setPlayerAppearance(appearance)
	end

	Wait(0)
	local playerState = LocalPlayer.state

	local police = GlobalState['group:police']
	print(police.label, police.ranks[playerState.police])

	local ox = GlobalState['group:ox']
	print(ox.label, ox.ranks[playerState.ox])

end)

AddEventHandler('ox:playerLogout', function()
	table.wipe(cache)
end)

CreateThread(function()
	Wait(500)
	TriggerServerEvent('ox:playerJoined')
end)
