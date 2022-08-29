--[[ FX Information ]]--
fx_version   'cerulean'
use_experimental_fxv2_oal 'yes'
lua54        'yes'
game         'gta5'

--[[ Resource Information ]]--
name         'ox_core'
version      '0.5.0'
description  'What have I done?'
license      'MIT'
author       'overextended'
repository   'https://github.com/overextended/ox_core'

--[[ Manifest ]]--
dependencies {
	'/server:5104',
	'/onesync',
}

shared_scripts {
	'@ox_lib/init.lua',
    'shared/**.lua',
}

client_scripts {
    'client/init.lua',
	'client/events.lua',
    'client/player.lua',
    'client/spawn.lua',
    'client/death.lua',
    'client/debug.lua',
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
    'server/init.lua',
    'server/functions.lua',
    'server/groups.lua',
    'server/accounts.lua',
    'server/player/db.lua',
    'server/player/registry.lua',
    'server/player/class.lua',
    'server/player/events.lua',
    'server/player/main.lua',
    'server/vehicle/db.lua',
    'server/vehicle/registry.lua',
    'server/vehicle/class.lua',
    'server/vehicle/main.lua',
    'server/vehicle/commands.lua',
    'server/debug.lua',
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*',
	'imports/client.lua',
	'imports/client/**.lua',
	'files/**.*'
}
