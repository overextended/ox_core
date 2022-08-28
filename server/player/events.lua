AddEventHandler('playerEnteredScope', function(data)
    local source = tonumber(data['for']) --[[@as number]]
    local target = tonumber(data.player) --[[@as number]]
    local player = Ox.GetPlayer(source)

    if player and player.charid then
        local inScope = player.get('inScope')
        inScope[target] = true
    end
end)

AddEventHandler('playerLeftScope', function(data)
    local source = tonumber(data['for']) --[[@as number]]
    local target = tonumber(data.player) --[[@as number]]
    local player = Ox.GetPlayer(source)

    if player and player.charid then
        local inScope = player.get('inScope')
        inScope[target] = nil
    end
end)

local npwd = GetExport('npwd')
local db = db.player

RegisterNetEvent('ox:selectCharacter', function(data)
    local player = Ox.GetPlayer(source)  --[[@as CPlayer]]
    local character

    if type(data) == 'table' then
        local phoneNumber = npwd and npwd:generatePhoneNumber() or nil

        character = {
            firstname = data.firstName,
            lastname = data.lastName,
            charid = db.createCharacter(player.userid, data.firstName, data.lastName, data.gender, data.date, phoneNumber),
        }
    elseif type(data) == 'number' and data < 10 then
        character = player.characters[data]
    else
        error(('ox:selectCharacter received invalid slot. Received %s'):format(data))
    end

    player.characters = nil
    Player.loaded(player, character)
end)

RegisterNetEvent('ox:deleteCharacter', function(slot)
    if type(slot) == 'number' and slot < 11 then
        slot += 1
        local player = Ox.GetPlayer(source)

        if player then
            local charid = player.characters[slot]?.charid

            if charid then
                TriggerEvent('ox:characterDeleted', player.source, player.userid, charid)
                db.deleteCharacter(charid)
                return table.remove(player.characters, slot)
            end
        end
    end

    error(('ox:deleteCharacter received invalid slot. Received %s'):format(slot))
end)

RegisterNetEvent('ox:playerDeath', function(dead)
    local player = Ox.GetPlayer(source)

    if player and player.charid then
        player.dead = dead
        player.getState().dead = dead
    end
end)

RegisterNetEvent('ox:setPlayerInService', function(job)
    local player = Ox.GetPlayer(source)

    if player and player.charid then
        if job and player.groups[job] then
            return player.set('inService', job)
        end

        player.set('inService', false)
    end
end)

