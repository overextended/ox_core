local db = require 'server.player.db'

---@type table<number, OxPlayerInternal>
local PlayerRegistry = {}

---@type table<number, number>
local playerIdFromUserId = {}

---@type table<number, true>
local connectingPlayers = {}

local function removePlayer(playerId, userId, reason)
    PlayerRegistry[playerId] = nil
    playerIdFromUserId[userId] = nil

    for _, player in pairs(PlayerRegistry) do
        player:getPlayersInScope()[playerId] = nil
    end

    --[[ TODO: Log session ended ]]
end

local function isUserActive(userId)
    local player = Ox.GetPlayerFromUserId(userId)

    if player then
        ---@diagnostic disable-next-line: undefined-global
        if DoesPlayerExist(player.source) then
            return true
        end

        player:logout(true)
        removePlayer(player.source, player.userId)
    end
end

local OxPlayer = require 'server.player.class'

local function addPlayer(playerId, username)
    local primaryIdentifier = Shared.SV_LAN and 'fayoum' or GetPlayerIdentifierByType(playerId, Server.PRIMARY_IDENTIFIER)

    if not primaryIdentifier then
        return nil, ("unable to determine '%s' identifier."):format(Server.PRIMARY_IDENTIFIER)
    end

    primaryIdentifier = primaryIdentifier:gsub('([^:]+):', '')
    local userId = db.getUserFromIdentifier(primaryIdentifier)

    if isUserActive(userId) then
        if not Shared.DEBUG then
            return nil, ("userId '%d' is already active."):format(userId)
        end

        -- If debug is enabled, check for secondary userId (allowing player to login with -cl2)
        userId = db.getUserFromIdentifier(primaryIdentifier, 1)

        if userId and isUserActive(userId) then
            return nil, ("userId '%d' is already active."):format(userId)
        end
    end

    if not userId then
        userId = db.createUser(username, Ox.GetIdentifiers(playerId))
    end

    local player = OxPlayer.new({
        source = playerId,
        userId = userId,
        username = username,
        private = {
            inScope = {},
            groups = {},
            statuses = {},
            licenses = {},
            metadata = {},
        }
    })

    PlayerRegistry[playerId] = player
    playerIdFromUserId[userId] = playerId

    return player
end

local function assignNonTemporaryId(tempId, newId)
    local player = PlayerRegistry[tempId]

    if not player then return end

    PlayerRegistry[tempId] = nil
    PlayerRegistry[newId] = player
    playerIdFromUserId[player.userId] = newId

    player:setAsJoined(newId)
end

---Returns an instance of OxPlayerInternal belonging to the given playerId.
---@param playerId number
---@return OxPlayerInternal?
function Ox.GetPlayer(playerId)
    return PlayerRegistry[playerId]
end

function Ox.GetPlayerFromUserId(userId)
    return PlayerRegistry[playerIdFromUserId[userId]]
end

function Ox.GetPlayerRegistry()
    return PlayerRegistry
end

---Check if a player matches filter parameters.
---@param player OxPlayerInternal
---@param filter table
---@return boolean?
local function filterPlayer(player, filter)
    local metadata = player:get()

    for k, v in pairs(filter) do
        if k == 'groups' then
            if not player:hasGroup(v) then
                return
            end
        elseif player[k] ~= v and metadata[k] ~= v then
            return
        end
    end

    return true
end

---Returns the first player that matches the filter properties.
---@param filter table
---@return OxPlayerInternal?
function Ox.GetPlayerByFilter(filter)
    for _, player in pairs(PlayerRegistry) do
        if player.charId then
            if filterPlayer(player, filter) then
                return player
            end
        end
    end
end

---Returns an array of all players matching the filter properties.
---@param filter table?
---@return OxPlayerInternal[]
function Ox.GetPlayers(filter)
    local size = 0
    local players = {}

    for _, player in pairs(PlayerRegistry) do
        if player.charId then
            if not filter or filterPlayer(player, filter) then
                size += 1
                players[size] = player
            end
        end
    end

    return players
end

local serverLockdown

RegisterNetEvent('ox:playerJoined', function()
    local playerId = source

    if serverLockdown then
        return DropPlayer(playerId, serverLockdown)
    end

    ---@type OxPlayerInternal?
    local player = PlayerRegistry[playerId]

    if not player then
        player, err = addPlayer(playerId, GetPlayerName(playerId))

        if player then
            player:setAsJoined(playerId)
        end
    end

    if err or not player then
        return DropPlayer(playerId, err or 'could not load player')
    end

    player.characters = player:selectCharacters()

    TriggerClientEvent('ox:selectCharacter', playerId, player.characters)
end)

AddEventHandler('playerJoining', function(tempId)
    local playerId = source
    tempId = tonumber(tempId, 10)
    connectingPlayers[tempId] = nil

    assignNonTemporaryId(tempId, playerId)
end)

AddEventHandler('playerConnecting', function(username, _, deferrals)
    local tempId = source

    deferrals.defer()

    if serverLockdown then
        return deferrals.done(serverLockdown)
    end

    local _, err = addPlayer(tempId, username)

    if err then
        return deferrals.done(err)
    end

    connectingPlayers[tempId] = true

    deferrals.done()
end)

CreateThread(function()
    ---@diagnostic disable-next-line: undefined-global
    local DoesPlayerExist = DoesPlayerExist

    while true do
        Wait(10000)

        -- If a player quits during the connection phase (and before joining)
        -- the tempId may stay active for several minutes.
        for tempId in pairs(connectingPlayers) do
            if not DoesPlayerExist(tempId --[[@as string]]) then
                local player = PlayerRegistry[tempId]
                connectingPlayers[tempId] = nil
                PlayerRegistry[tempId] = nil
                playerIdFromUserId[player.userId] = nil
            end
        end
    end
end)

AddEventHandler('txAdmin:events:serverShuttingDown', function()
    serverLockdown = 'The server is about to restart. You cannot join at this time.'

    Ox.SaveAllPlayers()

    for playerId, player in pairs(PlayerRegistry) do
        player.charId = nil
        DropPlayer(tostring(playerId), 'Server is restarting.')
    end
end)

AddEventHandler('playerDropped', function(reason)
    local playerId = source
    local player = PlayerRegistry[playerId]

    if player then
        player:logout(true)

        removePlayer(player.source, player.userId, ('Dropped, %s'):format(reason))
    end
end)

return PlayerRegistry
