<img src="wiki/images/app-icon.png" alt="Icon Forge app icon" width="96" align="right">

# Icon Forge

**Type a word. Get a set of icons. Turn them into an icon font.**
It all happens on your own PC. No account. No cloud.

**Built with:** Electron and Node.js, with the Flux Schnell image model running locally through stable-diffusion.cpp (Vulkan) and VTracer to turn pictures into SVG.

![Icon Forge picking icons](wiki/images/09-pick-icons.png)

## Get it (nothing else to install)

**[Download Icon Forge for Windows](https://github.com/johanpeens/IconForge/releases/latest/download/Icon-Forge-Setup.exe)** (170 MB)

1. **Run the file you downloaded.** If Windows says "Windows protected your PC", click **More info**, then **Run anyway**. (The installer is not signed yet, so Windows warns about every new app.)
2. **Open Icon Forge.** The installer adds anything your PC is missing (Windows asks once, click **Yes**). No Python, no ComfyUI, no setup.
3. **Press Download** when it asks for the AI model. It is a one-time download (17.2 GB) and the app finds it by itself afterwards.

That is all. You need Windows 10 or 11 (64-bit), a graphics card that supports Vulkan, and about 20 GB of free disk space. See the [first start guide](wiki/First-Start.md) if you want screenshots of each step.

## Why use it

- **Free.** No subscription, no credits, no sign-up.
- **Private.** The pictures are made on your PC. Your words never leave it.
- **Works offline.** You go online once, to download the AI model.
- **One installer.** No Python, no ComfyUI.
- **Clean SVG icons.** Sharp at any size. You can change the colour.
- **Fix them before you use them.** Flip, turn, resize, move, delete stray dots.
- **Copy with one right-click.** Copy any icon as SVG or as a picture, then paste it anywhere.
- **Keep and reuse your icons.** A library of every set you made. Search it, reuse icons, delete what you do not need (it goes to the Recycle Bin).
- **Vary an icon.** Pick an icon, change the words, and the AI draws new versions of it. Your prompt is saved inside each icon.
- **Preview on dark.** Check your icons on any background colour, at any size up to 512 px, then download them all as a zip with the icon font inside.
- **Icon font in one click.** Best way to use your icons on a website or in an app: one small file, any size, any colour. You get `.ttf`, `.woff`, `.woff2`, a `.css` file and a preview page.
- **Icons that are really yours.** Most websites use the same stock icon packs, so many sites look alike. Icon Forge draws icons for your own words, so yours stand out.
- **Nothing is lost.** Your basket, your edits and your font name are saved. Close the app and carry on later.

## Help and guides

Everything is explained in simple words on the **[Wiki](wiki/Home.md)**:
[Installation](wiki/Installation.md) · [Download the model](wiki/Download-the-Model.md) · [Make icons](wiki/Step-1-Keywords.md) · [Use your font](wiki/Use-Your-Font.md) · [Troubleshooting](wiki/Troubleshooting.md) · [FAQ](wiki/FAQ.md)

## For developers

<details>
<summary><strong>Build it yourself</strong> (you do not need this to use the app)</summary>

You need [Node.js](https://nodejs.org/) (version 24 was used) and Windows.

```bash
npm install
npm run engine   # downloads the image engine (about 30 MB) into ./engine
npm start        # runs the app
npm run dist     # builds the installer into ./dist
```

The image engine is not stored in this repository. It is a separate open-source program, so `npm run engine` downloads the exact version the app was tested with.

### How it is put together

| Part | What it does |
|---|---|
| `main.js` | The app window and the purple welcome screen |
| `server.js` | A small local server that the window talks to (this PC only) |
| `generate.js` | Starts the image engine and draws the icons |
| `modelstore.js` | Finds and downloads the AI model |
| `svgedit.js` | Flip, resize and delete-shape edits |
| `fontmaker.js` | Builds the icon font files |
| `public/` | The screens you see |
| `wiki/` | The pages of the project wiki |

</details>

## Credits

Icon Forge is built on other people's open work:
**FLUX.1 [schnell]** by Black Forest Labs (Apache 2.0), **stable-diffusion.cpp** by leejet and contributors (MIT), **VTracer** by Vision Cortex (MIT), **Electron** (MIT), and the font tools svg2ttf, ttf2woff and wawoff2.
See [Credits and licences](wiki/Credits-and-Licences.md).
