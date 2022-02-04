server.PRIMARY_INDENTIFIER = 'discord'

-- Disable population in routing bucket id 60
-- This routing bucket will be used during character selection
SetRoutingBucketPopulationEnabled(60, false)

SetConvarReplicated('inventory:framework', 'ox')
SetConvarReplicated('inventory:trimplate ', 'false')
SetConvar('npwd:useResourceIntegration', 'true')
SetConvar('npwd:database', json.encode({
	playerTable = 'characters',
	identifierColumn = 'charid',
}))
