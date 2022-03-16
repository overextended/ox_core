server.PRIMARY_IDENTIFIER = GetConvar('ox_core:primaryIdentifier', 'fivem')

-- Disable population in routing bucket id 60
-- This routing bucket will be used during character selection
SetRoutingBucketPopulationEnabled(60, false)

SetConvarReplicated('inventory:framework', 'ox')
SetConvarReplicated('inventory:trimplate ', 'false')
SetConvarReplicated('pe-basicloading:disableAutoShutdown', 1)
SetConvar('npwd:useResourceIntegration', 'true')
SetConvar('npwd:database', json.encode({
	playerTable = 'characters',
	identifierColumn = 'charid',
}))
