local groups = {}
local functions = server.functions

-- MySQL.query('INSERT INTO groups (name, label, ranks) VALUES (?, ?, ?)', {
--     'ox', 'Overextended', json.encode({'pleb', 'OG'})
-- }, function(result)
--     print(json.encode(result, {indent=true}))
-- end)

MySQL.query('SELECT name, label, ranks FROM groups', function(result)
    for i = 1, #result do
        local column = result[i]
        local ranks = json.decode(column.ranks)

        for j = 1, #ranks do
            local rank = ranks[j]

            ranks[j] = {
                id = j,
                name = rank,
                label = functions.firstToUpper(rank),
            }

            if j == #ranks then ranks[j].boss = true end
        end

        local members = MySQL.query.await(('SELECT * FROM group_%s'):format(column.name))
        local membersIndex = table.create(0, #members)

        for j = 1, #members do
            local member = members[j]
            membersIndex[member.charid] = member.rank
        end

        groups[column.name] = {
            label = column.label,
            ranks = ranks,
            members = membersIndex
        }
    end

    Wait(0)
    server.ready(true)
end)

server.groups = groups
