--[[ FX Information ]]--
fx_version   'cerulean'
use_fxv2_oal 'yes'
lua54        'yes'
game         'gta5'

--[[ Resource Information ]]--
name         'ox_core'
version      '0.0.2'
description  'What have I done?'
license      'GPL-3.0-or-later'
author       'Overextended'
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
	'client/spawn.lua',
	'client/damages.lua',
	'client/death.lua',
	'client/main.lua',
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
	'@ox_groups/server/groups.lua',
	'@ox_accounts/server/accounts.lua',
	'server/init.lua',
	'server/functions.lua',
	'server/classes/player.lua',
	'server/commands.lua',
	'server/main.lua',
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*',
	  'imports.lua',
    'client/import.lua',
		'server/import.lua',
}
