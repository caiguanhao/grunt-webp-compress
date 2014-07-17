grunt-cwebp
===========

Convert images to WebP format with the encoder tool cwebp.

This grunt plugin will download the cwebp binary for your system (Linux, Mac or
Windows) from a [mirror](https://github.com/cghio/webp) of [the official webp
repository](https://code.google.com/p/webp/downloads/list).

## Getting Started

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out
the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains
how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins. Once you're familiar with that process, you may
install this plugin with this command:

```shell
npm install grunt-cwebp --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile
with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-cwebp');
```

## Options

### arguments

Type: `Array`   Default: `[]`

List of arguments added to the cwebp command.

## Example

```js
grunt.initConfig({
  cwebp: {
    images: {
      options: {
        arguments: [ '-q', 50 ]
      },
      files: [
        { src: [ 'public/images/*.jpg', 'public/images/*.png' ] }
      ]
    }
  }
});
```

## Developer

* caiguanhao &lt;caiguanhao@gmail.com&gt;
