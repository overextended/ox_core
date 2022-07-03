--[[ FX Information ]]--
fx_version   'cerulean'
use_fxv2_oal 'yes'
lua54        'yes'
game         'gta5'

--[[ Resource Information ]]--
name         'ox_core'
version      '0.1.3'
description  'What have I done?'
license      'GPL-3.0-or-later'
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
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
    'server/init.lua',
    'server/functions.lua',
    'server/player/group.lua',
    'server/player/events.lua',
    'server/player/main.lua',
    'server/vehicle/main.lua',
    'server/vehicle/commands.lua',
    'server/main.lua',
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*',
	'imports/client.*',
	'files/**.*'
}
