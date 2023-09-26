AddEventHandler('playerEnteredScope', function(data)
    local source = tonumber(data['for'], 10)
    local target = tonumber(data.player, 10)
    local player = Ox.GetPlayer(source)

    if player then
        local inScope = player:getPlayersInScope()
        inScope[target] = true
    end
end)

AddEventHandler('playerLeftScope', function(data)
    local source = tonumber(data['for'], 10)
    local target = tonumber(data.player, 10)
    local player = Ox.GetPlayer(source)

    if player then
        local inScope = player:getPlayersInScope()
        inScope[target] = nil
    end
end)

local npwd = GetExport('npwd')
local appearance = GetExport('ox_appearance')
local db = require 'server.player.db'
local StatusRegistry = require 'server.status.registry'

---@param data number | { firstName: string, lastName: string, gender: string, date: number }
RegisterNetEvent('ox:selectCharacter', function(data)
    local player = Ox.GetPlayer(source) --[[@as OxPlayerInternal?]]

    if not player then return end

    ---@type CharacterProperties
    local character

    if type(data) == 'table' then
        local phoneNumber = npwd and npwd:generatePhoneNumber() or nil
        local stateId = Ox.GenerateStateId()

        character = {
            firstName = data.firstName,
            lastName = data.lastName,
            charId = db.createCharacter(player.userId, stateId, data.firstName, data.lastName, data.gender, data.date, phoneNumber),
            stateId = stateId
        }
    elseif type(data) == 'number' and data <= Shared.CHARACTER_SLOTS then
        character = player.characters[data]
    else
        error(('ox:selectCharacter received invalid slot. Received %s'):format(data))
    end

    player.characters = nil
    player.name = ('%s %s'):format(character.firstName, character.lastName)
    player.charId = character.charId
    player.stateId = character.stateId or db.updateStateId(Ox.GenerateStateId(), player.charId)
    player.firstName = character.firstName
    player.lastName = character.lastName
    player.ped = GetPlayerPed(player.source)

    local groups = db.selectCharacterGroups(player.charId)

    if groups then
        for i = 1, #groups do
            local group = Ox.GetGroup(groups[i].name)

            if group then
                group:add(player, groups[i].grade)
            end
        end
    end

    local licenses = db.selectCharacterLicenses(player.charId)

    if licenses then
        local playerLicenses = player:getLicenses()

        for i = 1, #licenses do
            local license = licenses[i]
            playerLicenses[license.name] = license
            license.name = nil
        end
    end

    local cData = db.selectCharacterData(character.charId)
    local coords = character.x and vec4(character.x, character.y, character.z, character.heading)

    if appearance then appearance:load(player.source, player.charId) end

    TriggerClientEvent('ox:loadPlayer', player.source, coords, {
        firstName = player.firstName,
        lastName = player.lastName,
        name = player.name,
        userId = player.userId,
        charId = player.charId,
        stateId = player.stateId,
        groups = player:getGroups(),
    }, player:get('isDead') and 0 or cData.health, cData.armour, cData.gender)

    player:set('dateOfBirth', cData.dateOfBirth, true)
    player:set('gender', cData.gender, true)
    player:set('phoneNumber', cData.phoneNumber, true)

    cData.statuses = json.decode(cData.statuses)

    for name, status in pairs(StatusRegistry) do
        player:setStatus(name, cData.statuses?[name] or status.default)
    end

    for _, load in pairs(LoadResource) do
        load(player)
    end

    TriggerEvent('ox:playerLoaded', player.source, player.userId, player.charId)
end)

RegisterNetEvent('ox:deleteCharacter', function(slot)
    if type(slot) == 'number' and slot <= Shared.CHARACTER_SLOTS then
        slot += 1
        local player = Ox.GetPlayer(source)

        if not player then return end

        local charId = player.characters[slot]?.charId

        if charId and db.deleteCharacter(charId) then
            if appearance then appearance:save(charId) end

            table.remove(player.characters, slot)

            return TriggerEvent('ox:characterDeleted', player.source, player.userId, charId)
        end
    end

    error(('ox:deleteCharacter received invalid slot. Received %s'):format(slot))
end)

RegisterNetEvent('ox:playerDeath', function(state)
    local player = Ox.GetPlayer(source)

    if player and player.charId then
        player:set('isDead', state)
    end
end)

RegisterNetEvent('ox:setPlayerInService', function(job)
    local player = Ox.GetPlayer(source)

    if player and player.charId then
        if job and player:getGroup(job) then
            return player:set('inService', job, true)
        end

        player:set('inService', false, true)
    end
end)

