local db = require 'player.db'

---@type { [number]: CPlayer }
local PlayerRegistry = {}
local PlayerIdFromUserId = {}

---@type { [number]: boolean }
local connectingPlayers = {}

local function AddPlayer(playerId, userId)
    local player = Player.new(playerId, userId)

    PlayerRegistry[playerId] = player
    PlayerIdFromUserId[userId] = playerId
end

local function RemovePlayer(player, reason)
    PlayerRegistry[player.source] = nil
    PlayerIdFromUserId[player.userid] = nil
    
    player.getState():set('userId', nil, false)
    --[[ TODO: Log session ended ]]
end

local function AssignNonTemporaryId(player, newId)
    local oldId = player.source

    PlayerRegistry[oldId] = nil
    PlayerRegistry[newId] = player

    PlayerIdFromUserId[player.userid] = newId
    
    player.setAsJoined(newId)

    --[[ TODO: Will probably be used for a reconnection(on core restart) logic or so. ]]
    player.getState():set('userId', player.userid, false)
end

---Returns an instance of CPlayer belonging to the given playerId.
---@param playerId number
---@return CPlayer
function Ox.GetPlayer(playerId)
    return PlayerRegistry[playerId]
end

function Ox.GetPlayerFromUserId(userId)
    local playerId = PlayerIdFromUserId[userId]
    
    return playerId and Ox.GetPlayer(playerId) or nil
end

function Ox.GetAllPlayers()
    return PlayerRegistry
end
---Check if a player matches filter parameters.
---@param player CPlayer
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
---@return CPlayer?
function Ox.GetPlayerByFilter(filter)
    for _, player in pairs(Ox.GetAllPlayers()) do
        if player.charid then
            if filterPlayer(player, filter) then
                return player
            end
        end
    end
end

---Returns an array of all players matching the filter properties.
---@param filter table?
---@return CPlayer[]
function Ox.GetPlayers(filter)
    local size = 0
    local players = {}

    for _, player in pairs(Ox.GetAllPlayers()) do
        if player.charid then
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

    local player = Ox.GetPlayer(playerId)

    player.characters = Player.selectCharacters(playerId, player.userid)

    TriggerClientEvent('ox:selectCharacter', playerId, player.characters)
end)

AddEventHandler('playerJoining', function(tempId)
    local playerId = source

    tempId = tonumber(tempId) --[[@as number why the hell is this a string]]

    connectingPlayers[tempId] = nil

    local player = Ox.GetPlayer(tempId)

    AssignNonTemporaryId(player, playerId)
end)

AddEventHandler('playerConnecting', function(username, _, deferrals)
    local tempId = source
    deferrals.defer()

    if serverLockdown then
        return deferrals.done(serverLockdown)
    end

    local identifiers = Ox.GetIdentifiers(source)
    local primaryIdentifier = identifiers?[Server.PRIMARY_IDENTIFIER]

    if not primaryIdentifier then
        return deferrals.done(("unable to determine '%s' identifier."):format(Server.PRIMARY_IDENTIFIER))
    end

    local userid = db.getUserFromIdentifier(identifiers[Server.PRIMARY_IDENTIFIER])

    if Ox.GetPlayerFromUserId(userid) then
        return deferrals.done(("userId '%d' is already active."):format(userid))
    end

    if not userid then
        userid = db.createUser(username, identifiers) --[[@as number]]
    end
    
    AddPlayer(tempId, userid)

    connectingPlayers[tempId] = true

    deferrals.done()
end)

CreateThread(function()
    while true do
        Wait(3000)

        -- If a player quits during the connection phase (and before joining), the tempId may stay
        -- active for several minutes.
        for tempId in pairs(connectingPlayers) do
            ---@diagnostic disable-next-line: param-type-mismatch
            if GetPlayerEndpoint(tempId) == 0x7FFFFFFF then
                connectingPlayers[tempId] = nil
            end
        end
    end
end)

AddEventHandler('txAdmin:events:serverShuttingDown', function()
    serverLockdown = 'The server is about to restart. You cannot join at this time.'

    Player.saveAll()

    for playerId, player in pairs(Ox.GetAllPlayers()) do
        player.charid = nil
        DropPlayer(playerId, 'Server is restarting.')
    end
end)

AddEventHandler('playerDropped', function(reason)
    local playerId = source

    local player = Ox.GetPlayer(playerId)
    local primaryIdentifier

    --[[ Why wouldn't there be a player here? ]]

    if player then
        primaryIdentifier = player.get(Server.PRIMARY_IDENTIFIER)
        player.logout(true)

        RemovePlayer(player, ('Dropped, %s'):format(reason) )
    else
        primaryIdentifier = Ox.GetIdentifiers(playerId)?[Server.PRIMARY_IDENTIFIER]
    end
end)

---@todo proper logout system, and make the command admin-only
RegisterCommand('logout', function(playerId)
    CreateThread(function()
        local player = PlayerRegistry[source]
        return player and player:logout()
    end)
end)

return PlayerRegistry
