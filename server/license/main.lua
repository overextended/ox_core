local LicenseRegistry = require 'server.license.registry'
local db = require 'server.license.db'

require 'server.license.events'

local function loadLicenses()
    local results = db.selectLicenses()

    if results then
        for i = 1, #results do
            local license = results[i]
            local name = license.name
            license.name = nil

            LicenseRegistry[name] = license
            GlobalState[('license.%s'):format(name)] = license
        end
    end
end

MySQL.ready(loadLicenses)

lib.addCommand('refreshlicense', {
    help = 'Refresh licenses (driver, weapon etc.)',
    restricted = 'group.admin',
}, loadLicenses)
