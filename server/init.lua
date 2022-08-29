Server = {
    PRIMARY_IDENTIFIER = GetConvar('ox:primaryIdentifier', 'fivem'),
}

db = {}

SetConvarReplicated('inventory:framework', 'ox')
SetConvarReplicated('inventory:trimplate ', 'false')

---@diagnostic disable-next-line: param-type-mismatch
SetConvarReplicated('pe-basicloading:disableAutoShutdown', 1)

if GetExport('npwd') then
    SetConvar('npwd:useResourceIntegration', 'true')
    SetConvar('npwd:database', json.encode({
        playerTable = 'characters',
        identifierColumn = 'charid',
    }))
end
