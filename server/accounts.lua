local Query = {
    VALIDATE_USER_EXISTS = 'SELECT 1 FROM characters WHERE charid = ?',
    VALIDATE_GROUP_EXISTS = 'SELECT 1 FROM ox_groups WHERE name = ?',
    SELECT_USER_ACCOUNT = 'SELECT balance FROM user_accounts WHERE charid = ? AND account = ?',
    SELECT_GROUP_ACCOUNT = 'SELECT balance FROM group_accounts WHERE `group` = ? AND account = ?',
    UPDATE_USER_ACCOUNT = 'INSERT INTO user_accounts (charid, account, balance) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = VALUES(balance)',
    UPDATE_GROUP_ACCOUNT = 'INSERT INTO group_accounts (`group`, account, balance) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = VALUES(balance)',
}

local accounts = {}

---Fetch the balance of an account in the database.
---@param owner number | string
---@param account string
local function fetchAccount(owner, account)
    return MySQL.prepare.await(type(owner) == 'number' and Query.SELECT_USER_ACCOUNT or Query.SELECT_GROUP_ACCOUNT, { owner, account })
end

---Updates the balance of an account in the database.
---@param owner number | string
---@param account string
---@param balance number
local function saveAccount(owner, account, balance)
    MySQL.prepare(type(owner) == 'number' and Query.UPDATE_USER_ACCOUNT or Query.UPDATE_GROUP_ACCOUNT, { owner, account, balance })
end

---@class CAccount
local CAccount = {}
CAccount.__index = CAccount

---Get the current balance for the account.
---@param account string
---@return number
function CAccount:get(account)
    local balance = self[account]

    if balance then return balance end

    self[account] = fetchAccount(self.owner, account) or 0

    return self[account]
end

---Sets the account's balance to the specified amount.
---@param account string
---@param amount number
function CAccount:set(account, amount)
    if account == self.owner then return end
    amount = math.floor(amount + 0.5)
    self[account] = amount
    saveAccount(self.owner, account, amount)
end

---Adds the specified amount to the account's balance.
---@param account string
---@param amount number
function CAccount:add(account, amount)
    if account == self.owner then return end
    amount = math.floor(amount + 0.5)

    if not self[account] then
        self[account] = fetchAccount(self.owner, account) or 0
    end

    self[account] += amount
    saveAccount(self.owner, account, self[account])
end

---Removes the specified amount from the account's balance.
---@param account string
---@param amount number
function CAccount:remove(account, amount)
    if account == self.owner then return end
    amount = math.floor(amount + 0.5)

    if not self[account] then
        self[account] = fetchAccount(self.owner, account) or 0
    end

    self[account] -= amount
    saveAccount(self.owner, account, self[account])
end

---@param owner number|string The owner's character id, or a group name.
---@return CAccount
function Ox.GetAccounts(owner)
    if not accounts[owner] then
        local ownerType = type(owner)

        if ownerType == 'number' then
            if not MySQL.scalar.await(Query.VALIDATE_USER_EXISTS, { owner }) then
                error(("Attempted to load accounts for a non-existent character id '%s'"):format(owner))
            end
        elseif ownerType == 'string' then
            if not MySQL.scalar.await(Query.VALIDATE_GROUP_EXISTS, { owner }) then
                error(("Attempted to load accounts for a non-existent group '%s'"):format(owner))
            end
        else
            error(("Attempted to load accounts for an invalid owner type '%s'"):format(ownerType))
        end

        accounts[owner] = setmetatable({
            owner = owner
        }, CAccount)
    end

    return accounts[owner]
end

function Ox.AccountExports()
    return {
        get = true,
        set = true,
        add = true,
        remove = true,
    }
end

---API entry point for triggering account methods.
---@param source number
---@param method string
---@param ... unknown
---@return unknown
function Ox.CAccount(source, method, ...)
    local _accounts = Ox.GetAccounts(source)
    return _accounts[method](_accounts, ...)
end
