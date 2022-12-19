AddEventHandler('playerEnteredScope', function(data)
    local source = tonumber(data['for']) --[[@as number]]
    local target = tonumber(data.player) --[[@as number]]
    local player = Ox.GetPlayer(source)

    if player and player.charid then
        local inScope = player.private.inScope
        inScope[target] = true
    end
end)

AddEventHandler('playerLeftScope', function(data)
    local source = tonumber(data['for']) --[[@as number]]
    local target = tonumber(data.player) --[[@as number]]
    local player = Ox.GetPlayer(source)

    if player and player.charid then
        local inScope = player.private.inScope
        inScope[target] = nil
    end
end)

local npwd = GetExport('npwd')
local appearance = GetExport('ox_appearance')
local db = require 'player.db'
local StatusRegistry = require 'status.registry'

RegisterNetEvent('ox:selectCharacter', function(data)
    local player = Ox.GetPlayer(source) --[[@as CPlayer]]
    local character

    if type(data) == 'table' then
        local phoneNumber = npwd and npwd:generatePhoneNumber() or nil

        character = {
            firstname = data.firstName,
            lastname = data.lastName,
            charid = db.createCharacter(player.userid, data.firstName, data.lastName, data.gender, data.date, phoneNumber),
        }
    elseif type(data) == 'number' and data <= Shared.CHARACTER_SLOTS then
        character = player.characters[data]
    else
        error(('ox:selectCharacter received invalid slot. Received %s'):format(data))
    end

    player.characters = nil
    player.name = ('%s %s'):format(character.firstname, character.lastname)
    player.charid = character.charid
    player.firstname = character.firstname
    player.lastname = character.lastname
    player.ped = GetPlayerPed(player.source)

    local groups = db.selectCharacterGroups(player.charid)

    if groups then
        for i = 1, #groups do
            local data = groups[i]
            local group = Ox.GetGroup(data.name)

            if group then
                group:add(player, data.grade)
            end
        end
    end

    local licenses = db.selectCharacterLicenses(player.charid)

    if licenses then
        for i = 1, #licenses do
            local license = licenses[i]
            player.private.licenses[license.name] = license
            license.name = nil
        end
    end

    local cData = db.selectCharacterData(character.charid)

    player:set('dateofbirth', cData.dateofbirth)
    player:set('gender', cData.gender)
    player:set('isDead', cData.isDead)
    player:set('phoneNumber', cData.phoneNumber)

    for _, load in pairs(LoadResource) do
        load(player)
    end

    local state = player:getState()
    local coords = character.x and vec4(character.x, character.y, character.z, character.heading)

    state:set('dead', player:get('isDead'), true)
    state:set('name', player.name, true)
    appearance:load(player.source, player.charid)

    TriggerClientEvent('ox:loadPlayer', player.source, coords, {
        firstname = player.firstname,
        lastname = player.lastname,
        name = player.name,
        userid = player.userid,
        charid = player.charid,
        groups = player:getGroups(),
        gender = player:get('gender'),
    }, cData.health, cData.armour)

    cData.statuses = json.decode(cData.statuses)

    for name, status in pairs(StatusRegistry) do
        player:setStatus(name, cData.statuses?[name] or status.default)
    end

    TriggerEvent('ox:playerLoaded', player.source, player.userid, player.charid)
end)

RegisterNetEvent('ox:deleteCharacter', function(slot)
    if type(slot) == 'number' and slot <= Shared.CHARACTER_SLOTS then
        slot += 1
        local player = Ox.GetPlayer(source)

        if player then
            local charid = player.characters[slot]?.charid

            if charid then
                TriggerEvent('ox:characterDeleted', player.source, player.userid, charid)
                appearance:save(charid)
                db.deleteCharacter(charid)
                return table.remove(player.characters, slot)
            end
        end
    end

    error(('ox:deleteCharacter received invalid slot. Received %s'):format(slot))
end)

RegisterNetEvent('ox:playerDeath', function(state)
    local player = Ox.GetPlayer(source)

    if player and player.charid then
        player:set('isDead', state)
    end
end)

RegisterNetEvent('ox:setPlayerInService', function(job)
    local player = Ox.GetPlayer(source)

    if player and player.charid then
        if job and player.private.groups[job] then
            return player:set('inService', job, true)
        end

        player:set('inService', false, true)
    end
end)

