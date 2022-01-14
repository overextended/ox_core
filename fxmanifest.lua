fx_version   'cerulean'
use_fxv2_oal 'yes'
lua54        'yes'
game         'gta5'

author 'You'
version '1.0.0'

server_script '@oxmysql/lib/MySQL.lua'

shared_scripts {
    '@pe-lualib/init.lua',
    'shared/**.lua'
}

client_script 'client/**.lua'
server_script 'server/**.lua'

files {
    'imports.lua'
}