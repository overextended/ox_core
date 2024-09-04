---@diagnostic disable: redundant-parameter
---@class OxAccountServer : OxClass
local OxAccount = lib.class('OxAccount')

function OxAccount:__index(index)
    local value = OxAccount[index] --[[@as any]]

    if type(value) == 'function' then
        self[index] = value == OxAccount.__call and function(...)
            return value(self, index, ...)
        end or function(...)
            return value(self, ...)
        end

        return self[index]
    end

    return value
end

function OxAccount:constructor(data)
    for k, v in pairs(data) do
        self[k] = v
    end
end

function OxAccount:__call(...)
    return exports.ox_core:CallAccount(self.accountId, ...)
end

function OxAccount:__tostring()
    return json.encode(self, { indent = true })
end

for method in pairs(exports.ox_core:GetAccountCalls() or {}) do
    if not rawget(OxAccount, method) then OxAccount[method] = OxAccount.__call end
end

local function CreateAccountInstance(account)
    if not account then return end

    return OxAccount:new(account)
end

---@class OxServer
local Ox = Ox

function Ox.GetAccount(accountId)
    local account = exports.ox_core:GetAccount(accountId)
    return CreateAccountInstance(account)
end

function Ox.GetCharacterAccount(charId)
    local account = exports.ox_core:GetCharacterAccount(charId)
    return CreateAccountInstance(account)
end

function Ox.GetGroupAccount(groupName)
    local account = exports.ox_core:GetGroupAccount(groupName)
    return CreateAccountInstance(account)
end

function Ox.CreateAccount(owner, label)
    local account = exports.ox_core:CreateAccount(owner, label)
    return CreateAccountInstance(account)
end
