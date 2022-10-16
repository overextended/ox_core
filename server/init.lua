Server = {
    PRIMARY_IDENTIFIER = GetConvar('ox:primaryIdentifier', 'fivem'),
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
require 'player.main'
require 'vehicle.main'
