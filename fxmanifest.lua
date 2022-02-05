--[[ FX Information ]]--
fx_version   'cerulean'
use_fxv2_oal 'yes'
lua54        'yes'
game         'gta5'

--[[ Resource Information ]]--
name         'ox_core'
author       'Overextended'
version      '0.0.1'
repository   'https://github.com/overextended/notaframework'
description  'What have I done?'

--[[ Manifest ]]--
dependencies {
	'/server:5104',
	'/onesync',
	'pe-lualib',
}

shared_scripts {
	'@pe-lualib/init.lua',
    'shared/**.lua',
}

client_scripts {
    'client/**.lua',
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
	'@ox_groups/server/groups.lua',
	'@ox_accounts/server/accounts.lua',
    'server/init.lua',
    'server/functions.lua',
    'server/classes/player.lua',
    'server/classes/vehicle.lua',
	'server/commands.lua',
    'server/main.lua',
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*',
    'imports.lua',
}
