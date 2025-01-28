import fs from "fs";

class Color {
    red: number;
    green: number;
    blue: number;

    constructor() {
        this.red = 0;
        this.green = 0;
        this.blue = 0;
    }

    clamp(): void {
        this.red = Math.min(255, Math.max(0, this.red));
        this.green = Math.min(255, Math.max(0, this.green));
        this.blue = Math.min(255, Math.max(0, this.blue));
    }
}

class Image {
    width: number;
    height: number;
    pixels: Color[][];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.pixels = new Array(height);
        for (let i = 0; i < height; i++) {
            this.pixels[i] = new Array(width).fill(null).map(() => new Color());
        }
    }

    set(x: number, y: number, color: Color): void {
        this.pixels[y][x] = color;
    }

    get(x: number, y: number): Color {
        return this.pixels[y][x];
    }
}

class ImageEditor {
    static read(filePath: string): Image {
        const input = fs.readFileSync(filePath, "utf-8").split(/\s+/);

        if (input[0] !== "P3") {
            throw new Error("Invalid PPM format: Expected 'P3' header.");
        }

        let index = 1;
        const width = parseInt(input[index++], 10);
        const height = parseInt(input[index++], 10);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            throw new Error("Invalid image dimensions: width and height must be positive integers.");
        }

        const maxColorValue = parseInt(input[index++], 10);
        if (isNaN(maxColorValue) || maxColorValue !== 255) {
            throw new Error("Invalid or unsupported maximum color value. Expected 255.");
        }

        const image = new Image(width, height);

        let pixelIndex = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (index + 2 >= input.length) {
                    throw new Error(`Not enough pixel data to fill the image at (${x}, ${y}).`);
                }

                const red = parseInt(input[index++], 10);
                const green = parseInt(input[index++], 10);
                const blue = parseInt(input[index++], 10);

                if (
                    isNaN(red) || isNaN(green) || isNaN(blue) ||
                    red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255
                ) {
                    throw new Error(`Invalid pixel data at (${x}, ${y}): (${red}, ${green}, ${blue}).`);
                }

                const color = new Color();
                color.red = red;
                color.green = green;
                color.blue = blue;

                image.set(x, y, color);
                pixelIndex++;
            }
        }

        if (pixelIndex !== width * height) {
            throw new Error(`Mismatch in pixel count: expected ${width * height}, but got ${pixelIndex}`);
        }

        return image;
    }

    static applyEmboss(sourceImage: Image): Image {
        const outputImage = new Image(sourceImage.width, sourceImage.height);

        const kernel = [
            [-2, -1, 0],
            [-1,  1, 1],
            [ 0,  1, 2]
        ];

        for (let y = 1; y < sourceImage.height - 1; y++) {
            for (let x = 1; x < sourceImage.width - 1; x++) {
                const newColor = new Color();

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const neighborColor = sourceImage.get(x + kx, y + ky);
                        const weight = kernel[ky + 1][kx + 1];

                        newColor.red += neighborColor.red * weight;
                        newColor.green += neighborColor.green * weight;
                        newColor.blue += neighborColor.blue * weight;
                    }
                }

                newColor.clamp();
                outputImage.set(x, y, newColor);
            }
        }

        return outputImage;
    }

    static applyInvert(sourceImage: Image): Image {
        const outputImage = new Image(sourceImage.width, sourceImage.height);

        for (let y = 0; y < sourceImage.height; y++) {
            for (let x = 0; x < sourceImage.width; x++) {
                const color = sourceImage.get(x, y);
                const invertedColor = new Color();

                invertedColor.red = 255 - color.red;
                invertedColor.green = 255 - color.green;
                invertedColor.blue = 255 - color.blue;

                outputImage.set(x, y, invertedColor);
            }
        }

        return outputImage;
    }

    static applyGrayscale(sourceImage: Image): Image {
        const outputImage = new Image(sourceImage.width, sourceImage.height);

        for (let y = 0; y < sourceImage.height; y++) {
            for (let x = 0; x < sourceImage.width; x++) {
                const color = sourceImage.get(x, y);
                const grayscaleValue = Math.round((color.red + color.green + color.blue) / 3);

                const grayscaleColor = new Color();
                grayscaleColor.red = grayscaleValue;
                grayscaleColor.green = grayscaleValue;
                grayscaleColor.blue = grayscaleValue;

                outputImage.set(x, y, grayscaleColor);
            }
        }

        return outputImage;
    }

    static applyMotionBlur(sourceImage: Image): Image {
        const outputImage = new Image(sourceImage.width, sourceImage.height);

        for (let y = 0; y < sourceImage.height; y++) {
            for (let x = 0; x < sourceImage.width; x++) {
                const blurColor = new Color();
                let count = 0;

                for (let kx = 0; kx < 5; kx++) {
                    if (x + kx < sourceImage.width) {
                        const neighborColor = sourceImage.get(x + kx, y);

                        blurColor.red += neighborColor.red;
                        blurColor.green += neighborColor.green;
                        blurColor.blue += neighborColor.blue;
                        count++;
                    }
                }

                blurColor.red = Math.round(blurColor.red / count);
                blurColor.green = Math.round(blurColor.green / count);
                blurColor.blue = Math.round(blurColor.blue / count);

                blurColor.clamp();
                outputImage.set(x, y, blurColor);
            }
        }

        return outputImage;
    }

    static run(sourceImagePath: string, keyImagePath: string, filterType: string): void {
        const sourceImage = ImageEditor.read(sourceImagePath);

        let resultImage: Image;

        switch (filterType) {
            case "emboss":
                resultImage = ImageEditor.applyEmboss(sourceImage);
                break;
            case "invert":
                resultImage = ImageEditor.applyInvert(sourceImage);
                break;
            case "grayscale":
                resultImage = ImageEditor.applyGrayscale(sourceImage);
                break;
            case "motionblur":
                resultImage = ImageEditor.applyMotionBlur(sourceImage);
                break;
            default:
                throw new Error(`Unknown filter type: ${filterType}`);
        }

        console.log(`Filter applied successfully: ${filterType}`);
        ImageEditor.write(resultImage, keyImagePath);
    }

    static write(image: Image, filePath: string): void {
        const lines: string[] = ["P3"];
        lines.push(`${image.width} ${image.height}`);
        lines.push("255");

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const color = image.get(x, y);
                lines.push(`${color.red} ${color.green} ${color.blue}`);
            }
        }

        fs.writeFileSync(filePath, lines.join("\n"));
        console.log(`Image written to ${filePath}`);
    }

    static main(args: string[]): void {
        if (args.length !== 3) {
            console.log("Usage: ts-node imageeditor.ts <sourceImagePath> <keyImagePath> <filterType>");
            process.exit(1);
        }

        const [sourceImagePath, keyImagePath, filterType] = args;
        ImageEditor.run(sourceImagePath, keyImagePath, filterType);
    }
}

ImageEditor.main(process.argv.slice(2));
