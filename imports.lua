local file = ('%s/import.lua'):format(IsDuplicityVersion() and 'server' or 'client')
return load(LoadResourceFile('ox_core', file), ('@@ox_core/%s'):format(file))()
