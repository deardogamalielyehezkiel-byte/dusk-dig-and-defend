# Dusk Dig And Defend

Create a complete 2D side-scrolling survival and crafting game inspired by Minecraft using React and Tailwind CSS.

Core Features:

1. World & Movement: Generate a grid-based world with layered blocks (grass, dirt, stone, wood, and leaves). The player can move left/right and jump using WASD or Arrow keys, with smooth physics and collision.

2. Mining & Placing: Left-click on any block within a short radius to mine/destroy it. The block goes into the inventory. Right-click on an empty grid space to place the currently selected block from the inventory.

3. Inventory & Crafting: Add a UI overlay for the inventory. Include a simple crafting button: 4 woods can be crafted into a wooden sword, and 5 stones can be crafted into a stone pickaxe.

4. Day/Night Cycle & Survival: Implement a day/night timer. During the night, the screen darkens, and simple zombie enemies spawn. Zombies move towards the player and damage the player's health bar (100 HP).

5. Combat: The player can click near a zombie to attack it. If the player holds a sword, the damage to the zombie is doubled.

6. Mobile Controls: Add on-screen virtual buttons (Left, Right, Jump, Action) so it can be played on touchscreens (crucial for Poki mobile users).

Make the design clean, responsive, and fully playable inside the browser immediately.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dusk-dig-and-defend.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eb2954fc-64d1-48f9-9562-37268c89df44).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
