'use strict'

class SPPing {
	constructor(mod) {
		this.min = this.max = this.avg = 0
		this.history = []

		let timeout = null,
			waiting = false,
			lastSent = 0

		const ping = () => {
			clearTimeout(timeout)
			mod.send('C_REQUEST_GAMESTAT_PING', 1)
			waiting = true
			lastSent = Date.now()
			timeout = setTimeout(ping, mod.settings.ping.timeout)
		}

		mod.hook('S_SPAWN_ME', 'raw', () => {
			clearTimeout(timeout)
			timeout = setTimeout(ping, mod.settings.ping.interval)
		})

		mod.hook('S_LOAD_TOPO', 'raw', () => { clearTimeout(timeout) })
		mod.hook('S_RETURN_TO_LOBBY', 'raw', () => { clearTimeout(timeout) })

		mod.hook('S_RESPONSE_GAMESTAT_PONG', 'raw', () => {
			const result = Date.now() - lastSent

			clearTimeout(timeout)

			if(!waiting) this.history.pop() // Oops! We need to recalculate the last value

			this.history.push(result)

			if(this.history.length > mod.settings.ping.maxHistory) this.history.shift()

			// Recalculate statistics variables
			this.min = this.max = this.history[0]
			this.avg = 0

			for(let p of this.history) {
				if(p < this.min) this.min = p
				else if(p > this.max) this.max = p

				this.avg += p
			}

			this.avg /= this.history.length

			waiting = false
			timeout = setTimeout(ping, mod.settings.ping.interval - result)
		})
	}
}

module.exports = SPPing