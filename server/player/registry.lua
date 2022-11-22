---@type { [number]: CPlayer }
local PlayerRegistry = {}

---@type { [number]: CPlayer }
local connectingPlayers = {}

---@type { [string]: true }
local activeIdentifiers = {}

---Returns an instance of CPlayer belonging to the given playerId.
---@param playerId number
---@return CPlayer
function Ox.GetPlayer(playerId)
    return PlayerRegistry[playerId]
end

---Check if a player matches filter parameters.
---@param player CPlayer
---@param filter table
---@return boolean?
local function filterPlayer(player, filter)
    local metadata = player:get()

    for k, v in pairs(filter) do
        if k == 'groups' then
            if not player.hasGroup(v) then
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
    for _, player in pairs(PlayerRegistry) do
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

    for _, player in pairs(PlayerRegistry) do
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
    if serverLockdown then
        return DropPlayer(source, serverLockdown)
    end

    local player = PlayerRegistry[source]

    if not player then
        local identifiers = Ox.GetIdentifiers(source)
        activeIdentifiers[identifiers[Server.PRIMARY_IDENTIFIER]] = true
        player = Player.new(source, identifiers)
        PlayerRegistry[player.source] = player
    end

    player.characters = Player.selectCharacters(player.source, player.userid)

    TriggerClientEvent('ox:selectCharacter', player.source, player.characters)
end)

AddEventHandler('playerJoining', function(tempId)
    tempId = tonumber(tempId) --[[@as number why the hell is this a string]]
    local identifiers = connectingPlayers[tempId]

    if identifiers then
        connectingPlayers[tempId] = nil
        local player = Player.new(source, identifiers)
        PlayerRegistry[player.source] = player
    end
end)

AddEventHandler('playerConnecting', function(_, _, deferrals)
    local tempId = source
    deferrals.defer()

    if serverLockdown then
        return deferrals.done(serverLockdown)
    end

    local identifiers = Ox.GetIdentifiers(source)
    local primaryIdentifier = identifiers?[Server.PRIMARY_IDENTIFIER]

    if not primaryIdentifier then
        return deferrals.done(("unable to determine '%s' identifier."):format(Server.PRIMARY_IDENTIFIER))
    elseif not Shared.DEBUG and activeIdentifiers[primaryIdentifier] then
        return deferrals.done(("identifier '%s:%s' is already active."):format(Server.PRIMARY_IDENTIFIER, primaryIdentifier))
    end

    activeIdentifiers[primaryIdentifier] = true
    connectingPlayers[tempId] = identifiers

    deferrals.done()
end)

CreateThread(function()
    while true do
        Wait(30000)

        -- If a player quits during the connection phase (and before joining), the tempId may stay
        -- active for several minutes.
        for tempId, identifiers in pairs(connectingPlayers) do
            ---@diagnostic disable-next-line: param-type-mismatch
            if not GetPlayerEndpoint(tempId) then
                activeIdentifiers[identifiers[Server.PRIMARY_IDENTIFIER]] = nil
                connectingPlayers[tempId] = nil
            end
        end
    end
end)

AddEventHandler('txAdmin:events:serverShuttingDown', function()
    serverLockdown = 'The server is about to restart. You cannot join at this time.'

    Player.saveAll()

    for playerId, player in pairs(PlayerRegistry) do
        player.charid = nil
        DropPlayer(playerId, 'Server is restarting.')
    end
end)

AddEventHandler('playerDropped', function()
    local player = PlayerRegistry[source]
    local primaryIdentifier

    if player then
        primaryIdentifier = player:get(Server.PRIMARY_IDENTIFIER)
        player:logout(true)
    else
        primaryIdentifier = Ox.GetIdentifiers(source)?[Server.PRIMARY_IDENTIFIER]
    end

    if primaryIdentifier then
        activeIdentifiers[primaryIdentifier] = nil
    end
end)

---@todo proper logout system, and make the command admin-only
RegisterCommand('logout', function(source)
    CreateThread(function()
        local player = PlayerRegistry[source]
        return player and player:logout()
    end)
end)

return PlayerRegistry
