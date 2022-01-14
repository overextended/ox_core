local PlayerData

RegisterNetEvent('ox:selectCharacter', function(characters)
    if PlayerData then TriggerEvent('ox:playerLogout') end

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
    PlayerData = data
    if not appearance then
        exports['fivem-appearance']:startPlayerCustomization(function(data)
            if data then
                TriggerServerEvent('ox:saveAppearance', data)
            end
        end, { ped = true, headBlend = true, faceFeatures = true, headOverlays = true, components = true, props = true })
    else
        exports['fivem-appearance']:setPlayerAppearance(json.decode(appearance))
    end
end)

AddEventHandler('ox:playerLogout', function()
    table.wipe(PlayerData)
end)