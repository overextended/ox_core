local PlayerRegistry = {}
_ENV.PlayerRegistry = PlayerRegistry

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
    local metadata = player.get()

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

---Returns an array of all players matching the filter parameters.
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

    Player.new(source)
end)

AddEventHandler('playerConnecting', function(_, _, deferrals)
    deferrals.defer()

    if serverLockdown then
        return deferrals.done(serverLockdown)
    end

    local identifier = Ox.GetIdentifiers(source)?[Server.PRIMARY_IDENTIFIER]

    if not identifier then
        return deferrals.done(('Could not register an account, unable to determine "%s" identifier.'):format(Server.PRIMARY_IDENTIFIER))
    end

    deferrals.done()
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
    local player = Ox.GetPlayer(source)

    if player then
        return player.logout(true)
    end
end)

---@todo proper logout system, and make the command admin-only
RegisterCommand('logout', function(source)
    CreateThread(function()
        local player = Ox.GetPlayer(source)
        return player and player.logout()
    end)
end)
