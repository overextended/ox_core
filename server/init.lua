Server = {
    PRIMARY_IDENTIFIER = GetConvar('ox:primaryIdentifier', 'fivem'),
}

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

db = {}

AddEventHandler('onResourceStop', function(resource)
    if resource == 'ox_core' then
        Player.saveAll()
    end
end)

RegisterCommand('logout', function(source)
    CreateThread(function()
        local player = Ox.GetPlayer(source)
        return player and player.logout()
    end)
end)
