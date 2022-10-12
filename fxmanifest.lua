--[[ FX Information ]]--
fx_version   'cerulean'
use_experimental_fxv2_oal 'yes'
lua54        'yes'
game         'gta5'

--[[ Resource Information ]]--
name         'ox_core'
version      '0.9.0'
description  'What have I done?'
license      'MIT'
author       'overextended'
repository   'https://github.com/overextended/ox_core'

--[[ Manifest ]]--
dependencies {
	'/server:5904',
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
    'server/functions.lua',
    'server/class.lua',
    'server/init.lua',
    'server/debug.lua',
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*',
	'imports/client.lua',
	'imports/client/**.lua',
	'shared/files/*.json'
}
