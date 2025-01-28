import java.io.*;
import java.util.*;

public class ImageEditor {

	public static void main(String[] args) {
		new ImageEditor().run(args);
	}
	
	public ImageEditor() {
		return;
	}
	
	public void run(String[] args) {
		try {
			if (args.length < 3) {
				usage();
				return;
			}
			
			String inputFile = args[0];
			String outputFile = args[1];
			String filter = args[2];

			Image image = read(inputFile);
			
			if (filter.equals("grayscale") || filter.equals("greyscale")) {
				if (args.length != 3) {
					usage();
					return;
				}
				grayscale(image);
			}
			else if (filter.equals("invert")) {
				if (args.length != 3) {
					usage();
					return;
				}
				invert(image);
			}
			else if (filter.equals("emboss")) {
				if (args.length != 3) {
					usage();
					return;
				}
				emboss(image);
			}
			else if (filter.equals("motionblur")) {
				if (args.length != 4) {
					usage();
					return;
				}
				
				int length = -1;
				try {
					length = Integer.parseInt(args[3]);
				}
				catch (NumberFormatException e) {
					// Ignore
				}
				
				if (length < 0) {
					usage();
					return;
				}
				
				motionblur(image, length);
			}
			else {
				usage();
			}
			
			write(image, outputFile);			
		}
		catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	private void usage() {
		System.out.println("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}");
	}
	
	private void motionblur(Image image, int length) {
		if (length < 1) {
			return;
		}	
		for (int x = 0; x < image.getWidth(); ++x) {
			for (int y = 0; y < image.getHeight(); ++y) {
				Color curColor = image.get(x, y);
				
				int maxX = Math.min(image.getWidth() - 1, x + length - 1);
				for (int i = x + 1; i <= maxX; ++i) {
					Color tmpColor = image.get(i, y);
					curColor.red += tmpColor.red;
					curColor.green += tmpColor.green;
					curColor.blue += tmpColor.blue;
				}

				int delta = (maxX - x + 1);
				curColor.red /= delta;
				curColor.green /= delta;
				curColor.blue /= delta;
			}
		}
	}
	
	private void invert(Image image) {
		for (int x = 0; x < image.getWidth(); ++x) {
			for (int y = 0; y < image.getHeight(); ++y) {
				Color curColor = image.get(x, y);
	
				curColor.red = 255 - curColor.red;
				curColor.green = 255 - curColor.green;
				curColor.blue = 255 - curColor.blue;
			}
		}
	}
	
	private void grayscale(Image image) {
		for (int x = 0; x < image.getWidth(); ++x) {
			for (int y = 0; y < image.getHeight(); ++y) {
				Color curColor = image.get(x, y);
								
				int grayLevel = (curColor.red + curColor.green + curColor.blue) / 3;
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				
				curColor.red = grayLevel;
				curColor.green = grayLevel;
				curColor.blue = grayLevel;
			}
		}
	}
	
	private void emboss(Image image) {
		for (int x = image.getWidth() - 1; x >= 0; --x) {
			for (int y = image.getHeight() - 1; y >= 0; --y) {
				Color curColor = image.get(x, y);
				
				int diff = 0;
				if (x > 0 && y > 0) {
					Color upLeftColor = image.get(x - 1, y - 1);
					if (Math.abs(curColor.red - upLeftColor.red) > Math.abs(diff)) {
						diff = curColor.red - upLeftColor.red;
					}
					if (Math.abs(curColor.green - upLeftColor.green) > Math.abs(diff)) {
						diff = curColor.green - upLeftColor.green;
					}
					if (Math.abs(curColor.blue - upLeftColor.blue) > Math.abs(diff)) {
						diff = curColor.blue - upLeftColor.blue;
					}
				}
				
				int grayLevel = (128 + diff);
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				
				curColor.red = grayLevel;
				curColor.green = grayLevel;
				curColor.blue = grayLevel;
			}
		}
	}
	
	private Image read(String filePath) throws IOException {
		Image image = null;

		InputStream file = new BufferedInputStream(new FileInputStream(filePath));
		try {
			Scanner input = new Scanner(file);
			
			// Skip P3
			input.next();
			
			// Parse width and height
			int width = input.nextInt();
			int height = input.nextInt();
					
			image = new Image(width, height);

			// Skip max color value
			input.nextInt();
			
			for (int y = 0; y < height; ++y) {
				for (int x = 0; x < width; ++x) {
					Color color = new Color();
					color.red = input.nextInt();
					color.green = input.nextInt();
					color.blue = input.nextInt();
					image.set(x, y, color);
				}
			}
		}
		finally {
			file.close();
		}
		
		return image;		
	}
	
	private void write(Image image, String filePath) throws IOException {
		PrintWriter output = new PrintWriter(new BufferedWriter(new FileWriter(filePath)));
		try {
			output.println("P3");
			output.println(image.getWidth() + " " + image.getHeight());
			output.println("255");
			
			for (int y = 0; y < image.getHeight(); ++y) {
				for (int x = 0; x < image.getWidth(); ++x) {
					Color color = image.get(x, y);
					output.printf("%s%d %d %d", (x == 0 ? "" : " "), color.red, color.green, color.blue);
				}
				output.println();
			}
		}
		finally {
			output.close();
		}
	}
}


class Color {
	public int red;
	public int green;
	public int blue;
	
	public Color() {
		red = 0;
		green = 0;
		blue = 0;
	}
}


class Image {
	
	private Color[][] pixels;
	
	public Image(int width, int height) {
		pixels = new Color[width][height];
	}
	
	public int getWidth() {
		return pixels.length;
	}
	
	public int getHeight() {
		return pixels[0].length;
	}
	
	public void set(int x, int y, Color c) {
		pixels[x][y] = c;
	}
	
	public Color get(int x, int y) {
		return pixels[x][y];
	}
}
