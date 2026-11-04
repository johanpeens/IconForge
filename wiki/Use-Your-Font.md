# Use your font

You made a font. Here is how to put the icons on a web page.

## What you get

Icon Forge saves five files in a folder named after your font, for example `myicons`:

| File | What it is |
|---|---|
| `myicons.css` | The styles. This is the one you link to. |
| `myicons.woff2` | The font file. Small. Works in all modern browsers. |
| `myicons.woff` | The font file. For older browsers. |
| `myicons.ttf` | The font file. For desktop and other apps. |
| `preview.html` | A page that shows all your icons |

Find the folder with the **Open folder** button. Or look in [Your files](Your-Files.md).

## Use it on a website

| Step | What to do |
|---|---|
| 1 | Copy the whole font folder into your website. |
| 2 | Add the CSS file to your page: |
| 3 | Add an icon where you want it: |

```html
<link rel="stylesheet" href="myicons/myicons.css">

<i class="myicons myicons-terrier-01"></i>
```

- The first class (`myicons`) is the font.
- The second class (`myicons-terrier-01`) is the icon you want.
- Keep all the files in the same folder. The CSS finds the font files next to it.

## Change the size and colour

An icon font acts like text. Use normal CSS:

```css
.myicons {
  font-size: 48px;   /* size */
  color: #4f46e5;    /* colour */
}
```

You can also add one icon to a button:

```html
<button><i class="myicons myicons-terrier-01"></i> Say hello</button>
```

## Find the right class name

- Open `preview.html`.
- Click an icon. Its class is copied.
- Paste it into your page.

## Good to know

- Font icons have **one colour**. That is why they are easy to recolour.
- White background shapes are left out of the font on purpose.
- If an icon does not show, check that the `.css` path is right and the font files are beside it.
