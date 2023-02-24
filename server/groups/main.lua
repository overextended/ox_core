local GroupRegistry = require 'server.groups.registry'
local OxGroup = require 'server.groups.class'
local db = require 'server.groups.db'

---Load groups from the database and creates permission groups.
local function loadGroups()
    local results = db.selectGroups()

    if results then
        for _, data in pairs(GroupRegistry) do
            local parent = data.principal

            lib.removeAce(parent, parent)

            for j = 0, #data.grades do
                local child = ('%s:%s'):format(data.principal, j)
                lib.removeAce(child, child)
                lib.removePrincipal(child, parent)
                parent = child
            end
        end

        for i = 1, #results do
            local group = results[i]
            local principal = ('group.%s'):format(group.name)
            group.grades = json.decode(group.grades --[[@as string]])

            if not IsPrincipalAceAllowed(principal, principal) then
                lib.addAce(principal, principal)
            end

            local parent = principal

            for j = 0, #group.grades do
                local child = ('%s:%s'):format(principal, j)

                if not IsPrincipalAceAllowed(child, child) then
                    lib.addAce(child, child)
                    lib.addPrincipal(child, parent)
                end

                parent = child
            end

            GroupRegistry[group.name] = OxGroup.new({
                name = group.name,
                label = group.label,
                grades = group.grades,
                principal = principal,
                hasAccount = group.hasAccount,
                adminGrade = group.adminGrade,
            })

            GlobalState[principal] = GroupRegistry[group.name]
            GlobalState[('%s:count'):format(group.name)] = 0
        end
    end
end

MySQL.ready(loadGroups)

lib.addCommand('refreshgroups', {
    help = 'Load groups from the database and creates permission groups.',
    restricted = 'group.admin'
}, loadGroups)

lib.addCommand('setgroup', {
    help = 'Updates the player\'s grade for the given group',
    restricted = 'group.admin',
    params = {
        { name = 'target', help = 'The player\'s server id', type = 'number' },
        { name = 'group',  help = 'The group name',          type = 'string' },
        { name = 'grade',  help = 'The grade number',        type = 'number' },
    }
}, function(source, args)
    local player = Ox.GetPlayer(args.target)
    return player and player:setGroup(args.group, args.grade)
end)
