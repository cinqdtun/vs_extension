import { minify } from 'html-minifier-terser';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const minifiedHtmlPlugin = {
	name: 'minify-html-plugin',
	setup(build) {
		build.onLoad({ filter: /\.html$/ }, async (args) => {
			const rawHtml = fs.readFileSync(args.path, 'utf8');

			const minifyHtml = await minify(rawHtml, {
				collapseWhitespace: true,
				removeComments: true,
				minifyJS: true,
				keepClosingSlash: true
			});

			const mediaDir = path.join(__dirname, 'media');
			const allFiles = fs.readdirSync(mediaDir, { recursive: true }); // Get all files in media folder
			const watchedCssFiles = allFiles
				.filter(file => file.endsWith('.css'))
				.map(file => path.join(mediaDir, file)); // List all css fiels in media folder

			// Return module as a function that return a string
			return {
				contents: `export default ${JSON.stringify(minifyHtml)};`,
				loader: 'js',
				watchFiles: watchedCssFiles
			};
		});
	}
};