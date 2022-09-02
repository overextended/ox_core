local Player = {}
_ENV.Player = Player

---Trigger a function when a player is loaded or the resource restarts.
local loadResource = setmetatable({}, {
    __call = function(self, resource, cb)
        self[resource] = cb

        AddEventHandler('onServerResourceStart', function(res)
            if res == resource then
                for _, player in pairs(PlayerRegistry) do
                    if not player.characters then
                        cb(player)
                    end
                end
            end
        end)
    end
}) --[[@as fun(resource: string, cb: function)]]

local ox_inventory = exports.ox_inventory

loadResource('ox_inventory', function(self)
    ox_inventory:setPlayerInventory({
        source = self.source,
        identifier = self.charid,
        name = self.name,
        sex = self.gender,
        dateofbirth = self.dob,
        groups = self.groups,
    })
end)

local npwd = GetExport('npwd')

if npwd then
    loadResource('npwd', function(self)
        npwd:newPlayer({
            source = self.source,
            identifier = self.charid,
            phoneNumber = self.phone_number,
            firstname = self.firstname,
            lastname = self.lastname
        })
    end)
end

local db = db.player

---Update the database with a player's current data.
function Player.save(player)
    if player.charid then
        for name, grade in pairs(player.groups) do
            local group = Ox.GetGroup(name)

            if group then
                group:remove(player, grade)
            end
        end

        local coords = GetEntityCoords(player.ped)

        db.updateCharacter({
            coords.x,
            coords.y,
            coords.z,
            GetEntityHeading(player.ped),
            player.dead or false,
            os.date('%Y-%m-%d', os.time()),
            player.charid
        })
    end
end

local appearance = exports.ox_appearance

---Fetch all characters owned by the player from the database.
---@param source number
---@param userid number
---@return table
function Player.selectCharacters(source, userid)
    local characters = db.selectCharacters(userid)

    for i = 1, #characters do
        local character = characters[i]
        character.appearance = appearance:load(source, character.charid)
    end

    return characters
end

---Creates an instance of CPlayer.
---@param source number
function Player.new(source, identifiers)
    local userid = db.getUserFromIdentifier(identifiers[Server.PRIMARY_IDENTIFIER])
    local username = GetPlayerName(source)

    if not userid then
        userid = db.createUser(username, identifiers) --[[@as number]]
    end

    ---@type CPlayer
    local self = setmetatable({
        source = source,
        userid = userid,
        username = username,
        characters = Player.selectCharacters(source, userid),
        ped = GetPlayerPed(source),
    }, CPlayer)

    local data = identifiers
    self.init(data)

    local state = self.getState()
    state:set('userid', self.userid, true)

    for type, identifier in pairs(identifiers) do
        state:set(type, identifier, false)
    end

    return self
end

---Saves the data for all active players.
function Player.saveAll()
    local parameters = {}
    local size = 0
    local date = os.date('%Y-%m-%d', os.time())

    for playerId, player in pairs(PlayerRegistry) do
        if player.charid then
            size += 1
            local entity = GetPlayerPed(playerId)
            local coords = GetEntityCoords(entity)

            parameters[size] = {
                coords.x,
                coords.y,
                coords.z,
                GetEntityHeading(entity),
                player.dead or false,
                date,
                player.charid
            }
        end
    end

    if size > 0 then
        db.updateCharacter(parameters)
    end
end

---Finalises player loading after they have selected a character.
---@param player CPlayer
---@param character table
function Player.loaded(player, character)
    local result = db.selectCharacterData(player.charid)

    if result then
        player.dead = result.is_dead
        result.is_dead = nil
        local data = player.get()

        for k, v in pairs(result) do
            data[k] = v
        end
    end

    player.name = ('%s %s'):format(character.firstname, character.lastname)
    player.charid = character.charid
    player.firstname = character.firstname
    player.lastname = character.lastname

    result = db.selectCharacterGroups(player.charid)
    player.groups = {}

    if result then
        for i = 1, #result do
            local data = result[i]
            local group = Ox.GetGroup(data.name)

            if group then
                group:add(player, data.grade)
            end
        end
    end

    for _, load in pairs(loadResource) do
        load(player)
    end

    local state = player.getState()
    state:set('dead', player.dead, true)
    state:set('name', player.name, true)
    appearance:load(player.source, player.charid)

    TriggerEvent('ox:playerLoaded', player.source, player.userid, player.charid)
    TriggerClientEvent('ox:playerLoaded', player.source, player, character.x and vec4(character.x, character.y, character.z, character.heading))
end

AddEventHandler('onResourceStop', function(resource)
    if resource == 'ox_core' then
        Player.saveAll()
    end
end)
