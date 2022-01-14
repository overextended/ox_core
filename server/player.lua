local db
local functions = server.functions
local player = {}

player.count = 0
player.list = {}
player.new = true

local PlayerClass = {}
PlayerClass.__index = PlayerClass
PlayerClass.__newindex = PlayerClass
PlayerClass.__call = function(self, source)
    return self.list[source]
end
setmetatable(player, PlayerClass)

function player:state()
    return Player(self.source).state
end

function player:setCoords(x, y, z, heading)
    local entity = GetPlayerPed(self.source)
    SetEntityCoords(entity, x, y, z)
    SetEntityHeading(entity, heading)
end

function player:getCoords()
    return GetEntityCoords(GetPlayerPed(self.source))
end

function player:setGroup(group, bool)
    ExecuteCommand(('%s_principal player.%s group.%s'):format(bool and 'add' or 'remove', self.source, group))
end

function player:save()
    db.saveCharacter(self)
end

local ox_inventory = exports.ox_inventory

function player:getInventory()
    return ox_inventory:Inventory(self.source)
end

for name, method in pairs(PlayerClass) do
    if type(method) == 'function' and name ~= '__call' then
        name = 'player_'..name
        exports(name, method)
        print('created new export (exports.core:'..name..')')
    end
end

exports('getPlayer', function(source)
    return player.list[source]
end)

function player.new(source)
    source = tonumber(source)
    local identifiers = functions.getIdentifiers(source)
    local self = setmetatable(db.selectUser(source, identifiers), PlayerClass)
    local state = self:state()

    state:set('userid', self.userid, true)
    state:set('username', self.username, true)

    for type, identifier in pairs(identifiers) do
        state:set(type, identifier, false)
    end

    player.list[source] = self
    player.count += 1
    TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
end

server.ready(function()
    db = server.db
	for i = 0, GetNumPlayerIndices() - 1 do
		local source = GetPlayerFromIndex(i)
		player.new(source)
	end
end)

server.onResourceStart('ox_inventory', function()
    for _, oxPlayer in pairs(player.list) do
        if not oxPlayer.characters then
            exports.ox_inventory:setPlayerInventory({
                source = oxPlayer.source,
                identifier = oxPlayer.charid,
                name = ('%s %s'):format(oxPlayer.firstname, oxPlayer.lastname),
                sex = oxPlayer.gender,
                dateofbirth = oxPlayer.dob,
                job = 'police'
            }, db.selectInventory(oxPlayer.charid))
        end
    end
end)

server.player = player

AddEventHandler('playerJoined', function()
	player.new(source)
end)

AddEventHandler('playerDropped', function()
	local oxPlayer = player.list[source]
	if oxPlayer then
		oxPlayer:save()
		player.list[source] = nil
		player.count -= 1
	end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == 'core' then
        for _, oxPlayer in pairs(player.list) do
            oxPlayer:save()
        end
    end
end)

RegisterNetEvent('ox:selectCharacter', function(slot, data)
    local oxPlayer = player(source)
    local character = db.selectCharacter(oxPlayer.userid, oxPlayer.characters, slot, data)
    local characters = oxPlayer.characters[slot]

    rawset(oxPlayer, 'charid', character.charid)
    rawset(oxPlayer, 'firstname', characters.firstname)
    rawset(oxPlayer, 'lastname', characters.lastname)
    rawset(oxPlayer, 'gender', characters.gender)
    rawset(oxPlayer, 'dob', characters.dateofbirth)

    oxPlayer.characters = nil
    oxPlayer:setCoords(character.x or 9.77143, character.y or 26.7429, character.z or 70.7979, character.heading or 249.449)
    TriggerClientEvent('ox:playerLoaded', oxPlayer.source, oxPlayer, character.appearance)

    exports.ox_inventory:setPlayerInventory({
        source = oxPlayer.source,
        identifier = oxPlayer.charid,
        name = ('%s %s'):format(oxPlayer.firstname, oxPlayer.lastname),
        sex = oxPlayer.gender,
        dateofbirth = oxPlayer.dob,
        job = 'police'
    }, json.decode(character.inventory) or {})
end)

RegisterNetEvent('ox:saveAppearance', function(appearance)
    local oxPlayer = player(source)
    db.saveAppearance(oxPlayer.charid, json.encode(appearance))
end)

RegisterCommand('logout', function(source)
    local oxPlayer = player(source)
    oxPlayer:save()
    rawset(oxPlayer, 'characters', db.selectCharacters(oxPlayer.userid))
    TriggerClientEvent('ox:selectCharacter', oxPlayer.source, oxPlayer.characters)
end)
