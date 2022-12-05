local GroupRegistry = require 'groups.registry'
local CGroup = require 'groups.class'
local db = require 'groups.db'

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
            group.grades = json.decode(group.grades--[[@as string]] )

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

            GroupRegistry[group.name] = CGroup.new({
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

lib.addCommand('group.admin', 'refreshgroups', loadGroups)

lib.addCommand('group.admin', 'setgroup', function(source, args)
    local player = Ox.GetPlayer(args.target)
    return player and player:setGroup(args.group, args.grade)
end, { 'target:number', 'group:string', 'grade:number' })
