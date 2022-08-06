Server = {
    PRIMARY_IDENTIFIER = GetConvar('ox:primaryIdentifier', 'fivem'),
}

SetRoutingBucketEntityLockdownMode(0, 'relaxed')

SetConvarReplicated('inventory:framework', 'ox')
SetConvarReplicated('inventory:trimplate ', 'false')

---@diagnostic disable-next-line: param-type-mismatch
SetConvarReplicated('pe-basicloading:disableAutoShutdown', 1)

if Resource('npwd') then
    SetConvar('npwd:useResourceIntegration', 'true')
    SetConvar('npwd:database', json.encode({
        playerTable = 'characters',
        identifierColumn = 'charid',
    }))
end
