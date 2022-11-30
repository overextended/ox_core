Server = {
    PRIMARY_IDENTIFIER = GetConvar('ox:primaryIdentifier', 'license2'),
}

---@diagnostic disable-next-line: param-type-mismatch
SetConvarReplicated('pe-basicloading:disableAutoShutdown', 1)

if GetExport('ox_inventory') then
    SetConvarReplicated('inventory:framework', 'ox')
    SetConvarReplicated('inventory:trimplate ', 'false')
end

if GetExport('npwd') then
    SetConvar('npwd:useResourceIntegration', 'true')
    SetConvar('npwd:database', json.encode({
        playerTable = 'characters',
        identifierColumn = 'charid',
    }))
end

require 'groups.main'
require 'status.main'
require 'license.main'
require 'player.main'
require 'vehicle.main'
