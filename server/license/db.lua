local MySQL = MySQL
local db = {}

local SELECT_LICENSES = 'SELECT `name`, `label` FROM ox_licenses'
---Fetch all licenses from the database.
---@return table<number, { name: string, label: string }>
function db.selectLicenses()
    return MySQL.query.await(SELECT_LICENSES)
end

return db
