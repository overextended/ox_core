local db = {}

function db.selectCharacters(userid)
    return MySQL.query.await('SELECT charid, firstname, lastname, gender, dateofbirth FROM characters WHERE userid = ?', {userid})
end

function db.selectUser(source, identifiers)
    local userid = MySQL.scalar.await('SELECT userid FROM users WHERE ip = ?', {identifiers.ip})

    if not userid then
        userid = MySQL.insert.await('INSERT INTO users (license, steam, fivem, discord, ip) VALUES(?, ?, ?, ?, ?)', {identifiers.license, identifiers.steam, identifiers.fivem, identifiers.discord, identifiers.ip})
    end

    return {
        source = source,
        userid = userid,
        username = GetPlayerName(source),
        characters = db.selectCharacters(userid)
    }
end

function db.createCharacter(userid, character)
    return MySQL.insert.await('INSERT INTO characters (userid, firstname, lastname, gender, dateofbirth) VALUES (?, ?, ?, ?, ?)', {userid, character.firstname, character.lastname, character.gender, character.dateofbirth})
end

function db.selectCharacter(userid, characters, slot, data)
    if type(slot) == 'number' and string.len(slot) == 1 then
        local character = characters[slot]

        if not character then
            return { charid = db.createCharacter(userid, data) }
        else
            return MySQL.prepare.await('SELECT charid, x, y, z, heading, inventory, appearance FROM characters WHERE charid = ?', {character.charid})
        end
    else
        error(('db.selectCharacter received invalid slot (should be number with length of 1). Received %s'):format(slot))
    end
end

function db.saveCharacter(player)
    local entity = GetPlayerPed(player.source)
    local coords = GetEntityCoords(entity)
    local inventory = json.encode(player:getInventory()?.items or {})
    MySQL.prepare('UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, inventory = ? WHERE charid = ?', {coords.x, coords.y, coords.z, GetEntityHeading(entity), inventory, player.charid})
end

function db.saveAppearance(charid, appearance)
    MySQL.prepare('UPDATE characters SET appearance = ? WHERE charid = ?', { appearance, charid})
end

function db.selectInventory(charid)
    return json.decode(MySQL.prepare.await('SELECT inventory FROM characters WHERE charid = ?', { charid }))
end

server.db = db
