// Using an OOP approach, classes-objects-methods, modular design

//handles the upgrades, upgrade 
class Upgrade {
    constructor(id, name, cost, increase) { //each upgrade has a name cost etc, these are properties of class, constructor is what makes it into an object
        this._id = id;  //_ indicates that the property is private only available within the class
        this._name = name;
        this._cost = cost;
        this._increase = increase;
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get cost() { return this._cost; }
    get increase() { return this._increase; }
}

// Shop class responsible for implementing upgrades
class Shop {
    constructor() {
        this._upgrades = [];
    }

    addUpgrade(upgrade) {
        this._upgrades.push(upgrade);
    }

    get upgrades() { return this._upgrades; }

    // maps and upgrades array to HTML elements, joins them into shop display.
    render(shopElement, purchaseCallback) {
        shopElement.innerHTML = this._upgrades.map(upgrade => `
            <div class="shopItemContainer" data-id="${upgrade.id}">
                <p>${upgrade.name}</p>
                <p>Cost: ${upgrade.cost}</p>
                <p>CPS: ${upgrade.increase}</p>
                <button>Buy</button>
            </div>
        `).join('');

        shopElement.querySelectorAll('button').forEach((button, index) => {
            button.addEventListener('click', () => purchaseCallback(this._upgrades[index]));
        });
    }
}

// cookie class tracks clicks, updates count, and notifies callback when cookie clicked.
class Cookie {
    constructor() {
        this._count = 0;
        this._element = document.getElementById('bigCookie');
    }

    onClick(callback) {
        this._element.addEventListener('click', () => {
            this._count++;
            callback(this._count);
        });
    }
    //adds one to the count

    get count() { return this._count; }
    set count(value) { this._count = value; }
}

// game class manages game state, cookies, shop, display elements, and cookie rain.
class Game {
    constructor() {
        this._cookies = 0;
        this._displayedCookies = 0;
        this._cps = 0;
        this._purchases = [];
        this._cookie = new Cookie();
        this._shop = new Shop();
        this._shopElement = document.getElementById('shop');
        this._cookieCountElement = document.getElementById('cookieCount');
        this._cpsElement = document.getElementById('cPs');
        this._progressBar = document.getElementById('progress');
        //Make it rain
        this._cookieRainInterval = null;
        this._cookieRainRate = 1000; // Initial rate (1 cookie per second)
        this.init();
        this.startCookieRain(); // Start the cookie rain
    }

    //game init: loads state, gets upgrades, sets listeners, starts loops.
    init() {
        this.loadGameState();
        this.fetchUpgrades();
        this.setupEventListeners();
        this.startGameLoop();
        this.startSmoothCookieDisplay();
    }

    //get upgrades from api
    async fetchUpgrades() {
        try {
            const response = await fetch('https://cookie-upgrade-api.vercel.app/api/upgrades');
            const data = await response.json();
            data.forEach(upgrade => this._shop.addUpgrade(new Upgrade(upgrade.id, upgrade.name, upgrade.cost, upgrade.increase)));
            this._shop.render(this._shopElement, this.purchaseItem.bind(this));
        } catch (error) {
            console.error('Failed to fetch upgrades:', error);
        }
    }

    //checks affordability, deducts cost, updates purchases, increases CPS, and saves the game state.
    purchaseItem(item) {
        if (item.cost > this._cookies) {
            alert('You cannot afford this!');
            return;
        }
        this._cookies -= item.cost;
        this._purchases.push(item);
        this._cps += item.increase;
        this.saveGameState();
    }

    //smoothly updates displayed cookie count by interpolating toward the actual value every 100ms.
    startSmoothCookieDisplay() {
        setInterval(() => {
            const diff = this._cookies - this._displayedCookies;
            this._displayedCookies += Math.ceil(diff / 10);

            if (Math.abs(this._displayedCookies - this._cookies) > 50) {
                this._displayedCookies = this._cookies;
            }

            this._cookieCountElement.textContent = `Cookies: ${Math.floor(this._displayedCookies)}`;
        }, 100);
    }
    //saves the current game state (cookies, CPS, purchases) to localStorage as a JSON object.
    saveGameState() {
        const gameState = {
            cookies: this._cookies,
            cps: this._cps,
            purchases: this._purchases
        };
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    //loads the saved game state from localStorage and updates cookies, CPS, and purchases accordingly.
    loadGameState() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this._cookies = state.cookies || 0;
            this._displayedCookies = state.cookies || 0;
            this._cps = state.cps || 0;
            this._purchases = state.purchases || [];
        }
    }

    //attaches an event listener to the cookie element to increment cookies and save the game state on click.

    setupEventListeners() {
        this._cookie.onClick(() => {
            this._cookies++;
            this.saveGameState();
        });
    }

    // manages game progression by incrementing cookies, saving state, updating UI, and cookie rain rate.
    startGameLoop() {
        setInterval(() => {
            this._cookies += this._cps;
            this.saveGameState();
            this._cpsElement.textContent = `Cookies per Second: ${this._cps}`;
            this._progressBar.style.width = `${(this._cookies % 100) || 100}%`;
            this.updateCookieRainRate(); // Update the cookie rain rate
        }, 1000);
    }
    //starts an interval that creates falling cookie elements at a rate based on _cookieRainRate.
    startCookieRain() {
        this._cookieRainInterval = setInterval(() => {
            this.createFallingCookie();
        }, this._cookieRainRate);
    }
    //creates animated falling cookie elements at random positions and REMOVES them after animation.
    createFallingCookie() {
        const cookie = document.createElement('div');
        cookie.textContent = '🍪';
        cookie.classList.add('cookieRain');
        cookie.style.left = `${Math.random() * 100}vw`; // Random horizontal position
        cookie.style.animationDuration = `${Math.random() * 3 + 2}s`; // Random fall speed
        document.body.appendChild(cookie);

        // remove the cookie element after it falls off the screen
        setTimeout(() => {
            cookie.remove();
        }, 4789); // Adjust timeout based on animation duration
    }

    updateCookieRainRate() {
        // increase the rate of falling cookies as the player's cookie count increases
        const newRate = Math.max(100, 1000 - this._cookies * 0.1); // formula for rate, needs debugging to finout limits
        if (newRate !== this._cookieRainRate) {
            this._cookieRainRate = newRate;
            clearInterval(this._cookieRainInterval);
            this.startCookieRain();
        }
    }
}

// starts game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});

// Dropdown shop menu
document.addEventListener('DOMContentLoaded', () => {
    const shopToggle = document.getElementById('shopToggle');
    const shopContainer = document.getElementById('shopContainer');

    shopToggle.addEventListener('click', () => {
        shopContainer.classList.toggle('open');
        
        shopToggle.textContent = shopContainer.classList.contains('open') 
            ? 'Upgrades ▲' 
            : 'Upgrades ▼';
    });
});