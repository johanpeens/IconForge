# Troubleshooting

Find your problem in the table.

## Installing and starting

| Problem | What to do |
|---|---|
| Windows says **"Windows protected your PC"** | Click **More info**, then **Run anyway**. The installer is not signed yet. See [Installation](Installation). |
| The app does not open a second time | Only one Icon Forge can run at once. Look for the first window. |

## The model

| Problem | What to do |
|---|---|
| It says **"Flux model not installed"** | Open Settings (the gear). Download the model or pick one you have. See [Download the model](Download-the-Model). |
| **Not enough free space** | Press **Change folder…** and choose a drive with at least 20 GB free. |
| The download stopped | Check your internet. Press **Download** again. It carries on from where it stopped. |
| **"That file is too small"** | You picked the wrong file. You need `flux1-schnell-fp8.safetensors` (17.2 GB). |

## Making icons

| Problem | What to do |
|---|---|
| The first icon takes a long time | This is normal. The 17 GB model is loading. It takes about a minute extra, once per session. |
| Nothing moves for a few minutes | Wait up to 3 minutes. Then press **Stop generating** and try again. |
| An icon shows a **red cross** | That icon did not finish. Icon Forge already tried three times. Press Generate again. |
| Icons keep failing | Update your graphics driver. Close other apps that use the graphics card (games, video editors). Then try again. |
| **"The image engine stopped"** | The picture engine crashed. This is usually a graphics driver problem. Update the driver and try again. |
| It is very slow | A weaker graphics card is slower. Try **Simple** detail. Draw fewer icons at once. |

## The icons

| Problem | What to do |
|---|---|
| An icon looks strange | The AI makes mistakes. Skip it in step 2, or press **Make 5 more**. |
| Stray dots on an icon | Use **Clean up** in [Step 3](Step-3-Edit-SVGs). |
| An icon is off to one side | Use **Fit to canvas** in [Step 3](Step-3-Edit-SVGs). |

## The font

| Problem | What to do |
|---|---|
| The icons do not show on my website | Check the path to the `.css` file. Keep the font files in the same folder as the `.css`. |
| I see a square instead of an icon | The font file did not load. Check that the folder was copied in full. |
| The class name has changed | Class names come from the font name and icon names. Change them in [Step 4](Step-4-Basket-and-Font). |

## Still stuck?

Open an issue on the project page. Tell us:

- Your Windows version
- Your graphics card
- What you pressed and what you saw
- A screenshot, if you can
