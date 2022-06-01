local Query = {
	SELECT_GROUPS = 'SELECT * FROM ox_groups',
	REMOVE_USER_FROM_GROUP = 'DELETE FROM user_groups WHERE charid = ? AND name = ?',
	UPDATE_USER_GROUP = 'INSERT INTO user_groups (charid, name, grade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE grade = VALUES(grade)',
}

local groups

local CGroup = {}
CGroup.__index = CGroup

function CGroup:add(player, grade)
	lib.addPrincipal(player.source, ('%s:%s'):format(self.principal, grade))
	player.groups[self.name] = grade
end

function CGroup:remove(player, grade)
	lib.removePrincipal(player.source, ('%s:%s'):format(self.principal, grade))
	player.groups[self.name] = nil
end

function CGroup:set(player, grade)
	if not self.grades[grade] and grade > 0 then
		error(("attempted to set invalid grade '%s' for group '%s' on 'player.%s'"):format(grade, self.name, player.source))
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

	TriggerEvent('ox_groups:setGroup', player.source, self.name, grade)
	TriggerClientEvent('ox_groups:setGroup', player.source, self.name, grade)

	return true
end

local function loadGroups()
	local results = MySQL.query.await(Query.SELECT_GROUPS)

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
		group.grades = json.decode(group.grades)

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
	end
end

MySQL.ready(loadGroups)

lib.addCommand('group.admin', 'refreshgroups', loadGroups)

lib.addCommand('group.admin', 'setgroup', function(source, args)
	Ox.SetPlayerGroup(args.target, args.group, args.grade)
end, {'target:number', 'group:string', 'grade:number'})

-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

function Ox.GetGroup(name)
	return groups[name]
end
