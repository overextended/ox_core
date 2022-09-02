local Query = {
    SELECT_GROUPS = 'SELECT * FROM ox_groups',
    REMOVE_USER_FROM_GROUP = 'DELETE FROM user_groups WHERE charid = ? AND name = ?',
    UPDATE_USER_GROUP = 'INSERT INTO user_groups (charid, name, grade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE grade = VALUES(grade)',
}

local groups

local CGroup = {}
CGroup.__index = CGroup

---Adds a player to a group and grants permissions based on their grade.
---@param player CPlayer
---@param grade number
function CGroup:add(player, grade)
    lib.addPrincipal(player.source, ('%s:%s'):format(self.principal, grade))
    player.groups[self.name] = grade
    GlobalState[('%s:count'):format(self.name)] += 1
end

---Removes a player from a group and revokes permissions.
---@param player CPlayer
---@param grade number
function CGroup:remove(player, grade)
    lib.removePrincipal(player.source, ('%s:%s'):format(self.principal, grade))
    player.groups[self.name] = nil
    GlobalState[('%s:count'):format(self.name)] -= 1
end

---Sets a players grade in a group and updates their permissions.
---@param player CPlayer
---@param grade number?
---@return boolean?
function CGroup:set(player, grade)
    if not grade then grade = 0 end

    if not self.grades[grade] and grade > 0 then
        error(("Attempted to set group '%s' to invalid grade '%s for player.%s"):format(self.name, grade, player.source))
    end

    local currentGrade = player.groups[self.name]

    if currentGrade then
        self:remove(player, currentGrade)
    end

    if grade < 1 then
        if not currentGrade then return end
        grade = nil
        MySQL.prepare(Query.REMOVE_USER_FROM_GROUP, { player.charid, self.name })
    else
        MySQL.prepare(Query.UPDATE_USER_GROUP, { player.charid, self.name, grade })
        self:add(player, grade)
    end

    TriggerEvent('ox:setGroup', player.source, self.name, grade)
    TriggerClientEvent('ox:setGroup', player.source, self.name, grade)

    return true
end

---Load groups from the database and creates permission groups.
local function loadGroups()
    local results = MySQL.query.await(Query.SELECT_GROUPS)

    if not results then return end

    if groups then
        for name, data in pairs(groups) do
            local parent = data.principal

            lib.removeAce(parent, parent)

            for j = 0, #data.grades do
                local child = ('%s:%s'):format(data.principal, j)
                lib.removeAce(child, child)
                lib.removePrincipal(child, parent)
                parent = child
            end
        end
    end

    groups = table.create(0, #results)

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

        groups[group.name] = setmetatable({
            name = group.name,
            label = group.label,
            grades = group.grades,
            principal = principal,
        }, CGroup)

        GlobalState[principal] = groups[group.name]
        GlobalState[('%s:count'):format(group.name)] = 0
    end
end

MySQL.ready(loadGroups)

lib.addCommand('group.admin', 'refreshgroups', loadGroups)

lib.addCommand('group.admin', 'setgroup', function(source, args)
    local player = Ox.GetPlayer(args.target)
    return player and player.setGroup(args.group, args.grade)
end, {'target:number', 'group:string', 'grade:number'})

-----------------------------------------------------------------------------------------------
--    Interface
-----------------------------------------------------------------------------------------------

---Return data associated with the given group name.
---@param name string
---@return table?
function Ox.GetGroup(name)
    local group = groups[name]

    if not group then
        error(("No group exists with name '%s'"):format(filter))
    end

    return group
end
