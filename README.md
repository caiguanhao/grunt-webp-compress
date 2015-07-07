grunt-webp-compress
===================

Convert images to WebP format with the encoder tool `cwebp`.

This grunt plugin will download the cwebp binary for your system (Linux, Mac or
Windows) from a [mirror](https://github.com/cghio/webp) of [the official webp
downloads repository](http://downloads.webmproject.org/releases/webp/index.html).

## Getting Started

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out
the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains
how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins. Once you're familiar with that process, you may
install this plugin with this command:

```shell
npm install grunt-webp-compress --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile
with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-webp-compress');
```

## Options

### arguments

Type: `Array`   Default: `[]`

List of arguments added to the `cwebp` command.

### concurrency

Type: `Number (integer)`   Default: `10`   Range: `1-99`

Number of `cwebp` commands to run at the same time.

### cwebpPath

Type: `String`   Default: `undefined`

Specify the file path to the `cwebp` binary.

## Examples

Generate webp images in the same directory:

```js
grunt.initConfig({
  cwebp: {
    images: {
      options: {
        arguments: [ '-q', 50 ],
        concurrency: 20
      },
      files: [
        { src: [ 'public/images/*.jpg', 'public/images/*.png' ] }
      ]
    }
  }
});
```

Put webp images into another directory:

```js
grunt.initConfig({
  cwebp: {
    images: {
      files: {
        'public/images/webp/': [
          'public/images/*.jpg',
          'public/images/*.png'
        ]
      }
    }
  }
});
```

File-to-file:

```js
grunt.initConfig({
  cwebp: {
    images: {
      files: {
        'public/images/webp.webp': 'public/images/jpg.jpg'
      }
    }
  }
});
```

## Developer

* caiguanhao &lt;caiguanhao@gmail.com&gt;
