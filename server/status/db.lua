local MySQL = MySQL
local db = {}

local SELECT_STATUSES = 'SELECT `name`, `default`, `onTick` FROM ox_statuses'
---Fetch all groups from the database.
---@return table<number, { name: string, default: number }>
function db.selectStatuses()
    return MySQL.query.await(SELECT_STATUSES)
end

return db
