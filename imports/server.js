const Ox = new Proxy(
	{},
	{
		get(target, prop) {
			const value = prop
				? prop === "toJSON"
					? JSON.stringify(target)
					: target[prop]
				: target;
			if (value) return value;

			if (prop) {
				target[prop] = (...args) => {
					return exports.ox_core[prop](...args);
				};

				return target[prop];
			}
		},
	}
);

(() => {
	const PlayerExports = Ox.PlayerExports();
	const CPlayer = {};

	CPlayer.getPed = (player, update) => {
		if (update | !player.ped) player.ped = GetPlayerPed(player.source);
		return player.ped;
	};

	CPlayer.getCoords = (player, update) => {
		if (update | !player.coords)
			player.coords = GetEntityCoords(player.getPed());

		return player.coords;
	};

	CPlayer.hasGroup = (player, filter) => {
		const type = typeof filter;

		if (type === "string") {
			const grade = player.groups[filter];

			if (grade) return [filter, grade];
		} else if (type === "object") {
			if (Array.isArray(filter)) {
				for (let i = 0; filter.length; i++) {
					const name = filter[i];
					const playerGrade = player.groups[name];

					if (playerGrade) return [name, playerGrade];
				}
			} else {
				for (const [name, grade] of Object.entries(filter)) {
					const playerGrade = player.groups[name];

					if (playerGrade && grade <= playerGrade) {
						return [name, playerGrade];
					}
				}
			}
		}
	};

	Ox.GetPlayer = (player) => {
		player = player?.source ? player : exports.ox_core.GetPlayer(player);

		const proxy = new Proxy(player, {
			get(target, prop) {
				const value = target[prop];
				if (value) return value;

				const method = CPlayer[prop];
				if (method) {
					return (...args) => {
						return method(proxy, ...args);
					};
				}

				const exp = PlayerExports[prop];
				if (exp) {
					return (...args) => {
						return exports.ox_core.CPlayer(
							target.source,
							prop,
							...args
						);
					};
				}
			},
		});

		return proxy;
	};

	Ox.GetPlayers = () => {
		const players = exports.ox_core.GetPlayers();

		for (let i = 0; i === players.length - 1; i++) {
			players[i] = Ox.GetPlayer(players[i]);
		}

		return players;
	};
})();
